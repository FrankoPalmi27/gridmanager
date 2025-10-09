import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../lib/formatters';
import { useCustomersStore } from '../store/customersStore';
import { useProductsStore } from '../store/productsStore';
import { useAccountsStore } from '../store/accountsStore';
import { useMetrics } from '../hooks/useMetrics';
import {
  DownloadOutlined,
  FilePdfOutlined,
  MailOutlined
} from '@ant-design/icons';

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
              <svg className="w-3 h-3" viewBox="0 0 12 12" aria-hidden="true">
                <circle cx="6" cy="6" r="6" fill={pathData.color} />
              </svg>
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
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
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

const BAR_COLOR_MAP: Record<string, string> = {
  'bg-blue-600': 'var(--primary-500)',
  'bg-green-600': 'var(--success-500)',
  'bg-purple-600': 'var(--secondary-500)',
  'bg-indigo-600': 'var(--info-500)',
  'bg-emerald-600': 'var(--success-600)',
};

const resolveBarColor = (color: string) => BAR_COLOR_MAP[color] ?? color;

// Enhanced Bar Chart with better styling
const BarChart = ({ data, title, color = 'var(--primary-500)' }: {
  data: { label: string; value: number }[];
  title: string;
  color?: string;
}) => {
  if (!data.length) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const safeMax = maxValue > 0 ? maxValue : 1;
  const fillColor = resolveBarColor(color);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const rawWidth = (item.value / safeMax) * 100;
          const barWidth = Math.max(0, Math.min(100, Number.isFinite(rawWidth) ? rawWidth : 0));

          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-24 text-xs text-gray-600 truncate font-medium">{item.label}</div>
              <div className="flex-1 relative h-6">
                <svg className="w-full h-full" viewBox="0 0 100 12" preserveAspectRatio="none">
                  <rect x="0" y="2" width="100" height="8" fill="#E5E7EB" rx="4" />
                  <rect x="0" y="2" width={barWidth} height="8" fill={fillColor} rx="4" />
                </svg>
                <span className="absolute right-3 top-0 text-xs font-semibold text-gray-700 leading-6">
                  {typeof item.value === 'number' && item.value > 1000
                    ? formatCurrency(item.value)
                    : item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TrendSparkline = ({ data, colorClass = 'text-blue-500' }: {
  data: number[];
  colorClass?: string;
}) => {
  if (!data.length) return null;

  const maxValue = Math.max(...data) || 1;
  const barWidth = 100 / data.length;

  return (
    <div className={`mt-4 h-8 ${colorClass}`}>
      <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
        {data.map((value, index) => {
          const normalizedHeight = (value / maxValue) * 36;
          const x = index * barWidth;
          return (
            <rect
              key={index}
              x={x}
              y={38 - normalizedHeight}
              width={barWidth - 1}
              height={normalizedHeight}
              rx={1.5}
              ry={1.5}
              fill="currentColor"
            />
          );
        })}
      </svg>
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
    {trend && trend.length > 0 && <TrendSparkline data={trend} colorClass={color ?? 'text-blue-500'} />}
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
  <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
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
  const { customers } = useCustomersStore();
  const { products } = useProductsStore();
  const { accounts } = useAccountsStore();
  const metrics = useMetrics(selectedPeriod);
  const filteredSales = metrics.filteredSales;
  const filteredTransactions = metrics.filteredTransactions;
  const salesCount = metrics.totalTransactions;

  const periodOptions = [
    { value: '7days', label: 'Últimos 7 días' },
    { value: '30days', label: 'Últimos 30 días' },
    { value: '90days', label: 'Últimos 90 días' },
    { value: '1year', label: 'Último año' }
  ];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg> },
    { id: 'sales', label: 'Ventas', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg> },
    { id: 'financial', label: 'Financiero', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'customers', label: 'Clientes', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { id: 'inventory', label: 'Inventario', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    { id: 'performance', label: 'Rendimiento', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> }
  ];

  const chartData = useMemo(() => {
    const salesSource = filteredSales;

    const salesByDayMap = new Map<string, number>();
    salesSource.forEach(sale => {
      const currentTotal = salesByDayMap.get(sale.date) || 0;
      salesByDayMap.set(sale.date, currentTotal + sale.amount);
    });

    const salesByDay = Array.from(salesByDayMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    const channelLabels: Record<string, string> = {
      store: 'Tienda',
      online: 'Online',
      phone: 'Teléfono',
      whatsapp: 'WhatsApp',
      other: 'Otros'
    };

    const salesByChannelMap = new Map<string, number>();
    salesSource.forEach(sale => {
      const channel = sale.salesChannel || 'store';
      const label = channelLabels[channel] || 'Otros';
      const currentTotal = salesByChannelMap.get(label) || 0;
      salesByChannelMap.set(label, currentTotal + sale.amount);
    });

    const salesByChannel = Array.from(salesByChannelMap.entries()).map(([label, value]) => ({
      label,
      value
    }));

    const productSalesMap = new Map<string, { label: string; revenue: number }>();
    salesSource.forEach(sale => {
      const key = sale.productId || sale.productName || sale.number;
      const label = sale.productName || sale.productId || `Venta ${sale.number}`;
      const current = productSalesMap.get(key) || { label, revenue: 0 };
      current.revenue += sale.amount;
      productSalesMap.set(key, current);
    });

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(item => ({ label: item.label, value: item.revenue }));

    const customersByStatus = [
      { label: 'Activos', value: customers.filter(c => c.status === 'active').length },
      { label: 'Inactivos', value: customers.filter(c => c.status === 'inactive').length }
    ];

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
  }, [filteredSales, customers, accounts]);

  // Enhanced export functions
  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';
    
    switch (activeTab) {
      case 'sales':
        csvContent = 'Fecha,Cliente,Vendedor,Items,Monto,Canal,Estado Pago,Método Pago\n';
        csvContent += filteredSales
          .map(sale => {
            const saleRecord = sale as unknown as Record<string, unknown> & {
              paymentStatus?: string;
              paymentMethod?: string;
            };
            const paymentStatus = typeof saleRecord.paymentStatus === 'string' ? saleRecord.paymentStatus : 'pending';
            const paymentMethod = typeof saleRecord.paymentMethod === 'string' ? saleRecord.paymentMethod : 'cash';
            return `${sale.date},${sale.client.name},${sale.seller?.name || 'N/A'},${sale.items},${sale.amount},${sale.salesChannel || 'store'},${paymentStatus},${paymentMethod}`;
          })
          .join('\n');
        filename = `ventas_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      case 'financial':
        csvContent = 'Fecha,Tipo,Descripción,Monto,Categoría,Referencia\n';
        csvContent += filteredTransactions
          .map(transaction =>
            `${transaction.date},${transaction.type},${transaction.description},${transaction.amount},${transaction.category || 'N/A'},${transaction.reference || 'N/A'}`
          )
          .join('\n');
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
  sales: filteredSales,
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
            .print-button { margin: 20px 0; padding: 10px 20px; background-color: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
            .print-button:hover { background-color: #1d4ed8; }
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
              <p>${reportData.metrics.totalTransactions}</p>
            </div>
          </div>

          <div class="summary">
            <h3>Resumen Ejecutivo</h3>
            <p>Durante el período de ${selectedPeriod}, se registraron ${reportData.metrics.totalTransactions} transacciones 
            por un total de ${formatCurrency(reportData.metrics.totalSales)}, con una ganancia neta de 
            ${formatCurrency(reportData.metrics.profit)}.</p>
          </div>

          <button class="no-print print-button" onclick="window.print()">
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
• Total de Transacciones: ${salesCount}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Ventas Totales"
                value={metrics.totalSales}
                change={metrics.salesGrowth > 0 ? `+${metrics.salesGrowth.toFixed(1)}` : metrics.salesGrowth.toFixed(1)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                color="text-green-600"
                trend={chartData.salesByDay.slice(-7).map(d => d.value)}
              />
              <MetricCard
                title="Ganancia Neta"
                value={metrics.profit}
                change={metrics.profitGrowth > 0 ? `+${metrics.profitGrowth.toFixed(1)}` : metrics.profitGrowth.toFixed(1)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                color="text-blue-600"
              />
              <MetricCard
                title="Promedio por Venta"
                value={metrics.avgOrderValue}
                change={metrics.avgOrderValueGrowth > 0 ? `+${metrics.avgOrderValueGrowth.toFixed(1)}` : metrics.avgOrderValueGrowth.toFixed(1)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                color="text-purple-600"
              />
              <MetricCard
                title="Transacciones"
                value={salesCount.toString()}
                change={metrics.transactionsGrowth > 0 ? `+${metrics.transactionsGrowth.toFixed(1)}` : metrics.transactionsGrowth.toFixed(1)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                color="text-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AreaChart data={chartData.salesByDay} title="Tendencia de Ventas (30 días)" color="#10B981" />
              <PieChart data={chartData.salesByChannel} title="Ventas por Canal" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart data={chartData.topProducts} title="Productos Más Vendidos" color="var(--primary-500)" />
              <BarChart data={chartData.accountBalances.slice(0, 5)} title="Balances por Cuenta" color="var(--success-500)" />
            </div>
          </div>
        );

      case 'sales': {
        const salesByPerson = filteredSales
          .reduce((acc: { label: string; value: number }[], sale) => {
            const seller = sale.seller?.name || 'Sin asignar';
            const existing = acc.find(item => item.label === seller);
            if (existing) {
              existing.value += sale.amount;
            } else {
              acc.push({ label: seller, value: sale.amount });
            }
            return acc;
          }, [])
          .sort((a, b) => b.value - a.value);

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Ventas del Período"
                value={salesCount.toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
              />
              <MetricCard
                title="Ingresos Totales"
                value={metrics.totalSales}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <MetricCard
                title="Ticket Promedio"
                value={metrics.avgOrderValue}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart data={salesByPerson} title="Ventas por Vendedor" color="var(--primary-500)" />
              <PieChart data={chartData.salesByChannel} title="Distribución por Canal" />
            </div>

            <ReportTable
              title="Detalle de Ventas"
              headers={['Fecha', 'Cliente', 'Vendedor', 'Items', 'Monto', 'Canal', 'Estado']}
              data={filteredSales.slice(0, 50).map(sale => ({
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
      }

      case 'financial': {
        const expensesByCategory = filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((acc: { label: string; value: number }[], transaction) => {
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
                value={metrics.totalIncome}
                change={metrics.incomeGrowth > 0 ? `+${metrics.incomeGrowth.toFixed(1)}` : metrics.incomeGrowth.toFixed(1)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                color="text-green-600"
              />
              <MetricCard
                title="Egresos"
                value={metrics.totalExpenses}
                change={metrics.expensesGrowth > 0 ? `+${metrics.expensesGrowth.toFixed(1)}` : metrics.expensesGrowth.toFixed(1)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                color="text-red-600"
              />
              <MetricCard
                title="Ganancia Neta"
                value={metrics.profit}
                change={metrics.profitGrowth > 0 ? `+${metrics.profitGrowth.toFixed(1)}` : metrics.profitGrowth.toFixed(1)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
                color="text-blue-600"
              />
              <MetricCard
                title="Margen"
                value={`${metrics.totalSales > 0 ? ((metrics.profit / metrics.totalSales) * 100).toFixed(1) : '0'}%`}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                color="text-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Estado Financiero</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Ingresos Totales</span>
                    <span className="font-semibold text-green-600 text-lg">+{formatCurrency(metrics.totalIncome)}</span>
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

              <PieChart data={expensesByCategory} title="Gastos por Categoría" />
            </div>

            <ReportTable
              title="Detalle de Transacciones"
              headers={['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Monto']}
              data={filteredTransactions.slice(0, 50).map(transaction => ({
                fecha: formatDate(transaction.date),
                tipo: transaction.type === 'income' ? 'Ingreso' : 'Egreso',
                descripcion: transaction.description,
                categoria: transaction.category || 'N/A',
                monto: transaction.amount
              }))}
            />
          </div>
        );
      }

      case 'customers': {
        const customersByBalance = customers
          .map(c => ({ label: c.name, value: c.balance }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        const customersByCreationMonth = customers.reduce((acc: { label: string; value: number }[], customer) => {
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
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              />
              <MetricCard
                title="Clientes Activos"
                value={customers.filter(c => c.status === 'active').length.toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                color="text-green-600"
              />
              <MetricCard
                title="Balance Promedio"
                value={customers.length > 0 ? customers.reduce((sum, c) => sum + c.balance, 0) / customers.length : 0}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <MetricCard
                title="Balance Total"
                value={customers.reduce((sum, c) => sum + c.balance, 0)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                color="text-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart data={customersByBalance} title="Top 10 Clientes por Balance" color="var(--secondary-500)" />
              <PieChart data={chartData.customersByStatus} title="Estado de Clientes" />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <BarChart data={customersByCreationMonth} title="Nuevos Clientes por Mes" color="var(--info-500)" />
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
      }

      case 'inventory': {
        const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.status === 'active');
        const productsByCategory = products.reduce((acc: { label: string; value: number }[], product) => {
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
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              />
              <MetricCard
                title="Stock Total"
                value={products.reduce((sum, p) => sum + p.stock, 0).toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
              />
              <MetricCard
                title="Stock Bajo"
                value={lowStockProducts.length.toString()}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                color="text-red-600"
              />
              <MetricCard
                title="Valor Inventario"
                value={products.reduce((sum, p) => sum + p.cost * p.stock, 0)}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                color="text-green-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart data={topProductsByValue} title="Top 10 Productos por Valor en Stock" color="var(--success-500)" />
              <PieChart data={productsByCategory} title="Distribución por Categoría" />
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
      }

      case 'performance': {
        const conversionRate = customers.length > 0 ? (salesCount / customers.length) * 100 : 0;
        const averageMargin = products.length > 0
          ? products.reduce((sum, p) => sum + ((p.price - p.cost) / p.price) * 100, 0) / products.length
          : 0;

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Tasa de Conversión"
                value={`${conversionRate.toFixed(1)}%`}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>}
                color="text-blue-600"
              />
              <MetricCard
                title="Margen Promedio"
                value={`${averageMargin.toFixed(1)}%`}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                color="text-green-600"
              />
              <MetricCard
                title="ROI Mensual"
                value={`${metrics.totalSales > 0 ? ((metrics.profit / metrics.totalExpenses) * 100).toFixed(1) : '0'}%`}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                color="text-purple-600"
              />
              <MetricCard
                title="Productividad"
                value={`${(salesCount / 30).toFixed(1)} ventas/día`}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                color="text-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">KPIs de Rendimiento</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ventas por Cliente</span>
                    <span className="font-semibold">{(salesCount / customers.length || 0).toFixed(2)}</span>
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

              <AreaChart data={chartData.salesByDay.slice(-14)} title="Tendencia de Rendimiento (14 días)" color="#8B5CF6" />
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Análisis de Eficiencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{((metrics.profit / metrics.totalSales) * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">Margen de Ganancia</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{(metrics.totalSales / salesCount || 0).toFixed(0)}</div>
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
      }

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
                aria-label="Seleccionar período del reporte"
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
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Exportar y Compartir</h3>
              <p className="text-sm text-gray-500 mt-1">Descarga o comparte los datos para análisis externos</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="flex-1 sm:flex-none justify-center gap-2 px-6 py-3 text-green-600 border-green-600 hover:bg-green-50 hover:border-green-700"
              >
                <DownloadOutlined className="text-lg" />
                <span className="font-medium">Exportar CSV</span>
              </Button>
              <Button
                variant="outline"
                onClick={exportToPDF}
                className="flex-1 sm:flex-none justify-center gap-2 px-6 py-3 text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700"
              >
                <FilePdfOutlined className="text-lg" />
                <span className="font-medium">Generar PDF</span>
              </Button>
              <Button
                variant="primary"
                onClick={sendByEmail}
                className="flex-1 sm:flex-none justify-center gap-2 px-6 py-3"
              >
                <MailOutlined className="text-lg" />
                <span className="font-medium">Compartir por Email</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}