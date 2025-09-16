import { Router } from 'express';
import { LoginSchema, RegisterSchema } from '../types/index';
import { validate } from '../middleware/validation';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../server';
import { generateTokens, verifyRefreshToken, hashPassword, comparePassword } from '../utils/auth';
import { createError } from '../middleware/errorHandler';
import passport from '../config/passport';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 */
router.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw createError('Invalid credentials', 401);
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401);
    }

    const tokens = generateTokens(user.id);

    // Log login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resource: 'USER',
        resourceId: user.id,
      },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branchId: user.branchId,
          branch: user.branch,
        },
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User registration
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, ANALYST, SELLER]
 *               branchId:
 *                 type: string
 */
router.post('/register', validate(RegisterSchema), authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    // Only admins and managers can create users
    if (!['ADMIN', 'MANAGER'].includes(req.user!.role)) {
      throw createError('Insufficient permissions', 403);
    }

    const { email, name, password, role = 'SELLER', branchId } = req.body;

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        branchId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        branchId: true,
        createdAt: true,
      },
    });

    // Log user creation
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        resource: 'USER',
        resourceId: user.id,
        newValues: { email, name, role, branchId },
      },
    });

    res.status(201).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token required', 400);
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw createError('Invalid or inactive user', 401);
    }

    const tokens = generateTokens(user.id);

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        branchId: true,
        createdAt: true,
        branch: {
          select: { id: true, name: true, address: true },
        },
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    // Log logout
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'LOGOUT',
        resource: 'USER',
        resourceId: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/register-tenant:
 *   post:
 *     summary: Register new tenant (public registration)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               tenantName:
 *                 type: string
 *             required:
 *               - email
 *               - name
 *               - password
 *               - tenantName
 */
router.post('/register-tenant', async (req, res, next) => {
  try {
    const { email, name, password, tenantName } = req.body;

    if (!email || !name || !password || !tenantName) {
      throw createError('All fields are required', 400);
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

    const hashedPassword = await hashPassword(password);

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create slug from tenant name (remove spaces, special chars, make lowercase)
      const slug = tenantName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      // Ensure slug is unique by adding number if needed
      let uniqueSlug = slug;
      let counter = 1;
      while (await tx.tenant.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: uniqueSlug,
          email: email,
          status: 'TRIAL',
          plan: 'TRIAL',
          trialEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
        }
      });

      // Create default branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Principal',
          address: '',
          phone: '',
          status: 'ACTIVE'
        }
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          name,
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          branchId: branch.id
        }
      });

      return { user, tenant, branch };
    });

    // Generate tokens
    const tokens = generateTokens(result.user.id);

    res.status(201).json({
      success: true,
      data: {
        tokens,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          tenant: {
            id: result.tenant.id,
            name: result.tenant.name,
            slug: result.tenant.slug,
            plan: result.tenant.plan,
            status: result.tenant.status,
            trialEnds: result.tenant.trialEnds
          },
          branch: {
            id: result.branch.id,
            name: result.branch.name
          }
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// Google OAuth routes - Only register if Google is configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  /**
   * @swagger
   * /auth/google:
   *   get:
   *     summary: Initiate Google OAuth
   *     tags: [Auth]
   *     description: Redirects to Google for authentication
   */
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     description: Handles Google OAuth callback
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CORS_ORIGIN}/login?error=google_auth_failed` }),
  async (req, res, next) => {
    try {
      const user = req.user as any;

      if (user.isNewUser) {
        // For new Google users, redirect to a registration completion page
        const params = new URLSearchParams({
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          avatar: user.avatar || '',
          provider: 'google'
        });

        return res.redirect(`${process.env.CORS_ORIGIN}/complete-registration?${params.toString()}`);
      }

      // For existing users, generate tokens and redirect to dashboard
      const tokens = generateTokens(user.id);

      // Redirect to frontend with tokens in URL (they'll be extracted and stored)
      const params = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          tenant: user.tenant
        })
      });

      res.redirect(`${process.env.CORS_ORIGIN}/auth/callback?${params.toString()}`);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /auth/google/complete:
 *   post:
 *     summary: Complete Google user registration
 *     tags: [Auth]
 *     description: Complete registration for new Google users by creating tenant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - googleId
 *               - email
 *               - name
 *               - tenantName
 *             properties:
 *               googleId:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *               tenantName:
 *                 type: string
 */
router.post('/google/complete', async (req, res, next) => {
  try {
    const { googleId, email, name, avatar, tenantName } = req.body;

    if (!googleId || !email || !name || !tenantName) {
      throw createError('Missing required fields', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      }
    });

    if (existingUser) {
      throw createError('User already exists', 400);
    }

    // Create tenant and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          email: email,
          plan: 'TRIAL',
          status: 'TRIAL'
        }
      });

      // Create default branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Principal',
          address: '',
          phone: '',
          email: email,
          isMain: true
        }
      });

      // Create user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          email,
          name,
          googleId,
          avatar,
          provider: 'google',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });

      return { user, tenant, branch };
    });

    // Generate tokens
    const tokens = generateTokens(result.user.id);

    res.json({
      success: true,
      data: {
        tokens,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          avatar: result.user.avatar,
          tenant: result.tenant
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

} else {
  // Return error message if Google OAuth routes are accessed but not configured
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Google OAuth not configured on server'
    });
  });

  router.get('/google/callback', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Google OAuth not configured on server'
    });
  });

  router.post('/google/complete', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Google OAuth not configured on server'
    });
  });
}

export { router as authRoutes };