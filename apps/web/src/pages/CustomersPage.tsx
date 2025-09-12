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
    phone: '',
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
      phone: '',
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
    
    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono es requerido';
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
      phone: customer.phone,
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
                    Contacto
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
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-medium text-gray-600">
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-gray-900 truncate">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <UserStatusBadge status={customer.status} />
                    <div className={`text-sm font-medium ${
                      customer.balance > 0 
                        ? 'text-green-600' 
                        : customer.balance < 0 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                    }`}>
                      {formatCurrency(customer.balance)}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewCustomer(customer)}
                  >
                    Ver
                  </Button>
                </div>
              </div>
            ))}
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
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xl font-medium text-gray-600">
                  {viewingCustomer.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{viewingCustomer.name}</h3>
                <p className="text-gray-500">{viewingCustomer.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-gray-900">{viewingCustomer.phone}</p>
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