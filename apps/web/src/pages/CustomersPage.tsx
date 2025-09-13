import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { UserStatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/formatters';
import { useSales } from '../store/SalesContext';
import { useCustomersStore, Customer } from '../store/customersStore';


export function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  
  // Use the centralized customers store
  const { customers, addCustomer, updateCustomer, deleteCustomer, stats } = useCustomersStore();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    celular: '',
    balance: 0,
    status: 'active' as 'active' | 'inactive',
    address: '',
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Get sales data to calculate updated balances
  const { sales } = useSales();
  
  // Calculate updated customer balances based on sales
  const customersWithUpdatedBalances = useMemo(() => {
    return customers.map(customer => {
      // Find sales for this customer
      const customerSales = sales.filter(sale => 
        sale.client.name === customer.name
      );
      
      // Calculate total sales amount for this customer
      const totalSales = customerSales.reduce((sum, sale) => sum + sale.amount, 0);
      
      // Update balance (assuming sales increase customer debt/balance)
      return {
        ...customer,
        balance: customer.balance + totalSales
      };
    });
  }, [customers, sales]);

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      celular: '',
      balance: 0,
      status: 'active',
      address: '',
      notes: ''
    });
    setFormErrors({});
    setEditingCustomer(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    
    if (!formData.celular.trim()) {
      errors.celular = 'El celular es requerido';
    }
    
    // Check if email already exists (excluding current customer when editing)
    const emailExists = customers.some(customer => 
      customer.email === formData.email && customer.id !== editingCustomer?.id
    );
    
    if (emailExists) {
      errors.email = 'Este email ya está registrado';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingCustomer) {
        // Update existing customer
        updateCustomer(editingCustomer.id, formData);
      } else {
        // Add new customer
        addCustomer(formData);
      }
      
      handleCloseModal();
      
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      celular: customer.celular || customer.phone,
      balance: customer.balance,
      status: customer.status,
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
    setIsViewModalOpen(true);
  };

  const filteredCustomers = customersWithUpdatedBalances.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewCustomer = () => {
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-sm sm:text-base text-gray-600">Gestiona tu base de datos de clientes</p>
          </div>
          <Button
            onClick={handleNewCustomer}
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
          >
            + Nuevo Cliente
          </Button>
        </div>

        {/* Customer Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Clientes</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Clientes Activos</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Balance Positivo</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.positiveBalance}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Balance Negativo</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.negativeBalance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Clientes</h3>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Celular
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.celular || customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        customer.balance > 0 
                          ? 'text-green-600' 
                          : customer.balance < 0 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                      }`}>
                        {formatCurrency(customer.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UserStatusBadge status={customer.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        Ver
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? 'No se encontraron clientes con ese filtro.' : 'Comienza agregando tu primer cliente.'}
                      </p>
                      {!searchTerm && (
                        <Button
                          onClick={handleNewCustomer}
                          variant="primary"
                        >
                          + Nuevo Cliente
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-4 p-4">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  {/* Header with name and status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {customer.name}
                      </h3>
                    </div>
                    <UserStatusBadge status={customer.status} />
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{customer.celular || customer.phone}</span>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">Balance:</span>
                    <span className={`text-lg font-bold ${
                      customer.balance > 0 
                        ? 'text-green-600' 
                        : customer.balance < 0 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                    }`}>
                      {formatCurrency(customer.balance)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-3 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewCustomer(customer)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'No se encontraron clientes con ese filtro.' : 'Comienza agregando tu primer cliente.'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={handleNewCustomer}
                    variant="primary"
                  >
                    + Nuevo Cliente
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Create/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal} disabled={loading} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {editingCustomer ? "Actualizar" : "Crear"} Cliente
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre Completo"
            value={formData.name}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, name: e.target.value }));
              if (formErrors.name) {
                setFormErrors(prev => ({ ...prev, name: '' }));
              }
            }}
            error={formErrors.name}
            disabled={loading}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, email: e.target.value }));
              if (formErrors.email) {
                setFormErrors(prev => ({ ...prev, email: '' }));
              }
            }}
            error={formErrors.email}
            disabled={loading}
            required
          />

          <Input
            label="Celular"
            value={formData.celular}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, celular: e.target.value }));
              if (formErrors.celular) {
                setFormErrors(prev => ({ ...prev, celular: '' }));
              }
            }}
            error={formErrors.celular}
            disabled={loading}
            required
          />

          <Input
            label="Balance Inicial"
            type="number"
            step="0.01"
            value={formData.balance.toString()}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }));
            }}
            disabled={loading}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* View Customer Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingCustomer(null);
        }}
        title="Detalles del Cliente"
        size="md"
        footer={
          <Button 
            variant="primary" 
            onClick={() => {
              setIsViewModalOpen(false);
              setViewingCustomer(null);
            }}
            className="w-full sm:w-auto"
          >
            Cerrar
          </Button>
        }
      >
        {viewingCustomer && (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{viewingCustomer.name}</h3>
              <p className="text-gray-500">{viewingCustomer.email}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{viewingCustomer.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Celular</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900">{viewingCustomer.celular || viewingCustomer.phone}</p>
                  {(viewingCustomer.celular || viewingCustomer.phone) && (
                    <a
                      href={`https://wa.me/${(viewingCustomer.celular || viewingCustomer.phone).replace(/\s/g, '').replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <div className="mt-1">
                  <UserStatusBadge status={viewingCustomer.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Balance Actual</label>
                <p className={`text-lg font-semibold ${
                  viewingCustomer.balance > 0 
                    ? 'text-green-600' 
                    : viewingCustomer.balance < 0 
                      ? 'text-red-600' 
                      : 'text-gray-900'
                }`}>
                  {formatCurrency(customersWithUpdatedBalances.find(c => c.id === viewingCustomer.id)?.balance || 0)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ventas Realizadas</label>
                <p className="text-gray-900">
                  {sales.filter(sale => sale.client.name === viewingCustomer.name).length} ventas
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Historial de Ventas</h4>
              <div className="max-h-32 overflow-y-auto">
                {sales.filter(sale => sale.client.name === viewingCustomer.name).length > 0 ? (
                  <div className="space-y-2">
                    {sales.filter(sale => sale.client.name === viewingCustomer.name).map(sale => (
                      <div key={sale.id} className="flex justify-between text-sm">
                        <span>{sale.number}</span>
                        <span>{formatCurrency(sale.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay ventas registradas</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}