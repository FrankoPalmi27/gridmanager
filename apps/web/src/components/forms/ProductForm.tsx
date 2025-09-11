import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useProductsStore, Product } from '../../store/productsStore';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
}

export function ProductForm({ isOpen, onClose, editingProduct }: ProductFormProps) {
  const { addProduct, updateProduct, stats } = useProductsStore();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    description: '',
    cost: '',
    price: '',
    stock: '',
    minStock: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categorías comunes predefinidas
  const commonCategories = [
    'Electrónicos',
    'Hogar',
    'Ropa',
    'Deportes',
    'Libros',
    'Juguetes',
    'Belleza',
    'Automotriz',
    'Jardinería',
    'Varios'
  ];

  // Reset form when modal opens/closes or editing product changes
  useEffect(() => {
    if (isOpen && editingProduct) {
      setFormData({
        name: editingProduct.name,
        category: editingProduct.category,
        brand: editingProduct.brand,
        description: editingProduct.description || '',
        cost: editingProduct.cost.toString(),
        price: editingProduct.price.toString(),
        stock: editingProduct.stock.toString(),
        minStock: editingProduct.minStock.toString(),
        status: editingProduct.status
      });
    } else if (isOpen && !editingProduct) {
      setFormData({
        name: '',
        category: '',
        brand: '',
        description: '',
        cost: '',
        price: '',
        stock: '',
        minStock: '',
        status: 'active'
      });
    }
    setErrors({});
    setIsSubmitting(false);
  }, [isOpen, editingProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del producto es requerido';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'La marca es requerida';
    }

    const cost = parseFloat(formData.cost);
    if (!formData.cost || isNaN(cost) || cost <= 0) {
      newErrors.cost = 'El costo debe ser un número mayor a 0';
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
      newErrors.price = 'El precio debe ser un número mayor a 0';
    }

    if (cost && price && cost >= price) {
      newErrors.price = 'El precio debe ser mayor al costo';
    }

    const stock = parseInt(formData.stock);
    if (!formData.stock || isNaN(stock) || stock < 0) {
      newErrors.stock = 'El stock debe ser un número mayor o igual a 0';
    }

    const minStock = parseInt(formData.minStock);
    if (!formData.minStock || isNaN(minStock) || minStock < 0) {
      newErrors.minStock = 'El stock mínimo debe ser un número mayor o igual a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        brand: formData.brand.trim(),
        description: formData.description.trim(),
        cost: parseFloat(formData.cost),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        status: formData.status
      };

      if (editingProduct) {
        updateProduct(editingProduct.id, productData);
      } else {
        addProduct(productData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const profit = () => {
    const cost = parseFloat(formData.cost) || 0;
    const price = parseFloat(formData.price) || 0;
    const profitAmount = price - cost;
    const profitPercentage = cost > 0 ? (profitAmount / cost) * 100 : 0;
    return { amount: profitAmount, percentage: profitPercentage };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Información Básica
            </h4>
            
            <div>
              <Input
                label="Nombre del Producto"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
                required
                placeholder="Ej: iPhone 15 Pro Max"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-300' : ''
                }`}
                required
              >
                <option value="">Selecciona una categoría</option>
                {stats.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {commonCategories.filter(cat => !stats.categories.includes(cat)).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <Input
                label="Marca"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                error={errors.brand}
                required
                placeholder="Ej: Apple"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Descripción opcional del producto..."
              />
            </div>
          </div>

          {/* Precios y stock */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Precios y Stock
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Costo"
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={handleInputChange}
                  error={errors.cost}
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <Input
                  label="Precio de Venta"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  error={errors.price}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Profit calculation */}
            {formData.cost && formData.price && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Ganancia:</span>
                    <span className={`font-medium ${profit().amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${profit().amount.toFixed(2)} ({profit().percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Stock Actual"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  error={errors.stock}
                  required
                  placeholder="0"
                />
              </div>

              <div>
                <Input
                  label="Stock Mínimo"
                  name="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={handleInputChange}
                  error={errors.minStock}
                  required
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}