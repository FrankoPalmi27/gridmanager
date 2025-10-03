import { create } from 'zustand';
import { productsApi } from '../lib/api';
import { loadWithSync, getSyncMode, SyncConfig, updateWithSync } from '../lib/syncStorage';

// Tipo para los productos
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  description?: string;
  cost: number;
  price: number;
  margin?: number;  // Calculated field: ((price - cost) / cost) * 100
  suggestedPrice?: number; // Price suggestion based on cost + target margin
  supplier?: string; // Supplier name
  stock: number;
  minStock: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

// Tipo para los movimientos de stock
export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string; // Sale ID, Purchase ID, etc.
  createdAt: string;
  createdBy?: string;
}

// Tipo para las categorías
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// Tipos para alertas de stock
export type StockAlertLevel = 'critical' | 'high' | 'medium' | 'normal';

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  minStock: number;
  level: StockAlertLevel;
  message: string;
  color: 'red' | 'orange' | 'yellow' | 'green';
  canSell: boolean;
  createdAt: string;
}


// No initial data - users start with empty list
const initialProducts: Product[] = [];

// Función para generar SKU automático
const generateSKU = (category: string, name: string): string => {
  const categoryPrefix = category.substring(0, 3).toUpperCase();
  const namePrefix = name.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${categoryPrefix}-${namePrefix}-${timestamp}`;
};

// Get all unique categories (custom + from products)
const getAllCategories = (products: Product[], categories: Category[]) => {
  const customCategoryNames = categories.map(cat => cat.name);
  const productCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const allCategoryNames = [...new Set([...customCategoryNames, ...productCategories])];

  // Debug logging to understand what's happening
  console.log('🔍 getAllCategories Debug:');
  console.log('customCategoryNames:', customCategoryNames);
  console.log('productCategories:', productCategories);
  console.log('allCategoryNames:', allCategoryNames);

  return allCategoryNames;
};

interface ProductsStore {
  products: Product[];
  categories: Category[];
  stockMovements: StockMovement[];
  isLoading: boolean;
  syncMode: 'online' | 'offline';
  loadProducts: () => Promise<void>;
  addProduct: (productData: {
    name: string;
    category: string;
    brand: string;
    description?: string;
    cost: number;
    price: number;
    margin?: number;
    suggestedPrice?: number;
    supplier?: string;
    stock: number;
    minStock: number;
    status?: 'active' | 'inactive';
  }) => Product;
  addBulkProducts: (productsData: {
    name: string;
    category: string;
    brand: string;
    description?: string;
    cost: number;
    price: number;
    stock: number;
    minStock: number;
    status?: 'active' | 'inactive';
  }[]) => Product[];
  updateProduct: (id: string, updatedData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateStock: (id: string, newStock: number) => void;
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  resetToInitialProducts: () => void;
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalValue: number;
    categories: string[];
  };
  // Stock movements functions
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => void;
  getStockMovementsByProduct: (productId: string) => StockMovement[];
  updateStockWithMovement: (productId: string, newStock: number, reason: string, reference?: string) => void;
  // Stock alert functions
  getStockAlerts: () => StockAlert[];
  getProductById: (id: string) => Product | undefined;
  checkStockLevel: (product: Product) => StockAlertLevel;
  generateStockAlert: (product: Product) => StockAlert | null;
}

// Sync configuration
const syncConfig: SyncConfig<Product> = {
  storageKey: 'products',
  apiGet: () => productsApi.getAll(),
  apiUpdate: (id: string, data: Partial<Product>) => productsApi.update(id, data),
  extractData: (response: any) => {
    const data = response.data.data || response.data;
    // Handle paginated response
    return data.items || data;
  },
};

export const useProductsStore = create<ProductsStore>((set, get) => ({
  products: initialProducts,
  categories: [],
  stockMovements: [],
  isLoading: false,
  syncMode: getSyncMode(),

  loadProducts: async () => {
    set({ isLoading: true, syncMode: getSyncMode() });
    try {
      const products = await loadWithSync<Product>(syncConfig, initialProducts);
      set({ products, isLoading: false });
    } catch (error) {
      console.error('Error loading products:', error);
      set({ isLoading: false });
    }
  },

  addProduct: (productData) => {
    // Calculate margin if not provided
    const calculatedMargin = productData.margin || 
      (productData.cost > 0 ? ((productData.price - productData.cost) / productData.cost) * 100 : 0);
    
    // Calculate suggested price if not provided (using 50% margin as default)
    const calculatedSuggestedPrice = productData.suggestedPrice || 
      (productData.cost * 1.5);

    const newProduct: Product = {
      id: Date.now().toString(),
      sku: generateSKU(productData.category, productData.name),
      name: productData.name,
      category: productData.category,
      brand: productData.brand,
      description: productData.description || '',
      cost: productData.cost,
      price: productData.price,
      margin: calculatedMargin,
      suggestedPrice: calculatedSuggestedPrice,
      supplier: productData.supplier || '',
      stock: productData.stock,
      minStock: productData.minStock,
      status: productData.status || 'active',
      createdAt: new Date().toISOString()
    };

    set((state) => ({
      products: [newProduct, ...state.products]
    }));
    
    return newProduct;
  },

  addBulkProducts: (productsData) => {
    const newProducts: Product[] = [];
    let currentTimestamp = Date.now();

    productsData.forEach((productData) => {
      const newProduct: Product = {
        id: currentTimestamp.toString(),
        sku: generateSKU(productData.category, productData.name),
        name: productData.name,
        category: productData.category,
        brand: productData.brand,
        description: productData.description || '',
        cost: productData.cost,
        price: productData.price,
        stock: productData.stock,
        minStock: productData.minStock,
        status: productData.status || 'active',
        createdAt: new Date().toISOString()
      };
      
      newProducts.push(newProduct);
      currentTimestamp += 1; // Ensure unique IDs
    });

    set((state) => ({
      products: [...newProducts, ...state.products]
    }));
    
    return newProducts;
  },

  updateProduct: (id, updatedData) => {
    set((state) => {
      const newProducts = state.products.map(product =>
        product.id === id ? { ...product, ...updatedData } : product
      );
      return { products: newProducts };
    });
  },

  deleteProduct: (id) => {
    set((state) => {
      const newProducts = state.products.filter(product => product.id !== id);
      return { products: newProducts };
    });
  },

  updateStock: (id, newStock) => {
    set((state) => {
      const newProducts = state.products.map(product =>
        product.id === id ? { ...product, stock: newStock } : product
      );
      return { products: newProducts };
    });
  },

  setProducts: (products) => {
    set({ products });
  },

  setCategories: (categories) => {
    set({ categories });
  },

  resetToInitialProducts: () => {
    set({ products: initialProducts });
  },

  // Stock movements functions
  addStockMovement: (movement) => {
    const newMovement: StockMovement = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...movement
    };

    set((state) => {
      const newMovements = [newMovement, ...state.stockMovements];
      return { stockMovements: newMovements };
    });
  },

  getStockMovementsByProduct: (productId) => {
    const state = get();
    return state.stockMovements.filter(movement => movement.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateStockWithMovement: (productId, newStock, reason, reference) => {
    set((state) => {
      const product = state.products.find(p => p.id === productId);
      if (!product) return state;

      const previousStock = product.stock;
      const quantity = newStock - previousStock;
      const type: 'in' | 'out' | 'adjustment' = 
        quantity > 0 ? 'in' : quantity < 0 ? 'out' : 'adjustment';

      // Update product stock
      const updatedProducts = state.products.map(p =>
        p.id === productId ? { ...p, stock: newStock } : p
      );

      // Create stock movement
      const newMovement: StockMovement = {
        id: Date.now().toString(),
        productId,
        type,
        quantity: Math.abs(quantity),
        previousStock,
        newStock,
        reason,
        reference,
        createdAt: new Date().toISOString()
      };

      const newMovements = [newMovement, ...state.stockMovements];

      return {
        products: updatedProducts,
        stockMovements: newMovements
      };
    });

    updateWithSync<Product>(syncConfig, productId, { stock: newStock }, get().products)
      .catch((error) => console.error('Error syncing stock update:', error));
  },

  // Stock alert functions implementation
  getProductById: (id) => {
    const state = get();
    return state.products.find(p => p.id === id);
  },

  checkStockLevel: (product) => {
    if (product.stock === 0) return 'critical';
    if (product.stock < product.minStock) return 'high';
    if (product.stock <= product.minStock * 1.2) return 'medium';
    return 'normal';
  },

  generateStockAlert: (product) => {
    const level = get().checkStockLevel(product);
    
    if (level === 'normal') return null;

    let message = '';
    let color: 'red' | 'orange' | 'yellow' | 'green' = 'green';
    let canSell = true;

    switch (level) {
      case 'critical':
        message = `¡CRÍTICO! Stock agotado - Bloquear ventas`;
        color = 'red';
        canSell = false;
        break;
      case 'high':
        message = `¡ALTA! Stock por debajo del mínimo - Sugerir reorden`;
        color = 'orange';
        canSell = true;
        break;
      case 'medium':
        message = `MEDIA: Stock cerca del mínimo - Monitorear`;
        color = 'yellow';
        canSell = true;
        break;
    }

    return {
      id: `alert-${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      currentStock: product.stock,
      minStock: product.minStock,
      level,
      message,
      color,
      canSell,
      createdAt: new Date().toISOString()
    };
  },

  getStockAlerts: () => {
    const state = get();
    const alerts: StockAlert[] = [];
    
    state.products
      .filter(p => p.status === 'active')
      .forEach(product => {
        const alert = get().generateStockAlert(product);
        if (alert) {
          alerts.push(alert);
        }
      });

    // Sort by priority: critical first, then by stock level
    return alerts.sort((a, b) => {
      const priority = { critical: 0, high: 1, medium: 2, normal: 3 };
      return priority[a.level] - priority[b.level];
    });
  },

  get stats() {
    const state = get();
    return {
      totalProducts: state.products.length,
      activeProducts: state.products.filter(p => p.status === 'active').length,
      lowStockProducts: state.products.filter(p => p.stock <= p.minStock && p.status === 'active').length,
      totalValue: state.products.reduce((sum, p) => sum + (p.cost * p.stock), 0),
      categories: getAllCategories(state.products, state.categories)
    };
  }
}));