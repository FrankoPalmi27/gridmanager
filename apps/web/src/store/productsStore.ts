import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import { productsApi } from '../lib/api';
import { loadWithSync, getSyncMode, SyncConfig, updateWithSync, createWithSync, deleteWithSync } from '../lib/syncStorage';

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
  }) => Promise<Product>;
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
  updateProduct: (id: string, updatedData: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (id: string, newStock: number) => Promise<void>;
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

// Helper to map backend product to frontend format
const mapBackendToFrontend = (backendProduct: any): Product => {
  const cost = Number(backendProduct.cost);
  const price = Number(backendProduct.basePrice);
  const margin = cost > 0 ? ((price - cost) / cost) * 100 : 0;

  return {
    id: backendProduct.id,
    sku: backendProduct.sku,
    name: backendProduct.name,
    category: backendProduct.category || '',
    brand: backendProduct.brand || '',
    description: backendProduct.description || '',
    cost,
    price, // Backend uses basePrice
    margin,
    suggestedPrice: price,
    supplier: '', // Not stored in backend
    stock: backendProduct.currentStock || 0, // Backend uses currentStock
    minStock: backendProduct.minStock || 0,
    status: backendProduct.active ? 'active' : 'inactive', // Backend uses active boolean
    createdAt: backendProduct.createdAt,
  };
};

// Helper to map frontend product to backend format for CREATE
const mapFrontendToBackendCreate = (frontendProduct: any) => ({
  sku: frontendProduct.sku,
  name: frontendProduct.name,
  description: frontendProduct.description || '',
  category: frontendProduct.category || '',
  brand: frontendProduct.brand || '',
  cost: Number(frontendProduct.cost),
  basePrice: Number(frontendProduct.price), // Frontend uses price
  taxRate: 0,
  minStock: frontendProduct.minStock || 0,
  unit: 'UNIT',
  // Note: currentStock is NOT set on create - it starts at 0
  // Stock adjustments should be done via stock movements
});

// Helper to map frontend product to backend format for UPDATE
const mapFrontendToBackendUpdate = (frontendProduct: any) => {
  const updateData: any = {};

  if (frontendProduct.sku !== undefined) updateData.sku = frontendProduct.sku;
  if (frontendProduct.name !== undefined) updateData.name = frontendProduct.name;
  if (frontendProduct.description !== undefined) updateData.description = frontendProduct.description || '';
  if (frontendProduct.category !== undefined) updateData.category = frontendProduct.category || '';
  if (frontendProduct.brand !== undefined) updateData.brand = frontendProduct.brand || '';
  if (frontendProduct.cost !== undefined) updateData.cost = Number(frontendProduct.cost);
  if (frontendProduct.price !== undefined) updateData.basePrice = Number(frontendProduct.price);
  if (frontendProduct.minStock !== undefined) updateData.minStock = frontendProduct.minStock;
  if (frontendProduct.stock !== undefined) updateData.currentStock = frontendProduct.stock;
  if (frontendProduct.status !== undefined) updateData.active = frontendProduct.status === 'active';

  return updateData;
};

// Sync configuration
const syncConfig: SyncConfig<Product> = {
  storageKey: 'products',
  apiGet: () => productsApi.getAll(),
  apiCreate: (data: any) => {
    const backendData = mapFrontendToBackendCreate(data);
    return productsApi.create(backendData);
  },
  apiUpdate: (id: string, data: Partial<Product>) => {
    const backendData = mapFrontendToBackendUpdate(data);
    return productsApi.update(id, backendData);
  },
  apiDelete: (id: string) => productsApi.delete(id),
  extractData: (response: any) => {
    const responseData = response.data.data || response.data;

    // Handle single product response (from create/update)
    if (responseData.product) {
      return [mapBackendToFrontend(responseData.product)];
    }

    // Handle paginated response (from list)
    // Backend returns { data: [...], total, page, limit, totalPages }
    const items = responseData.data || responseData.items || responseData;
    if (Array.isArray(items)) {
      return items.map(mapBackendToFrontend);
    }

    console.warn('⚠️ Unexpected products response structure:', responseData);
    return [];
  },
};

type ProductsBroadcastEvent =
  | {
      type: 'products/update';
      payload: {
        products: Product[];
        categories: Category[];
        stockMovements: StockMovement[];
        syncMode?: 'online' | 'offline';
      };
      source: string;
      timestamp: number;
    }
  | {
      type: 'products/request-refresh';
      source: string;
      timestamp: number;
    };

const BROADCAST_CHANNEL_NAME = 'grid-manager:products';

const createTabId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const tabId = createTabId();

const broadcastChannel =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    : null;

const broadcast = (event: ProductsBroadcastEvent) => {
  if (!broadcastChannel) {
    return;
  }

  broadcastChannel.postMessage(event);
};

let isBroadcastRegistered = false;

const registerBroadcastListener = (
  set: StoreApi<ProductsStore>['setState'],
  get: StoreApi<ProductsStore>['getState'],
) => {
  if (!broadcastChannel || isBroadcastRegistered) {
    return;
  }

  broadcastChannel.addEventListener('message', (event: MessageEvent<ProductsBroadcastEvent>) => {
    const data = event.data;

    if (!data || data.source === tabId) {
      return;
    }

    if (data.type === 'products/update') {
      const { products, categories, stockMovements, syncMode } = data.payload;
      set((state) => ({
        products,
        categories,
        stockMovements,
        syncMode: syncMode ?? state.syncMode,
      }));
    }

    if (data.type === 'products/request-refresh') {
      void get().loadProducts();
    }
  });

  isBroadcastRegistered = true;
};

const storage = typeof window !== 'undefined'
  ? createJSONStorage<ProductsStore>(() => window.localStorage)
  : undefined;

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set, get) => {
      registerBroadcastListener(set, get);

      const broadcastState = (overrides?: {
        products?: Product[];
        categories?: Category[];
        stockMovements?: StockMovement[];
        syncMode?: 'online' | 'offline';
      }) => {
        const state = get();
        broadcast({
          type: 'products/update',
          payload: {
            products: overrides?.products ?? state.products,
            categories: overrides?.categories ?? state.categories,
            stockMovements: overrides?.stockMovements ?? state.stockMovements,
            syncMode: overrides?.syncMode ?? state.syncMode,
          },
          source: tabId,
          timestamp: Date.now(),
        });
      };

      return {
  products: initialProducts,
  categories: [],
  stockMovements: [],
  isLoading: false,
  syncMode: getSyncMode(),

  loadProducts: async () => {
    const mode = getSyncMode();
    set({ isLoading: true, syncMode: mode });
    try {
      const products = await loadWithSync<Product>(syncConfig, initialProducts);
      set({ products, isLoading: false, syncMode: mode });
      broadcastState({ products, syncMode: mode });
    } catch (error) {
      console.error('Error loading products:', error);
      set({ isLoading: false });
    }
  },

  addProduct: async (productData) => {
    const state = get();
    // Calculate margin if not provided
    const calculatedMargin = productData.margin ||
      (productData.cost > 0 ? ((productData.price - productData.cost) / productData.cost) * 100 : 0);

    // Calculate suggested price if not provided (using 50% margin as default)
    const calculatedSuggestedPrice = productData.suggestedPrice ||
      (productData.cost * 1.5);

    // Don't include ID - backend will generate it
    const dataToSend = {
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
    };

    try {
      // Create with API sync and wait for response
      const createdProduct = await createWithSync<Product>(syncConfig, dataToSend as any, state.products);
      const nextProducts = [createdProduct, ...state.products];
      const nextSyncMode = getSyncMode();
      set({ products: nextProducts, syncMode: nextSyncMode });
      broadcastState({ products: nextProducts, syncMode: nextSyncMode });
      return createdProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
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

    const nextSyncMode = getSyncMode();
    set((state) => ({
      products: [...newProducts, ...state.products],
      syncMode: nextSyncMode,
    }));
    broadcastState({ syncMode: nextSyncMode });
    
    return newProducts;
  },

  updateProduct: async (id, updatedData) => {
    const state = get();
    try {
      // Update with API sync first
      await updateWithSync<Product>(syncConfig, id, updatedData, state.products);

      // Update local state after successful API call
      const newProducts = state.products.map(product =>
        product.id === id ? { ...product, ...updatedData } : product
      );
      const nextSyncMode = getSyncMode();
      set({ products: newProducts, syncMode: nextSyncMode });
      broadcastState({ products: newProducts, syncMode: nextSyncMode });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    const state = get();

    try {
      await deleteWithSync<Product>(syncConfig, id, state.products);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }

    const nextProducts = state.products.filter(product => product.id !== id);
    const nextSyncMode = getSyncMode();
    set({ products: nextProducts, syncMode: nextSyncMode });
    broadcastState({ products: nextProducts, syncMode: nextSyncMode });
  },

  updateStock: async (id, newStock) => {
    const state = get();
    try {
      // Update with API sync first
      await updateWithSync<Product>(syncConfig, id, { stock: newStock }, state.products);

      // Update local state after successful API call
      const newProducts = state.products.map(product =>
        product.id === id ? { ...product, stock: newStock } : product
      );
      const nextSyncMode = getSyncMode();
      set({ products: newProducts, syncMode: nextSyncMode });
      broadcastState({ products: newProducts, syncMode: nextSyncMode });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  setProducts: (products) => {
    set({ products });
    broadcastState({ products });
  },

  setCategories: (categories) => {
    set({ categories });
    broadcastState({ categories });
  },

  resetToInitialProducts: () => {
    set({ products: initialProducts });
    broadcastState({ products: initialProducts });
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
    broadcastState();
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

    broadcastState();

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
      };
    },
    {
      name: 'grid-manager:products-store',
      storage,
    },
  ),
);