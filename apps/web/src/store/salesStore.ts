import { create } from 'zustand';
import { useAccountsStore } from './accountsStore';
import { useProductsStore } from './productsStore';
import { useSystemConfigStore } from './systemConfigStore';
import { useCustomersStore } from './customersStore';
import { salesApi } from '../lib/api';
import { loadWithSync, createWithSync, getSyncMode, SyncConfig } from '../lib/syncStorage';

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
  // paymentMethod se obtiene ahora desde la cuenta asociada
  accountId?: string; // ID de la cuenta donde se registró el pago (la cuenta define el método de pago)
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
  accountId?: string; // La cuenta define el método de pago
}

interface UpdateSaleData {
  client: string;
  product: string;
  quantity: number;
  price: number;
  salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
  paymentStatus?: 'paid' | 'pending' | 'partial';
  accountId?: string; // La cuenta define el método de pago
}

interface SalesStore {
  // State
  sales: Sale[];
  dashboardStats: DashboardStats;
  isLoading: boolean;
  syncMode: 'online' | 'offline';

  // Actions
  loadSales: () => Promise<void>;
  addSale: (saleData: AddSaleData) => Promise<Sale>;
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
// SYNC CONFIGURATION
// ============================================

const syncConfig: SyncConfig<Sale> = {
  storageKey: 'sales',
  apiGet: () => salesApi.getAll(),
  apiCreate: (data: Sale) => salesApi.create(data),
  extractData: (response: any) => response.data.data || response.data,
};

// ============================================
// ZUSTAND STORE
// ============================================

export const useSalesStore = create<SalesStore>((set, get) => ({
  // ============================================
  // INITIAL STATE
  // ============================================

  sales: [],
  dashboardStats: initialDashboardStats,
  isLoading: false,
  syncMode: getSyncMode(),

  // ============================================
  // LOAD SALES
  // ============================================

  loadSales: async () => {
    set({ isLoading: true, syncMode: getSyncMode() });
    try {
  const sales = await loadWithSync<Sale>(syncConfig, []);
      set({ sales, isLoading: false });
    } catch (error) {
      console.error('Error loading sales:', error);
      set({ isLoading: false });
    }
  },

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

  addSale: async (saleData: AddSaleData) => {
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
      accountId: saleData.accountId, // El método de pago se obtiene de la cuenta
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

    // Intentar sincronizar con API
    try {
      const createdSale = await createWithSync(syncConfig, newSale, state.sales);

      // Actualizar state con respuesta del servidor
      const newStats = {
        totalSales: state.dashboardStats.totalSales + createdSale.amount,
        totalTransactions: state.dashboardStats.totalTransactions + 1,
        averagePerDay: Math.round((state.dashboardStats.totalSales + createdSale.amount) / 30),
        monthlyGrowth: state.dashboardStats.monthlyGrowth + 0.1
      };

      set({
        sales: [createdSale, ...state.sales],
        dashboardStats: newStats,
        syncMode: getSyncMode()
      });
    } catch (error) {
      console.error('Error syncing sale:', error);

      const newSales = [newSale, ...state.sales];
      const newStats = {
        totalSales: state.dashboardStats.totalSales + newSale.amount,
        totalTransactions: state.dashboardStats.totalTransactions + 1,
        averagePerDay: Math.round((state.dashboardStats.totalSales + newSale.amount) / 30),
        monthlyGrowth: state.dashboardStats.monthlyGrowth + 0.1
      };

      set({
        sales: newSales,
        dashboardStats: newStats,
        syncMode: getSyncMode()
      });
    }

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
    const state = get();
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) {
      return;
    }

    const { addLinkedTransaction, removeLinkedTransactions } = useAccountsStore.getState();
    const { getProductById, updateStockWithMovement } = useProductsStore.getState();
    const { getCustomerByName, updateCustomerBalance } = useCustomersStore.getState();

    const currentProduct = sale.productId ? getProductById(sale.productId) : undefined;
    const netQuantityChange = updatedData.quantity - sale.items;

    if (sale.productId && netQuantityChange > 0) {
      const stockValidation = state.validateStock(sale.productId, netQuantityChange);
      if (!stockValidation.valid) {
        throw new Error(stockValidation.message || 'Stock insuficiente para la actualización de la venta');
      }
    }

    const originalAmount = sale.amount;
    const newAmount = updatedData.quantity * updatedData.price;
    const amountDifference = newAmount - originalAmount;

    const newPaymentStatus = updatedData.paymentStatus || sale.paymentStatus || 'pending';
    const newAccountId = updatedData.accountId ?? sale.accountId;

  const wasPending = !sale.paymentStatus || sale.paymentStatus === 'pending' || sale.paymentStatus === 'partial';
    const isPending = newPaymentStatus === 'pending' || newPaymentStatus === 'partial';

    const previousCustomer = getCustomerByName(sale.client.name);
    const nextCustomer = getCustomerByName(updatedData.client);

    // Reverse previous customer balance impact if applicable
    if (previousCustomer && wasPending) {
      updateCustomerBalance(previousCustomer.id, originalAmount);
    }

    // Remove previous linked transactions if necessary
    if (sale.paymentStatus === 'paid' && sale.accountId) {
      removeLinkedTransactions('sale', sale.id.toString());
    }

    let updatedSale: Sale | null = null;

    set((storeState) => {
      const newSales = storeState.sales.map(existingSale => {
        if (existingSale.id !== saleId) return existingSale;

        const updatedCobrado = newPaymentStatus === 'paid'
          ? newAmount
          : newPaymentStatus === 'partial'
            ? Math.min(existingSale.cobrado || 0, newAmount)
            : 0;

        const updatedACobrar = newPaymentStatus === 'paid'
          ? 0
          : newAmount - updatedCobrado;

        const refreshedSale: Sale = {
          ...existingSale,
          client: {
            name: updatedData.client,
            email: `${updatedData.client.toLowerCase().replace(' ', '.')}@email.com`,
            avatar: generateAvatar(updatedData.client)
          },
          amount: newAmount,
          items: updatedData.quantity,
          status: newPaymentStatus === 'paid' ? 'completed' : 'pending',
          salesChannel: updatedData.salesChannel || existingSale.salesChannel,
          paymentStatus: newPaymentStatus,
          accountId: newAccountId, // El método de pago viene de la cuenta
          cobrado: updatedCobrado,
          aCobrar: updatedACobrar,
          productName: updatedData.product || existingSale.productName
        };

        updatedSale = refreshedSale;
        return refreshedSale;
      });

      if (!updatedSale) {
        return storeState;
      }

      const newStats = {
        totalSales: storeState.dashboardStats.totalSales + amountDifference,
        totalTransactions: storeState.dashboardStats.totalTransactions,
        averagePerDay: Math.round((storeState.dashboardStats.totalSales + amountDifference) / 30),
        monthlyGrowth: storeState.dashboardStats.monthlyGrowth
      };

      return {
        sales: newSales,
        dashboardStats: newStats
      };
    });

    // Apply new customer balance impact if sale remains pending or partial
    if (nextCustomer && isPending) {
      updateCustomerBalance(nextCustomer.id, -newAmount);
    }

    // Register new linked transaction when the sale is paid
    if (newPaymentStatus === 'paid' && newAccountId) {
      addLinkedTransaction(
        newAccountId,
        newAmount,
        `Venta ${sale.number} - ${updatedData.client}`,
        {
          type: 'sale',
          id: sale.id.toString(),
          number: sale.number
        }
      );
    }

    // Sync inventory when the quantity changes
    if (sale.productId && currentProduct && netQuantityChange !== 0) {
      const targetStock = currentProduct.stock - netQuantityChange;
      updateStockWithMovement(
        sale.productId,
        targetStock,
        `Actualización venta ${sale.number} - Cliente: ${updatedData.client}`,
        sale.number
      );
    }
  },

  // ============================================
  // UPDATE SALE STATUS
  // ============================================

  updateSaleStatus: (saleId: number, newStatus: 'completed' | 'pending' | 'cancelled') => {
    set((state) => {
      const newSales = state.sales.map(sale =>
        sale.id === saleId ? { ...sale, status: newStatus } : sale
      );
      return { sales: newSales };
    });
  },

  // ============================================
  // DELETE SALE
  // ============================================

  deleteSale: (saleId: number) => {
    const { updateStockWithMovement, getProductById } = useProductsStore.getState();
    const { removeLinkedTransactions } = useAccountsStore.getState();

    // Primero obtenemos la venta a eliminar ANTES del set
    const state = get();
    const saleToDelete = state.sales.find(sale => sale.id === saleId);

    if (!saleToDelete) {
      return;
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

    // Eliminar transacciones enlazadas ANTES de actualizar el state
    if (saleToDelete.paymentStatus === 'paid' && saleToDelete.accountId) {
      removeLinkedTransactions('sale', saleToDelete.id.toString());
    }

    // Revert customer balance impact if sale was pendiente/parcial
    try {
      if (saleToDelete.paymentStatus === 'pending' || saleToDelete.paymentStatus === 'partial') {
        const { getCustomerByName, updateCustomerBalance } = useCustomersStore.getState();
        const customer = getCustomerByName(saleToDelete.client.name);
        if (customer) {
          updateCustomerBalance(customer.id, saleToDelete.amount);
        }
      }
    } catch (error) {
      console.error('Error revirtiendo balance de cliente al eliminar venta:', error);
    }

    // Actualizar el state de ventas
    set((state) => {
      // Actualizar stats
      const newStats = {
        totalSales: state.dashboardStats.totalSales - saleToDelete.amount,
        totalTransactions: state.dashboardStats.totalTransactions - 1,
        averagePerDay: Math.round((state.dashboardStats.totalSales - saleToDelete.amount) / 30),
        monthlyGrowth: state.dashboardStats.monthlyGrowth
      };

      const newSales = state.sales.filter(sale => sale.id !== saleId);

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
      return { dashboardStats: updatedStats };
    });
  },

  // ============================================
  // SET SALES
  // ============================================

  setSales: (sales: Sale[]) => {
    set({ sales });
  },
}));
