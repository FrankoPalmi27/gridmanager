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

// Initial customers data
const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    phone: 'juan.perez@email.com', // Keeping email here for compatibility
    celular: '+54 9 11 1234-5678',
    balance: 15000,
    status: 'active',
    createdAt: '2023-01-15',
    address: 'Av. Corrientes 1234, CABA',
    notes: 'Cliente preferencial'
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria.garcia@email.com',
    phone: 'maria.garcia@email.com',
    celular: '+54 9 11 8765-4321',
    balance: -2500,
    status: 'active',
    createdAt: '2023-01-20',
    address: 'Av. Santa Fe 5678, CABA'
  },
  {
    id: '3',
    name: 'Carlos López',
    email: 'carlos.lopez@email.com',
    phone: 'carlos.lopez@email.com',
    celular: '+54 9 11 5555-0000',
    balance: 8750,
    status: 'active',
    createdAt: '2023-02-01',
    address: 'Av. Rivadavia 9876, CABA'
  },
  {
    id: '4',
    name: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    phone: 'ana.martinez@email.com',
    celular: '+54 9 11 9999-1111',
    balance: 0,
    status: 'inactive',
    createdAt: '2023-02-10',
    address: 'Av. Callao 456, CABA',
    notes: 'Cliente inactivo temporalmente'
  }
];

interface CustomersStore {
  customers: Customer[];
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updatedData: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  setCustomers: (customers: Customer[]) => void;
  getActiveCustomers: () => Customer[];
  updateCustomerBalance: (id: string, balanceChange: number) => void;
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    totalBalance: number;
    positiveBalance: number;
    negativeBalance: number;
  };
}

export const useCustomersStore = create<CustomersStore>((set, get) => ({
  customers: loadFromStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers),

  addCustomer: (customerData) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
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
        customer.id === id ? { ...customer, ...updatedData } : customer
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

  setCustomers: (customers) => {
    set({ customers });
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  },

  getActiveCustomers: () => {
    const state = get();
    return state.customers.filter(customer => customer.status === 'active');
  },

  updateCustomerBalance: (id, balanceChange) => {
    set((state) => {
      const newCustomers = state.customers.map(customer =>
        customer.id === id 
          ? { ...customer, balance: customer.balance + balanceChange }
          : customer
      );
      saveToStorage(STORAGE_KEYS.CUSTOMERS, newCustomers);
      return { customers: newCustomers };
    });
  },

  get stats() {
    const state = get();
    const activeCustomers = state.customers.filter(c => c.status === 'active');
    const inactiveCustomers = state.customers.filter(c => c.status === 'inactive');
    const positiveBalance = state.customers.filter(c => c.balance > 0);
    const negativeBalance = state.customers.filter(c => c.balance < 0);

    return {
      totalCustomers: state.customers.length,
      activeCustomers: activeCustomers.length,
      inactiveCustomers: inactiveCustomers.length,
      totalBalance: state.customers.reduce((sum, c) => sum + c.balance, 0),
      positiveBalance: positiveBalance.length,
      negativeBalance: negativeBalance.length
    };
  }
}));