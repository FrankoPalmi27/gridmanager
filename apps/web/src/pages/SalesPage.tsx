import React, { useState, Fragment } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { SaleStatusBadge } from '../components/ui/StatusBadge';
import { SalesForm } from '../components/forms/SalesForm';
import { formatCurrency } from '../lib/formatters';

// Mock data
const salesData = [
  {
    id: 1,
    number: 'VTA-2024-001',
    client: { name: 'Juan Pérez', avatar: 'JP', email: 'juan@email.com' },
    amount: 25000,
    date: '2024-01-15',
    status: 'completed',
    seller: { name: 'Ana García', initials: 'AG' },
    items: 3,
    sparkline: [120, 150, 180, 200, 250],
  },
  {
    id: 2,
    number: 'VTA-2024-002',
    client: { name: 'María López', avatar: 'ML', email: 'maria@email.com' },
    amount: 45000,
    date: '2024-01-16',
    status: 'pending',
    seller: { name: 'Carlos Ruiz', initials: 'CR' },
    items: 7,
    sparkline: [80, 100, 120, 140, 450],
  },
  {
    id: 3,
    number: 'VTA-2024-003',
    client: { name: 'Pedro Martín', avatar: 'PM', email: 'pedro@email.com' },
    amount: 18500,
    date: '2024-01-17',
    status: 'cancelled',
    seller: { name: 'Ana García', initials: 'AG' },
    items: 2,
    sparkline: [150, 140, 130, 120, 185],
  },
];

// Mock data for clients and products
const clientsData = [
  { id: 1, name: 'Juan Pérez', email: 'juan@email.com', avatar: 'JP' },
  { id: 2, name: 'María López', email: 'maria@email.com', avatar: 'ML' },
  { id: 3, name: 'Pedro Martín', email: 'pedro@email.com', avatar: 'PM' },
];

const productsData = [
  { id: 1, name: 'Producto A', price: 1500, stock: 50 },
  { id: 2, name: 'Producto B', price: 2500, stock: 30 },
  { id: 3, name: 'Producto C', price: 3500, stock: 20 },
];

const filters = [
  { id: 'all', label: 'Todas', count: 15 },
  { id: 'pending', label: 'Pendientes', count: 5 },
  { id: 'completed', label: 'Completadas', count: 8 },
  { id: 'cancelled', label: 'Canceladas', count: 2 },
];

// Mini sparkline component
function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 60;
    const y = 20 - (value / max) * 15;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-16 h-6 text-primary-500" viewBox="0 0 60 20">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}


// Quick actions dropdown
function QuickActions({ sale }: { sale: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: DocumentDuplicateIcon, label: 'Duplicar', action: () => console.log('Duplicar') },
    { icon: ArchiveBoxIcon, label: 'Archivar', action: () => console.log('Archivar') },
    { icon: ShareIcon, label: 'Compartir', action: () => console.log('Compartir') },
  ];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="opacity-0 group-hover:opacity-100"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10 animate-scale-up">
          <div className="py-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant="ghost"
                onClick={action.action}
                className="justify-start gap-2 w-full px-4 py-2 text-sm h-auto"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export function SalesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);

  const filteredSales = salesData.filter(sale => {
    if (activeFilter !== 'all' && sale.status !== activeFilter) return false;
    if (searchTerm && !sale.client.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centro de Ventas</h1>
          <p className="text-gray-600">Gestiona tus ventas, presupuestos y clientes</p>
        </div>
        <Button 
          onClick={() => setIsNewSaleModalOpen(true)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Venta
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Quick filters */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              variant={activeFilter === filter.id ? "primary" : "ghost"}
              className="flex items-center gap-2"
            >
              {filter.label}
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {filter.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Search and filters */}
        <div className="flex gap-3 lg:ml-auto">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {filteredSales.map((sale, index) => (
          <div
            key={sale.id}
            className="card p-6 hover:shadow-lg transition-all duration-300 group animate-stagger"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              {/* Main info */}
              <div className="flex items-center gap-4 flex-1">
                {/* Client avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-sm">
                      {sale.client.avatar}
                    </span>
                  </div>
                </div>

                {/* Sale details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sale.number}
                    </h3>
                    <SaleStatusBadge status={sale.status as 'completed' | 'pending' | 'cancelled' | 'draft'} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <UserCircleIcon className="h-4 w-4" />
                      {sale.client.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDaysIcon className="h-4 w-4" />
                      {new Date(sale.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      {sale.items} artículos
                    </span>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Tendencia 7 días</div>
                    <MiniSparkline data={sale.sparkline} />
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(sale.amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Vendedor: {sale.seller.initials}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <QuickActions sale={sale} />
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredSales.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron ventas
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? `No hay ventas que coincidan con "${searchTerm}"`
              : 'Crea tu primera venta para comenzar'}
          </p>
          <Button 
            onClick={() => setIsNewSaleModalOpen(true)}
            variant="primary"
            className="inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Venta
          </Button>
        </div>
      )}
      
      <SalesForm 
        isOpen={isNewSaleModalOpen} 
        onClose={() => setIsNewSaleModalOpen(false)} 
      />
    </div>
  );
}