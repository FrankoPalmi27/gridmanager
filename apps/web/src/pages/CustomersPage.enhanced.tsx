import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

// Utility function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};

// Customer interface
interface Customer {
  id: string;
  name: string;
  businessName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  currentBalance: number; // saldo actual (positivo = nos debe, negativo = le debemos)
  creditLimit?: number;
  customerType: string; // Consumidor Final, Responsable Inscripto, etc.
  active: boolean;
  registrationDate: string;
  lastSaleDate?: string;
  totalSales: number;
}

// Customer types (following Argentina's tax system)
const customerTypes = [
  'Consumidor Final',
  'Responsable Inscripto',
  'Exento',
  'Monotributo',
  'No Responsable',
  'Exterior'
];

// Mock data for customers
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    businessName: 'Juan Pérez - Comercio',
    taxId: '20-12345678-9',
    email: 'juan.perez@email.com',
    phone: '+54 11 4567-8900',
    address: 'Av. Corrientes 1234, CABA',
    birthDate: '1985-03-15',
    currentBalance: 15000, // Nos debe
    creditLimit: 50000,
    customerType: 'Responsable Inscripto',
    active: true,
    registrationDate: '2023-01-15',
    lastSaleDate: '2024-01-20',
    totalSales: 125000
  },
  {
    id: '2',
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+54 11 5678-9012',
    address: 'Calle Falsa 567, San Isidro',
    currentBalance: 0, // Al día
    creditLimit: 25000,
    customerType: 'Consumidor Final',
    active: true,
    registrationDate: '2023-02-20',
    lastSaleDate: '2024-01-18',
    totalSales: 89000
  },
  {
    id: '3',
    name: 'Carlos Silva',
    businessName: 'Silva y Asociados SRL',
    taxId: '20-87654321-0',
    email: 'carlos@silvayasoc.com',
    phone: '+54 11 6789-0123',
    address: 'Av. Santa Fe 890, Palermo',
    currentBalance: -5000, // Le debemos
    creditLimit: 75000,
    customerType: 'Responsable Inscripto',
    active: true,
    registrationDate: '2023-03-10',
    lastSaleDate: '2024-01-15',
    totalSales: 245000
  },
  {
    id: '4',
    name: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    phone: '+54 11 7890-1234',
    address: 'Mitre 345, Vicente López',
    currentBalance: 8500, // Nos debe
    creditLimit: 30000,
    customerType: 'Monotributo',
    active: true,
    registrationDate: '2023-04-05',
    lastSaleDate: '2024-01-10',
    totalSales: 67000
  },
  {
    id: '5',
    name: 'Roberto López',
    businessName: 'López Construcciones',
    taxId: '20-11223344-5',
    email: 'roberto@lopezconstrucciones.com',
    phone: '+54 11 8901-2345',
    address: 'Ruta 8 Km 50, Pilar',
    currentBalance: 22000, // Nos debe
    customerType: 'Responsable Inscripto',
    active: false,
    registrationDate: '2022-12-20',
    lastSaleDate: '2023-11-30',
    totalSales: 180000
  }
];

