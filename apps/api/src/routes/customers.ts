import { Router } from 'express';
import { z } from 'zod';
import { CreateCustomerSchema } from '@grid-manager/types';
import { authenticate, AuthenticatedRequest, allRoles } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import { prisma } from '../server';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination';
import { createError } from '../middleware/errorHandler';

const router = Router();

const IdParamSchema = z.object({
  id: z.string().cuid(),
});

const UpdateCustomerSchema = CreateCustomerSchema.partial();

const CustomerFiltersSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  active: z.string().transform((val) => val === 'true').optional(),
});

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 */
router.get('/', authenticate, allRoles, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = CustomerFiltersSchema.parse(req.query);
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

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          taxId: true,
          birthday: true,
          creditLimit: true,
          currentBalance: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: createPaginationResponse(
        customers.map(customer => ({
          ...customer,
          creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
          currentBalance: Number(customer.currentBalance),
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

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', authenticate, allRoles, validateParams(IdParamSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        taxId: true,
        birthday: true,
        creditLimit: true,
        currentBalance: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      throw createError('Customer not found', 404);
    }

    res.json({
      success: true,
      data: {
        customer: {
          ...customer,
          creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
          currentBalance: Number(customer.currentBalance),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               taxId:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date-time
 *               creditLimit:
 *                 type: number
 */
router.post('/', authenticate, allRoles, validate(CreateCustomerSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, email, phone, address, taxId, birthday, creditLimit } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        taxId,
        birthday: birthday ? new Date(birthday) : null,
        creditLimit,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        taxId: true,
        birthday: true,
        creditLimit: true,
        currentBalance: true,
        active: true,
        createdAt: true,
      },
    });

    // Log customer creation
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE',
        resource: 'CUSTOMER',
        resourceId: customer.id,
        newValues: req.body,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        customer: {
          ...customer,
          creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
          currentBalance: Number(customer.currentBalance),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', authenticate, allRoles, validateParams(IdParamSchema), validate(UpdateCustomerSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw createError('Customer not found', 404);
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...updateData,
        birthday: updateData.birthday ? new Date(updateData.birthday) : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        taxId: true,
        birthday: true,
        creditLimit: true,
        currentBalance: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log customer update
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE',
        resource: 'CUSTOMER',
        resourceId: customer.id,
        oldValues: existingCustomer,
        newValues: updateData,
      },
    });

    res.json({
      success: true,
      data: {
        customer: {
          ...customer,
          creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
          currentBalance: Number(customer.currentBalance),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /customers/{id}/account:
 *   get:
 *     summary: Get customer account statement
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id/account', authenticate, allRoles, validateParams(IdParamSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { name: true, currentBalance: true },
    });

    if (!customer) {
      throw createError('Customer not found', 404);
    }

    // Get sales (debits to customer account)
    const sales = await prisma.sale.findMany({
      where: { customerId: id, status: 'CONFIRMED' },
      select: {
        id: true,
        number: true,
        total: true,
        currency: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get collections (credits to customer account)
    const collections = await prisma.collection.findMany({
      where: { customerId: id },
      select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        date: true,
        sale: {
          select: { number: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Combine and sort by date
    const movements = [
      ...sales.map(sale => ({
        id: sale.id,
        type: 'SALE' as const,
        reference: sale.number,
        amount: Number(sale.total),
        currency: sale.currency,
        date: sale.createdAt,
        balance: 0, // Will be calculated below
      })),
      ...collections.map(collection => ({
        id: collection.id,
        type: 'COLLECTION' as const,
        reference: collection.sale?.number || 'Direct payment',
        amount: -Number(collection.amount), // Negative because it reduces customer debt
        currency: collection.currency,
        date: collection.date,
        balance: 0, // Will be calculated below
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calculate running balance
    let runningBalance = Number(customer.currentBalance);
    for (let i = 0; i < movements.length; i++) {
      movements[i].balance = runningBalance;
      runningBalance -= movements[i].amount;
    }

    res.json({
      success: true,
      data: {
        customer: {
          name: customer.name,
          currentBalance: Number(customer.currentBalance),
        },
        movements,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as customerRoutes };