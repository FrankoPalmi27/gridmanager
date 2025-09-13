import { Fragment, useState, useEffect } from 'react';
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
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST', 'SELLER'] },
  { name: 'Ingresos', href: '/sales', icon: ArrowTrendingUpIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST', 'SELLER'] },
  { name: 'Egresos', href: '/purchases', icon: ArrowTrendingDownIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST'] },
  { name: 'Contactos - Clientes', href: '/customers', icon: UsersIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST', 'SELLER'] },
  { name: 'Contactos - Proveedores', href: '/suppliers', icon: UserGroupIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST'] },
  { name: 'Productos', href: '/products', icon: CubeIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST', 'SELLER'] },
  { name: 'Cuentas', href: '/accounts', icon: CreditCardIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST'] },
  { name: 'Informes', href: '/reports', icon: DocumentChartBarIcon, roles: ['ADMIN', 'MANAGER', 'ANALYST'] },
  { name: 'Usuarios', href: '/users', icon: UserGroupIcon, roles: ['ADMIN', 'MANAGER'] },
];

export function Sidebar({ open, setOpen }: SidebarProps) {
  const { user } = useAuthStore();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Grid Manager</h2>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-primary-100 text-primary-700 border-r-4 border-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
            onClick={() => setOpen(false)}
          >
            <item.icon className="flex-shrink-0 w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Versión 1.0.0</p>
          <p className="mt-1">© 2024 Grid Manager</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar overlay - only shows when open is true and on mobile */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 lg:hidden" onClose={setOpen}>
          {/* Background overlay */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          {/* Sliding sidebar panel */}
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white shadow-xl">
                  <SidebarContent />
                </div>
                
                {/* Close button outside the sidebar */}
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setOpen(false)}
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

      {/* Desktop sidebar - only show on large screens */}
      {isLargeScreen && (
        <div className="fixed inset-y-0 z-30 flex w-72 flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 shadow-sm">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}