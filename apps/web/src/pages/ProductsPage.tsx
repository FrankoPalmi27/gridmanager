import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@ui/Button';
import { StatusBadge, StockStatusBadge } from '@ui/StatusBadge';
import { Input } from '@ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ui/Tabs';
import { Modal } from '@ui/Modal';
import { ProductForm } from '@forms/ProductForm';
import { CategoriesTable } from '@components/tables/CategoriesTable';
import BulkProductImport from '@components/BulkProductImport';
import { useProductsStore, Product } from '@store/productsStore';
import { useSuppliersStore } from '@store/suppliersStore';
import { formatCurrency } from '@lib/formatters';
import { calculateMargin } from '@lib/calculations';
import { useTableScroll } from '@hooks/useTableScroll';
import {
  CloseOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  SearchOutlined,
  CaretUpOutlined,
  FileTextOutlined,
  RiseOutlined,
  BarChartOutlined,
  InboxOutlined,
  DownloadOutlined
} from '@ant-design/icons';

type SortField = 'name' | 'category' | 'brand' | 'price' | 'cost' | 'stock' | 'status';
type SortOrder = 'asc' | 'desc';

export function ProductsPage() {
  const { products, stats, updateProduct, deleteProduct, categories, setCategories, getStockMovementsByProduct, addStockMovement, loadProducts } = useProductsStore();
  const { getSupplierById } = useSuppliersStore();

  const hasRequestedInitialLoad = useRef(false);

  useEffect(() => {
    if (hasRequestedInitialLoad.current) {
      return;
    }

    hasRequestedInitialLoad.current = true;
    void loadProducts();
  }, [loadProducts]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeTab, setActiveTab] = useState('productos');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [stockMovementsModal, setStockMovementsModal] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
  const { tableScrollRef } = useTableScroll();

  const allCategories = ['all', ...stats.categories];

  // Helper function to get supplier name from ID
  const getSupplierName = (supplierId?: string): string => {
    if (!supplierId) return '';
    const supplier = getSupplierById(supplierId);
    return supplier ? supplier.name : supplierId; // Fallback to ID if supplier not found
  };

  // Helper to get supplierId from product (supports both supplierId and legacy supplier field)
  const getProductSupplierId = (product: Product): string | undefined => {
    return product.supplierId || product.supplier;
  };

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
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        (product.description?.toLowerCase().includes(searchLower) || false) ||
        (getProductSupplierId(product) && getSupplierName(getProductSupplierId(product)).toLowerCase().includes(searchLower));

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

  const handleStockAdjustment = async (product: Product) => {
    const newStock = prompt('Nuevo stock:', product.stock.toString());
    if (newStock !== null && !isNaN(Number(newStock))) {
      const newStockValue = parseInt(newStock);
      const previousStock = product.stock;

      try {
        // Update the product stock
        await updateProduct(product.id, { stock: newStockValue });

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
      } catch (error) {
        console.error('Error updating stock:', error);
        alert('Error al actualizar el stock');
      }
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    // ✅ CONFIRMACIÓN DOBLE OBLIGATORIA
    const firstConfirm = window.confirm(
      `¿Estás seguro de que quieres eliminar el producto "${product.name}" (SKU: ${product.sku})?

⚠️ Esta acción NO se puede deshacer.`
    );

    if (!firstConfirm) return;

    // Segunda confirmación más específica
    const secondConfirm = window.confirm(
      `⚠️ CONFIRMACIÓN FINAL ⚠️

Vas a eliminar PERMANENTEMENTE:
• Producto: ${product.name}
• SKU: ${product.sku}
• Stock actual: ${product.stock} unidades

Escribe "ELIMINAR" para confirmar (sin comillas):`
    );

    if (!secondConfirm) return;

    // Tercera confirmación con prompt para escribir "ELIMINAR"
    const finalConfirm = prompt(
      `⚠️ CONFIRMACIÓN FINAL ⚠️

Escribe exactamente "ELIMINAR" para confirmar la eliminación de "${product.name}":`
    );

    if (finalConfirm !== "ELIMINAR") {
      alert("❌ Eliminación cancelada. Texto no coincide.");
      return;
    }

    try {
      await deleteProduct(product.id);
      alert(`✅ Producto "${product.name}" eliminado correctamente.`);
    } catch (error) {
      alert(`❌ Error al eliminar el producto: ${error}`);
    }
  };

  // ✅ Función de exportación a CSV
  const handleExportToCSV = () => {
    try {
      // Headers del CSV
      const headers = [
        'SKU',
        'Nombre',
        'Categoría',
        'Marca',
        'Descripción',
        'Proveedor',
        'Costo',
        'Precio',
        'Margen %',
        'Stock',
        'Stock Mínimo',
        'Estado',
        'Fecha Creación'
      ];

      // Convertir productos a filas CSV
      const rows = sortedAndFilteredProducts.map(product => {
        const margin = calculateMargin(product.price, product.cost);
        const supplierName = getProductSupplierId(product)
          ? getSupplierName(getProductSupplierId(product))
          : 'Sin proveedor';

        return [
          product.sku,
          `"${product.name}"`, // Entrecomillar por si tiene comas
          `"${product.category}"`,
          `"${product.brand}"`,
          `"${product.description || ''}"`,
          `"${supplierName}"`,
          product.cost,
          product.price,
          margin.toFixed(2),
          product.stock,
          product.minStock,
          product.status === 'active' ? 'Activo' : 'Inactivo',
          new Date(product.createdAt).toLocaleDateString('es-AR')
        ];
      });

      // Construir CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `productos_${timestamp}_${sortedAndFilteredProducts.length}_items.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`✅ Exportación exitosa: ${sortedAndFilteredProducts.length} productos exportados a ${filename}`);
    } catch (error) {
      console.error('Error exportando productos:', error);
      alert('❌ Error al exportar productos');
    }
  };

  // Scroll functions now provided by useTableScroll hook

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Productos</h1>
            <p className="text-sm sm:text-base text-gray-600">Gestiona tu catálogo de productos y stock</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {activeTab === 'productos' && (
              <>
                <Button
                  onClick={handleExportToCSV}
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-600 hover:bg-green-50 w-full sm:w-auto"
                  disabled={sortedAndFilteredProducts.length === 0}
                >
                  <DownloadOutlined className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button
                  onClick={() => setShowBulkImport(true)}
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-600 hover:bg-orange-50 w-full sm:w-auto"
                >
                  Importar CSV
                </Button>
                <Button
                  onClick={handleNewProduct}
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  + Nuevo Producto
                </Button>
              </>
            )}
            {/* La pestaña Categorías tiene su propio botón "+ Nueva Categoría" dentro de CategoriesTable */}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="productos">
              Productos ({products.length})
            </TabsTrigger>
            <TabsTrigger value="categorias">
              Categorías ({stats.categories.length})
            </TabsTrigger>
            <TabsTrigger value="inventario">
              Inventario Valorizado
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
                  <CloseOutlined className="w-6 h-6" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <AppstoreOutlined className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Total Productos</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircleOutlined className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Productos Activos</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">{stats.activeProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-red-100 rounded-lg flex-shrink-0">
                <ExclamationCircleOutlined className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Stock Bajo</p>
                <p className="text-base sm:text-lg font-semibold text-red-600">{stats.lowStockProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                <DollarOutlined className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Valor Inventario</p>
                <p className="text-base sm:text-lg font-semibold text-green-600">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Buscar por nombre, SKU, marca, categoría, descripción o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<SearchOutlined className="h-5 w-5" />}
              iconPosition="left"
              className="w-full"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Filtrar por categoría"
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
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Lista de Productos</h3>
          </div>

          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden lg:block relative">
            <div
              ref={tableScrollRef}
              className="overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 max-w-full w-full max-h-[600px]"
            >
            <table className="divide-y divide-gray-200 min-w-[1400px] w-max">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] w-[120px]">
                    SKU
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none min-w-[200px] w-[200px]"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Producto</span>
                      {sortField === 'name' && (
                        <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px] w-[180px]">
                    Descripción
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none min-w-[140px] w-[140px]"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Categoría</span>
                      {sortField === 'category' && (
                        <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none min-w-[120px] w-[120px]"
                    onClick={() => handleSort('brand')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Marca</span>
                      {sortField === 'brand' && (
                        <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] w-[150px]">
                    Proveedor
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none min-w-[140px] w-[140px]"
                    onClick={() => handleSort('cost')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Costo Mercadería</span>
                      {sortField === 'cost' && (
                        <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none min-w-[140px] w-[140px]"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Precio Vta</span>
                      {sortField === 'price' && (
                        <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] w-[100px]">
                    Margen %
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none min-w-[120px] w-[120px]"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Stock</span>
                      {sortField === 'stock' && (
                        <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none min-w-[100px] w-[100px]"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Estado</span>
                      {sortField === 'status' && (
                        <CaretUpOutlined className={`w-3 h-3 ${sortOrder === 'asc' ? '' : 'transform rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] w-[200px]">
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
                          <AppstoreOutlined className="w-4 h-4 text-gray-500" />
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
                        {getProductSupplierId(product) ? (
                          getSupplierName(getProductSupplierId(product)) || <span className="text-gray-400 italic">Proveedor no encontrado</span>
                        ) : (
                          <span className="text-gray-400 italic">Sin proveedor</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(product.cost)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.price)}
                        </div>
                        {product.suggestedPrice && product.suggestedPrice !== product.price && (
                          <div className="text-xs text-green-600">
                            Sugerido: {formatCurrency(product.suggestedPrice)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(() => {
                        const margin = calculateMargin(product.price, product.cost);
                        return (
                          <div className={`text-sm font-semibold ${
                            product.price > 0 && product.cost > 0
                              ? (margin >= 30 ? 'text-green-600' :
                                 margin >= 20 ? 'text-blue-600' :
                                 margin >= 10 ? 'text-yellow-600' : 'text-red-600')
                              : 'text-gray-400'
                          }`}>
                            {product.price > 0 && product.cost > 0
                              ? `${margin.toFixed(1)}%`
                              : '-'
                            }
                          </div>
                        );
                      })()}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900 px-2 py-1"
                          onClick={() => handleDeleteProduct(product)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

              {sortedAndFilteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <AppstoreOutlined className="mx-auto h-12 w-12 text-gray-400" />
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

          {/* Mobile Cards - Shown on mobile/tablet only */}
          <div className="lg:hidden p-4 space-y-4">
            {sortedAndFilteredProducts.length > 0 ? (
              sortedAndFilteredProducts.map((product) => {
                const margin = calculateMargin(product.price, product.cost);
                const marginColor = margin >= 30 ? 'text-green-600'
                  : margin >= 20 ? 'text-blue-600'
                  : margin >= 10 ? 'text-yellow-600'
                  : 'text-red-600';

                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    {/* Header with name and status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <StatusBadge variant={product.status === 'active' ? 'active' : 'inactive'} dot>
                        {product.status === 'active' ? 'Activo' : 'Inactivo'}
                      </StatusBadge>
                    </div>

                    {/* Product details grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Categoría</p>
                        <p className="text-sm font-medium text-gray-900">{product.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Marca</p>
                        <p className="text-sm font-medium text-gray-900">{product.brand}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Costo</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(product.cost)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Precio Venta</p>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stock</p>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.stock}
                          </p>
                          <StockStatusBadge currentStock={product.stock} minStock={product.minStock} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Margen</p>
                        <p className={`text-sm font-bold ${marginColor}`}>{margin.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Description if available */}
                    {product.description && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500">Descripción</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{product.description}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50 touch-target"
                        onClick={() => handleEditProduct(product)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-green-600 border-green-600 hover:bg-green-50 touch-target"
                        onClick={() => handleStockAdjustment(product)}
                      >
                        Stock
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-purple-600 border-purple-600 hover:bg-purple-50 touch-target"
                        onClick={() => handleViewStockMovements(product)}
                      >
                        Movimientos
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <AppstoreOutlined className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-base font-medium text-gray-900 mb-2">No hay productos</h3>
                <p className="text-sm text-gray-500">
                  {searchTerm || categoryFilter !== 'all' ? 'No se encontraron productos con esos filtros.' : 'Comienza agregando tu primer producto.'}
                </p>
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

        {/* Inventory Valuation Tab Content */}
        <TabsContent value="inventario">
          <InventoryValuationView products={products} />
        </TabsContent>

        </Tabs>
      </div>

      {/* Product Form */}
      <ProductForm 
        isOpen={isProductFormOpen} 
        onClose={handleCloseForm}
        editingProduct={editingProduct}
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
            <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
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
                  <FileTextOutlined className="mx-auto h-12 w-12 text-gray-400" />
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
                    onClick={async () => {
                      const adjustment = prompt('Cantidad a agregar (positivo) o quitar (negativo):', '10');
                      if (adjustment && !isNaN(Number(adjustment))) {
                        const adjustmentValue = parseInt(adjustment);
                        const newStock = stockMovementsModal.product!.stock + adjustmentValue;

                        if (newStock >= 0) {
                          try {
                            await updateProduct(stockMovementsModal.product!.id, { stock: newStock });
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
                          } catch (error) {
                            console.error('Error updating stock:', error);
                            alert('Error al actualizar el stock');
                          }
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

// Inventory Valuation Component
interface InventoryValuationViewProps {
  products: Product[];
}

function InventoryValuationView({ products }: InventoryValuationViewProps) {
  const inventoryByCategory = useMemo(() => {
    const categoryData: Record<string, {
      products: number;
      totalStock: number;
      totalCostValue: number;
      totalSaleValue: number;
      items: {
        name: string;
        stock: number;
        cost: number;
        price: number;
        costValue: number;
        saleValue: number;
      }[];
    }> = {};

    products.forEach(product => {
      if (!categoryData[product.category]) {
        categoryData[product.category] = {
          products: 0,
          totalStock: 0,
          totalCostValue: 0,
          totalSaleValue: 0,
          items: []
        };
      }

      const costValue = product.stock * product.cost;
      const saleValue = product.stock * product.price;

      categoryData[product.category].products++;
      categoryData[product.category].totalStock += product.stock;
      categoryData[product.category].totalCostValue += costValue;
      categoryData[product.category].totalSaleValue += saleValue;
      categoryData[product.category].items.push({
        name: product.name,
        stock: product.stock,
        cost: product.cost,
        price: product.price,
        costValue,
        saleValue
      });
    });

    // Sort categories by total value descending
    return Object.entries(categoryData)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.totalSaleValue - a.totalSaleValue);
  }, [products]);

  const totalInventoryValue = inventoryByCategory.reduce((sum, cat) => sum + cat.totalSaleValue, 0);
  const totalCostValue = inventoryByCategory.reduce((sum, cat) => sum + cat.totalCostValue, 0);
  const totalPotentialProfit = totalInventoryValue - totalCostValue;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <AppstoreOutlined className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Valor Total (Venta)</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalInventoryValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarOutlined className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Valor Total (Costo)</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalCostValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <RiseOutlined className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600">Margen Potencial</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalPotentialProfit)}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <BarChartOutlined className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-600">Categorías</p>
              <p className="text-2xl font-bold text-orange-900">{inventoryByCategory.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Details */}
      <div className="space-y-4">
        {inventoryByCategory.map((category, index) => (
          <div key={category.category} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                    <p className="text-sm text-gray-500">
                      {category.products} productos • {category.totalStock} unidades en stock
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(category.totalSaleValue)}</p>
                  <p className="text-sm text-gray-500">Valor de venta</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(category.totalSaleValue)}</p>
                  <p className="text-sm text-blue-600 font-medium">Valor Venta</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(category.totalCostValue)}</p>
                  <p className="text-sm text-green-600 font-medium">Valor Costo</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(category.totalSaleValue - category.totalCostValue)}
                  </p>
                  <p className="text-sm text-purple-600 font-medium">Margen</p>
                </div>
              </div>

              {/* Products in Category */}
              <div className="overflow-x-auto overflow-y-auto max-h-[300px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costo Unit.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Unit.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Costo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Venta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {category.items
                      .sort((a, b) => b.saleValue - a.saleValue)
                      .map((item, itemIndex) => (
                        <tr key={itemIndex} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {item.stock}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.cost)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(item.costValue)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-blue-600">
                              {formatCurrency(item.saleValue)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {inventoryByCategory.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <InboxOutlined className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos registrados</h3>
          <p className="text-gray-500">
            Agrega productos al inventario para ver la valorización por categoría.
          </p>
        </div>
      )}
    </div>
  );
}