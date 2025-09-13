import React, { useState, useEffect, useMemo } from 'react';
import { useSales } from '../store/SalesContext';
import { useProductsStore } from '../store/productsStore';
import { useCustomersStore } from '../store/customersStore';
import { useSuppliersStore } from '../stores/suppliersStore';
import { SalesForm } from '../components/forms/SalesForm';
import { ProductForm } from '../components/forms/ProductForm';
import { CustomerModal } from '../components/forms/CustomerModal';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

interface ExchangeRate {
  compra: number;
  venta: number;
  fecha: string;
  hora: string;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [realStats, setRealStats] = useState({
    totalAvailable: 0,
    accountsCount: 0,
    clientDebts: 0,
    supplierDebts: 0
  });
  const { dashboardStats, sales } = useSales();
  const { products } = useProductsStore();
  const { customers } = useCustomersStore();
  const { suppliers } = useSuppliersStore();

  // Generate sales evolution data
  const salesEvolutionData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    return last30Days.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= dayStart && saleDate <= dayEnd;
      });

      const totalAmount = daySales.reduce((sum, sale) => sum + sale.amount, 0);
      const totalQuantity = daySales.reduce((sum, sale) => sum + sale.items, 0);

      return {
        date: date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }),
        facturado: totalAmount,
        cantidad: totalQuantity,
        ventas: daySales.length
      };
    });
  }, [sales]);

  // Get low stock products
  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.status === 'active');
  const outOfStockProducts = products.filter(p => p.stock === 0 && p.status === 'active');

  // Fetch exchange rate from Banco Nación
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
        const data = await response.json();
        if (data.oficial) {
          const now = new Date();
          setExchangeRate({
            compra: data.oficial.value_buy,
            venta: data.oficial.value_sell,
            fecha: now.toLocaleDateString(),
            hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
          });
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback data
        const now = new Date();
        setExchangeRate({
          compra: 920.00,
          venta: 940.00,
          fecha: now.toLocaleDateString(),
          hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        });
      }
    };

    fetchExchangeRate();
    // Update every 30 minutes
    const interval = setInterval(fetchExchangeRate, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load real data from localStorage
  useEffect(() => {
    const loadRealData = () => {
      try {
        // Load accounts data
        const accountsData = JSON.parse(localStorage.getItem('gridmanager_accounts') || '[]');
        const totalAvailable = accountsData.reduce((sum: number, account: any) => sum + account.balance, 0);
        const accountsCount = accountsData.length;

        // Load sales data for debts calculation
        const salesData = JSON.parse(localStorage.getItem('gridmanager_sales') || '[]');
        const clientDebts = salesData
          .filter((sale: any) => sale.paymentStatus === 'pending' || sale.paymentStatus === 'partial')
          .reduce((sum: number, sale: any) => sum + sale.amount, 0);

        // Calculate real supplier debts from suppliers store
        const supplierDebts = suppliers
          .filter(supplier => supplier.active && supplier.currentBalance < 0) // Solo balances negativos (les debemos)
          .reduce((sum: number, supplier: any) => sum + Math.abs(supplier.currentBalance), 0);

        setRealStats({
          totalAvailable,
          accountsCount,
          clientDebts,
          supplierDebts
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadRealData();
    // Update every 5 seconds to keep data fresh
    const interval = setInterval(loadRealData, 5000);
    return () => clearInterval(interval);
  }, [suppliers]);

  const handleModuleClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  // Enhanced stats with bigger cards
  const enhancedStats = [
    {
      name: 'Total Disponible',
      value: formatCurrency(realStats.totalAvailable),
      rawValue: realStats.totalAvailable,
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      change: realStats.totalAvailable > 100000 ? '+12.5%' : '+5.2%',
      description: 'Total en cuentas activas'
    },
    {
      name: 'Cuentas',
      value: realStats.accountsCount.toString(),
      rawValue: realStats.accountsCount,
      icon: '💳',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Cuentas registradas'
    },
    {
      name: 'Deudas Clientes',
      value: formatCurrency(realStats.clientDebts),
      rawValue: realStats.clientDebts,
      icon: '👥',
      color: realStats.clientDebts > 0 ? 'text-orange-600' : 'text-green-600',
      bgColor: realStats.clientDebts > 0 ? 'bg-orange-50' : 'bg-green-50',
      borderColor: realStats.clientDebts > 0 ? 'border-orange-200' : 'border-green-200',
      description: 'Pagos pendientes'
    },
    {
      name: 'Deudas Proveedores',
      value: formatCurrency(realStats.supplierDebts),
      rawValue: realStats.supplierDebts,
      icon: '🏢',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Pagos a proveedores'
    }
  ];

  const moduleCards = [
    {
      name: 'Ventas',
      description: 'Gestionar ventas y facturación',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: 'sales',
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Clientes',
      description: 'Administrar clientes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: 'customers',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Productos',
      description: 'Control de inventario',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      path: 'products',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Cuentas',
      description: 'Gestión financiera',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      path: 'accounts',
      color: 'bg-amber-100 text-amber-600'
    },
    {
      name: 'Reportes',
      description: 'Análisis y estadísticas',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: 'reports',
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      name: 'Proveedores',
      description: 'Gestión de proveedores',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: 'suppliers',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      name: 'Calculadora ML',
      description: 'Calculadora MercadoLibre',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      path: 'calculator',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Control</h1>
          <p className="text-gray-600">Resumen de tu negocio en tiempo real</p>
        </div>

        {/* Exchange Rate - Moved to top */}
        {exchangeRate && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-sm mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">💵 Tipo de Cambio USD - Banco Nación</h3>
                <p className="text-sm text-gray-600">Actualizado: {exchangeRate.fecha} a las {exchangeRate.hora}</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Compra</p>
                  <p className="text-2xl font-bold text-green-600">${exchangeRate.compra.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Venta</p>
                  <p className="text-2xl font-bold text-blue-600">${exchangeRate.venta.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards - Bigger */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {enhancedStats.map((stat, index) => {
            // Determine click handler and styling based on card name
            let clickHandler, cursorStyle;
            
            switch(stat.name) {
              case 'Total Disponible':
              case 'Cuentas':
                clickHandler = () => handleModuleClick('accounts');
                cursorStyle = 'cursor-pointer hover:scale-105';
                break;
              case 'Deudas Clientes':
                clickHandler = () => handleModuleClick('customers');
                cursorStyle = 'cursor-pointer hover:scale-105';
                break;
              case 'Deudas Proveedores':
                clickHandler = () => handleModuleClick('suppliers');
                cursorStyle = 'cursor-pointer hover:scale-105';
                break;
              default:
                clickHandler = undefined;
                cursorStyle = '';
            }
            
            return (
              <div 
                key={stat.name} 
                className={`bg-white p-6 rounded-2xl border-2 ${stat.borderColor} shadow-sm hover:shadow-md transition-all ${cursorStyle}`}
                onClick={clickHandler}
              >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                {stat.change && (
                  <div className="text-right">
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                      ↗ {stat.change}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
                <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>


        {/* Stock Alerts - Moved Higher */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="bg-white p-6 rounded-2xl border border-orange-200 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
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
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">⚡ Acciones Rápidas</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              onClick={() => setShowNewSaleModal(true)}
              variant="outline"
              className="flex flex-col items-center p-4 h-auto bg-green-50 hover:bg-green-100 border-green-200 text-gray-700"
            >
              <span className="text-2xl mb-2">💰</span>
              <span className="text-sm font-medium">Nueva Venta</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales by Amount Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📈 Evolución de Ventas por Facturado</h3>
              <p className="text-sm text-gray-500">Últimos 30 días - Total facturado por día</p>
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

        {/* Recent Activity - Moved to bottom, responsive */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm order-last lg:order-none">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📊 Actividad Reciente</h3>
            <span className="text-sm text-gray-500">Últimas 24h</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Nueva venta registrada</p>
                <p className="text-xs text-gray-500">Cliente: Juan Pérez - $2,500</p>
              </div>
              <span className="text-xs text-gray-400">10:30 AM</span>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Producto agregado al inventario</p>
                <p className="text-xs text-gray-500">SKU-001 - Stock: 50 unidades</p>
              </div>
              <span className="text-xs text-gray-400">09:15 AM</span>
            </div>
            <div className="flex items-center p-3 bg-orange-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Stock bajo detectado</p>
                <p className="text-xs text-gray-500">Producto B - Solo quedan 5 unidades</p>
              </div>
              <span className="text-xs text-gray-400">08:45 AM</span>
            </div>
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