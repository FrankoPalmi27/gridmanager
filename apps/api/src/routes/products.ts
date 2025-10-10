import { Router } from 'express';
import { z } from 'zod';
import { CreateProductSchema } from '../types/index';
import { authenticate, AuthenticatedRequest, allRoles } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import { prisma } from '../server';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination';
import { createError } from '../middleware/errorHandler';

const router = Router();

const IdParamSchema = z.object({
  id: z.string().cuid(),
});

const UpdateProductSchema = CreateProductSchema.partial();

const ProductFiltersSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  active: z.string().transform((val) => val === 'true').optional(),
  lowStock: z.string().transform((val) => val === 'true').optional(),
});

router.get('/', authenticate, allRoles, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = ProductFiltersSchema.parse(req.query);
    const { skip, take, page, limit, search, sortBy, sortOrder } = getPaginationParams(filters);

    const where = {
      tenantId: req.user!.tenantId,
      ...(filters.active !== undefined ? { active: filters.active } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.brand ? { brand: filters.brand } : {}),
      ...(filters.lowStock ? {
        OR: [
          { currentStock: { lte: { field: 'minStock' } } },
          { currentStock: { lt: 10 } },
        ],
      } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { brand: { contains: search, mode: 'insensitive' as const } },
          { category: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: createPaginationResponse(
        products.map(product => ({
          ...product,
          cost: Number(product.cost),
          basePrice: Number(product.basePrice),
          taxRate: Number(product.taxRate),
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

    const product = await prisma.product.findFirst({
      where: {
        id,
        tenantId: req.user!.tenantId,
      },
    });

    if (!product) {
      throw createError('Product not found', 404);
    }

    res.json({
      success: true,
      data: {
        product: {
          ...product,
          cost: Number(product.cost),
          basePrice: Number(product.basePrice),
          taxRate: Number(product.taxRate),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, allRoles, validate(CreateProductSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const product = await prisma.product.create({
      data: {
        ...req.body,
        tenantId: req.user!.tenantId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        resource: 'PRODUCT',
        resourceId: product.id,
        newValues: req.body,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        product: {
          ...product,
          cost: Number(product.cost),
          basePrice: Number(product.basePrice),
          taxRate: Number(product.taxRate),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, allRoles, validateParams(IdParamSchema), validate(UpdateProductSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        tenantId: req.user!.tenantId,
      },
    });

    if (!existingProduct) {
      throw createError('Product not found', 404);
    }

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        resource: 'PRODUCT',
        resourceId: product.id,
        oldValues: existingProduct,
        newValues: req.body,
      },
    });

    res.json({
      success: true,
      data: {
        product: {
          ...product,
          cost: Number(product.cost),
          basePrice: Number(product.basePrice),
          taxRate: Number(product.taxRate),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/stock-movements', authenticate, allRoles, validateParams(IdParamSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { name: true, sku: true, currentStock: true },
    });

    if (!product) {
      throw createError('Product not found', 404);
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId: id },
      include: {
        branch: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: {
        product,
        movements: movements.map(movement => ({
          id: movement.id,
          type: movement.type,
          quantity: movement.quantity,
          reference: movement.reference,
          notes: movement.notes,
          branch: movement.branch.name,
          date: movement.date,
          createdAt: movement.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/categories', authenticate, allRoles, async (req: AuthenticatedRequest, res, next) => {
  try {
    const categories = await prisma.product.findMany({
      where: {
        category: { not: null },
        active: true,
      },
      select: { category: true },
      distinct: ['category'],
    });

    res.json({
      success: true,
      data: {
        categories: categories
          .map(p => p.category)
          .filter(Boolean)
          .sort(),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/brands', authenticate, allRoles, async (req: AuthenticatedRequest, res, next) => {
  try {
    const brands = await prisma.product.findMany({
      where: {
        brand: { not: null },
        active: true,
      },
      select: { brand: true },
      distinct: ['brand'],
    });

    res.json({
      success: true,
      data: {
        brands: brands
          .map(p => p.brand)
          .filter(Boolean)
          .sort(),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, allRoles, validateParams(IdParamSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    // Verify product exists and belongs to tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        tenantId: req.user!.tenantId,
      },
    });

    if (!existingProduct) {
      throw createError('Product not found', 404);
    }

    // Check if product has been used in sales (optional - depends on business rules)
    // Uncomment if you want to prevent deletion of products with sales history
    /*
    const salesWithProduct = await prisma.saleItem.count({
      where: { productId: id },
    });

    if (salesWithProduct > 0) {
      throw createError(
        'Cannot delete product: it has been used in sales. Consider marking it as inactive instead.',
        400
      );
    }
    */

    // Delete product
    await prisma.product.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DELETE',
        resource: 'PRODUCT',
        resourceId: id,
        oldValues: existingProduct,
      },
    });

    res.json({
      success: true,
      data: {
        message: 'Product deleted successfully',
        product: {
          ...existingProduct,
          cost: Number(existingProduct.cost),
          basePrice: Number(existingProduct.basePrice),
          taxRate: Number(existingProduct.taxRate),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as productRoutes };