import React, { useState, useMemo } from 'react';

// Utility function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};

// Date utility functions
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('es-AR');
};

const getDateRange = (period: string) => {
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
      startDate.setDate(today.getDate() - 30);
  }
  
  return { startDate, endDate: today };
};

// Mock data for reports
const mockSalesData = [
  { id: '1', date: '2024-01-20', amount: 45000, client: 'Juan Pérez', products: 3, seller: 'Ana García' },
  { id: '2', date: '2024-01-19', amount: 25000, client: 'María López', products: 2, seller: 'Carlos Ruiz' },
  { id: '3', date: '2024-01-18', amount: 67500, client: 'Pedro Martín', products: 5, seller: 'Laura Gómez' },
  { id: '4', date: '2024-01-17', amount: 32000, client: 'Ana Martínez', products: 1, seller: 'Miguel Torres' },
  { id: '5', date: '2024-01-16', amount: 18500, client: 'Roberto Silva', products: 2, seller: 'Ana García' },
  { id: '6', date: '2024-01-15', amount: 89000, client: 'Carmen Díaz', products: 7, seller: 'Carlos Ruiz' },
  { id: '7', date: '2024-01-14', amount: 12000, client: 'Luis Herrera', products: 1, seller: 'Laura Gómez' },
  { id: '8', date: '2024-01-13', amount: 54000, client: 'Patricia Vega', products: 4, seller: 'Ana García' },
  { id: '9', date: '2024-01-12', amount: 76000, client: 'Fernando Castro', products: 6, seller: 'Miguel Torres' },
  { id: '10', date: '2024-01-11', amount: 23000, client: 'Isabel Moreno', products: 2, seller: 'Carlos Ruiz' }
];

const mockExpensesData = [
  { id: '1', date: '2024-01-20', amount: 15000, category: 'Proveedores', description: 'TechDistributor SA' },
  { id: '2', date: '2024-01-19', amount: 8500, category: 'Servicios', description: 'Internet y telefonía' },
  { id: '3', date: '2024-01-18', amount: 12000, category: 'Gastos Operativos', description: 'Gastos de oficina' },
  { id: '4', date: '2024-01-17', amount: 22000, category: 'Proveedores', description: 'Logística Express' },
  { id: '5', date: '2024-01-16', amount: 5000, category: 'Servicios', description: 'Mantenimiento equipos' },
  { id: '6', date: '2024-01-15', amount: 18000, category: 'Impuestos', description: 'AFIP - IVA' },
  { id: '7', date: '2024-01-14', amount: 7500, category: 'Gastos Operativos', description: 'Combustible' },
  { id: '8', date: '2024-01-13', amount: 25000, category: 'Proveedores', description: 'Servicios IT Pro' }
];

const mockCustomersData = [
  { id: '1', name: 'Juan Pérez', totalPurchases: 125000, lastPurchase: '2024-01-20', purchaseCount: 8 },
  { id: '2', name: 'María López', totalPurchases: 89000, lastPurchase: '2024-01-19', purchaseCount: 6 },
  { id: '3', name: 'Pedro Martín', totalPurchases: 245000, lastPurchase: '2024-01-18', purchaseCount: 12 },
  { id: '4', name: 'Ana Martínez', totalPurchases: 156000, lastPurchase: '2024-01-17', purchaseCount: 9 },
  { id: '5', name: 'Roberto Silva', totalPurchases: 87000, lastPurchase: '2024-01-16', purchaseCount: 5 }
];

const mockProductsData = [
  { id: '1', name: 'Laptop HP EliteBook', category: 'Electrónicos', stock: 15, sales: 45, revenue: 3825000 },
  { id: '2', name: 'Mouse Logitech', category: 'Accesorios', stock: 50, sales: 120, revenue: 420000 },
  { id: '3', name: 'Teclado RGB', category: 'Accesorios', stock: 25, sales: 78, revenue: 936000 },
  { id: '4', name: 'Monitor 24"', category: 'Electrónicos', stock: 8, sales: 32, revenue: 1440000 },
  { id: '5', name: 'Auriculares Sony', category: 'Audio', stock: 12, sales: 28, revenue: 784000 }
];

