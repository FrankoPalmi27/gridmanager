import { create } from 'zustand';
import { accountsApi } from '../lib/api';
import { loadWithSync, createWithSync, updateWithSync, deleteWithSync, getSyncMode, SyncConfig } from '../lib/syncStorage';

// Account interface
export interface Account {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other'; // Método de pago asociado
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


// ✅ ESTADO INICIAL LIMPIO - Sin cuentas precargadas
const initialAccounts: Account[] = [];

// No initial data - users start with empty list
const initialTransactions: Transaction[] = [];

interface AccountsStore {
  accounts: Account[];
  transactions: Transaction[];
  isLoading: boolean;
  syncMode: 'online' | 'offline';
  loadAccounts: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  addAccount: (accountData: Omit<Account, 'id' | 'createdDate'>) => Promise<Account>;
  updateAccount: (id: string, updatedData: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
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

// Sync configuration for accounts
const accountsSyncConfig: SyncConfig<Account> = {
  storageKey: 'accounts',
  apiGet: () => accountsApi.getAll(),
  apiCreate: (data: Account) => accountsApi.create(data),
  apiUpdate: (id: string, data: Partial<Account>) => accountsApi.update(id, data),
  extractData: (response: any) => {
    const responseData = response.data.data || response.data;
    // Handle paginated response: { data: [...], total, page, limit, totalPages }
    const items = responseData.data || responseData.items || responseData;
    if (Array.isArray(items)) {
      return items;
    }
    console.warn('⚠️ Unexpected accounts response structure:', responseData);
    return [];
  },
};

export const useAccountsStore = create<AccountsStore>((set, get) => ({
  accounts: initialAccounts,
  transactions: initialTransactions,
  isLoading: false,
  syncMode: getSyncMode(),

  loadAccounts: async () => {
    set({ isLoading: true, syncMode: getSyncMode() });
    try {
  const accounts = await loadWithSync<Account>(accountsSyncConfig, initialAccounts);
      set({ accounts, isLoading: false });
    } catch (error) {
      console.error('Error loading accounts:', error);
      set({ isLoading: false });
    }
  },

  loadTransactions: async () => {
    // Note: Transactions are typically loaded per account via getMovements endpoint
  // Note: transactions are managed in-memory until backend endpoints are implemented
    set({ syncMode: getSyncMode() });
  },

  addAccount: async (accountData) => {
    const state = get();
    const newAccount: Account = {
      ...accountData,
      id: Date.now().toString(),
      createdDate: new Date().toISOString()
    };

    try {
  const createdAccount = await createWithSync<Account>(accountsSyncConfig, newAccount, state.accounts);
      set({ accounts: [createdAccount, ...state.accounts], syncMode: getSyncMode() });
      return createdAccount;
    } catch (error) {
      console.error('Error creating account:', error);
      return newAccount;
    }
  },

  updateAccount: async (id, updatedData) => {
    const state = get();

    try {
      await updateWithSync(accountsSyncConfig, id, updatedData, state.accounts);

      const newAccounts = state.accounts.map(account =>
        account.id === id ? { ...account, ...updatedData } : account
      );
      set({ accounts: newAccounts, syncMode: getSyncMode() });
    } catch (error) {
      console.error('Error updating account:', error);
    }
  },

  deleteAccount: async (id) => {
    const state = get();

    try {
      await deleteWithSync(accountsSyncConfig, id, state.accounts);

      const newAccounts = state.accounts.filter(account => account.id !== id);
      set({ accounts: newAccounts, syncMode: getSyncMode() });
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  },

  setAccounts: (accounts) => {
    set({ accounts });
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

    set((state) => ({
      transactions: [newTransaction, ...state.transactions],
    }));
    
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

      // Actualizar balance de la cuenta
      const newAccounts = state.accounts.map(account => 
        account.id === accountId 
          ? { ...account, balance: account.balance + amount }
          : account
      );

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