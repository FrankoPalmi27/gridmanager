import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { productsApi } from '../lib/api';
import { calculateMargin, calculatePriceFromMargin, calculateInventoryValue } from '../lib/calculations';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  description?: string;
  cost: number;
  price: number;
  margin?: number;
  suggestedPrice?: number;
  supplierId?: string;
  supplier?: string;
  imageUrl?: string;
  stock: number;
  minStock: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type StockMovementType = 'in' | 'out' | 'adjustment';

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  previousCost: number;
  newCost: number;
  previousPrice: number;
  newPrice: number;
  changedAt: string;
  changedBy?: string;
  reason?: string;
}

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

interface ProductsStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalValue: number;
  categories: string[];
}

type AddProductInput = {
  sku?: string;
  name: string;
  category: string;
  brand: string;
  description?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  status?: 'active' | 'inactive';
  supplier?: string;
  supplierId?: string;
  imageUrl?: string;
};

interface ProductsStore {
  products: Product[];
  categories: Category[];
  stockMovements: StockMovement[];
  priceHistory: PriceHistory[];
  isLoading: boolean;
  error: string | null;
  loadProducts: () => Promise<void>;
  addProduct: (productData: AddProductInput) => Promise<Product>;
  addBulkProducts: (productsData: AddProductInput[]) => Product[];
  updateProduct: (id: string, updatedData: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (id: string, newStock: number) => Promise<void>;
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  resetToInitialProducts: () => void;
  getProductById: (id: string) => Product | undefined;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => StockMovement;
  getStockMovementsByProduct: (productId: string) => StockMovement[];
  updateStockWithMovement: (productId: string, newStock: number, reason: string, reference?: string) => void;
  getStockAlerts: () => StockAlert[];
  checkStockLevel: (product: Product) => StockAlertLevel;
  generateStockAlert: (product: Product) => StockAlert | null;
  addPriceHistory: (history: Omit<PriceHistory, 'id' | 'changedAt'>) => PriceHistory;
  getPriceHistoryByProduct: (productId: string) => PriceHistory[];
  setError: (message: string | null) => void;
  stats: ProductsStats;
}

const safeUUID = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const nowIso = () => new Date().toISOString();

const mapBackendToFrontend = (backendProduct: any): Product => {
  const cost = Number(backendProduct.cost ?? backendProduct.baseCost ?? 0);
  const price = Number(backendProduct.basePrice ?? backendProduct.price ?? 0);
  const margin = calculateMargin(price, cost);

  return {
    id: backendProduct.id,
    sku: backendProduct.sku ?? safeUUID(),
    name: backendProduct.name ?? '',
    category: backendProduct.category ?? '',
    brand: backendProduct.brand ?? '',
    description: backendProduct.description ?? '',
    cost,
    price,
    margin,
    suggestedPrice: calculatePriceFromMargin(cost, 30) || price,
    supplierId: backendProduct.supplierId ?? backendProduct.supplier?.id ?? undefined,
    supplier: backendProduct.supplier?.name ?? backendProduct.supplierId ?? undefined,
    imageUrl: backendProduct.imageUrl ?? undefined,
    stock: Number(backendProduct.currentStock ?? backendProduct.stock ?? 0),
    minStock: Number(backendProduct.minStock ?? 0),
    status: backendProduct.active === false ? 'inactive' : 'active',
    createdAt: backendProduct.createdAt ?? nowIso(),
  };
};

const mapFrontendToBackendCreate = (frontendProduct: AddProductInput) => ({
  sku: frontendProduct.sku,
  name: frontendProduct.name,
  description: frontendProduct.description ?? '',
  category: frontendProduct.category ?? '',
  brand: frontendProduct.brand ?? '',
  cost: Number(frontendProduct.cost ?? 0),
  basePrice: Number(frontendProduct.price ?? 0),
  currentStock: Number(frontendProduct.stock ?? 0),
  minStock: Number(frontendProduct.minStock ?? 0),
  supplierId: frontendProduct.supplierId ?? frontendProduct.supplier ?? null,
  imageUrl: frontendProduct.imageUrl ?? null,
  active: frontendProduct.status ? frontendProduct.status === 'active' : true,
});

const mapFrontendToBackendUpdate = (frontendProduct: Partial<Product>) => {
  const payload: Record<string, unknown> = {};

  if (frontendProduct.sku !== undefined) payload.sku = frontendProduct.sku;
  if (frontendProduct.name !== undefined) payload.name = frontendProduct.name;
  if (frontendProduct.description !== undefined) payload.description = frontendProduct.description ?? '';
  if (frontendProduct.category !== undefined) payload.category = frontendProduct.category ?? '';
  if (frontendProduct.brand !== undefined) payload.brand = frontendProduct.brand ?? '';
  if (frontendProduct.cost !== undefined) payload.cost = Number(frontendProduct.cost);
  if (frontendProduct.price !== undefined) payload.basePrice = Number(frontendProduct.price);
  if (frontendProduct.minStock !== undefined) payload.minStock = Number(frontendProduct.minStock);
  if (frontendProduct.stock !== undefined) payload.currentStock = Number(frontendProduct.stock);
  if (frontendProduct.status !== undefined) payload.active = frontendProduct.status === 'active';
  if (frontendProduct.supplierId !== undefined || frontendProduct.supplier !== undefined) {
    payload.supplierId = frontendProduct.supplierId ?? frontendProduct.supplier ?? null;
  }
  if (frontendProduct.imageUrl !== undefined) payload.imageUrl = frontendProduct.imageUrl ?? null;

  return payload;
};

const mapBackendCategory = (backendCategory: any): Category | null => {
  const name = backendCategory?.name ?? backendCategory?.label;
  if (!name) {
    return null;
  }

  return {
    id: backendCategory.id ?? backendCategory.slug ?? safeUUID(),
    name,
    description: backendCategory.description ?? '',
    createdAt: backendCategory.createdAt ?? nowIso(),
  };
};

const extractList = (response: any): any[] => {
  const responseData = response?.data?.data ?? response?.data;
  const items = responseData?.data ?? responseData?.items ?? responseData;
  return Array.isArray(items) ? items : [];
};

const extractEntity = (response: any): any => {
  const responseData = response?.data?.data ?? response?.data;
  return (
    responseData?.data ??
    responseData?.product ??
    responseData?.item ??
    responseData
  );
};

const mergeCategoryByName = (categories: Category[], name: string): Category[] => {
  if (!name) {
    return categories;
  }

  if (categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
    return categories;
  }

  return [
    ...categories,
    {
      id: safeUUID(),
      name,
      createdAt: nowIso(),
    },
  ];
};

const generateSKU = (category: string, name: string): string => {
  const categoryPrefix = (category ?? 'GEN').slice(0, 3).toUpperCase();
  const namePrefix = (name ?? 'PRO').slice(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${categoryPrefix}-${namePrefix}-${timestamp}`;
};

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      stockMovements: [],
      priceHistory: [],
      isLoading: false,
      error: null,

      async loadProducts() {
        set({ isLoading: true, error: null });

        try {
          const response = await productsApi.getAll();
          const backendProducts = extractList(response);
          const products = backendProducts.map(mapBackendToFrontend);

          let categories = get().categories;
          try {
            const categoriesResponse = await productsApi.getCategories();
            const backendCategories = extractList(categoriesResponse)
              .map(mapBackendCategory)
              .filter((category): category is Category => Boolean(category));

            if (backendCategories.length > 0) {
              categories = backendCategories;
            }
          } catch (categoryError) {
            console.warn('[ProductsStore] Unable to load categories from API:', categoryError);
            const categoryNames = Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
            categories = categoryNames.reduce(mergeCategoryByName, categories);
          }

          set({ products, categories, isLoading: false });
        } catch (error: any) {
          console.error('[ProductsStore] Error loading products:', error);
          set({
            isLoading: false,
            error: error?.response?.data?.message ?? 'Error al cargar productos',
          });
        }
      },

      async addProduct(productData) {
        set({ error: null });

        const sku = productData.sku ?? generateSKU(productData.category, productData.name);
        const payload = mapFrontendToBackendCreate({ ...productData, sku });

        try {
          const response = await productsApi.create(payload);
          const backendProduct = extractEntity(response);
          const createdProduct = mapBackendToFrontend(backendProduct);

          set((state) => {
            const products = [createdProduct, ...state.products];
            const categories = mergeCategoryByName(state.categories, createdProduct.category);
            return { products, categories };
          });

          return createdProduct;
        } catch (error: any) {
          console.error('[ProductsStore] Error creating product:', error);
          const message = error?.response?.data?.message ?? 'Error al crear producto';
          set({ error: message });
          throw new Error(message);
        }
      },

      addBulkProducts(productsData) {
        if (!productsData.length) {
          return [];
        }

        const now = nowIso();
        const createdProducts: Product[] = productsData.map((input) => {
          const sku = input.sku ?? generateSKU(input.category, input.name);
          const cost = Number(input.cost ?? 0);
          const price = Number(input.price ?? 0);
          return {
            id: safeUUID(),
            sku,
            name: input.name,
            category: input.category,
            brand: input.brand,
            description: input.description ?? '',
            cost,
            price,
            margin: calculateMargin(price, cost),
            suggestedPrice: calculatePriceFromMargin(cost, 30) || price,
            supplierId: input.supplierId ?? input.supplier,
            supplier: input.supplier,
            imageUrl: input.imageUrl,
            stock: Number(input.stock ?? 0),
            minStock: Number(input.minStock ?? 0),
            status: input.status ?? 'active',
            createdAt: now,
          };
        });

        set((state) => {
          const products = [...createdProducts, ...state.products];
          let categories = state.categories;
          for (const product of createdProducts) {
            categories = mergeCategoryByName(categories, product.category);
          }

          return { products, categories };
        });

        return createdProducts;
      },

      async updateProduct(id, updatedData) {
        set({ error: null });

        try {
          const payload = mapFrontendToBackendUpdate(updatedData);
          await productsApi.update(id, payload);

          set((state) => {
            const products = state.products.map((product) => {
              if (product.id !== id) {
                return product;
              }

              const nextCost = updatedData.cost ?? product.cost;
              const nextPrice = updatedData.price ?? product.price;

              const nextProduct: Product = {
                ...product,
                ...updatedData,
                cost: Number(nextCost),
                price: Number(nextPrice),
                margin: calculateMargin(Number(nextPrice), Number(nextCost)),
                suggestedPrice: calculatePriceFromMargin(Number(nextCost), 30) || nextPrice,
              };

              if (updatedData.category) {
                nextProduct.category = updatedData.category;
              }
              if (updatedData.stock !== undefined) {
                nextProduct.stock = Number(updatedData.stock);
              }
              if (updatedData.minStock !== undefined) {
                nextProduct.minStock = Number(updatedData.minStock);
              }
              if (updatedData.status) {
                nextProduct.status = updatedData.status;
              }
              if (updatedData.supplierId !== undefined) {
                nextProduct.supplierId = updatedData.supplierId ?? undefined;
              }
              if (updatedData.supplier !== undefined) {
                nextProduct.supplier = updatedData.supplier ?? undefined;
              }

              return nextProduct;
            });

            const categories = updatedData.category
              ? mergeCategoryByName(state.categories, updatedData.category)
              : state.categories;

            return { products, categories };
          });
        } catch (error: any) {
          console.error('[ProductsStore] Error updating product:', error);
          const message = error?.response?.data?.message ?? 'Error al actualizar producto';
          set({ error: message });
          throw new Error(message);
        }
      },

      async deleteProduct(id) {
        set({ error: null });

        try {
          await productsApi.delete(id);
          set((state) => ({ products: state.products.filter((product) => product.id !== id) }));
        } catch (error: any) {
          console.error('[ProductsStore] Error deleting product:', error);
          const message = error?.response?.data?.message ?? 'Error al eliminar producto';
          set({ error: message });
          throw new Error(message);
        }
      },

      async updateStock(id, newStock) {
        await get().updateProduct(id, { stock: newStock });
      },

      setProducts(products) {
        set({ products });
      },

      setCategories(categories) {
        set({ categories });
      },

      resetToInitialProducts() {
        set({ products: [] });
      },

      getProductById(id) {
        return get().products.find((product) => product.id === id);
      },

      addStockMovement(movementInput) {
        const movement: StockMovement = {
          id: safeUUID(),
          createdAt: nowIso(),
          ...movementInput,
        };

        set((state) => ({ stockMovements: [movement, ...state.stockMovements].slice(0, 200) }));
        return movement;
      },

      getStockMovementsByProduct(productId) {
        return get().stockMovements.filter((movement) => movement.productId === productId);
      },

      updateStockWithMovement(productId, newStock, reason, reference) {
        const product = get().getProductById(productId);
        if (!product) {
          console.warn('[ProductsStore] updateStockWithMovement  product not found', productId);
          return;
        }

        const previousStock = product.stock;
        const quantity = newStock - previousStock;
        const type: StockMovementType = quantity > 0 ? 'in' : quantity < 0 ? 'out' : 'adjustment';

        set((state) => ({
          products: state.products.map((item) =>
            item.id === productId
              ? { ...item, stock: newStock }
              : item
          ),
        }));

        get().addStockMovement({
          productId,
          type,
          quantity: Math.abs(quantity),
          previousStock,
          newStock,
          reason,
          reference,
          createdBy: 'Sistema',
        });

        void productsApi
          .update(productId, mapFrontendToBackendUpdate({ stock: newStock }))
          .catch((error: unknown) => {
            console.error('[ProductsStore] Error syncing stock update:', error);
          });
      },

      getStockAlerts() {
        const alerts: StockAlert[] = [];
        const products = get().products;

        for (const product of products) {
          const alert = get().generateStockAlert(product);
          if (alert) {
            alerts.push(alert);
          }
        }

        return alerts;
      },

      checkStockLevel(product) {
        if (product.stock <= 0) {
          return 'critical';
        }
        if (product.stock <= product.minStock) {
          return 'high';
        }
        if (product.stock - product.minStock <= 5) {
          return 'medium';
        }
        return 'normal';
      },

      generateStockAlert(product) {
        const level = get().checkStockLevel(product);
        if (level === 'normal') {
          return null;
        }

        const colorMap: Record<Exclude<StockAlertLevel, 'normal'>, StockAlert['color']> = {
          critical: 'red',
          high: 'orange',
          medium: 'yellow',
        };

        const readableLevel: Record<Exclude<StockAlertLevel, 'normal'>, string> = {
          critical: 'CRÍTICO',
          high: 'BAJO',
          medium: 'EN ALERTA',
        };

        return {
          id: safeUUID(),
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          currentStock: product.stock,
          minStock: product.minStock,
          level,
          message: `Stock ${readableLevel[level]}: ${product.stock} unidades (mínimo ${product.minStock})`,
          color: colorMap[level],
          canSell: product.stock > 0,
          createdAt: nowIso(),
        };
      },

      addPriceHistory(historyInput) {
        const history: PriceHistory = {
          id: safeUUID(),
          changedAt: nowIso(),
          ...historyInput,
        };

        set((state) => ({ priceHistory: [history, ...state.priceHistory].slice(0, 200) }));
        return history;
      },

      getPriceHistoryByProduct(productId) {
        return get().priceHistory.filter((entry) => entry.productId === productId);
      },

      setError(message) {
        set({ error: message });
      },

      get stats() {
        const products = get().products;
        const customCategories = get().categories.map((category) => category.name);

        const totalProducts = products.length;
        const activeProducts = products.filter((product) => product.status === 'active').length;
        const lowStockProducts = products.filter((product) => product.stock <= product.minStock).length;
        const totalValue = products.reduce((total, product) => total + calculateInventoryValue(product.stock, product.cost), 0);
        const categories = Array.from(
          new Set([
            ...customCategories,
            ...products.map((product) => product.category).filter(Boolean),
          ]),
        );

        return {
          totalProducts,
          activeProducts,
          lowStockProducts,
          totalValue,
          categories,
        } satisfies ProductsStats;
      },
    }),
    {
      name: 'grid-manager:products-store',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined,
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        stockMovements: state.stockMovements,
        priceHistory: state.priceHistory,
      }),
    },
  ),
);
