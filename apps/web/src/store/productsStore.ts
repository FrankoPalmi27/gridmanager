import { create } from 'zustand';

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
  stock: number;
  minStock: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

// Tipo para las categorías
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// LocalStorage keys
const PRODUCTS_STORAGE_KEY = 'gridmanager_products';
const CATEGORIES_STORAGE_KEY = 'gridmanager_categories';

// LocalStorage utilities
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Productos iniciales de ejemplo
const initialProducts: Product[] = [
  {
    id: '1',
    sku: 'PROD-001',
    name: 'Producto Ejemplo A',
    category: 'Electrónicos',
    brand: 'Marca A',
    description: 'Producto de ejemplo para demostración',
    cost: 100,
    price: 150,
    stock: 25,
    minStock: 10,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    sku: 'PROD-002',
    name: 'Producto Ejemplo B',
    category: 'Hogar',
    brand: 'Marca B',
    description: 'Producto de ejemplo para demostración',
    cost: 50,
    price: 75,
    stock: 5,
    minStock: 15,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    sku: 'PROD-003',
    name: 'Producto Ejemplo C',
    category: 'Ropa',
    brand: 'Marca C',
    description: 'Producto de ejemplo para demostración',
    cost: 30,
    price: 50,
    stock: 100,
    minStock: 20,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    sku: 'PROD-004',
    name: 'Producto Descontinuado',
    category: 'Varios',
    brand: 'Marca D',
    description: 'Producto descontinuado',
    cost: 20,
    price: 40,
    stock: 0,
    minStock: 5,
    status: 'inactive',
    createdAt: new Date().toISOString()
  }
];

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
  const productCategories = Array.from(new Set(products.map(p => p.category)));
  const allCategoryNames = [...new Set([...customCategoryNames, ...productCategories])];
  return allCategoryNames;
};

interface ProductsStore {
  products: Product[];
  categories: Category[];
  addProduct: (productData: {
    name: string;
    category: string;
    brand: string;
    description?: string;
    cost: number;
    price: number;
    stock: number;
    minStock: number;
    status?: 'active' | 'inactive';
  }) => Product;
  updateProduct: (id: string, updatedData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateStock: (id: string, newStock: number) => void;
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalValue: number;
    categories: string[];
  };
}

export const useProductsStore = create<ProductsStore>((set, get) => ({
  products: loadFromStorage(PRODUCTS_STORAGE_KEY, initialProducts),
  categories: loadFromStorage(CATEGORIES_STORAGE_KEY, []),

  addProduct: (productData) => {
    const newProduct: Product = {
      id: Date.now().toString(),
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

    set((state) => {
      const newProducts = [newProduct, ...state.products];
      saveToStorage(PRODUCTS_STORAGE_KEY, newProducts);
      return { products: newProducts };
    });
    
    return newProduct;
  },

  updateProduct: (id, updatedData) => {
    set((state) => {
      const newProducts = state.products.map(product =>
        product.id === id ? { ...product, ...updatedData } : product
      );
      saveToStorage(PRODUCTS_STORAGE_KEY, newProducts);
      return { products: newProducts };
    });
  },

  deleteProduct: (id) => {
    set((state) => {
      const newProducts = state.products.filter(product => product.id !== id);
      saveToStorage(PRODUCTS_STORAGE_KEY, newProducts);
      return { products: newProducts };
    });
  },

  updateStock: (id, newStock) => {
    set((state) => {
      const newProducts = state.products.map(product =>
        product.id === id ? { ...product, stock: newStock } : product
      );
      saveToStorage(PRODUCTS_STORAGE_KEY, newProducts);
      return { products: newProducts };
    });
  },

  setProducts: (products) => {
    set({ products });
    saveToStorage(PRODUCTS_STORAGE_KEY, products);
  },

  setCategories: (categories) => {
    set({ categories });
    saveToStorage(CATEGORIES_STORAGE_KEY, categories);
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