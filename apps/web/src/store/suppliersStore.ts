import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { suppliersApi } from '../lib/api';

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

interface SuppliersState {
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;
  loadSuppliers: () => Promise<void>;
  getSuppliers: () => Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
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

const mapBackendToFrontend = (backendSupplier: any): Supplier => ({
  id: backendSupplier.id,
  name: backendSupplier.name,
  businessName: backendSupplier.businessName || '',
  taxId: backendSupplier.taxId || '',
  email: backendSupplier.email || '',
  phone: backendSupplier.phone || '',
  address: backendSupplier.address || '',
  contactPerson: backendSupplier.contactPerson || '',
  paymentTerms: backendSupplier.paymentTerms || 0,
  currentBalance: Number(backendSupplier.currentBalance || 0),
  creditLimit: backendSupplier.creditLimit ? Number(backendSupplier.creditLimit) : undefined,
  active: backendSupplier.active !== false,
  lastPurchaseDate: backendSupplier.lastPurchaseDate || undefined,
  totalPurchases: Number(backendSupplier.totalPurchases || 0),
});
const mapFrontendToBackend = (data: Partial<Supplier>) => {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.businessName !== undefined) payload.businessName = data.businessName || null;
  if (data.email !== undefined) payload.email = data.email || null;
  if (data.phone !== undefined) payload.phone = data.phone || null;
  if (data.address !== undefined) payload.address = data.address || null;
  if (data.taxId !== undefined) payload.taxId = data.taxId || null;
  if (data.contactPerson !== undefined) payload.contactPerson = data.contactPerson || null;
  if (data.paymentTerms !== undefined) payload.paymentTerms = Number(data.paymentTerms);
  if (data.creditLimit !== undefined) payload.creditLimit = data.creditLimit == null ? null : Number(data.creditLimit);
  if (data.currentBalance !== undefined) payload.currentBalance = Number(data.currentBalance);
  if (data.totalPurchases !== undefined) payload.totalPurchases = Number(data.totalPurchases);
  if (data.lastPurchaseDate !== undefined) payload.lastPurchaseDate = data.lastPurchaseDate || null;
  if (data.active !== undefined) payload.active = data.active;

  return payload;
};

const extractList = (response: any) => {
  const responseData = response.data?.data ?? response.data;
  const items = responseData?.data ?? responseData?.items ?? responseData;
  return Array.isArray(items) ? items : [];
};

export const useSuppliersStore = create<SuppliersState>()(
  persist(
    (set, get) => ({
      suppliers: [],
      isLoading: false,
      error: null,

      loadSuppliers: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await suppliersApi.getAll();
          const suppliers = extractList(response).map(mapBackendToFrontend);
          set({ suppliers, isLoading: false });
        } catch (error: any) {
          console.error('[SuppliersStore] Error loading suppliers:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Error al cargar proveedores',
          });
        }
      },

      getSuppliers: () => get().suppliers,

      addSupplier: async (supplierData) => {
        set({ error: null });

        try {
          const payload = mapFrontendToBackend(supplierData);
          const response = await suppliersApi.create(payload);
          const responseData = response.data?.data ?? response.data;
          const createdSupplier = mapBackendToFrontend(responseData.supplier ?? responseData);

          set((state) => ({ suppliers: [createdSupplier, ...state.suppliers] }));
          return createdSupplier;
        } catch (error: any) {
          console.error('[SuppliersStore] Error creating supplier:', error);
          const message = error.response?.data?.message || 'Error al crear proveedor';
          set({ error: message });
          throw new Error(message);
        }
      },

      updateSupplier: async (id, supplierData) => {
        set({ error: null });

        try {
          const payload = mapFrontendToBackend(supplierData);
          await suppliersApi.update(id, payload);

          set((state) => ({
            suppliers: state.suppliers.map((supplier) =>
              supplier.id === id ? { ...supplier, ...supplierData } : supplier,
            ),
          }));
        } catch (error: any) {
          console.error('[SuppliersStore] Error updating supplier:', error);
          const message = error.response?.data?.message || 'Error al actualizar proveedor';
          set({ error: message });
          throw new Error(message);
        }
      },

      deleteSupplier: async (id) => {
        set({ error: null });

        try {
          await suppliersApi.update(id, mapFrontendToBackend({ active: false }));
        } catch (error: any) {
          console.error('[SuppliersStore] Error deleting supplier:', error);
          const message = error.response?.data?.message || 'Error al eliminar proveedor';
          set({ error: message });
          throw new Error(message);
        }

        set((state) => ({
          suppliers: state.suppliers.filter((supplier) => supplier.id !== id),
        }));
      },

      getActiveSuppliers: () => get().suppliers.filter((supplier) => supplier.active),

      getSupplierById: (id) => get().suppliers.find((supplier) => supplier.id === id),

      updateSupplierBalance: (id, amount) => {
        const state = get();
        const target = state.suppliers.find((supplier) => supplier.id === id);

        if (!target) {
          return;
        }

        const nextBalance = target.currentBalance + amount;
        const nextTotalPurchases = amount > 0 ? target.totalPurchases + amount : target.totalPurchases;
        const nextLastPurchaseDate = amount > 0 ? new Date().toISOString().split('T')[0] : target.lastPurchaseDate;

        set((current) => ({
          suppliers: current.suppliers.map((supplier) =>
            supplier.id === id
              ? {
                  ...supplier,
                  currentBalance: nextBalance,
                  totalPurchases: nextTotalPurchases,
                  lastPurchaseDate: nextLastPurchaseDate,
                }
              : supplier,
          ),
        }));

        suppliersApi
          .update(
            id,
            mapFrontendToBackend({
              currentBalance: nextBalance,
              totalPurchases: nextTotalPurchases,
              lastPurchaseDate: nextLastPurchaseDate,
            }),
          )
          .catch((error: any) => console.error('[SuppliersStore] Error syncing balance:', error));
      },

      getSupplierStats: () => {
        const suppliers = get().suppliers;
        return {
          total: suppliers.length,
          active: suppliers.filter((supplier) => supplier.active).length,
          totalBalance: suppliers.reduce((sum, supplier) => sum + supplier.currentBalance, 0),
          totalPurchases: suppliers.reduce((sum, supplier) => sum + supplier.totalPurchases, 0),
        };
      },
    }),
    {
      name: 'grid-manager:suppliers-cache',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined,
      partialize: (state) => ({ suppliers: state.suppliers }),
    },
  ),
);