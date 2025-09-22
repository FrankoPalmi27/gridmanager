import { create } from 'zustand';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../lib/localStorage';

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

// LocalStorage utilities are now centralized in lib/localStorage.ts

// No initial customers - users start with empty customer list
const initialCustomers: Customer[] = [];

interface CustomersStore {
  customers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updatedData: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
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
  resetStore: () => void;
}

export const useCustomersStore = create<CustomersStore>((set, get) => ({
  customers: loadFromStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers),

  addCustomer: (customerData) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      balance: customerData.balance || 0,
      status: customerData.status || 'active'
    };

    set((state) => {
      const newCustomers = [...state.customers, newCustomer];
      saveToStorage(STORAGE_KEYS.CUSTOMERS, newCustomers);
      return { customers: newCustomers };
    });

    return newCustomer;
  },

  updateCustomer: (id, updatedData) => {
    set((state) => {
      const newCustomers = state.customers.map(customer =>
        customer.id === id
          ? { ...customer, ...updatedData }
          : customer
      );
      saveToStorage(STORAGE_KEYS.CUSTOMERS, newCustomers);
      return { customers: newCustomers };
    });
  },

  deleteCustomer: (id) => {
    set((state) => {
      const newCustomers = state.customers.filter(customer => customer.id !== id);
      saveToStorage(STORAGE_KEYS.CUSTOMERS, newCustomers);
      return { customers: newCustomers };
    });
  },

  updateCustomerBalance: (id, amount) => {
    set((state) => {
      const newCustomers = state.customers.map(customer =>
        customer.id === id
          ? { ...customer, balance: customer.balance + amount }
          : customer
      );
      saveToStorage(STORAGE_KEYS.CUSTOMERS, newCustomers);
      return { customers: newCustomers };
    });
  },

  resetCustomer: (id) => {
    set((state) => {
      const newCustomers = state.customers.map(customer =>
        customer.id === id
          ? { ...customer, balance: 0 }
          : customer
      );
      saveToStorage(STORAGE_KEYS.CUSTOMERS, newCustomers);
      return { customers: newCustomers };
    });
  },

  getCustomerById: (id) => {
    return get().customers.find(customer => customer.id === id);
  },

  resetStore: () => {
    saveToStorage(STORAGE_KEYS.CUSTOMERS, []);
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