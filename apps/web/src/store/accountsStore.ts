import { create } from 'zustand';

// Account interface
export interface Account {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  balance: number;
  currency: string;
  active: boolean;
  createdDate: string;
  description?: string;
}

// LocalStorage keys
const ACCOUNTS_STORAGE_KEY = 'gridmanager_accounts';

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

// Mock data for accounts
const initialAccounts: Account[] = [
  {
    id: '1',
    name: 'Cuenta Principal',
    accountNumber: '1234567890',
    bankName: 'Banco Nación',
    accountType: 'Cuenta Corriente',
    balance: 150000,
    currency: 'ARS',
    active: true,
    createdDate: '2023-01-15',
    description: 'Cuenta principal para operaciones diarias'
  },
  {
    id: '2',
    name: 'Caja Fuerte',
    accountNumber: 'CASH-001',
    bankName: 'Efectivo',
    accountType: 'Efectivo',
    balance: 25000,
    currency: 'ARS',
    active: true,
    createdDate: '2023-01-15',
    description: 'Dinero en efectivo en caja'
  },
  {
    id: '3',
    name: 'Cuenta USD',
    accountNumber: '0987654321',
    bankName: 'Banco Galicia',
    accountType: 'Cuenta USD',
    balance: 5000,
    currency: 'USD',
    active: true,
    createdDate: '2023-02-01',
    description: 'Cuenta en dólares para reservas'
  },
  {
    id: '4',
    name: 'Tarjeta Empresarial',
    accountNumber: '4532-****-****-1234',
    bankName: 'Banco Santander',
    accountType: 'Tarjeta de Crédito',
    balance: -12000,
    currency: 'ARS',
    active: true,
    createdDate: '2023-01-20',
    description: 'Tarjeta de crédito para gastos empresariales'
  }
];

interface AccountsStore {
  accounts: Account[];
  addAccount: (accountData: Omit<Account, 'id' | 'createdDate'>) => Account;
  updateAccount: (id: string, updatedData: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  setAccounts: (accounts: Account[]) => void;
  getActiveAccounts: () => Account[];
}

export const useAccountsStore = create<AccountsStore>((set, get) => ({
  accounts: loadFromStorage(ACCOUNTS_STORAGE_KEY, initialAccounts),

  addAccount: (accountData) => {
    const newAccount: Account = {
      ...accountData,
      id: Date.now().toString(),
      createdDate: new Date().toISOString()
    };

    set((state) => {
      const newAccounts = [...state.accounts, newAccount];
      saveToStorage(ACCOUNTS_STORAGE_KEY, newAccounts);
      return { accounts: newAccounts };
    });
    
    return newAccount;
  },

  updateAccount: (id, updatedData) => {
    set((state) => {
      const newAccounts = state.accounts.map(account =>
        account.id === id ? { ...account, ...updatedData } : account
      );
      saveToStorage(ACCOUNTS_STORAGE_KEY, newAccounts);
      return { accounts: newAccounts };
    });
  },

  deleteAccount: (id) => {
    set((state) => {
      const newAccounts = state.accounts.filter(account => account.id !== id);
      saveToStorage(ACCOUNTS_STORAGE_KEY, newAccounts);
      return { accounts: newAccounts };
    });
  },

  setAccounts: (accounts) => {
    set({ accounts });
    saveToStorage(ACCOUNTS_STORAGE_KEY, accounts);
  },

  getActiveAccounts: () => {
    const state = get();
    return state.accounts.filter(account => account.active);
  }
}));