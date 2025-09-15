import { Router } from 'express';
import { prisma } from '../server';
import { hashPassword, generateTokens } from '../utils/auth';
import { createError } from '../middleware/errorHandler';
import { tenantAdminMiddleware, TenantRequest } from '../middleware/tenant';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /tenant/register:
 *   post:
 *     summary: Public tenant registration
 *     tags: [Tenant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - ownerName
 *               - email
 *             properties:
 *               companyName:
 *                 type: string
 *                 description: Company/business name
 *               ownerName:
 *                 type: string
 *                 description: Owner full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Business email
 *               phone:
 *                 type: string
 *               industry:
 *                 type: string
 *               employeeCount:
 *                 type: string
 *                 enum: ['1-5', '6-20', '21-50', '51-200', '200+']
 */
router.post('/register', async (req, res, next) => {
  try {
    const { companyName, ownerName, email, phone, industry, employeeCount } = req.body;

    // Validation
    if (!companyName || !ownerName || !email) {
      throw createError('Nombre de empresa, nombre del propietario y email son requeridos', 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw createError('Ya existe una cuenta con este email', 409);
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { email }
    });

    if (existingTenant) {
      throw createError('Ya existe una empresa registrada con este email', 409);
    }

    // Generate unique slug
    let baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    let slug = baseSlug;
    let counter = 1;

    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Set trial end date (14 days from now)
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 14);

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug,
        email,
        phone,
        plan: 'TRIAL',
        status: 'TRIAL',
        trialEnds,
        settings: {
          branding: {
            logo: '',
            primaryColor: '#10b981',
            secondaryColor: '#3b82f6',
            companyName
          }
        },
        limits: {
          maxUsers: 3,
          maxProducts: 100,
          maxSalesPerMonth: 500,
          storageGB: 1
        },
        features: {
          analytics: true,
          multiCurrency: false,
          api: false,
          customReports: false
        }
      }
    });

    // Generate temporary password
    const tempPassword = Math.random().toString(36).substring(2, 12);
    const hashedPassword = await hashPassword(tempPassword);

    // Create admin user for the tenant
    const adminUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: ownerName,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    // Create default branch
    await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Sucursal Principal',
        address: 'Dirección por definir',
        phone: phone || '',
        email: email,
        active: true
      }
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: 'TRIAL',
        status: 'trialing',
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnds,
        amount: 0,
        currency: 'ARS'
      }
    });

    // Store registration info for analytics
    await prisma.tenantRegistration.create({
      data: {
        companyName,
        ownerName,
        email,
        phone,
        industry,
        employeeCount,
        status: 'APPROVED'
      }
    });

    // Initial usage metrics
    await prisma.usageMetric.createMany({
      data: [
        {
          tenantId: tenant.id,
          metric: 'users_count',
          value: 1,
          date: new Date()
        },
        {
          tenantId: tenant.id,
          metric: 'products_count',
          value: 0,
          date: new Date()
        },
        {
          tenantId: tenant.id,
          metric: 'sales_count',
          value: 0,
          date: new Date()
        }
      ]
    });

    // TODO: Send welcome email with login credentials
    // await sendWelcomeEmail(email, slug, tempPassword);

    res.status(201).json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          trialEnds: tenant.trialEnds
        },
        user: {
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        },
        tempPassword, // In production, this should be sent via email
        loginUrl: `/auth/login?tenant=${slug}`
      },
      message: `¡Bienvenido a Grid Manager! Tu empresa "${companyName}" ha sido creada exitosamente.`
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tenant/login:
 *   post:
 *     summary: Tenant-specific login
 *     tags: [Tenant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - tenantSlug
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               tenantSlug:
 *                 type: string
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, tenantSlug } = req.body;

    if (!email || !password || !tenantSlug) {
      throw createError('Email, contraseña y empresa son requeridos', 400);
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant || tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
      throw createError('Empresa no encontrada o inactiva', 401);
    }

    // Find user within tenant
    const user = await prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant.id,
        status: 'ACTIVE'
      },
      include: {
        branch: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      throw createError('Credenciales inválidas', 401);
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw createError('Credenciales inválidas', 401);
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Log login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resource: 'USER',
        resourceId: user.id,
        newValues: { tenantSlug }
      }
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
          branch: user.branch
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          status: tenant.status,
          trialEnds: tenant.trialEnds,
          settings: tenant.settings
        },
        tokens
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tenant/info/{slug}:
 *   get:
 *     summary: Get public tenant information
 *     tags: [Tenant]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/info/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        settings: true
      }
    });

    if (!tenant || tenant.status === 'CANCELLED') {
      throw createError('Empresa no encontrada', 404);
    }

    res.json({
      success: true,
      data: {
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
        branding: tenant.settings?.branding || {
          logo: '',
          primaryColor: '#10b981',
          secondaryColor: '#3b82f6',
          companyName: tenant.name
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tenant/admin/list:
 *   get:
 *     summary: List all tenants (admin only)
 *     tags: [Tenant Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/list', authenticate, tenantAdminMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        plan: true,
        status: true,
        trialEnds: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            products: true,
            sales: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { tenants }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /tenant/admin/{id}/usage:
 *   get:
 *     summary: Get tenant usage metrics (admin only)
 *     tags: [Tenant Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/:id/usage', authenticate, tenantAdminMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        usageMetrics: {
          orderBy: { date: 'desc' },
          take: 30
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!tenant) {
      throw createError('Tenant no encontrado', 404);
    }

    res.json({
      success: true,
      data: { tenant }
    });

  } catch (error) {
    next(error);
  }
});

export { router as tenantRoutes };