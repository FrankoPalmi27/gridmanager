import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useSales } from '../../store/SalesContext';
import { formatAmount } from '../../lib/formatters';

interface SalesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sale: any) => void;
}

interface SalesFormData {
  client: string;
  product: string;
  quantity: number;
  price: number;
}

interface SalesFormErrors {
  client?: string;
  product?: string;
  quantity?: string;
  price?: string;
}

const CLIENTS = [
  { id: '1', name: 'Juan Pérez', email: 'juan@email.com' },
  { id: '2', name: 'María García', email: 'maria@email.com' },
  { id: '3', name: 'Carlos López', email: 'carlos@email.com' },
  { id: '4', name: 'Ana Martínez', email: 'ana@email.com' },
];

const PRODUCTS = [
  { id: '1', name: 'Producto A', price: 500 },
  { id: '2', name: 'Producto B', price: 750 },
  { id: '3', name: 'Producto C', price: 1200 },
  { id: '4', name: 'Servicio D', price: 300 },
];

export const SalesForm: React.FC<SalesFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addSale } = useSales();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SalesFormErrors>({});
  
  const [formData, setFormData] = useState<SalesFormData>({
    client: '',
    product: '',
    quantity: 1,
    price: 0,
  });

  const handleReset = () => {
    setFormData({
      client: '',
      product: '',
      quantity: 1,
      price: 0,
    });
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleProductChange = (productName: string) => {
    const product = PRODUCTS.find(p => p.name === productName);
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
      
      console.log('Creating sale with data:', formData);
      const newSale = addSale(formData);
      console.log('Sale created successfully:', newSale);
      
      if (onSuccess) {
        onSuccess(newSale);
      } else {
        alert(`¡Venta registrada exitosamente! Nº ${newSale.number}`);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error creating sale:', error);
      console.error('Form data was:', formData);
      alert('Error al crear la venta. Inténtalo de nuevo.');
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
        Crear Venta
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nueva Venta"
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
            {PRODUCTS.map((product) => (
              <option key={product.id} value={product.name}>
                {product.name} - ${product.price.toLocaleString()}
              </option>
            ))}
          </select>
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