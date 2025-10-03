import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatTaxId, formatPhoneNumber } from '../lib/formatters';
import { useSuppliersStore } from '../store/suppliersStore';
import { useTableScroll } from '../hooks/useTableScroll';
import BulkSupplierImport from '../components/BulkSupplierImport';

interface SupplierFormData {
  name: string;
  businessName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  paymentTerms: number;
  creditLimit: number;
  active: boolean;
}

export function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, loadSuppliers, isLoading } = useSuppliersStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const { tableScrollRef } = useTableScroll();
  const hasRequestedInitialLoad = useRef(false);

  // Load suppliers on mount
  useEffect(() => {
    if (hasRequestedInitialLoad.current || isLoading) {
      return;
    }

    if (suppliers.length > 0) {
      console.log('✅ Suppliers already loaded from store:', suppliers.length);
      return;
    }

    console.log('📥 Loading suppliers from API...');
    hasRequestedInitialLoad.current = true;
    loadSuppliers();
  }, [suppliers.length, loadSuppliers, isLoading]);

  // Form state
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    businessName: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    paymentTerms: 30,
    creditLimit: 0,
    active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         supplier.taxId.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' ? supplier.active : !supplier.active);
    return matchesSearch && matchesStatus;
  });

  const activeSuppliers = suppliers.filter(s => s.active);
  const totalDebt = Math.abs(suppliers.filter(s => s.active && s.currentBalance < 0).reduce((sum, s) => sum + s.currentBalance, 0));
  const avgPaymentTerms = Math.round(suppliers.reduce((sum, s) => {
    return sum + s.paymentTerms;
  }, 0) / suppliers.length);

  const resetForm = () => {
    setFormData({
      name: '',
      businessName: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
      paymentTerms: 30,
      creditLimit: 0,
      active: true
    });
    setErrors({});
    setEditingSupplier(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Solo el nombre comercial es obligatorio
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre comercial es requerido';
    }

    // Validaciones opcionales
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    if (formData.taxId && formData.taxId.length < 11) {
      newErrors.taxId = 'El CUIT debe tener al menos 11 caracteres';
    }

    if (formData.paymentTerms < 0) {
      newErrors.paymentTerms = 'Los términos de pago deben ser positivos';
    }

    if (formData.creditLimit < 0) {
      newErrors.creditLimit = 'El límite de crédito debe ser positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const supplierData = {
        ...formData,
        currentBalance: 0, // New suppliers start with 0 balance
        totalPurchases: 0, // New suppliers start with 0 total purchases
        lastPurchaseDate: undefined // No purchases yet
      };

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierData);
        alert('¡Proveedor actualizado exitosamente!');
      } else {
        await addSupplier(supplierData);
        alert('¡Proveedor creado exitosamente!');
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Error al guardar el proveedor: ' + (error as Error).message);
    }
  };

  const handleNewSupplier = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditSupplier = (supplier: any) => {
    setFormData({
      name: supplier.name,
      businessName: supplier.businessName || '',
      taxId: supplier.taxId || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      paymentTerms: supplier.paymentTerms,
      creditLimit: supplier.creditLimit || 0,
      active: supplier.active
    });
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handlePaySupplier = (_supplier: any) => {
    // TODO: Implement supplier payment functionality  
    // This could open a payment modal
    alert('Funcionalidad de pago en desarrollo');
  };

  const handleViewSupplier = (_supplier: any) => {
    // TODO: Implement supplier view functionality
    // This could show supplier details in a modal
    alert('Vista detallada en desarrollo');
  };

  const handleInputChange = (field: keyof SupplierFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Scroll functions now provided by useTableScroll hook

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
            <p className="text-gray-600">Gestiona tus proveedores y cuentas por pagar</p>
          </div>
          <BulkSupplierImport onImportComplete={() => {}} />
          <Button
            onClick={handleNewSupplier}
            variant="primary"
          >
            + Nuevo Proveedor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Proveedores</p>
                <p className="text-lg font-semibold text-gray-900">{suppliers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Activos</p>
                <p className="text-lg font-semibold text-gray-900">{activeSuppliers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Deuda Total</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(totalDebt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Plazo Promedio</p>
                <p className="text-lg font-semibold text-yellow-600">{avgPaymentTerms} días</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Buscar proveedores por nombre, email o CUIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>}
              iconPosition="left"
              className="w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Proveedores</h3>
          </div>
          
          <div className="relative">
            <div
              ref={tableScrollRef}
              className="overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 w-full max-w-full max-h-[600px]"
            >
              <table className="divide-y divide-gray-200 min-w-[1300px] w-max">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px] w-[250px]">
                      Proveedor
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] w-[200px]">
                      Contacto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px] w-[180px]">
                      Balance
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] w-[150px]">
                      Compras Totales
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] w-[120px]">
                      Estado
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px] w-[250px]">
                      Acciones
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap min-w-[250px] w-[250px]">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {supplier.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                          <div className="text-sm text-gray-500">CUIT: {formatTaxId(supplier.taxId)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap min-w-[200px] w-[200px]">
                      <div className="text-sm text-gray-900">{supplier.email || 'No email'}</div>
                      <div className="text-sm text-gray-500">{formatPhoneNumber(supplier.phone || '')}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap min-w-[180px] w-[180px]">
                      <div className={`text-sm font-medium ${
                        supplier.currentBalance === 0 
                          ? 'text-gray-900'
                          : supplier.currentBalance < 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                      }`}>
                        {supplier.currentBalance === 0 ? 'Sin deuda' : formatCurrency(Math.abs(supplier.currentBalance))}
                      </div>
                      <div className="text-sm text-gray-500">{supplier.paymentTerms} días</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap min-w-[150px] w-[150px]">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(supplier.totalPurchases)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap min-w-[120px] w-[120px]">
                      <StatusBadge variant={supplier.active ? 'active' : 'inactive'} dot>
                        {supplier.active ? 'Activo' : 'Inactivo'}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[250px] w-[250px]">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-900 mr-2"
                        onClick={() => handlePaySupplier(supplier)}
                      >
                        Pagar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => handleViewSupplier(supplier)}
                      >
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proveedores</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'No se encontraron proveedores con esos filtros.' : 'Comienza agregando tu primer proveedor.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New/Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          resetForm();
          setIsModalOpen(false);
        }}
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Comercial <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: TechDistributor SA"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.businessName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Tech Distributor Sociedad Anónima"
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CUIT
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.taxId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 20-12345678-9"
                />
                {errors.taxId && (
                  <p className="mt-1 text-sm text-red-600">{errors.taxId}</p>
                )}
              </div>

            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.contactPerson ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan Carlos Pérez"
                />
                {errors.contactPerson && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: ventas@proveedor.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: +54 11 4567-8900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Av. Córdoba 1234, CABA"
                />
              </div>
            </div>
          </div>

          {/* Commercial Terms */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Condiciones Comerciales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Términos de Pago (días) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange('paymentTerms', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.paymentTerms ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min="0"
                  placeholder="30"
                  required
                />
                {errors.paymentTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentTerms}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite de Crédito ($)
                </label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.creditLimit ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min="0"
                  step="1000"
                  placeholder="100000"
                />
                {errors.creditLimit && (
                  <p className="mt-1 text-sm text-red-600">{errors.creditLimit}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                Proveedor activo
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Los proveedores inactivos no aparecerán en las listas de selección
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                resetForm();
                setIsModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
            >
              {editingSupplier ? 'Actualizar Proveedor' : 'Crear Proveedor'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}