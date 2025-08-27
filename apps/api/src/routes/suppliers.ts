import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest, allRoles } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import { prisma } from '../server';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination';
import { createError } from '../middleware/errorHandler';

const router = Router();

const IdParamSchema = z.object({
  id: z.string().cuid(),
});

const CreateSupplierSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

const UpdateSupplierSchema = CreateSupplierSchema.partial();

const SupplierFiltersSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  active: z.string().transform((val) => val === 'true').optional(),
});

router.get('/', authenticate, allRoles, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = SupplierFiltersSchema.parse(req.query);
    const { skip, take, page, limit, search, sortBy, sortOrder } = getPaginationParams(filters);

    const where = {
      ...(filters.active !== undefined ? { active: filters.active } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
          { taxId: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      success: true,
      data: createPaginationResponse(
        suppliers.map(supplier => ({
          ...supplier,
          currentBalance: Number(supplier.currentBalance),
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

router.get('/:id', authenticate, allRoles, validateParams(IdParamSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw createError('Supplier not found', 404);
    }

    res.json({
      success: true,
      data: {
        supplier: {
          ...supplier,
          currentBalance: Number(supplier.currentBalance),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, allRoles, validate(CreateSupplierSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const supplier = await prisma.supplier.create({
      data: req.body,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        resource: 'SUPPLIER',
        resourceId: supplier.id,
        newValues: req.body,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        supplier: {
          ...supplier,
          currentBalance: Number(supplier.currentBalance),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, allRoles, validateParams(IdParamSchema), validate(UpdateSupplierSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      throw createError('Supplier not found', 404);
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: req.body,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        resource: 'SUPPLIER',
        resourceId: supplier.id,
        oldValues: existingSupplier,
        newValues: req.body,
      },
    });

    res.json({
      success: true,
      data: {
        supplier: {
          ...supplier,
          currentBalance: Number(supplier.currentBalance),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/account', authenticate, allRoles, validateParams(IdParamSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      select: { name: true, currentBalance: true },
    });

    if (!supplier) {
      throw createError('Supplier not found', 404);
    }

    const purchases = await prisma.purchase.findMany({
      where: { supplierId: id, status: 'RECEIVED' },
      select: {
        id: true,
        number: true,
        total: true,
        currency: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const payments = await prisma.payment.findMany({
      where: { supplierId: id },
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        date: true,
        purchase: {
          select: { number: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const movements = [
      ...purchases.map(purchase => ({
        id: purchase.id,
        type: 'PURCHASE' as const,
        reference: purchase.number,
        amount: Number(purchase.total),
        currency: purchase.currency,
        date: purchase.createdAt,
        balance: 0,
      })),
      ...payments.map(payment => ({
        id: payment.id,
        type: 'PAYMENT' as const,
        reference: payment.purchase?.number || 'Direct payment',
        amount: -Number(payment.amount),
        currency: payment.currency,
        date: payment.date,
        balance: 0,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    let runningBalance = Number(supplier.currentBalance);
    for (let i = 0; i < movements.length; i++) {
      movements[i].balance = runningBalance;
      runningBalance -= movements[i].amount;
    }

    res.json({
      success: true,
      data: {
        supplier: {
          name: supplier.name,
          currentBalance: Number(supplier.currentBalance),
        },
        movements,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as supplierRoutes };