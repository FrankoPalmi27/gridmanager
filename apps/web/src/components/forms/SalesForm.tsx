import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useSales } from '../../store/SalesContext';
import { useProductsStore } from '../../store/productsStore';
import { useAccountsStore } from '../../store/accountsStore';
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

const CLIENTS = [
  { id: '1', name: 'Juan Pérez', email: 'juan@email.com' },
  { id: '2', name: 'María García', email: 'maria@email.com' },
  { id: '3', name: 'Carlos López', email: 'carlos@email.com' },
  { id: '4', name: 'Ana Martínez', email: 'ana@email.com' },
];

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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SalesFormErrors>({});
  
  // Get active products and accounts
  const activeProducts = products.filter(p => p.status === 'active');
  const activeAccounts = getActiveAccounts();
  
  const [formData, setFormData] = useState<SalesFormData>({
    client: '',
    product: '',
    quantity: 1,
    price: 0,
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

  const total = formData.quantity * formData.price;

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
          <select
            value={formData.client}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, client: e.target.value }));
              if (errors.client) {
                setErrors(prev => ({ ...prev, client: undefined }));
              }
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.client ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value="">Seleccionar cliente...</option>
            {CLIENTS.map((client) => (
              <option key={client.id} value={client.name}>
                {client.name}
              </option>
            ))}
          </select>
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
          <select
            value={formData.product}
            onChange={(e) => handleProductChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.product ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value="">Seleccionar producto...</option>
            {activeProducts.map((product) => (
              <option key={product.id} value={product.name}>
                {product.name} - {product.price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                {product.stock <= product.minStock && (
                  <span> (Stock bajo: {product.stock})</span>
                )}
              </option>
            ))}
          </select>
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
          value={formData.quantity.toString()}
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
          value={formData.price.toString()}
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