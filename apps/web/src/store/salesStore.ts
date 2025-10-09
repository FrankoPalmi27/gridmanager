import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoreApi } from 'zustand';
import { useAccountsStore } from './accountsStore';
import { useProductsStore } from './productsStore';
import { useSystemConfigStore } from './systemConfigStore';
import { useCustomersStore } from './customersStore';
import { salesApi } from '../lib/api';
import { loadWithSync, createWithSync, updateWithSync, deleteWithSync, getSyncMode, SyncConfig } from '../lib/syncStorage';

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
  customerId: string; // ID del cliente para la API
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
  updateSale: (saleId: number, updatedData: UpdateSaleData) => Promise<void>;
  updateSaleStatus: (saleId: number, newStatus: 'completed' | 'pending' | 'cancelled') => void;
  deleteSale: (saleId: number) => Promise<void>;
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
  apiUpdate: (id: number | string, data: Partial<Sale>) => salesApi.update(id, data),
  apiDelete: (id: number | string) => salesApi.delete(id),
  extractData: (response: any) => {
    const responseData = response.data.data || response.data;
    // Handle paginated response: { data: [...], total, page, limit, totalPages }
    const items = responseData.data || responseData.items || responseData;
    if (Array.isArray(items)) {
      return items;
    }
    console.warn('⚠️ Unexpected sales response structure:', responseData);
    return [];
  },
};

const SALES_SYNC_CACHE_KEY = 'gridmanager-sync-cache:sales';

const persistSalesCache = (sales: Sale[]) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const normalized = Array.isArray(sales) ? sales : [];
    window.localStorage.setItem(SALES_SYNC_CACHE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn('[SalesStore] ⚠️ No se pudo persistir el cache local de ventas:', error);
  }
};

type SalesBroadcastEvent =
  | {
      type: 'sales/update';
      payload: {
        sales: Sale[];
        dashboardStats: DashboardStats;
        syncMode?: 'online' | 'offline';
      };
      source: string;
      timestamp: number;
    }
  | {
      type: 'sales/request-refresh';
      source: string;
      timestamp: number;
    };

const BROADCAST_CHANNEL_NAME = 'grid-manager:sales';

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

const broadcast = (event: SalesBroadcastEvent) => {
  if (!broadcastChannel) {
    return;
  }

  broadcastChannel.postMessage(event);
};

let isBroadcastRegistered = false;

const registerBroadcastListener = (
  set: StoreApi<SalesStore>['setState'],
  get: StoreApi<SalesStore>['getState'],
) => {
  if (!broadcastChannel || isBroadcastRegistered) {
    return;
  }

  broadcastChannel.addEventListener('message', (event: MessageEvent<SalesBroadcastEvent>) => {
    const data = event.data;

    if (!data || data.source === tabId) {
      return;
    }

    if (data.type === 'sales/update') {
      const { sales, dashboardStats, syncMode } = data.payload;
      set((state) => ({
        sales,
        dashboardStats,
        syncMode: syncMode ?? state.syncMode,
      }));
    }

    if (data.type === 'sales/request-refresh') {
      void get().loadSales();
    }
  });

  isBroadcastRegistered = true;
};

const storage = typeof window !== 'undefined'
  ? createJSONStorage<SalesStore>(() => window.localStorage)
  : undefined;

// ============================================
// ZUSTAND STORE
// ============================================

