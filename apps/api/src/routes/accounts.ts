import { Router } from 'express';
import { z } from 'zod';
import { Currency } from '../types/index';
import { authenticate, AuthenticatedRequest, allRoles } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import { prisma } from '../server';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination';
import { createError } from '../middleware/errorHandler';

const router = Router();

const IdParamSchema = z.object({
  id: z.string().cuid(),
});

const CreateAccountSchema = z.object({
  name: z.string().min(2),
  type: z.string(),
  accountNumber: z.string().optional(),
  currency: z.nativeEnum(Currency).default(Currency.ARS),
});

const UpdateAccountSchema = CreateAccountSchema.partial();

const CreateMovementSchema = z.object({
  amount: z.number(),
  description: z.string().min(1),
  reference: z.string().optional(),
});

router.get('/', authenticate, allRoles, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
      search: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      type: z.string().optional(),
      currency: z.nativeEnum(Currency).optional(),
      active: z.string().transform((val) => val === 'true').optional(),
    }).parse(req.query);

    const { skip, take, search, sortBy, sortOrder } = getPaginationParams({
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    });

    const where = {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.currency ? { currency: filters.currency } : {}),
      ...(filters.active !== undefined ? { active: filters.active } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { accountNumber: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.account.count({ where }),
    ]);

    res.json({
      success: true,
      data: createPaginationResponse(
        accounts.map(account => ({
          ...account,
          currentBalance: Number(account.currentBalance),
        })),
        total,
        filters.page ?? 1,
        filters.limit ?? 10
      ),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, allRoles, validateParams(IdParamSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const account = await prisma.account.findUnique({
      where: { id: id! },
    });

    if (!account) {
      throw createError('Account not found', 404);
    }

    res.json({
      success: true,
      data: {
        account: {
          ...account,
          currentBalance: Number(account.currentBalance),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, allRoles, validate(CreateAccountSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const account = await prisma.account.create({
      data: req.body,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        resource: 'ACCOUNT',
        resourceId: account.id,
        newValues: req.body,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        account: {
          ...account,
          currentBalance: Number(account.currentBalance),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, allRoles, validateParams(IdParamSchema), validate(UpdateAccountSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const existingAccount = await prisma.account.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw createError('Account not found', 404);
    }

    const account = await prisma.account.update({
      where: { id },
      data: req.body,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        resource: 'ACCOUNT',
        resourceId: id,
        oldValues: existingAccount,
        newValues: req.body,
      },
    });

    res.json({
      success: true,
      data: {
        account: {
          ...account,
          currentBalance: Number(account.currentBalance),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/movements', authenticate, allRoles, validateParams(IdParamSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const filters = z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).parse(req.query);

    const { skip, take, page, limit } = getPaginationParams(filters);

    const where = {
      accountId: id,
      ...(filters.startDate || filters.endDate ? {
        date: {
          ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
          ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
        },
      } : {}),
    };

    const [movements, total] = await Promise.all([
      prisma.accountMovement.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      prisma.accountMovement.count({ where }),
    ]);

    res.json({
      success: true,
      data: createPaginationResponse(
        movements.map(movement => ({
          ...movement,
          amount: Number(movement.amount),
        })),
        total,
        page,
        limit
      ),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/movements', authenticate, allRoles, validateParams(IdParamSchema), validate(CreateMovementSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { amount, description, reference } = req.body;

    const account = await prisma.account.findUnique({
      where: { id: id! },
    });

    if (!account) {
      throw createError('Account not found', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.accountMovement.create({
        data: {
          accountId: id,
          amount,
          description,
          reference,
        },
      });

      await tx.account.update({
        where: { id },
        data: {
          currentBalance: {
            increment: amount,
          },
        },
      });

      return movement;
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        resource: 'ACCOUNT_MOVEMENT',
        resourceId: result.id,
        newValues: { accountId: id, ...req.body },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        movement: {
          ...result,
          amount: Number(result.amount),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as accountRoutes };