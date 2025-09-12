import React, { useState, useRef } from 'react';
import { Upload, Download, AlertTriangle, Check, X, FileText } from 'lucide-react';
import { useProductsStore, Product } from '../store/productsStore';

interface ProductData {
  name: string;
  category: string;
  brand: string;
  description?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  status?: 'active' | 'inactive';
}

interface ImportResult {
  success: ProductData[];
  errors: { row: number; message: string; data?: any }[];
  duplicates: { row: number; sku: string; name: string }[];
}

interface BulkProductImportProps {
  onImportComplete?: (result: ImportResult) => void;
}

const BulkProductImport: React.FC<BulkProductImportProps> = ({ onImportComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addBulkProducts, products } = useProductsStore();

  const csvTemplate = `name,category,brand,description,cost,price,stock,minStock,status
"Overgrip Pro Feel Amarillo","Accesorios","Diadem","Overgrip de alta calidad",7700,20000,25,5,"active"
"Raqueta Wilson Pro Open 100","Raquetas","Wilson","Raqueta profesional",168500,300000,3,2,"active"
"Pelotas Penn Tour x24","Pelotas","Penn","Pelotas de competición",8854,12000,50,20,"active"`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_productos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateProductData = (data: any, row: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!data.name?.trim()) errors.push('Nombre es requerido');
    if (!data.category?.trim()) errors.push('Categoría es requerida');
    if (!data.brand?.trim()) errors.push('Marca es requerida');
    
    const cost = parseFloat(data.cost);
    const price = parseFloat(data.price);
    const stock = parseInt(data.stock);
    const minStock = parseInt(data.minStock);
    
    if (isNaN(cost) || cost < 0) errors.push('Costo debe ser un número positivo');
    if (isNaN(price) || price < 0) errors.push('Precio debe ser un número positivo');
    if (isNaN(stock) || stock < 0) errors.push('Stock debe ser un número entero positivo');
    if (isNaN(minStock) || minStock < 0) errors.push('Stock mínimo debe ser un número entero positivo');
    
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
            const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
            
            const validation = validateProductData(row, rowNumber);
            if (!validation.isValid) {
              result.errors.push({
                row: rowNumber,
                message: validation.errors.join(', '),
                data: row
              });
              return;
            }
            
            // Check for duplicates by name
            const existingProduct = products.find(p => 
              p.name.toLowerCase() === row.name.toLowerCase().trim()
            );
            
            if (existingProduct) {
              result.duplicates.push({
                row: rowNumber,
                sku: existingProduct.sku,
                name: existingProduct.name
              });
              return;
            }
            
            // Check for duplicates within the CSV
            const duplicateInBatch = result.success.find(p => 
              p.name.toLowerCase() === row.name.toLowerCase().trim()
            );
            
            if (duplicateInBatch) {
              result.duplicates.push({
                row: rowNumber,
                sku: 'Duplicado en CSV',
                name: row.name.trim()
              });
              return;
            }
            
            const newProductData = {
              name: row.name.trim(),
              category: row.category.trim(),
              brand: row.brand.trim(),
              description: row.description?.trim() || '',
              cost: parseFloat(row.cost),
              price: parseFloat(row.price),
              stock: parseInt(row.stock),
              minStock: parseInt(row.minStock),
              status: (row.status?.trim() as 'active' | 'inactive') || 'active'
            };
            
            result.success.push(newProductData);
          });
          
          resolve(result);
        } catch (error) {
          resolve({
            success: [],
            errors: [{ row: 0, message: `Error al procesar CSV: ${error}` }],
            duplicates: []
          });
        }
      };
      
      reader.readAsText(file, 'utf-8');
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Por favor, seleccione un archivo CSV válido.');
      return;
    }
    
    setIsProcessing(true);
    setImportResult(null);
    
    try {
      const result = await processCSV(file);
      
      // If there are successful products, add them to the store
      if (result.success.length > 0) {
        addBulkProducts(result.success);
      }
      
      setImportResult(result);
      setShowModal(true);
      onImportComplete?.(result);
    } catch (error) {
      alert(`Error al procesar el archivo: ${error}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const ResultModal = () => {
    if (!showModal || !importResult) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Resultado de Importación</h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-green-600">Exitosos</p>
                  <p className="text-2xl font-bold text-green-900">{importResult.success.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <X className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <p className="text-sm text-red-600">Errores</p>
                  <p className="text-2xl font-bold text-red-900">{importResult.errors.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm text-yellow-600">Duplicados</p>
                  <p className="text-2xl font-bold text-yellow-900">{importResult.duplicates.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Success List */}
          {importResult.success.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-green-900 mb-2">✅ Productos Importados Exitosamente</h3>
              <div className="bg-green-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                {importResult.success.map((product, index) => (
                  <div key={index} className="text-sm text-green-800 py-1">
                    {product.name} - {product.brand}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Duplicates List */}
          {importResult.duplicates.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Productos Duplicados (No Importados)</h3>
              <div className="bg-yellow-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                {importResult.duplicates.map((duplicate, index) => (
                  <div key={index} className="text-sm text-yellow-800 py-1">
                    Fila {duplicate.row}: {duplicate.name} (Ya existe: {duplicate.sku})
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Errors List */}
          {importResult.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-red-900 mb-2">❌ Errores de Validación</h3>
              <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                {importResult.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-800 py-1 border-b border-red-100 last:border-b-0">
                    <strong>Fila {error.row}:</strong> {error.message}
                    {error.data && (
                      <div className="text-xs text-red-600 mt-1 pl-2">
                        {error.data.name && `Producto: ${error.data.name}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Importación Masiva de Productos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Sube un archivo CSV para importar múltiples productos de una vez
            </p>
          </div>
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        
        <div className="space-y-4">
          {/* Download Template Button */}
          <div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla CSV
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Descarga la plantilla para ver el formato requerido
            </p>
          </div>
          
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className={`
                w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${isProcessing 
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                  : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                }
              `}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 ${isProcessing ? 'text-gray-400' : 'text-blue-600'}`} />
              <p className={`font-medium ${isProcessing ? 'text-gray-500' : 'text-blue-700'}`}>
                {isProcessing ? 'Procesando archivo...' : 'Haz clic para seleccionar archivo CSV'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isProcessing ? 'Validando productos...' : 'O arrastra y suelta tu archivo aquí'}
              </p>
            </button>
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📋 Instrucciones:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• El archivo debe ser formato CSV con codificación UTF-8</li>
              <li>• Columnas requeridas: name, category, brand, cost, price, stock, minStock</li>
              <li>• Columnas opcionales: description, status (active/inactive)</li>
              <li>• Los productos duplicados por nombre serán omitidos</li>
              <li>• Descarga la plantilla para ver el formato exacto</li>
            </ul>
          </div>
        </div>
      </div>
      
      <ResultModal />
    </>
  );
};

export default BulkProductImport;