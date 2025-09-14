import { create } from 'zustand';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../lib/localStorage';

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

// Transaction interface
export interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category?: string;
  reference?: string;
  // Campos de enlace para integridad referencial
  linkedTo?: {
    type: 'sale' | 'purchase' | 'manual';
    id: string;
    number: string; // Número de venta/compra para referencia
  };
}


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

// Initial transactions data
const initialTransactions: Transaction[] = [
  {
    id: '1',
    accountId: '1',
    type: 'income',
    amount: 25000,
    description: 'Venta VTA-2024-001 - Juan Pérez',
    date: '2024-01-20',
    category: 'Ventas',
    reference: 'VTA-2024-001'
  },
  {
    id: '2',
    accountId: '1',
    type: 'expense',
    amount: 5000,
    description: 'Compra insumos oficina',
    date: '2024-01-19',
    category: 'Gastos Operativos',
    reference: 'FAC-001'
  },
  {
    id: '3',
    accountId: '2',
    type: 'income',
    amount: 15000,
    description: 'Pago en efectivo - María García',
    date: '2024-01-18',
    category: 'Ventas',
    reference: 'VTA-2024-002'
  },
  {
    id: '4',
    accountId: '1',
    type: 'expense',
    amount: 8000,
    description: 'Servicios públicos',
    date: '2024-01-17',
    category: 'Servicios',
    reference: 'SERV-001'
  },
  {
    id: '5',
    accountId: '3',
    type: 'income',
    amount: 1200,
    description: 'Venta internacional',
    date: '2024-01-16',
    category: 'Ventas',
    reference: 'VTA-2024-003'
  }
];

interface AccountsStore {
  accounts: Account[];
  transactions: Transaction[];
  addAccount: (accountData: Omit<Account, 'id' | 'createdDate'>) => Account;
  updateAccount: (id: string, updatedData: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  setAccounts: (accounts: Account[]) => void;
  getActiveAccounts: () => Account[];
  addTransaction: (transactionData: Omit<Transaction, 'id'>) => Transaction;
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getAllTransactions: () => Transaction[];
  // Métodos para manejo de transacciones enlazadas
  addLinkedTransaction: (accountId: string, amount: number, description: string, linkedTo: { type: 'sale' | 'purchase' | 'manual'; id: string; number: string }) => Transaction;
  removeLinkedTransactions: (linkedType: 'sale' | 'purchase' | 'manual', linkedId: string) => void;
  getLinkedTransactions: (linkedType: 'sale' | 'purchase' | 'manual', linkedId: string) => Transaction[];
}

export const useAccountsStore = create<AccountsStore>((set, get) => ({
  accounts: loadFromStorage(STORAGE_KEYS.ACCOUNTS, initialAccounts),
  transactions: loadFromStorage(STORAGE_KEYS.TRANSACTIONS, initialTransactions),

  addAccount: (accountData) => {
    const newAccount: Account = {
      ...accountData,
      id: Date.now().toString(),
      createdDate: new Date().toISOString()
    };

    set((state) => {
      const newAccounts = [...state.accounts, newAccount];
      saveToStorage(STORAGE_KEYS.ACCOUNTS, newAccounts);
      return { accounts: newAccounts };
    });
    
    return newAccount;
  },

  updateAccount: (id, updatedData) => {
    set((state) => {
      const newAccounts = state.accounts.map(account =>
        account.id === id ? { ...account, ...updatedData } : account
      );
      saveToStorage(STORAGE_KEYS.ACCOUNTS, newAccounts);
      return { accounts: newAccounts };
    });
  },

  deleteAccount: (id) => {
    set((state) => {
      const newAccounts = state.accounts.filter(account => account.id !== id);
      saveToStorage(STORAGE_KEYS.ACCOUNTS, newAccounts);
      return { accounts: newAccounts };
    });
  },

  setAccounts: (accounts) => {
    set({ accounts });
    saveToStorage(STORAGE_KEYS.ACCOUNTS, accounts);
  },

  getActiveAccounts: () => {
    const state = get();
    return state.accounts.filter(account => account.active);
  },

  addTransaction: (transactionData) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString()
    };

    set((state) => {
      const newTransactions = [newTransaction, ...state.transactions];
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, newTransactions);
      return { transactions: newTransactions };
    });
    
    return newTransaction;
  },

  getTransactionsByAccount: (accountId) => {
    const state = get();
    return state.transactions.filter(transaction => transaction.accountId === accountId);
  },

  getAllTransactions: () => {
    const state = get();
    return state.transactions;
  },

  // Implementación de métodos para transacciones enlazadas
  addLinkedTransaction: (accountId, amount, description, linkedTo) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      accountId,
      type: amount > 0 ? 'income' : 'expense',
      amount: Math.abs(amount),
      description,
      date: new Date().toISOString().split('T')[0],
      category: linkedTo.type === 'sale' ? 'Ventas' : linkedTo.type === 'purchase' ? 'Compras' : 'Operaciones',
      reference: linkedTo.number,
      linkedTo
    };

    set((state) => {
      const newTransactions = [newTransaction, ...state.transactions];
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, newTransactions);
      
      // Actualizar balance de la cuenta
      const newAccounts = state.accounts.map(account => 
        account.id === accountId 
          ? { ...account, balance: account.balance + amount }
          : account
      );
      saveToStorage(STORAGE_KEYS.ACCOUNTS, newAccounts);

      return { 
        transactions: newTransactions,
        accounts: newAccounts
      };
    });

    return newTransaction;
  },

  removeLinkedTransactions: (linkedType, linkedId) => {
    set((state) => {
      // Encontrar transacciones enlazadas
      const linkedTransactions = state.transactions.filter(
        transaction => 
          transaction.linkedTo?.type === linkedType && 
          transaction.linkedTo?.id === linkedId
      );

      // Calcular el balance a revertir por cuenta
      const balanceChanges: { [accountId: string]: number } = {};
      linkedTransactions.forEach(transaction => {
        const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        balanceChanges[transaction.accountId] = (balanceChanges[transaction.accountId] || 0) + balanceChange;
      });

      // Remover transacciones enlazadas
      const newTransactions = state.transactions.filter(
        transaction => 
          !(transaction.linkedTo?.type === linkedType && 
            transaction.linkedTo?.id === linkedId)
      );

      // Actualizar balances de las cuentas afectadas
      const newAccounts = state.accounts.map(account => 
        balanceChanges[account.id] 
          ? { ...account, balance: account.balance + balanceChanges[account.id] }
          : account
      );

      saveToStorage(STORAGE_KEYS.TRANSACTIONS, newTransactions);
      saveToStorage(STORAGE_KEYS.ACCOUNTS, newAccounts);

      return { 
        transactions: newTransactions,
        accounts: newAccounts
      };
    });
  },

  getLinkedTransactions: (linkedType, linkedId) => {
    const state = get();
    return state.transactions.filter(
      transaction => 
        transaction.linkedTo?.type === linkedType && 
        transaction.linkedTo?.id === linkedId
    );
  }
}));