import { create } from 'zustand';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../lib/localStorage';
import { useProductsStore } from './productsStore';
import { useSuppliersStore } from './suppliersStore';
import { useAccountsStore } from './accountsStore';

// Interfaces for Purchases module
export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  number: string;               // PUR-2024-001
  supplierId: string;
  supplierName: string;
  date: string;
  status: 'pending' | 'received' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'partial';
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
  accountId?: string;           // Account for payment registration
  items: PurchaseItem[];
  subtotal: number;
  tax?: number;
  total: number;
  reference?: string;           // External reference (invoice number, etc.)
  notes?: string;
  createdAt: string;
  createdBy?: string;
  receivedDate?: string;        // Date when items were received
}

// Initial dashboard stats for purchases
export const initialPurchaseStats = {
  totalPurchases: 0,
  totalSpent: 0,
  pendingOrders: 0,
  monthlySpending: 0
};

interface PurchasesStore {
  purchases: Purchase[];
  dashboardStats: typeof initialPurchaseStats;
  
  // CRUD Operations
  addPurchase: (purchaseData: {
    supplierId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitCost: number;
    }>;
    paymentStatus?: 'paid' | 'pending' | 'partial';
    paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
    accountId?: string;
    reference?: string;
    notes?: string;
  }) => Purchase;
  
  updatePurchase: (id: string, updatedData: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;
  
  // Status Updates
  markAsReceived: (purchaseId: string) => void;
  updatePaymentStatus: (purchaseId: string, paymentStatus: 'paid' | 'pending' | 'partial', accountId?: string) => void;
  
  // Utility Functions
  getPurchasesBySupplier: (supplierId: string) => Purchase[];
  getPurchasesByProduct: (productId: string) => Purchase[];
  updateDashboardStats: (newStats: Partial<typeof initialPurchaseStats>) => void;
  
  // Integration Functions
  processStockIncrease: (purchase: Purchase) => void;
  updateSupplierBalance: (supplierId: string, amount: number, operation: 'add' | 'subtract') => void;
}

