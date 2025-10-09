import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowLeftRight, Check, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import BulkTransactionImport from '../components/BulkTransactionImport';
import { TransferModal } from '../components/forms/TransferModal';
import { useTableScroll } from '../hooks/useTableScroll';
import { formatCurrency, formatDate } from '../lib/formatters';
import { useAccountsStore, type Account, type Transaction } from '../store/accountsStore';

type AccountFormValues = Omit<Account, 'id' | 'createdDate'>;
type TransactionFormValues = Omit<Transaction, 'id'>;

type FeedbackState = {
  type: 'success' | 'warning' | 'error';
  message: string;
} | null;

const ACCOUNT_TYPES: string[] = [
  'Cuenta Corriente',
  'Caja de Ahorro',
  'Cuenta USD',
  'Efectivo',
  'Tarjeta de Crédito',
  'Inversiones',
];

const PAYMENT_METHOD_OPTIONS: Array<{ value: Account['paymentMethod'] | ''; label: string }> = [
  { value: '', label: 'Sin método asociado' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'check', label: 'Cheque' },
  { value: 'other', label: 'Otro' },
];

const TRANSACTION_CATEGORIES: Record<'income' | 'expense', string[]> = {
  income: ['Ventas', 'Servicios', 'Inversiones', 'Otros Ingresos'],
  expense: ['Proveedores', 'Gastos Operativos', 'Impuestos', 'Servicios', 'Otros Gastos'],
};

const convertToArs = (amount: number, currency: string) => {
  switch (currency) {
    case 'USD':
      return amount * 350;
    case 'EUR':
      return amount * 380;
    default:
      return amount;
  }
};

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
  onSubmit: (values: AccountFormValues) => Promise<void>;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

function AccountModal({ isOpen, onClose, account, onSubmit, isSubmitting, errorMessage }: AccountModalProps) {
  const [formData, setFormData] = useState<AccountFormValues>(() => ({
    name: account?.name ?? '',
    accountNumber: account?.accountNumber ?? '',
    bankName: account?.bankName ?? '',
    accountType: account?.accountType ?? ACCOUNT_TYPES[0],
    paymentMethod: account?.paymentMethod,
    balance: account?.balance ?? 0,
    currency: account?.currency ?? 'ARS',
    description: account?.description ?? '',
    active: account?.active ?? true,
  }));

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData({
      name: account?.name ?? '',
      accountNumber: account?.accountNumber ?? '',
      bankName: account?.bankName ?? '',
      accountType: account?.accountType ?? ACCOUNT_TYPES[0],
      paymentMethod: account?.paymentMethod,
      balance: account?.balance ?? 0,
      currency: account?.currency ?? 'ARS',
      description: account?.description ?? '',
      active: account?.active ?? true,
    });
  }, [account, isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: AccountFormValues = {
      ...formData,
      name: formData.name.trim(),
      accountNumber: formData.accountNumber.trim(),
      bankName: formData.bankName.trim(),
      description: formData.description.trim(),
      paymentMethod: formData.paymentMethod || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  {account ? 'Editar cuenta' : 'Nueva cuenta'}
                </Dialog.Title>

                {errorMessage && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Nombre de la cuenta"
                      required
                      value={formData.name}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, name: event.target.value }))
                      }
                      disabled={isSubmitting}
                    />
                    <Input
                      label="Número de cuenta"
                      required
                      value={formData.accountNumber}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, accountNumber: event.target.value }))
                      }
                      disabled={isSubmitting}
                    />
                    <Input
                      label="Banco / Institución"
                      required
                      value={formData.bankName}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, bankName: event.target.value }))
                      }
                      disabled={isSubmitting}
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="account-type-select"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Tipo de cuenta
                      </label>
                      <select
                        id="account-type-select"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.accountType}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, accountType: event.target.value }))
                        }
                        disabled={isSubmitting}
                      >
                        {ACCOUNT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor="account-payment-method-select"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Método de pago sugerido
                      </label>
                      <select
                        id="account-payment-method-select"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.paymentMethod ?? ''}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentMethod: event.target.value as Account['paymentMethod'],
                          }))
                        }
                        disabled={isSubmitting}
                      >
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <option key={option.label} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Saldo"
                      type="number"
                      required
                      value={formData.balance}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          balance: Number.isNaN(parseFloat(event.target.value))
                            ? 0
                            : parseFloat(event.target.value),
                        }))
                      }
                      step="0.01"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor="account-currency-select"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Moneda
                      </label>
                      <select
                        id="account-currency-select"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.currency}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            currency: event.target.value as Account['currency'],
                          }))
                        }
                        disabled={isSubmitting}
                      >
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        id="account-active-checkbox"
                        type="checkbox"
                        checked={formData.active}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, active: event.target.checked }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <label htmlFor="account-active-checkbox" className="text-sm text-gray-700">
                        Cuenta activa
                      </label>
                    </div>
                  </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="account-description-textarea"
                        className="block text-sm font-medium text-gray-700"
                      >
                      Descripción
                    </label>
                    <textarea
                      id="account-description-textarea"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, description: event.target.value }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" loading={isSubmitting}>
                      {account ? 'Guardar cambios' : 'Crear cuenta'}
                    </Button>
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

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSubmit: (transaction: TransactionFormValues) => void;
}

