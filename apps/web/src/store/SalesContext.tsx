import React, { createContext, useContext, ReactNode } from 'react';
import { useSalesStore, Sale } from './salesStore';

interface SalesContextType {
  dashboardStats: {
    totalSales: number;
    totalTransactions: number;
    averagePerDay: number;
    monthlyGrowth: number;
  };
  sales: Sale[];
  addSale: (saleData: {
    client: string;
    product: string;
    quantity: number;
    price: number;
  }) => Sale;
  updateDashboardStats: (newStats: any) => void;
  setSales: (sales: Sale[]) => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const salesStore = useSalesStore();
  
  return (
    <SalesContext.Provider value={salesStore}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = (): SalesContextType => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};