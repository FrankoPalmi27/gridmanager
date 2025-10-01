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
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, tokens } = useAuthStore();
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

  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPage]);

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
            <div
              className="fixed top-2.5 right-2.5 z-50 rounded-md border-2 border-white bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg cursor-pointer"
              onClick={() => setCurrentPage('complete-registration')}
            >
              🚨 CLICK HERE - OAuth Detected!
            </div>
          )}
          {renderCurrentPage()}
        </div>
    );
  }

  return (
    <div className="App">
      <div className="min-h-screen bg-gray-50">
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          onNavigate={setCurrentPage}
          activeItem={currentPage}
        />

        <div className="flex flex-col h-full ml-0 lg:ml-72 transition-all">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-4 sm:p-6">
              <div className="max-w-7xl mx-auto">
                {renderCurrentPage()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;