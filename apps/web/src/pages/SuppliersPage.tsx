import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatTaxId, formatPhoneNumber } from '../lib/formatters';
import { useSuppliersStore } from '../stores/suppliersStore';

export function SuppliersPage() {
  const { suppliers } = useSuppliersStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const tableScrollRef = React.useRef<HTMLDivElement>(null);

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

  const handleNewSupplier = () => {
    setIsModalOpen(true);
  };

  const handleEditSupplier = (supplier: any) => {
    // TODO: Implement supplier editing functionality
    console.log('Edit supplier:', supplier);
    // This could open a modal similar to customers or navigate to edit form
  };

  const handlePaySupplier = (supplier: any) => {
    // TODO: Implement supplier payment functionality  
    console.log('Pay supplier:', supplier);
    // This could open a payment modal
  };

  const handleViewSupplier = (supplier: any) => {
    // TODO: Implement supplier view functionality
    console.log('View supplier:', supplier);
    // This could show supplier details in a modal
  };

  const scrollLeft = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
            <p className="text-gray-600">Gestiona tus proveedores y cuentas por pagar</p>
          </div>
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Proveedores</h3>
            
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
              <table className="divide-y divide-gray-200" style={{ minWidth: '1300px', width: 'max-content' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '250px', minWidth: '250px' }}>
                    Proveedor
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '200px', minWidth: '200px' }}>
                    Contacto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '180px', minWidth: '180px' }}>
                    Balance
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                    Compras Totales
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                    Estado
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '250px', minWidth: '250px' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap" style={{ width: '250px', minWidth: '250px' }}>
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
                    <td className="px-4 py-4 whitespace-nowrap" style={{ width: '200px', minWidth: '200px' }}>
                      <div className="text-sm text-gray-900">{supplier.email || 'No email'}</div>
                      <div className="text-sm text-gray-500">{formatPhoneNumber(supplier.phone || '')}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap" style={{ width: '180px', minWidth: '180px' }}>
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
                    <td className="px-4 py-4 whitespace-nowrap" style={{ width: '150px', minWidth: '150px' }}>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(supplier.totalPurchases)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap" style={{ width: '120px', minWidth: '120px' }}>
                      <StatusBadge variant={supplier.active ? 'active' : 'inactive'} dot>
                        {supplier.active ? 'Activo' : 'Inactivo'}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ width: '250px', minWidth: '250px' }}>
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

      {/* New Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Proveedor"
        size="md"
        footer={
          <Button
            onClick={() => setIsModalOpen(false)}
            variant="secondary"
          >
            Cerrar
          </Button>
        }
      >
        <p className="text-gray-600">Funcionalidad en desarrollo...</p>
      </Modal>
    </div>
  );
}