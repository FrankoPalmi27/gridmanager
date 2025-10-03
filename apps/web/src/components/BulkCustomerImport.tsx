import React, { useState, useRef } from 'react';
import { Upload, Download, AlertTriangle, Check, X } from 'lucide-react';
import { useCustomersStore } from '../store/customersStore';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  balance?: number;
  status?: 'active' | 'inactive';
}

interface ImportResult {
  success: CustomerData[];
  errors: { row: number; message: string; data?: any }[];
  duplicates: { row: number; name: string; email: string }[];
}

interface BulkCustomerImportProps {
  onImportComplete?: (result: ImportResult) => void;
}

const BulkCustomerImport: React.FC<BulkCustomerImportProps> = ({ onImportComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { customers, addCustomer } = useCustomersStore();

  const csvTemplate = `name,email,phone,address,notes,balance,status
"Juan Pérez","juan.perez@email.com","011-1234-5678","Av. Corrientes 1234, CABA","Cliente VIP",0,"active"
"María González","maria.gonzalez@email.com","011-8765-4321","San Martín 567, CABA","",0,"active"
"Carlos Rodríguez","carlos.rodriguez@email.com","011-5555-1234","Belgrano 890, CABA","Cliente frecuente",-5000,"active"`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_clientes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateCustomerData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.name?.trim()) errors.push('Nombre es requerido');
    if (!data.email?.trim()) errors.push('Email es requerido');
    if (data.email && !data.email.includes('@')) errors.push('Email inválido');
    if (!data.phone?.trim()) errors.push('Teléfono es requerido');

    const balance = parseFloat(data.balance || 0);
    if (isNaN(balance)) errors.push('Balance debe ser un número');

    if (data.status && !['active', 'inactive'].includes(data.status)) {
      errors.push('Estado debe ser "active" o "inactive"');
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
            errors: [],
            duplicates: []
          };

          parsedData.forEach((row, index) => {
            const rowNumber = index + 2;

            const validation = validateCustomerData(row);
            if (!validation.isValid) {
              result.errors.push({
                row: rowNumber,
                message: validation.errors.join(', '),
                data: row
              });
              return;
            }

            const existingCustomer = customers.find(c =>
              c.email.toLowerCase() === row.email.toLowerCase().trim()
            );

            if (existingCustomer) {
              result.duplicates.push({
                row: rowNumber,
                name: existingCustomer.name,
                email: existingCustomer.email
              });
              return;
            }

            const customerData: CustomerData = {
              name: row.name.trim(),
              email: row.email.trim().toLowerCase(),
              phone: row.phone.trim(),
              address: row.address?.trim() || '',
              notes: row.notes?.trim() || '',
              balance: parseFloat(row.balance || 0),
              status: (row.status || 'active') as 'active' | 'inactive'
            };

            result.success.push(customerData);
          });

          resolve(result);
        } catch (error) {
          resolve({
            success: [],
            errors: [{ row: 0, message: 'Error al procesar el archivo CSV' }],
            duplicates: []
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

    importResult.success.forEach(customerData => {
      addCustomer({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address || '',
        notes: customerData.notes || '',
        balance: customerData.balance || 0,
        status: customerData.status || 'active'
      });
    });

    if (onImportComplete) {
      onImportComplete(importResult);
    }

    setShowModal(false);
    setImportResult(null);

    alert(`✅ ${importResult.success.length} clientes importados exitosamente`);
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Descargar Template</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
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
                Importar Clientes desde CSV
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
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700 mb-1">
                        <Check className="w-5 h-5" />
                        <span className="font-semibold">Exitosos</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{importResult.success.length}</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-700 mb-1">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold">Duplicados</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-900">{importResult.duplicates.length}</p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-700 mb-1">
                        <X className="w-5 h-5" />
                        <span className="font-semibold">Errores</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900">{importResult.errors.length}</p>
                    </div>
                  </div>

                  {importResult.duplicates.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Clientes Duplicados (omitidos)
                      </h3>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {importResult.duplicates.slice(0, 5).map((dup, idx) => (
                          <li key={idx}>
                            Fila {dup.row}: {dup.name} ({dup.email})
                          </li>
                        ))}
                        {importResult.duplicates.length > 5 && (
                          <li className="text-yellow-600">
                            ... y {importResult.duplicates.length - 5} más
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <X className="w-4 h-4" />
                        Errores de Validación
                      </h3>
                      <ul className="text-sm text-red-800 space-y-1">
                        {importResult.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx}>
                            Fila {err.row}: {err.message}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li className="text-red-600">
                            ... y {importResult.errors.length - 5} más
                          </li>
                        )}
                      </ul>
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
                Importar {importResult?.success.length || 0} Clientes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkCustomerImport;
