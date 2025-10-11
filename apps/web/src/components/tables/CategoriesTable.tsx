import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { StatusBadge } from '../ui/StatusBadge';
import { Category, Product } from '../../store/productsStore';
import { formatDate, formatCurrency } from '../../lib/formatters';

interface CategoriesTableProps {
  categories: Category[];
  onCategoriesUpdate: (categories: Category[]) => void;
  productsByCategory: Record<string, number>;
  allCategoryNames: string[];
  products: Product[]; // Add products array to show category details
}

export function CategoriesTable({ categories, onCategoriesUpdate, productsByCategory, allCategoryNames, products }: CategoriesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Combine all categories (custom + derived from products)
  const getAllCategoriesForTable = () => {
    const customCategoriesMap = new Map(categories.map(cat => [cat.name, cat]));
    const allCategories: Category[] = [];

    // Add all category names from allCategoryNames
    allCategoryNames.forEach(categoryName => {
      if (customCategoriesMap.has(categoryName)) {
        // It's a custom category
        allCategories.push(customCategoriesMap.get(categoryName)!);
      } else {
        // It's a category derived from products only
        allCategories.push({
          id: `derived-${categoryName}`,
          name: categoryName,
          description: 'Categoría automática (derivada de productos)',
          createdAt: new Date().toISOString()
        });
      }
    });

    return allCategories;
  };

  const allCategories = getAllCategoriesForTable();

  const filteredCategories = allCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const validateCategoryName = (name: string, excludeId?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return 'El nombre de la categoría es requerido';
    }
    
    const exists = allCategories.some(cat => 
      cat.name.toLowerCase() === trimmedName.toLowerCase() && cat.id !== excludeId
    );
    
    if (exists) {
      return 'Esta categoría ya existe';
    }
    
    return null;
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditDescription(category.description || '');
    setErrors({});
  };

  const handleUpdateCategory = () => {
    const error = validateCategoryName(editName, editingCategory?.id);
    if (error) {
      setErrors({ editCategory: error });
      return;
    }

    if (editingCategory?.id.startsWith('derived-')) {
      // Converting a derived category to a custom category
      const newCategory = {
        id: Date.now().toString(),
        name: editName.trim(),
        description: editDescription.trim() || 'Convertida desde categoría automática',
        createdAt: new Date().toISOString()
      };
      onCategoriesUpdate([...categories, newCategory]);
    } else {
      // Updating an existing custom category
      const updatedCategories = categories.map(cat =>
        cat.id === editingCategory?.id
          ? { ...cat, name: editName.trim(), description: editDescription.trim() }
          : cat
      );
      onCategoriesUpdate(updatedCategories);
    }

    setEditingCategory(null);
    setEditName('');
    setEditDescription('');
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
    setEditDescription('');
    setErrors({});
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    const productCount = productsByCategory[categoryName] || 0;
    
    if (categoryId.startsWith('derived-')) {
      alert(`No puedes eliminar "${categoryName}" porque es una categoría automática derivada de productos existentes. Para eliminarla, primero cambia la categoría de todos los productos que la usan.`);
      return;
    }
    
    const message = productCount > 0 
      ? `¿Estás seguro de eliminar la categoría "${categoryName}"? Esta categoría tiene ${productCount} producto(s). Los productos mantendrán el nombre de la categoría.`
      : `¿Estás seguro de eliminar la categoría "${categoryName}"?`;
      
    if (confirm(message)) {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      onCategoriesUpdate(updatedCategories);
    }
  };

  const handleAddNewCategory = () => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: 'Nueva Categoría',
      description: '',
      createdAt: new Date().toISOString()
    };

    const updatedCategories = [...categories, newCategory];
    onCategoriesUpdate(updatedCategories);

    // Immediately edit the new category
    setEditingCategory(newCategory);
    setEditName('Nueva Categoría');
    setEditDescription('');
  };

  const toggleCategoryExpansion = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryProducts = (categoryName: string) => {
    return products.filter(product => product.category === categoryName);
  };

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>}
            iconPosition="left"
            className="w-full"
          />
        </div>
        <Button
          onClick={handleAddNewCategory}
          variant="primary"
        >
          + Nueva Categoría
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Categorías ({filteredCategories.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <React.Fragment key={category.id}>
                  <tr className="hover:bg-gray-50">
                  {editingCategory?.id === category.id ? (
                    <>
                      <td className="px-4 py-3">
                        <Input
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value);
                            if (errors.editCategory) {
                              setErrors({ ...errors, editCategory: '' });
                            }
                          }}
                          error={errors.editCategory}
                          className="min-w-[200px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCategory();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Descripción opcional..."
                          className="min-w-[250px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCategory();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {productsByCategory[category.name] || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {formatDate(category.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={handleUpdateCategory}
                            variant="primary"
                            size="sm"
                          >
                            Guardar
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="secondary"
                            size="sm"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            category.id.startsWith('derived-') 
                              ? 'bg-gray-100' 
                              : 'bg-blue-100'
                          }`}>
                            {category.id.startsWith('derived-') ? (
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {category.name}
                            </div>
                            {category.id.startsWith('derived-') && (
                              <div className="text-xs text-gray-500">
                                Categoría automática
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {category.description || (
                            <span className="text-gray-400 italic">Sin descripción</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusBadge 
                            variant={productsByCategory[category.name] > 0 ? 'active' : 'inactive'}
                            dot
                          >
                            {productsByCategory[category.name] || 0} productos
                          </StatusBadge>
                          {productsByCategory[category.name] > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCategoryExpansion(category.name)}
                              className="p-1 h-6 w-6 text-gray-500 hover:text-gray-700"
                            >
                              <svg 
                                className={`h-4 w-4 transition-transform ${
                                  expandedCategories.has(category.name) ? 'rotate-180' : ''
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(category.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-900 mr-1 px-2 py-1"
                          onClick={() => handleEditCategory(category)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900 px-2 py-1"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                        >
                          Eliminar
                        </Button>
                      </td>
                    </>
                  )}
                  </tr>
                  {expandedCategories.has(category.name) && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="pl-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Productos en "{category.name}":
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {getCategoryProducts(category.name).map((product) => (
                              <div key={product.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="text-sm font-medium text-gray-900 truncate pr-2">
                                    {product.name}
                                  </h5>
                                  <StatusBadge variant={product.status === 'active' ? 'active' : 'inactive'}>
                                    {product.status === 'active' ? 'Activo' : 'Inactivo'}
                                  </StatusBadge>
                                </div>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div><span className="font-medium">SKU:</span> {product.sku}</div>
                                  <div><span className="font-medium">Marca:</span> {product.brand}</div>
                                  <div><span className="font-medium">Precio:</span> {formatCurrency(product.price)}</div>
                                  <div><span className="font-medium">Stock:</span> {product.stock} unidades</div>
                                  {product.description && (
                                    <div className="mt-2">
                                      <span className="font-medium">Descripción:</span>
                                      <p className="text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {getCategoryProducts(category.name).length === 0 && (
                            <p className="text-sm text-gray-500 italic">No hay productos en esta categoría</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay categorías</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No se encontraron categorías con ese filtro.' : 'Comienza agregando tu primera categoría personalizada.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Button
                  onClick={handleAddNewCategory}
                  variant="primary"
                >
                  + Nueva Categoría
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}