import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  closeModal: () => void;
  categories: Category[];
  onCategoriesUpdate: (categories: Category[]) => void;
}

export function CategoryModal({ isOpen, closeModal, categories, onCategoriesUpdate }: CategoryModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleAddCategory = () => {
    const error = validateCategoryName(newCategoryName);
    if (error) {
      setErrors({ newCategory: error });
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedCategories = [...categories, newCategory];
    onCategoriesUpdate(updatedCategories);
    setNewCategoryName('');
    setErrors({});
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
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
        ? { ...cat, name: editName.trim() }
        : cat
    );

    onCategoriesUpdate(updatedCategories);
    setEditingCategory(null);
    setEditName('');
    setErrors({});
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría? Los productos que la usen mantendrán el nombre de la categoría.')) {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      onCategoriesUpdate(updatedCategories);
    }
  };

  const handleClose = () => {
    setNewCategoryName('');
    setEditingCategory(null);
    setEditName('');
    setErrors({});
    closeModal();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white border border-gray-200 p-6 text-left align-middle shadow-sm transition-all">
                <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 mb-4">
                  Gestionar Categorías
                </Dialog.Title>

                {/* Add new category */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar Nueva Categoría</h4>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Nombre de la categoría"
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                          if (errors.newCategory) {
                            setErrors({ ...errors, newCategory: '' });
                          }
                        }}
                        error={errors.newCategory}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCategory();
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleAddCategory}
                      variant="primary"
                      disabled={!newCategoryName.trim()}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>

                {/* Categories list */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Categorías Existentes ({categories.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        {editingCategory?.id === category.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editName}
                              onChange={(e) => {
                                setEditName(e.target.value);
                                if (errors.editCategory) {
                                  setErrors({ ...errors, editCategory: '' });
                                }
                              }}
                              error={errors.editCategory}
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateCategory();
                                } else if (e.key === 'Escape') {
                                  setEditingCategory(null);
                                  setEditName('');
                                  setErrors({ ...errors, editCategory: '' });
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              onClick={handleUpdateCategory}
                              variant="primary"
                              size="sm"
                            >
                              Guardar
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingCategory(null);
                                setEditName('');
                                setErrors({ ...errors, editCategory: '' });
                              }}
                              variant="secondary"
                              size="sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm font-medium text-gray-900">{category.name}</span>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleEditCategory(category)}
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Editar
                              </Button>
                              <Button
                                onClick={() => handleDeleteCategory(category.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800"
                              >
                                Eliminar
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    
                    {categories.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <p className="text-sm">No hay categorías personalizadas</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleClose}
                    variant="secondary"
                  >
                    Cerrar
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}