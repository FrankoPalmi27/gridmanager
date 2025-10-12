import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import { accountsApi } from '../lib/api';
import { loadWithSync, createWithSync, updateWithSync, deleteWithSync, getSyncMode, SyncConfig } from '../lib/syncStorage';
import { setupCrossBrowserSync, notifyCrossBrowserChange } from '../lib/storeWithCrossBrowserSync';

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

const BALANCE_EPSILON = 0.005;

const calculateTransactionImpact = (transactions: Transaction[]) => {
  const impact = new Map<string, number>();

  transactions.forEach((transaction) => {
    const delta = transaction.type === 'income' ? transaction.amount : -transaction.amount;
    impact.set(transaction.accountId, (impact.get(transaction.accountId) ?? 0) + delta);
  });

  return impact;
};

const reconcileAccountsWithTransactions = (
  incomingAccounts: Account[],
  previousAccounts: Account[],
  transactions: Transaction[],
) => {
  if (incomingAccounts.length === 0) {
    return previousAccounts;
  }

  const transactionImpact = calculateTransactionImpact(transactions);

  return incomingAccounts.map((incomingAccount) => {
    const previousAccount = previousAccounts.find((account) => account.id === incomingAccount.id);
    const impact = transactionImpact.get(incomingAccount.id) ?? 0;

    if (!previousAccount) {
      if (Math.abs(impact) < BALANCE_EPSILON) {
        return incomingAccount;
      }

      return {
        ...incomingAccount,
        balance: incomingAccount.balance + impact,
      };
    }

    const previousBalance = previousAccount.balance;
    const incomingBalance = incomingAccount.balance;
    const balanceWithImpact = incomingBalance + impact;

    const matchesPrevious = Math.abs(previousBalance - incomingBalance) < BALANCE_EPSILON;
    const matchesPreviousAfterImpact = Math.abs(previousBalance - balanceWithImpact) < BALANCE_EPSILON;

    if (matchesPrevious || matchesPreviousAfterImpact) {
      return {
        ...incomingAccount,
        balance: previousBalance,
      };
    }

    return {
      ...incomingAccount,
      balance: balanceWithImpact,
    };
  });
};

const summarizeTransactionsByAccount = (transactions: Transaction[]) => {
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

  return summary;
};

const applyDerivedBalances = (accounts: Account[], transactions: Transaction[]) => {
  if (!accounts.length) {
    return accounts;
  }

  const summary = summarizeTransactionsByAccount(transactions);

  return accounts.map((account) => {
    const totals = summary.get(account.id);
    const derivedBalance = totals ? totals.income - totals.expense : 0;

    return {
      ...account,
      balance: derivedBalance,
    };
  });
};

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
  updateTransactionAccount: (transactionId: string, newAccountId: string) => boolean;
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
      // Transform backend data to frontend format
      return items.map((item: any) => ({
        id: item.id,
        name: item.name,
        accountNumber: item.accountNumber || '',
        bankName: '', // Backend doesn't have this field
        accountType: item.type || 'BANK', // type → accountType
        paymentMethod: undefined, // Backend doesn't have this field
        balance: Number(item.currentBalance) || 0, // currentBalance → balance
        currency: item.currency || 'ARS',
        active: item.active !== undefined ? item.active : true,
        createdDate: item.createdAt || new Date().toISOString(),
        description: '', // Backend doesn't have this field
      }));
    }
    console.warn('⚠️ Unexpected accounts response structure:', responseData);
    return [];
  },
};

type AccountsUpdatePayload = {
  accounts: Account[];
  transactions?: Transaction[];
  syncMode?: 'online' | 'offline';
};

