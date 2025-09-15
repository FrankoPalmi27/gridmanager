import React, { useState, useEffect } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { SalesProvider } from './store/SalesContext';
import { SalesPage } from './pages/SalesPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { AccountsPage } from './pages/AccountsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { HomePage } from './pages/HomePage';
import { TenantRegisterPage } from './pages/TenantRegisterPage';
import { TenantLoginPage } from './pages/TenantLoginPage';

const navigation = [
  { 
    name: 'Dashboard', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ), 
    component: 'dashboard' 
  },
  { 
    name: 'Ventas', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), 
    component: 'sales' 
  },
  { 
    name: 'Clientes', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ), 
    component: 'customers' 
  },
  { 
    name: 'Productos', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ), 
    component: 'products' 
  },
  { 
    name: 'Proveedores', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ), 
    component: 'suppliers' 
  },
  { 
    name: 'Compras', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
      </svg>
    ), 
    component: 'purchases' 
  },
  { 
    name: 'Cuentas', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ), 
    component: 'accounts' 
  },
  { 
    name: 'Reportes', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ), 
    component: 'reports' 
  },
  { 
    name: 'Calculadora ML', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ), 
    component: 'calculator' 
  },
  { 
    name: 'Usuarios', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ), 
    component: 'users' 
  },
];

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tenantData, setTenantData] = useState(null);

  useEffect(() => {
    // Check for existing authentication
    const tokens = localStorage.getItem('gridmanager_tokens');
    const tenant = localStorage.getItem('gridmanager_tenant');

    if (tokens && tenant) {
      setIsAuthenticated(true);
      setTenantData(JSON.parse(tenant));
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('home');
    }
  }, []);

  const renderCurrentPage = () => {
    // Public pages (no authentication required)
    if (!isAuthenticated) {
      switch (currentPage) {
        case 'home':
          return <HomePage onNavigate={setCurrentPage} />;
        case 'tenant-register':
          return <TenantRegisterPage onNavigate={setCurrentPage} />;
        case 'tenant-login':
          return <TenantLoginPage onNavigate={setCurrentPage} />;
        default:
          return <HomePage onNavigate={setCurrentPage} />;
      }
    }

    // Protected pages (authentication required)
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'sales':
        return <SalesPage />;
      case 'customers':
        return <CustomersPage />;
      case 'products':
        return <ProductsPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'calculator':
        return <CalculatorPage />;
      case 'users':
        return <UsersPage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  // For public pages, render without sidebar
  if (!isAuthenticated) {
    return (
      <SalesProvider>
        <div className="App">
          {renderCurrentPage()}
        </div>
      </SalesProvider>
    );
  }

  // For authenticated pages, render with sidebar
  return (
    <SalesProvider>
      <div className="App">
        <div className="min-h-screen bg-gray-50/30 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">Grid Manager</h1>
            {tenantData && (
              <p className="text-xs text-gray-500 mt-1">{tenantData.name}</p>
            )}
          </div>

          <nav className="pt-6">
            <div className="px-6 mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Navegación
              </p>
            </div>

            <div className="space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.component}
                  onClick={() => setCurrentPage(item.component)}
                  className={`w-full flex items-center px-6 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    currentPage === item.component
                      ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="mr-3">{item.icon}</div>
                  {item.name}
                </button>
              ))}
            </div>
          </nav>

          {/* User Section */}
          <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {tenantData?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {tenantData?.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">
                  {tenantData?.slug || 'empresa'}
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('gridmanager_tokens');
                  localStorage.removeItem('gridmanager_user');
                  localStorage.removeItem('gridmanager_tenant');
                  setIsAuthenticated(false);
                  setTenantData(null);
                  setCurrentPage('home');
                }}
                className="text-gray-400 hover:text-gray-600"
                title="Cerrar sesión"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {renderCurrentPage()}
        </div>
      </div>
      </div>
    </SalesProvider>
  );
}

export default App;