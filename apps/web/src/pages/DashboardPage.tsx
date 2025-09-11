import React, { useState, useEffect } from 'react';
import { useSales } from '../store/SalesContext';
import { SalesForm } from '../components/forms/SalesForm';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/formatters';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [realStats, setRealStats] = useState({
    totalAvailable: 0,
    accountsCount: 0,
    clientDebts: 0,
    supplierDebts: 0
  });
  const { dashboardStats } = useSales();

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

        // For now, use mock data for supplier debts (this would come from a purchases module)
        const supplierDebts = 18500;

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
  }, []);

  // Dynamic stats based on real data
  const dynamicStats = [
    {
      name: 'Total Disponible',
      value: formatCurrency(realStats.totalAvailable),
      rawValue: realStats.totalAvailable,
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: realStats.totalAvailable > 100000 ? '+12.5%' : '+5.2%'
    },
    {
      name: 'Cuentas',
      value: realStats.accountsCount.toString(),
      rawValue: realStats.accountsCount,
      icon: '💳',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Deudas Clientes',
      value: formatCurrency(realStats.clientDebts),
      rawValue: realStats.clientDebts,
      icon: '👥',
      color: realStats.clientDebts > 0 ? 'text-orange-600' : 'text-green-600',
      bgColor: realStats.clientDebts > 0 ? 'bg-orange-100' : 'bg-green-100'
    },
    {
      name: 'Deudas Proveedores',
      value: formatCurrency(realStats.supplierDebts),
      rawValue: realStats.supplierDebts,
      icon: '🏢',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const moduleCards = [
    {
      name: 'Centro de Ventas',
      description: 'Gestiona ventas, presupuestos y clientes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: 'sales',
      isNew: true,
      colorIndex: 0
    },
    {
      name: 'Inventario',
      description: 'Control de productos y stock',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      path: 'products',
      colorIndex: 1
    },
    {
      name: 'Clientes',
      description: 'Base de datos de clientes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      path: 'customers',
      colorIndex: 2
    },
    {
      name: 'Proveedores',
      description: 'Gestión de proveedores',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: 'suppliers',
      colorIndex: 3
    },
    {
      name: 'Reportes',
      description: 'Análisis y reportes avanzados',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: 'reports',
      isBeta: true,
      colorIndex: 4
    },
    {
      name: 'Configuración',
      description: 'Ajustes del sistema',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: 'users',
      colorIndex: 5
    }
  ];

  const handleModuleClick = (modulePath: string) => {
    if (onNavigate) {
      onNavigate(modulePath);
    }
    // You can also add other navigation logic here
    console.log(`Navigating to: ${modulePath}`);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Resumen general de tu negocio</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {dynamicStats.map((stat, index) => (
            <div 
              key={stat.name} 
              className="relative bg-white rounded-2xl border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out cursor-pointer overflow-hidden"
              style={{ 
                background: index === 0 ? '#F0FDF4' : index === 1 ? '#F1F5F9' : index === 2 ? '#FEF3C7' : '#FEF2F2',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              {/* Icon container - top right */}
              <div className="absolute top-6 right-6">
                <div 
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                    index === 0 ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' :
                    index === 1 ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' :
                    index === 2 ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' :
                    'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                  }`}
                >
                  <span className="text-lg">{stat.icon}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Category label */}
                <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-3">
                  {stat.name}
                </p>
                
                {/* Main value */}
                <div className="mb-2">
                  <p className="text-2xl font-semibold text-gray-900 leading-none">
                    {stat.value}
                  </p>
                </div>
                
                {/* Change indicator */}
                {stat.change && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <p className="text-xs text-emerald-600 font-medium">
                      {stat.change}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modules Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Módulos del Sistema</h2>
              <p className="text-sm text-gray-500">Acceso rápido a todas las funcionalidades</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {moduleCards.map((module, index) => {
              const colorClasses = [
                { iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600', iconHover: 'hover:bg-emerald-500/20' },
                { iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600', iconHover: 'hover:bg-blue-500/20' },
                { iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600', iconHover: 'hover:bg-amber-500/20' },
                { iconBg: 'bg-red-500/10', iconColor: 'text-red-600', iconHover: 'hover:bg-red-500/20' },
                { iconBg: 'bg-purple-500/10', iconColor: 'text-purple-600', iconHover: 'hover:bg-purple-500/20' },
                { iconBg: 'bg-pink-500/10', iconColor: 'text-pink-600', iconHover: 'hover:bg-pink-500/20' }
              ];
              
              const colorClass = colorClasses[module.colorIndex % colorClasses.length];
              
              return (
                <div 
                  key={module.name} 
                  className="group relative border-0 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out cursor-pointer overflow-hidden"
                  style={{ 
                    background: '#F1F5F9',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                  onClick={() => handleModuleClick(module.path)}
                >
                  {/* Status badges - positioned absolutely */}
                  <div className="absolute top-6 right-6 flex gap-2">
                    {module.isNew && (
                      <span className="rounded-full px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium">
                        Nuevo
                      </span>
                    )}
                    {module.isBeta && (
                      <span className="rounded-full px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium">
                        Beta
                      </span>
                    )}
                  </div>

                  {/* Card content */}
                  <div className="p-6">
                    {/* Icon container - top left */}
                    <div className="mb-6">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${colorClass.iconBg} ${colorClass.iconColor} ${colorClass.iconHover}`}>
                        {module.icon}
                      </div>
                    </div>
                    
                    {/* Title and description */}
                    <div className="mb-6">
                      <h5 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {module.name}
                      </h5>
                      <p className="text-sm text-gray-600 leading-relaxed">{module.description}</p>
                    </div>
                    
                    {/* Subtle separator */}
                    <div className="border-t border-gray-200/50 mb-4"></div>
                    
                    {/* Action button */}
                    <Button 
                      className="w-full group/btn focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      variant="primary"
                    >
                      Explorar
                      <svg className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Business Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Ventas de los últimos 30 días */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ventas - 30 días</h3>
              <span className="text-2xl">📈</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Ventas</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(dashboardStats.totalSales)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Transacciones</span>
                <span className="text-sm font-medium text-gray-900">{dashboardStats.totalTransactions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Promedio/día</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(dashboardStats.averagePerDay)}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">vs mes anterior</span>
                  <span className="text-xs text-green-600 font-medium">+{dashboardStats.monthlyGrowth.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '73%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Cotización USD */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cotización USD</h3>
              <span className="text-2xl">💱</span>
            </div>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">$1,247.50</div>
                <div className="text-sm text-gray-600">ARS por USD</div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Compra</span>
                <span className="font-medium text-gray-900">$1,245.00</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Venta</span>
                <span className="font-medium text-gray-900">$1,250.00</span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Variación 24h</span>
                  <span className="text-xs text-red-600 font-medium">-0.8%</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Última actualización: 14:30</div>
              </div>
            </div>
          </div>

          {/* Tareas Pendientes */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tareas Pendientes</h3>
              <span className="text-2xl">✅</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-lg font-bold text-orange-600">12</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">• Urgentes</span>
                  <span className="font-medium text-red-600">3</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-600">• Importantes</span>
                  <span className="font-medium text-orange-600">5</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">• Normales</span>
                  <span className="font-medium text-blue-600">4</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Button variant="ghost" className="w-full text-sm">
                  Ver todas las tareas
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
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

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => setShowNewSaleModal(true)}
                variant="outline"
                className="flex flex-col items-center p-4 h-auto bg-green-50 hover:bg-green-100 border-green-200 text-gray-700"
              >
                <span className="text-2xl mb-2">💰</span>
                <span className="text-sm font-medium">Nueva Venta</span>
              </Button>
              <Button 
                onClick={() => handleModuleClick('customers')}
                variant="outline"
                className="flex flex-col items-center p-4 h-auto bg-blue-50 hover:bg-blue-100 border-blue-200 text-gray-700"
              >
                <span className="text-2xl mb-2">👤</span>
                <span className="text-sm font-medium">Nuevo Cliente</span>
              </Button>
              <Button 
                onClick={() => handleModuleClick('products')}
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
        </div>
      </div>

      <SalesForm 
        isOpen={showNewSaleModal}
        onClose={() => setShowNewSaleModal(false)}
      />
    </div>
  );
}