import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest, analystOrAbove } from '../middleware/auth';
import { prisma } from '../server';
import { createError } from '../middleware/errorHandler';

const router = Router();

const DateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  branchId: z.string().optional(),
});

// Sales report
router.get('/sales', authenticate, analystOrAbove, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = DateRangeSchema.parse(req.query);
    const userBranchId = req.user!.branchId;

    const where = {
      status: 'CONFIRMED' as const,
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      ...(userBranchId ? { branchId: userBranchId } : {}),
      ...(filters.startDate || filters.endDate ? {
        createdAt: {
          ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
          ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
        },
      } : {}),
    };

    const [sales, summary] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          seller: { select: { name: true } },
          branch: { select: { name: true } },
          items: {
            include: {
              product: { select: { name: true, category: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.aggregate({
        where,
        _sum: { total: true, subtotal: true, taxes: true },
        _count: { id: true },
      }),
    ]);

    // Group by date for chart
    const salesByDate = sales.reduce((acc, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, amount: 0, count: 0 };
      }
      acc[date].amount += Number(sale.total);
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; amount: number; count: number }>);

    // Top products
    const productSales = sales.flatMap(sale => 
      sale.items.map(item => ({
        productName: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        total: Number(item.total),
      }))
    );

    const topProducts = Object.values(
      productSales.reduce((acc, item) => {
        if (!acc[item.productName]) {
          acc[item.productName] = {
            name: item.productName,
            category: item.category,
            quantity: 0,
            total: 0,
          };
        }
        acc[item.productName].quantity += item.quantity;
        acc[item.productName].total += item.total;
        return acc;
      }, {} as Record<string, any>)
    ).sort((a, b) => b.total - a.total).slice(0, 10);

    res.json({
      success: true,
      data: {
        summary: {
          totalSales: Number(summary._sum.total || 0),
          totalSubtotal: Number(summary._sum.subtotal || 0),
          totalTaxes: Number(summary._sum.taxes || 0),
          salesCount: summary._count.id,
        },
        chartData: Object.values(salesByDate),
        topProducts,
        sales: sales.map(sale => ({
          id: sale.id,
          number: sale.number,
          customer: sale.customer.name,
          seller: sale.seller.name,
          branch: sale.branch.name,
          total: Number(sale.total),
          currency: sale.currency,
          createdAt: sale.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Customer account report
router.get('/customer-accounts', authenticate, analystOrAbove, async (req: AuthenticatedRequest, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        email: true,
        currentBalance: true,
        creditLimit: true,
        sales: {
          where: { status: 'CONFIRMED' },
          select: { total: true, createdAt: true },
        },
        collections: {
          select: { amount: true, date: true },
        },
      },
      orderBy: { currentBalance: 'desc' },
    });

    const customerAccounts = customers.map(customer => {
      const totalSales = customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const totalCollections = customer.collections.reduce((sum, collection) => sum + Number(collection.amount), 0);
      const lastSale = customer.sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      const lastPayment = customer.collections.sort((a, b) => b.date.getTime() - a.date.getTime())[0];

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        currentBalance: Number(customer.currentBalance),
        creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
        totalSales,
        totalCollections,
        lastSaleDate: lastSale?.createdAt,
        lastPaymentDate: lastPayment?.date,
        status: Number(customer.currentBalance) > 0 ? 'DEBTOR' : 'PAID',
      };
    });

    const summary = {
      totalDebt: customerAccounts.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0),
      totalCredit: customerAccounts.reduce((sum, c) => sum + Math.abs(Math.min(0, c.currentBalance)), 0),
      debtorsCount: customerAccounts.filter(c => c.currentBalance > 0).length,
      totalCustomers: customerAccounts.length,
    };

    res.json({
      success: true,
      data: { summary, customerAccounts },
    });
  } catch (error) {
    next(error);
  }
});

// Stock report
router.get('/stock', authenticate, analystOrAbove, async (req: AuthenticatedRequest, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        stockMovements: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });

    const stockReport = products.map(product => {
      const stockValue = Number(product.cost) * product.currentStock;
      const isLowStock = product.currentStock <= product.minStock;
      const lastMovement = product.stockMovements[0];

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        brand: product.brand,
        currentStock: product.currentStock,
        minStock: product.minStock,
        cost: Number(product.cost),
        stockValue,
        isLowStock,
        lastMovement: lastMovement ? {
          type: lastMovement.type,
          quantity: lastMovement.quantity,
          date: lastMovement.date,
        } : null,
      };
    });

    const summary = {
      totalProducts: products.length,
      totalStockValue: stockReport.reduce((sum, p) => sum + p.stockValue, 0),
      lowStockCount: stockReport.filter(p => p.isLowStock).length,
      categoriesCount: new Set(products.map(p => p.category).filter(Boolean)).size,
    };

    res.json({
      success: true,
      data: {
        summary,
        stockReport: stockReport.sort((a, b) => b.stockValue - a.stockValue),
        lowStockProducts: stockReport.filter(p => p.isLowStock),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Financial report
router.get('/financial', authenticate, analystOrAbove, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = DateRangeSchema.parse(req.query);

    const dateFilter = filters.startDate || filters.endDate ? {
      date: {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      },
    } : {};

    const [incomes, expenses, accounts] = await Promise.all([
      prisma.income.findMany({
        where: dateFilter,
        orderBy: { date: 'desc' },
      }),
      prisma.expense.findMany({
        where: dateFilter,
        orderBy: { date: 'desc' },
      }),
      prisma.account.findMany({
        where: { active: true },
      }),
    ]);

    const totalIncomes = incomes.reduce((sum, income) => sum + Number(income.amount), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.currentBalance), 0);

    // Group by category
    const incomesByCategory = incomes.reduce((acc, income) => {
      const category = income.category || 'Otros';
      if (!acc[category]) acc[category] = 0;
      acc[category] += Number(income.amount);
      return acc;
    }, {} as Record<string, number>);

    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Otros';
      if (!acc[category]) acc[category] = 0;
      acc[category] += Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        summary: {
          totalIncomes,
          totalExpenses,
          netResult: totalIncomes - totalExpenses,
          totalBalance,
        },
        incomesByCategory: Object.entries(incomesByCategory).map(([category, amount]) => ({ category, amount })),
        expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({ category, amount })),
        recentIncomes: incomes.slice(0, 10).map(income => ({
          ...income,
          amount: Number(income.amount),
        })),
        recentExpenses: expenses.slice(0, 10).map(expense => ({
          ...expense,
          amount: Number(expense.amount),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as reportRoutes };