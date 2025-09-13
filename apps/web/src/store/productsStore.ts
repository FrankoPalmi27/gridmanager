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

// LocalStorage keys
const PRODUCTS_STORAGE_KEY = 'gridmanager_products';
const CATEGORIES_STORAGE_KEY = 'gridmanager_categories';
const STOCK_MOVEMENTS_STORAGE_KEY = 'gridmanager_stock_movements';

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

// Productos cargados desde vision_tenis.csv
const initialProducts: Product[] = [
  // Overgrips
  {
    id: '1',
    sku: 'ACC-OVE-001',
    name: 'Overgrip pro feel amarillo x 3',
    category: 'Accesorios',
    brand: 'Diadem',
    description: 'Modelo: Pro feel',
    cost: 7700,
    price: 20000,
    stock: 25,
    minStock: 5,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    sku: 'ACC-OVE-002',
    name: 'Overgrip pro feel negro x 3',
    category: 'Accesorios',
    brand: 'Diadem',
    description: 'Modelo: Pro feel',
    cost: 7700,
    price: 20000,
    stock: 30,
    minStock: 5,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    sku: 'ACC-OVE-003',
    name: 'Overgrip pro feel rosa x 3',
    category: 'Accesorios',
    brand: 'Diadem',
    description: 'Modelo: Pro feel',
    cost: 7700,
    price: 20000,
    stock: 20,
    minStock: 5,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    sku: 'ACC-OVE-004',
    name: 'Overgrip pro feel verde x 3',
    category: 'Accesorios',
    brand: 'Diadem',
    description: 'Modelo: Pro feel',
    cost: 7700,
    price: 20000,
    stock: 22,
    minStock: 5,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  // Medias
  {
    id: '5',
    sku: 'IND-PAC-001',
    name: 'Pack de medias dama x 3',
    category: 'Indumentaria',
    brand: 'Wilson',
    description: 'Talles: 37 a 41',
    cost: 8460,
    price: 16000,
    stock: 35,
    minStock: 10,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '6',
    sku: 'IND-PAC-002',
    name: 'Pack de medias hombre x 3',
    category: 'Indumentaria',
    brand: 'Wilson',
    description: 'Talles: 40 a 44',
    cost: 8460,
    price: 16000,
    stock: 40,
    minStock: 10,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  // Raquetas Adulto
  {
    id: '7',
    sku: 'RAQ-SIX-001',
    name: 'Raqueta Adulto Sixzero Air',
    category: 'Raquetas',
    brand: 'Sixzero',
    description: 'Modelo: Air',
    cost: 16000,
    price: 45000,
    stock: 8,
    minStock: 3,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '8',
    sku: 'RAQ-PRI-001',
    name: 'Raqueta Adulto Prince Screampro 105',
    category: 'Raquetas',
    brand: 'Prince',
    description: 'Modelo: Screampro 105',
    cost: 70000,
    price: 140000,
    stock: 5,
    minStock: 2,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '9',
    sku: 'RAQ-PRI-002',
    name: 'Raqueta Adulto Prince Spectrum team 100',
    category: 'Raquetas',
    brand: 'Prince',
    description: 'Modelo: Spectrum team 100',
    cost: 70000,
    price: 140000,
    stock: 4,
    minStock: 2,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '10',
    sku: 'RAQ-WIL-001',
    name: 'Raqueta Adulto Wilson Pro Open 100',
    category: 'Raquetas',
    brand: 'Wilson',
    description: 'Modelo: Pro Open 100',
    cost: 168500,
    price: 300000,
    stock: 3,
    minStock: 2,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '11',
    sku: 'RAQ-WIL-002',
    name: 'Raqueta Adulto Wilson Pro Open 101',
    category: 'Raquetas',
    brand: 'Wilson',
    description: 'Modelo: Pro Open 101',
    cost: 168500,
    price: 300000,
    stock: 3,
    minStock: 2,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '12',
    sku: 'RAQ-DIA-001',
    name: 'Raqueta Adulto Diadem Elevate',
    category: 'Raquetas',
    brand: 'Diadem',
    description: 'Modelo: Elevate',
    cost: 240000,
    price: 360000,
    stock: 2,
    minStock: 1,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '13',
    sku: 'RAQ-DIA-002',
    name: 'Raqueta Adulto Diadem Nova',
    category: 'Raquetas',
    brand: 'Diadem',
    description: 'Modelo: Nova',
    cost: 240000,
    price: 360000,
    stock: 2,
    minStock: 1,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '14',
    sku: 'RAQ-WIL-003',
    name: 'Raqueta Adulto Wilson Clash 100 280g',
    category: 'Raquetas',
    brand: 'Wilson',
    description: 'Modelo: Clash 100 280g',
    cost: 226666,
    price: 408000,
    stock: 2,
    minStock: 1,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '15',
    sku: 'RAQ-HEA-001',
    name: 'Raqueta Adulto Head Extreme Tour',
    category: 'Raquetas',
    brand: 'Head',
    description: 'Modelo: Extreme Tour',
    cost: 213000,
    price: 405000,
    stock: 3,
    minStock: 1,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  // Raquetas Junior
  {
    id: '16',
    sku: 'RAQ-PRI-003',
    name: 'Raqueta Junior - 21',
    category: 'Raquetas',
    brand: 'Prince',
    description: 'Raqueta Junior talle 21',
    cost: 38500,
    price: 68000,
    stock: 6,
    minStock: 3,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '17',
    sku: 'RAQ-PRI-004',
    name: 'Raqueta Junior - 23',
    category: 'Raquetas',
    brand: 'Prince',
    description: 'Raqueta Junior talle 23',
    cost: 38500,
    price: 68000,
    stock: 6,
    minStock: 3,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '18',
    sku: 'RAQ-PRI-005',
    name: 'Raqueta Junior - 25',
    category: 'Raquetas',
    brand: 'Prince',
    description: 'Raqueta Junior talle 25',
    cost: 38500,
    price: 68000,
    stock: 5,
    minStock: 3,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '19',
    sku: 'RAQ-PRI-006',
    name: 'Raqueta Junior - 26',
    category: 'Raquetas',
    brand: 'Prince',
    description: 'Modelo: Rip stick - Talle 26',
    cost: 85000,
    price: 162500,
    stock: 4,
    minStock: 2,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  // Raqueteros
  {
    id: '20',
    sku: 'BOL-HEA-001',
    name: 'Raquetero Head Team x 3',
    category: 'Bolsos',
    brand: 'Head',
    description: 'Modelo: Team x 3',
    cost: 55000,
    price: 104500,
    stock: 12,
    minStock: 5,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '21',
    sku: 'BOL-HEA-002',
    name: 'Raquetero Head Team x 6',
    category: 'Bolsos',
    brand: 'Head',
    description: 'Modelo: Team x 6',
    cost: 66250,
    price: 125000,
    stock: 8,
    minStock: 4,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '22',
    sku: 'BOL-YON-001',
    name: 'Raquetero Yonex Active raquet Pack',
    category: 'Bolsos',
    brand: 'Yonex',
    description: 'Modelo: Active raquet Pack',
    cost: 99000,
    price: 199000,
    stock: 6,
    minStock: 3,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '23',
    sku: 'BOL-WIL-001',
    name: 'Raquetero Wilson Ultra V5 x 3',
    category: 'Bolsos',
    brand: 'Wilson',
    description: 'Modelo: Ultra V5 x 3',
    cost: 86600,
    price: 155900,
    stock: 10,
    minStock: 4,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '24',
    sku: 'BOL-WIL-002',
    name: 'Raquetero Wilson Team raquet bag x 6',
    category: 'Bolsos',
    brand: 'Wilson',
    description: 'Modelo: Team raquet bag x 6',
    cost: 86100,
    price: 155000,
    stock: 7,
    minStock: 3,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '25',
    sku: 'BOL-DIA-001',
    name: 'Raquetero Diadem Axis x 12',
    category: 'Bolsos',
    brand: 'Diadem',
    description: 'Modelo: Axis x 12',
    cost: 135000,
    price: 270000,
    stock: 4,
    minStock: 2,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '26',
    sku: 'BOL-DIA-002',
    name: 'Bolso Diadem Axis',
    category: 'Bolsos',
    brand: 'Diadem',
    description: 'Modelo: Axis',
    cost: 95000,
    price: 175000,
    stock: 8,
    minStock: 3,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  // Cuerdas
  {
    id: '27',
    sku: 'CUE-DIA-001',
    name: 'Rollo de cuerda x 200 m Diadem Flash 1.25 mm',
    category: 'Cuerdas',
    brand: 'Diadem',
    description: 'Modelo: Flash 1.25 mm',
    cost: 110000,
    price: 190000,
    stock: 6,
    minStock: 2,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '28',
    sku: 'CUE-PRI-001',
    name: 'Rollo de cuerda x 200 m Prince Beast xp 1.25 mm',
    category: 'Cuerdas',
    brand: 'Prince',
    description: 'Modelo: Beast xp 1.25 mm',
    cost: 100000,
    price: 185000,
    stock: 5,
    minStock: 2,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '29',
    sku: 'CUE-PRI-002',
    name: 'Rollo de cuerda x 200 m Prince Tour 17',
    category: 'Cuerdas',
    brand: 'Prince',
    description: 'Modelo: Tour 17',
    cost: 100000,
    price: 185000,
    stock: 4,
    minStock: 2,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '30',
    sku: 'CUE-YON-001',
    name: 'Rollo de cuerda x 200 m Yonex MonoPrime 1.30 mm',
    category: 'Cuerdas',
    brand: 'Yonex',
    description: 'Modelo: MonoPrime 1.30 mm',
    cost: 37500,
    price: 75000,
    stock: 12,
    minStock: 5,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '31',
    sku: 'CUE-HAC-001',
    name: 'Rollo de cuerda x 200 m Hacker Poly-Tag 1.28 mm naranja',
    category: 'Cuerdas',
    brand: 'Hacker',
    description: 'Modelo: Poly-Tag 1.28 mm naranja',
    cost: 35000,
    price: 75000,
    stock: 10,
    minStock: 4,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '32',
    sku: 'CUE-HAC-002',
    name: 'Rollo de cuerda x 200 m Hacker Poly-Tag 1.28 mm blanco',
    category: 'Cuerdas',
    brand: 'Hacker',
    description: 'Modelo: Poly-Tag 1.28 mm blanco',
    cost: 35000,
    price: 75000,
    stock: 8,
    minStock: 4,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '33',
    sku: 'CUE-BAB-001',
    name: 'Rollo de cuerda x 200 m Babolat Synthetic Gut 1.25 rosa',
    category: 'Cuerdas',
    brand: 'Babolat',
    description: 'Modelo: Synthetic Gut 1.25 rosa',
    cost: 35000,
    price: 65000,
    stock: 9,
    minStock: 4,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  // Sets individuales de encordado
  {
    id: '34',
    sku: 'CUE-DIA-002',
    name: 'Set individual de encordado Diadem Solstice Black 1.30 mm',
    category: 'Cuerdas',
    brand: 'Diadem',
    description: 'Modelo: Solstice Black 1.30 mm',
    cost: 7500,
    price: 15000,
    stock: 25,
    minStock: 10,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '35',
    sku: 'CUE-DIA-003',
    name: 'Set individual de encordado Diadem Solstice Power 1.30 mm',
    category: 'Cuerdas',
    brand: 'Diadem',
    description: 'Modelo: Solstice Power 1.30 mm',
    cost: 8750,
    price: 17500,
    stock: 20,
    minStock: 8,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '36',
    sku: 'CUE-DIA-004',
    name: 'Set individual de encordado Diadem SG Ultra 1.30 mm',
    category: 'Cuerdas',
    brand: 'Diadem',
    description: 'Modelo: SG Ultra 1.30 mm',
    cost: 6250,
    price: 12500,
    stock: 30,
    minStock: 12,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '37',
    sku: 'CUE-PRI-003',
    name: 'Set individual de encordado Prince Comfort & Power',
    category: 'Cuerdas',
    brand: 'Prince',
    description: 'Modelo: Comfort & Power',
    cost: 9375,
    price: 18750,
    stock: 35,
    minStock: 15,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '38',
    sku: 'CUE-PRI-004',
    name: 'Set individual de encordado Prince Power & Spin',
    category: 'Cuerdas',
    brand: 'Prince',
    description: 'Modelo: Power & Spin',
    cost: 6875,
    price: 13750,
    stock: 28,
    minStock: 12,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  // Pelotas
  {
    id: '39',
    sku: 'PEL-PEN-001',
    name: 'Tubos de pelotas Penn Tour x 24',
    category: 'Pelotas',
    brand: 'Penn',
    description: 'Penn Tour x 24 unidades',
    cost: 8854,
    price: 12000,
    stock: 50,
    minStock: 20,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '40',
    sku: 'PEL-PEN-002',
    name: 'Tubos de pelotas Pro Penn x 24',
    category: 'Pelotas',
    brand: 'Penn',
    description: 'Pro Penn x 24 unidades',
    cost: 8209,
    price: 11500,
    stock: 45,
    minStock: 20,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '41',
    sku: 'PEL-PEN-003',
    name: 'Tubos de pelotas Penn Padel x 24',
    category: 'Pelotas',
    brand: 'Penn',
    description: 'Penn Padel x 24 unidades',
    cost: 6040,
    price: 9500,
    stock: 60,
    minStock: 25,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '42',
    sku: 'PEL-DIA-001',
    name: 'Tubos de pelotas Diadem Regular Duty x 3 (10 tubos)',
    category: 'Pelotas',
    brand: 'Diadem',
    description: 'Regular Duty x 3 (10 tubos)',
    cost: 7900,
    price: 14000,
    stock: 40,
    minStock: 15,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '43',
    sku: 'PEL-AMA-001',
    name: 'Tubos de pelotas Ama Sport x 2 (10 tubos)',
    category: 'Pelotas',
    brand: 'Ama Sport',
    description: 'Ama sport x 2 (10 tubos)',
    cost: 4500,
    price: 7900,
    stock: 70,
    minStock: 30,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '44',
    sku: 'PEL-TEC-001',
    name: 'Tubos de pelotas Tecnifibre x one (10 tubos)',
    category: 'Pelotas',
    brand: 'Tecnifibre',
    description: 'x one (10 tubos)',
    cost: 12000,
    price: 16000,
    stock: 25,
    minStock: 10,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '45',
    sku: 'PEL-DIA-002',
    name: 'Tubos de pelotas Diadem blancas (10 tubos)',
    category: 'Pelotas',
    brand: 'Diadem',
    description: 'Pelotas blancas (10 tubos)',
    cost: 7900,
    price: 14000,
    stock: 35,
    minStock: 15,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '46',
    sku: 'PEL-DIA-003',
    name: 'Tubos de pelotas Diadem Premier x 4 (10 tubos)',
    category: 'Pelotas',
    brand: 'Diadem',
    description: 'Premier x 4 (10 tubos)',
    cost: 12000,
    price: 23000,
    stock: 20,
    minStock: 8,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '47',
    sku: 'PEL-WIL-001',
    name: 'Tubos de pelotas Wilson River x 24',
    category: 'Pelotas',
    brand: 'Wilson',
    description: 'River x 24 unidades',
    cost: 6462,
    price: 13900,
    stock: 55,
    minStock: 25,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  // Pickleball
  {
    id: '48',
    sku: 'PIC-DIA-001',
    name: 'Pelotas Pickleball Diadem Tournament Ball',
    category: 'Pickleball',
    brand: 'Diadem',
    description: 'Tournament Ball',
    cost: 9300,
    price: 18700,
    stock: 30,
    minStock: 12,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '49',
    sku: 'PIC-DIA-002',
    name: 'Paleta Pickleball Diadem Warrior Edge',
    category: 'Pickleball',
    brand: 'Diadem',
    description: 'Modelo: Warrior Edge',
    cost: 89000,
    price: 169000,
    stock: 8,
    minStock: 3,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  // Padel
  {
    id: '50',
    sku: 'PAL-HEA-001',
    name: 'Paleta Padel Head Delta Elite',
    category: 'Paletas',
    brand: 'Head',
    description: 'Modelo: Delta Elite',
    cost: 170000,
    price: 350000,
    stock: 5,
    minStock: 2,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '51',
    sku: 'PAL-WIL-001',
    name: 'Paleta Padel Wilson Pro Staff',
    category: 'Paletas',
    brand: 'Wilson',
    description: 'Modelo: Pro Staff',
    cost: 132500,
    price: 238000,
    stock: 6,
    minStock: 2,
    status: 'active',
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
  stockMovements: StockMovement[];
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
}

export const useProductsStore = create<ProductsStore>((set, get) => ({
  products: loadFromStorage(PRODUCTS_STORAGE_KEY, initialProducts),
  categories: loadFromStorage(CATEGORIES_STORAGE_KEY, []),
  stockMovements: loadFromStorage(STOCK_MOVEMENTS_STORAGE_KEY, []),

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

    set((state) => {
      const newProducts = [newProduct, ...state.products];
      saveToStorage(PRODUCTS_STORAGE_KEY, newProducts);
      return { products: newProducts };
    });
    
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

    set((state) => {
      const updatedProducts = [...newProducts, ...state.products];
      saveToStorage(PRODUCTS_STORAGE_KEY, updatedProducts);
      return { products: updatedProducts };
    });
    
    return newProducts;
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

  resetToInitialProducts: () => {
    set({ products: initialProducts });
    saveToStorage(PRODUCTS_STORAGE_KEY, initialProducts);
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
      saveToStorage(STOCK_MOVEMENTS_STORAGE_KEY, newMovements);
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

      // Save to storage
      saveToStorage(PRODUCTS_STORAGE_KEY, updatedProducts);
      saveToStorage(STOCK_MOVEMENTS_STORAGE_KEY, newMovements);

      return {
        products: updatedProducts,
        stockMovements: newMovements
      };
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