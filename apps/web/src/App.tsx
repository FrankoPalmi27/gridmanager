import React, { useState, useEffect } from 'react';
import { DashboardPage } from './pages/DashboardPage';
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
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { CompleteRegistrationPage } from './pages/CompleteRegistrationPage';
import { useAuthStore } from './store/authStore';
import { runAutoCleanup, hasLegacyData } from './lib/dataCleanup';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  ShopOutlined,
  UserOutlined,
  TeamOutlined,
  AppstoreOutlined,
  CreditCardOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const navigation = [
  {
    name: 'Dashboard',
    icon: <DashboardOutlined style={{ fontSize: '20px' }} />,
    component: 'dashboard'
  },
  {
    name: 'Ventas',
    icon: <ShoppingCartOutlined style={{ fontSize: '20px' }} />,
    component: 'sales'
  },
  {
    name: 'Clientes',
    icon: <UserOutlined style={{ fontSize: '20px' }} />,
    component: 'customers'
  },
  {
    name: 'Productos',
    icon: <AppstoreOutlined style={{ fontSize: '20px' }} />,
    component: 'products'
  },
  {
    name: 'Proveedores',
    icon: <ShopOutlined style={{ fontSize: '20px' }} />,
    component: 'suppliers'
  },
  {
    name: 'Compras',
    icon: <ShoppingOutlined style={{ fontSize: '20px' }} />,
    component: 'purchases'
  },
  {
    name: 'Cuentas',
    icon: <CreditCardOutlined style={{ fontSize: '20px' }} />,
    component: 'accounts'
  },
  {
    name: 'Reportes',
    icon: <BarChartOutlined style={{ fontSize: '20px' }} />,
    component: 'reports'
  },
  {
    name: 'Calculadora ML',
    icon: <CalculatorOutlined style={{ fontSize: '20px' }} />,
    component: 'calculator'
  },
  {
    name: 'Usuarios',
    icon: <SettingOutlined style={{ fontSize: '20px' }} />,
    component: 'users'
  },
];

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const { user, tokens, clearAuth } = useAuthStore();
  const isAuthenticated = !!(user && tokens);

  // Emergency detection with immediate check
  const hasGoogleId = window.location.search.includes('googleId');
  const shouldShowRegistration = hasGoogleId && currentPage === 'home';

  if (shouldShowRegistration) {
    // Force navigation immediately
    setTimeout(() => {
      setCurrentPage('complete-registration');
    }, 100);
  }

  useEffect(() => {
    // ✅ AUTO-LIMPIEZA DE DATOS LEGACY AL INICIAR LA APP
    const initCleanup = async () => {
      if (hasLegacyData()) {
        const result = await runAutoCleanup();
        if (result.cleaned) {
          // Mostrar notificación discreta al usuario
          setTimeout(() => {
            const notification = document.createElement('div');
            notification.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 12px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-family: system-ui; font-size: 14px;">
                ✅ Datos de demostración limpiados automáticamente
              </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 3000);
          }, 1000);
        }
      }
    };

    initCleanup();

    // Check for existing authentication from authStore
    if (isAuthenticated) {
      // Handle tenant-based routes by redirecting to simple routes
      const pathname = window.location.pathname;
      if (pathname.includes('/empresa/') && pathname.includes('/dashboard')) {
        window.history.replaceState({}, '', '/dashboard');
        setCurrentPage('dashboard');
        return; // Early return to avoid duplicate logic
      }

      setCurrentPage('dashboard');
    } else {
      // Check URL for special routes
      const pathname = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;

      // More aggressive detection
      if (pathname.includes('/auth/callback') || search.includes('accessToken')) {
        setCurrentPage('auth-callback');
      } else if (pathname.includes('/complete-registration') || search.includes('googleId')) {
        setCurrentPage('complete-registration');
      } else if (pathname.includes('/login')) {
        setCurrentPage('login');
      } else if (pathname.includes('/register')) {
        setCurrentPage('tenant-register');
      } else {
        setCurrentPage('home');
      }
    }
  }, [isAuthenticated]);

  // Additional effect to handle URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const search = window.location.search;

      if (search.includes('googleId') && !isAuthenticated) {
        setCurrentPage('complete-registration');
      }
    };

    // Listen for URL changes
    window.addEventListener('popstate', handleUrlChange);

    // Check immediately
    handleUrlChange();

    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [isAuthenticated]);

  const renderCurrentPage = () => {
    // Public pages (no authentication required)
    if (!isAuthenticated) {
      switch (currentPage) {
        case 'home':
          return <HomePage onNavigate={setCurrentPage} />;
        case 'login':
          return <TenantLoginPage onNavigate={setCurrentPage} />;
        case 'tenant-register':
          return <TenantRegisterPage onNavigate={setCurrentPage} />;
        case 'tenant-login':
          return <TenantLoginPage onNavigate={setCurrentPage} />;
        case 'auth-callback':
          return <AuthCallbackPage onNavigate={setCurrentPage} />;
        case 'complete-registration':
          return <CompleteRegistrationPage onNavigate={setCurrentPage} />;
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
        <div className="App">
          {/* Emergency button for OAuth callback */}
          {window.location.search.includes('googleId') && currentPage === 'home' && (
            <div style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              zIndex: 9999,
              background: 'red',
              color: 'white',
              padding: '10px',
              cursor: 'pointer',
              border: '2px solid white',
              borderRadius: '5px'
            }}
            onClick={() => setCurrentPage('complete-registration')}>
              🚨 CLICK HERE - OAuth Detected!
            </div>
          )}
          {renderCurrentPage()}
        </div>
    );
  }

  // For authenticated pages, render with sidebar
  return (
      <div className="App">
        <div className="min-h-screen flex" style={{ backgroundColor: 'var(--neutral-50)' }}>
        {/* Sidebar */}
        <div className="w-72 flex flex-col" style={{
          backgroundColor: 'var(--neutral-0)',
          borderRight: `1px solid var(--neutral-200)`,
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{
            padding: 'var(--spacing-6)',
            borderBottom: `1px solid var(--neutral-200)`,
            background: `linear-gradient(135deg, var(--primary-50) 0%, var(--neutral-0) 100%)`
          }}>
            <div className="flex items-center gap-3">
              <div style={{
                width: '32px',
                height: '32px',
                background: `linear-gradient(135deg, var(--primary-500), var(--primary-600))`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'var(--neutral-0)', fontSize: '14px', fontWeight: 'bold' }}>G</span>
              </div>
              <div>
                <h1 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--neutral-800)',
                  fontFamily: 'var(--font-primary)',
                  margin: 0
                }}>Grid Manager</h1>
                {user && (
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--neutral-500)',
                    margin: 0,
                    marginTop: 'var(--spacing-1)'
                  }}>{user.name}</p>
                )}
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--spacing-6)' }}>
            <div style={{
              padding: `0 var(--spacing-6)`,
              marginBottom: 'var(--spacing-4)'
            }}>
              <p style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--neutral-500)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--letter-spacing-wide)',
                margin: 0
              }}>
                Navegación
              </p>
            </div>

            <div style={{ paddingBottom: 'var(--spacing-6)' }}>
              {navigation.map((item) => (
                <button
                  key={item.component}
                  onClick={() => setCurrentPage(item.component)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    padding: `var(--spacing-3) var(--spacing-6)`,
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-primary)',
                    transition: 'var(--transition-colors)',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: currentPage === item.component ? `0 var(--radius-lg) var(--radius-lg) 0` : '0',
                    margin: currentPage === item.component ? `0 0 var(--spacing-2) var(--spacing-3)` : `0 0 var(--spacing-1) 0`,
                    backgroundColor: currentPage === item.component ? 'var(--primary-100)' : 'transparent',
                    color: currentPage === item.component ? 'var(--primary-700)' : 'var(--neutral-700)',
                    borderLeft: currentPage === item.component ? `3px solid var(--primary-500)` : '3px solid transparent',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== item.component) {
                      e.currentTarget.style.backgroundColor = 'var(--neutral-100)';
                      e.currentTarget.style.color = 'var(--neutral-800)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== item.component) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--neutral-700)';
                    }
                  }}
                >
                  <div style={{
                    marginRight: 'var(--spacing-3)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>{item.icon}</div>
                  {item.name}
                  {currentPage === item.component && (
                    <div style={{
                      position: 'absolute',
                      right: 'var(--spacing-4)',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-500)'
                    }} />
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* User Section */}
          <div style={{
            padding: 'var(--spacing-6)',
            borderTop: `1px solid var(--neutral-200)`,
            background: 'var(--neutral-50)'
          }}>
            <div className="flex items-center">
              <div style={{
                width: '40px',
                height: '40px',
                background: `linear-gradient(135deg, var(--secondary-500), var(--secondary-600))`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <span style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--neutral-0)'
                }}>
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div style={{ marginLeft: 'var(--spacing-3)', flex: 1 }}>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--neutral-800)',
                  margin: 0
                }}>
                  {user?.name || 'Usuario'}
                </p>
                <p style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--neutral-500)',
                  margin: 0,
                  textTransform: 'capitalize'
                }}>
                  {user?.role || 'usuario'}
                </p>
              </div>
              <button
                onClick={() => {
                  clearAuth();
                  setCurrentPage('home');
                }}
                style={{
                  color: 'var(--neutral-400)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition-colors)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--error-500)';
                  e.currentTarget.style.backgroundColor = 'var(--error-50)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--neutral-400)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Cerrar sesión"
              >
                <LogoutOutlined style={{ fontSize: '16px' }} />
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
  );
}

export default App;