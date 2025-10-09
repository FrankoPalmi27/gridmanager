import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
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
  error: string | null;
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
  transferBetweenAccounts: (transfer: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description: string;
    date?: string;
    reference?: string;
  }) => boolean;
  // Métodos para manejo de transacciones enlazadas
  addLinkedTransaction: (accountId: string, amount: number, description: string, linkedTo: { type: 'sale' | 'purchase' | 'manual'; id: string; number: string }) => Transaction;
  removeLinkedTransactions: (linkedType: 'sale' | 'purchase' | 'manual', linkedId: string) => void;
  getLinkedTransactions: (linkedType: 'sale' | 'purchase' | 'manual', linkedId: string) => Transaction[];
  setError: (message: string | null) => void;
}

// Sync configuration for accounts
const accountsSyncConfig: SyncConfig<Account> = {
  storageKey: 'accounts',
  apiGet: () => accountsApi.getAll(),
  apiCreate: (data: Account) => accountsApi.create(data),
  apiUpdate: (id: string, data: Partial<Account>) => accountsApi.update(id, data),
  apiDelete: (id: string) => accountsApi.delete(id),
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

type BroadcastEvent =
  | {
      type: 'accounts/update';
      payload: {
        accounts: Account[];
        transactions?: Transaction[];
        syncMode?: 'online' | 'offline';
      };
      source: string;
      timestamp: number;
    }
  | {
      type: 'accounts/request-refresh';
      source: string;
      timestamp: number;
    };

const BROADCAST_CHANNEL_NAME = 'grid-manager:accounts';

const createTabId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const tabId = createTabId();

const broadcastChannel =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    : null;

const broadcast = (event: Omit<BroadcastEvent, 'source' | 'timestamp'>) => {
  if (!broadcastChannel) {
    return;
  }

  broadcastChannel.postMessage({
    ...event,
    source: tabId,
    timestamp: Date.now(),
  } as BroadcastEvent);
};

let isBroadcastRegistered = false;

const registerBroadcastListener = (
  set: StoreApi<AccountsStore>['setState'],
  get: StoreApi<AccountsStore>['getState'],
) => {
  if (!broadcastChannel || isBroadcastRegistered) {
    return;
  }

  broadcastChannel.addEventListener('message', (event: MessageEvent<BroadcastEvent>) => {
    const data = event.data;

    if (!data || data.source === tabId) {
      return;
    }

    if (data.type === 'accounts/update') {
      const { accounts, transactions, syncMode } = data.payload;
      set((state) => ({
        accounts,
        transactions: transactions ?? state.transactions,
        syncMode: syncMode ?? state.syncMode,
      }));
    }

    if (data.type === 'accounts/request-refresh') {
      void get().loadAccounts();
    }
  });

  isBroadcastRegistered = true;
};

const storage = typeof window !== 'undefined'
  ? createJSONStorage<AccountsStore>(() => window.localStorage)
  : undefined;

export const useAccountsStore = create<AccountsStore>()(
  persist(
    (set, get) => {
      registerBroadcastListener(set, get);

      return {
        accounts: initialAccounts,
        transactions: initialTransactions,
        isLoading: false,
        error: null,
        syncMode: getSyncMode(),

        loadAccounts: async () => {
          const mode = getSyncMode();
          const currentAccounts = get().accounts;
          set({ isLoading: true, syncMode: mode, error: null });

          try {
            // Usar las cuentas actuales como fallback en lugar de un array vacío
            const accounts = await loadWithSync<Account>(accountsSyncConfig, currentAccounts);

            // Solo actualizar si realmente obtuvimos cuentas o si no teníamos ninguna
            set((state) => ({
              accounts,
              isLoading: false,
              syncMode: mode,
              error: null,
              transactions: state.transactions,
            }));

            broadcast({
              type: 'accounts/update',
              payload: { accounts, syncMode: mode },
            });
          } catch (error) {
            console.error('[AccountsStore] Error loading accounts:', error);
            set((state) => ({
              isLoading: false,
              error: 'No se pudo actualizar la lista de cuentas. Se muestran los datos almacenados localmente.',
              accounts: state.accounts,
              transactions: state.transactions,
            }));
          }
        },

        loadTransactions: async () => {
          set({ syncMode: getSyncMode() });
        },

        addAccount: async (accountData) => {
          const newAccount: Account = {
            ...accountData,
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(),
            createdDate: new Date().toISOString(),
          };

          set({ error: null });

          try {
            const createdAccount = await createWithSync<Account>(accountsSyncConfig, newAccount, get().accounts);

            set((state) => {
              const accounts = [createdAccount, ...state.accounts.filter((account) => account.id !== createdAccount.id)];
              broadcast({
                type: 'accounts/update',
                payload: { accounts },
              });
              return {
                accounts,
                syncMode: getSyncMode(),
              };
            });

            return createdAccount;
          } catch (error) {
            console.error('[AccountsStore] Error creating account:', error);
            set((state) => {
              const accounts = [newAccount, ...state.accounts];
              broadcast({
                type: 'accounts/update',
                payload: { accounts },
              });
              return {
                accounts,
                error: 'Cuenta guardada sin conexión. Se sincronizará cuando vuelva la conexión.',
                syncMode: getSyncMode(),
              };
            });

            return newAccount;
          }
        },

        updateAccount: async (id, updatedData) => {
          set({ error: null });
          const previousState = get().accounts;

          try {
            await updateWithSync(accountsSyncConfig, id, updatedData, previousState);

            set((state) => {
              const accounts = state.accounts.map((account) =>
                account.id === id ? { ...account, ...updatedData } : account,
              );
              broadcast({
                type: 'accounts/update',
                payload: { accounts },
              });
              return { accounts, syncMode: getSyncMode() };
            });
          } catch (error) {
            console.error('[AccountsStore] Error updating account:', error);
            set({ accounts: previousState, error: 'No se pudo actualizar la cuenta. Revisa la conexión.' });
          }
        },

        deleteAccount: async (id) => {
          set({ error: null });
          const previousState = get().accounts;

          try {
            await deleteWithSync(accountsSyncConfig, id, previousState);

            set((state) => {
              const accounts = state.accounts.filter((account) => account.id !== id);
              const transactions = state.transactions.filter((transaction) => transaction.accountId !== id);
              broadcast({
                type: 'accounts/update',
                payload: { accounts, transactions },
              });
              return { accounts, transactions, syncMode: getSyncMode() };
            });
          } catch (error) {
            console.error('[AccountsStore] Error deleting account:', error);
            set({ accounts: previousState, error: 'No se pudo eliminar la cuenta. Intenta nuevamente.' });
          }
        },

        setAccounts: (accounts) => {
          set({ accounts });
          broadcast({
            type: 'accounts/update',
            payload: { accounts },
          });
        },

        getActiveAccounts: () => {
          return get().accounts.filter((account) => account.active);
        },

        addTransaction: (transactionData) => {
          const newTransaction: Transaction = {
            ...transactionData,
            id:
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : Date.now().toString(),
          };

          set((state) => {
            const transactions = [newTransaction, ...state.transactions];
            const balanceDelta =
              newTransaction.type === 'income'
                ? newTransaction.amount
                : newTransaction.type === 'expense'
                  ? -newTransaction.amount
                  : 0;

            const accounts = state.accounts.map((account) =>
              account.id === newTransaction.accountId
                ? { ...account, balance: account.balance + balanceDelta }
                : account,
            );
            broadcast({
              type: 'accounts/update',
              payload: { accounts, transactions },
            });
            return { transactions, accounts };
          });

          return newTransaction;
        },

        getTransactionsByAccount: (accountId) => {
          return get().transactions.filter((transaction) => transaction.accountId === accountId);
        },

        getAllTransactions: () => {
          return get().transactions;
        },

        transferBetweenAccounts: ({
          fromAccountId,
          toAccountId,
          amount,
          description,
          date,
          reference,
        }) => {
          if (amount <= 0) {
            set({ error: 'El monto de la transferencia debe ser mayor a 0.' });
            return false;
          }

          const accountsState = get().accounts;
          const fromAccount = accountsState.find((account) => account.id === fromAccountId);
          const toAccount = accountsState.find((account) => account.id === toAccountId);

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
            const accounts = state.accounts.map((account) => {
              if (account.id === fromAccountId) {
                return { ...account, balance: account.balance - amount };
              }

              if (account.id === toAccountId) {
                return { ...account, balance: account.balance + amount };
              }

              return account;
            });

            broadcast({
              type: 'accounts/update',
              payload: { accounts, transactions },
            });

            return { accounts, transactions };
          });
          return true;
        },

        // Implementación de métodos para transacciones enlazadas
        addLinkedTransaction: (accountId, amount, description, linkedTo) => {
          const newTransaction: Transaction = {
            id:
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : Date.now().toString(),
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
            const newTransactions = [newTransaction, ...state.transactions];

            // Actualizar balance de la cuenta
            const newAccounts = state.accounts.map((account) =>
              account.id === accountId ? { ...account, balance: account.balance + amount } : account,
            );

            broadcast({
              type: 'accounts/update',
              payload: { accounts: newAccounts, transactions: newTransactions },
            });

            return {
              transactions: newTransactions,
              accounts: newAccounts,
            };
          });

          return newTransaction;
        },

        removeLinkedTransactions: (linkedType, linkedId) => {
          set((state) => {
            // Encontrar transacciones enlazadas
            const linkedTransactions = state.transactions.filter(
              (transaction) =>
                transaction.linkedTo?.type === linkedType && transaction.linkedTo?.id === linkedId,
            );

            // Calcular el balance a revertir por cuenta
            const balanceChanges: { [accountId: string]: number } = {};
            linkedTransactions.forEach((transaction) => {
              const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
              balanceChanges[transaction.accountId] = (balanceChanges[transaction.accountId] || 0) + balanceChange;
            });

            // Remover transacciones enlazadas
            const newTransactions = state.transactions.filter(
              (transaction) => !(transaction.linkedTo?.type === linkedType && transaction.linkedTo?.id === linkedId),
            );

            // Actualizar balances de las cuentas afectadas
            const newAccounts = state.accounts.map((account) =>
              balanceChanges[account.id]
                ? { ...account, balance: account.balance + balanceChanges[account.id] }
                : account,
            );

            broadcast({
              type: 'accounts/update',
              payload: { accounts: newAccounts, transactions: newTransactions },
            });

            return {
              transactions: newTransactions,
              accounts: newAccounts,
            };
          });
        },

        getLinkedTransactions: (linkedType, linkedId) => {
          return get().transactions.filter(
            (transaction) =>
              transaction.linkedTo?.type === linkedType && transaction.linkedTo?.id === linkedId,
          );
        },

        setError: (message) => {
          set({ error: message });
        },
      };
    },
    {
      name: 'grid-manager:accounts@v1',
      storage,
      partialize: (state) => ({
        accounts: state.accounts,
        transactions: state.transactions,
        syncMode: state.syncMode,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('[AccountsStore] Error rehydrating state', error);
        }
      },
    },
  ),
);