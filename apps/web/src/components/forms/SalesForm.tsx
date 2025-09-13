import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SearchableSelect } from '../ui/SearchableSelect';
import { useSales } from '../../store/SalesContext';
import { useProductsStore } from '../../store/productsStore';
import { useAccountsStore } from '../../store/accountsStore';
import { useCustomersStore } from '../../store/customersStore';
import { formatAmount } from '../../lib/formatters';

interface SalesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sale: any) => void;
  editingSale?: any; // Sale object to edit
}

interface SalesFormData {
  client: string;
  product: string;
  quantity: number;
  price: number;
  discount: number;
  saleDate: string;
  salesChannel: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
  paymentStatus: 'paid' | 'pending' | 'partial';
  paymentMethod: 'cash' | 'transfer' | 'card' | 'check' | 'other';
  accountId: string;
}

interface SalesFormErrors {
  client?: string;
  product?: string;
  quantity?: string;
  price?: string;
  accountId?: string;
}


const SALES_CHANNELS = [
  { value: 'store', label: 'Tienda Física' },
  { value: 'online', label: 'Tienda Online' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Otro' },
];

const PAYMENT_STATUS = [
  { value: 'paid', label: 'Pagado' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'partial', label: 'Pago Parcial' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'check', label: 'Cheque' },
  { value: 'other', label: 'Otro' },
];


export const SalesForm: React.FC<SalesFormProps> = ({ isOpen, onClose, onSuccess, editingSale }) => {
  const { addSale, updateSale } = useSales();
  const { products } = useProductsStore();
  const { accounts, getActiveAccounts } = useAccountsStore();
  const { customers, getActiveCustomers } = useCustomersStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SalesFormErrors>({});
  
  // Get active products, accounts, and customers
  const activeProducts = products.filter(p => p.status === 'active');
  const activeAccounts = getActiveAccounts();
  const activeCustomers = getActiveCustomers();
  
  const [formData, setFormData] = useState<SalesFormData>({
    client: '',
    product: '',
    quantity: 1,
    price: 0,
    discount: 0,
    saleDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    salesChannel: 'store',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    accountId: '2', // Caja Fuerte como default para efectivo
  });

  // Populate form when editing a sale
  useEffect(() => {
    if (editingSale && isOpen) {
      // Find the product name from the sale amount/quantity
      const unitPrice = editingSale.amount / editingSale.items;
      const matchingProduct = activeProducts.find(p => p.price === unitPrice);
      
      setFormData({
        client: editingSale.client.name,
        product: matchingProduct?.name || '',
        quantity: editingSale.items,
        price: unitPrice,
        discount: editingSale.discount || 0,
        saleDate: editingSale.date || new Date().toISOString().split('T')[0],
        salesChannel: editingSale.salesChannel || 'store',
        paymentStatus: editingSale.paymentStatus || 'pending',
        paymentMethod: editingSale.paymentMethod || 'cash',
        accountId: editingSale.accountId || '2'
      });
    } else if (!editingSale && isOpen) {
      // Reset form for new sale
      handleReset();
    }
  }, [editingSale, isOpen]);

  const handleReset = () => {
    setFormData({
      client: '',
      product: '',
      quantity: 1,
      price: 0,
      discount: 0,
      saleDate: new Date().toISOString().split('T')[0],
      salesChannel: 'store',
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      accountId: '2',
    });
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleProductChange = (productName: string) => {
    const product = activeProducts.find(p => p.name === productName);
    const price = product ? product.price : 0;
    
    setFormData(prev => ({ 
      ...prev, 
      product: productName, 
      price 
    }));
    
    if (errors.product) {
      setErrors(prev => ({ ...prev, product: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: SalesFormErrors = {};

    if (!formData.client.trim()) {
      newErrors.client = 'Cliente es requerido';
    }

    if (!formData.product.trim()) {
      newErrors.product = 'Producto es requerido';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Cantidad debe ser mayor a 0';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Precio debe ser mayor a 0';
    }

    if (formData.paymentStatus === 'paid' && !formData.accountId.trim()) {
      newErrors.accountId = 'Cuenta es requerida para pagos marcados como pagados';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    // Prevent double submission
    if (loading) {
      return;
    }
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingSale) {
        // Update existing sale
        console.log('Updating sale with data:', formData);
        updateSale(editingSale.id, formData);
        console.log('Sale updated successfully');
        
        if (onSuccess) {
          onSuccess(editingSale);
        } else {
          alert(`¡Venta actualizada exitosamente! Nº ${editingSale.number}`);
        }
      } else {
        // Create new sale
        console.log('Creating sale with data:', formData);
        const newSale = addSale(formData);
        console.log('Sale created successfully:', newSale);
        
        if (onSuccess) {
          onSuccess(newSale);
        } else {
          alert(`¡Venta registrada exitosamente! Nº ${newSale.number}`);
        }
      }
      
      handleClose();
    } catch (error) {
      console.error(`Error ${editingSale ? 'updating' : 'creating'} sale:`, error);
      console.error('Form data was:', formData);
      alert(`Error al ${editingSale ? 'actualizar' : 'crear'} la venta. Inténtalo de nuevo.`);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = formData.quantity * formData.price;
  const discountAmount = subtotal * (formData.discount / 100);
  const total = subtotal - discountAmount;

  const footer = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>
      <Button 
        variant="primary" 
        onClick={handleSubmit}
        loading={loading}
        disabled={loading}
      >
{editingSale ? 'Actualizar Venta' : 'Crear Venta'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingSale ? "Editar Venta" : "Nueva Venta"}
      size="md"
      closeOnBackdrop={!loading}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente
            <span className="text-red-500 ml-1">*</span>
          </label>
          <SearchableSelect
            options={activeCustomers.map(customer => ({
              id: customer.id,
              name: customer.name,
              subtitle: customer.email + (customer.balance !== 0 ? ` (Balance: ${customer.balance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })})` : ''),
              value: customer.name
            }))}
            value={formData.client}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, client: value }));
              if (errors.client) {
                setErrors(prev => ({ ...prev, client: undefined }));
              }
            }}
            placeholder="Seleccionar cliente..."
            searchPlaceholder="Buscar cliente por nombre o email..."
            disabled={loading}
            error={!!errors.client}
          />
          {activeCustomers.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              No hay clientes activos disponibles. 
              <span className="text-blue-600 cursor-pointer hover:underline">Agregar clientes</span>
            </p>
          )}
          {errors.client && (
            <p className="text-sm text-red-600 mt-1">{errors.client}</p>
          )}
        </div>

        {/* Producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Producto
            <span className="text-red-500 ml-1">*</span>
          </label>
          <SearchableSelect
            options={activeProducts.map(product => ({
              id: product.id,
              name: product.name,
              subtitle: `${product.price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}${product.stock <= product.minStock ? ` (Stock bajo: ${product.stock})` : ` (Stock: ${product.stock})`}`,
              value: product.name
            }))}
            value={formData.product}
            onChange={(value) => handleProductChange(value)}
            placeholder="Seleccionar producto..."
            searchPlaceholder="Buscar producto por nombre..."
            disabled={loading}
            error={!!errors.product}
          />
          {activeProducts.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              No hay productos activos disponibles. 
              <span className="text-blue-600 cursor-pointer hover:underline">Agregar productos</span>
            </p>
          )}
          {errors.product && (
            <p className="text-sm text-red-600 mt-1">{errors.product}</p>
          )}
        </div>

        {/* Cantidad */}
        <Input
          type="number"
          label="Cantidad"
          value={formData.quantity?.toString() || '1'}
          onChange={(e) => {
            const quantity = parseInt(e.target.value) || 1;
            setFormData(prev => ({ ...prev, quantity }));
            if (errors.quantity) {
              setErrors(prev => ({ ...prev, quantity: undefined }));
            }
          }}
          min="1"
          required
          disabled={loading}
          error={errors.quantity}
        />

        {/* Precio Unitario */}
        <Input
          type="number"
          label="Precio Unitario"
          value={formData.price?.toString() || '0'}
          onChange={(e) => {
            const price = parseFloat(e.target.value) || 0;
            setFormData(prev => ({ ...prev, price }));
            if (errors.price) {
              setErrors(prev => ({ ...prev, price: undefined }));
            }
          }}
          step="0.01"
          min="0"
          required
          disabled={loading}
          error={errors.price}
        />

        {/* Descuento */}
        <Input
          type="number"
          label="Descuento (%)"
          value={formData.discount?.toString() || '0'}
          onChange={(e) => {
            const discount = parseFloat(e.target.value) || 0;
            setFormData(prev => ({ ...prev, discount: Math.max(0, Math.min(100, discount)) }));
          }}
          step="0.01"
          min="0"
          max="100"
          disabled={loading}
          placeholder="0"
        />

        {/* Fecha de Venta */}
        <Input
          type="date"
          label="Fecha de Venta"
          value={formData.saleDate}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, saleDate: e.target.value }));
          }}
          disabled={loading}
          required
        />

        {/* Resumen de Totales */}
        {(formData.quantity > 0 && formData.price > 0) && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal ({formData.quantity} × {formatAmount(formData.price)}):</span>
                <span className="font-medium">{formatAmount(subtotal)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Descuento ({formData.discount}%):</span>
                  <span className="font-medium">-{formatAmount(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>{formatAmount(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Canal de Venta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Canal de Venta
          </label>
          <select
            value={formData.salesChannel}
            onChange={(e) => setFormData(prev => ({ ...prev, salesChannel: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {SALES_CHANNELS.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </select>
        </div>

        {/* Estado de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado de Pago
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={formData.paymentStatus}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {PAYMENT_STATUS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Método de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Método de Pago
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cuenta (solo si el pago está marcado como pagado) */}
        {formData.paymentStatus === 'paid' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta de Depósito
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={formData.accountId}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, accountId: e.target.value }));
                if (errors.accountId) {
                  setErrors(prev => ({ ...prev, accountId: undefined }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.accountId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              <option value="">Seleccionar cuenta...</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.accountType}) - Balance: {account.balance.toLocaleString('es-AR', { style: 'currency', currency: account.currency })}
                </option>
              ))}
            </select>
            {activeAccounts.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No hay cuentas activas disponibles. 
                <span className="text-blue-600 cursor-pointer hover:underline">Agregar cuentas</span>
              </p>
            )}
            {errors.accountId && (
              <p className="text-sm text-red-600 mt-1">{errors.accountId}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              El monto se agregará automáticamente al balance de esta cuenta
            </p>
          </div>
        )}

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="text-lg font-bold text-green-600">
              {formatAmount(total)}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
};