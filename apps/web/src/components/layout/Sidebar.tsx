import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { NavLink } from 'react-router-dom';
import {
  XMarkIcon,
  HomeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CubeIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onNavigate?: (key: string) => void;
  activeItem?: string;
}

const navigation = [
  { key: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST', 'SELLER'] },
  { key: 'sales', name: 'Ingresos', href: '/sales', icon: ArrowTrendingUpIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST', 'SELLER'] },
  { key: 'purchases', name: 'Egresos', href: '/purchases', icon: ArrowTrendingDownIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST'] },
  { key: 'customers', name: 'Contactos - Clientes', href: '/customers', icon: UsersIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST', 'SELLER'] },
  { key: 'suppliers', name: 'Contactos - Proveedores', href: '/suppliers', icon: UserGroupIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST'] },
  { key: 'products', name: 'Productos', href: '/products', icon: CubeIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST', 'SELLER'] },
  { key: 'accounts', name: 'Cuentas', href: '/accounts', icon: CreditCardIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST'] },
  { key: 'reports', name: 'Informes', href: '/reports', icon: DocumentChartBarIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST'] },
  { key: 'users', name: 'Usuarios', href: '/users', icon: UserGroupIcon, roles: ['ADMIN', 'MANAGER'] },
];

export function Sidebar({ open, setOpen, onNavigate, activeItem }: SidebarProps) {
  const { user } = useAuthStore();

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const handleNavigate = (key: string) => {
    if (onNavigate) {
      onNavigate(key);
      setOpen(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header with gradient background */}
      <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <h2 className="text-xl font-bold tracking-tight">Grid Manager</h2>
        <button
          type="button"
          className="text-white/80 hover:text-white lg:hidden transition-colors p-1 rounded-md hover:bg-white/10"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation with improved styling */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => (
          onNavigate ? (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavigate(item.key)}
              className={`group flex w-full items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeItem === item.key
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}
            >
              <item.icon className="flex-shrink-0 w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
              <span className="truncate">{item.name}</span>
            </button>
          ) : (
            <NavLink
              key={item.key ?? item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                }`
              }
              onClick={() => setOpen(false)}
            >
              <item.icon className={`flex-shrink-0 w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110`} />
              <span className="truncate">{item.name}</span>
            </NavLink>
          )
        ))}
      </nav>

      {/* Footer with better styling */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="font-medium">Versión 1.0.0</p>
          <p className="mt-1 text-gray-500">© 2024 Grid Manager</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar overlay - only shows when open is true and on mobile */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          {/* Background overlay with improved animation */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          </Transition.Child>

          {/* Sliding sidebar panel with improved animation */}
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white shadow-2xl rounded-r-2xl">
                  <SidebarContent />
                </div>

                {/* Close button outside the sidebar - improved visibility */}
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-200"
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar menú"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar - hidden on mobile, visible on large screens */}
      <div className="hidden lg:flex fixed inset-y-0 z-30 w-72 flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 shadow-lg">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}