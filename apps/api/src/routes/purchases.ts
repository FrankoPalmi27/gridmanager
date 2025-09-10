import { Router } from 'express';
import { z } from 'zod';
import { PurchaseStatus, Currency } from '../types';
import { authenticate, AuthenticatedRequest, allRoles } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import { prisma } from '../server';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination';
import { createError } from '../middleware/errorHandler';

const router = Router();

const IdParamSchema = z.object({
  id: z.string().cuid(),
});

const CreatePurchaseSchema = z.object({
  supplierId: z.string(),
  branchId: z.string(),
  currency: z.nativeEnum(Currency).default(Currency.ARS),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })),
});

const UpdatePurchaseStatusSchema = z.object({
  status: z.nativeEnum(PurchaseStatus),
});

router.get('/', authenticate, allRoles, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
      search: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      supplierId: z.string().optional(),
      branchId: z.string().optional(),
      status: z.nativeEnum(PurchaseStatus).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).parse(req.query);

    const { skip, take, page, limit, search, sortBy, sortOrder } = getPaginationParams(filters);
    const userBranchId = req.user!.branchId;

    const where = {
      ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(userBranchId ? { branchId: userBranchId } : {}),
      ...(filters.startDate || filters.endDate ? {
        createdAt: {
          ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
          ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
        },
      } : {}),
      ...(search ? {
        OR: [
          { number: { contains: search, mode: 'insensitive' as const } },
          { supplier: { name: { contains: search, mode: 'insensitive' as const } } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          supplier: {
            select: { name: true, email: true },
          },
          branch: {
            select: { name: true },
          },
          items: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({
      success: true,
      data: createPaginationResponse(
        purchases.map(purchase => ({
          id: purchase.id,
          number: purchase.number,
          supplier: purchase.supplier,
          branch: purchase.branch,
          status: purchase.status,
          subtotal: Number(purchase.subtotal),
          taxes: Number(purchase.taxes),
          total: Number(purchase.total),
          currency: purchase.currency,
          notes: purchase.notes,
          itemCount: purchase.items.length,
          createdAt: purchase.createdAt,
          updatedAt: purchase.updatedAt,
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

router.post('/', authenticate, allRoles, validate(CreatePurchaseSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { supplierId, branchId, currency = 'ARS', notes, items } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const purchaseCount = await tx.purchase.count();
      const number = `CPR-${String(purchaseCount + 1).padStart(6, '0')}`;

      let subtotal = 0;
      let taxes = 0;

      const purchaseItems = await Promise.all(
        items.map(async (item) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw createError(`Product ${item.productId} not found`, 404);
          }

          const itemSubtotal = item.unitPrice * item.quantity;
          const itemTax = itemSubtotal * (Number(product.taxRate) / 100);
          const itemTotal = itemSubtotal + itemTax;

          subtotal += itemSubtotal;
          taxes += itemTax;

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: itemTotal,
          };
        })
      );

      const total = subtotal + taxes;

      const purchase = await tx.purchase.create({
        data: {
          number,
          supplierId,
          branchId,
          status: 'DRAFT',
          subtotal,
          taxes,
          total,
          currency,
          notes,
          items: {
            create: purchaseItems,
          },
        },
        include: {
          supplier: true,
          branch: true,
          items: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
        },
      });

      return purchase;
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        resource: 'PURCHASE',
        resourceId: result.id,
        newValues: req.body,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        purchase: {
          ...result,
          subtotal: Number(result.subtotal),
          taxes: Number(result.taxes),
          total: Number(result.total),
          items: result.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authenticate, allRoles, validateParams(IdParamSchema), validate(UpdatePurchaseStatusSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingPurchase) {
      throw createError('Purchase not found', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.update({
        where: { id },
        data: { status },
      });

      if (status === 'RECEIVED' && existingPurchase.status !== 'RECEIVED') {
        for (const item of existingPurchase.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                increment: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              branchId: existingPurchase.branchId,
              type: 'IN',
              quantity: item.quantity,
              reference: purchase.number,
              notes: `Purchase received`,
            },
          });
        }

        await tx.supplier.update({
          where: { id: existingPurchase.supplierId },
          data: {
            currentBalance: {
              increment: Number(purchase.total),
            },
          },
        });
      }

      return purchase;
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        resource: 'PURCHASE',
        resourceId: id,
        oldValues: { status: existingPurchase.status },
        newValues: { status },
      },
    });

    res.json({
      success: true,
      data: { purchase: result },
    });
  } catch (error) {
    next(error);
  }
});

export { router as purchaseRoutes };