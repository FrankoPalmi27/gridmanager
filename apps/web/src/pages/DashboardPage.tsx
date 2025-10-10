import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSalesStore } from '../store/salesStore';
import { useProductsStore } from '../store/productsStore';
import { useCustomersStore } from '../store/customersStore';
import { useAccountsStore } from '../store/accountsStore';
import { useSuppliersStore } from '../store/suppliersStore';
import { useMetrics } from '../hooks/useMetrics';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { SalesForm } from '../components/forms/SalesForm';
import { ProductForm } from '../components/forms/ProductForm';
import { CustomerModal } from '../components/forms/CustomerModal';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatPercentage } from '../lib/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  DollarOutlined,
  TeamOutlined,
  AppstoreOutlined,
  CreditCardOutlined,
  BarChartOutlined,
  ShopOutlined,
  CalculatorOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseSaleDateToLocal = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const parts = value.split('T')[0]?.split('-');
  if (parts && parts.length >= 3) {
    const [year, month, day] = parts.map((part) => Number.parseInt(part, 10));
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return new Date(year, month - 1, day);
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return null;
};

const relativeTimeFromNow = (timestamp: number): string => {
  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' }
  ];

  let duration = diffSeconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      const formatter = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' });
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  const formatter = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' });
  return formatter.format(Math.round(duration), 'year');
};

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // ✅ SOLUCIÓN: Usar hook centralizado en lugar de estado local desincronizado
  const metrics = useMetrics(); // Sin período = datos globales

  const { sales, loadSales } = useSalesStore((state) => ({
    sales: state.sales,
    loadSales: state.loadSales
  }));

  const { products, loadProducts } = useProductsStore((state) => ({
    products: state.products,
    loadProducts: state.loadProducts
  }));

  const { customers, loadCustomers } = useCustomersStore((state) => ({
    customers: state.customers,
    loadCustomers: state.loadCustomers
  }));

  const { accounts, loadAccounts, loadTransactions } = useAccountsStore((state) => ({
    accounts: state.accounts,
    loadAccounts: state.loadAccounts,
    loadTransactions: state.loadTransactions
  }));

  const { suppliers, loadSuppliers } = useSuppliersStore((state) => ({
    suppliers: state.suppliers,
    loadSuppliers: state.loadSuppliers
  }));

  const { data: exchangeRate, status: exchangeStatus, refresh: refreshExchangeRate, error: exchangeError } = useExchangeRate();

  // Defensive: asegurar que las colecciones sean arreglos para evitar errores en filtros/map
  const safeSales = useMemo(() => (Array.isArray(sales) ? sales : []), [sales]);
  const safeProducts = useMemo(() => (Array.isArray(products) ? products : []), [products]);
  const safeCustomers = useMemo(() => (Array.isArray(customers) ? customers : []), [customers]);
  const safeAccounts = useMemo(() => (Array.isArray(accounts) ? accounts : []), [accounts]);
  const safeSuppliers = useMemo(() => (Array.isArray(suppliers) ? suppliers : []), [suppliers]);

  const bootstrappedRef = useRef(false);

  const bootstrapData = useCallback(() => {
    if (bootstrappedRef.current) {
      return;
    }

    bootstrappedRef.current = true;

    void Promise.allSettled([
      loadSales(),
      loadProducts(),
      loadCustomers(),
      loadAccounts(),
      loadTransactions(),
      loadSuppliers()
    ]);
  }, [loadAccounts, loadCustomers, loadProducts, loadSales, loadSuppliers, loadTransactions]);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }

    const hasData =
      safeSales.length > 0 ||
      safeProducts.length > 0 ||
      safeCustomers.length > 0 ||
      safeAccounts.length > 0 ||
      safeSuppliers.length > 0;

    if (!hasData) {
      bootstrapData();
    } else {
      bootstrappedRef.current = true;
    }
  }, [bootstrapData, safeAccounts.length, safeCustomers.length, safeProducts.length, safeSales.length, safeSuppliers.length]);

  const salesAggregatedByDate = useMemo(() => {
    const map = new Map<string, { facturado: number; cantidad: number; ventas: number }>();

    safeSales.forEach((sale) => {
      const parsedDate = parseSaleDateToLocal(sale.date);
      if (!parsedDate) {
        return;
      }

      const key = formatDateKey(parsedDate);
      const current = map.get(key) ?? { facturado: 0, cantidad: 0, ventas: 0 };

      current.facturado += Number.isFinite(sale.amount) ? sale.amount : 0;
      current.cantidad += Number.isFinite(sale.items) ? sale.items : 0;
      current.ventas += 1;

      map.set(key, current);
    });

    return map;
  }, [safeSales]);

  // Generate sales evolution data
  const salesEvolutionData = useMemo(() => {
    const days: Array<{ date: string; facturado: number; cantidad: number; ventas: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let index = 0; index < 30; index += 1) {
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() - (29 - index));
      const key = formatDateKey(currentDay);
      const aggregate = salesAggregatedByDate.get(key) ?? { facturado: 0, cantidad: 0, ventas: 0 };

      days.push({
        date: currentDay.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }),
        facturado: aggregate.facturado,
        cantidad: aggregate.cantidad,
        ventas: aggregate.ventas
      });
    }

    return days;
  }, [salesAggregatedByDate]);

  // ✅ Get low stock products usando métricas centralizadas
  const lowStockProducts = metrics.lowStockProducts;
  const outOfStockProducts = safeProducts.filter(p => p.stock === 0 && p.status === 'active');

  const handleModuleClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  // ✅ Enhanced stats usando métricas centralizadas - se actualiza automáticamente
  const enhancedStats = useMemo(() => {
    const normalizeChange = (value?: number) => {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return undefined;
      }
      if (!Number.isFinite(value)) {
        return value > 0 ? 100 : value < 0 ? -100 : 0;
      }
      return value;
    };

    return [
      {
        name: 'Total Disponible',
        value: formatCurrency(metrics.totalAvailable),
        rawValue: metrics.totalAvailable,
        icon: '💰',
        color: metrics.totalAvailable >= 0 ? 'text-green-600' : 'text-red-600',
        bgColor: metrics.totalAvailable >= 0 ? 'bg-green-50' : 'bg-red-50',
        borderColor: metrics.totalAvailable >= 0 ? 'border-green-200' : 'border-red-200',
        change: normalizeChange(metrics.incomeGrowth),
        description: 'Total en cuentas activas',
        navigateTo: 'accounts' as const
      },
      {
        name: 'Cuentas',
        value: metrics.accountsCount.toString(),
        rawValue: metrics.accountsCount,
        icon: '💳',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        change: normalizeChange(metrics.transactionsGrowth),
        description: 'Cuentas registradas',
        navigateTo: 'accounts' as const
      },
      {
        name: 'Deudas Clientes',
        value: formatCurrency(metrics.clientDebts),
        rawValue: metrics.clientDebts,
        icon: '👥',
        color: metrics.clientDebts > 0 ? 'text-orange-600' : 'text-green-600',
        bgColor: metrics.clientDebts > 0 ? 'bg-orange-50' : 'bg-green-50',
        borderColor: metrics.clientDebts > 0 ? 'border-orange-200' : 'border-green-200',
        change: normalizeChange(metrics.salesGrowth),
        description: 'Pagos pendientes',
        navigateTo: 'customers' as const
      },
      {
        name: 'Deudas Proveedores',
        value: formatCurrency(metrics.supplierDebts),
        rawValue: metrics.supplierDebts,
        icon: '🏢',
        color: metrics.supplierDebts > 0 ? 'text-red-600' : 'text-green-600',
        bgColor: metrics.supplierDebts > 0 ? 'bg-red-50' : 'bg-green-50',
        borderColor: metrics.supplierDebts > 0 ? 'border-red-200' : 'border-green-200',
        change: normalizeChange(metrics.expensesGrowth),
        description: 'Pagos a proveedores',
        navigateTo: 'suppliers' as const
      }
    ];
  }, [metrics]);

  const recentActivityItems = useMemo(() => {
    type ActivityItem = {
      id: string;
      title: string;
      description: string;
      timestamp: number;
      accentClass: string;
    };

    const events: ActivityItem[] = [];

    safeSales.forEach((sale) => {
      const saleDate = parseSaleDateToLocal(sale.date);
      const timestamp = saleDate ? saleDate.getTime() : Date.now();
      events.push({
        id: `sale-${sale.id}`,
        title: 'Nueva venta registrada',
        description: `${sale.client?.name ?? 'Cliente'} · ${formatCurrency(sale.amount ?? 0)}`,
        timestamp,
        accentClass: 'bg-green-500'
      });
    });

    safeCustomers.forEach((customer) => {
      const createdAt = customer?.createdAt ? new Date(customer.createdAt) : null;
      const timestamp = createdAt && !Number.isNaN(createdAt.getTime())
        ? createdAt.getTime()
        : Date.now();
      events.push({
        id: `customer-${customer.id}`,
        title: 'Nuevo cliente',
        description: customer.name,
        timestamp,
        accentClass: 'bg-blue-500'
      });
    });

    lowStockProducts.slice(0, 5).forEach((product, index) => {
      events.push({
        id: `stock-${product.id}`,
        title: 'Stock bajo detectado',
        description: `${product.name} · ${product.stock} unidades`,
        timestamp: Date.now() - index * 1000,
        accentClass: 'bg-orange-500'
      });
    });

    return events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6);
  }, [lowStockProducts, safeCustomers, safeSales]);

  const exchangeRateMetadata = useMemo(() => {
    if (!exchangeRate) {
      return null;
    }

    const updatedAt = new Date(exchangeRate.fetchedAt);
    if (Number.isNaN(updatedAt.getTime())) {
      return null;
    }

    return {
      date: updatedAt.toLocaleDateString('es-AR'),
      time: updatedAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };
  }, [exchangeRate]);

  const isExchangeLoading = exchangeStatus === 'loading';

  const moduleCards = [
    {
      name: 'Ventas',
      description: 'Gestionar ventas y facturación',
      icon: <DollarOutlined className="w-5 h-5" />,
      path: 'sales',
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Clientes',
      description: 'Administrar clientes',
      icon: <TeamOutlined className="w-5 h-5" />,
      path: 'customers',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Productos',
      description: 'Control de inventario',
      icon: <AppstoreOutlined className="w-5 h-5" />,
      path: 'products',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Cuentas',
      description: 'Gestión financiera',
      icon: <CreditCardOutlined className="w-5 h-5" />,
      path: 'accounts',
      color: 'bg-amber-100 text-amber-600'
    },
    {
      name: 'Reportes',
      description: 'Análisis y estadísticas',
      icon: <BarChartOutlined className="w-5 h-5" />,
      path: 'reports',
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      name: 'Proveedores',
      description: 'Gestión de proveedores',
      icon: <ShopOutlined className="w-5 h-5" />,
      path: 'suppliers',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      name: 'Calculadora ML',
      description: 'Calculadora MercadoLibre',
      icon: <CalculatorOutlined className="w-5 h-5" />,
      path: 'calculator',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Panel de Control</h1>
          <p className="text-sm sm:text-base text-gray-600">Resumen de tu negocio en tiempo real</p>
        </div>

        {/* Exchange Rate - Moved to top */}
        {(exchangeRate || isExchangeLoading) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-2xl border border-blue-200 shadow-sm mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {exchangeRate?.isFallback ? '💵 Tipo de Cambio (datos de respaldo)' : '💵 Tipo de Cambio USD - Banco Nación'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {exchangeRateMetadata
                    ? `Actualizado: ${exchangeRateMetadata.date} a las ${exchangeRateMetadata.time}`
                    : isExchangeLoading
                      ? 'Actualizando cotización...'
                      : 'Sin datos disponibles'}
                </p>
                {exchangeRate?.isFallback && (
                  <p className="text-xs text-orange-600">
                    Mostrando valores de respaldo. Reintenta la actualización cuando tengas conexión.
                  </p>
                )}
                {exchangeError && (
                  <p className="text-xs text-red-600">
                    No se pudo actualizar: {exchangeError.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
                <div className="flex gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600">Compra</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {exchangeRate ? `$${exchangeRate.compra.toFixed(2)}` : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600">Venta</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {exchangeRate ? `$${exchangeRate.venta.toFixed(2)}` : '—'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  loading={isExchangeLoading}
                  onClick={() => {
                    void refreshExchangeRate();
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Actualizar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards - Responsive Fixed Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 sm:mb-8">
          {enhancedStats.map((stat) => {
            const isNavigable = Boolean(stat.navigateTo);
            const cursorStyle = isNavigable
              ? 'cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : '';
            const onCardClick = isNavigable
              ? () => stat.navigateTo && handleModuleClick(stat.navigateTo)
              : undefined;

            const hasChange = typeof stat.change === 'number' && !Number.isNaN(stat.change);
            const isPositive = hasChange && stat.change! > 0;
            const isNegative = hasChange && stat.change! < 0;
            const trendClass = isPositive
              ? 'bg-green-100 text-green-800'
              : isNegative
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-600';
            const trendIcon = isPositive ? '↗' : isNegative ? '↘' : '→';
            const trendValue = hasChange ? formatPercentage(Math.abs(stat.change!), 1) : null;

            return (
              <div
                key={stat.name}
                className={`bg-white p-4 lg:p-6 rounded-2xl border-2 ${stat.borderColor} shadow-sm hover:shadow-md transition-all ${cursorStyle} min-w-0`}
                onClick={onCardClick}
              >
                <div className="flex items-start justify-between mb-3 lg:mb-4">
                  <div className={`p-2 lg:p-3 rounded-xl ${stat.bgColor} flex-shrink-0`}>
                    <span className="text-xl lg:text-2xl">{stat.icon}</span>
                  </div>
                  {hasChange && trendValue && (
                    <div className="text-right flex-shrink-0">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendClass}`}>
                        {trendIcon} {trendValue}
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-1 truncate">{stat.name}</p>
                  <p className={`text-2xl lg:text-3xl font-bold ${stat.color} mb-1 truncate`} title={stat.value}>{stat.value}</p>
                  <p className="text-xs text-gray-500 truncate">{stat.description}</p>
                </div>
              </div>
            );
          })}
        </div>


        {/* Stock Alerts - Moved Higher */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="bg-white p-6 rounded-2xl border border-orange-200 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ExclamationCircleOutlined className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-800">⚠️ Alerta de Stock</h3>
                  <p className="text-sm text-orange-600">Productos que requieren atención inmediata</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleModuleClick('products')}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Ver Productos
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outOfStockProducts.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">🚨 Sin Stock ({outOfStockProducts.length})</h4>
                  <div className="space-y-2">
                    {outOfStockProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="flex justify-between items-center">
                        <span className="text-sm text-red-700">{product.name}</span>
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">0 stock</span>
                      </div>
                    ))}
                    {outOfStockProducts.length > 3 && (
                      <p className="text-xs text-red-600">+{outOfStockProducts.length - 3} más...</p>
                    )}
                  </div>
                </div>
              )}
              {lowStockProducts.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="text-sm font-semibold text-amber-800 mb-2">⚠️ Stock Bajo ({lowStockProducts.length})</h4>
                  <div className="space-y-2">
                    {lowStockProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="flex justify-between items-center">
                        <span className="text-sm text-amber-700">{product.name}</span>
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">{product.stock} stock</span>
                      </div>
                    ))}
                    {lowStockProducts.length > 3 && (
                      <p className="text-xs text-amber-600">+{lowStockProducts.length - 3} más...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">⚡ Acciones Rápidas</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Button
              onClick={() => setShowNewSaleModal(true)}
              variant="outline"
              className="flex flex-col items-center p-3 sm:p-4 h-auto bg-green-50 hover:bg-green-100 border-green-200 text-gray-700 touch-target"
            >
              <span className="text-xl sm:text-2xl mb-1 sm:mb-2">💰</span>
              <span className="text-xs sm:text-sm font-medium">Nueva Venta</span>
            </Button>
            <Button 
              onClick={() => setShowNewCustomerModal(true)}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto bg-blue-50 hover:bg-blue-100 border-blue-200 text-gray-700"
            >
              <span className="text-2xl mb-2">👤</span>
              <span className="text-sm font-medium">Nuevo Cliente</span>
            </Button>
            <Button 
              onClick={() => setShowNewProductModal(true)}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto bg-purple-50 hover:bg-purple-100 border-purple-200 text-gray-700"
            >
              <span className="text-2xl mb-2">📦</span>
              <span className="text-sm font-medium">Nuevo Producto</span>
            </Button>
            <Button 
              onClick={() => handleModuleClick('reports')}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto bg-orange-50 hover:bg-orange-100 border-orange-200 text-gray-700"
            >
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm font-medium">Ver Reportes</span>
            </Button>
          </div>
        </div>

        {/* Sales Evolution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Sales by Amount Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">📈 Evolución de Ventas por Facturado</h3>
              <p className="text-xs sm:text-sm text-gray-500">Últimos 30 días - Total facturado por día</p>
            </div>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Facturado']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="facturado" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Quantity Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📊 Evolución de Ventas por Cantidad</h3>
              <p className="text-sm text-gray-500">Últimos 30 días - Productos vendidos por día</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Productos vendidos']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cantidad" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Module Cards - Smaller and at the bottom */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">🏢 Módulos del Sistema</h2>
            <p className="text-sm text-gray-500">Acceso rápido a todas las funcionalidades</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {moduleCards.map((module) => (
              <button
                key={module.name}
                onClick={() => handleModuleClick(module.path)}
                className="group p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-center"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 transition-colors ${module.color}`}>
                  {module.icon}
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-gray-700">
                  {module.name}
                </h3>
                <p className="text-xs text-gray-500 group-hover:text-gray-600">
                  {module.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity - Dinamica basada en datos reales */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm order-last lg:order-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📊 Actividad Reciente</h3>
            <span className="text-sm text-gray-500">Últimas 24h</span>
          </div>
          <div className="space-y-4">
            {/* ✅ MOSTRAR ACTIVIDAD REAL O ESTADO VACIO */}
            {recentActivityItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-sm text-gray-500">No hay actividad reciente</p>
                <p className="text-xs text-gray-400 mt-1">La actividad aparecerá aquí cuando comiences a usar el sistema</p>
              </div>
            ) : (
              recentActivityItems.map((item) => (
                <div key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mr-3 ${item.accentClass}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{relativeTimeFromNow(item.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Forms */}
      <SalesForm 
        isOpen={showNewSaleModal}
        onClose={() => setShowNewSaleModal(false)}
      />
      
      <ProductForm 
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        editingProduct={null}
      />
      
      <CustomerModal 
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
      />
      
    </div>
  );
}