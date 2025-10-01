import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  UserCircleIcon, 
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ChevronRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';

// Breadcrumb component
function Breadcrumbs({ items }: { items: Array<{ name: string; href?: string }> }) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500">
      <HomeIcon className="h-4 w-4" />
      {items.map((item, index) => (
        <Fragment key={item.name}>
          <ChevronRightIcon className="h-3 w-3 text-gray-400 animate-fade-in" />
          <span 
            className={`${
              index === items.length - 1 
                ? 'text-gray-900 font-medium' 
                : 'text-gray-500 hover:text-gray-700 cursor-pointer'
            } transition-colors duration-200`}
          >
            {item.name}
          </span>
        </Fragment>
      ))}
    </nav>
  );
}

// Search component with Cmd+K shortcut
function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // TODO: Add keyboard shortcut handler for Cmd+K
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 w-full sm:min-w-64"
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
        Buscar...
        <kbd className="ml-auto hidden sm:inline-block text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300">
          ⌘K
        </kbd>
      </button>
      
      {/* TODO: Add search modal/dropdown */}
    </div>
  );
}

// Notifications dropdown
function NotificationsDropdown() {
  const [notifications] = useState([
    { id: 1, title: 'Nueva venta registrada', time: '5 min ago', unread: true },
    { id: 2, title: 'Reporte mensual listo', time: '1 hour ago', unread: true },
    { id: 3, title: 'Backup completado', time: '2 hours ago', unread: false },
  ]);
  
  const unreadCount = notifications.filter(n => n.unread).length;
  
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-error-500 rounded-full animate-pulse-soft" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-error-500 text-white text-xs font-medium rounded-full flex items-center justify-center animate-bounce-soft">
            {unreadCount}
          </span>
        )}
      </Menu.Button>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((notification) => (
              <Menu.Item key={notification.id}>
                <div className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                  notification.unread ? 'border-l-4 border-primary-500' : ''
                }`}>
                  <p className="text-sm text-gray-900">{notification.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

// Theme switcher
function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  
  const themes = [
    { value: 'light', icon: SunIcon, label: 'Claro' },
    { value: 'dark', icon: MoonIcon, label: 'Oscuro' },
    { value: 'auto', icon: ComputerDesktopIcon, label: 'Auto' },
  ];
  
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200">
        {themes.find(t => t.value === theme)?.icon && (
          React.createElement(themes.find(t => t.value === theme)!.icon, { className: "h-6 w-6" })
        )}
      </Menu.Button>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-32 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {themes.map((themeOption) => (
            <Menu.Item key={themeOption.value}>
              <button
                onClick={() => setTheme(themeOption.value as any)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
                  theme === themeOption.value 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                } transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg`}
              >
                <themeOption.icon className="h-4 w-4" />
                {themeOption.label}
              </button>
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  // Mock breadcrumb data - in real app this would come from router
  const breadcrumbItems = [
    { name: 'Dashboard' },
    // { name: 'Ventas', href: '/sales' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      {/* Main header */}
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Hamburger button - Only visible on mobile (< 1024px) */}
            <button
              type="button"
              className="lg:hidden p-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 touch-target flex items-center justify-center"
              onClick={onMenuClick}
              aria-label="Abrir menú"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Bars3Icon className="h-7 w-7" />
            </button>

            <div className="flex-shrink-0">
              <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Grid Manager
              </h1>
            </div>

            {/* Global Search */}
            <div className="hidden sm:block">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4">
            <div className="hidden xl:block text-sm text-gray-500">
              Hola, <span className="font-medium text-gray-900">{user?.name}</span>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse-soft" />
                <span className="text-xs">En línea</span>
              </div>
            </div>
            
            {/* Notifications - Hidden on mobile to save space */}
            <div className="hidden sm:block">
              <NotificationsDropdown />
            </div>
            
            {/* Theme switcher - Hidden on mobile to save space */}
            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>
            
            {/* User menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'ADMIN' ? 'Admin' :
                     user?.role === 'MANAGER' ? 'Manager' :
                     user?.role === 'ANALYST' ? 'Analista' : 'Vendedor'}
                  </p>
                </div>
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-50 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-sm text-gray-900 font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {user?.role === 'ADMIN' ? 'Administrador' :
                         user?.role === 'MANAGER' ? 'Gerente' :
                         user?.role === 'ANALYST' ? 'Analista' : 'Vendedor'}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-success-500 rounded-full" />
                        <span className="text-xs text-success-600">Activo</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200`}
                        >
                          Mi Perfil
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200`}
                        >
                          Configuración
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                  
                  <div className="border-t border-gray-100">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200`}
                          onClick={handleLogout}
                        >
                          Cerrar sesión
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="px-4 sm:px-6 py-2 bg-gray-50 border-t border-gray-100">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
    </header>
  );
}