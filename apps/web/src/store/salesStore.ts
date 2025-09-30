import { create } from 'zustand';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../lib/localStorage';
import { useAccountsStore } from './accountsStore';
import { useProductsStore } from './productsStore';
import { useSystemConfigStore } from './systemConfigStore';
import { useCustomersStore } from './customersStore';

// ============================================
// TYPES & INTERFACES
// ============================================

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
  // Sales channel and payment info
  salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
  paymentStatus?: 'paid' | 'pending' | 'partial';
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
  accountId?: string; // ID de la cuenta donde se registró el pago
  // Payment tracking
  cobrado: number; // Monto cobrado
  aCobrar: number; // Monto pendiente de cobro
  // Inventory integration
  productId?: string; // ID del producto vendido
  productName?: string; // Nombre del producto para referencia
}

export interface DashboardStats {
  totalSales: number;
  totalTransactions: number;
  averagePerDay: number;
  monthlyGrowth: number;
}

interface StockValidationResult {
  valid: boolean;
  message?: string;
  currentStock?: number;
  allowNegative?: boolean;
  severity?: 'error' | 'warning' | 'info';
}

interface AddSaleData {
  client: string;
  product: string;
  productId: string;
  quantity: number;
  price: number;
  salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
  paymentStatus?: 'paid' | 'pending' | 'partial';
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
  accountId?: string;
}

interface UpdateSaleData {
  client: string;
  product: string;
  quantity: number;
  price: number;
  salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
  paymentStatus?: 'paid' | 'pending' | 'partial';
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
  accountId?: string;
}

interface SalesStore {
  // State
  sales: Sale[];
  dashboardStats: DashboardStats;

  // Actions
  addSale: (saleData: AddSaleData) => Sale;
  updateSale: (saleId: number, updatedData: UpdateSaleData) => void;
  updateSaleStatus: (saleId: number, newStatus: 'completed' | 'pending' | 'cancelled') => void;
  deleteSale: (saleId: number) => void;
  updateDashboardStats: (newStats: Partial<DashboardStats>) => void;
  setSales: (sales: Sale[]) => void;
  validateStock: (productId: string, quantity: number) => StockValidationResult;
}

// ============================================
// INITIAL STATE
// ============================================

