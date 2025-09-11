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
    salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
    paymentStatus?: 'paid' | 'pending' | 'partial';
    paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
    accountId?: string;
  }) => Sale;
  updateSale: (saleId: number, updatedData: {
    client: string;
    product: string;
    quantity: number;
    price: number;
    salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
    paymentStatus?: 'paid' | 'pending' | 'partial';
    paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
    accountId?: string;
  }) => void;
  updateSaleStatus: (saleId: number, newStatus: 'completed' | 'pending' | 'cancelled') => void;
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