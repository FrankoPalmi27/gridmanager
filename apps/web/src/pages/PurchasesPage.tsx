import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatDate as formatDateUtil } from '../lib/formatters';
import { usePurchasesStore } from '../store/purchasesStore';
import { useSuppliersStore } from '../store/suppliersStore';
import { useProductsStore } from '../store/productsStore';
import { useAccountsStore } from '../store/accountsStore';

interface PurchaseFormData {
  supplierId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>;
  paymentStatus: 'paid' | 'pending' | 'partial';
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
  accountId?: string;
  reference?: string;
  notes?: string;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  received: { label: 'Recibido', color: 'bg-blue-100 text-blue-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
};

const paymentStatusConfig = {
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  partial: { label: 'Parcial', color: 'bg-orange-100 text-orange-800' }
};

export function PurchasesPage() {
  const {
    purchases,
    dashboardStats,
    addPurchase,
    markAsReceived,
    updatePaymentStatus,
    deletePurchase
  } = usePurchasesStore();

  const { suppliers, loadSuppliers } = useSuppliersStore();
  const { products, loadProducts } = useProductsStore();
  const { accounts, loadAccounts } = useAccountsStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplierId: '',
    items: [{ productId: '', quantity: 1, unitCost: 0 }],
    paymentStatus: 'pending',
    paymentMethod: undefined,
    accountId: undefined,
    reference: '',
    notes: ''
  });

  // ✅ Precargar datos necesarios al abrir el modal
  React.useEffect(() => {
    if (isModalOpen) {
      if (suppliers.length === 0) void loadSuppliers();
      if (products.length === 0) void loadProducts();
      if (accounts.length === 0) void loadAccounts();
    }
  }, [isModalOpen, suppliers.length, products.length, accounts.length, loadSuppliers, loadProducts, loadAccounts]);

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleNewPurchase = () => {
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitCost: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof PurchaseFormData['items'][0], value: string | number) => {
    console.log('[PurchasesPage] handleItemChange →', { index, field, value });

    setFormData(prev => {
      const newItems = [...prev.items]; // Create new array reference
      const currentItem = newItems[index];

      // Update the field
      const updated = { ...currentItem, [field]: value };

      // 🔥 AUTO-FILL: Cuando selecciona un producto, autocompleta el costo
      if (field === 'productId' && value) {
        const product = products.find(p => p.id === value);
        console.log('[PurchasesPage] Product selected:', {
          productId: value,
          product,
          productName: product?.name,
          cost: product?.cost,
          totalProducts: products.length,
          allProducts: products.map(p => ({ id: p.id, name: p.name, cost: p.cost }))
        });

        if (product) {
          if (product.cost && product.cost > 0) {
            console.log('[PurchasesPage] ✅ Setting unitCost to:', product.cost);
            updated.unitCost = product.cost;
          } else {
            console.warn('[PurchasesPage] ⚠️ Product has no cost or cost is 0:', { name: product.name, cost: product.cost });
          }
        } else {
          console.error('[PurchasesPage] ❌ Product not found in products array');
        }
      }

      newItems[index] = updated;

      const newFormData = {
        ...prev,
        items: newItems
      };

      console.log('[PurchasesPage] New form state →', {
        itemIndex: index,
        updatedItem: newItems[index],
        totalItems: newItems.length
      });

      return newFormData;
    });
  };

  const handleSubmitPurchase = async () => {
    try {
      // Validate form
      if (!formData.supplierId) {
        alert('Selecciona un proveedor');
        return;
      }

      if (formData.items.some(item => !item.productId || item.quantity <= 0 || item.unitCost <= 0)) {
        alert('Completa todos los datos de los productos');
        return;
      }

      if (formData.paymentStatus === 'paid' && !formData.accountId) {
        alert('Selecciona una cuenta para el pago');
        return;
      }

      // Create purchase
      await addPurchase(formData);

      // Reset form and close modal
      setFormData({
        supplierId: '',
        items: [{ productId: '', quantity: 1, unitCost: 0 }],
        paymentStatus: 'pending',
        paymentMethod: undefined,
        accountId: undefined,
        reference: '',
        notes: ''
      });
      
      setIsModalOpen(false);
      alert('¡Compra creada exitosamente!');
    } catch (error) {
      console.error('Error creating purchase:', error);
      alert('Error al crear la compra: ' + (error as Error).message);
    }
  };

  const handleReceivePurchase = (purchaseId: string) => {
    try {
      markAsReceived(purchaseId);
      alert('¡Compra marcada como recibida! El inventario se actualizó automáticamente.');
    } catch (error) {
      console.error('Error receiving purchase:', error);
      alert('Error al marcar compra como recibida: ' + (error as Error).message);
    }
  };

  const handleOpenPaymentModal = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId);
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = (accountId: string) => {
    if (!selectedPurchaseId) return;
    
    try {
      updatePaymentStatus(selectedPurchaseId, 'paid', accountId);
      setIsPaymentModalOpen(false);
      setSelectedPurchaseId(null);
      alert('¡Pago registrado exitosamente!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error al procesar pago: ' + (error as Error).message);
    }
  };

  const handleDeletePurchase = (purchaseId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta compra? Esta acción no se puede deshacer.')) {
      try {
        deletePurchase(purchaseId);
        alert('Compra eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting purchase:', error);
        alert('Error al eliminar compra: ' + (error as Error).message);
      }
    }
  };

  const calculateFormTotal = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.unitCost), 0);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
            <p className="text-gray-600">Gestiona tus compras a proveedores</p>
          </div>
          <Button
            onClick={handleNewPurchase}
            variant="primary"
          >
            + Nueva Compra
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Gastado</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(dashboardStats.totalSpent)}</p>
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
                <p className="text-sm text-gray-500">Órdenes Pendientes</p>
                <p className="text-lg font-semibold text-yellow-600">{dashboardStats.pendingOrders}</p>
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
                <p className="text-sm text-gray-500">Total Compras</p>
                <p className="text-lg font-semibold text-green-600">{dashboardStats.totalPurchases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Este Mes</p>
                <p className="text-lg font-semibold text-purple-600">{formatCurrency(dashboardStats.monthlySpending)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Buscar compras por número o proveedor..."
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
            <option value="pending">Pendiente</option>
            <option value="received">Recibido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Compras</h3>
          </div>
          
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '600px' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pago
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{purchase.number}</div>
                          {purchase.reference && (
                            <div className="text-sm text-gray-500">Ref: {purchase.reference}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{purchase.supplierName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateUtil(new Date(purchase.date))}</div>
                      {purchase.receivedDate && (
                        <div className="text-sm text-gray-500">Recibido: {formatDateUtil(new Date(purchase.receivedDate))}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{purchase.items.length} productos</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(purchase.total)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Sub: {formatCurrency(purchase.subtotal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        statusConfig[purchase.status]?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {statusConfig[purchase.status]?.label || purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        paymentStatusConfig[purchase.paymentStatus]?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {paymentStatusConfig[purchase.paymentStatus]?.label || purchase.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {purchase.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-900 mr-2"
                          onClick={() => handleReceivePurchase(purchase.id)}
                        >
                          Recibir
                        </Button>
                      )}
                      {purchase.status === 'received' && purchase.paymentStatus !== 'paid' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-yellow-600 hover:text-yellow-900 mr-2"
                          onClick={() => handleOpenPaymentModal(purchase.id)}
                        >
                          Pagar
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeletePurchase(purchase.id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPurchases.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay compras</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' ? 'No se encontraron compras con esos filtros.' : 'Comienza registrando tu primera compra.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva Compra"
        size="lg"
      >
        <div className="space-y-6">
          {/* Supplier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar proveedor...</option>
              {suppliers.filter(s => s.active).map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Productos <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
              >
                + Agregar Producto
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar producto...</option>
                      {products.filter(p => p.status === 'active').map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs text-gray-500 mb-1">
                      Costo Unit.
                      {item.unitCost > 0 && item.productId && (
                        <span className="ml-1 text-green-600" title="Autocompletado del producto">✓</span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={item.unitCost || ''}
                      onChange={(e) => handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        item.unitCost > 0 && item.productId
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300'
                      }`}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-700 mb-0"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(calculateFormTotal())}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Pago
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value as 'paid' | 'pending' | 'partial' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="partial">Parcial</option>
              </select>
            </div>

            {formData.paymentStatus !== 'pending' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuenta de Pago <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.accountId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={formData.paymentStatus === 'paid'}
                >
                  <option value="">Seleccionar cuenta...</option>
                  {accounts.filter(acc => acc.active).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(account.balance)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia Externa
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Ej: Factura #123"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {formData.paymentStatus !== 'pending' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={formData.paymentMethod || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar método...</option>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="check">Cheque</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Notas adicionales..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmitPurchase}
            >
              Crear Compra
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Registrar Pago"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Selecciona la cuenta desde la cual realizar el pago:</p>
          
          <div className="space-y-2">
            {accounts.filter(acc => acc.active).map(account => (
              <Button
                key={account.id}
                variant="ghost"
                className="w-full justify-between text-left p-4 border rounded-lg hover:bg-blue-50"
                onClick={() => handleProcessPayment(account.id)}
              >
                <div>
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm text-gray-500">{account.bankName}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(account.balance)}</div>
                  <div className="text-sm text-gray-500">{account.currency}</div>
                </div>
              </Button>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}