import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { StatusBadge } from '../ui/StatusBadge';
import { Category } from '../../store/productsStore';
import { formatDate } from '../../lib/formatters';

interface CategoriesTableProps {
  categories: Category[];
  onCategoriesUpdate: (categories: Category[]) => void;
  productsByCategory: Record<string, number>;
}

export function CategoriesTable({ categories, onCategoriesUpdate, productsByCategory }: CategoriesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const validateCategoryName = (name: string, excludeId?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return 'El nombre de la categoría es requerido';
    }
    
    const exists = categories.some(cat => 
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

    const updatedCategories = categories.map(cat =>
      cat.id === editingCategory?.id
        ? { ...cat, name: editName.trim(), description: editDescription.trim() }
        : cat
    );

    onCategoriesUpdate(updatedCategories);
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
                <tr key={category.id} className="hover:bg-gray-50">
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
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {category.name}
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
                        <div className="flex items-center">
                          <StatusBadge 
                            variant={productsByCategory[category.name] > 0 ? 'active' : 'inactive'}
                            dot
                          >
                            {productsByCategory[category.name] || 0} productos
                          </StatusBadge>
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