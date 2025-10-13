import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { customersApi } from '../lib/api';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  celular?: string;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
  address?: string;
  notes?: string;
}

interface CustomersStore {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  loadCustomers: () => Promise<void>;
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (id: string, updatedData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  updateCustomerBalance: (id: string, amount: number) => void;
  resetCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerByName: (name: string) => Customer | undefined;
  resetStore: () => void;
  stats: {
    total: number;
    active: number;
    totalBalance: number;
    totalPositiveBalance: number;
    totalNegativeBalance: number;
  };
}

const mapBackendToFrontend = (backendCustomer: any): Customer => ({
  id: backendCustomer.id,
  name: backendCustomer.name,
  email: backendCustomer.email || '',
  phone: backendCustomer.phone || '',
  celular: backendCustomer.phone || '',
  balance: Number(backendCustomer.currentBalance ?? 0),
  status: backendCustomer.active ? 'active' : 'inactive',
  createdAt: backendCustomer.createdAt,
  address: backendCustomer.address || '',
  notes: backendCustomer.notes || '',
});

const mapFrontendToBackend = (data: Partial<Customer>) => {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.email !== undefined) payload.email = data.email || null;
  if (data.celular !== undefined || data.phone !== undefined) {
    payload.phone = (data.celular ?? data.phone) || null;
  }
  if (data.address !== undefined) payload.address = data.address || null;
  if (data.notes !== undefined) payload.notes = data.notes || null;
  if (data.balance !== undefined) payload.creditLimit = Number(data.balance);
  if (data.status !== undefined) payload.active = data.status === 'active';

  return payload;
};

const extractList = (response: any): any[] => {
  const responseData = response.data?.data ?? response.data;
  const items = responseData?.data ?? responseData?.items ?? responseData;
  return Array.isArray(items) ? items : [];
};

export const useCustomersStore = create<CustomersStore>()(
  persist(
    (set, get) => ({
      customers: [],
      isLoading: false,
      error: null,

      loadCustomers: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await customersApi.getAll();
          const customers = extractList(response).map(mapBackendToFrontend);
          set({ customers, isLoading: false });
        } catch (error: any) {
          console.error('[CustomersStore] Error loading customers:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Error al cargar clientes',
          });
        }
      },

      addCustomer: async (customerData) => {
        set({ error: null });

        try {
          const payload = mapFrontendToBackend(customerData);
          const response = await customersApi.create(payload);
          const responseData = response.data?.data ?? response.data;
          const createdCustomer = mapBackendToFrontend(responseData.customer ?? responseData);

          set((state) => ({ customers: [createdCustomer, ...state.customers] }));
          return createdCustomer;
        } catch (error: any) {
          console.error('[CustomersStore] Error creating customer:', error);
          const message = error.response?.data?.message || 'Error al crear cliente';
          set({ error: message });
          throw new Error(message);
        }
      },

      updateCustomer: async (id, updatedData) => {
        set({ error: null });

        try {
          const payload = mapFrontendToBackend(updatedData);
          await customersApi.update(id, payload);

          set((state) => ({
            customers: state.customers.map((customer) =>
              customer.id === id ? { ...customer, ...updatedData } : customer,
            ),
          }));
        } catch (error: any) {
          console.error('[CustomersStore] Error updating customer:', error);
          const message = error.response?.data?.message || 'Error al actualizar cliente';
          set({ error: message });
          throw new Error(message);
        }
      },

      deleteCustomer: async (id) => {
        set({ error: null });

        try {
          await customersApi.update(id, mapFrontendToBackend({ status: 'inactive' }));
          set((state) => ({
            customers: state.customers.filter((customer) => customer.id !== id),
          }));
        } catch (error: any) {
          console.error('[CustomersStore] Error deleting customer:', error);
          const message = error.response?.data?.message || 'Error al eliminar cliente';
          set({ error: message });
          throw new Error(message);
        }
      },

      updateCustomerBalance: (id, amount) => {
        const state = get();
        const target = state.customers.find((customer) => customer.id === id);

        if (!target) {
          return;
        }

        const nextBalance = target.balance + amount;

        set((current) => ({
          customers: current.customers.map((customer) =>
            customer.id === id ? { ...customer, balance: nextBalance } : customer,
          ),
        }));
      },

      resetCustomer: (id) => {
        const state = get();
        const target = state.customers.find((customer) => customer.id === id);

        if (!target) {
          return;
        }

        set((current) => ({
          customers: current.customers.map((customer) =>
            customer.id === id ? { ...customer, balance: 0 } : customer,
          ),
        }));
      },

      getCustomerById: (id) => get().customers.find((customer) => customer.id === id),

      getCustomerByName: (name: string) =>
        get().customers.find((customer) => customer.name.toLowerCase() === name.toLowerCase()),

      resetStore: () => {
        set({ customers: [] });
      },

      get stats() {
        const customers = get().customers;
        const totalBalance = customers.reduce((sum, customer) => sum + customer.balance, 0);
        const totalPositiveBalance = customers
          .filter((customer) => customer.balance > 0)
          .reduce((sum, customer) => sum + customer.balance, 0);
        const totalNegativeBalance = customers
          .filter((customer) => customer.balance < 0)
          .reduce((sum, customer) => sum + customer.balance, 0);

        return {
          total: customers.length,
          active: customers.filter((customer) => customer.status === 'active').length,
          totalBalance,
          totalPositiveBalance,
          totalNegativeBalance,
        };
      },
    }),
    {
      name: 'grid-manager:customers-cache',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined,
      partialize: (state) => ({ customers: state.customers }),
    },
  ),
);