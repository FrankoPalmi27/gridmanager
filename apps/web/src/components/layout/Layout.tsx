import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen bg-gray-50">
      {/* DEBUG BUTTON - SUPER VISIBLE */}
      <button
        onClick={() => setSidebarOpen(true)}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 999999,
          width: '100px',
          height: '100px',
          backgroundColor: 'red',
          border: '10px solid yellow',
          borderRadius: '10px',
          fontSize: '40px',
          cursor: 'pointer',
          boxShadow: '0 0 50px rgba(255,0,0,0.8)'
        }}
      >
        ☰
      </button>

      {/* Sidebar component */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main content area - full width on mobile, with left margin on desktop */}
      <div className="flex flex-col h-full ml-0 lg:ml-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}