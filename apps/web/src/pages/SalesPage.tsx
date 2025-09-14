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
  TrashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@ui/Button';
import { SaleStatusBadge } from '@ui/StatusBadge';
import { SalesForm } from '@forms/SalesForm';
import { formatCurrency } from '@lib/formatters';
import { useSales } from '@store/SalesContext';
import { useProductsStore } from '@store/productsStore';
import { generateInvoicePDF } from '@utils/pdfGenerator';
import { useTableScroll } from '@hooks/useTableScroll';

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
    cobrado: 25000,
    aCobrar: 0,
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
    cobrado: 20000,
    aCobrar: 25000,
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
    cobrado: 0,
    aCobrar: 18500,
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
  const { updateSaleStatus, deleteSale } = useSales();

  const handleDeleteSale = () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la venta ${sale.number}? Esta acción no se puede deshacer.`)) {
      deleteSale(sale.id);
    }
  };

  const getStatusActions = () => {
    const baseActions = [
      { icon: PencilIcon, label: 'Editar', action: () => onEdit(sale) },
      { icon: DocumentDuplicateIcon, label: 'Duplicar', action: () => {} /* TODO: Implement duplicate functionality */ },
      { icon: ShareIcon, label: 'Compartir', action: () => {} /* TODO: Implement share functionality */ },
      { icon: TrashIcon, label: 'Eliminar', action: handleDeleteSale, className: 'text-red-600 hover:text-red-700' },
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
                className={`justify-start gap-2 w-full px-4 py-2 text-sm h-auto ${
                  action.className || ''
                }`}
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

// Status dropdown component
function StatusDropdown({ sale }: { sale: any }) {
  const { updateSaleStatus } = useSales();
  
  const handleStatusChange = (newStatus: 'completed' | 'pending' | 'cancelled') => {
    updateSaleStatus(sale.id, newStatus);
  };

  const statusOptions = [
    { value: 'completed', label: 'Completada', color: 'bg-green-100 text-green-800' },
    { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'cancelled', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <select
      value={sale.status}
      onChange={(e) => handleStatusChange(e.target.value as 'completed' | 'pending' | 'cancelled')}
      className="px-3 py-1 rounded-full text-sm font-medium border-0 bg-transparent focus:ring-2 focus:ring-blue-500"
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SalesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { tableScrollRef, scrollLeft, scrollRight } = useTableScroll();
  
  // Get real sales data from context
  const { sales, deleteSale } = useSales();
  const { products } = useProductsStore();
  
  // Migrate existing sales to include new payment fields if missing
  const migratedSales = sales.map(sale => ({
    ...sale,
    cobrado: sale.cobrado !== undefined ? sale.cobrado : 
             (sale.paymentStatus === 'paid' ? sale.amount : 0),
    aCobrar: sale.aCobrar !== undefined ? sale.aCobrar : 
             (sale.paymentStatus === 'paid' ? 0 : sale.amount)
  }));

  // Combine mock data with real sales for display
  const allSales = [...salesData, ...migratedSales];
  
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

  // Scroll functions now provided by useTableScroll hook

  const handleDeleteSale = (sale: any) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la venta ${sale.number}?`)) {
      deleteSale(sale.id);
    }
  };

  const handlePreviewPDF = (sale: any) => {
    try {
      const pdfBlob = generateInvoicePDF(sale);
      // Create a blob URL and open in new window for preview
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl, '_blank');
      if (newWindow) {
        newWindow.document.title = `Factura ${sale.number}`;
      }
      // Clean up the URL after some time
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      // Fallback to download if preview fails
      generateInvoicePDF(sale);
    }
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Ventas Hoy */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Ventas Hoy</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(migratedSales.filter(sale => {
                    const today = new Date().toISOString().split('T')[0];
                    return sale.date.startsWith(today);
                  }).reduce((sum, sale) => sum + sale.amount, 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Total Ventas Mes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Ventas Mes</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(migratedSales.filter(sale => {
                    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
                    return sale.date.startsWith(currentMonth);
                  }).reduce((sum, sale) => sum + sale.amount, 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Ventas Pendientes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pendientes</h3>
                <p className="text-2xl font-bold text-gray-900">{pendingSalesCount}</p>
              </div>
            </div>
          </div>

          {/* Ticket Promedio */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Ticket Promedio</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {migratedSales.length > 0 
                    ? formatCurrency(migratedSales.reduce((sum, sale) => sum + sale.amount, 0) / migratedSales.length)
                    : formatCurrency(0)
                  }
                </p>
              </div>
            </div>
          </div>
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Ventas</h3>
            
            {/* Horizontal Navigation Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 mr-3">Navegación horizontal:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollLeft}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
              >
                ← Izquierda
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollRight}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
              >
                Derecha →
              </Button>
            </div>
          </div>
        
          <div className="relative">
            <div 
              ref={tableScrollRef}
              className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#D1D5DB #F3F4F6',
                maxWidth: '100%',
                width: '100%'
              }}
            >
              <table className="divide-y divide-gray-200" style={{ minWidth: '1500px', width: 'max-content' }}>
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('number')}
                  style={{ width: '180px', minWidth: '180px' }}
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
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('client')}
                  style={{ width: '200px', minWidth: '200px' }}
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
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('date')}
                  style={{ width: '150px', minWidth: '150px' }}
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                  Items
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('amount')}
                  style={{ width: '150px', minWidth: '150px' }}
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                  Cobrado
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                  A Cobrar
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('status')}
                  style={{ width: '130px', minWidth: '130px' }}
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
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '280px', minWidth: '280px' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap" style={{ width: '180px', minWidth: '180px' }}>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreviewPDF(sale)}
                        className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center mr-4"
                        title="Previsualizar PDF"
                      >
                        <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                      </Button>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{sale.number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap" style={{ width: '200px', minWidth: '200px' }}>
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{sale.client.name}</div>
                        <div className="text-sm text-gray-500">{sale.client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap" style={{ width: '150px', minWidth: '150px' }}>
                    <div className="text-sm text-gray-900">
                      {new Date(sale.date).toLocaleDateString('es-AR')}
                    </div>
                    {sale.seller && (
                      <div className="text-sm text-gray-500">
                        Vendedor: {sale.seller.initials}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap" style={{ width: '160px', minWidth: '160px' }}>
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
                  <td className="px-4 py-4 whitespace-nowrap" style={{ width: '140px', minWidth: '140px' }}>
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
                  <td className="px-4 py-4 whitespace-nowrap" style={{ width: '120px', minWidth: '120px' }}>
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(sale.cobrado || 0)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap" style={{ width: '120px', minWidth: '120px' }}>
                    <div className="text-sm font-medium text-orange-600">
                      {formatCurrency(sale.aCobrar || 0)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap" style={{ width: '130px', minWidth: '130px' }}>
                    <StatusDropdown sale={sale} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ width: '270px', minWidth: '270px' }}>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900 mr-2"
                      onClick={() => handleEditSale(sale)}
                    >
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900 mr-2"
                      onClick={() => handleDeleteSale(sale)}
                    >
                      Eliminar
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