// Balance Status Badge Component
const BalanceBadge = ({ balance }: { balance: number }) => {
  const getBalanceStatus = () => {
    if (balance > 0) return { text: `Nos debe ${formatCurrency(balance)}`, style: 'bg-yellow-100 text-yellow-800' };
    if (balance < 0) return { text: `Le debemos ${formatCurrency(Math.abs(balance))}`, style: 'bg-red-100 text-red-800' };
    return { text: 'Al día', style: 'bg-green-100 text-green-800' };
  };

  const status = getBalanceStatus();
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.style}`}>
      {status.text}
    </span>
  );
};

// Customer Form Modal Component
function CustomerModal({ 
  isOpen, 
  closeModal, 
  customer, 
  onCustomerSaved 
}: { 
  isOpen: boolean; 
  closeModal: () => void; 
  customer?: Customer;
  onCustomerSaved: (customer: Customer) => void;
}) {
  const isEdit = !!customer;
  
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    businessName: customer?.businessName || '',
    taxId: customer?.taxId || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    birthDate: customer?.birthDate || '',
    currentBalance: customer?.currentBalance || 0,
    creditLimit: customer?.creditLimit || 0,
    customerType: customer?.customerType || customerTypes[0],
    active: customer?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const savedCustomer: Customer = {
      id: customer?.id || Date.now().toString(),
      ...formData,
      registrationDate: customer?.registrationDate || new Date().toISOString().split('T')[0],
      lastSaleDate: customer?.lastSaleDate,
      totalSales: customer?.totalSales || 0,
    };

    onCustomerSaved(savedCustomer);
    
    // Show success message
    alert(`Cliente ${isEdit ? 'actualizado' : 'creado'} correctamente: ${formData.name}`);
    
    // Reset form if creating new customer
    if (!isEdit) {
      setFormData({
        name: '',
        businessName: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        birthDate: '',
        currentBalance: 0,
        creditLimit: 0,
        customerType: customerTypes[0],
        active: true,
      });
    }
    
    closeModal();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <div className="fixed inset-0 bg-black/50" />
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white border border-gray-200 p-6 text-left align-middle shadow-sm transition-all">
                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-6">
                  {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Juan Pérez"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Razón Social
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Para clientes empresas"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        CUIT/CUIL/DNI
                      </label>
                      <input
                        type="text"
                        value={formData.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="20-12345678-9"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Tipo de Cliente
                      </label>
                      <input
                        type="text"
                        list="customer-types-list"
                        value={formData.customerType}
                        onChange={(e) => handleInputChange('customerType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Escribir tipo o seleccionar existente"
                      />
                      <datalist id="customer-types-list">
                        {customerTypes.map((type) => (
                          <option key={type} value={type} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="cliente@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="+54 11 1234-5678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Saldo Actual
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.currentBalance}
                        onChange={(e) => handleInputChange('currentBalance', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Positivo = nos debe, Negativo = le debemos
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Límite de Crédito
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.creditLimit}
                        onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        id="active"
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => handleInputChange('active', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
                      />
                      <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                        Cliente activo
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Dirección
                    </label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Dirección completa del cliente..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      {isEdit ? 'Actualizar' : 'Crear'} Cliente
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

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [balanceFilter, setBalanceFilter] = useState('Todos'); // Todos, Deudores, Acreedores
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  const openModal = (customer?: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(undefined);
  };

  const handleCustomerSaved = (savedCustomer: Customer) => {
    if (editingCustomer) {
      // Update existing customer
      setCustomers(prev => prev.map(c => c.id === savedCustomer.id ? savedCustomer : c));
    } else {
      // Add new customer
      setCustomers(prev => [savedCustomer, ...prev]);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer && confirm(`¿Estás seguro de eliminar el cliente "${customer.name}"?`)) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.businessName && customer.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (customer.taxId && customer.taxId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'Todos' || customer.customerType === selectedType;
    
    const matchesBalance = balanceFilter === 'Todos' ||
                          (balanceFilter === 'Deudores' && customer.currentBalance > 0) ||
                          (balanceFilter === 'Acreedores' && customer.currentBalance < 0) ||
                          (balanceFilter === 'Al día' && customer.currentBalance === 0);
    
    return matchesSearch && matchesType && matchesBalance;
  });

  // Dynamic customer types based on existing customers (with dynamic filter rule)
  const uniqueTypes = [...new Set(customers.map(c => c.customerType))].sort();
  const allTypes = ['Todos', ...uniqueTypes];
  
  const activeCustomers = customers.filter(c => c.active).length;
  const totalDebt = customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  const totalCredit = customers.reduce((sum, c) => sum + (c.currentBalance < 0 ? Math.abs(c.currentBalance) : 0), 0);
  const totalSalesAmount = customers.reduce((sum, c) => sum + c.totalSales, 0);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Administra tus clientes y controla las cuentas por cobrar</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Clientes Activos</p>
                <p className="text-2xl font-semibold text-gray-900">{activeCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nos Deben</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalDebt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Les Debemos</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalCredit)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Ventas</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalSalesAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Buscar por nombre, razón social, CUIT o email..."
              />
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {allTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="Todos">Todos los saldos</option>
              <option value="Deudores">Nos deben</option>
              <option value="Acreedores">Les debemos</option>
              <option value="Al día">Al día</option>
            </select>
          </div>
          
          <button 
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Cliente
          </button>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Identificación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crédito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      {customer.businessName && (
                        <div className="text-sm text-gray-500">{customer.businessName}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.taxId || 'No especificado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.email && <div>{customer.email}</div>}
                      {customer.phone && <div className="text-gray-500">{customer.phone}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {customer.customerType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <BalanceBadge balance={customer.currentBalance} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.creditLimit && customer.creditLimit > 0 
                      ? formatCurrency(customer.creditLimit)
                      : 'Sin límite'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {customer.active ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Inactivo
                        </span>
                      )}
                      {customer.lastSaleDate && (
                        <div className="text-xs text-gray-500">
                          Última venta: {new Date(customer.lastSaleDate).toLocaleDateString('es-AR')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => openModal(customer)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No se encontraron clientes</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedType !== 'Todos' || balanceFilter !== 'Todos'
                  ? 'No hay clientes que coincidan con los filtros aplicados.'
                  : 'Comienza agregando tu primer cliente.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Customer Modal */}
        <CustomerModal
          isOpen={isModalOpen}
          closeModal={closeModal}
          customer={editingCustomer}
          onCustomerSaved={handleCustomerSaved}
        />
      </div>
    </div>
  );
}