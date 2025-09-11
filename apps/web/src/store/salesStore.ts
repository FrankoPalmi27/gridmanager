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
      status: 'completed',
      items: saleData.quantity,
      seller: {
        name: 'Usuario Actual',
        initials: 'UA'
      },
      sparkline: [50, 80, 120, 150, saleData.quantity * saleData.price / 100]
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

  return {
    dashboardStats,
    sales,
    addSale,
    updateSaleStatus,
    updateDashboardStats,
    setSales
  };
};