function TransactionModal({ isOpen, onClose, accounts, onSubmit }: TransactionModalProps) {
  const activeAccounts = useMemo(() => accounts.filter((account) => account.active), [accounts]);

  const buildInitialForm = useCallback(
    (defaultAccountId?: string): TransactionFormValues => ({
      accountId: defaultAccountId ?? activeAccounts[0]?.id ?? '',
      type: 'income',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      reference: '',
    }),
    [activeAccounts],
  );

  const [formData, setFormData] = useState<TransactionFormValues>(() => buildInitialForm());

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const preferredAccount = activeAccounts[0]?.id ?? '';
    setFormData(buildInitialForm(preferredAccount));
  }, [activeAccounts, buildInitialForm, isOpen]);

  const categories = TRANSACTION_CATEGORIES[formData.type];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(formData.amount);
    if (!formData.accountId || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    onSubmit({
      ...formData,
      amount,
      description: formData.description.trim(),
      category: formData.category.trim() || undefined,
      reference: formData.reference.trim() || undefined,
    });
    onClose();
  };

  const selectedAccount = activeAccounts.find((account) => account.id === formData.accountId);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Registrar transacción
                </Dialog.Title>

                {activeAccounts.length === 0 ? (
                  <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Necesitas al menos una cuenta activa para registrar movimientos.
                  </div>
                ) : (
                  <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          htmlFor="transaction-account-select"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Cuenta
                        </label>
                        <select
                          id="transaction-account-select"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.accountId}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, accountId: event.target.value }))
                          }
                          required
                        >
                          {activeAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name} ({account.bankName})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor="transaction-type-select"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Tipo
                        </label>
                        <select
                          id="transaction-type-select"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.type}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              type: event.target.value as TransactionFormValues['type'],
                              category: '',
                            }))
                          }
                          required
                        >
                          <option value="income">Ingreso</option>
                          <option value="expense">Egreso</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        label={`Monto (${selectedAccount?.currency ?? 'ARS'})`}
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            amount: Number.isNaN(Number(event.target.value))
                              ? 0
                              : Number(event.target.value),
                          }))
                        }
                        step="0.01"
                        min="0"
                      />
                      <Input
                        label="Fecha"
                        type="date"
                        required
                        value={formData.date}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, date: event.target.value }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label
                          htmlFor="transaction-category-select"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Categoría
                        </label>
                        <select
                          id="transaction-category-select"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.category}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, category: event.target.value }))
                          }
                        >
                          <option value="">Seleccionar categoría</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="Referencia (opcional)"
                        value={formData.reference}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, reference: event.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="transaction-description-textarea"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Descripción
                      </label>
                      <textarea
                        id="transaction-description-textarea"
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        required
                        value={formData.description}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, description: event.target.value }))
                        }
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                      </Button>
                      <Button type="submit" variant="primary">
                        Registrar
                      </Button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

