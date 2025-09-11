import { useState, useEffect } from 'react';

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

// Hook personalizado para manejar los productos
export const useProductsStore = () => {
  const [products, setProducts] = useState<Product[]>(() => 
    loadFromStorage(PRODUCTS_STORAGE_KEY, initialProducts)
  );

  const [categories, setCategories] = useState<Category[]>(() => 
    loadFromStorage(CATEGORIES_STORAGE_KEY, [])
  );

  // Save to localStorage whenever products change
  useEffect(() => {
    saveToStorage(PRODUCTS_STORAGE_KEY, products);
  }, [products]);

  // Save to localStorage whenever categories change
  useEffect(() => {
    saveToStorage(CATEGORIES_STORAGE_KEY, categories);
  }, [categories]);

  // Función para generar SKU automático
  const generateSKU = (category: string, name: string): string => {
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    const namePrefix = name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${categoryPrefix}-${namePrefix}-${timestamp}`;
  };

  const addProduct = (productData: {
    name: string;
    category: string;
    brand: string;
    description?: string;
    cost: number;
    price: number;
    stock: number;
    minStock: number;
    status?: 'active' | 'inactive';
  }) => {
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

    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updatedData: Partial<Product>) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === id ? { ...product, ...updatedData } : product
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prevProducts =>
      prevProducts.filter(product => product.id !== id)
    );
  };

  const updateStock = (id: string, newStock: number) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === id ? { ...product, stock: newStock } : product
      )
    );
  };

  // Estadísticas calculadas
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    lowStockProducts: products.filter(p => p.stock <= p.minStock && p.status === 'active').length,
    totalValue: products.reduce((sum, p) => sum + (p.cost * p.stock), 0),
    categories: Array.from(new Set(products.map(p => p.category)))
  };

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    stats,
    setProducts,
    categories,
    setCategories
  };
};