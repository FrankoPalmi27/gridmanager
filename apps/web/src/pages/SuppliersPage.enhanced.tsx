import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useSuppliersStore, Supplier } from '../stores/suppliersStore';

// Utility function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};

// Supplier categories (predefined but dynamic categories will be generated from existing suppliers)
const supplierCategories = [
  'Tecnología',
  'Oficina',
  'Servicios',
  'Materiales',
  'Logística',
  'Marketing',
  'Mantenimiento',
  'Otros'
];

// Balance Status Badge Component
const BalanceBadge = ({ balance }: { balance: number }) => {
  const getBalanceStatus = () => {
    if (balance > 0) return { text: `Nos deben ${formatCurrency(balance)}`, style: 'bg-green-100 text-green-800' };
    if (balance < 0) return { text: `Les debemos ${formatCurrency(Math.abs(balance))}`, style: 'bg-red-100 text-red-800' };
    return { text: 'Al día', style: 'bg-gray-100 text-gray-800' };
  };

  const status = getBalanceStatus();
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.style}`}>
      {status.text}
    </span>
  );
};

// Supplier Form Modal Component
function SupplierModal({ 
  isOpen, 
  closeModal, 
  supplier, 
  onSupplierSaved 
}: { 
  isOpen: boolean; 
  closeModal: () => void; 
  supplier?: Supplier;
  onSupplierSaved: (supplier: Supplier) => void;
}) {
  const isEdit = !!supplier;
  
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    businessName: supplier?.businessName || '',
    taxId: supplier?.taxId || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    contactPerson: supplier?.contactPerson || '',
    paymentTerms: supplier?.paymentTerms || 30,
    currentBalance: supplier?.currentBalance || 0,
    creditLimit: supplier?.creditLimit || 0,
    category: supplier?.category || supplierCategories[0],
    active: supplier?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const savedSupplier: Supplier = {
      id: supplier?.id || Date.now().toString(),
      ...formData,
      lastPurchaseDate: supplier?.lastPurchaseDate,
      totalPurchases: supplier?.totalPurchases || 0,
    };

    onSupplierSaved(savedSupplier);
    
    // Show success message
    alert(`Proveedor ${isEdit ? 'actualizado' : 'creado'} correctamente: ${formData.name}`);
    
    // Reset form if creating new supplier
    if (!isEdit) {
      setFormData({
        name: '',
        businessName: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: '',
        paymentTerms: 30,
        currentBalance: 0,
        creditLimit: 0,
        category: supplierCategories[0],
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-sm transition-all border border-gray-200">
                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-6">
                  {isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Comercial *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: TechDistributor SA"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Razón Social *
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Tech Distributor Sociedad Anónima"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CUIT/CUIL *
                      </label>
                      <input
                        type="text"
                        value={formData.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="20-12345678-9"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ventas@proveedor.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+54 11 1234-5678"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Persona de Contacto
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condiciones de Pago (días)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.paymentTerms}
                        onChange={(e) => handleInputChange('paymentTerms', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Saldo Actual
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.currentBalance}
                        onChange={(e) => handleInputChange('currentBalance', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Positivo = nos deben, Negativo = les debemos
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Límite de Crédito
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.creditLimit}
                        onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría
                      </label>
                      <input
                        type="text"
                        list="categories-list"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Escribir categoría o seleccionar existente"
                      />
                      <datalist id="categories-list">
                        {supplierCategories.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                      <p className="text-xs text-gray-500 mt-1">
                        Puedes escribir una nueva categoría o seleccionar de las existentes
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="active"
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => handleInputChange('active', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
                      />
                      <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                        Proveedor activo
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Dirección completa del proveedor..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      {isEdit ? 'Actualizar' : 'Crear'} Proveedor
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

export function SuppliersPage() {
  const { getSuppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliersStore();
  const suppliers = getSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [balanceFilter, setBalanceFilter] = useState('Todos'); // Todos, Deudores, Acreedores
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();

  const openModal = (supplier?: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(undefined);
  };

  const handleSupplierSaved = (savedSupplier: Supplier) => {
    if (editingSupplier) {
      // Update existing supplier
      updateSupplier(savedSupplier.id, savedSupplier);
    } else {
      // Add new supplier
      addSupplier(savedSupplier);
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier && confirm(`¿Estás seguro de eliminar el proveedor "${supplier.name}"?`)) {
      deleteSupplier(supplierId);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.taxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'Todas' || supplier.category === selectedCategory;
    
    const matchesBalance = balanceFilter === 'Todos' ||
                          (balanceFilter === 'Deudores' && supplier.currentBalance > 0) ||
                          (balanceFilter === 'Acreedores' && supplier.currentBalance < 0);
    
    return matchesSearch && matchesCategory && matchesBalance;
  });

  // Dynamic categories based on suppliers in the system
  const uniqueCategories = [...new Set(suppliers.map(s => s.category))].sort();
  const allCategories = ['Todas', ...uniqueCategories];
  
  const activeSuppliers = suppliers.filter(s => s.active).length;
  const totalDebt = suppliers.reduce((sum, s) => sum + (s.currentBalance < 0 ? Math.abs(s.currentBalance) : 0), 0);
  const totalCredit = suppliers.reduce((sum, s) => sum + (s.currentBalance > 0 ? s.currentBalance : 0), 0);
  const totalPurchasesAmount = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Gestión de Proveedores</h1>
            <p className="text-sm text-gray-500 mt-1">Administra tus proveedores y controla las cuentas por pagar</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Proveedores Activos</p>
                  <p className="text-2xl font-semibold text-gray-900">{activeSuppliers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Les Debemos</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalDebt)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Nos Deben</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalCredit)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Compras</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalPurchasesAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buscar por nombre, razón social, CUIT o contacto..."
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {allCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Todos">Todos los saldos</option>
                <option value="Deudores">Nos deben</option>
                <option value="Acreedores">Les debemos</option>
              </select>
            </div>
            
            <button 
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Proveedor
            </button>
          </div>

          {/* Suppliers Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CUIT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condiciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
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
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                    <div className="text-sm text-gray-500">{supplier.businessName}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {supplier.taxId}
                </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {supplier.contactPerson && <div>{supplier.contactPerson}</div>}
                    {supplier.email && <div className="text-gray-500">{supplier.email}</div>}
                    {supplier.phone && <div className="text-gray-500">{supplier.phone}</div>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {supplier.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div>{supplier.paymentTerms} días</div>
                    {supplier.creditLimit && supplier.creditLimit > 0 && (
                      <div className="text-xs text-gray-500">
                        Límite: {formatCurrency(supplier.creditLimit)}
                      </div>
                    )}
                  </div>
                </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                  <BalanceBadge balance={supplier.currentBalance} />
                </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {supplier.active ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Inactivo
                      </span>
                    )}
                    {supplier.lastPurchaseDate && (
                      <div className="text-xs text-gray-500">
                        Última compra: {new Date(supplier.lastPurchaseDate).toLocaleDateString('es-AR')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button 
                    onClick={() => openModal(supplier)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    Eliminar
                  </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSuppliers.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron proveedores</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCategory !== 'Todas' || balanceFilter !== 'Todos'
                    ? 'No hay proveedores que coincidan con los filtros aplicados.'
                    : 'Comienza agregando tu primer proveedor.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Supplier Modal */}
          <SupplierModal
            isOpen={isModalOpen}
            closeModal={closeModal}
            supplier={editingSupplier}
            onSupplierSaved={handleSupplierSaved}
          />
        </div>
      </div>
    </div>
  );
}