export const usePurchasesStore = create<PurchasesStore>((set, get) => ({
  purchases: loadFromStorage(STORAGE_KEYS.PURCHASES, []),
  dashboardStats: loadFromStorage(STORAGE_KEYS.PURCHASE_STATS, initialPurchaseStats),

  addPurchase: (purchaseData) => {
    // Get supplier information
    const { getSupplierById } = useSuppliersStore.getState();
    const supplier = getSupplierById(purchaseData.supplierId);
    
    if (!supplier) {
      throw new Error('Proveedor no encontrado');
    }

    // Get products information and validate
    const { getProductById } = useProductsStore.getState();
    const purchaseItems: PurchaseItem[] = [];
    let subtotal = 0;

    for (const item of purchaseData.items) {
      const product = getProductById(item.productId);
      if (!product) {
        throw new Error(`Producto no encontrado: ${item.productId}`);
      }

      const totalCost = item.quantity * item.unitCost;
      subtotal += totalCost;

      purchaseItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId: item.productId,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost
      });
    }

    const tax = subtotal * 0.21; // 21% IVA by default
    const total = subtotal + tax;

    const currentPurchases = get().purchases;
    const purchaseNumber = `PUR-2024-${String(currentPurchases.length + 1).padStart(3, '0')}`;

    const newPurchase: Purchase = {
      id: Date.now().toString(),
      number: purchaseNumber,
      supplierId: purchaseData.supplierId,
      supplierName: supplier.name,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      paymentStatus: purchaseData.paymentStatus || 'pending',
      paymentMethod: purchaseData.paymentMethod,
      accountId: purchaseData.accountId,
      items: purchaseItems,
      subtotal,
      tax,
      total,
      reference: purchaseData.reference,
      notes: purchaseData.notes,
      createdAt: new Date().toISOString(),
      createdBy: 'Usuario Actual'
    };

    // Add purchase to store
    set((state) => {
      const newPurchases = [newPurchase, ...state.purchases];
      saveToStorage(STORAGE_KEYS.PURCHASES, newPurchases);
      return { purchases: newPurchases };
    });

    // Update dashboard stats
    set((state) => {
      const newStats = {
        ...state.dashboardStats,
        totalPurchases: state.dashboardStats.totalPurchases + 1,
        totalSpent: state.dashboardStats.totalSpent + total,
        pendingOrders: state.dashboardStats.pendingOrders + 1,
        monthlySpending: state.dashboardStats.monthlySpending + total
      };
      saveToStorage(STORAGE_KEYS.PURCHASE_STATS, newStats);
      return { dashboardStats: newStats };
    });

    // 🔥 INTEGRATION: Update supplier balance (debt)
    try {
      get().updateSupplierBalance(purchaseData.supplierId, total, 'add');
    } catch (error) {
      console.error('Error updating supplier balance:', error);
    }

    // 🔥 INTEGRATION: If payment is made, create transaction
    if (purchaseData.paymentStatus === 'paid' && purchaseData.accountId) {
      try {
        const { addLinkedTransaction } = useAccountsStore.getState();
        addLinkedTransaction(
          purchaseData.accountId,
          -total, // Negative because it's an expense
          `Compra ${purchaseNumber} - ${supplier.name}`,
          {
            type: 'purchase',
            id: newPurchase.id,
            number: purchaseNumber
          }
        );
      } catch (error) {
        console.error('Error creating transaction:', error);
      }
    }

    return newPurchase;
  },

  updatePurchase: (id, updatedData) => {
    set((state) => {
      const newPurchases = state.purchases.map(purchase =>
        purchase.id === id ? { ...purchase, ...updatedData } : purchase
      );
      saveToStorage(STORAGE_KEYS.PURCHASES, newPurchases);
      return { purchases: newPurchases };
    });
  },

  deletePurchase: (id) => {
    const purchaseToDelete = get().purchases.find(p => p.id === id);
    if (!purchaseToDelete) return;

    // Revert supplier balance
    try {
      get().updateSupplierBalance(purchaseToDelete.supplierId, purchaseToDelete.total, 'subtract');
    } catch (error) {
      console.error('Error reverting supplier balance:', error);
    }

    // Remove linked transactions if payment was made
    if (purchaseToDelete.paymentStatus === 'paid' && purchaseToDelete.accountId) {
      try {
        const { removeLinkedTransactions } = useAccountsStore.getState();
        removeLinkedTransactions('purchase', purchaseToDelete.id);
      } catch (error) {
        console.error('Error removing linked transactions:', error);
      }
    }

    // Update dashboard stats
    set((state) => {
      const newStats = {
        ...state.dashboardStats,
        totalPurchases: state.dashboardStats.totalPurchases - 1,
        totalSpent: state.dashboardStats.totalSpent - purchaseToDelete.total,
        pendingOrders: purchaseToDelete.status === 'pending' 
          ? state.dashboardStats.pendingOrders - 1 
          : state.dashboardStats.pendingOrders,
        monthlySpending: state.dashboardStats.monthlySpending - purchaseToDelete.total
      };
      saveToStorage(STORAGE_KEYS.PURCHASE_STATS, newStats);
      return { dashboardStats: newStats };
    });

    // Remove purchase
    set((state) => {
      const newPurchases = state.purchases.filter(purchase => purchase.id !== id);
      saveToStorage(STORAGE_KEYS.PURCHASES, newPurchases);
      return { purchases: newPurchases };
    });
  },

  markAsReceived: (purchaseId) => {
    const purchase = get().purchases.find(p => p.id === purchaseId);
    if (!purchase || purchase.status === 'received') return;

    // 🔥 INTEGRATION: Automatically update inventory when items are received
    get().processStockIncrease(purchase);

    // Update purchase status
    get().updatePurchase(purchaseId, {
      status: 'received',
      receivedDate: new Date().toISOString().split('T')[0]
    });

    // Update pending orders count
    set((state) => {
      const newStats = {
        ...state.dashboardStats,
        pendingOrders: state.dashboardStats.pendingOrders - 1
      };
      saveToStorage(STORAGE_KEYS.PURCHASE_STATS, newStats);
      return { dashboardStats: newStats };
    });
  },

  updatePaymentStatus: (purchaseId, paymentStatus, accountId) => {
    const purchase = get().purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    // If changing from unpaid to paid, create transaction
    if (purchase.paymentStatus !== 'paid' && paymentStatus === 'paid' && accountId) {
      try {
        const { addLinkedTransaction } = useAccountsStore.getState();
        addLinkedTransaction(
          accountId,
          -purchase.total, // Negative because it's an expense
          `Pago compra ${purchase.number} - ${purchase.supplierName}`,
          {
            type: 'purchase',
            id: purchase.id,
            number: purchase.number
          }
        );
      } catch (error) {
        console.error('Error creating payment transaction:', error);
      }
    }

    // Update purchase
    get().updatePurchase(purchaseId, {
      paymentStatus,
      accountId: accountId || purchase.accountId
    });
  },

  processStockIncrease: (purchase) => {
    try {
      const { updateStockWithMovement, getProductById } = useProductsStore.getState();
      
      for (const item of purchase.items) {
        const product = getProductById(item.productId);
        if (product) {
          const newStock = product.stock + item.quantity;
          updateStockWithMovement(
            item.productId,
            newStock,
            `Compra ${purchase.number} - ${purchase.supplierName}`,
            purchase.number
          );

          // 🔥 UPDATE PRODUCT COST WITH COST AVERAGING
          try {
            const { updateProduct } = useProductsStore.getState();
            const totalCurrentValue = product.cost * product.stock;
            const totalNewValue = item.unitCost * item.quantity;
            const totalQuantity = product.stock + item.quantity;
            const averageCost = (totalCurrentValue + totalNewValue) / totalQuantity;
            
            updateProduct(item.productId, { 
              cost: averageCost,
              // Recalculate margin with new cost
              margin: product.price > 0 ? ((product.price - averageCost) / averageCost) * 100 : 0
            });
          } catch (error) {
            console.error('Error updating product cost:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error processing stock increase:', error);
      throw error;
    }
  },

  updateSupplierBalance: (supplierId, amount, operation) => {
    try {
      const { updateSupplier } = useSuppliersStore.getState();
      const { getSupplierById } = useSuppliersStore.getState();
      const supplier = getSupplierById(supplierId);
      
      if (supplier) {
        const newBalance = operation === 'add' 
          ? supplier.currentBalance + amount 
          : supplier.currentBalance - amount;
        
        updateSupplier(supplierId, { currentBalance: newBalance });
      }
    } catch (error) {
      console.error('Error updating supplier balance:', error);
      throw error;
    }
  },

  getPurchasesBySupplier: (supplierId) => {
    const state = get();
    return state.purchases.filter(p => p.supplierId === supplierId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getPurchasesByProduct: (productId) => {
    const state = get();
    return state.purchases.filter(p => 
      p.items.some(item => item.productId === productId)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateDashboardStats: (newStats) => {
    set((state) => {
      const updatedStats = { ...state.dashboardStats, ...newStats };
      saveToStorage(STORAGE_KEYS.PURCHASE_STATS, updatedStats);
      return { dashboardStats: updatedStats };
    });
  }
}));