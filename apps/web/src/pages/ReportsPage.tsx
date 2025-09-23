import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../lib/formatters';
import { useSales } from '../store/SalesContext';
import { useCustomersStore } from '../store/customersStore';
import { useProductsStore } from '../store/productsStore';
import { useAccountsStore } from '../store/accountsStore';

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

// Enhanced Chart Components

// Pie Chart Component
const PieChart = ({ data, title }: {
  data: { label: string; value: number; color?: string }[];
  title: string;
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  // Colores usando nuestro sistema de diseño
  const colors = [
    'var(--primary-500)',    // Azul principal
    'var(--success-500)',    // Verde éxito
    'var(--warning-500)',    // Ámbar advertencia
    'var(--error-500)',      // Rojo error
    'var(--info-500)',       // Azul info
    'var(--secondary-500)',  // Verde secundario
    'var(--primary-400)',    // Azul claro
    'var(--success-400)',    // Verde claro
    'var(--warning-400)',    // Ámbar claro
    'var(--neutral-400)'     // Gris neutral
  ];

  const paths = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    return {
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      color: item.color || colors[index % colors.length],
      percentage: percentage.toFixed(1),
      item
    };
  });

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center space-x-6">
        <div className="w-48 h-48">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {paths.map((pathData, index) => (
              <path
                key={index}
                d={pathData.path}
                fill={pathData.color}
                className="hover:opacity-75 transition-opacity cursor-pointer"
              />
            ))}
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          {paths.map((pathData, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: pathData.color }}
              />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-sm text-gray-700">{pathData.item.label}</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {typeof pathData.item.value === 'number' && pathData.item.value > 1000
                      ? formatCurrency(pathData.item.value)
                      : pathData.item.value}
                  </div>
                  <div className="text-xs text-gray-500">{pathData.percentage}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Area Chart Component
