import { create } from 'zustand';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../lib/localStorage';

export interface Supplier {
  id: string;
  name: string;
  businessName: string;
  taxId: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms: number; // días
  currentBalance: number; // saldo actual (positivo = nos deben, negativo = les debemos)
  creditLimit?: number;
  category: string;
  active: boolean;
  lastPurchaseDate?: string;
  totalPurchases: number;
}

// No initial suppliers - users start with empty supplier list
const initialSuppliers: Supplier[] = [];

interface SuppliersState {
  suppliers: Supplier[];
  getSuppliers: () => Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getActiveSuppliers: () => Supplier[];
  getSupplierById: (id: string) => Supplier | undefined;
  updateSupplierBalance: (id: string, amount: number) => void;
  getSupplierStats: () => {
    total: number;
    active: number;
    totalBalance: number;
    totalPurchases: number;
  };
}

export const useSuppliersStore = create<SuppliersState>((set, get) => ({
  suppliers: loadFromStorage(STORAGE_KEYS.SUPPLIERS, initialSuppliers),

  getSuppliers: () => get().suppliers,

  addSupplier: (supplierData) => set((state) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: Date.now().toString(),
      currentBalance: 0,
      totalPurchases: 0,
      active: true
    };

    const newSuppliers = [...state.suppliers, newSupplier];
    saveToStorage(STORAGE_KEYS.SUPPLIERS, newSuppliers);
    return { suppliers: newSuppliers };
  }),

  updateSupplier: (id, supplierData) => set((state) => {
    const newSuppliers = state.suppliers.map(supplier =>
      supplier.id === id
        ? { ...supplier, ...supplierData }
        : supplier
    );
    saveToStorage(STORAGE_KEYS.SUPPLIERS, newSuppliers);
    return { suppliers: newSuppliers };
  }),

  deleteSupplier: (id) => set((state) => {
    const newSuppliers = state.suppliers.filter(supplier => supplier.id !== id);
    saveToStorage(STORAGE_KEYS.SUPPLIERS, newSuppliers);
    return { suppliers: newSuppliers };
  }),

  getActiveSuppliers: () => get().suppliers.filter(supplier => supplier.active),

  getSupplierById: (id) => get().suppliers.find(supplier => supplier.id === id),

  updateSupplierBalance: (id, amount) => set((state) => {
    const newSuppliers = state.suppliers.map(supplier =>
      supplier.id === id
        ? {
            ...supplier,
            currentBalance: supplier.currentBalance + amount,
            totalPurchases: amount > 0 ? supplier.totalPurchases + amount : supplier.totalPurchases,
            lastPurchaseDate: amount > 0 ? new Date().toISOString().split('T')[0] : supplier.lastPurchaseDate
          }
        : supplier
    );
    saveToStorage(STORAGE_KEYS.SUPPLIERS, newSuppliers);
    return { suppliers: newSuppliers };
  }),

  getSupplierStats: () => {
    const suppliers = get().suppliers;
    return {
      total: suppliers.length,
      active: suppliers.filter(s => s.active).length,
      totalBalance: suppliers.reduce((sum, s) => sum + s.currentBalance, 0),
      totalPurchases: suppliers.reduce((sum, s) => sum + s.totalPurchases, 0)
    };
  }
}));