export const useSalesStore = create<SalesStore>()(
  persist(
    (set, get) => {
      registerBroadcastListener(set, get);

      const broadcastState = (overrides?: {
        sales?: Sale[];
        dashboardStats?: DashboardStats;
        syncMode?: 'online' | 'offline';
      }) => {
        const state = get();
        broadcast({
          type: 'sales/update',
          payload: {
            sales: overrides?.sales ?? state.sales,
            dashboardStats: overrides?.dashboardStats ?? state.dashboardStats,
            syncMode: overrides?.syncMode ?? state.syncMode,
          },
          source: tabId,
          timestamp: Date.now(),
        });
      };

      return {
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
    const mode = getSyncMode();
    console.log('[SalesStore] loadSales → syncMode:', mode);
    set({ isLoading: true, syncMode: mode });
    const fallbackSales = get().sales;
    try {
      const sales = await loadWithSync<Sale>(syncConfig, fallbackSales);
      console.log('[SalesStore] loadSales → received', sales.length, 'items');
      set({ sales, isLoading: false, syncMode: mode });
      persistSalesCache(sales);
      broadcastState({ sales, syncMode: mode });
    } catch (error) {
      console.error('[SalesStore] Error loading sales:', error);
      // ✅ Preservar datos locales cuando falla la sincronización
      set((state) => ({
        isLoading: false,
        sales: state.sales,
        syncMode: mode,
      }));
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

    const newSale: Sale & { customerId?: string; price?: number; quantity?: number } = {
      id: Date.now(),
      number: `VTA-2024-${String(state.sales.length + 1).padStart(3, '0')}`,
      client: {
        name: saleData.client,
        email: `${saleData.client.toLowerCase().replace(' ', '.')}@email.com`,
        avatar: generateAvatar(saleData.client)
      },
      customerId: saleData.customerId, // ID del cliente para la API
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
      productName: saleData.product,
      // Campos adicionales para la API
      price: saleData.price,
      quantity: saleData.quantity,
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
      console.log('[SalesStore] addSale → attempting API create', { syncMode: getSyncMode(), payload: { client: saleData.client, productId: saleData.productId, quantity: saleData.quantity } });
      const createdSale = await createWithSync(syncConfig, newSale, state.sales);

      // Actualizar state con respuesta del servidor
      const newStats = {
        totalSales: state.dashboardStats.totalSales + createdSale.amount,
        totalTransactions: state.dashboardStats.totalTransactions + 1,
        averagePerDay: Math.round((state.dashboardStats.totalSales + createdSale.amount) / 30),
        monthlyGrowth: state.dashboardStats.monthlyGrowth + 0.1
      };

      const nextSales = [createdSale, ...state.sales];
      const nextSyncMode = getSyncMode();
      set({
        sales: nextSales,
        dashboardStats: newStats,
        syncMode: nextSyncMode
      });
      persistSalesCache(nextSales);
      broadcastState({ sales: nextSales, dashboardStats: newStats, syncMode: nextSyncMode });
      console.log('[SalesStore] addSale → API success', createdSale?.id);
    } catch (error) {
      console.error('[SalesStore] Error syncing sale:', error);

      const newSales = [newSale, ...state.sales];
      const newStats = {
        totalSales: state.dashboardStats.totalSales + newSale.amount,
        totalTransactions: state.dashboardStats.totalTransactions + 1,
        averagePerDay: Math.round((state.dashboardStats.totalSales + newSale.amount) / 30),
        monthlyGrowth: state.dashboardStats.monthlyGrowth + 0.1
      };

      const nextSyncMode = getSyncMode();
      set({
        sales: newSales,
        dashboardStats: newStats,
        syncMode: nextSyncMode
      });
      persistSalesCache(newSales);
      broadcastState({ sales: newSales, dashboardStats: newStats, syncMode: nextSyncMode });
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

  updateSale: async (saleId: number, updatedData: UpdateSaleData) => {
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

    if (previousCustomer && wasPending) {
      updateCustomerBalance(previousCustomer.id, originalAmount);
    }

    if (sale.paymentStatus === 'paid' && sale.accountId) {
      removeLinkedTransactions('sale', sale.id.toString());
    }

    const updatedCobrado = newPaymentStatus === 'paid'
      ? newAmount
      : newPaymentStatus === 'partial'
        ? Math.min(sale.cobrado || 0, newAmount)
        : 0;

    const updatedACobrar = newPaymentStatus === 'paid'
      ? 0
      : newAmount - updatedCobrado;

    const backendPayload: Partial<Sale> = {
      client: {
        name: updatedData.client,
        email: `${updatedData.client.toLowerCase().replace(' ', '.')}@email.com`,
        avatar: generateAvatar(updatedData.client)
      },
      amount: newAmount,
      items: updatedData.quantity,
      status: newPaymentStatus === 'paid' ? 'completed' : 'pending',
      salesChannel: updatedData.salesChannel ?? sale.salesChannel,
      paymentStatus: newPaymentStatus,
      accountId: newAccountId,
      cobrado: updatedCobrado,
      aCobrar: updatedACobrar,
      productName: updatedData.product ?? sale.productName,
      productId: sale.productId,
    };

    try {
      await updateWithSync<Sale>(syncConfig, saleId, backendPayload, state.sales);
    } catch (error) {
      console.error('Error syncing sale update:', error);
      throw error;
    }

    const nextSyncMode = getSyncMode();
    let nextSales: Sale[] | null = null;
    let nextStats: DashboardStats | null = null;

    set((storeState) => {
      const newSales = storeState.sales.map(existingSale => {
        if (existingSale.id !== saleId) {
          return existingSale;
        }

        const refreshedSale: Sale = {
          ...existingSale,
          ...backendPayload,
          client: backendPayload.client ?? existingSale.client,
          amount: newAmount,
          items: updatedData.quantity,
          status: backendPayload.status ?? existingSale.status,
          salesChannel: backendPayload.salesChannel ?? existingSale.salesChannel,
          paymentStatus: backendPayload.paymentStatus ?? existingSale.paymentStatus,
          accountId: backendPayload.accountId ?? existingSale.accountId,
          cobrado: backendPayload.cobrado ?? existingSale.cobrado,
          aCobrar: backendPayload.aCobrar ?? existingSale.aCobrar,
          productName: backendPayload.productName ?? existingSale.productName,
        };

        return refreshedSale;
      });

      const updatedSale = newSales.find(s => s.id === saleId);
      if (!updatedSale) {
        return storeState;
      }

      const newStats = {
        totalSales: storeState.dashboardStats.totalSales + amountDifference,
        totalTransactions: storeState.dashboardStats.totalTransactions,
        averagePerDay: Math.round((storeState.dashboardStats.totalSales + amountDifference) / 30),
        monthlyGrowth: storeState.dashboardStats.monthlyGrowth
      };

      nextSales = newSales;
      nextStats = newStats;

      return {
        ...storeState,
        sales: newSales,
        dashboardStats: newStats,
        syncMode: nextSyncMode,
      };
    });

    if (nextSales && nextStats) {
      broadcastState({ sales: nextSales, dashboardStats: nextStats, syncMode: nextSyncMode });
    }

    if (nextCustomer && isPending) {
      updateCustomerBalance(nextCustomer.id, -newAmount);
    }

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
    broadcastState();
  },

  // ============================================
  // DELETE SALE
  // ============================================

  deleteSale: async (saleId: number) => {
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

    try {
      await deleteWithSync<Sale>(syncConfig, saleId, state.sales);
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }

    // Actualizar el state de ventas
    const nextSyncMode = getSyncMode();
    let nextSales: Sale[] | null = null;
    let nextStats: DashboardStats | null = null;

    set((storeState) => {
      const newStats = {
        totalSales: storeState.dashboardStats.totalSales - saleToDelete.amount,
        totalTransactions: storeState.dashboardStats.totalTransactions - 1,
        averagePerDay: Math.round((storeState.dashboardStats.totalSales - saleToDelete.amount) / 30),
        monthlyGrowth: storeState.dashboardStats.monthlyGrowth
      };

      const newSales = storeState.sales.filter(sale => sale.id !== saleId);

      nextSales = newSales;
      nextStats = newStats;

      return {
        ...storeState,
        sales: newSales,
        dashboardStats: newStats,
        syncMode: nextSyncMode,
      };
    });

    if (nextSales && nextStats) {
      broadcastState({ sales: nextSales, dashboardStats: nextStats, syncMode: nextSyncMode });
    }
  },

  // ============================================
  // UPDATE DASHBOARD STATS
  // ============================================

  updateDashboardStats: (newStats: Partial<DashboardStats>) => {
    const state = get();
    const updatedStats = { ...state.dashboardStats, ...newStats };
    set({ dashboardStats: updatedStats });
    broadcastState({ dashboardStats: updatedStats });
  },

  // ============================================
  // SET SALES
  // ============================================

  setSales: (sales: Sale[]) => {
    set({ sales });
    broadcastState({ sales });
  },
      };
    },
    {
      name: 'grid-manager:sales-store',
      storage,
    },
  ),
);
