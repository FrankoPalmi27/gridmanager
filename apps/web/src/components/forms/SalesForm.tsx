import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SearchableSelect } from '../ui/SearchableSelect';
import { useSalesStore, type Sale } from '../../store/salesStore';
import { useProductsStore } from '../../store/productsStore';
import { useAccountsStore } from '../../store/accountsStore';
import { useCustomersStore } from '../../store/customersStore';
import { useSystemConfigStore } from '../../store/systemConfigStore';
import { formatAmount } from '../../lib/formatters';

type EditableSale = Sale & { discount?: number };

interface SalesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sale: Sale) => void;
  editingSale?: EditableSale; // Sale object to edit
}

interface SalesFormData {
  client: string;
  product: string;
  productId: string; // Nuevo campo requerido para inventario
  quantity: number;
  price: number;
  discount: number;
  saleDate: string;
  salesChannel: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
  paymentStatus: 'paid' | 'pending' | 'partial';
  accountId: string; // La cuenta define el método de pago
}

interface SalesFormErrors {
  client?: string;
  product?: string;
  quantity?: string;
  price?: string;
  accountId?: string;
  stock?: string;
}

interface StockValidationState {
  isChecking: boolean;
  hasStockIssue: boolean;
  stockMessage: string;
  severity: 'error' | 'warning' | 'info';
  canProceed: boolean;
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

// PAYMENT_METHODS ya no es necesario, el método de pago viene de la cuenta


export const SalesForm: React.FC<SalesFormProps> = ({ isOpen, onClose, onSuccess, editingSale }) => {
  const { addSale, updateSale, validateStock } = useSalesStore();
  const { products } = useProductsStore();
  const { accounts, getActiveAccounts } = useAccountsStore();
  const { customers } = useCustomersStore();
  const { toggleNegativeStock, isNegativeStockAllowed } = useSystemConfigStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SalesFormErrors>({});

  const safeProducts = useMemo(() => (Array.isArray(products) ? products : []), [products]);
  const safeCustomers = useMemo(() => (Array.isArray(customers) ? customers : []), [customers]);
  const safeAccounts = useMemo(() => (Array.isArray(accounts) ? accounts : []), [accounts]);
  const activeAccountsRaw = getActiveAccounts();
  const activeAccounts = Array.isArray(activeAccountsRaw) ? activeAccountsRaw : safeAccounts;

  // ✅ NUEVO ESTADO PARA VALIDACIÓN DE STOCK MEJORADA
  const [stockValidation, setStockValidation] = useState<StockValidationState>({
    isChecking: false,
    hasStockIssue: false,
    stockMessage: '',
    severity: 'info',
    canProceed: true
  });
  
  // Get active products, accounts, and customers
  const activeProducts = useMemo(() => safeProducts.filter(p => p.status === 'active'), [safeProducts]);
  const activeCustomers = useMemo(() => safeCustomers.filter(c => c.status === 'active'), [safeCustomers]);
  
  const [formData, setFormData] = useState<SalesFormData>({
    client: '',
    product: '',
    productId: '', // Inicializar productId vacío
    quantity: 1,
    price: 0,
    discount: 0,
    saleDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    salesChannel: 'store',
    paymentStatus: 'paid',
    accountId: '', // Cuenta requerida si está pagado
  });

  const handleReset = useCallback(() => {
    setFormData({
      client: '',
      product: '',
      productId: '', // Reset productId también
      quantity: 1,
      price: 0,
      discount: 0,
      saleDate: new Date().toISOString().split('T')[0],
      salesChannel: 'store',
      paymentStatus: 'paid',
      accountId: '',
    });
    setErrors({});
  }, []);

  // Populate form when editing a sale
  useEffect(() => {
    if (editingSale && isOpen) {
      // Find the product name from the sale amount/quantity
      const unitPrice = editingSale.amount / editingSale.items;
      const matchingProduct = activeProducts.find(p => p.price === unitPrice);
      
      setFormData({
        client: editingSale.client.name,
        product: matchingProduct?.name || '',
        productId: editingSale.productId || matchingProduct?.id || '',
        quantity: editingSale.items,
        price: unitPrice,
        discount: editingSale.discount || 0,
        saleDate: editingSale.date || new Date().toISOString().split('T')[0],
        salesChannel: editingSale.salesChannel || 'store',
        paymentStatus: editingSale.paymentStatus || 'pending',
        accountId: editingSale.accountId || ''
      });
    } else if (!editingSale && isOpen) {
      // Reset form for new sale
      handleReset();
    }
  }, [editingSale, isOpen, activeProducts, handleReset]);

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // ✅ FUNCIÓN PARA VALIDAR STOCK EN TIEMPO REAL
  const checkStockValidation = (productId: string, quantity: number) => {
    if (!productId || quantity <= 0) {
      setStockValidation({
        isChecking: false,
        hasStockIssue: false,
        stockMessage: '',
        severity: 'info',
        canProceed: true
      });
      return;
    }

    setStockValidation(prev => ({ ...prev, isChecking: true }));

    try {
      const validation = validateStock(productId, quantity);

      setStockValidation({
        isChecking: false,
        hasStockIssue: !validation.valid || validation.severity === 'warning',
        stockMessage: validation.message || '',
        severity: validation.severity || 'info',
        canProceed: validation.valid
      });

      // Limpiar error anterior de stock si la validación pasa
      if (validation.valid && errors.stock) {
        setErrors(prev => ({ ...prev, stock: undefined }));
      }

    } catch (error) {
      setStockValidation({
        isChecking: false,
        hasStockIssue: true,
        stockMessage: 'Error validando stock',
        severity: 'error',
        canProceed: false
      });
    }
  };

  const handleProductChange = (productName: string) => {
    const product = activeProducts.find(p => p.name === productName);
    const price = product ? product.price : 0;
    const productId = product ? product.id : '';

    setFormData(prev => ({
      ...prev,
      product: productName,
      productId: productId,
      price
    }));

    if (errors.product) {
      setErrors(prev => ({ ...prev, product: undefined }));
    }

    // ✅ VALIDAR STOCK INMEDIATAMENTE DESPUÉS DE SELECCIONAR PRODUCTO
    if (productId && formData.quantity > 0) {
      checkStockValidation(productId, formData.quantity);
    }
  };

  // ✅ FUNCIÓN PARA MANEJAR CAMBIOS EN CANTIDAD
  const handleQuantityChange = (quantity: number) => {
    setFormData(prev => ({ ...prev, quantity }));

    if (errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: undefined }));
    }

    // ✅ VALIDAR STOCK INMEDIATAMENTE DESPUÉS DE CAMBIAR CANTIDAD
    if (formData.productId && quantity > 0) {
      checkStockValidation(formData.productId, quantity);
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

    // ✅ Validación mejorada para precio automático
    if (formData.price <= 0) {
      newErrors.price = 'Selecciona un producto válido con precio configurado';
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
        updateSale(editingSale.id, formData);
        
        if (onSuccess) {
          onSuccess(editingSale);
        } else {
          alert(`¡Venta actualizada exitosamente! Nº ${editingSale.number}`);
        }
      } else {
        // ✅ VALIDACIÓN DE STOCK MEJORADA - NO RESETEA FORMULARIO EN CASO DE ERROR
        if (!stockValidation.canProceed) {
          setErrors(prev => ({
            ...prev,
            stock: stockValidation.stockMessage
          }));
          setLoading(false);
          return;
        }

        // Si hay warning de stock pero se puede proceder, mostrar confirmación mejorada
        if (stockValidation.hasStockIssue && stockValidation.severity === 'warning') {
          const shouldProceed = window.confirm(
            `⚠️ CONFIRMACIÓN DE VENTA\n\n${stockValidation.stockMessage}\n\n¿Confirma que desea proceder con esta venta?`
          );
          if (!shouldProceed) {
            setLoading(false);
            return; // NO resetear formulario, solo cancelar el submit
          }
        }

        try {
          // Create new sale
          const newSale = await addSale(formData);

          if (onSuccess) {
            onSuccess(newSale);
          } else {
            alert(`¡Venta registrada exitosamente! Nº ${newSale.number}`);
          }

          handleClose(); // Solo cerrar si todo salió bien

        } catch (saleError: any) {
          console.error('Error creating sale:', saleError);
          setErrors(prev => ({
            ...prev,
            stock: saleError.message || 'Error al crear la venta'
          }));
          setLoading(false);
          return; // NO cerrar formulario, mantener datos
        }
      }

    } catch (error) {
      console.error(`Error ${editingSale ? 'updating' : 'creating'} sale:`, error);
      console.error('Form data was:', formData);

      // ✅ MOSTRAR ERROR SIN RESETEAR FORMULARIO
      setErrors(prev => ({
        ...prev,
        stock: `Error al ${editingSale ? 'actualizar' : 'crear'} la venta. Inténtalo de nuevo.`
      }));

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
        <div>
          <Input
            type="number"
            label="Cantidad"
            value={formData.quantity?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value;
              const quantity = value === '' ? 0 : parseInt(value) || 0;
              handleQuantityChange(quantity);
            }}
            min="1"
            required
            disabled={loading}
            error={errors.quantity}
            placeholder="1"
          />

          {/* ✅ MOSTRAR VALIDACIÓN DE STOCK EN TIEMPO REAL */}
          {stockValidation.isChecking && (
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Verificando stock...
            </div>
          )}

          {stockValidation.hasStockIssue && !stockValidation.isChecking && (
            <div className={`mt-2 p-3 rounded-lg text-sm ${
              stockValidation.severity === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : stockValidation.severity === 'warning'
                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <div className="flex items-start">
                <span className="mr-2">
                  {stockValidation.severity === 'error' ? '❌' :
                   stockValidation.severity === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="flex-1">
                  <p className="whitespace-pre-line">{stockValidation.stockMessage}</p>

                  {stockValidation.severity === 'error' && !isNegativeStockAllowed() && (
                    <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                      <button
                        type="button"
                        onClick={toggleNegativeStock}
                        className="text-xs underline hover:no-underline"
                      >
                        🔧 Permitir stock negativo en configuración del sistema
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Precio Unitario - Solo lectura, viene del producto */}
        <div className="space-y-2">
          <Input
            type="number"
            label="Precio Unitario"
            value={formData.price?.toString() || ''}
            readOnly
            disabled
            step="0.01"
            min="0"
            required
            error={errors.price}
            placeholder="Selecciona un producto"
            className="bg-gray-50 cursor-not-allowed"
          />
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            El precio se toma automáticamente del producto seleccionado. Para modificarlo, edita el producto en el módulo de Productos.
          </p>
        </div>

        {/* Descuento */}
        <Input
          type="number"
          label="Descuento (%)"
          value={formData.discount?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value;
            const discount = value === '' ? 0 : parseFloat(value) || 0;
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
          <label htmlFor="sales-channel" className="block text-sm font-medium text-gray-700 mb-1">
            Canal de Venta
          </label>
          <select
            id="sales-channel"
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
          <label htmlFor="payment-status" className="block text-sm font-medium text-gray-700 mb-1">
            Estado de Pago
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="payment-status"
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

        {/* Cuenta / Método de Pago (solo si el pago está marcado como pagado) */}
        {formData.paymentStatus === 'paid' && (
          <div>
            <label htmlFor="payment-account" className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta / Método de Pago
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="payment-account"
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
              {activeAccounts.map((account) => {
                const paymentMethodLabel = account.paymentMethod
                  ? ` - ${account.paymentMethod === 'cash' ? 'Efectivo' : account.paymentMethod === 'transfer' ? 'Transferencia' : account.paymentMethod === 'card' ? 'Tarjeta' : account.paymentMethod === 'check' ? 'Cheque' : 'Otro'}`
                  : '';
                return (
                  <option key={account.id} value={account.id}>
                    {account.name}{paymentMethodLabel} - Balance: {account.balance.toLocaleString('es-AR', { style: 'currency', currency: account.currency })}
                  </option>
                );
              })}
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
              💡 El método de pago está asociado a cada cuenta. El monto se agregará automáticamente al balance.
            </p>
          </div>
        )}

        {/* Error de Stock Global */}
        {errors.stock && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-red-500 mr-2">❌</span>
              <div className="flex-1">
                <p className="text-sm text-red-800 whitespace-pre-line">{errors.stock}</p>
              </div>
            </div>
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