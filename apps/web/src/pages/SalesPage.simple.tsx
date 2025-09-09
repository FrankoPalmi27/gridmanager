import React, { useState, Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';

// Utility function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};

// Mock data for clients
const mockClients = [
  { id: '1', name: 'Juan Pérez', email: 'juan@email.com' },
  { id: '2', name: 'María García', email: 'maria@email.com' },
  { id: '3', name: 'Carlos López', email: 'carlos@email.com' },
  { id: '4', name: 'Ana Martínez', email: 'ana@email.com' },
];

// Mock data for products
const mockProducts = [
  { id: '1', name: 'Laptop HP EliteBook', sku: 'HP-001', price: 85000, stock: 15, category: 'Electrónicos' },
  { id: '2', name: 'Mouse Inalámbrico Logitech', sku: 'LOG-002', price: 3500, stock: 50, category: 'Accesorios' },
  { id: '3', name: 'Teclado Mecánico RGB', sku: 'KB-003', price: 12000, stock: 25, category: 'Accesorios' },
  { id: '4', name: 'Monitor 24" Full HD', sku: 'MON-004', price: 45000, stock: 8, category: 'Electrónicos' },
  { id: '5', name: 'Auriculares Sony WH-1000XM4', sku: 'SONY-005', price: 28000, stock: 12, category: 'Audio' },
  { id: '6', name: 'Webcam HD 1080p', sku: 'CAM-006', price: 8500, stock: 30, category: 'Accesorios' },
  { id: '7', name: 'Smartphone Samsung Galaxy', sku: 'SAM-007', price: 75000, stock: 20, category: 'Móviles' },
  { id: '8', name: 'Tablet iPad Air', sku: 'IPD-008', price: 95000, stock: 6, category: 'Tablets' },
];

// Sale item interface
interface SaleItem {
  product: typeof mockProducts[0];
  quantity: number;
  subtotal: number;
}

// NewSaleModal component
function NewSaleModal({ isOpen, closeModal, onSaleCreated }: { 
  isOpen: boolean; 
  closeModal: () => void; 
  onSaleCreated: (sale: any) => void; 
}) {
  const [selectedClient, setSelectedClient] = useState(mockClients[0]);
  const [selectedProduct, setSelectedProduct] = useState(mockProducts[0]);
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<SaleItem[]>([]);

  const addItem = () => {
    if (quantity > 0 && quantity <= selectedProduct.stock) {
      const newItem: SaleItem = {
        product: selectedProduct,
        quantity: quantity,
        subtotal: selectedProduct.price * quantity,
      };
      
      // Check if product already exists in items
      const existingItemIndex = items.findIndex(item => item.product.id === selectedProduct.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].product.price * updatedItems[existingItemIndex].quantity;
        setItems(updatedItems);
      } else {
        // Add new item
        setItems([...items, newItem]);
      }
      
      // Reset product selection
      setQuantity(1);
    }
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(item => item.product.id !== productId));
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Debes agregar al menos un producto a la venta');
      return;
    }
    
    // Create new sale object
    const totalAmount = getTotalAmount();
    const newSale = {
      id: Date.now(), // Simple ID generation
      number: `VTA-2024-${String(Date.now()).slice(-3)}`,
      client: { name: selectedClient.name, email: selectedClient.email },
      amount: totalAmount,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      seller: { name: 'Usuario Demo' },
      items: items.length,
    };

    // Call the callback to add the sale
    onSaleCreated(newSale);
    
    // Show success message
    alert(`Nueva venta creada para ${selectedClient.name} por ${formatCurrency(totalAmount)}\nProductos: ${items.length} artículos`);
    
    // Reset form and close modal
    setItems([]);
    setQuantity(1);
    closeModal();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Nueva Venta
                </Dialog.Title>

                <div className="space-y-6">
                  {/* Cliente Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente
                    </label>
                    <Listbox value={selectedClient} onChange={setSelectedClient}>
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                          <span className="block truncate">{selectedClient.name}</span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-20">
                            {mockClients.map((client) => (
                              <Listbox.Option
                                key={client.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                  }`
                                }
                                value={client}
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {client.name}
                                    </span>
                                    <span className="block truncate text-xs text-gray-500">{client.email}</span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  {/* Product Selection */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar Productos</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Producto</label>
                        <Listbox value={selectedProduct} onChange={setSelectedProduct}>
                          <div className="relative">
                            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300">
                              <span className="block truncate">{selectedProduct.name}</span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                              </span>
                            </Listbox.Button>
                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm z-30">
                                {mockProducts.map((product) => (
                                  <Listbox.Option
                                    key={product.id}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-3 pr-4 ${
                                        active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                      }`
                                    }
                                    value={product}
                                  >
                                    {({ selected }) => (
                                      <div>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {product.name}
                                        </span>
                                        <span className="block truncate text-xs text-gray-500">
                                          {formatCurrency(product.price)} • Stock: {product.stock}
                                        </span>
                                      </div>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          max={selectedProduct.stock}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addItem}
                          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Agregar
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Precio: {formatCurrency(selectedProduct.price)} • Stock disponible: {selectedProduct.stock} unidades
                    </div>
                  </div>

                  {/* Items List */}
                  {items.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Productos Seleccionados</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {items.map((item) => (
                          <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                              <div className="text-xs text-gray-500">
                                {item.quantity} × {formatCurrency(item.product.price)} = {formatCurrency(item.subtotal)}
                              </div>
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-red-600 hover:text-red-800 text-sm px-2 py-1 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="border-t mt-3 pt-3">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total:</span>
                          <span className="text-blue-600">{formatCurrency(getTotalAmount())}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={items.length === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Crear Venta {items.length > 0 && `(${formatCurrency(getTotalAmount())})`}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Mock data
const salesData = [
  {
    id: 1,
    number: 'VTA-2024-001',
    client: { name: 'Juan Pérez', email: 'juan@email.com' },
    amount: 25000,
    date: '2024-01-15',
    status: 'completed',
    seller: { name: 'Ana García' },
    items: 3,
  },
  {
    id: 2,
    number: 'VTA-2024-002',
    client: { name: 'María López', email: 'maria@email.com' },
    amount: 45000,
    date: '2024-01-16',
    status: 'pending',
    seller: { name: 'Carlos Ruiz' },
    items: 7,
  },
  {
    id: 3,
    number: 'VTA-2024-003',
    client: { name: 'Pedro Martín', email: 'pedro@email.com' },
    amount: 18500,
    date: '2024-01-17',
    status: 'cancelled',
    seller: { name: 'Laura Gómez' },
    items: 2,
  },
  {
    id: 4,
    number: 'VTA-2024-004',
    client: { name: 'Sofia Hernández', email: 'sofia@email.com' },
    amount: 32000,
    date: '2024-01-18',
    status: 'completed',
    seller: { name: 'Miguel Torres' },
    items: 5,
  },
  {
    id: 5,
    number: 'VTA-2024-005',
    client: { name: 'Roberto Silva', email: 'roberto@email.com' },
    amount: 67500,
    date: '2024-01-19',
    status: 'pending',
    seller: { name: 'Ana García' },
    items: 9,
  },
];

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(status)}`}>
      {getStatusText(status)}
    </span>
  );
};

export function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [sales, setSales] = useState(salesData);

  const openNewSaleModal = () => setIsNewSaleModalOpen(true);
  const closeNewSaleModal = () => setIsNewSaleModalOpen(false);

  const handleSaleCreated = (newSale: any) => {
    setSales([newSale, ...sales]);
  };

  const filteredSales = sales.filter(sale =>
    sale.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Registro de Ventas</h1>
          <p className="text-sm text-gray-500">Gestiona y visualiza todas las ventas realizadas</p>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar por número o cliente..."
            />
          </div>
          
          <button 
            onClick={openNewSaleModal}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nueva Venta
          </button>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Artículos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sale.number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{sale.client.name}</div>
                        <div className="text-sm text-gray-500">{sale.client.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(sale.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={sale.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.seller.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.items} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-700 mr-3 transition-colors">
                        Ver
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 mr-3 transition-colors">
                        Editar
                      </button>
                      <button className="text-red-600 hover:text-red-700 transition-colors">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron ventas</h3>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'No hay ventas que coincidan con tu búsqueda.' : 'Aún no tienes ventas registradas.'}
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completadas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {salesData.filter(s => s.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pendientes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {salesData.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Ventas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(salesData.reduce((sum, sale) => sum + sale.amount, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Promedio</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sales.length > 0 ? formatCurrency(sales.reduce((sum, sale) => sum + sale.amount, 0) / sales.length) : formatCurrency(0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* New Sale Modal */}
        <NewSaleModal 
          isOpen={isNewSaleModalOpen} 
          closeModal={closeNewSaleModal} 
          onSaleCreated={handleSaleCreated}
        />
      </div>
    </div>
  );
}