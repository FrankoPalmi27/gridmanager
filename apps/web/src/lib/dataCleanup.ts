/**
 * SISTEMA DE LIMPIEZA AUTOMÁTICA DE DATOS LEGACY
 *
 * Este módulo detecta y limpia automáticamente datos precargados/mock
 * que puedan existir en el localStorage del usuario.
 */

import { STORAGE_KEYS } from './localStorage';

// Identificadores de datos mock/legacy que deben ser removidos
const MOCK_DATA_IDENTIFIERS = {
  sales: [
    'Juan Pérez', 'María López', 'Pedro Martín', // Nombres de clientes mock
    'VTA-2024-001', 'VTA-2024-002', 'VTA-2024-003', // Números de venta mock
    'Ana García', 'Carlos Ruiz', // Vendedores mock
    25000, 45000, 18500, // Montos específicos mock
  ],
  accounts: [
    'Cuenta Principal', 'Caja Fuerte', 'Cuenta USD', 'Tarjeta Empresarial',
    'Banco Nación', 'Banco Galicia', 'Banco Santander',
    '1234567890', '0987654321', 'CASH-001', '4532-****-****-1234',
    150000, 25000, 5000, -12000, // Balances específicos mock
  ],
  transactions: [
    'Venta a Juan Pérez', 'Pago a proveedor TechDistributor',
    'Venta en efectivo', 'Compra de dólares', 'Gastos de oficina',
    'VTA-2024-001', 'PAGO-001', // Referencias mock
  ],
  dashboard: [
    87420, 142, 2914, 18.5 // Stats específicos mock
  ]
};

interface CleanupResult {
  cleaned: boolean;
  itemsRemoved: number;
  keysAffected: string[];
  details: Record<string, any>;
}

export class DataCleanup {
  private results: CleanupResult = {
    cleaned: false,
    itemsRemoved: 0,
    keysAffected: [],
    details: {}
  };

  /**
   * Ejecuta la limpieza automática de datos legacy
   */
  async runCleanup(): Promise<CleanupResult> {
    console.log('🧹 DataCleanup: Iniciando detección de datos legacy...');

    this.results = {
      cleaned: false,
      itemsRemoved: 0,
      keysAffected: [],
      details: {}
    };

    // Limpiar cada tipo de dato
    await this.cleanSalesData();
    await this.cleanAccountsData();
    await this.cleanTransactionsData();
    await this.cleanDashboardStats();
    await this.cleanSystemConfig();

    if (this.results.cleaned) {
      console.log(`✅ DataCleanup: Limpieza completada. ${this.results.itemsRemoved} elementos removidos.`);
      console.log(`📊 DataCleanup: Claves afectadas:`, this.results.keysAffected);
    } else {
      console.log('✅ DataCleanup: No se encontraron datos legacy para limpiar.');
    }

    return this.results;
  }

