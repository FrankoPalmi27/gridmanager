import { useState, useEffect } from 'react';

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
}

// Estado inicial del dashboard
export const initialDashboardStats = {
  totalSales: 87420,
  totalTransactions: 142,
  averagePerDay: 2914,
  monthlyGrowth: 18.5
};

// LocalStorage keys
const SALES_STORAGE_KEY = 'gridmanager_sales';
const STATS_STORAGE_KEY = 'gridmanager_dashboard_stats';

// LocalStorage utilities
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Función utilitaria para actualizar el balance de las cuentas
const updateAccountBalance = (accountId: string, amount: number, description: string) => {
  try {
    const accountsKey = 'gridmanager_accounts';
    const transactionsKey = 'gridmanager_transactions';
    
    // Cargar cuentas actuales
    const currentAccounts = loadFromStorage(accountsKey, []);
    
    // Actualizar balance de la cuenta especificada
    const updatedAccounts = currentAccounts.map((account: any) => {
      if (account.id === accountId) {
        return {
          ...account,
          balance: account.balance + amount
        };
      }
      return account;
    });
    
    // Guardar cuentas actualizadas
    saveToStorage(accountsKey, updatedAccounts);
    
    // Crear transacción en el registro
    const currentTransactions = loadFromStorage(transactionsKey, []);
    const newTransaction = {
      id: Date.now().toString(),
      accountId: accountId,
      type: 'income',
      amount: amount,
      description: description,
      date: new Date().toISOString().split('T')[0],
      category: 'Ventas',
      reference: description.split(' ')[0] // Extraer numero de venta
    };
    
    // Guardar transacciones actualizadas
    saveToStorage(transactionsKey, [newTransaction, ...currentTransactions]);
    
  } catch (error) {
    console.error('Error updating account balance:', error);
  }
};

// Hook personalizado para manejar las ventas
export const useSalesStore = () => {
  const [dashboardStats, setDashboardStats] = useState(() => 
    loadFromStorage(STATS_STORAGE_KEY, initialDashboardStats)
  );
  const [sales, setSales] = useState<Sale[]>(() => 
    loadFromStorage(SALES_STORAGE_KEY, [])
  );

  // Save to localStorage whenever sales or stats change
  useEffect(() => {
    saveToStorage(SALES_STORAGE_KEY, sales);
  }, [sales]);

  useEffect(() => {
    saveToStorage(STATS_STORAGE_KEY, dashboardStats);
  }, [dashboardStats]);

  const addSale = (saleData: {
    client: string;
    product: string;
    quantity: number;
    price: number;
    salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
    paymentStatus?: 'paid' | 'pending' | 'partial';
    paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
    accountId?: string;
  }) => {
    // Generate client avatar (initials)
    const generateAvatar = (name: string) => {
      return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
    };
    
    const newSale: Sale = {
      id: Date.now(),
      number: `VTA-2024-${String(sales.length + 1).padStart(3, '0')}`,
      client: {
        name: saleData.client,
        email: `${saleData.client.toLowerCase().replace(' ', '.')}@email.com`,
        avatar: generateAvatar(saleData.client)
      },
      amount: saleData.quantity * saleData.price,
      date: new Date().toISOString().split('T')[0],
      status: saleData.paymentStatus === 'paid' ? 'completed' : 'pending',
      items: saleData.quantity,
      seller: {
        name: 'Usuario Actual',
        initials: 'UA'
      },
      sparkline: [50, 80, 120, 150, saleData.quantity * saleData.price / 100],
      // Nuevos campos
      salesChannel: saleData.salesChannel || 'store',
      paymentStatus: saleData.paymentStatus || 'pending',
      paymentMethod: saleData.paymentMethod || 'cash',
      accountId: saleData.accountId
    };

    // Agregar la nueva venta
    setSales(prev => [newSale, ...prev]);

    // Actualizar estadísticas del dashboard
    setDashboardStats(prev => ({
      totalSales: prev.totalSales + newSale.amount,
      totalTransactions: prev.totalTransactions + 1,
      averagePerDay: Math.round((prev.totalSales + newSale.amount) / 30),
      monthlyGrowth: prev.monthlyGrowth + 0.1 // Pequeño incremento
    }));

    // Si el pago está marcado como pagado y se especificó una cuenta, actualizar el balance
    if (saleData.paymentStatus === 'paid' && saleData.accountId) {
      updateAccountBalance(
        saleData.accountId, 
        newSale.amount, 
        `Venta ${newSale.number} - ${saleData.client}`
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
            // Remove previous amount from account
            updateAccountBalance(
              sale.accountId, 
              -originalAmount, 
              `Corrección venta ${sale.number} - ${sale.client.name}`
            );
          }

          // Add new amount to account if marked as paid
          if (updatedData.paymentStatus === 'paid' && updatedData.accountId) {
            updateAccountBalance(
              updatedData.accountId, 
              newAmount, 
              `Venta ${sale.number} - ${updatedData.client}`
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
            accountId: updatedData.accountId
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
    updateDashboardStats,
    setSales
  };
};