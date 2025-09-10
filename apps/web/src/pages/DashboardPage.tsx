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
  const { dashboardStats } = useSales();
  
  // Mock data to prevent API calls that cause infinite reloads
  const mockStats = [
    {
      name: 'Total Disponible',
      value: '$125,000',
      rawValue: 125000,
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12.5%'
    },
    {
      name: 'Cuentas',
      value: '8',
      rawValue: 8,
      icon: '💳',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Deudas Clientes',
      value: '$35,000',
      rawValue: 35000,
      icon: '👥',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'Deudas Proveedores',
      value: '$18,500',
      rawValue: 18500,
      icon: '🏢',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const moduleCards = [
    {
      name: 'Centro de Ventas',
      description: 'Gestiona ventas, presupuestos y clientes',
      icon: '💼',
      path: 'sales',
      isNew: true,
      progress: 75
    },
    {
      name: 'Inventario',
      description: 'Control de productos y stock',
      icon: '📦',
      path: 'products',
      progress: 90
    },
    {
      name: 'Clientes',
      description: 'Base de datos de clientes',
      icon: '👥',
      path: 'customers',
      progress: 85
    },
    {
      name: 'Proveedores',
      description: 'Gestión de proveedores',
      icon: '🏢',
      path: 'suppliers',
      progress: 70
    },
    {
      name: 'Reportes',
      description: 'Análisis y reportes avanzados',
      icon: '📊',
      path: 'reports',
      isBeta: true,
      progress: 60
    },
    {
      name: 'Configuración',
      description: 'Ajustes del sistema',
      icon: '⚙️',
      path: 'users',
      progress: 95
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mockStats.map((stat, index) => (
            <div key={stat.name} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
                  {stat.change && (
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  )}
                </div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moduleCards.map((module, index) => (
              <div 
                key={module.name} 
                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => handleModuleClick(module.path)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-2xl">{module.icon}</div>
                  <div className="flex gap-2">
                    {module.isNew && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Nuevo
                      </span>
                    )}
                    {module.isBeta && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                        Beta
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Configuración</span>
                    <span>{module.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${module.progress}%` }}
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full group-hover:shadow-md"
                  variant="primary"
                >
                  Explorar
                  <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            ))}
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