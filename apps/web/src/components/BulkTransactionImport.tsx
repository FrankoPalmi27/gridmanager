import React, { useState, useRef } from 'react';
import { Upload, Download, AlertTriangle, Check, X } from 'lucide-react';
import { useAccountsStore, Transaction } from '../store/accountsStore';

interface TransactionData {
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category?: string;
  reference?: string;
}

interface ImportResult {
  success: TransactionData[];
  errors: { row: number; message: string; data?: any }[];
}

interface BulkTransactionImportProps {
  type: 'income' | 'expense';
  onImportComplete?: (result: ImportResult) => void;
}

const BulkTransactionImport: React.FC<BulkTransactionImportProps> = ({ type, onImportComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { accounts, addTransaction } = useAccountsStore();

  const incomeTemplate = `accountId,amount,description,date,category,reference
"1",50000,"Venta de productos","2024-01-15","Ventas","VTA-001"
"2",120000,"Pago de cliente","2024-01-16","Servicios","FAC-123"
"1",75000,"Ingreso por comisión","2024-01-17","Comisiones",""`;

  const expenseTemplate = `accountId,amount,description,date,category,reference
"1",15000,"Pago de servicios","2024-01-15","Servicios","SRV-001"
"2",45000,"Compra de insumos","2024-01-16","Proveedores","COM-456"
"1",8000,"Gastos operativos","2024-01-17","Gastos Operativos",""`;

  const csvTemplate = type === 'income' ? incomeTemplate : expenseTemplate;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `template_${type === 'income' ? 'ingresos' : 'egresos'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateTransactionData = (data: any, row: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.accountId?.trim()) errors.push('ID de cuenta es requerido');

    const account = accounts.find(a => a.id === data.accountId?.trim());
    if (!account) errors.push(`Cuenta con ID "${data.accountId}" no existe`);

    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount) || amount <= 0) {
      errors.push('Monto debe ser un número mayor a 0');
    }

    if (!data.description?.trim()) errors.push('Descripción es requerida');

    // Validate date format (YYYY-MM-DD)
    if (!data.date?.trim()) {
      errors.push('Fecha es requerida');
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date.trim())) {
        errors.push('Fecha debe estar en formato YYYY-MM-DD');
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      const line = lines[i];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.replace(/"/g, '') || '';
        });
        data.push(row);
      }
    }

    return data;
  };

  const processCSV = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const parsedData = parseCSV(csvText);

          const result: ImportResult = {
            success: [],
            errors: []
          };

          parsedData.forEach((row, index) => {
            const rowNumber = index + 2;

            const validation = validateTransactionData(row, rowNumber);
            if (!validation.isValid) {
              result.errors.push({
                row: rowNumber,
                message: validation.errors.join(', '),
                data: row
              });
              return;
            }

            const transactionData: TransactionData = {
              accountId: row.accountId.trim(),
              type: type,
              amount: parseFloat(row.amount),
              description: row.description.trim(),
              date: row.date.trim(),
              category: row.category?.trim() || '',
              reference: row.reference?.trim() || ''
            };

            result.success.push(transactionData);
          });

          resolve(result);
        } catch (error) {
          resolve({
            success: [],
            errors: [{ row: 0, message: 'Error al procesar el archivo CSV' }]
          });
        }
      };

      reader.readAsText(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Por favor selecciona un archivo CSV');
      return;
    }

    setIsProcessing(true);
    setShowModal(true);

    const result = await processCSV(file);
    setImportResult(result);
    setIsProcessing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!importResult || importResult.success.length === 0) return;

    importResult.success.forEach(transactionData => {
      addTransaction({
        accountId: transactionData.accountId,
        type: transactionData.type,
        amount: transactionData.amount,
        description: transactionData.description,
        date: transactionData.date,
        category: transactionData.category || '',
        reference: transactionData.reference || ''
      });
    });

    if (onImportComplete) {
      onImportComplete(importResult);
    }

    setShowModal(false);
    setImportResult(null);

    alert(`✅ ${importResult.success.length} ${type === 'income' ? 'ingresos' : 'egresos'} importados exitosamente`);
  };

  const handleCancel = () => {
    setShowModal(false);
    setImportResult(null);
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          <span>Template</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Importar CSV</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Importar {type === 'income' ? 'Ingresos' : 'Egresos'} desde CSV
              </h2>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {isProcessing ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-4 text-gray-600">Procesando archivo...</span>
                </div>
              ) : importResult && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700 mb-1">
                        <Check className="w-5 h-5" />
                        <span className="font-semibold">Exitosos</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{importResult.success.length}</p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-700 mb-1">
                        <X className="w-5 h-5" />
                        <span className="font-semibold">Errores</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900">{importResult.errors.length}</p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <X className="w-4 h-4" />
                        Errores de Validación
                      </h3>
                      <ul className="text-sm text-red-800 space-y-1 max-h-60 overflow-y-auto">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>
                            Fila {err.row}: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {importResult.success.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Vista Previa de Transacciones
                      </h3>
                      <div className="text-sm text-blue-800 space-y-1 max-h-60 overflow-y-auto">
                        {importResult.success.slice(0, 5).map((tx, idx) => {
                          const account = accounts.find(a => a.id === tx.accountId);
                          return (
                            <div key={idx} className="flex justify-between py-1 border-b border-blue-100">
                              <span>{tx.description}</span>
                              <span className="font-medium">${tx.amount.toLocaleString()} - {account?.name}</span>
                            </div>
                          );
                        })}
                        {importResult.success.length > 5 && (
                          <p className="text-blue-600 pt-2">
                            ... y {importResult.success.length - 5} más
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!importResult || importResult.success.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Importar {importResult?.success.length || 0} Transacciones
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkTransactionImport;
