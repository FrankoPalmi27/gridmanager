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
  ClockIcon,
  XMarkIcon,
  CheckIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { SaleStatusBadge } from '../components/ui/StatusBadge';
import { SalesForm } from '../components/forms/SalesForm';
import { formatCurrency } from '../lib/formatters';
import { useSales } from '../store/SalesContext';
import { useProductsStore } from '../store/productsStore';

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
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'completed', label: 'Completadas' },
  { id: 'cancelled', label: 'Canceladas' },
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
function QuickActions({ sale, onEdit }: { sale: any; onEdit: (sale: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { updateSaleStatus } = useSales();

  const getStatusActions = () => {
    const baseActions = [
      { icon: PencilIcon, label: 'Editar', action: () => onEdit(sale) },
      { icon: DocumentDuplicateIcon, label: 'Duplicar', action: () => console.log('Duplicar', sale.id) },
      { icon: ShareIcon, label: 'Compartir', action: () => console.log('Compartir', sale.id) },
    ];

    // Add status-specific actions
    if (sale.status === 'completed') {
      baseActions.push(
        { icon: ClockIcon, label: 'Marcar Pendiente', action: () => updateSaleStatus(sale.id, 'pending') },
        { icon: XMarkIcon, label: 'Cancelar', action: () => updateSaleStatus(sale.id, 'cancelled') }
      );
    } else if (sale.status === 'pending') {
      baseActions.push(
        { icon: CheckIcon, label: 'Completar', action: () => updateSaleStatus(sale.id, 'completed') },
        { icon: XMarkIcon, label: 'Cancelar', action: () => updateSaleStatus(sale.id, 'cancelled') }
      );
    } else if (sale.status === 'cancelled') {
      baseActions.push(
        { icon: CheckIcon, label: 'Completar', action: () => updateSaleStatus(sale.id, 'completed') },
        { icon: ClockIcon, label: 'Marcar Pendiente', action: () => updateSaleStatus(sale.id, 'pending') }
      );
    }

    return baseActions;
  };

  const actions = getStatusActions();

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
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
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


type SortField = 'number' | 'client' | 'date' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

export function SalesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Get real sales data from context
  const { sales } = useSales();
  const { products } = useProductsStore();
  
  // Combine mock data with real sales for display
  const allSales = [...salesData, ...sales];
  
  // Calculate pending sales count dynamically
  const pendingSalesCount = allSales.filter(sale => sale.status === 'pending').length;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedSales = allSales
    .filter(sale => {
      if (activeFilter !== 'all' && sale.status !== activeFilter) return false;
      if (searchTerm && !sale.client.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle different data types
      if (sortField === 'amount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortField === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'client') {
        aValue = String(a.client.name).toLowerCase();
        bValue = String(b.client.name).toLowerCase();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleEditSale = (sale: any) => {
    setEditingSale(sale);
    setIsNewSaleModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsNewSaleModalOpen(false);
    setEditingSale(null);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
            <p className="text-gray-600">Gestiona tus ventas, presupuestos y clientes</p>
          </div>
          <Button 
            onClick={() => {
              setEditingSale(null);
              setIsNewSaleModalOpen(true);
            }}
            variant="primary"
          >
            + Nueva Venta
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                {filter.id === 'pending' && (
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {pendingSalesCount}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Search and filters */}
          <div className="flex gap-3 lg:ml-auto">
            <div className="relative flex-1 sm:flex-none">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
              />
            </div>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Ventas</h3>
          </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('number')}
                >
                  <div className="flex items-center gap-1">
                    <span>Venta</span>
                    {sortField === 'number' && (
                      <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('client')}
                >
                  <div className="flex items-center gap-1">
                    <span>Cliente</span>
                    {sortField === 'client' && (
                      <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Fecha</span>
                    {sortField === 'date' && (
                      <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-1">
                    <span>Total</span>
                    {sortField === 'amount' && (
                      <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    <span>Estado</span>
                    {sortField === 'status' && (
                      <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c0 .621-.504 1.125-1.125 1.125H18a2.25 2.25 0 01-2.25-2.25M6 7.5H3v11.25A2.25 2.25 0 005.25 21h11.25A2.25 2.25 0 0018 18.75v-1.875" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{sale.number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {sale.client.avatar}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{sale.client.name}</div>
                        <div className="text-sm text-gray-500">{sale.client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(sale.date).toLocaleDateString('es-AR')}
                    </div>
                    {sale.seller && (
                      <div className="text-sm text-gray-500">
                        Vendedor: {sale.seller.initials}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{sale.items} productos</div>
                    {sale.salesChannel && (
                      <div className="text-sm text-gray-500 capitalize">
                        Canal: {sale.salesChannel === 'store' ? 'Tienda' : 
                               sale.salesChannel === 'online' ? 'Online' :
                               sale.salesChannel === 'phone' ? 'Teléfono' :
                               sale.salesChannel === 'whatsapp' ? 'WhatsApp' : 'Otro'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(sale.amount)}
                    </div>
                    {sale.paymentMethod && (
                      <div className="text-sm text-gray-500 capitalize">
                        {sale.paymentMethod === 'cash' ? 'Efectivo' :
                         sale.paymentMethod === 'transfer' ? 'Transferencia' :
                         sale.paymentMethod === 'card' ? 'Tarjeta' :
                         sale.paymentMethod === 'check' ? 'Cheque' : 'Otro'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SaleStatusBadge status={sale.status as 'completed' | 'pending' | 'cancelled' | 'draft'} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900 mr-2"
                      onClick={() => handleEditSale(sale)}
                    >
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-900 mr-2">
                      Facturar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedSales.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || activeFilter !== 'all' ? 'No se encontraron ventas con esos filtros.' : 'Comienza registrando tu primera venta.'}
            </p>
            <div className="mt-6">
              <Button 
                onClick={() => {
                  setEditingSale(null);
                  setIsNewSaleModalOpen(true);
                }}
                variant="primary"
                className="inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Nueva Venta
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
      
      <SalesForm 
        isOpen={isNewSaleModalOpen} 
        onClose={handleCloseModal}
        editingSale={editingSale}
      />
    </div>
  );
}