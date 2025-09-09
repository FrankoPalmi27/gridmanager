import React, { useState, Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisHorizontalIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  ShareIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';

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

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completada',
          icon: CheckCircleIcon,
          className: 'status-badge completed',
        };
      case 'pending':
        return {
          label: 'Pendiente',
          icon: ClockIcon,
          className: 'status-badge pending',
        };
      case 'cancelled':
        return {
          label: 'Cancelada',
          icon: XCircleIcon,
          className: 'status-badge cancelled',
        };
      default:
        return {
          label: 'Desconocido',
          icon: ClockIcon,
          className: 'status-badge',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={config.className}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 opacity-0 group-hover:opacity-100"
      >
        <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10 animate-scale-up">
          <div className="py-2">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.action}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// New Sale Modal Component
function NewSaleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<Array<{id: number, quantity: number, price: number}>>([]);
  const [saleData, setSaleData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    discount: 0,
  });

  const handleAddProduct = (productId: number) => {
    const product = productsData.find(p => p.id === productId);
    if (product) {
      const existing = selectedProducts.find(p => p.id === productId);
      if (existing) {
        setSelectedProducts(selectedProducts.map(p => 
          p.id === productId ? { ...p, quantity: p.quantity + 1 } : p
        ));
      } else {
        setSelectedProducts([...selectedProducts, { id: productId, quantity: 1, price: product.price }]);
      }
    }
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const calculateTotal = () => {
    const subtotal = selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * saleData.discount) / 100;
    return subtotal - discountAmount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically submit to your API
    console.log('Nueva venta:', {
      client: selectedClient,
      products: selectedProducts,
      ...saleData,
      total: calculateTotal()
    });
    onClose();
    // Reset form
    setSelectedClient(null);
    setSelectedProducts([]);
    setSaleData({ date: new Date().toISOString().split('T')[0], notes: '', discount: 0 });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    Nueva Venta
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Client Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente *
                    </label>
                    <Listbox value={selectedClient} onChange={setSelectedClient}>
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          {selectedClient ? (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-700 font-semibold text-sm">
                                  {selectedClient.avatar}
                                </span>
                              </div>
                              <div>
                                <span className="block font-medium">{selectedClient.name}</span>
                                <span className="block text-sm text-gray-500">{selectedClient.email}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="block text-gray-400">Seleccionar cliente...</span>
                          )}
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {clientsData.map((client) => (
                              <Listbox.Option
                                key={client.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-3 pl-4 pr-4 ${
                                    active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                                  }`
                                }
                                value={client}
                              >
                                {({ selected }) => (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                      <span className="text-primary-700 font-semibold text-sm">
                                        {client.avatar}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <span className={`block ${selected ? 'font-semibold' : 'font-medium'}`}>
                                        {client.name}
                                      </span>
                                      <span className="block text-sm text-gray-500">{client.email}</span>
                                    </div>
                                  </div>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  {/* Products Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Productos
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {productsData.map((product) => (
                        <div key={product.id} className="flex items-center justify-between py-2">
                          <div className="flex-1">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddProduct(product.id)}
                            className="btn btn-sm btn-secondary"
                          >
                            Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Products */}
                  {selectedProducts.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Productos Seleccionados
                      </label>
                      <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                        {selectedProducts.map((item) => {
                          const product = productsData.find(p => p.id === item.id);
                          return (
                            <div key={item.id} className="flex items-center justify-between py-2">
                              <span className="font-medium">{product?.name}</span>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value);
                                    setSelectedProducts(selectedProducts.map(p => 
                                      p.id === item.id ? { ...p, quantity: newQuantity } : p
                                    ));
                                  }}
                                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(item.id)}
                                  className="text-error-600 hover:text-error-800"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Date and Notes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={saleData.date}
                        onChange={(e) => setSaleData({ ...saleData, date: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descuento (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={saleData.discount}
                        onChange={(e) => setSaleData({ ...saleData, discount: parseFloat(e.target.value) || 0 })}
                        className="input w-full"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas
                    </label>
                    <textarea
                      value={saleData.notes}
                      onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                      className="input w-full h-20 resize-none"
                      placeholder="Notas adicionales..."
                    />
                  </div>

                  {/* Total */}
                  {selectedProducts.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total:</span>
                        <span className="text-primary-600">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedClient || selectedProducts.length === 0}
                      className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Crear Venta
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
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
        <button className="btn btn-primary flex items-center gap-2 ripple-effect">
          <PlusIcon className="h-5 w-5" />
          Nueva Venta
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Quick filters */}
        <div className="flex gap-2 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeFilter === filter.id
                  ? 'bg-primary-100 text-primary-800 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filter.label}
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                {filter.count}
              </span>
            </button>
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
          <button className="btn btn-secondary flex items-center gap-2">
            <FunnelIcon className="h-5 w-5" />
            Filtros
          </button>
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
                    <StatusBadge status={sale.status} />
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
          <button 
            onClick={() => setIsNewSaleModalOpen(true)}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Venta
          </button>
        </div>
      )}
      
      {/* New Sale Modal */}
      <NewSaleModal 
        isOpen={isNewSaleModalOpen} 
        onClose={() => setIsNewSaleModalOpen(false)} 
      />
    </div>
  );
}