const initialDashboardStats: DashboardStats = {
  totalSales: 0,
  totalTransactions: 0,
  averagePerDay: 0,
  monthlyGrowth: 0
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateAvatar = (name: string): string => {
  return name
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase();
};

// ============================================
// ZUSTAND STORE
// ============================================

export const useSalesStore = create<SalesStore>((set, get) => ({
  // ============================================
  // INITIAL STATE
  // ============================================

  sales: loadFromStorage(STORAGE_KEYS.SALES, []),
  dashboardStats: loadFromStorage(STORAGE_KEYS.DASHBOARD_STATS, initialDashboardStats),

  // ============================================
  // STOCK VALIDATION
  // ============================================

  validateStock: (productId: string, quantity: number): StockValidationResult => {
    const { getProductById } = useProductsStore.getState();
    const { isNegativeStockAllowed } = useSystemConfigStore.getState();

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
  },

  // ============================================
  // ADD SALE
  // ============================================

  addSale: (saleData: AddSaleData) => {
    const { validateStock } = get();
    const { updateStockWithMovement } = useProductsStore.getState();
    const { addLinkedTransaction } = useAccountsStore.getState();
    const { getCustomerByName, updateCustomerBalance } = useCustomersStore.getState();

    // ✅ VALIDACIÓN CRÍTICA DE STOCK
    const stockValidation = validateStock(saleData.productId, saleData.quantity);

    // Log de auditoría
    console.log('Stock validation result:', {
      productId: saleData.productId,
      quantity: saleData.quantity,
      validation: stockValidation,
      timestamp: new Date().toISOString()
    });

    if (!stockValidation.valid) {
      throw new Error(stockValidation.message || 'Stock insuficiente');
    }

    const state = get();
    const totalAmount = saleData.quantity * saleData.price;

    const newSale: Sale = {
      id: Date.now(),
      number: `VTA-2024-${String(state.sales.length + 1).padStart(3, '0')}`,
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
      salesChannel: saleData.salesChannel || 'store',
      paymentStatus: saleData.paymentStatus || 'pending',
      paymentMethod: saleData.paymentMethod || 'cash',
      accountId: saleData.accountId,
      cobrado: saleData.paymentStatus === 'paid' ? totalAmount : 0,
      aCobrar: saleData.paymentStatus === 'paid' ? 0 : totalAmount,
      productId: saleData.productId,
      productName: saleData.product
    };

    // 🔥 ACTUALIZACIÓN AUTOMÁTICA DE INVENTARIO
    try {
      updateStockWithMovement(
        saleData.productId,
        stockValidation.currentStock! - saleData.quantity,
        `Venta ${newSale.number} - Cliente: ${saleData.client}`,
        newSale.number
      );
    } catch (error) {
      throw new Error(`Error actualizando inventario: ${error}`);
    }

    // Actualizar state con nueva venta y stats
    set((state) => {
      const newSales = [newSale, ...state.sales];
      const newStats = {
        totalSales: state.dashboardStats.totalSales + newSale.amount,
        totalTransactions: state.dashboardStats.totalTransactions + 1,
        averagePerDay: Math.round((state.dashboardStats.totalSales + newSale.amount) / 30),
        monthlyGrowth: state.dashboardStats.monthlyGrowth + 0.1
      };

      saveToStorage(STORAGE_KEYS.SALES, newSales);
      saveToStorage(STORAGE_KEYS.DASHBOARD_STATS, newStats);

      return {
        sales: newSales,
        dashboardStats: newStats
      };
    });

    // 🔥 INTEGRACIÓN: Actualizar balance del cliente (cuenta corriente)
    try {
      const customer = getCustomerByName(saleData.client);
      if (customer) {
        // Si la venta está pendiente o parcial, aumenta la deuda del cliente (balance negativo)
        if (saleData.paymentStatus === 'pending' || saleData.paymentStatus === 'partial') {
          updateCustomerBalance(customer.id, -totalAmount); // Balance negativo = debe al negocio
        }
        // Si está pagado, no afecta el balance (ya fue cobrado)
      }
    } catch (error) {
      console.error('Error actualizando balance de cliente:', error);
      // No lanzar error para no bloquear la venta
    }

    // Si el pago está marcado como pagado, crear transacción enlazada
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
  },

  // ============================================
  // UPDATE SALE
  // ============================================

  updateSale: (saleId: number, updatedData: UpdateSaleData) => {
    const { addLinkedTransaction, removeLinkedTransactions } = useAccountsStore.getState();

    set((state) => {
      const newSales = state.sales.map(sale => {
        if (sale.id !== saleId) return sale;

        const originalAmount = sale.amount;
        const newAmount = updatedData.quantity * updatedData.price;
        const amountDifference = newAmount - originalAmount;

        // Handle account balance updates if payment status changes
        if (sale.paymentStatus === 'paid' && sale.accountId) {
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

        // Update dashboard stats
        const newStats = {
          totalSales: state.dashboardStats.totalSales + amountDifference,
          totalTransactions: state.dashboardStats.totalTransactions,
          averagePerDay: Math.round((state.dashboardStats.totalSales + amountDifference) / 30),
          monthlyGrowth: state.dashboardStats.monthlyGrowth
        };
        saveToStorage(STORAGE_KEYS.DASHBOARD_STATS, newStats);

        return {
          ...sale,
          client: {
            name: updatedData.client,
            email: `${updatedData.client.toLowerCase().replace(' ', '.')}@email.com`,
            avatar: generateAvatar(updatedData.client)
          },
          amount: newAmount,
          items: updatedData.quantity,
          status: (updatedData.paymentStatus === 'paid' ? 'completed' : 'pending') as 'completed' | 'pending' | 'cancelled',
          salesChannel: updatedData.salesChannel || sale.salesChannel,
          paymentStatus: updatedData.paymentStatus || sale.paymentStatus,
          paymentMethod: updatedData.paymentMethod || sale.paymentMethod,
          accountId: updatedData.accountId,
          cobrado: updatedData.paymentStatus === 'paid' ? newAmount : (sale.cobrado || 0),
          aCobrar: updatedData.paymentStatus === 'paid' ? 0 : newAmount - (sale.cobrado || 0)
        };
      });

      saveToStorage(STORAGE_KEYS.SALES, newSales);
      return { sales: newSales };
    });
  },

  // ============================================
  // UPDATE SALE STATUS
  // ============================================

  updateSaleStatus: (saleId: number, newStatus: 'completed' | 'pending' | 'cancelled') => {
    set((state) => {
      const newSales = state.sales.map(sale =>
        sale.id === saleId ? { ...sale, status: newStatus } : sale
      );
      saveToStorage(STORAGE_KEYS.SALES, newSales);
      return { sales: newSales };
    });
  },

  // ============================================
  // DELETE SALE
  // ============================================

  deleteSale: (saleId: number) => {
    const { updateStockWithMovement, getProductById } = useProductsStore.getState();
    const { removeLinkedTransactions } = useAccountsStore.getState();

    set((state) => {
      const saleToDelete = state.sales.find(sale => sale.id === saleId);
      if (!saleToDelete) {
        return state;
      }

      // 🔥 REVERSIÓN AUTOMÁTICA DE INVENTARIO
      if (saleToDelete.productId) {
        try {
          const currentProduct = getProductById(saleToDelete.productId);
          if (currentProduct) {
            updateStockWithMovement(
              saleToDelete.productId,
              currentProduct.stock + saleToDelete.items,
              `Eliminación venta ${saleToDelete.number} - Cliente: ${saleToDelete.client.name}`,
              `CANCEL-${saleToDelete.number}`
            );
          }
        } catch (error) {
          console.error('Error revirtiendo stock al eliminar venta:', error);
        }
      }

      // Eliminar transacciones enlazadas
      if (saleToDelete.paymentStatus === 'paid' && saleToDelete.accountId) {
        removeLinkedTransactions('sale', saleToDelete.id.toString());
      }

      // Actualizar stats
      const newStats = {
        totalSales: state.dashboardStats.totalSales - saleToDelete.amount,
        totalTransactions: state.dashboardStats.totalTransactions - 1,
        averagePerDay: Math.round((state.dashboardStats.totalSales - saleToDelete.amount) / 30),
        monthlyGrowth: state.dashboardStats.monthlyGrowth
      };

      const newSales = state.sales.filter(sale => sale.id !== saleId);

      saveToStorage(STORAGE_KEYS.SALES, newSales);
      saveToStorage(STORAGE_KEYS.DASHBOARD_STATS, newStats);

      return {
        sales: newSales,
        dashboardStats: newStats
      };
    });
  },

  // ============================================
  // UPDATE DASHBOARD STATS
  // ============================================

  updateDashboardStats: (newStats: Partial<DashboardStats>) => {
    set((state) => {
      const updatedStats = { ...state.dashboardStats, ...newStats };
      saveToStorage(STORAGE_KEYS.DASHBOARD_STATS, updatedStats);
      return { dashboardStats: updatedStats };
    });
  },

  // ============================================
  // SET SALES
  // ============================================

  setSales: (sales: Sale[]) => {
    set({ sales });
    saveToStorage(STORAGE_KEYS.SALES, sales);
  },
}));
