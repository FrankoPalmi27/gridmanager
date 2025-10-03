import { create } from 'zustand';
import { suppliersApi } from '../lib/api';
import { loadWithSync, createWithSync, updateWithSync, getSyncMode, SyncConfig } from '../lib/syncStorage';

export interface Supplier {
  id: string;
  name: string; // Nombre comercial (único campo obligatorio)
  businessName?: string; // Razón social (opcional)
  taxId?: string; // CUIT (opcional)
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms: number; // días
  currentBalance: number; // saldo actual (positivo = nos deben, negativo = les debemos)
  creditLimit?: number;
  active: boolean;
  lastPurchaseDate?: string;
  totalPurchases: number;
}

// No initial suppliers - users start with empty supplier list
const initialSuppliers: Supplier[] = [];

interface SuppliersState {
  suppliers: Supplier[];
  isLoading: boolean;
  syncMode: 'online' | 'offline';
  loadSuppliers: () => Promise<void>;
  getSuppliers: () => Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
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

const syncConfig: SyncConfig<Supplier> = {
  storageKey: 'suppliers',
  apiGet: () => suppliersApi.getAll(),
  apiCreate: (data: Supplier) => suppliersApi.create(data),
  apiUpdate: (id: string, data: Partial<Supplier>) => suppliersApi.update(id, data),
  extractData: (response: any) => response.data.data || response.data,
};

export const useSuppliersStore = create<SuppliersState>((set, get) => ({
  suppliers: initialSuppliers,
  isLoading: false,
  syncMode: getSyncMode(),

  loadSuppliers: async () => {
    set({ isLoading: true, syncMode: getSyncMode() });
    try {
      const suppliers = await loadWithSync<Supplier>(syncConfig, initialSuppliers);
      set({ suppliers, isLoading: false });
    } catch (error) {
      console.error('Error loading suppliers:', error);
      set({ isLoading: false });
    }
  },

  getSuppliers: () => get().suppliers,

  addSupplier: async (supplierData) => {
    const state = get();
    const newSupplier: Supplier = {
      ...supplierData,
      id: Date.now().toString(),
      currentBalance: 0,
      totalPurchases: 0,
      active: true
    };

    try {
      // Create with API sync and wait for response
      const createdSupplier = await createWithSync<Supplier>(syncConfig, newSupplier, state.suppliers);
      set({ suppliers: [createdSupplier, ...state.suppliers], syncMode: getSyncMode() });
      return createdSupplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  },

  updateSupplier: async (id, supplierData) => {
    const state = get();

    try {
      // Update with API sync first
      await updateWithSync<Supplier>(syncConfig, id, supplierData, state.suppliers);

      // Update local state after successful API call
      const newSuppliers = state.suppliers.map(supplier =>
        supplier.id === id
          ? { ...supplier, ...supplierData }
          : supplier
      );

      set({ suppliers: newSuppliers, syncMode: getSyncMode() });
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  },

  deleteSupplier: (id) => set((state) => {
    const newSuppliers = state.suppliers.filter(supplier => supplier.id !== id);

    // Soft delete via update if API available
    updateWithSync(syncConfig, id, { active: false }, state.suppliers)
      .catch((error) => console.error('Error syncing supplier deletion:', error));

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

    const updatedSupplier = newSuppliers.find(supplier => supplier.id === id);
    if (updatedSupplier) {
      updateWithSync(syncConfig, id, {
        currentBalance: updatedSupplier.currentBalance,
        totalPurchases: updatedSupplier.totalPurchases,
        lastPurchaseDate: updatedSupplier.lastPurchaseDate,
      }, state.suppliers).catch((error) => console.error('Error syncing supplier balance:', error));
    }

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