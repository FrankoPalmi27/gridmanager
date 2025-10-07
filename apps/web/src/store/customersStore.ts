import { create } from 'zustand';
import { customersApi } from '../lib/api';
import { loadWithSync, createWithSync, updateWithSync, deleteWithSync, getSyncMode, SyncConfig } from '../lib/syncStorage';

// Customer interface
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string; // Keep for compatibility, will be migrated to celular
  celular?: string; // New field for mobile phone
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
  address?: string;
  notes?: string;
}

// No initial customers - users start with empty customer list
const initialCustomers: Customer[] = [];

interface CustomersStore {
  customers: Customer[];
  isLoading: boolean;
  syncMode: 'online' | 'offline';
  loadCustomers: () => Promise<void>;
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (id: string, updatedData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  updateCustomerBalance: (id: string, amount: number) => void;
  resetCustomer: (id: string) => void;
  stats: {
    total: number;
    active: number;
    totalBalance: number;
    totalPositiveBalance: number;
    totalNegativeBalance: number;
  };
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerByName: (name: string) => Customer | undefined;
  resetStore: () => void;
}

// Helper to map backend customer to frontend format
const mapBackendToFrontend = (backendCustomer: any): Customer => ({
  id: backendCustomer.id,
  name: backendCustomer.name,
  email: backendCustomer.email || '',
  phone: backendCustomer.phone || '',
  celular: backendCustomer.phone || '',
  balance: Number(backendCustomer.currentBalance || 0),
  status: backendCustomer.active ? 'active' : 'inactive',
  createdAt: backendCustomer.createdAt,
  address: backendCustomer.address || '',
  notes: backendCustomer.notes || '',
});

// Sync configuration
const syncConfig: SyncConfig<Customer> = {
  storageKey: 'customers',
  apiGet: () => customersApi.getAll(),
  apiCreate: (data: any) => customersApi.create(data),
  apiUpdate: (id: string, data: Partial<Customer>) => customersApi.update(id, data),
  extractData: (response: any) => {
    const data = response.data.data || response.data;

    // Handle single customer response (from create/update)
    if (data.customer) {
      return [mapBackendToFrontend(data.customer)];
    }

    // Handle paginated response (from list)
    const items = data.items || data;
    if (Array.isArray(items)) {
      return items.map(mapBackendToFrontend);
    }

    return [];
  },
};

export const useCustomersStore = create<CustomersStore>((set, get) => ({
  customers: initialCustomers,
  isLoading: false,
  syncMode: getSyncMode(),

  // Load customers with API sync
  loadCustomers: async () => {
    set({ isLoading: true, syncMode: getSyncMode() });
    try {
      const customers = await loadWithSync<Customer>(syncConfig, initialCustomers);
      set({ customers, isLoading: false });
    } catch (error) {
      console.error('Error loading customers:', error);
      set({ isLoading: false });
    }
  },

  addCustomer: async (customerData) => {
    const state = get();

    // Map frontend data to backend schema - only send fields that backend accepts
    const dataToSend: any = {
      name: customerData.name,
      email: customerData.email || undefined,
      phone: customerData.phone || undefined,
      address: customerData.address || undefined,
      taxId: undefined, // Not provided in frontend form yet
      birthday: undefined, // Not provided in frontend form yet
      creditLimit: customerData.balance ? Number(customerData.balance) : undefined,
    };

    try {
      // Try to create with API sync
      const createdCustomer = await createWithSync<Customer>(syncConfig, dataToSend, state.customers);
      set({ customers: [createdCustomer, ...state.customers], syncMode: getSyncMode() });
      return createdCustomer;
    } catch (error) {
      // Fallback already handled by createWithSync
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  updateCustomer: async (id, updatedData) => {
    const state = get();

    try {
      // Try to update with API sync
      await updateWithSync<Customer>(syncConfig, id, updatedData, state.customers);

      // Update local state
      const newCustomers = state.customers.map(customer =>
        customer.id === id ? { ...customer, ...updatedData } : customer
      );
      set({ customers: newCustomers, syncMode: getSyncMode() });
    } catch (error) {
      // Fallback already handled by updateWithSync
      console.error('Error updating customer:', error);
    }
  },

  deleteCustomer: async (id) => {
    const state = get();

    try {
      // Try to delete with API sync
      await deleteWithSync<Customer>(syncConfig, id, state.customers);

      // Update local state
      const newCustomers = state.customers.filter(customer => customer.id !== id);
      set({ customers: newCustomers, syncMode: getSyncMode() });
    } catch (error) {
      // Fallback already handled by deleteWithSync
      console.error('Error deleting customer:', error);
    }
  },

  updateCustomerBalance: (id, amount) => {
    const state = get();
    const target = state.customers.find(customer => customer.id === id);

    if (!target) {
      return;
    }

    const updatedBalance = target.balance + amount;

    set((current) => {
      const newCustomers = current.customers.map(customer =>
        customer.id === id
          ? { ...customer, balance: updatedBalance }
          : customer
      );

      return { customers: newCustomers };
    });

    updateWithSync<Customer>(syncConfig, id, { balance: updatedBalance }, state.customers)
      .catch((error) => console.error('Error syncing customer balance:', error));
  },

  resetCustomer: (id) => {
    const state = get();
    const target = state.customers.find(customer => customer.id === id);

    if (!target) {
      return;
    }

    set((current) => {
      const newCustomers = current.customers.map(customer =>
        customer.id === id
          ? { ...customer, balance: 0 }
          : customer
      );
      return { customers: newCustomers };
    });

    updateWithSync<Customer>(syncConfig, id, { balance: 0 }, state.customers)
      .catch((error) => console.error('Error resetting customer balance:', error));
  },

  getCustomerById: (id) => {
    return get().customers.find(customer => customer.id === id);
  },

  getCustomerByName: (name: string) => {
    return get().customers.find(customer =>
      customer.name.toLowerCase() === name.toLowerCase()
    );
  },

  resetStore: () => {
    set({ customers: [] });
  },

  get stats() {
    const customers = get().customers;
    const totalBalance = customers.reduce((sum, customer) => sum + customer.balance, 0);
    const totalPositiveBalance = customers
      .filter(customer => customer.balance > 0)
      .reduce((sum, customer) => sum + customer.balance, 0);
    const totalNegativeBalance = customers
      .filter(customer => customer.balance < 0)
      .reduce((sum, customer) => sum + customer.balance, 0);

    return {
      total: customers.length,
      active: customers.filter(customer => customer.status === 'active').length,
      totalBalance,
      totalPositiveBalance,
      totalNegativeBalance
    };
  }
}));