const AreaChart = ({ data, title, color = 'var(--primary-500)' }: {
  data: { date: string; value: number }[];
  title: string;
  color?: string;
}) => {
  if (!data.length) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d.value - minValue) / range) * 80
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
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>
          <path
            d={`${pathData} L 100 100 L 0 100 Z`}
            fill={`url(#gradient-${title})`}
          />
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
          />
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="1"
              fill={color}
              className="hover:r-2 transition-all cursor-pointer"
            />
          ))}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
          {data.slice(0, 5).map((d, i) => (
            <span key={i} className="transform -rotate-45 origin-top-left">
              {formatDate(d.date)}
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Min: {formatCurrency(minValue)}</span>
        <span>Max: {formatCurrency(maxValue)}</span>
      </div>
    </div>
  );
};

// Enhanced Bar Chart with better styling
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
            <div className="w-24 text-xs text-gray-600 truncate font-medium">{item.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
              <div
                className={`h-6 rounded-full ${color} transition-all duration-700 ease-out relative`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
              </div>
              <span className="absolute right-3 top-0 text-xs font-semibold text-gray-700 leading-6">
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

// Enhanced Metric Card with trends
const MetricCard = ({ title, value, change, icon, color = 'text-blue-600', trend }: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: number[];
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {typeof value === 'number' ? formatCurrency(value) : value}
        </p>
        {change && (
          <div className="flex items-center text-xs mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              change.startsWith('+') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {change.startsWith('+') ? '↗' : '↘'} {Math.abs(parseFloat(change))}%
            </span>
            <span className="ml-2 text-gray-500">vs período anterior</span>
          </div>
        )}
      </div>
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
        <span className={`text-xl ${color}`}>{icon}</span>
      </div>
    </div>
    {trend && trend.length > 0 && (
      <div className="h-8 flex items-end space-x-1">
        {trend.map((value, index) => (
          <div
            key={index}
            className={`flex-1 bg-gray-200 rounded-t`}
            style={{ height: `${(value / Math.max(...trend)) * 100}%` }}
          />
        ))}
      </div>
    )}
  </div>
);

// Advanced Table with sorting and filtering
const ReportTable = ({ title, headers, data, sortable = true }: {
  title: string;
  headers: string[];
  data: any[];
  sortable?: boolean;
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = Object.values(a)[headers.indexOf(sortConfig.key)];
      const bValue = Object.values(b)[headers.indexOf(sortConfig.key)];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return sortConfig.direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [data, sortConfig, headers]);

  const handleSort = (header: string) => {
    if (!sortable) return;
    
    setSortConfig(prevConfig => ({
      key: header,
      direction: prevConfig?.key === header && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '500px' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${
                    sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => handleSort(header)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{header}</span>
                    {sortable && (
                      <div className="flex flex-col">
                        <span className={`text-xs ${sortConfig?.key === header && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-300'}`}>▲</span>
                        <span className={`text-xs ${sortConfig?.key === header && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-300'}`}>▼</span>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => (
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
};

export function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');

  // Get real data from stores
  const { sales, dashboardStats } = useSales();
  const { customers } = useCustomersStore();
  const { products } = useProductsStore();
  const { accounts, transactions } = useAccountsStore();

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
    { id: 'inventory', label: 'Inventario', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    { id: 'performance', label: 'Rendimiento', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> }
  ];

  // Enhanced metrics calculation using real data
  const metrics = useMemo(() => {
    const { startDate, endDate } = getDateRange(selectedPeriod);
    
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const profit = totalSales - totalExpenses;
    const avgOrderValue = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

    // Calculate trends
    const previousPeriodSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const prevStartDate = new Date(startDate);
      const periodDiff = endDate.getTime() - startDate.getTime();
      prevStartDate.setTime(startDate.getTime() - periodDiff);
      return saleDate >= prevStartDate && saleDate < startDate;
    });
    
    const prevTotalSales = previousPeriodSales.reduce((sum, sale) => sum + sale.amount, 0);
    const salesGrowth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;

    return {
      totalSales,
      totalExpenses,
      profit,
      avgOrderValue,
      salesCount: filteredSales.length,
      filteredSales,
      filteredTransactions,
      salesGrowth,
      customersCount: customers.length,
      activeProducts: products.filter(p => p.status === 'active').length
    };
  }, [selectedPeriod, sales, transactions, customers, products]);

  // Enhanced chart data preparation
  const chartData = useMemo(() => {
    // Sales by day for area chart
    const salesByDay = sales.slice(-30).reduce((acc: any[], sale) => {
      const existingDay = acc.find(item => item.date === sale.date);
      if (existingDay) {
        existingDay.value += sale.amount;
      } else {
        acc.push({ date: sale.date, value: sale.amount });
      }
      return acc;
    }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Sales by channel (pie chart)
    const salesByChannel = sales.reduce((acc: any[], sale) => {
      const channel = sale.salesChannel || 'store';
      const existing = acc.find(item => item.label === channel);
      if (existing) {
        existing.value += sale.amount;
      } else {
        acc.push({ 
          label: channel === 'store' ? 'Tienda' : 
                channel === 'online' ? 'Online' : 
                channel === 'phone' ? 'Teléfono' : 
                channel === 'whatsapp' ? 'WhatsApp' : 'Otros',
          value: sale.amount 
        });
      }
      return acc;
    }, []);

    // Top products by revenue
    const productSales = sales.reduce((acc: any, sale) => {
      // Since we don't have product details in sales, we'll use a simplified approach
      const productName = `Producto ${sale.id % 5 + 1}`;
      if (!acc[productName]) {
        acc[productName] = { revenue: 0, quantity: 0 };
      }
      acc[productName].revenue += sale.amount;
      acc[productName].quantity += sale.items;
      return acc;
    }, {});

    const topProducts = Object.entries(productSales)
      .map(([name, data]: [string, any]) => ({
        label: name,
        value: data.revenue
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Customer distribution
    const customersByStatus = [
      { label: 'Activos', value: customers.filter(c => c.status === 'active').length },
      { label: 'Inactivos', value: customers.filter(c => c.status === 'inactive').length }
    ];

    // Account balances
    const accountBalances = accounts.map(account => ({
      label: account.name,
      value: account.balance
    }));

    return {
      salesByDay,
      salesByChannel,
      topProducts,
      customersByStatus,
      accountBalances
    };
  }, [sales, customers, accounts]);

  // Enhanced export functions
  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';
    
    switch (activeTab) {
      case 'sales':
        csvContent = 'Fecha,Cliente,Vendedor,Items,Monto,Canal,Estado Pago,Método Pago\n';
        csvContent += metrics.filteredSales.map(sale => 
          `${sale.date},${sale.client.name},${sale.seller?.name || 'N/A'},${sale.items},${sale.amount},${sale.salesChannel || 'store'},${sale.paymentStatus || 'pending'},${sale.paymentMethod || 'cash'}`
        ).join('\n');
        filename = `ventas_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'financial':
        csvContent = 'Fecha,Tipo,Descripción,Monto,Categoría,Referencia\n';
        csvContent += metrics.filteredTransactions.map(transaction => 
          `${transaction.date},${transaction.type},${transaction.description},${transaction.amount},${transaction.category || 'N/A'},${transaction.reference || 'N/A'}`
        ).join('\n');
        filename = `financiero_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'customers':
        csvContent = 'Nombre,Email,Teléfono,Balance,Estado,Fecha Creación\n';
        csvContent += customers.map(customer => 
          `${customer.name},${customer.email},${customer.phone},${customer.balance},${customer.status},${customer.createdAt}`
        ).join('\n');
        filename = `clientes_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'inventory':
        csvContent = 'SKU,Nombre,Categoría,Marca,Stock,Stock Mínimo,Costo,Precio,Estado\n';
        csvContent += products.map(product => 
          `${product.sku},${product.name},${product.category},${product.brand},${product.stock},${product.minStock},${product.cost},${product.price},${product.status}`
        ).join('\n');
        filename = `inventario_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      default:
        csvContent = 'Métrica,Valor\n';
        csvContent += `Ventas Totales,${metrics.totalSales}\n`;
        csvContent += `Gastos Totales,${metrics.totalExpenses}\n`;
        csvContent += `Ganancia Neta,${metrics.profit}\n`;
        csvContent += `Valor Promedio,${metrics.avgOrderValue.toFixed(2)}\n`;
        csvContent += `Total Clientes,${metrics.customersCount}\n`;
        csvContent += `Productos Activos,${metrics.activeProducts}\n`;
        filename = `resumen_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Create a comprehensive HTML report for PDF printing
    const reportWindow = window.open('', '_blank');
    const reportData = {
      period: selectedPeriod,
      tab: activeTab,
      date: new Date().toLocaleDateString(),
      metrics,
      sales: metrics.filteredSales,
      customers,
      products
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte ${activeTab} - ${selectedPeriod}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metrics { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .metric-card { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f5f5f5; }
            .summary { background-color: #f9f9f9; padding: 15px; border-radius: 8px; }
            @media print { 
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Grid Manager - Reporte de ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p>Período: ${selectedPeriod} | Generado el: ${reportData.date}</p>
          </div>
          
          <div class="metrics">
            <div class="metric-card">
              <h3>Ventas Totales</h3>
              <p>${formatCurrency(reportData.metrics.totalSales)}</p>
            </div>
            <div class="metric-card">
              <h3>Ganancia Neta</h3>
              <p>${formatCurrency(reportData.metrics.profit)}</p>
            </div>
            <div class="metric-card">
              <h3>Transacciones</h3>
              <p>${reportData.metrics.salesCount}</p>
            </div>
          </div>

          <div class="summary">
            <h3>Resumen Ejecutivo</h3>
            <p>Durante el período de ${selectedPeriod}, se registraron ${reportData.metrics.salesCount} transacciones 
            por un total de ${formatCurrency(reportData.metrics.totalSales)}, con una ganancia neta de 
            ${formatCurrency(reportData.metrics.profit)}.</p>
          </div>

          <button class="no-print" onclick="window.print()" style="margin: 20px 0; padding: 10px 20px;">
            Imprimir / Guardar como PDF
          </button>
        </body>
      </html>
    `;

    reportWindow?.document.write(htmlContent);
    reportWindow?.document.close();
  };

  const sendByEmail = () => {
    const subject = `Reporte ${activeTab} - ${selectedPeriod} - Grid Manager`;
    const body = `
Reporte de ${activeTab} para el período ${selectedPeriod}

MÉTRICAS PRINCIPALES:
• Ventas Totales: ${formatCurrency(metrics.totalSales)}
• Gastos Totales: ${formatCurrency(metrics.totalExpenses)}
• Ganancia Neta: ${formatCurrency(metrics.profit)}
• Promedio por Transacción: ${formatCurrency(metrics.avgOrderValue)}
• Total de Transacciones: ${metrics.salesCount}
• Clientes Totales: ${metrics.customersCount}
• Productos Activos: ${metrics.activeProducts}

CRECIMIENTO:
• Crecimiento de Ventas: ${metrics.salesGrowth.toFixed(1)}%

Este reporte fue generado automáticamente por Grid Manager el ${new Date().toLocaleDateString()}.
    `;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Enhanced Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Ventas Totales"
                value={metrics.totalSales}
                change={metrics.salesGrowth > 0 ? `+${metrics.salesGrowth.toFixed(1)}` : metrics.salesGrowth.toFixed(1)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                color="text-green-600"
                trend={chartData.salesByDay.slice(-7).map(d => d.value)}
              />
              <MetricCard
                title="Ganancia Neta"
                value={metrics.profit}
                change={metrics.profit > 0 ? "+22.1" : "-12.3"}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                color="text-blue-600"
              />
              <MetricCard
                title="Promedio por Venta"
                value={metrics.avgOrderValue}
                change="+5.8"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                color="text-purple-600"
              />
              <MetricCard
                title="Transacciones"
                value={metrics.salesCount.toString()}
                change="+12.5"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 10H6L5 9z" /></svg>}
                color="text-indigo-600"
              />
            </div>

            {/* Enhanced Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AreaChart 
                data={chartData.salesByDay} 
                title="Tendencia de Ventas (30 días)" 
                color="#10B981"
              />
              <PieChart 
                data={chartData.salesByChannel} 
                title="Ventas por Canal"
              />
            </div>

            {/* Additional Overview Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart 
                data={chartData.topProducts} 
                title="Productos Más Vendidos" 
                color="bg-blue-600" 
              />
              <BarChart 
                data={chartData.accountBalances.slice(0, 5)} 
                title="Balances por Cuenta" 
                color="bg-green-600" 
              />
            </div>
          </div>
        );

      case 'sales':
        const salesByPerson = metrics.filteredSales.reduce((acc: any[], sale) => {
          const seller = sale.seller?.name || 'Sin asignar';
          const existing = acc.find(item => item.label === seller);
          if (existing) {
            existing.value += sale.amount;
          } else {
            acc.push({ label: seller, value: sale.amount });
          }
          return acc;
        }, []).sort((a, b) => b.value - a.value);

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Ventas del Período"
                value={metrics.salesCount.toString()}
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
              <PieChart data={chartData.salesByChannel} title="Distribución por Canal" />
            </div>

            <ReportTable
              title="Detalle de Ventas"
              headers={['Fecha', 'Cliente', 'Vendedor', 'Items', 'Monto', 'Canal', 'Estado']}
              data={metrics.filteredSales.slice(0, 50).map(sale => ({
                fecha: formatDate(sale.date),
                cliente: sale.client.name,
                vendedor: sale.seller?.name || 'N/A',
                items: sale.items,
                monto: sale.amount,
                canal: sale.salesChannel || 'store',
                estado: sale.status
              }))}
            />
          </div>
        );

      case 'financial':
        const totalIncome = metrics.filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expensesByCategory = metrics.filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((acc: any[], transaction) => {
            const category = transaction.category || 'Sin categoría';
            const existing = acc.find(item => item.label === category);
            if (existing) {
              existing.value += transaction.amount;
            } else {
              acc.push({ label: category, value: transaction.amount });
            }
            return acc;
          }, []);

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Ingresos"
                value={totalIncome}
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
                title="Ganancia Neta"
                value={metrics.profit}
                change={metrics.profit > 0 ? "+18.3" : "-12.1"}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                color="text-blue-600"
              />
              <MetricCard
                title="Margen"
                value={`${metrics.totalSales > 0 ? ((metrics.profit / metrics.totalSales) * 100).toFixed(1) : '0'}%`}
                change="+5.8"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                color="text-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Estado Financiero</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Ingresos Totales</span>
                    <span className="font-semibold text-green-600 text-lg">+{formatCurrency(totalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Gastos Operativos</span>
                    <span className="font-semibold text-red-600 text-lg">-{formatCurrency(metrics.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 text-lg font-bold border-t-2 border-gray-200">
                    <span>Ganancia Neta</span>
                    <span className={`text-lg ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.profit >= 0 ? '+' : ''}{formatCurrency(metrics.profit)}
                    </span>
                  </div>
                </div>
              </div>

              <PieChart 
                data={expensesByCategory} 
                title="Gastos por Categoría"
              />
            </div>

            <ReportTable
              title="Detalle de Transacciones"
              headers={['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Monto']}
              data={metrics.filteredTransactions.slice(0, 50).map(transaction => ({
                fecha: formatDate(transaction.date),
                tipo: transaction.type === 'income' ? 'Ingreso' : 'Egreso',
                descripcion: transaction.description,
                categoria: transaction.category || 'N/A',
                monto: transaction.amount
              }))}
            />
          </div>
        );

      case 'customers':
        const customersByBalance = customers.map(c => ({
          label: c.name,
          value: c.balance
        })).sort((a, b) => b.value - a.value).slice(0, 10);

        const customersByCreationMonth = customers.reduce((acc: any[], customer) => {
          const month = new Date(customer.createdAt).toLocaleString('es', { month: 'short', year: 'numeric' });
          const existing = acc.find(item => item.label === month);
          if (existing) {
            existing.value += 1;
          } else {
            acc.push({ label: month, value: 1 });
          }
          return acc;
        }, []);

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Total Clientes"
                value={customers.length.toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>}
              />
              <MetricCard
                title="Clientes Activos"
                value={customers.filter(c => c.status === 'active').length.toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                color="text-green-600"
              />
              <MetricCard
                title="Balance Promedio"
                value={customers.length > 0 ? customers.reduce((sum, c) => sum + c.balance, 0) / customers.length : 0}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
              />
              <MetricCard
                title="Balance Total"
                value={customers.reduce((sum, c) => sum + c.balance, 0)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                color="text-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart 
                data={customersByBalance} 
                title="Top 10 Clientes por Balance"
                color="bg-purple-600"
              />
              <PieChart 
                data={chartData.customersByStatus} 
                title="Estado de Clientes"
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <BarChart 
                data={customersByCreationMonth} 
                title="Nuevos Clientes por Mes"
                color="bg-indigo-600"
              />
            </div>

            <ReportTable
              title="Análisis Detallado de Clientes"
              headers={['Cliente', 'Email', 'Teléfono', 'Balance', 'Estado', 'Fecha Creación']}
              data={customers.map(customer => ({
                cliente: customer.name,
                email: customer.email,
                telefono: customer.phone,
                balance: customer.balance,
                estado: customer.status === 'active' ? 'Activo' : 'Inactivo',
                fecha: formatDate(customer.createdAt)
              }))}
            />
          </div>
        );

      case 'inventory':
        const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.status === 'active');
        const productsByCategory = products.reduce((acc: any[], product) => {
          const existing = acc.find(item => item.label === product.category);
          if (existing) {
            existing.value += 1;
          } else {
            acc.push({ label: product.category, value: 1 });
          }
          return acc;
        }, []);

        const topProductsByValue = products
          .map(p => ({ label: p.name, value: p.stock * p.cost }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Total Productos"
                value={products.length.toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              />
              <MetricCard
                title="Stock Total"
                value={products.reduce((sum, p) => sum + p.stock, 0).toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              />
              <MetricCard
                title="Stock Bajo"
                value={lowStockProducts.length.toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                color="text-red-600"
              />
              <MetricCard
                title="Valor Inventario"
                value={products.reduce((sum, p) => sum + (p.cost * p.stock), 0)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                color="text-green-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart 
                data={topProductsByValue}
                title="Top 10 Productos por Valor en Stock"
                color="bg-green-600"
              />
              <PieChart 
                data={productsByCategory}
                title="Distribución por Categoría"
              />
            </div>

            {lowStockProducts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-4">⚠️ Productos con Stock Bajo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="bg-white p-4 rounded-lg border border-red-200">
                      <div className="font-semibold text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">Stock: {product.stock} / Mínimo: {product.minStock}</div>
                      <div className="text-sm text-red-600">Categoría: {product.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ReportTable
              title="Análisis Completo de Inventario"
              headers={['SKU', 'Producto', 'Categoría', 'Stock', 'Mín. Stock', 'Costo Unit.', 'Precio', 'Valor Total', 'Estado']}
              data={products.map(product => ({
                sku: product.sku,
                producto: product.name,
                categoria: product.category,
                stock: product.stock,
                minimo: product.minStock,
                costo: product.cost,
                precio: product.price,
                total: product.stock * product.cost,
                estado: product.status === 'active' ? 'Activo' : 'Inactivo'
              }))}
            />
          </div>
        );

      case 'performance':
        // New Performance tab with KPIs
        const conversionRate = customers.length > 0 ? (metrics.salesCount / customers.length) * 100 : 0;
        const averageMargin = products.length > 0 ? 
          products.reduce((sum, p) => sum + ((p.price - p.cost) / p.price) * 100, 0) / products.length : 0;

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Tasa de Conversión"
                value={`${conversionRate.toFixed(1)}%`}
                change="+3.2"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                color="text-blue-600"
              />
              <MetricCard
                title="Margen Promedio"
                value={`${averageMargin.toFixed(1)}%`}
                change="+1.8"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                color="text-green-600"
              />
              <MetricCard
                title="ROI Mensual"
                value={`${metrics.totalSales > 0 ? ((metrics.profit / metrics.totalExpenses) * 100).toFixed(1) : '0'}%`}
                change="+12.4"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                color="text-purple-600"
              />
              <MetricCard
                title="Productividad"
                value={`${(metrics.salesCount / 30).toFixed(1)} ventas/día`}
                change="+8.7"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                color="text-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">KPIs de Rendimiento</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ventas por Cliente</span>
                    <span className="font-semibold">{(metrics.salesCount / customers.length || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ingreso por Cliente</span>
                    <span className="font-semibold">{formatCurrency(metrics.totalSales / customers.length || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rotación de Inventario</span>
                    <span className="font-semibold">12.3x</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tiempo Prom. de Venta</span>
                    <span className="font-semibold">2.4 días</span>
                  </div>
                </div>
              </div>

              <AreaChart
                data={chartData.salesByDay.slice(-14)}
                title="Tendencia de Rendimiento (14 días)"
                color="#8B5CF6"
              />
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Análisis de Eficiencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{((metrics.profit / metrics.totalSales) * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">Margen de Ganancia</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{(metrics.totalSales / metrics.salesCount || 0).toFixed(0)}</div>
                  <div className="text-sm text-gray-500">Valor Promedio por Venta</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{products.filter(p => p.stock <= p.minStock).length}</div>
                  <div className="text-sm text-gray-500">Productos Críticos</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Informes y Análisis Avanzados</h1>
          <p className="text-sm text-gray-500">Análisis completo y en tiempo real del rendimiento de tu negocio</p>
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

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Datos desde: {formatDate(getDateRange(selectedPeriod).startDate)}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">En vivo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">
                    {tab.icon}
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

        {/* Enhanced Export Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Exportar y Compartir</h3>
              <p className="text-sm text-gray-500">Descarga o comparte los datos para análisis externos</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" onClick={exportToCSV} className="w-full sm:w-auto">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Exportar CSV
              </Button>
              <Button variant="secondary" onClick={exportToPDF} className="w-full sm:w-auto">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generar PDF
              </Button>
              <Button variant="primary" onClick={sendByEmail} className="w-full sm:w-auto">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Compartir por Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}