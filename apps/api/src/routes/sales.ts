import { Router } from 'express';
import { z } from 'zod';
import { CreateSaleSchema, SaleStatus } from '@grid-manager/types';
import { authenticate, AuthenticatedRequest, allRoles } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import { prisma } from '../server';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination';
import { createError } from '../middleware/errorHandler';

const router = Router();

const IdParamSchema = z.object({
  id: z.string().cuid(),
});

const SaleFiltersSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  customerId: z.string().optional(),
  sellerId: z.string().optional(),
  branchId: z.string().optional(),
  status: z.nativeEnum(SaleStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

router.get('/', authenticate, allRoles, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = SaleFiltersSchema.parse(req.query);
    const { skip, take, page, limit, search, sortBy, sortOrder } = getPaginationParams(filters);
    const userRole = req.user!.role;
    const userId = req.user!.id;
    const userBranchId = req.user!.branchId;

    const where = {
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.sellerId ? { sellerId: filters.sellerId } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(userRole === 'SELLER' ? { sellerId: userId } : {}),
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
          { customer: { name: { contains: search, mode: 'insensitive' as const } } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: { name: true, email: true },
          },
          seller: {
            select: { name: true },
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
      prisma.sale.count({ where }),
    ]);

    res.json({
      success: true,
      data: createPaginationResponse(
        sales.map(sale => ({
          id: sale.id,
          number: sale.number,
          customer: sale.customer,
          seller: sale.seller,
          branch: sale.branch,
          status: sale.status,
          subtotal: Number(sale.subtotal),
          taxes: Number(sale.taxes),
          total: Number(sale.total),
          currency: sale.currency,
          notes: sale.notes,
          itemCount: sale.items.length,
          createdAt: sale.createdAt,
          updatedAt: sale.updatedAt,
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
    const userRole = req.user!.role;
    const userId = req.user!.id;

    const where = {
      id,
      ...(userRole === 'SELLER' ? { sellerId: userId } : {}),
    };

    const sale = await prisma.sale.findFirst({
      where,
      include: {
        customer: true,
        seller: {
          select: { name: true, email: true },
        },
        branch: true,
        items: {
          include: {
            product: true,
          },
        },
        collections: {
          include: {
            account: {
              select: { name: true },
            },
          },
        },
        shipments: true,
      },
    });

    if (!sale) {
      throw createError('Sale not found', 404);
    }

    res.json({
      success: true,
      data: {
        sale: {
          ...sale,
          subtotal: Number(sale.subtotal),
          taxes: Number(sale.taxes),
          total: Number(sale.total),
          items: sale.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
            product: {
              ...item.product,
              cost: Number(item.product.cost),
              basePrice: Number(item.product.basePrice),
              taxRate: Number(item.product.taxRate),
            },
          })),
          collections: sale.collections.map(collection => ({
            ...collection,
            amount: Number(collection.amount),
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, allRoles, validate(CreateSaleSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, branchId, currency = 'ARS', notes, items } = req.body;
    const sellerId = req.user!.id;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate sale number
      const saleCount = await tx.sale.count();
      const number = `VTA-${String(saleCount + 1).padStart(6, '0')}`;

      // Calculate totals
      let subtotal = 0;
      let taxes = 0;

      const saleItems = await Promise.all(
        items.map(async (item) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw createError(`Product ${item.productId} not found`, 404);
          }

          if (product.currentStock < item.quantity) {
            throw createError(`Insufficient stock for product ${product.name}`, 400);
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

      // Create sale
      const sale = await tx.sale.create({
        data: {
          number,
          customerId,
          sellerId,
          branchId,
          status: 'DRAFT',
          subtotal,
          taxes,
          total,
          currency,
          notes,
          items: {
            create: saleItems,
          },
        },
        include: {
          customer: true,
          seller: {
            select: { name: true },
          },
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

      return sale;
    });

    // Log sale creation
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        resource: 'SALE',
        resourceId: result.id,
        newValues: req.body,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        sale: {
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

const UpdateSaleStatusSchema = z.object({
  status: z.nativeEnum(SaleStatus),
});

router.patch('/:id/status', authenticate, allRoles, validateParams(IdParamSchema), validate(UpdateSaleStatusSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const existingSale = await prisma.sale.findFirst({
      where: {
        id,
        ...(userRole === 'SELLER' ? { sellerId: userId } : {}),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingSale) {
      throw createError('Sale not found', 404);
    }

    if (existingSale.status === status) {
      throw createError(`Sale is already ${status}`, 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update sale status
      const sale = await tx.sale.update({
        where: { id },
        data: { status },
      });

      // Handle stock movements based on status
      if (status === 'CONFIRMED' && existingSale.status !== 'CONFIRMED') {
        // Decrease stock and update customer balance
        for (const item of existingSale.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          // Create stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              branchId: existingSale.branchId,
              type: 'OUT',
              quantity: -item.quantity,
              reference: sale.number,
              notes: `Sale confirmation`,
            },
          });
        }

        // Update customer balance
        await tx.customer.update({
          where: { id: existingSale.customerId },
          data: {
            currentBalance: {
              increment: Number(sale.total),
            },
          },
        });
      } else if (status === 'CANCELLED' && existingSale.status === 'CONFIRMED') {
        // Restore stock and update customer balance
        for (const item of existingSale.items) {
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
              branchId: existingSale.branchId,
              type: 'IN',
              quantity: item.quantity,
              reference: sale.number,
              notes: `Sale cancellation`,
            },
          });
        }

        await tx.customer.update({
          where: { id: existingSale.customerId },
          data: {
            currentBalance: {
              decrement: Number(sale.total),
            },
          },
        });
      }

      return sale;
    });

    // Log status change
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        resource: 'SALE',
        resourceId: id,
        oldValues: { status: existingSale.status },
        newValues: { status },
      },
    });

    res.json({
      success: true,
      data: { sale: result },
    });
  } catch (error) {
    next(error);
  }
});

export { router as saleRoutes };