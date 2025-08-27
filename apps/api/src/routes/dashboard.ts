import { Router } from 'express';
import { authenticate, AuthenticatedRequest, allRoles } from '../middleware/auth';
import { prisma } from '../server';

const router = Router();

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get dashboard summary data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/summary', authenticate, allRoles, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const branchId = req.user!.branchId;

    // Get total available (sum of account balances)
    const accounts = await prisma.account.findMany({
      where: { active: true },
      select: { currentBalance: true, currency: true },
    });

    const totalAvailable = accounts
      .filter(acc => acc.currency === 'ARS')
      .reduce((sum, acc) => sum + Number(acc.currentBalance), 0);

    const accountsCount = accounts.length;

    // Get customer debts (sum of positive balances)
    const customerDebtResult = await prisma.customer.aggregate({
      _sum: { currentBalance: true },
      where: { currentBalance: { gt: 0 } },
    });
    const customerDebt = Number(customerDebtResult._sum.currentBalance || 0);

    // Get supplier debts (sum of positive balances)
    const supplierDebtResult = await prisma.supplier.aggregate({
      _sum: { currentBalance: true },
      where: { currentBalance: { gt: 0 } },
    });
    const supplierDebt = Number(supplierDebtResult._sum.currentBalance || 0);

    // Get pending tasks count
    const pendingTasksCount = await prisma.task.count({
      where: {
        status: 'PENDING',
        ...(userRole === 'SELLER' ? { userId } : {}),
      },
    });

    // Get sales data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await prisma.sale.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: thirtyDaysAgo },
        ...(branchId ? { branchId } : {}),
      },
      select: {
        total: true,
        currency: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group sales by date
    const salesByDate = salesData.reduce((acc, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(sale.total);
      return acc;
    }, {} as Record<string, number>);

    const salesLast30Days = Object.entries(salesByDate).map(([date, amount]) => ({
      date,
      amount,
    }));

    // Get current exchange rates (mock data)
    const exchangeRates = await prisma.exchangeRate.findMany({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });

    // Get pending tasks for onboarding
    const pendingTasks = await prisma.task.findMany({
      where: {
        status: 'PENDING',
        ...(userRole === 'SELLER' ? { userId } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        totalAvailable,
        accountsCount,
        customerDebt,
        supplierDebt,
        pendingTasks: pendingTasksCount,
        salesLast30Days,
        exchangeRates: exchangeRates.map(rate => ({
          currency: rate.currency,
          officialRate: Number(rate.officialRate),
          blueRate: rate.blueRate ? Number(rate.blueRate) : undefined,
          date: rate.date,
        })),
        taskList: pendingTasks,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/recent-activity', authenticate, allRoles, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const branchId = req.user!.branchId;

    // Get recent sales
    const recentSales = await prisma.sale.findMany({
      where: {
        ...(userRole === 'SELLER' ? { sellerId: userId } : {}),
        ...(branchId ? { branchId } : {}),
      },
      include: {
        customer: { select: { name: true } },
        seller: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get recent purchases
    const recentPurchases = await prisma.purchase.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
      },
      include: {
        supplier: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        recentSales: recentSales.map(sale => ({
          id: sale.id,
          number: sale.number,
          customer: sale.customer.name,
          seller: sale.seller.name,
          total: Number(sale.total),
          currency: sale.currency,
          status: sale.status,
          createdAt: sale.createdAt,
        })),
        recentPurchases: recentPurchases.map(purchase => ({
          id: purchase.id,
          number: purchase.number,
          supplier: purchase.supplier.name,
          total: Number(purchase.total),
          currency: purchase.currency,
          status: purchase.status,
          createdAt: purchase.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardRoutes };