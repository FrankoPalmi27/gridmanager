import { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../lib/localStorage';
import { useAccountsStore } from './accountsStore';
import { useProductsStore } from './productsStore';
import { useSystemConfigStore } from './systemConfigStore';

// Tipo para las ventas
export interface Sale {
  id: number;
  number: string;
  client: {
    name: string;
    email: string;
    avatar: string;
  };
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  items: number;
  seller?: {
    name: string;
    initials: string;
  };
  sparkline?: number[];
  // Nuevos campos para canal de venta y estado de pago
  salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
  paymentStatus?: 'paid' | 'pending' | 'partial';
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
  accountId?: string; // ID de la cuenta donde se registró el pago
  // Nuevos campos de tracking de pagos
  cobrado: number; // Monto cobrado
  aCobrar: number; // Monto pendiente de cobro
  // Integración con inventario
  productId?: string; // ID del producto vendido
  productName?: string; // Nombre del producto para referencia
}

// Estado inicial del dashboard - LIMPIO
export const initialDashboardStats = {
  totalSales: 0,
  totalTransactions: 0,
  averagePerDay: 0,
  monthlyGrowth: 0
};


// Hook personalizado para manejar las ventas
export const useSalesStore = () => {
  const [dashboardStats, setDashboardStats] = useState(() => 
    loadFromStorage(STORAGE_KEYS.DASHBOARD_STATS, initialDashboardStats)
  );
  const [sales, setSales] = useState<Sale[]>(() => 
    loadFromStorage(STORAGE_KEYS.SALES, [])
  );
  
  // Hook para manejar transacciones enlazadas
  const { addLinkedTransaction, removeLinkedTransactions } = useAccountsStore();
  
  // Hook para manejar inventario
  const { products, updateStockWithMovement, getProductById } = useProductsStore();

  // Hook para configuración del sistema
  const { isNegativeStockAllowed } = useSystemConfigStore();

  // Save to localStorage whenever sales or stats change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SALES, sales);
  }, [sales]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DASHBOARD_STATS, dashboardStats);
  }, [dashboardStats]);

  // ✅ FUNCIÓN DE VALIDACIÓN DE STOCK MEJORADA
  const validateStock = (productId: string, quantity: number): {
    valid: boolean;
    message?: string;
    currentStock?: number;
    allowNegative?: boolean;
    severity?: 'error' | 'warning' | 'info';
  } => {
    const product = getProductById(productId);
    if (!product) {
      return {
        valid: false,
        message: 'Producto no encontrado',
        severity: 'error'
      };
    }

    const negativeStockAllowed = isNegativeStockAllowed();
    const stockDifference = product.stock - quantity;

    // Si hay stock suficiente, todo OK
    if (stockDifference >= 0) {
      return {
        valid: true,
        currentStock: product.stock,
        severity: 'info'
      };
    }

    // Si NO hay stock suficiente
    if (!negativeStockAllowed) {
      // Configuración NO permite stock negativo - BLOQUEAR
      return {
        valid: false,
        message: `❌ STOCK INSUFICIENTE\n\nDisponible: ${product.stock}\nSolicitado: ${quantity}\nFaltante: ${Math.abs(stockDifference)}\n\n⚙️ El sistema está configurado para NO permitir stock negativo.`,
        currentStock: product.stock,
        allowNegative: false,
        severity: 'error'
      };
    } else {
      // Configuración SÍ permite stock negativo - PERMITIR CON WARNING
      return {
        valid: true,
        message: `⚠️ STOCK NEGATIVO DETECTADO\n\nDisponible: ${product.stock}\nSolicitado: ${quantity}\nStock resultante: ${stockDifference}\n\n✅ El sistema permite stock negativo. La venta se procesará normalmente.`,
        currentStock: product.stock,
        allowNegative: true,
        severity: 'warning'
      };
    }
  };

  const addSale = (saleData: {
    client: string;
    product: string;
    productId: string; // Nuevo campo requerido
    quantity: number;
    price: number;
    salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
    paymentStatus?: 'paid' | 'pending' | 'partial';
    paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
    accountId?: string;
  }) => {
    // ✅ VALIDACIÓN CRÍTICA DE STOCK MEJORADA
    const stockValidation = validateStock(saleData.productId, saleData.quantity);

    // Log de auditoría para todas las validaciones de stock
    console.log('Stock validation result:', {
      productId: saleData.productId,
      quantity: saleData.quantity,
      validation: stockValidation,
      timestamp: new Date().toISOString()
    });

    if (!stockValidation.valid) {
      // Stock insuficiente y NO permitido stock negativo
      throw new Error(stockValidation.message || 'Stock insuficiente');
    }

    // Generate client avatar (initials)
    const generateAvatar = (name: string) => {
      return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
    };
    
    const totalAmount = saleData.quantity * saleData.price;
    const newSale: Sale = {
      id: Date.now(),
      number: `VTA-2024-${String(sales.length + 1).padStart(3, '0')}`,
      client: {
        name: saleData.client,
        email: `${saleData.client.toLowerCase().replace(' ', '.')}@email.com`,
        avatar: generateAvatar(saleData.client)
      },
      amount: totalAmount,
      date: new Date().toISOString().split('T')[0],
      status: saleData.paymentStatus === 'paid' ? 'completed' : 'pending',
      items: saleData.quantity,
      seller: {
        name: 'Usuario Actual',
        initials: 'UA'
      },
      sparkline: [50, 80, 120, 150, totalAmount / 100],
      // Nuevos campos
      salesChannel: saleData.salesChannel || 'store',
      paymentStatus: saleData.paymentStatus || 'pending',
      paymentMethod: saleData.paymentMethod || 'cash',
      accountId: saleData.accountId,
      // Inicializar campos de tracking de pagos
      cobrado: saleData.paymentStatus === 'paid' ? totalAmount : 0,
      aCobrar: saleData.paymentStatus === 'paid' ? 0 : totalAmount,
      // Integración con inventario
      productId: saleData.productId,
      productName: saleData.product
    };

    // Agregar la nueva venta
    setSales(prev => [newSale, ...prev]);

    // 🔥 ACTUALIZACIÓN AUTOMÁTICA DE INVENTARIO
    try {
      updateStockWithMovement(
        saleData.productId,
        stockValidation.currentStock! - saleData.quantity,
        `Venta ${newSale.number} - Cliente: ${saleData.client}`,
        newSale.number
      );
    } catch (error) {
      // Si falla la actualización de stock, revertir la venta
      setSales(prev => prev.filter(sale => sale.id !== newSale.id));
      throw new Error(`Error actualizando inventario: ${error}`);
    }

    // Actualizar estadísticas del dashboard
    setDashboardStats(prev => ({
      totalSales: prev.totalSales + newSale.amount,
      totalTransactions: prev.totalTransactions + 1,
      averagePerDay: Math.round((prev.totalSales + newSale.amount) / 30),
      monthlyGrowth: prev.monthlyGrowth + 0.1 // Pequeño incremento
    }));

    // Si el pago está marcado como pagado y se especificó una cuenta, crear transacción enlazada
    if (saleData.paymentStatus === 'paid' && saleData.accountId) {
      addLinkedTransaction(
        saleData.accountId, 
        newSale.amount, 
        `Venta ${newSale.number} - ${saleData.client}`,
        {
          type: 'sale',
          id: newSale.id.toString(),
          number: newSale.number
        }
      );
    }

    return newSale;
  };

  const updateDashboardStats = (newStats: Partial<typeof initialDashboardStats>) => {
    setDashboardStats(prev => ({ ...prev, ...newStats }));
  };

  const updateSaleStatus = (saleId: number, newStatus: 'completed' | 'pending' | 'cancelled') => {
    setSales(prevSales => 
      prevSales.map(sale => 
        sale.id === saleId 
          ? { ...sale, status: newStatus }
          : sale
      )
    );
  };

  const deleteSale = (saleId: number) => {
    setSales(prevSales => {
      const saleToDelete = prevSales.find(sale => sale.id === saleId);
      if (saleToDelete) {
        // Actualizar estadísticas del dashboard
        setDashboardStats(prev => ({
          totalSales: prev.totalSales - saleToDelete.amount,
          totalTransactions: prev.totalTransactions - 1,
          averagePerDay: Math.round((prev.totalSales - saleToDelete.amount) / 30),
          monthlyGrowth: prev.monthlyGrowth
        }));

        // 🔥 REVERSIÓN AUTOMÁTICA DE INVENTARIO  
        if (saleToDelete.productId) {
          try {
            const currentProduct = getProductById(saleToDelete.productId);
            if (currentProduct) {
              updateStockWithMovement(
                saleToDelete.productId,
                currentProduct.stock + saleToDelete.items, // Restaurar stock
                `Eliminación venta ${saleToDelete.number} - Cliente: ${saleToDelete.client.name}`,
                `CANCEL-${saleToDelete.number}`
              );
            }
          } catch (error) {
            console.error('Error revirtiendo stock al eliminar venta:', error);
            // Continuar con eliminación aunque falle la reversión de stock
          }
        }

        // Si la venta tenía pagos registrados, eliminar transacciones enlazadas
        if (saleToDelete.paymentStatus === 'paid' && saleToDelete.accountId) {
          removeLinkedTransactions('sale', saleToDelete.id.toString());
        }
      }
      
      return prevSales.filter(sale => sale.id !== saleId);
    });
  };

  const updateSale = (saleId: number, updatedData: {
    client: string;
    product: string;
    quantity: number;
    price: number;
    salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
    paymentStatus?: 'paid' | 'pending' | 'partial';
    paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
    accountId?: string;
  }) => {
    setSales(prevSales => {
      return prevSales.map(sale => {
        if (sale.id === saleId) {
          // Generate client avatar (initials)
          const generateAvatar = (name: string) => {
            return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
          };

          const originalAmount = sale.amount;
          const newAmount = updatedData.quantity * updatedData.price;
          const amountDifference = newAmount - originalAmount;

          // Update dashboard stats
          setDashboardStats(prev => ({
            totalSales: prev.totalSales + amountDifference,
            totalTransactions: prev.totalTransactions, // Keep same transaction count
            averagePerDay: Math.round((prev.totalSales + amountDifference) / 30),
            monthlyGrowth: prev.monthlyGrowth
          }));

          // Handle account balance updates if payment status changes
          if (sale.paymentStatus === 'paid' && sale.accountId) {
            // Remove previous linked transactions
            removeLinkedTransactions('sale', sale.id.toString());
          }

          // Add new linked transaction if marked as paid
          if (updatedData.paymentStatus === 'paid' && updatedData.accountId) {
            addLinkedTransaction(
              updatedData.accountId, 
              newAmount, 
              `Venta ${sale.number} - ${updatedData.client}`,
              {
                type: 'sale',
                id: sale.id.toString(),
                number: sale.number
              }
            );
          }

          return {
            ...sale,
            client: {
              name: updatedData.client,
              email: `${updatedData.client.toLowerCase().replace(' ', '.')}@email.com`,
              avatar: generateAvatar(updatedData.client)
            },
            amount: newAmount,
            items: updatedData.quantity,
            status: updatedData.paymentStatus === 'paid' ? 'completed' : 'pending',
            salesChannel: updatedData.salesChannel || sale.salesChannel,
            paymentStatus: updatedData.paymentStatus || sale.paymentStatus,
            paymentMethod: updatedData.paymentMethod || sale.paymentMethod,
            accountId: updatedData.accountId,
            // Actualizar campos de tracking de pagos
            cobrado: updatedData.paymentStatus === 'paid' ? newAmount : (sale.cobrado || 0),
            aCobrar: updatedData.paymentStatus === 'paid' ? 0 : newAmount - (sale.cobrado || 0)
          };
        }
        return sale;
      });
    });
  };

  return {
    dashboardStats,
    sales,
    addSale,
    updateSale,
    updateSaleStatus,
    deleteSale,
    updateDashboardStats,
    setSales,
    validateStock // Exponer función de validación
  };
};