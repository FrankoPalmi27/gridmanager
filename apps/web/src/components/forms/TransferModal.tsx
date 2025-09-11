import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '../ui/Button';

interface Account {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  balance: number;
  currency: string;
  active: boolean;
}

interface TransferModalProps {
  isOpen: boolean;
  closeModal: () => void;
  accounts: Account[];
  onTransferCompleted: (transfer: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description: string;
    date: string;
    reference: string;
  }) => void;
}

export function TransferModal({ isOpen, closeModal, accounts, onTransferCompleted }: TransferModalProps) {
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    reference: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeAccounts = accounts.filter(acc => acc.active);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fromAccountId) {
      newErrors.fromAccountId = 'Selecciona la cuenta origen';
    }

    if (!formData.toAccountId) {
      newErrors.toAccountId = 'Selecciona la cuenta destino';
    }

    if (formData.fromAccountId === formData.toAccountId) {
      newErrors.toAccountId = 'La cuenta destino debe ser diferente a la origen';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    const fromAccount = activeAccounts.find(acc => acc.id === formData.fromAccountId);
    if (fromAccount && formData.amount > fromAccount.balance) {
      newErrors.amount = 'Saldo insuficiente en la cuenta origen';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onTransferCompleted({
      ...formData,
      reference: formData.reference || `TRANS-${Date.now()}`
    });

    // Reset form
    setFormData({
      fromAccountId: '',
      toAccountId: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      reference: ''
    });
    setErrors({});
    closeModal();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const fromAccount = activeAccounts.find(acc => acc.id === formData.fromAccountId);
  const toAccount = activeAccounts.find(acc => acc.id === formData.toAccountId);

  // Filter toAccount options to exclude the selected fromAccount
  const availableToAccounts = activeAccounts.filter(acc => acc.id !== formData.fromAccountId);

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
                  Transferir Entre Cuentas
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Cuenta Origen */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuenta Origen <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.fromAccountId}
                      onChange={(e) => {
                        handleInputChange('fromAccountId', e.target.value);
                        // Reset toAccount if it's the same as the new fromAccount
                        if (e.target.value === formData.toAccountId) {
                          handleInputChange('toAccountId', '');
                        }
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.fromAccountId ? 'border-red-300' : ''
                      }`}
                      required
                    >
                      <option value="">Selecciona cuenta origen</option>
                      {activeAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.bankName}) - {account.currency} {account.balance.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {errors.fromAccountId && (
                      <p className="mt-1 text-sm text-red-600">{errors.fromAccountId}</p>
                    )}
                  </div>

                  {/* Cuenta Destino */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuenta Destino <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.toAccountId}
                      onChange={(e) => handleInputChange('toAccountId', e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.toAccountId ? 'border-red-300' : ''
                      }`}
                      required
                      disabled={!formData.fromAccountId}
                    >
                      <option value="">Selecciona cuenta destino</option>
                      {availableToAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.bankName}) - {account.currency} {account.balance.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {errors.toAccountId && (
                      <p className="mt-1 text-sm text-red-600">{errors.toAccountId}</p>
                    )}
                  </div>

                  {/* Preview de cuentas seleccionadas */}
                  {fromAccount && toAccount && (
                    <div className="bg-blue-50 p-3 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium text-blue-900">Origen:</span>
                          <span className="text-blue-700 ml-1">{fromAccount.name}</span>
                        </div>
                        <div className="text-blue-600">
                          Saldo: {fromAccount.currency} {fromAccount.balance.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-center text-blue-600 my-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-blue-900">Destino:</span>
                          <span className="text-blue-700 ml-1">{toAccount.name}</span>
                        </div>
                        <div className="text-blue-600">
                          Saldo: {toAccount.currency} {toAccount.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Monto y Fecha */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.amount ? 'border-red-300' : ''
                        }`}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.description ? 'border-red-300' : ''
                      }`}
                      rows={2}
                      placeholder="Ej: Transferencia para gastos operativos"
                      required
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>

                  {/* Referencia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referencia (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => handleInputChange('reference', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: TRANS-001"
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      onClick={closeModal}
                      variant="secondary"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      Transferir
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