const isOfflineMessage = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes('sin conexión') || normalized.includes('almacenados localmente');
};

export function AccountsPage() {
  const {
    accounts,
    transactions,
    isLoading,
    error: storeError,
    loadAccounts,
    loadTransactions,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    updateTransactionAccount,
    transferBetweenAccounts,
    setError,
  } = useAccountsStore((state) => ({
    accounts: state.accounts,
    transactions: state.transactions,
    isLoading: state.isLoading,
    error: state.error,
    loadAccounts: state.loadAccounts,
    loadTransactions: state.loadTransactions,
    addAccount: state.addAccount,
    updateAccount: state.updateAccount,
    deleteAccount: state.deleteAccount,
    addTransaction: state.addTransaction,
    updateTransactionAccount: state.updateTransactionAccount,
    transferBetweenAccounts: state.transferBetweenAccounts,
    setError: state.setError,
  }));

  const hasRequestedInitialLoad = useRef(false);

  useEffect(() => {
    if (hasRequestedInitialLoad.current) {
      return;
    }

    hasRequestedInitialLoad.current = true;
    void loadAccounts();
    void loadTransactions();
  }, [loadAccounts, loadTransactions]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<'all' | string>('all');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountModalError, setAccountModalError] = useState<string | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string>('');
  const [isUpdatingTransactionAccount, setIsUpdatingTransactionAccount] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [dismissedLoaderError, setDismissedLoaderError] = useState(false);

  const { tableScrollRef, scrollLeft, scrollRight } = useTableScroll();

  useEffect(() => {
    if (!storeError) {
      return;
    }

    setFeedback({
      type: isOfflineMessage(storeError) ? 'warning' : 'error',
      message: storeError,
    });
  }, [storeError]);

  useEffect(() => {
    if (storeError) {
      setDismissedLoaderError(false);
    }
  }, [storeError]);

  const openAccountModal = (account?: Account) => {
    setError(null);
    setAccountModalError(null);
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
    setEditingAccount(undefined);
    setAccountModalError(null);
    setError(null);
  };

  const handleAccountSubmit = async (values: AccountFormValues) => {
    setIsSavingAccount(true);
    setAccountModalError(null);
    setError(null);

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, values);
      } else {
        await addAccount(values);
      }

      const latestError = useAccountsStore.getState().error;
      if (latestError) {
        if (isOfflineMessage(latestError)) {
          setFeedback({ type: 'warning', message: latestError });
          closeAccountModal();
        } else {
          setAccountModalError(latestError);
          setFeedback({ type: 'error', message: latestError });
        }
        return;
      }

      setFeedback({
        type: 'success',
        message: editingAccount ? 'Cuenta actualizada correctamente.' : 'Cuenta creada correctamente.',
      });
      closeAccountModal();
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    const target = accounts.find((account) => account.id === accountId);
    if (!target) {
      return;
    }

    const confirmed = window.confirm(`¿Seguro deseas eliminar la cuenta "${target.name}"?`);
    if (!confirmed) {
      return;
    }

    await deleteAccount(accountId);
    const latestError = useAccountsStore.getState().error;
    if (latestError) {
      setFeedback({
        type: isOfflineMessage(latestError) ? 'warning' : 'error',
        message: latestError,
      });
      return;
    }

    if (selectedAccountId === accountId) {
      setSelectedAccountId('all');
    }

    setFeedback({ type: 'success', message: `Cuenta "${target.name}" eliminada.` });
  };

  const handleTransactionSaved = (transaction: TransactionFormValues) => {
    addTransaction(transaction);
    setFeedback({ type: 'success', message: 'Transacción registrada correctamente.' });
  };

  const beginTransactionAccountEdit = (transaction: Transaction) => {
    setError(null);
    const fallbackAccountId = accounts.some((account) => account.id === transaction.accountId)
      ? transaction.accountId
      : accounts[0]?.id ?? '';
    setEditingTransactionId(transaction.id);
    setPendingAccountId(fallbackAccountId);
  };

  const cancelTransactionAccountEdit = () => {
    setEditingTransactionId(null);
    setPendingAccountId('');
    setIsUpdatingTransactionAccount(false);
    setError(null);
  };

  const handleTransactionAccountSelection = (accountId: string) => {
    setPendingAccountId(accountId);
  };

  const handleTransactionAccountSave = () => {
    if (!editingTransactionId || !pendingAccountId) {
      cancelTransactionAccountEdit();
      return;
    }

    const transaction = transactions.find((item) => item.id === editingTransactionId);

    if (!transaction) {
      cancelTransactionAccountEdit();
      return;
    }

    if (transaction.accountId === pendingAccountId) {
      setFeedback({
        type: 'warning',
        message: 'Seleccioná una cuenta diferente para modificar el movimiento.',
      });
      cancelTransactionAccountEdit();
      return;
    }

    setIsUpdatingTransactionAccount(true);
    setError(null);

    const success = updateTransactionAccount(editingTransactionId, pendingAccountId);
    const latestError = useAccountsStore.getState().error;

    if (!success || latestError) {
      const message = latestError ?? 'No se pudo actualizar la cuenta del movimiento.';
      setFeedback({
        type: isOfflineMessage(message) ? 'warning' : 'error',
        message,
      });
      setIsUpdatingTransactionAccount(false);
      return;
    }

    setFeedback({
      type: 'success',
      message: 'La cuenta del movimiento se actualizó correctamente.',
    });

    setIsUpdatingTransactionAccount(false);
    cancelTransactionAccountEdit();
  };

  const handleTransferCompleted = (transfer: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description: string;
    date: string;
    reference: string;
  }) => {
    setIsProcessingTransfer(true);
    setTransferError(null);
    setError(null);

    const success = transferBetweenAccounts(transfer);
    const latestError = useAccountsStore.getState().error;

    if (!success || latestError) {
      const message = latestError ?? 'No se pudo completar la transferencia.';
      setTransferError(message);
      setFeedback({
        type: isOfflineMessage(message) ? 'warning' : 'error',
        message,
      });
      setIsProcessingTransfer(false);
      return;
    }

    setFeedback({ type: 'success', message: 'Transferencia registrada correctamente.' });
    setIsTransferModalOpen(false);
    setIsProcessingTransfer(false);
  };

  const handleBulkImportComplete = (result: {
    success: TransactionFormValues[];
    errors: { row: number; message: string }[];
  }) => {
    if (result.success.length > 0) {
      const message = result.errors.length > 0
        ? `Se importaron ${result.success.length} transacciones. ${result.errors.length} filas tuvieron errores.`
        : `Se importaron ${result.success.length} transacciones correctamente.`;
      setFeedback({
        type: result.errors.length > 0 ? 'warning' : 'success',
        message,
      });
    } else if (result.errors.length > 0) {
      setFeedback({
        type: 'error',
        message: 'No se importaron transacciones. Revisa el CSV e inténtalo nuevamente.',
      });
    }
  };

  const filteredTransactions = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();

    return transactions.filter((transaction) => {
      if (selectedAccountId !== 'all' && transaction.accountId !== selectedAccountId) {
        return false;
      }

      if (!lowerSearch) {
        return true;
      }

      return (
        transaction.description.toLowerCase().includes(lowerSearch) ||
        (transaction.category ?? '').toLowerCase().includes(lowerSearch) ||
        (transaction.reference ?? '').toLowerCase().includes(lowerSearch)
      );
    });
  }, [transactions, searchTerm, selectedAccountId]);

  const sortedTransactions = useMemo(
    () =>
      [...filteredTransactions].sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) {
          return dateDiff;
        }
        return b.amount - a.amount;
      }),
    [filteredTransactions],
  );

  const accountLookup = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );

  const transactionsByAccount = useMemo(() => {
    const summary = new Map<string, { income: number; expense: number }>();

    accounts.forEach((account) => {
      summary.set(account.id, { income: 0, expense: 0 });
    });

    transactions.forEach((transaction) => {
      const entry = summary.get(transaction.accountId);
      if (!entry) {
        return;
      }

      if (transaction.type === 'income') {
        entry.income += transaction.amount;
      } else {
        entry.expense += transaction.amount;
      }
    });

    return summary;
  }, [accounts, transactions]);

  const totalBalance = useMemo(
    () =>
      accounts
        .filter((account) => account.active)
        .reduce((total, account) => total + convertToArs(account.balance, account.currency), 0),
    [accounts],
  );

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((total, transaction) => total + transaction.amount, 0),
    [transactions],
  );

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((total, transaction) => total + transaction.amount, 0),
    [transactions],
  );

  const activeAccountsCount = useMemo(
    () => accounts.filter((account) => account.active).length,
    [accounts],
  );

  const isBusy = isLoading;
  const banner = !dismissedLoaderError && storeError
    ? ({ type: 'error', message: storeError } satisfies FeedbackState)
    : feedback;

  const dismissBanner = () => {
    if (!banner) {
      return;
    }

    if (!dismissedLoaderError && storeError && banner.message === storeError) {
      setDismissedLoaderError(true);
    } else {
      setFeedback(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/40">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Gestión de cuentas</h1>
            <p className="text-sm text-gray-500">
              Administra bancos, cajas y movimientos financieros integrados con el sistema.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                void loadAccounts();
                void loadTransactions();
              }}
              disabled={isBusy}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Recargar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsTransactionModalOpen(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Transacción
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsTransferModalOpen(true)}
              icon={<ArrowLeftRight className="h-4 w-4" />}
            >
              Transferencia
            </Button>
            <Button variant="primary" onClick={() => openAccountModal()} icon={<Plus className="h-4 w-4" />}>
              Nueva cuenta
            </Button>
          </div>
        </div>

        {banner && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm shadow-sm ${
              banner.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : banner.type === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{banner.message}</span>
              <button
                type="button"
                onClick={dismissBanner}
                className="text-xs font-medium text-current/70 hover:text-current"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Balance total estimado (ARS)</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {formatCurrency(totalBalance, 'ARS')}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Ingresos acumulados</div>
            <div className="mt-2 text-2xl font-semibold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Egresos acumulados</div>
            <div className="mt-2 text-2xl font-semibold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Cuentas activas</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{activeAccountsCount}</div>
          </div>
        </div>

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cuentas</h2>
            <p className="text-sm text-gray-500">
              Información actualizada con balances, métodos de pago sugeridos y movimientos por cuenta.
            </p>
          </div>

          {isBusy && accounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
              Cargando cuentas...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => {
                const summary = transactionsByAccount.get(account.id) ?? { income: 0, expense: 0 };
                return (
                  <div
                    key={account.id}
                    className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition ${
                      account.active ? 'hover:border-blue-200 hover:shadow-md' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                        <p className="text-sm text-gray-500">{account.bankName}</p>
                      </div>
                      <StatusBadge variant={account.active ? 'success' : 'secondary'} dot>
                        {account.active ? 'Activa' : 'Inactiva'}
                      </StatusBadge>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Tipo</span>
                        <span className="font-medium text-gray-900">{account.accountType}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Número</span>
                        <span className="font-medium text-gray-900">{account.accountNumber}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Saldo</span>
                        <span className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(account.balance, account.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Ingresos</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(summary.income, account.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Egresos</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(summary.expense, account.currency)}
                        </span>
                      </div>
                    </div>

                    {account.description && (
                      <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
                        {account.description}
                      </p>
                    )}

                    <div className="mt-4 flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-blue-600 hover:text-blue-700"
                        onClick={() => openAccountModal(account)}
                      >
                        <span className="sr-only">Editar</span>
                        <Plus className="h-4 w-4 rotate-45" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-600 hover:text-red-700"
                        onClick={() => void handleDeleteAccount(account.id)}
                      >
                        <span className="sr-only">Eliminar</span>
                        <Plus className="h-4 w-4 rotate-45" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Movimientos</h2>
              <p className="text-sm text-gray-500">
                Consulta y filtra las transacciones registradas en el sistema.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-full md:w-64">
                <Input
                  placeholder="Buscar por descripción, categoría o referencia"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="space-y-1 text-sm text-gray-500 md:w-56">
                <label htmlFor="transaction-filter-account-select" className="block text-sm font-medium text-gray-700">
                  Filtrar por cuenta
                </label>
                <select
                  id="transaction-filter-account-select"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAccountId}
                  onChange={(event) => setSelectedAccountId(event.target.value)}
                >
                  <option value="all">Todas las cuentas</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Importar CSV:</span>
                <BulkTransactionImport type="income" onImportComplete={handleBulkImportComplete} />
                <BulkTransactionImport type="expense" onImportComplete={handleBulkImportComplete} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
              <p className="text-sm text-gray-500">
                {sortedTransactions.length} transacción{sortedTransactions.length === 1 ? '' : 'es'} mostrada{sortedTransactions.length === 1 ? '' : 's'}
              </p>
              <div className="hidden items-center gap-2 text-gray-400 md:flex">
                <button type="button" onClick={scrollLeft} className="rounded-md border border-gray-200 p-1 hover:text-gray-600">
                  &larr;
                </button>
                <button type="button" onClick={scrollRight} className="rounded-md border border-gray-200 p-1 hover:text-gray-600">
                  &rarr;
                </button>
              </div>
            </div>
            <div ref={tableScrollRef} className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Cuenta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Referencia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedTransactions.map((transaction) => {
                    const account = accountLookup.get(transaction.accountId);
                    const isEditing = editingTransactionId === transaction.id;
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50/80">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="max-w-xs px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium text-gray-900">{transaction.description}</div>
                          {transaction.linkedTo && (
                            <p className="text-xs text-gray-500">
                              Vinculado a {transaction.linkedTo.type} #{transaction.linkedTo.number}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {isEditing ? (
                            accounts.length > 0 ? (
                              <select
                                className="w-full min-w-[180px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={pendingAccountId}
                                onChange={(event) => handleTransactionAccountSelection(event.target.value)}
                                disabled={isUpdatingTransactionAccount}
                                aria-label="Seleccionar cuenta para el movimiento"
                              >
                                <option value="" disabled>
                                  Seleccioná una cuenta
                                </option>
                                {accounts.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.name} ({option.bankName})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm text-gray-400">No hay cuentas disponibles</span>
                            )
                          ) : account ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{account.name}</span>
                              <span className="text-xs text-gray-400">{account.bankName}</span>
                            </div>
                          ) : (
                            <span className="italic text-gray-400">Cuenta eliminada</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <StatusBadge variant={transaction.type === 'income' ? 'success' : 'danger'} dot>
                            {transaction.type === 'income' ? 'Ingreso' : 'Egreso'}
                          </StatusBadge>
                        </td>
                        <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount, account?.currency ?? 'ARS')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {transaction.category ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {transaction.reference ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="success"
                                size="xs"
                                onClick={handleTransactionAccountSave}
                                loading={isUpdatingTransactionAccount}
                                icon={<Check className="h-4 w-4" />}
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={cancelTransactionAccountEdit}
                                disabled={isUpdatingTransactionAccount}
                                icon={<X className="h-4 w-4" />}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={<Pencil className="h-4 w-4" />}
                              onClick={() => beginTransactionAccountEdit(transaction)}
                              disabled={
                                accounts.length === 0 ||
                                (editingTransactionId !== null && editingTransactionId !== transaction.id)
                              }
                            >
                              Editar cuenta
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {sortedTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                        No se encontraron transacciones con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={closeAccountModal}
        account={editingAccount}
        onSubmit={handleAccountSubmit}
        isSubmitting={isSavingAccount}
        errorMessage={accountModalError}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        accounts={accounts}
        onSubmit={handleTransactionSaved}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        closeModal={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        onTransferCompleted={handleTransferCompleted}
      />

      {transferError && isProcessingTransfer && (
        <div className="fixed inset-x-0 bottom-4 mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
          {transferError}
        </div>
      )}
    </div>
  );
}