type BroadcastEvent =
  | {
      type: 'accounts/update';
      payload: AccountsUpdatePayload;
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

type BroadcastPayload =
  | {
      type: 'accounts/update';
      payload: AccountsUpdatePayload;
    }
  | {
      type: 'accounts/request-refresh';
    };

const broadcast = (event: BroadcastPayload) => {
  if (!broadcastChannel) {
    return;
  }

  const message: BroadcastEvent = {
    ...event,
    source: tabId,
    timestamp: Date.now(),
  };

  broadcastChannel.postMessage(message);
};

const broadcastAccountsUpdate = (payload: AccountsUpdatePayload) => {
  broadcast({
    type: 'accounts/update',
    payload,
  });
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

      // Setup cross-browser synchronization
      setupCrossBrowserSync('accounts', {
        load: () => get().loadAccounts(),
      });

      return {
        accounts: initialAccounts,
        transactions: initialTransactions,
        isLoading: false,
        error: null,
        syncMode: getSyncMode(),

        loadAccounts: async () => {
          const mode = getSyncMode();

          const snapshotBeforeLoad = get();
          const snapshotAccounts = snapshotBeforeLoad.accounts;
          const snapshotTransactions = snapshotBeforeLoad.transactions;

          console.log('[AccountsStore] 🔄 loadAccounts called');
          console.log('[AccountsStore] 📊 Current accounts before load:', snapshotAccounts.length);
          console.log('[AccountsStore] 🔌 Sync mode:', mode);

          set({ isLoading: true, syncMode: mode, error: null });

          try {
            // Usar las cuentas actuales como fallback en lugar de un array vacío
            const accountsFromSync = await loadWithSync<Account>(accountsSyncConfig, snapshotAccounts);
            console.log('[AccountsStore] ✅ Accounts loaded from sync:', accountsFromSync.length);

            const { accounts: latestAccounts, transactions: latestTransactions } = get();

            const accountsForReconcile = latestAccounts.length ? latestAccounts : snapshotAccounts;
            const transactionsForReconcile = latestTransactions.length ? latestTransactions : snapshotTransactions;

            const reconciledAccounts = reconcileAccountsWithTransactions(
              accountsFromSync,
              accountsForReconcile,
              transactionsForReconcile,
            );

            const accountsWithDerivedBalances = applyDerivedBalances(reconciledAccounts, transactionsForReconcile);

            // Solo actualizar si realmente obtuvimos cuentas o si no teníamos ninguna
            set((state) => ({
              accounts: accountsWithDerivedBalances,
              isLoading: false,
              syncMode: mode,
              error: null,
              transactions: state.transactions,
            }));

            broadcastAccountsUpdate({ accounts: accountsWithDerivedBalances, syncMode: mode });
          } catch (error) {
            console.error('[AccountsStore] ❌ Error loading accounts:', error);
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

          console.log('[AccountsStore] ➕ Adding new account:', newAccount.name, newAccount.id);

          set({ error: null });

          try {
            const createdAccount = await createWithSync<Account>(accountsSyncConfig, newAccount, get().accounts);

            console.log('[AccountsStore] ✅ Account created successfully:', createdAccount.id);

            set((state) => {
              const accounts = [createdAccount, ...state.accounts.filter((account) => account.id !== createdAccount.id)];
              const accountsWithDerived = applyDerivedBalances(accounts, state.transactions);
              console.log('[AccountsStore] 📝 State updated. Total accounts:', accountsWithDerived.length);
              broadcastAccountsUpdate({ accounts: accountsWithDerived });

              // Notify cross-browser sync
              notifyCrossBrowserChange('accounts', 'create', createdAccount.id);

              return {
                accounts: accountsWithDerived,
                syncMode: getSyncMode(),
              };
            });

            return createdAccount;
          } catch (error) {
            console.error('[AccountsStore] ❌ Error creating account:', error);
            set((state) => {
              const accounts = [newAccount, ...state.accounts];
              const accountsWithDerived = applyDerivedBalances(accounts, state.transactions);
              console.log('[AccountsStore] 💾 Account saved offline. Total accounts:', accountsWithDerived.length);
              broadcastAccountsUpdate({ accounts: accountsWithDerived });

              // Notify cross-browser sync even in offline mode
              notifyCrossBrowserChange('accounts', 'create', newAccount.id);

              return {
                accounts: accountsWithDerived,
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
              const accountsWithDerived = applyDerivedBalances(accounts, state.transactions);
              broadcastAccountsUpdate({ accounts: accountsWithDerived });

              // Notify cross-browser sync
              notifyCrossBrowserChange('accounts', 'update', id);

              return { accounts: accountsWithDerived, syncMode: getSyncMode() };
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
              const accountsWithDerived = applyDerivedBalances(accounts, transactions);
              broadcastAccountsUpdate({ accounts: accountsWithDerived, transactions });

              // Notify cross-browser sync
              notifyCrossBrowserChange('accounts', 'delete', id);

              return { accounts: accountsWithDerived, transactions, syncMode: getSyncMode() };
            });
          } catch (error) {
            console.error('[AccountsStore] Error deleting account:', error);
            set({ accounts: previousState, error: 'No se pudo eliminar la cuenta. Intenta nuevamente.' });
          }
        },

        setAccounts: (accounts) => {
          const transactions = get().transactions;
          const accountsWithDerived = applyDerivedBalances(accounts, transactions);
          set({ accounts: accountsWithDerived });
          broadcastAccountsUpdate({ accounts: accountsWithDerived });
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
            const accounts = applyDerivedBalances(state.accounts, transactions);
            broadcastAccountsUpdate({ accounts, transactions });
            return { transactions, accounts };
          });

          return newTransaction;
        },

        updateTransactionAccount: (transactionId, newAccountId) => {
          const state = get();
          const targetTransaction = state.transactions.find((transaction) => transaction.id === transactionId);

          if (!targetTransaction) {
            set({ error: 'No se encontró el movimiento seleccionado.' });
            return false;
          }

          if (targetTransaction.accountId === newAccountId) {
            set({ error: null });
            return true;
          }

          const newAccount = state.accounts.find((account) => account.id === newAccountId);

          if (!newAccount) {
            set({ error: 'La cuenta seleccionada no existe.' });
            return false;
          }

          const updatedTransactions = state.transactions.map((transaction) =>
            transaction.id === transactionId ? { ...transaction, accountId: newAccountId } : transaction,
          );

          const updatedAccounts = applyDerivedBalances(state.accounts, updatedTransactions);

          set({
            transactions: updatedTransactions,
            accounts: updatedAccounts,
            error: null,
          });

          broadcastAccountsUpdate({ accounts: updatedAccounts, transactions: updatedTransactions });

          return true;
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
            const accounts = applyDerivedBalances(state.accounts, transactions);

            broadcastAccountsUpdate({ accounts, transactions });

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

            const newAccounts = applyDerivedBalances(state.accounts, newTransactions);

            broadcastAccountsUpdate({ accounts: newAccounts, transactions: newTransactions });

            return {
              transactions: newTransactions,
              accounts: newAccounts,
            };
          });

          return newTransaction;
        },

        removeLinkedTransactions: (linkedType, linkedId) => {
          set((state) => {
            // Remover transacciones enlazadas
            const newTransactions = state.transactions.filter(
              (transaction) => !(transaction.linkedTo?.type === linkedType && transaction.linkedTo?.id === linkedId),
            );

            // Actualizar balances de las cuentas afectadas
            const newAccounts = applyDerivedBalances(state.accounts, newTransactions);

            broadcastAccountsUpdate({ accounts: newAccounts, transactions: newTransactions });

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
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[AccountsStore] ❌ Error rehydrating state', error);
        } else if (state) {
          console.log('[AccountsStore] 🔄 State rehydrated from localStorage');
          console.log('[AccountsStore] 📊 Rehydrated accounts:', state.accounts?.length || 0);
          console.log('[AccountsStore] 📊 Rehydrated transactions:', state.transactions?.length || 0);
        }
      },
    },
  ),
);