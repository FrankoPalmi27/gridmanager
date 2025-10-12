/**
 * ACCOUNTS STORE - VERSIÓN SIMPLE
 *
 * Principio: TODO desde la base de datos
 * - Create → API → DB
 * - Read → API → DB
 * - Update → API → DB
 * - Delete → API → DB
 *
 * localStorage: SOLO como cache opcional (no fuente de verdad)
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
}

interface AccountsStore {
  accounts: Account[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  // Read
  loadAccounts: () => Promise<void>;

  // Create
  addAccount: (accountData: Omit<Account, 'id' | 'createdDate'>) => Promise<Account>;

  // Update
  updateAccount: (id: string, updatedData: Partial<Account>) => Promise<void>;

  // Delete
  deleteAccount: (id: string) => Promise<void>;

  // Helpers
  getActiveAccounts: () => Account[];
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

          console.log(`[AccountsStore] ✅ Loaded ${accounts.length} accounts`);
          set({ accounts, isLoading: false });

        } catch (error: any) {
          console.error('[AccountsStore] ❌ Error loading accounts:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Error al cargar cuentas'
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
          set((state) => ({
            accounts: [createdAccount, ...state.accounts],
          }));

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
          set((state) => ({
            accounts: state.accounts.map((account) =>
              account.id === id ? { ...account, ...updatedData } : account
            ),
          }));

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
          set((state) => ({
            accounts: state.accounts.filter((account) => account.id !== id),
            transactions: state.transactions.filter((t) => t.accountId !== id),
          }));

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
      getActiveAccounts: () => {
        return get().accounts.filter((account) => account.active);
      },

      setError: (message) => {
        set({ error: message });
      },
    }),
    {
      name: 'grid-manager:accounts-cache', // Cache, NO fuente de verdad
      storage: typeof window !== 'undefined'
        ? createJSONStorage(() => window.localStorage)
        : undefined,
      partialize: (state) => ({
        // Solo cachear accounts (no error, loading, etc.)
        accounts: state.accounts,
        transactions: state.transactions,
      }),
    }
  )
);
