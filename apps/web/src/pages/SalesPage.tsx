import React, { useState, Fragment } from 'react';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CopyOutlined,
  InboxOutlined,
  ShareAltOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CheckOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CaretUpOutlined
} from '@ant-design/icons';
import { Button } from '@ui/Button';
import { SaleStatusBadge } from '@ui/StatusBadge';
import { SalesForm } from '@forms/SalesForm';
import { formatCurrency } from '@lib/formatters';
import { useSalesStore } from '@store/salesStore';
import { useProductsStore } from '@store/productsStore';
import { useTableScroll } from '@hooks/useTableScroll';

// ✅ DATOS LIMPIOS - Sin datos precargados de demostración

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
  const { updateSaleStatus, deleteSale } = useSalesStore();

  const handleDeleteSale = () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la venta ${sale.number}? Esta acción no se puede deshacer.`)) {
      deleteSale(sale.id);
    }
  };

  const getStatusActions = () => {
    const baseActions = [
      { icon: EditOutlined, label: 'Editar', action: () => onEdit(sale) },
      { icon: CopyOutlined, label: 'Duplicar', action: () => {} /* TODO: Implement duplicate functionality */ },
      { icon: ShareAltOutlined, label: 'Compartir', action: () => {} /* TODO: Implement share functionality */ },
      { icon: DeleteOutlined, label: 'Eliminar', action: handleDeleteSale, className: 'text-red-600 hover:text-red-700' },
    ];

    // Add status-specific actions
    if (sale.status === 'completed') {
      baseActions.push(
        { icon: ClockCircleOutlined, label: 'Marcar Pendiente', action: () => updateSaleStatus(sale.id, 'pending') },
        { icon: CloseOutlined, label: 'Cancelar', action: () => updateSaleStatus(sale.id, 'cancelled') }
      );
    } else if (sale.status === 'pending') {
      baseActions.push(
        { icon: CheckOutlined, label: 'Completar', action: () => updateSaleStatus(sale.id, 'completed') },
        { icon: CloseOutlined, label: 'Cancelar', action: () => updateSaleStatus(sale.id, 'cancelled') }
      );
    } else if (sale.status === 'cancelled') {
      baseActions.push(
        { icon: CheckOutlined, label: 'Completar', action: () => updateSaleStatus(sale.id, 'completed') },
        { icon: ClockCircleOutlined, label: 'Marcar Pendiente', action: () => updateSaleStatus(sale.id, 'pending') }
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
        <MoreOutlined className="h-5 w-5" />
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
  const { updateSaleStatus } = useSalesStore();
  
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
  const { sales, deleteSale } = useSalesStore();
  const { products } = useProductsStore();
  
  // Migrate existing sales to include new payment fields if missing
  const migratedSales = sales.map(sale => ({
    ...sale,
    cobrado: sale.cobrado !== undefined ? sale.cobrado : 
             (sale.paymentStatus === 'paid' ? sale.amount : 0),
    aCobrar: sale.aCobrar !== undefined ? sale.aCobrar : 
             (sale.paymentStatus === 'paid' ? 0 : sale.amount),
    salesChannel: sale.salesChannel || 'store',
    paymentMethod: sale.paymentMethod || 'cash'
  }));

  // ✅ USAR SOLO DATOS REALES - Sin mock data
  const allSales = migratedSales;
  
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
    // Create a comprehensive HTML invoice for PDF printing (similar to ReportsPage)
    const invoiceWindow = window.open('', '_blank');
    const invoiceData = {
      sale,
      generatedDate: new Date().toLocaleDateString('es-AR'),
      generatedTime: new Date().toLocaleTimeString('es-AR')
    };

    // Helper functions for display
    const getSalesChannelName = (channel?: string) => {
      switch (channel) {
        case 'store': return 'Tienda física';
        case 'online': return 'Online';
        case 'phone': return 'Teléfono';
        case 'whatsapp': return 'WhatsApp';
        case 'other': return 'Otro';
        default: return 'No especificado';
      }
    };

    const getPaymentMethodName = (method?: string) => {
      switch (method) {
        case 'cash': return 'Efectivo';
        case 'transfer': return 'Transferencia';
        case 'card': return 'Tarjeta';
        case 'check': return 'Cheque';
        case 'other': return 'Otro';
        default: return 'No especificado';
      }
    };

    const getPaymentStatusName = (status?: string) => {
      switch (status) {
        case 'paid': return 'Pagado';
        case 'pending': return 'Pendiente';
        case 'partial': return 'Parcial';
        default: return 'No especificado';
      }
    };

    const getStatusName = (status: string) => {
      switch (status) {
        case 'completed': return 'Completada';
        case 'pending': return 'Pendiente';
        case 'cancelled': return 'Cancelada';
        default: return status;
      }
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proforma ${sale.number} - Grid Manager</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #3B82F6;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #1F2937;
              margin-bottom: 5px;
            }
            .company-subtitle {
              font-size: 14px;
              color: #6B7280;
              margin-bottom: 20px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              color: #3B82F6;
              margin-bottom: 10px;
            }
            .invoice-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .invoice-number {
              font-size: 16px;
              font-weight: bold;
              color: #374151;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1F2937;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #E5E7EB;
            }
            .detail-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            .detail-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
            }
            .detail-label {
              font-weight: 600;
              color: #374151;
            }
            .detail-value {
              color: #6B7280;
            }
            .total-section {
              background-color: #F3F4F6;
              padding: 20px;
              border-radius: 8px;
              margin: 30px 0;
              text-align: center;
            }
            .total-amount {
              font-size: 32px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 10px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-completed {
              background-color: #D1FAE5;
              color: #065F46;
            }
            .status-pending {
              background-color: #FEF3C7;
              color: #92400E;
            }
            .status-cancelled {
              background-color: #FEE2E2;
              color: #991B1B;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #6B7280;
              border-top: 1px solid #E5E7EB;
              padding-top: 20px;
            }
            .actions {
              text-align: center;
              margin-bottom: 30px;
            }
            .btn {
              background-color: #3B82F6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              margin: 0 10px;
              transition: background-color 0.2s;
            }
            .btn:hover {
              background-color: #2563EB;
            }
            .btn-secondary {
              background-color: #6B7280;
            }
            .btn-secondary:hover {
              background-color: #4B5563;
            }
            @media print {
              body { background-color: white; }
              .actions { display: none; }
              .invoice-container {
                box-shadow: none;
                margin: 0;
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="actions">
              <button class="btn" onclick="window.print()">
                🖨️ Imprimir / Guardar como PDF
              </button>
              <button class="btn btn-secondary" onclick="window.close()">
                ✕ Cerrar
              </button>
            </div>

            <div class="header">
              <div class="company-name">GRID MANAGER</div>
              <div class="company-subtitle">Sistema de Gestión Empresarial</div>
              <div class="invoice-title">PROFORMA DE VENTA</div>
            </div>

            <div class="invoice-meta">
              <div>
                <div class="invoice-number">Número: ${sale.number}</div>
                <div>Fecha: ${new Date(sale.date).toLocaleDateString('es-AR')}</div>
              </div>
              <div>
                <div class="status-badge status-${sale.status}">
                  ${getStatusName(sale.status)}
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">📋 Información del Cliente</div>
              <div class="detail-item">
                <span class="detail-label">Cliente:</span>
                <span class="detail-value">${sale.client.name}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${sale.client.email}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">🛍️ Detalles de la Venta</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Cantidad de items:</span>
                  <span class="detail-value">${sale.items}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Canal de venta:</span>
                  <span class="detail-value">${getSalesChannelName(sale.salesChannel)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Método de pago:</span>
                  <span class="detail-value">${getPaymentMethodName(sale.paymentMethod)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Estado del pago:</span>
                  <span class="detail-value">${getPaymentStatusName(sale.paymentStatus)}</span>
                </div>
                ${sale.seller ? `
                <div class="detail-item">
                  <span class="detail-label">Vendedor:</span>
                  <span class="detail-value">${sale.seller.name}</span>
                </div>
                ` : ''}
              </div>
            </div>

            ${(sale.cobrado !== undefined && sale.aCobrar !== undefined) ? `
            <div class="section">
              <div class="section-title">💰 Seguimiento de Pagos</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Monto cobrado:</span>
                  <span class="detail-value" style="color: #059669; font-weight: 600;">${formatCurrency(sale.cobrado)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Monto a cobrar:</span>
                  <span class="detail-value" style="color: #DC2626; font-weight: 600;">${formatCurrency(sale.aCobrar)}</span>
                </div>
              </div>
            </div>
            ` : ''}

            <div class="total-section">
              <div class="total-amount">${formatCurrency(sale.amount)}</div>
              <div style="color: #6B7280; font-weight: 600;">TOTAL DE LA VENTA</div>
            </div>

            <div class="footer">
              <p>Este documento es una proforma generada automáticamente por Grid Manager</p>
              <p>Generado el: ${invoiceData.generatedDate} a las ${invoiceData.generatedTime}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    invoiceWindow?.document.write(htmlContent);
    invoiceWindow?.document.close();
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ventas</h1>
            <p className="text-sm sm:text-base text-gray-600">Gestiona tus ventas, presupuestos y clientes</p>
          </div>
          <Button
            onClick={() => {
              setEditingSale(null);
              setIsNewSaleModalOpen(true);
            }}
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
          >
            + Nueva Venta
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Ventas Hoy */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <DollarOutlined className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 truncate">Ventas Hoy</h3>
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
                <BarChartOutlined className="w-6 h-6 text-green-600" />
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
                <ClockCircleOutlined className="w-6 h-6 text-orange-600" />
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
                <BarChartOutlined className="w-6 h-6 text-purple-600" />
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
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Lista de Ventas</h3>
          </div>

          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden lg:block relative">
            <div
              ref={tableScrollRef}
              className="overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#D1D5DB #F3F4F6',
                maxWidth: '100%',
                width: '100%',
                maxHeight: '600px'
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
                      <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
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
                      <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
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
                      <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
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
                      <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
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
                      <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
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
                        <FileTextOutlined className="w-5 h-5 text-blue-600" />
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

          {filteredAndSortedSales.length === 0 && (
            <div className="text-center py-12">
              <DollarOutlined className="mx-auto h-12 w-12 text-gray-400" />
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
                  <PlusOutlined className="h-5 w-5" />
                  Nueva Venta
                </Button>
              </div>
            </div>
          )}
            </div>
          </div>

          {/* Mobile Cards - Shown on mobile/tablet only */}
          <div className="lg:hidden p-4 space-y-4">
            {filteredAndSortedSales.length > 0 ? (
              filteredAndSortedSales.map((sale) => (
                <div key={sale.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  {/* Header with sale number and status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreviewPDF(sale)}
                          className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0"
                          title="Previsualizar PDF"
                        >
                          <FileTextOutlined className="w-4 h-4 text-blue-600" />
                        </Button>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {sale.number}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500">{sale.client.name}</p>
                    </div>
                    <StatusDropdown sale={sale} />
                  </div>

                  {/* Sale details grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Fecha</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(sale.date).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Items</p>
                      <p className="text-sm font-medium text-gray-900">{sale.items} productos</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(sale.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Canal</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {sale.salesChannel === 'store' ? 'Tienda' :
                         sale.salesChannel === 'online' ? 'Online' :
                         sale.salesChannel === 'phone' ? 'Teléfono' :
                         sale.salesChannel === 'whatsapp' ? 'WhatsApp' : 'Otro'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cobrado</p>
                      <p className="text-sm font-medium text-green-600">{formatCurrency(sale.cobrado || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">A Cobrar</p>
                      <p className="text-sm font-medium text-orange-600">{formatCurrency(sale.aCobrar || 0)}</p>
                    </div>
                  </div>

                  {/* Payment method */}
                  {sale.paymentMethod && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Método de pago</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {sale.paymentMethod === 'cash' ? 'Efectivo' :
                         sale.paymentMethod === 'transfer' ? 'Transferencia' :
                         sale.paymentMethod === 'card' ? 'Tarjeta' :
                         sale.paymentMethod === 'check' ? 'Cheque' : 'Otro'}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50 touch-target"
                      onClick={() => handleEditSale(sale)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-green-600 border-green-600 hover:bg-green-50 touch-target"
                    >
                      Facturar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50 touch-target"
                      onClick={() => handleDeleteSale(sale)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <DollarOutlined className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-base font-medium text-gray-900 mb-2">No hay ventas</h3>
                <p className="text-sm text-gray-500">
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
                    <PlusOutlined className="h-5 w-5" />
                    Nueva Venta
                  </Button>
                </div>
              </div>
            )}
          </div>
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