// Simple Chart Component (Bar Chart)
const BarChart = ({ data, title, color = 'bg-blue-600' }: { 
  data: { label: string; value: number }[];
  title: string;
  color?: string;
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-xs text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div
                className={`h-4 rounded-full ${color} transition-all duration-500`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
              <span className="absolute right-2 top-0 text-xs text-white font-medium leading-4">
                {typeof item.value === 'number' && item.value > 1000 
                  ? formatCurrency(item.value)
                  : item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Line Chart Component (Simple)
const LineChart = ({ data, title }: { 
  data: { date: string; value: number }[];
  title: string;
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (d.value / maxValue) * 80
  }));

  const pathData = points.map((p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ');

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-48 relative">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>
          <path
            d={`${pathData} L 100 100 L 0 100 Z`}
            fill="url(#gradient)"
          />
          <path
            d={pathData}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="0.5"
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
          {data.map((d, i) => (
            <span key={i} className="transform -rotate-45 origin-top-left">
              {formatDate(d.date)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon, color = 'text-blue-600' }: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color?: string;
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">
          {typeof value === 'number' ? formatCurrency(value) : value}
        </p>
        {change && (
          <div className="flex items-center text-xs mt-2">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              change.startsWith('+') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {change}%
            </span>
            <span className="ml-2 text-gray-500">vs período anterior</span>
          </div>
        )}
      </div>
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
        <span className={`text-lg ${color}`}>{icon}</span>
      </div>
    </div>
  </div>
);

// Report Table Component
const ReportTable = ({ title, headers, data }: {
  title: string;
  headers: string[];
  data: any[];
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              {Object.values(row).map((cell: any, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {typeof cell === 'number' && cell > 1000 ? formatCurrency(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');

  const periodOptions = [
    { value: '7days', label: 'Últimos 7 días' },
    { value: '30days', label: 'Últimos 30 días' },
    { value: '90days', label: 'Últimos 90 días' },
    { value: '1year', label: 'Último año' }
  ];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: 'sales', label: 'Ventas', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg> },
    { id: 'financial', label: 'Financiero', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
    { id: 'customers', label: 'Clientes', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg> },
    { id: 'inventory', label: 'Inventario', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> }
  ];

  // Calculate metrics based on selected period
  const metrics = useMemo(() => {
    const { startDate, endDate } = getDateRange(selectedPeriod);
    
    const filteredSales = mockSalesData.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const filteredExpenses = mockExpensesData.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const profit = totalSales - totalExpenses;
    const avgOrderValue = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

    return {
      totalSales,
      totalExpenses,
      profit,
      avgOrderValue,
      salesCount: filteredSales.length,
      filteredSales,
      filteredExpenses
    };
  }, [selectedPeriod]);

  // Prepare chart data
  const salesByDay = mockSalesData.slice(-7).map(sale => ({
    date: sale.date,
    value: sale.amount
  }));

  const topProducts = mockProductsData
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(product => ({
      label: product.name,
      value: product.revenue
    }));

  const salesByPerson = mockSalesData
    .reduce((acc: any[], sale) => {
      const existing = acc.find(item => item.label === sale.seller);
      if (existing) {
        existing.value += sale.amount;
      } else {
        acc.push({ label: sale.seller, value: sale.amount });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Ventas Totales"
                value={metrics.totalSales}
                change="+15.2"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                color="text-green-600"
              />
              <MetricCard
                title="Gastos Totales"
                value={metrics.totalExpenses}
                change="+8.7"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                color="text-red-600"
              />
              <MetricCard
                title="Ganancia Neta"
                value={metrics.profit}
                change="+22.1"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                color="text-blue-600"
              />
              <MetricCard
                title="Valor Promedio"
                value={metrics.avgOrderValue}
                change="-2.3"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                color="text-purple-600"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChart data={salesByDay} title="Ventas por Día" />
              <BarChart data={topProducts.slice(0, 5)} title="Productos Top" color="bg-green-600" />
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Ventas del Período"
                value={metrics.salesCount}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5H3m4 8l-2-2m0 0l2-2m-2 2h12m-6 4a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" /></svg>}
              />
              <MetricCard
                title="Ingresos Totales"
                value={metrics.totalSales}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
              />
              <MetricCard
                title="Ticket Promedio"
                value={metrics.avgOrderValue}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart data={salesByPerson} title="Ventas por Vendedor" color="bg-blue-600" />
              <BarChart data={topProducts} title="Productos Más Vendidos" color="bg-green-600" />
            </div>

            <ReportTable
              title="Detalle de Ventas"
              headers={['Fecha', 'Cliente', 'Vendedor', 'Productos', 'Monto']}
              data={metrics.filteredSales.map(sale => ({
                fecha: formatDate(sale.date),
                cliente: sale.client,
                vendedor: sale.seller,
                productos: sale.products,
                monto: sale.amount
              }))}
            />
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Ingresos"
                value={metrics.totalSales}
                change="+15.2"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                color="text-green-600"
              />
              <MetricCard
                title="Egresos"
                value={metrics.totalExpenses}
                change="+8.7"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                color="text-red-600"
              />
              <MetricCard
                title="Margen"
                value={`${((metrics.profit / metrics.totalSales) * 100).toFixed(1)}%`}
                change="+5.8"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                color="text-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado Financiero</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Ingresos por Ventas</span>
                    <span className="font-semibold text-green-600">+{formatCurrency(metrics.totalSales)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Gastos Operativos</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(metrics.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-gray-200">
                    <span>Ganancia Neta</span>
                    <span className={metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.profit >= 0 ? '+' : ''}{formatCurrency(metrics.profit)}
                    </span>
                  </div>
                </div>
              </div>

              <ReportTable
                title="Gastos por Categoría"
                headers={['Categoría', 'Descripción', 'Fecha', 'Monto']}
                data={metrics.filteredExpenses.map(expense => ({
                  categoria: expense.category,
                  descripcion: expense.description,
                  fecha: formatDate(expense.date),
                  monto: expense.amount
                }))}
              />
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Clientes"
                value={mockCustomersData.length.toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>}
              />
              <MetricCard
                title="Cliente Promedio"
                value={mockCustomersData.reduce((sum, c) => sum + c.totalPurchases, 0) / mockCustomersData.length}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
              />
              <MetricCard
                title="Compras Promedio"
                value={(mockCustomersData.reduce((sum, c) => sum + c.purchaseCount, 0) / mockCustomersData.length).toFixed(1)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5H3m4 8l-2-2m0 0l2-2m-2 2h12m-6 4a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" /></svg>}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart 
                data={mockCustomersData.map(c => ({ label: c.name, value: c.totalPurchases }))}
                title="Clientes por Facturación"
                color="bg-purple-600"
              />
              <BarChart 
                data={mockCustomersData.map(c => ({ label: c.name, value: c.purchaseCount }))}
                title="Clientes por Frecuencia"
                color="bg-indigo-600"
              />
            </div>

            <ReportTable
              title="Análisis de Clientes"
              headers={['Cliente', 'Total Compras', 'Cantidad Órdenes', 'Última Compra', 'Promedio por Orden']}
              data={mockCustomersData.map(customer => ({
                cliente: customer.name,
                total: customer.totalPurchases,
                ordenes: customer.purchaseCount,
                ultima: formatDate(customer.lastPurchase),
                promedio: customer.totalPurchases / customer.purchaseCount
              }))}
            />
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Total Productos"
                value={mockProductsData.length.toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              />
              <MetricCard
                title="Stock Total"
                value={mockProductsData.reduce((sum, p) => sum + p.stock, 0).toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              />
              <MetricCard
                title="Ventas Totales"
                value={mockProductsData.reduce((sum, p) => sum + p.sales, 0).toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5H3m4 8l-2-2m0 0l2-2m-2 2h12m-6 4a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" /></svg>}
              />
              <MetricCard
                title="Ingresos"
                value={mockProductsData.reduce((sum, p) => sum + p.revenue, 0)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart 
                data={mockProductsData.map(p => ({ label: p.name, value: p.revenue }))}
                title="Ingresos por Producto"
                color="bg-green-600"
              />
              <BarChart 
                data={mockProductsData.map(p => ({ label: p.name, value: p.sales }))}
                title="Unidades Vendidas"
                color="bg-blue-600"
              />
            </div>

            <ReportTable
              title="Análisis de Inventario"
              headers={['Producto', 'Categoría', 'Stock', 'Vendidos', 'Ingresos', 'Rotación']}
              data={mockProductsData.map(product => ({
                producto: product.name,
                categoria: product.category,
                stock: product.stock,
                vendidos: product.sales,
                ingresos: product.revenue,
                rotacion: `${((product.sales / (product.stock + product.sales)) * 100).toFixed(1)}%`
              }))}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Informes y Análisis</h1>
          <p className="text-sm text-gray-500">Análisis completo del rendimiento de tu negocio</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Datos desde: {formatDate(getDateRange(selectedPeriod).startDate)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">
                    {typeof tab.icon === 'string' ? tab.icon : tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Export Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Exportar Informes</h3>
              <p className="text-sm text-gray-500">Descarga los datos para análisis externo</p>
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Exportar CSV
              </button>
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar PDF
              </button>
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Enviar por Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}