  /**
   * Limpia datos de ventas mock
   */
  private async cleanSalesData(): Promise<void> {
    try {
      const salesData = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');

      if (!Array.isArray(salesData) || salesData.length === 0) return;

      const cleanedSales = salesData.filter(sale => {
        // Verificar si es un dato mock
        const isMock = this.isMockSale(sale);
        if (isMock) {
          this.results.itemsRemoved++;
          console.log(`🗑️  Removiendo venta mock: ${sale.number || sale.id}`);
        }
        return !isMock;
      });

      if (cleanedSales.length !== salesData.length) {
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(cleanedSales));
        this.markAsCleaned(STORAGE_KEYS.SALES);
        this.results.details.sales = {
          original: salesData.length,
          cleaned: cleanedSales.length,
          removed: salesData.length - cleanedSales.length
        };
      }
    } catch (error) {
      console.error('❌ Error limpiando datos de ventas:', error);
    }
  }

  /**
   * Limpia datos de cuentas mock
   */
  private async cleanAccountsData(): Promise<void> {
    try {
      const accountsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');

      if (!Array.isArray(accountsData) || accountsData.length === 0) return;

      const cleanedAccounts = accountsData.filter(account => {
        const isMock = this.isMockAccount(account);
        if (isMock) {
          this.results.itemsRemoved++;
          console.log(`🗑️  Removiendo cuenta mock: ${account.name}`);
        }
        return !isMock;
      });

      if (cleanedAccounts.length !== accountsData.length) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(cleanedAccounts));
        this.markAsCleaned(STORAGE_KEYS.ACCOUNTS);
        this.results.details.accounts = {
          original: accountsData.length,
          cleaned: cleanedAccounts.length,
          removed: accountsData.length - cleanedAccounts.length
        };
      }
    } catch (error) {
      console.error('❌ Error limpiando datos de cuentas:', error);
    }
  }

  /**
   * Limpia datos de transacciones mock
   */
  private async cleanTransactionsData(): Promise<void> {
    try {
      const transactionsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');

      if (!Array.isArray(transactionsData) || transactionsData.length === 0) return;

      const cleanedTransactions = transactionsData.filter(transaction => {
        const isMock = this.isMockTransaction(transaction);
        if (isMock) {
          this.results.itemsRemoved++;
          console.log(`🗑️  Removiendo transacción mock: ${transaction.description}`);
        }
        return !isMock;
      });

      if (cleanedTransactions.length !== transactionsData.length) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cleanedTransactions));
        this.markAsCleaned(STORAGE_KEYS.TRANSACTIONS);
        this.results.details.transactions = {
          original: transactionsData.length,
          cleaned: cleanedTransactions.length,
          removed: transactionsData.length - cleanedTransactions.length
        };
      }
    } catch (error) {
      console.error('❌ Error limpiando datos de transacciones:', error);
    }
  }

  /**
   * Limpia estadísticas mock del dashboard
   */
  private async cleanDashboardStats(): Promise<void> {
    try {
      const dashboardStats = JSON.parse(localStorage.getItem(STORAGE_KEYS.DASHBOARD_STATS) || '{}');

      if (Object.keys(dashboardStats).length === 0) return;

      const isMockStats = this.isMockDashboardStats(dashboardStats);

      if (isMockStats) {
        const cleanStats = {
          totalSales: 0,
          totalTransactions: 0,
          averagePerDay: 0,
          monthlyGrowth: 0
        };

        localStorage.setItem(STORAGE_KEYS.DASHBOARD_STATS, JSON.stringify(cleanStats));
        this.markAsCleaned(STORAGE_KEYS.DASHBOARD_STATS);
        this.results.itemsRemoved++;
        this.results.details.dashboardStats = {
          original: dashboardStats,
          cleaned: cleanStats
        };
        console.log(`🗑️  Reseteando estadísticas mock del dashboard`);
      }
    } catch (error) {
      console.error('❌ Error limpiando estadísticas del dashboard:', error);
    }
  }

  /**
   * Inicializa configuración del sistema si no existe
   */
  private async cleanSystemConfig(): Promise<void> {
    try {
      const systemConfig = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);

      if (!systemConfig) {
        const defaultConfig = {
          allowNegativeStock: false,
          stockWarningThreshold: 120,
          defaultCurrency: 'ARS',
          dateFormat: 'DD/MM/YYYY',
          autoBackup: true,
          enableAuditLog: true,
          maxStockAlerts: 50,
          debugMode: false,
        };

        localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(defaultConfig));
        console.log(`✨ Inicializando configuración del sistema`);
      }
    } catch (error) {
      console.error('❌ Error inicializando configuración del sistema:', error);
    }
  }

  /**
   * Verifica si una venta es mock/legacy
   */
  private isMockSale(sale: any): boolean {
    if (!sale) return false;

    const mockIdentifiers = MOCK_DATA_IDENTIFIERS.sales;

    return (
      mockIdentifiers.includes(sale.client?.name) ||
      mockIdentifiers.includes(sale.number) ||
      mockIdentifiers.includes(sale.seller?.name) ||
      mockIdentifiers.includes(sale.amount) ||
      (sale.client?.email && (
        sale.client.email.includes('juan@email.com') ||
        sale.client.email.includes('maria@email.com') ||
        sale.client.email.includes('pedro@email.com')
      ))
    );
  }

  /**
   * Verifica si una cuenta es mock/legacy
   */
  private isMockAccount(account: any): boolean {
    if (!account) return false;

    const mockIdentifiers = MOCK_DATA_IDENTIFIERS.accounts;

    return (
      mockIdentifiers.includes(account.name) ||
      mockIdentifiers.includes(account.bankName) ||
      mockIdentifiers.includes(account.accountNumber) ||
      mockIdentifiers.includes(account.balance) ||
      (account.description && account.description.includes('operaciones diarias')) ||
      (account.description && account.description.includes('dinero en efectivo'))
    );
  }

  /**
   * Verifica si una transacción es mock/legacy
   */
  private isMockTransaction(transaction: any): boolean {
    if (!transaction) return false;

    const mockIdentifiers = MOCK_DATA_IDENTIFIERS.transactions;

    return (
      mockIdentifiers.includes(transaction.description) ||
      mockIdentifiers.includes(transaction.reference) ||
      (transaction.description && transaction.description.includes('Juan Pérez')) ||
      (transaction.description && transaction.description.includes('TechDistributor'))
    );
  }

  /**
   * Verifica si las estadísticas del dashboard son mock/legacy
   */
  private isMockDashboardStats(stats: any): boolean {
    if (!stats) return false;

    const mockValues = MOCK_DATA_IDENTIFIERS.dashboard;

    return (
      mockValues.includes(stats.totalSales) ||
      mockValues.includes(stats.totalTransactions) ||
      mockValues.includes(stats.averagePerDay) ||
      mockValues.includes(stats.monthlyGrowth)
    );
  }

  /**
   * Marca una clave como limpiada
   */
  private markAsCleaned(key: string): void {
    this.results.cleaned = true;
    if (!this.results.keysAffected.includes(key)) {
      this.results.keysAffected.push(key);
    }
  }
}

/**
 * Función de utilidad para ejecutar limpieza automática
 */
export const runAutoCleanup = async (): Promise<CleanupResult> => {
  const cleanup = new DataCleanup();
  return await cleanup.runCleanup();
};

/**
 * Hook para detectar si hay datos legacy en el sistema
 */
export const hasLegacyData = (): boolean => {
  try {
    // Verificar ventas
    const salesData = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
    if (salesData.some((sale: any) =>
      sale.client?.name === 'Juan Pérez' ||
      sale.number === 'VTA-2024-001'
    )) {
      return true;
    }

    // Verificar cuentas
    const accountsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    if (accountsData.some((account: any) =>
      account.name === 'Cuenta Principal' ||
      account.balance === 150000
    )) {
      return true;
    }

    // Verificar dashboard stats
    const dashboardStats = JSON.parse(localStorage.getItem(STORAGE_KEYS.DASHBOARD_STATS) || '{}');
    if (dashboardStats.totalSales === 87420) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verificando datos legacy:', error);
    return false;
  }
};