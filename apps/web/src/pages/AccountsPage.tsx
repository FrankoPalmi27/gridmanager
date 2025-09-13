import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Input } from '../components/ui/Input';
import { TransferModal } from '../components/forms/TransferModal';
import { formatCurrency, formatDate } from '../lib/formatters';

// Account interface
interface Account {
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
interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  category: string;
  reference?: string;
}

// Account types
const accountTypes = [
  'Cuenta Corriente',
  'Caja de Ahorro',
  'Cuenta USD',
  'Efectivo',
  'Tarjeta de Crédito',
  'Inversiones'
];

// Transaction categories
const transactionCategories = {
  income: ['Ventas', 'Servicios', 'Inversiones', 'Otros Ingresos'],
  expense: ['Proveedores', 'Gastos Operativos', 'Impuestos', 'Servicios', 'Otros Gastos'],
  transfer: ['Transferencia Entre Cuentas']
};

// LocalStorage keys (same as in salesStore.ts)
const ACCOUNTS_STORAGE_KEY = 'gridmanager_accounts';
const TRANSACTIONS_STORAGE_KEY = 'gridmanager_transactions';

// LocalStorage utilities
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Mock data for accounts
const mockAccounts: Account[] = [
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

// Mock data for transactions
const mockTransactions: Transaction[] = [
  {
    id: '1',
    accountId: '1',
    type: 'income',
    amount: 45000,
    description: 'Venta a Juan Pérez',
    date: '2024-01-20',
    category: 'Ventas',
    reference: 'VTA-2024-001'
  },
  {
    id: '2',
    accountId: '1',
    type: 'expense',
    amount: 15000,
    description: 'Pago a proveedor TechDistributor',
    date: '2024-01-19',
    category: 'Proveedores',
    reference: 'PAGO-001'
  },
  {
    id: '3',
    accountId: '2',
    type: 'income',
    amount: 8000,
    description: 'Venta en efectivo',
    date: '2024-01-18',
    category: 'Ventas'
  },
  {
    id: '4',
    accountId: '3',
    type: 'transfer',
    amount: 1000,
    description: 'Compra de dólares',
    date: '2024-01-17',
    category: 'Transferencia Entre Cuentas'
  },
  {
    id: '5',
    accountId: '4',
    type: 'expense',
    amount: 5000,
    description: 'Gastos de oficina',
    date: '2024-01-16',
    category: 'Gastos Operativos'
  }
];

// Account Modal Component
function AccountModal({ isOpen, closeModal, account, onAccountSaved }: {
  isOpen: boolean;
  closeModal: () => void;
  account?: Account;
  onAccountSaved: (account: Account) => void;
}) {
  const [formData, setFormData] = useState({
    name: account?.name || '',
    accountNumber: account?.accountNumber || '',
    bankName: account?.bankName || '',
    accountType: account?.accountType || accountTypes[0],
    balance: account?.balance || 0,
    currency: account?.currency || 'ARS',
    description: account?.description || '',
    active: account?.active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const savedAccount: Account = {
      id: account?.id || Date.now().toString(),
      ...formData,
      createdDate: account?.createdDate || new Date().toISOString().split('T')[0]
    };
    
    onAccountSaved(savedAccount);
    closeModal();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white border border-gray-200 p-6 text-left align-middle shadow-sm transition-all">
                <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 mb-4">
                  {account ? 'Editar' : 'Nueva'} Cuenta
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Cuenta
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Cuenta
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banco/Institución
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Cuenta
                    </label>
                    <Listbox value={formData.accountType} onChange={(value) => setFormData({ ...formData, accountType: value })}>
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <span className="block truncate">{formData.accountType}</span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                            {accountTypes.map((type) => (
                              <Listbox.Option
                                key={type}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-3 pr-4 ${
                                    active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                  }`
                                }
                                value={type}
                              >
                                <span className="block truncate">{type}</span>
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Saldo Inicial
                      </label>
                      <input
                        type="number"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Moneda
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                      Cuenta activa
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      {account ? 'Actualizar' : 'Crear'} Cuenta
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Transaction Modal Component
function TransactionModal({ isOpen, closeModal, accounts, onTransactionSaved }: {
  isOpen: boolean;
  closeModal: () => void;
  accounts: Account[];
  onTransactionSaved: (transaction: Transaction) => void;
}) {
  const [formData, setFormData] = useState({
    accountId: accounts[0]?.id || '',
    type: 'income' as 'income' | 'expense' | 'transfer',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    reference: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      ...formData
    };
    
    onTransactionSaved(transaction);
    closeModal();
    setFormData({
      accountId: accounts[0]?.id || '',
      type: 'income',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      reference: ''
    });
  };

  const selectedAccount = accounts.find(acc => acc.id === formData.accountId);
  const categories = transactionCategories[formData.type] || [];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white border border-gray-200 p-6 text-left align-middle shadow-sm transition-all">
                <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 mb-4">
                  Nueva Transacción
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuenta
                    </label>
                    <select
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {accounts.filter(acc => acc.active).map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.bankName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Transacción
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' | 'transfer', category: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="income">Ingreso</option>
                      <option value="expense">Egreso</option>
                      <option value="transfer">Transferencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto ({selectedAccount?.currency || 'ARS'})
                      </label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="0.01"
                        required
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referencia (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: VTA-2024-001, FACT-123"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Crear Transacción
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export function AccountsPage() {
  // Initialize state from localStorage, falling back to mock data
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const storedAccounts = loadFromStorage(ACCOUNTS_STORAGE_KEY, mockAccounts);
    // If localStorage is empty (first time), initialize with mock accounts
    if (storedAccounts.length === 0 || JSON.stringify(storedAccounts) === JSON.stringify([])) {
      saveToStorage(ACCOUNTS_STORAGE_KEY, mockAccounts);
      return mockAccounts;
    }
    return storedAccounts;
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const storedTransactions = loadFromStorage(TRANSACTIONS_STORAGE_KEY, mockTransactions);
    // If localStorage is empty (first time), initialize with mock transactions
    if (storedTransactions.length === 0 || JSON.stringify(storedTransactions) === JSON.stringify([])) {
      saveToStorage(TRANSACTIONS_STORAGE_KEY, mockTransactions);
      return mockTransactions;
    }
    return storedTransactions;
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const tableScrollRef = React.useRef<HTMLDivElement>(null);

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    saveToStorage(ACCOUNTS_STORAGE_KEY, accounts);
  }, [accounts]);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    saveToStorage(TRANSACTIONS_STORAGE_KEY, transactions);
  }, [transactions]);

  // Periodically sync with localStorage (to pick up changes from sales)
  useEffect(() => {
    const syncWithStorage = () => {
      const storedAccounts = loadFromStorage(ACCOUNTS_STORAGE_KEY, accounts);
      const storedTransactions = loadFromStorage(TRANSACTIONS_STORAGE_KEY, transactions);
      
      // Only update if the data has actually changed to avoid infinite loops
      if (JSON.stringify(storedAccounts) !== JSON.stringify(accounts)) {
        setAccounts(storedAccounts);
      }
      if (JSON.stringify(storedTransactions) !== JSON.stringify(transactions)) {
        setTransactions(storedTransactions);
      }
    };

    // Sync when the component mounts and when the window gains focus
    syncWithStorage();
    
    const handleFocus = () => syncWithStorage();
    window.addEventListener('focus', handleFocus);
    
    // Also sync periodically every 5 seconds when the tab is active
    const interval = setInterval(() => {
      if (!document.hidden) {
        syncWithStorage();
      }
    }, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []); // Empty dependency array to run only on mount

  const openAccountModal = (account?: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
    setEditingAccount(undefined);
  };

  const handleAccountSaved = (savedAccount: Account) => {
    if (editingAccount) {
      setAccounts(prev => prev.map(acc => acc.id === savedAccount.id ? savedAccount : acc));
    } else {
      setAccounts(prev => [savedAccount, ...prev]);
    }
  };

  const handleTransactionSaved = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    
    // Update account balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === transaction.accountId) {
        const balanceChange = transaction.type === 'income' 
          ? transaction.amount 
          : -transaction.amount;
        
        return {
          ...acc,
          balance: acc.balance + balanceChange
        };
      }
      return acc;
    }));
  };

  const handleTransferCompleted = (transfer: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description: string;
    date: string;
    reference: string;
  }) => {
    // Create two transactions: one outgoing from source, one incoming to destination
    const outgoingTransaction: Transaction = {
      id: `${Date.now()}-out`,
      accountId: transfer.fromAccountId,
      type: 'expense',
      amount: transfer.amount,
      description: `${transfer.description} (Transferencia a otra cuenta)`,
      date: transfer.date,
      category: 'Transferencia Entre Cuentas',
      reference: transfer.reference
    };

    const incomingTransaction: Transaction = {
      id: `${Date.now()}-in`,
      accountId: transfer.toAccountId,
      type: 'income',
      amount: transfer.amount,
      description: `${transfer.description} (Transferencia desde otra cuenta)`,
      date: transfer.date,
      category: 'Transferencia Entre Cuentas',
      reference: transfer.reference
    };

    // Add both transactions
    setTransactions(prev => [incomingTransaction, outgoingTransaction, ...prev]);
    
    // Update both account balances
    setAccounts(prev => prev.map(acc => {
      if (acc.id === transfer.fromAccountId) {
        return { ...acc, balance: acc.balance - transfer.amount };
      }
      if (acc.id === transfer.toAccountId) {
        return { ...acc, balance: acc.balance + transfer.amount };
      }
      return acc;
    }));
  };

  const handleDeleteAccount = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account && confirm(`¿Estás seguro de eliminar la cuenta "${account.name}"?`)) {
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      setTransactions(prev => prev.filter(trans => trans.accountId !== accountId));
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const account = accounts.find(acc => acc.id === transaction.accountId);
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAccount = selectedAccount === 'all' || transaction.accountId === selectedAccount;
    
    return matchesSearch && matchesAccount;
  });

  const totalBalance = accounts
    .filter(acc => acc.active)
    .reduce((total, acc) => {
      // Convert to ARS for calculation (simplified)
      const arsBalance = acc.currency === 'USD' ? acc.balance * 300 : acc.balance; // Simplified conversion
      return total + arsBalance;
    }, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((total, t) => total + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((total, t) => total + t.amount, 0);

  const activeAccounts = accounts.filter(acc => acc.active).length;

  const scrollLeft = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Cuentas</h1>
          <p className="text-sm text-gray-500">Administra tus cuentas bancarias y movimientos financieros</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Balance Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ingresos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Egresos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cuentas Activas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeAccounts}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Accounts Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cuentas</h2>
              <p className="text-sm text-gray-500">Gestiona tus cuentas bancarias y de efectivo</p>
            </div>
            <Button
              onClick={() => openAccountModal()}
              variant="primary"
            >
              <span className="mr-2">+</span>
              Nueva Cuenta
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <div key={account.id} className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${!account.active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${account.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-500">{account.bankName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => openAccountModal(account)}
                      variant="ghost"
                      size="icon"
                      className="text-blue-600 hover:text-blue-700 h-8 w-8"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button
                      onClick={() => handleDeleteAccount(account.id)}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 h-8 w-8"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tipo:</span>
                    <span className="font-medium">{account.accountType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Número:</span>
                    <span className="font-medium">{account.accountNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Balance:</span>
                    <span className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(account.balance, account.currency)}
                    </span>
                  </div>
                </div>
                
                {account.description && (
                  <p className="text-xs text-gray-400 mt-3 border-t pt-3">
                    {account.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transactions Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Movimientos</h2>
              <p className="text-sm text-gray-500">Historial de transacciones</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsTransferModalOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Transferir
              </Button>
              <Button
                onClick={() => setIsTransactionModalOpen(true)}
                variant="primary"
              >
                <span className="mr-2">+</span>
                Nueva Transacción
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar transacciones..."
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>}
                iconPosition="left"
                className="block w-full"
              />
            </div>
            
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas las cuentas</option>
              {accounts.filter(acc => acc.active).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Movimientos</h3>
              
              {/* Horizontal Navigation Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 mr-3">Navegación horizontal:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollLeft}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
                >
                  ← Izquierda
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollRight}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
                >
                  Derecha →
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div 
                ref={tableScrollRef}
                className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#D1D5DB #F3F4F6',
                  maxWidth: '100%',
                  width: '100%'
                }}
              >
                <table className="divide-y divide-gray-200" style={{ minWidth: '1400px', width: 'max-content' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ width: '150px', minWidth: '150px' }}>
                      Fecha
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ width: '200px', minWidth: '200px' }}>
                      Cuenta
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ width: '300px', minWidth: '300px' }}>
                      Descripción
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ width: '150px', minWidth: '150px' }}>
                      Categoría
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ width: '130px', minWidth: '130px' }}>
                      Tipo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ width: '150px', minWidth: '150px' }}>
                      Monto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ width: '150px', minWidth: '150px' }}>
                      Referencia
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const account = accounts.find(acc => acc.id === transaction.accountId);
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: '150px', minWidth: '150px' }}>
                          {formatDate(new Date(transaction.date))}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap" style={{ width: '200px', minWidth: '200px' }}>
                          <div className="text-sm font-medium text-gray-900">{account?.name}</div>
                          <div className="text-sm text-gray-500">{account?.bankName}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate" style={{ width: '300px', minWidth: '300px' }}>
                          {transaction.description}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: '150px', minWidth: '150px' }}>
                          {transaction.category}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap" style={{ width: '130px', minWidth: '130px' }}>
                          <StatusBadge 
                            variant={
                              transaction.type === 'income' ? 'success' :
                              transaction.type === 'expense' ? 'danger' : 'info'
                            }
                            dot
                          >
                            {transaction.type === 'income' ? 'Ingreso' : 
                             transaction.type === 'expense' ? 'Egreso' : 'Transferencia'}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium" style={{ width: '150px', minWidth: '150px' }}>
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500" style={{ width: '150px', minWidth: '150px' }}>
                          {transaction.reference || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron transacciones</h3>
                <p className="text-sm text-gray-500">
                  {searchTerm || selectedAccount !== 'all' 
                    ? 'No hay transacciones que coincidan con los filtros.' 
                    : 'Aún no tienes transacciones registradas.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AccountModal
          isOpen={isAccountModalOpen}
          closeModal={closeAccountModal}
          account={editingAccount}
          onAccountSaved={handleAccountSaved}
        />

        <TransactionModal
          isOpen={isTransactionModalOpen}
          closeModal={() => setIsTransactionModalOpen(false)}
          accounts={accounts}
          onTransactionSaved={handleTransactionSaved}
        />

        <TransferModal
          isOpen={isTransferModalOpen}
          closeModal={() => setIsTransferModalOpen(false)}
          accounts={accounts}
          onTransferCompleted={handleTransferCompleted}
        />
      </div>
    </div>
  );
}