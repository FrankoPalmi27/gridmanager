/**
 * ACCOUNTS STORE - VERSIÓN SIMPLIFICADA
 *
 * Principio: TODO desde la base de datos
 * - Create → API → DB
 * - Read → API → DB
 * - Update → API → DB
 * - Delete → API → DB
 *
 * localStorage: SOLO como cache opcional (no fuente de verdad)
 *
 * ✅ ARQUITECTURA SIMPLE:
 * Browser → API call → Railway → Supabase PostgreSQL
 *    ↓ response
 * Update local state + localStorage cache
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { accountsApi } from '../lib/api';

// ============================================
// INTERFACES
// ============================================

export interface Account {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
  balance: number;
  currency: string;
  active: boolean;
  createdDate: string;
  description?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category?: string;
  reference?: string;
  linkedTo?: {
    type: 'sale' | 'purchase' | 'manual';
    id: string;
    number: string;
  };
}

interface AccountsStore {
  accounts: Account[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  // Account CRUD
  loadAccounts: () => Promise<void>;
  addAccount: (accountData: Omit<Account, 'id' | 'createdDate'>) => Promise<Account>;
  updateAccount: (id: string, updatedData: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  setAccounts: (accounts: Account[]) => void;
  getActiveAccounts: () => Account[];

  // Transaction methods
  addTransaction: (transactionData: Omit<Transaction, 'id'>) => Transaction;
  addLinkedTransaction: (
    accountId: string,
    amount: number,
    description: string,
    linkedTo: { type: 'sale' | 'purchase' | 'manual'; id: string; number: string }
  ) => Transaction;
  removeLinkedTransactions: (linkedType: 'sale' | 'purchase' | 'manual', linkedId: string) => void;
  getLinkedTransactions: (linkedType: 'sale' | 'purchase' | 'manual', linkedId: string) => Transaction[];
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getAllTransactions: () => Transaction[];
  updateTransactionAccount: (transactionId: string, newAccountId: string) => boolean;
  transferBetweenAccounts: (transfer: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description: string;
    date?: string;
    reference?: string;
  }) => boolean;

  // Helpers
  setError: (message: string | null) => void;
}

// ============================================
// HELPER: Map backend data to frontend format
// ============================================

const mapBackendToFrontend = (backendAccount: any): Account => ({
  id: backendAccount.id,
  name: backendAccount.name,
  accountNumber: backendAccount.accountNumber || '',
  bankName: '',
  accountType: backendAccount.type || 'BANK',
  balance: Number(backendAccount.currentBalance) || 0,
  currency: backendAccount.currency || 'ARS',
  active: backendAccount.active !== false,
  createdDate: backendAccount.createdAt || new Date().toISOString(),
  description: '',
});

// ============================================
// BALANCE CALCULATION HELPERS
// ============================================

const applyDerivedBalances = (accounts: Account[], transactions: Transaction[]) => {
  if (!accounts.length) return accounts;

  const summary = new Map<string, { income: number; expense: number }>();

  transactions.forEach((transaction) => {
    const existing = summary.get(transaction.accountId) ?? { income: 0, expense: 0 };
    if (transaction.type === 'income') {
      existing.income += transaction.amount;
    } else if (transaction.type === 'expense') {
      existing.expense += transaction.amount;
    }
    summary.set(transaction.accountId, existing);
  });

  return accounts.map((account) => {
    const totals = summary.get(account.id);
    const derivedBalance = totals ? totals.income - totals.expense : 0;
    return {
      ...account,
      balance: derivedBalance,
    };
  });
};

// ============================================
// STORE
// ============================================

export const useAccountsStore = create<AccountsStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      transactions: [],
      isLoading: false,
      error: null,

      // ============================================
      // LOAD: Cargar desde API
      // ============================================
      loadAccounts: async () => {
        console.log('[AccountsStore] 📥 Loading accounts from API...');
        set({ isLoading: true, error: null });

        try {
          const response = await accountsApi.getAll();

          // Extract data
          const responseData = response.data.data || response.data;
          const items = responseData.data || responseData.items || responseData;

          if (!Array.isArray(items)) {
            throw new Error('Invalid response format');
          }

          const accounts = items.map(mapBackendToFrontend);
          const accountsWithBalances = applyDerivedBalances(accounts, get().transactions);

          console.log(`[AccountsStore] ✅ Loaded ${accounts.length} accounts`);
          set({ accounts: accountsWithBalances, isLoading: false });
        } catch (error: any) {
          console.error('[AccountsStore] ❌ Error loading accounts:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Error al cargar cuentas',
          });
        }
      },

      // ============================================
      // CREATE: Crear en API
      // ============================================
      addAccount: async (accountData) => {
        console.log('[AccountsStore] ➕ Creating account:', accountData.name);
        set({ error: null });

        try {
          const response = await accountsApi.create(accountData);

          const responseData = response.data.data || response.data;
          const createdAccount = mapBackendToFrontend(responseData);

          // Update local state
          set((state) => {
            const accounts = [createdAccount, ...state.accounts];
            const accountsWithBalances = applyDerivedBalances(accounts, state.transactions);
            return { accounts: accountsWithBalances };
          });

          console.log('[AccountsStore] ✅ Account created:', createdAccount.id);
          return createdAccount;
        } catch (error: any) {
          console.error('[AccountsStore] ❌ Error creating account:', error);
          const errorMessage = error.response?.data?.message || 'Error al crear cuenta';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // ============================================
      // UPDATE: Actualizar en API
      // ============================================
      updateAccount: async (id, updatedData) => {
        console.log('[AccountsStore] ✏️ Updating account:', id);
        set({ error: null });

        try {
          await accountsApi.update(id, updatedData);

          // Update local state
          set((state) => {
            const accounts = state.accounts.map((account) =>
              account.id === id ? { ...account, ...updatedData } : account
            );
            const accountsWithBalances = applyDerivedBalances(accounts, state.transactions);
            return { accounts: accountsWithBalances };
          });

          console.log('[AccountsStore] ✅ Account updated:', id);
        } catch (error: any) {
          console.error('[AccountsStore] ❌ Error updating account:', error);
          const errorMessage = error.response?.data?.message || 'Error al actualizar cuenta';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // ============================================
      // DELETE: Eliminar en API
      // ============================================
      deleteAccount: async (id) => {
        console.log('[AccountsStore] 🗑️ Deleting account:', id);
        set({ error: null });

        try {
          await accountsApi.delete(id);

          // Update local state
          set((state) => {
            const accounts = state.accounts.filter((account) => account.id !== id);
            const transactions = state.transactions.filter((t) => t.accountId !== id);
            const accountsWithBalances = applyDerivedBalances(accounts, transactions);
            return { accounts: accountsWithBalances, transactions };
          });

          console.log('[AccountsStore] ✅ Account deleted:', id);
        } catch (error: any) {
          console.error('[AccountsStore] ❌ Error deleting account:', error);
          const errorMessage = error.response?.data?.message || 'Error al eliminar cuenta';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // ============================================
      // HELPERS
      // ============================================
      setAccounts: (accounts) => {
        const transactions = get().transactions;
        const accountsWithBalances = applyDerivedBalances(accounts, transactions);
        set({ accounts: accountsWithBalances });
      },

      getActiveAccounts: () => {
        return get().accounts.filter((account) => account.active);
      },

      // ============================================
      // TRANSACTION METHODS (LOCAL ONLY)
      // ============================================
      addTransaction: (transactionData) => {
        const newTransaction: Transaction = {
          ...transactionData,
          id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(),
        };

        set((state) => {
          const transactions = [newTransaction, ...state.transactions];
          const accounts = applyDerivedBalances(state.accounts, transactions);
          return { transactions, accounts };
        });

        return newTransaction;
      },

      addLinkedTransaction: (accountId, amount, description, linkedTo) => {
        const newTransaction: Transaction = {
          id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(),
          accountId,
          type: amount > 0 ? 'income' : 'expense',
          amount: Math.abs(amount),
          description,
          date: new Date().toISOString().split('T')[0],
          category: linkedTo.type === 'sale' ? 'Ventas' : linkedTo.type === 'purchase' ? 'Compras' : 'Operaciones',
          reference: linkedTo.number,
          linkedTo,
        };

        set((state) => {
          const transactions = [newTransaction, ...state.transactions];
          const accounts = applyDerivedBalances(state.accounts, transactions);
          return { transactions, accounts };
        });

        return newTransaction;
      },

      removeLinkedTransactions: (linkedType, linkedId) => {
        set((state) => {
          const transactions = state.transactions.filter(
            (t) => !(t.linkedTo?.type === linkedType && t.linkedTo?.id === linkedId)
          );
          const accounts = applyDerivedBalances(state.accounts, transactions);
          return { transactions, accounts };
        });
      },

      getLinkedTransactions: (linkedType, linkedId) => {
        return get().transactions.filter((t) => t.linkedTo?.type === linkedType && t.linkedTo?.id === linkedId);
      },

      getTransactionsByAccount: (accountId) => {
        return get().transactions.filter((t) => t.accountId === accountId);
      },

      getAllTransactions: () => {
        return get().transactions;
      },

      updateTransactionAccount: (transactionId, newAccountId) => {
        const state = get();
        const targetTransaction = state.transactions.find((t) => t.id === transactionId);

        if (!targetTransaction) {
          set({ error: 'No se encontró el movimiento seleccionado.' });
          return false;
        }

        if (targetTransaction.accountId === newAccountId) {
          set({ error: null });
          return true;
        }

        const newAccount = state.accounts.find((a) => a.id === newAccountId);
        if (!newAccount) {
          set({ error: 'La cuenta seleccionada no existe.' });
          return false;
        }

        const transactions = state.transactions.map((t) =>
          t.id === transactionId ? { ...t, accountId: newAccountId } : t
        );
        const accounts = applyDerivedBalances(state.accounts, transactions);

        set({ transactions, accounts, error: null });
        return true;
      },

      transferBetweenAccounts: ({ fromAccountId, toAccountId, amount, description, date, reference }) => {
        if (amount <= 0) {
          set({ error: 'El monto de la transferencia debe ser mayor a 0.' });
          return false;
        }

        const state = get();
        const fromAccount = state.accounts.find((a) => a.id === fromAccountId);
        const toAccount = state.accounts.find((a) => a.id === toAccountId);

        if (!fromAccount || !toAccount) {
          set({ error: 'No se encontraron las cuentas seleccionadas.' });
          return false;
        }

        if (fromAccountId === toAccountId) {
          set({ error: 'Selecciona cuentas distintas para transferir.' });
          return false;
        }

        if (fromAccount.balance < amount) {
          set({ error: 'Saldo insuficiente en la cuenta origen.' });
          return false;
        }

        const movementDate = date ?? new Date().toISOString().split('T')[0];
        const sanitizedDescription = description.trim() || 'Transferencia entre cuentas';

        const outgoingTransaction: Transaction = {
          id: `${Date.now()}-out`,
          accountId: fromAccountId,
          type: 'expense',
          amount,
          description: `${sanitizedDescription} (Salida)`,
          date: movementDate,
          category: 'Transferencia Entre Cuentas',
          reference,
        };

        const incomingTransaction: Transaction = {
          id: `${Date.now()}-in`,
          accountId: toAccountId,
          type: 'income',
          amount,
          description: `${sanitizedDescription} (Entrada)`,
          date: movementDate,
          category: 'Transferencia Entre Cuentas',
          reference,
        };

        set((state) => {
          const transactions = [incomingTransaction, outgoingTransaction, ...state.transactions];
          const accounts = applyDerivedBalances(state.accounts, transactions);
          return { accounts, transactions, error: null };
        });

        return true;
      },

      setError: (message) => {
        set({ error: message });
      },
    }),
    {
      name: 'grid-manager:accounts-cache', // Cache, NO fuente de verdad
      storage: typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined,
      partialize: (state) => ({
        // Solo cachear accounts y transactions (no error, loading, etc.)
        accounts: state.accounts,
        transactions: state.transactions,
      }),
    }
  )
);
