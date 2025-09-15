import React, { useState, useMemo } from 'react';
import { Button } from '@ui/Button';
import { StatusBadge, StockStatusBadge } from '@ui/StatusBadge';
import { Input } from '@ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ui/Tabs';
import { Modal } from '@ui/Modal';
import { ProductForm } from '@forms/ProductForm';
import { CategoryModal } from '@forms/CategoryModal';
import { CategoriesTable } from '@components/tables/CategoriesTable';
import BulkProductImport from '@components/BulkProductImport';
import { useProductsStore, Product } from '@store/productsStore';
import { formatCurrency } from '@lib/formatters';
import { useTableScroll } from '@hooks/useTableScroll';

type SortField = 'name' | 'category' | 'brand' | 'price' | 'cost' | 'stock' | 'status';
type SortOrder = 'asc' | 'desc';

export function ProductsPage() {
  const { products, addProduct, stats, updateProduct, deleteProduct, categories, setCategories, resetToInitialProducts, stockMovements, getStockMovementsByProduct, addStockMovement } = useProductsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeTab, setActiveTab] = useState('productos');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [stockMovementsModal, setStockMovementsModal] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
  const { tableScrollRef, scrollLeft, scrollRight } = useTableScroll();

  const allCategories = ['all', ...stats.categories];

  // Calculate products by category for the categories table
  const productsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(product => {
      counts[product.category] = (counts[product.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedAndFilteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle different data types
      if (sortField === 'price' || sortField === 'cost' || sortField === 'stock') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsProductFormOpen(false);
    setEditingProduct(null);
  };

  const handleViewStockMovements = (product: Product) => {
    setStockMovementsModal({ isOpen: true, product });
  };

  const handleCloseStockMovements = () => {
    setStockMovementsModal({ isOpen: false, product: null });
  };

  const handleStockAdjustment = (product: Product) => {
    const newStock = prompt('Nuevo stock:', product.stock.toString());
    if (newStock !== null && !isNaN(Number(newStock))) {
      const newStockValue = parseInt(newStock);
      const previousStock = product.stock;
      
      // Update the product stock
      updateProduct(product.id, { stock: newStockValue });
      
      // Add stock movement record
      addStockMovement({
        productId: product.id,
        type: newStockValue > previousStock ? 'in' : newStockValue < previousStock ? 'out' : 'adjustment',
        quantity: Math.abs(newStockValue - previousStock),
        previousStock,
        newStock: newStockValue,
        reason: `Ajuste manual de stock`,
        createdBy: 'Usuario'
      });
    }
  };

  // Scroll functions now provided by useTableScroll hook

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
            <p className="text-gray-600">Gestiona tu catálogo de productos y stock</p>
          </div>
          <div className="flex gap-3">
            {activeTab === 'productos' ? (
              <>
                <Button
                  onClick={() => setShowBulkImport(true)}
                  variant="outline"
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  Importar CSV
                </Button>
                <Button
                  onClick={() => setIsCategoryModalOpen(true)}
                  variant="secondary"
                >
                  Gestionar Categorías
                </Button>
                <Button
                  onClick={handleNewProduct}
                  variant="primary"
                >
                  + Nuevo Producto
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  const newCategory = {
                    id: Date.now().toString(),
                    name: 'Nueva Categoría',
                    description: '',
                    createdAt: new Date().toISOString()
                  };
                  setCategories([...categories, newCategory]);
                }}
                variant="primary"
              >
                + Nueva Categoría
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="productos">
              Productos ({products.length})
            </TabsTrigger>
            <TabsTrigger value="categorias">
              Categorías ({categories.length})
            </TabsTrigger>
          </TabsList>

          {/* Products Tab Content */}
          <TabsContent value="productos">
        
        {/* Bulk Import Modal */}
        {showBulkImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-0 m-4 max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Importación Masiva de Productos</h2>
                <button
                  onClick={() => setShowBulkImport(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <BulkProductImport 
                  onImportComplete={(result) => {
                    // Import completed successfully
                    if (result.success.length > 0) {
                      setTimeout(() => {
                        setShowBulkImport(false);
                      }, 2000);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Productos</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalProducts}</p>
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
                <p className="text-sm text-gray-500">Productos Activos</p>
                <p className="text-lg font-semibold text-gray-900">{stats.activeProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Stock Bajo</p>
                <p className="text-lg font-semibold text-red-600">{stats.lowStockProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Valor Inventario</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Buscar productos por nombre o SKU..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {allCategories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Todas las categorías' : category}
              </option>
            ))}
          </select>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Productos</h3>
          </div>
          
          {/* Scrollable table container with fixed height and vertical scroll */}
          <div className="relative">
            <div
              ref={tableScrollRef}
              className="overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#D1D5DB #F3F4F6',
                maxWidth: '100%',
                width: '100%',
                maxHeight: '600px'
              }}
            >
            <table className="divide-y divide-gray-200" style={{ minWidth: '1200px', width: 'max-content' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '120px', minWidth: '120px' }}>
                    SKU
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('name')}
                    style={{ width: '200px', minWidth: '200px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Producto</span>
                      {sortField === 'name' && (
                        <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '180px', minWidth: '180px' }}>
                    Descripción
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('category')}
                    style={{ width: '140px', minWidth: '140px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Categoría</span>
                      {sortField === 'category' && (
                        <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('brand')}
                    style={{ width: '120px', minWidth: '120px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Marca</span>
                      {sortField === 'brand' && (
                        <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '150px', minWidth: '150px' }}>
                    Proveedor
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('price')}
                    style={{ width: '180px', minWidth: '180px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Precios</span>
                      {sortField === 'price' && (
                        <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('stock')}
                    style={{ width: '120px', minWidth: '120px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Stock</span>
                      {sortField === 'stock' && (
                        <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('status')}
                    style={{ width: '100px', minWidth: '100px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Estado</span>
                      {sortField === 'status' && (
                        <svg className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '200px', minWidth: '200px' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.sku}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {product.description || <span className="text-gray-400 italic">Sin descripción</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.category}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.brand}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.supplier || <span className="text-gray-400 italic">Sin proveedor</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          Precio: {formatCurrency(product.price)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Costo: {formatCurrency(product.cost)}
                        </div>
                        {product.margin !== undefined && (
                          <div className="text-xs text-blue-600">
                            Margen: {product.margin.toFixed(1)}%
                          </div>
                        )}
                        {product.suggestedPrice && product.suggestedPrice !== product.price && (
                          <div className="text-xs text-green-600">
                            Sugerido: {formatCurrency(product.suggestedPrice)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        product.stock <= product.minStock 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                      }`}>
                        {product.stock}
                      </div>
                      <div className="text-xs text-gray-500">Mín: {product.minStock}</div>
                      <StockStatusBadge currentStock={product.stock} minStock={product.minStock} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge variant={product.status === 'active' ? 'active' : 'inactive'} dot>
                        {product.status === 'active' ? 'Activo' : 'Inactivo'}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-900 px-2 py-1"
                          onClick={() => handleEditProduct(product)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-900 px-2 py-1"
                          onClick={() => handleStockAdjustment(product)}
                        >
                          Stock
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-purple-600 hover:text-purple-900 px-2 py-1"
                          onClick={() => handleViewStockMovements(product)}
                        >
                          Movimientos
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

              {sortedAndFilteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || categoryFilter !== 'all' ? 'No se encontraron productos con esos filtros.' : 'Comienza agregando tu primer producto.'}
                  </p>
                </div>
              )}
            </div>

            {/* Product count */}
            {sortedAndFilteredProducts.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end text-sm">
                <span className="text-gray-400">
                  {sortedAndFilteredProducts.length} producto{sortedAndFilteredProducts.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        </TabsContent>

        {/* Categories Tab Content */}
        <TabsContent value="categorias">
          <CategoriesTable
            categories={categories}
            onCategoriesUpdate={setCategories}
            productsByCategory={productsByCategory}
            allCategoryNames={stats.categories}
            products={products}
          />
        </TabsContent>

        </Tabs>
      </div>

      {/* Product Form */}
      <ProductForm 
        isOpen={isProductFormOpen} 
        onClose={handleCloseForm}
        editingProduct={editingProduct}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        closeModal={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesUpdate={setCategories}
      />

      {/* Stock Movements Modal */}
      {stockMovementsModal.product && (
        <Modal
          isOpen={stockMovementsModal.isOpen}
          onClose={handleCloseStockMovements}
          title={`Movimientos de Stock - ${stockMovementsModal.product.name}`}
          size="xl"
        >
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">SKU:</span>
                  <div className="text-gray-900">{stockMovementsModal.product.sku}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Stock Actual:</span>
                  <div className="text-gray-900 font-semibold">{stockMovementsModal.product.stock}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Stock Mínimo:</span>
                  <div className="text-gray-900">{stockMovementsModal.product.minStock}</div>
                </div>
              </div>
            </div>

            {/* Stock Movements Table */}
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '400px' }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Anterior
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Nuevo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getStockMovementsByProduct(stockMovementsModal.product.id)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.createdAt).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          movement.type === 'in' 
                            ? 'bg-green-100 text-green-800' 
                            : movement.type === 'out' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {movement.type === 'in' ? 'Entrada' : movement.type === 'out' ? 'Salida' : 'Ajuste'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className={movement.type === 'in' ? 'text-green-600' : movement.type === 'out' ? 'text-red-600' : 'text-blue-600'}>
                          {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}{movement.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {movement.previousStock}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {movement.newStock}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {movement.reason}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {movement.createdBy || 'Sistema'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {getStockMovementsByProduct(stockMovementsModal.product.id).length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sin movimientos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este producto aún no tiene movimientos de stock registrados.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stock Actions */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-900">Acciones Rápidas</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const adjustment = prompt('Cantidad a agregar (positivo) o quitar (negativo):', '10');
                      if (adjustment && !isNaN(Number(adjustment))) {
                        const adjustmentValue = parseInt(adjustment);
                        const newStock = stockMovementsModal.product!.stock + adjustmentValue;
                        
                        if (newStock >= 0) {
                          updateProduct(stockMovementsModal.product!.id, { stock: newStock });
                          addStockMovement({
                            productId: stockMovementsModal.product!.id,
                            type: adjustmentValue > 0 ? 'in' : 'out',
                            quantity: Math.abs(adjustmentValue),
                            previousStock: stockMovementsModal.product!.stock,
                            newStock: newStock,
                            reason: `Ajuste rápido: ${adjustmentValue > 0 ? 'Entrada' : 'Salida'} de ${Math.abs(adjustmentValue)} unidades`,
                            createdBy: 'Usuario'
                          });
                          // Update the modal state to reflect changes
                          setStockMovementsModal(prev => ({
                            ...prev,
                            product: prev.product ? { ...prev.product, stock: newStock } : null
                          }));
                        } else {
                          alert('El stock no puede ser negativo');
                        }
                      }
                    }}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    Ajuste Rápido
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloseStockMovements()}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}