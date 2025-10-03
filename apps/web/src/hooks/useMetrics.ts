import { useMemo } from 'react';
import { useSalesStore } from '../store/salesStore';
import { useCustomersStore } from '../store/customersStore';
import { useProductsStore } from '../store/productsStore';
import { useAccountsStore } from '../store/accountsStore';
import { useSuppliersStore } from '../store/suppliersStore';

/**
 * Hook centralizado para cálculos de métricas unificadas
 * Elimina la desincronización entre DashboardPage y ReportsPage
 * Reemplaza el polling manual y los acumuladores desactualizados
 */
export const useMetrics = (period?: string) => {
  const { sales } = useSalesStore();
  const { customers } = useCustomersStore();
  const { products } = useProductsStore();
  const { accounts, transactions } = useAccountsStore();
  const { suppliers } = useSuppliersStore();

  // Función para filtrar por período (opcional)
  const getDateRange = (period?: string) => {
    if (!period) return null; // Sin filtros = todos los datos

    const today = new Date();
    const startDate = new Date();

    switch (period) {
      case '7days':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(today.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(today.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        return null; // Período no reconocido = sin filtros
    }

    return { startDate, endDate: today };
  };

  return useMemo(() => {
    const safeSales = Array.isArray(sales) ? sales : [];
    const safeCustomers = Array.isArray(customers) ? customers : [];
    const safeProducts = Array.isArray(products) ? products : [];
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

    const dateRange = getDateRange(period);

    // Filtrar ventas por período si se especifica
    const filteredSales = dateRange
      ? safeSales.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
        })
      : safeSales;

    // Filtrar transacciones por período si se especifica
    const filteredTransactions = dateRange
      ? safeTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
        })
      : safeTransactions;

    // ✅ CÁLCULOS UNIFICADOS - Una sola fuente de verdad
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalTransactions = filteredSales.length;

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = totalSales - totalExpenses;
    const avgOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Cálculo de deudas de clientes (ventas pendientes/parciales)
    const clientDebts = safeSales
      .filter(sale => sale.paymentStatus === 'pending' || sale.paymentStatus === 'partial')
      .reduce((sum, sale) => sum + sale.amount, 0);

    // Total disponible (suma de balances de cuentas activas)
    const totalAvailable = safeAccounts
      .filter(account => account.active)
      .reduce((sum, account) => sum + account.balance, 0);

    // Deudas a proveedores (balances negativos)
    const supplierDebts = safeSuppliers
      .filter(supplier => supplier.active && supplier.currentBalance < 0)
      .reduce((sum, supplier) => sum + Math.abs(supplier.currentBalance), 0);

    // Contadores generales
    const accountsCount = safeAccounts.filter(account => account.active).length;
    const customersCount = safeCustomers.length;
    const activeCustomers = safeCustomers.filter(c => c.status === 'active').length;
    const activeProducts = safeProducts.filter(p => p.status === 'active').length;
    const lowStockProducts = safeProducts.filter(p => p.stock <= p.minStock && p.status === 'active');

    // Crecimiento de ventas (comparación con período anterior)
    const previousPeriodSales = dateRange ? safeSales.filter(sale => {
      const saleDate = new Date(sale.date);
      const prevStartDate = new Date(dateRange.startDate);
      const periodDiff = dateRange.endDate.getTime() - dateRange.startDate.getTime();
      prevStartDate.setTime(dateRange.startDate.getTime() - periodDiff);
      return saleDate >= prevStartDate && saleDate < dateRange.startDate;
    }) : [];

    const prevTotalSales = previousPeriodSales.reduce((sum, sale) => sum + sale.amount, 0);
    const salesGrowth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;

    // Crecimiento de ganancias
    const previousPeriodExpenses = dateRange ? safeTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const prevStartDate = new Date(dateRange.startDate);
      const periodDiff = dateRange.endDate.getTime() - dateRange.startDate.getTime();
      prevStartDate.setTime(dateRange.startDate.getTime() - periodDiff);
      return transactionDate >= prevStartDate && transactionDate < dateRange.startDate && t.type === 'expense';
    }) : [];

    const prevTotalExpenses = previousPeriodExpenses.reduce((sum, t) => sum + t.amount, 0);
    const prevProfit = prevTotalSales - prevTotalExpenses;
    const profitGrowth = prevProfit !== 0 ? ((profit - prevProfit) / Math.abs(prevProfit)) * 100 : (profit > 0 ? 100 : 0);

    // Crecimiento de valor promedio
    const prevAvgOrderValue = previousPeriodSales.length > 0 ? prevTotalSales / previousPeriodSales.length : 0;
    const avgOrderValueGrowth = prevAvgOrderValue > 0 ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 : 0;

    // Crecimiento de transacciones
    const transactionsGrowth = previousPeriodSales.length > 0
      ? ((totalTransactions - previousPeriodSales.length) / previousPeriodSales.length) * 100
      : (totalTransactions > 0 ? 100 : 0);

    // Crecimiento de ingresos (income transactions)
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousPeriodIncome = dateRange ? safeTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const prevStartDate = new Date(dateRange.startDate);
      const periodDiff = dateRange.endDate.getTime() - dateRange.startDate.getTime();
      prevStartDate.setTime(dateRange.startDate.getTime() - periodDiff);
      return transactionDate >= prevStartDate && transactionDate < dateRange.startDate && t.type === 'income';
    }) : [];

    const prevTotalIncome = previousPeriodIncome.reduce((sum, t) => sum + t.amount, 0);
    const incomeGrowth = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : (totalIncome > 0 ? 100 : 0);

    // Crecimiento de egresos
    const expensesGrowth = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : (totalExpenses > 0 ? 100 : 0);

    return {
      // Métricas principales para Dashboard
      totalAvailable,
      accountsCount,
      clientDebts,
      supplierDebts,

      // Métricas de ventas (compatibles con ReportsPage)
      totalSales,
      totalTransactions,
      totalExpenses,
      totalIncome,
      profit,
      avgOrderValue,
      salesGrowth,
      profitGrowth,
      avgOrderValueGrowth,
      transactionsGrowth,
      incomeGrowth,
      expensesGrowth,

      // Contadores generales
      customersCount,
      activeCustomers,
      activeProducts,
      lowStockProducts,

      // Datos filtrados para análisis detallado
      filteredSales,
      filteredTransactions,

      // Metadatos
      period: period || 'all',
      dateRange,
      lastUpdated: new Date().toISOString()
    };
  }, [
    period,
    sales,
    customers,
    products,
    accounts,
    transactions,
    suppliers
  ]);
};

export default useMetrics;