import { Router } from 'express';
import { z } from 'zod';
import { UserRole, UserStatus } from '../types/index';
import { authenticate, AuthenticatedRequest, managerOrAbove } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import { prisma } from '../server';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination';
import { createError } from '../middleware/errorHandler';
import { hashPassword } from '../utils/auth';

const router = Router();

const IdParamSchema = z.object({
  id: z.string().cuid(),
});

const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  branchId: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

router.get('/', authenticate, managerOrAbove, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
      search: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      role: z.nativeEnum(UserRole).optional(),
      status: z.nativeEnum(UserStatus).optional(),
      branchId: z.string().optional(),
    }).parse(req.query);

    const { skip, take, page, limit, search, sortBy, sortOrder } = getPaginationParams(filters);

    const where = {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          branchId: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: { name: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: createPaginationResponse(users, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, managerOrAbove, validateParams(IdParamSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: { id: true, name: true, address: true },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, managerOrAbove, validateParams(IdParamSchema), validate(UpdateUserSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Prevent users from modifying admins unless they are admin themselves
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!targetUser) {
      throw createError('User not found', 404);
    }

    if (targetUser.role === 'ADMIN' && currentUser.role !== 'ADMIN') {
      throw createError('Cannot modify admin users', 403);
    }

    // Prevent non-admins from setting admin role
    if (req.body.role === 'ADMIN' && currentUser.role !== 'ADMIN') {
      throw createError('Cannot assign admin role', 403);
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });

    const user = await prisma.user.update({
      where: { id },
      data: req.body,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: { name: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE',
        resource: 'USER',
        resourceId: id,
        oldValues: existingUser,
        newValues: req.body,
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

router.post('/:id/change-password', authenticate, validateParams(IdParamSchema), validate(ChangePasswordSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const requestingUserId = req.user!.id;
    const requestingUserRole = req.user!.role;

    // Users can only change their own password unless they are managers/admins
    if (id !== requestingUserId && !['ADMIN', 'MANAGER'].includes(requestingUserRole)) {
      throw createError('Can only change your own password', 403);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw createError('User not found', 404);
    }

    // If changing own password, verify current password
    if (id === requestingUserId) {
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw createError('Current password is incorrect', 400);
      }
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await prisma.auditLog.create({
      data: {
        userId: requestingUserId,
        action: 'UPDATE',
        resource: 'USER',
        resourceId: id,
        newValues: { passwordChanged: true },
      },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };