#!/usr/bin/env node

/**
 * SCRIPT DE TESTING PARA LIMPIEZA AUTOMÁTICA
 *
 * Este script simula el localStorage con datos legacy
 * y verifica que el sistema de limpieza automática funcione correctamente.
 */

const fs = require('fs');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

// Datos legacy de prueba (simulando localStorage con datos viejos)
const LEGACY_DATA = {
  sales: [
    {
      id: 1,
      number: 'VTA-2024-001',
      client: { name: 'Juan Pérez', email: 'juan@email.com', avatar: 'JP' },
      amount: 25000,
      date: '2024-01-15',
      status: 'completed',
      seller: { name: 'Ana García', initials: 'AG' },
      items: 3
    },
    {
      id: 2,
      number: 'VTA-2024-002',
      client: { name: 'María López', email: 'maria@email.com', avatar: 'ML' },
      amount: 45000,
      date: '2024-01-16',
      status: 'pending',
      seller: { name: 'Carlos Ruiz', initials: 'CR' },
      items: 7
    },
    {
      id: 3,
      number: 'VTA-2024-003',
      client: { name: 'Pedro Martín', email: 'pedro@email.com', avatar: 'PM' },
      amount: 18500,
      date: '2024-01-17',
      status: 'cancelled',
      seller: { name: 'Ana García', initials: 'AG' },
      items: 2
    }
  ],
  accounts: [
    {
      id: '1',
      name: 'Cuenta Principal',
      accountNumber: '1234567890',
      bankName: 'Banco Nación',
      accountType: 'Cuenta Corriente',
      balance: 150000,
      currency: 'ARS',
      active: true,
      description: 'Cuenta principal para operaciones diarias'
    },
    {
      id: '2',
      name: 'Caja Fuerte',
      accountNumber: 'CASH-001',
      bankName: 'Efectivo',
      accountType: 'Efectivo',
      balance: 25000,
      currency: 'ARS',
      active: true,
      description: 'Dinero en efectivo en caja'
    }
  ],
  transactions: [
    {
      id: '1',
      accountId: '1',
      type: 'income',
      amount: 45000,
      description: 'Venta a Juan Pérez',
      date: '2024-01-20',
      category: 'Ventas',
      reference: 'VTA-2024-001'
    },
    {
      id: '2',
      accountId: '1',
      type: 'expense',
      amount: 15000,
      description: 'Pago a proveedor TechDistributor',
      date: '2024-01-19',
      category: 'Proveedores',
      reference: 'PAGO-001'
    }
  ],
  dashboardStats: {
    totalSales: 87420,
    totalTransactions: 142,
    averagePerDay: 2914,
    monthlyGrowth: 18.5
  }
};

// Simular localStorage
class MockLocalStorage {
  constructor() {
    this.data = {};
  }

  getItem(key) {
    return this.data[key] || null;
  }

  setItem(key, value) {
    this.data[key] = value;
  }

  removeItem(key) {
    delete this.data[key];
  }

  key(index) {
    return Object.keys(this.data)[index];
  }

  get length() {
    return Object.keys(this.data).length;
  }

  // Método para inicializar con datos legacy
  initWithLegacyData() {
    this.setItem('gridmanager_sales', JSON.stringify(LEGACY_DATA.sales));
    this.setItem('gridmanager_accounts', JSON.stringify(LEGACY_DATA.accounts));
    this.setItem('gridmanager_transactions', JSON.stringify(LEGACY_DATA.transactions));
    this.setItem('gridmanager_dashboard_stats', JSON.stringify(LEGACY_DATA.dashboardStats));
  }

  // Método para verificar estado limpio
  verifyCleanState() {
    const results = {
      sales: this.checkSalesClean(),
      accounts: this.checkAccountsClean(),
      transactions: this.checkTransactionsClean(),
      dashboardStats: this.checkDashboardStatsClean()
    };

    return results;
  }

  checkSalesClean() {
    const sales = JSON.parse(this.getItem('gridmanager_sales') || '[]');
    const hasLegacy = sales.some(sale =>
      sale.client?.name === 'Juan Pérez' ||
      sale.number === 'VTA-2024-001'
    );
    return { clean: !hasLegacy, count: sales.length, hasLegacy };
  }

  checkAccountsClean() {
    const accounts = JSON.parse(this.getItem('gridmanager_accounts') || '[]');
    const hasLegacy = accounts.some(account =>
      account.name === 'Cuenta Principal' ||
      account.balance === 150000
    );
    return { clean: !hasLegacy, count: accounts.length, hasLegacy };
  }

  checkTransactionsClean() {
    const transactions = JSON.parse(this.getItem('gridmanager_transactions') || '[]');
    const hasLegacy = transactions.some(transaction =>
      transaction.description === 'Venta a Juan Pérez' ||
      transaction.reference === 'VTA-2024-001'
    );
    return { clean: !hasLegacy, count: transactions.length, hasLegacy };
  }

  checkDashboardStatsClean() {
    const stats = JSON.parse(this.getItem('gridmanager_dashboard_stats') || '{}');
    const hasLegacy = stats.totalSales === 87420;
    return { clean: !hasLegacy, stats, hasLegacy };
  }
}

// Simulador del sistema de limpieza (copiado de dataCleanup.ts)
class MockDataCleanup {
  constructor(localStorage) {
    this.localStorage = localStorage;
    this.MOCK_DATA_IDENTIFIERS = {
      sales: [
        'Juan Pérez', 'María López', 'Pedro Martín',
        'VTA-2024-001', 'VTA-2024-002', 'VTA-2024-003',
        'Ana García', 'Carlos Ruiz',
        25000, 45000, 18500,
      ],
      accounts: [
        'Cuenta Principal', 'Caja Fuerte', 'Cuenta USD', 'Tarjeta Empresarial',
        'Banco Nación', 'Banco Galicia', 'Banco Santander',
        '1234567890', '0987654321', 'CASH-001',
        150000, 25000, 5000, -12000,
      ],
      transactions: [
        'Venta a Juan Pérez', 'Pago a proveedor TechDistributor',
        'Venta en efectivo', 'Compra de dólares', 'Gastos de oficina',
        'VTA-2024-001', 'PAGO-001',
      ],
      dashboard: [87420, 142, 2914, 18.5]
    };
  }

  async runCleanup() {
    const results = {
      cleaned: false,
      itemsRemoved: 0,
      keysAffected: [],
      details: {}
    };

    await this.cleanSalesData(results);
    await this.cleanAccountsData(results);
    await this.cleanTransactionsData(results);
    await this.cleanDashboardStats(results);

    return results;
  }

  async cleanSalesData(results) {
    const salesData = JSON.parse(this.localStorage.getItem('gridmanager_sales') || '[]');
    if (!Array.isArray(salesData) || salesData.length === 0) return;

    const cleanedSales = salesData.filter(sale => !this.isMockSale(sale));

    if (cleanedSales.length !== salesData.length) {
      this.localStorage.setItem('gridmanager_sales', JSON.stringify(cleanedSales));
      results.cleaned = true;
      results.itemsRemoved += salesData.length - cleanedSales.length;
      results.keysAffected.push('gridmanager_sales');
      results.details.sales = {
        original: salesData.length,
        cleaned: cleanedSales.length,
        removed: salesData.length - cleanedSales.length
      };
    }
  }

  async cleanAccountsData(results) {
    const accountsData = JSON.parse(this.localStorage.getItem('gridmanager_accounts') || '[]');
    if (!Array.isArray(accountsData) || accountsData.length === 0) return;

    const cleanedAccounts = accountsData.filter(account => !this.isMockAccount(account));

    if (cleanedAccounts.length !== accountsData.length) {
      this.localStorage.setItem('gridmanager_accounts', JSON.stringify(cleanedAccounts));
      results.cleaned = true;
      results.itemsRemoved += accountsData.length - cleanedAccounts.length;
      results.keysAffected.push('gridmanager_accounts');
      results.details.accounts = {
        original: accountsData.length,
        cleaned: cleanedAccounts.length,
        removed: accountsData.length - cleanedAccounts.length
      };
    }
  }

  async cleanTransactionsData(results) {
    const transactionsData = JSON.parse(this.localStorage.getItem('gridmanager_transactions') || '[]');
    if (!Array.isArray(transactionsData) || transactionsData.length === 0) return;

    const cleanedTransactions = transactionsData.filter(transaction => !this.isMockTransaction(transaction));

    if (cleanedTransactions.length !== transactionsData.length) {
      this.localStorage.setItem('gridmanager_transactions', JSON.stringify(cleanedTransactions));
      results.cleaned = true;
      results.itemsRemoved += transactionsData.length - cleanedTransactions.length;
      results.keysAffected.push('gridmanager_transactions');
      results.details.transactions = {
        original: transactionsData.length,
        cleaned: cleanedTransactions.length,
        removed: transactionsData.length - cleanedTransactions.length
      };
    }
  }

  async cleanDashboardStats(results) {
    const dashboardStats = JSON.parse(this.localStorage.getItem('gridmanager_dashboard_stats') || '{}');
    if (Object.keys(dashboardStats).length === 0) return;

    if (this.isMockDashboardStats(dashboardStats)) {
      const cleanStats = {
        totalSales: 0,
        totalTransactions: 0,
        averagePerDay: 0,
        monthlyGrowth: 0
      };

      this.localStorage.setItem('gridmanager_dashboard_stats', JSON.stringify(cleanStats));
      results.cleaned = true;
      results.itemsRemoved++;
      results.keysAffected.push('gridmanager_dashboard_stats');
      results.details.dashboardStats = {
        original: dashboardStats,
        cleaned: cleanStats
      };
    }
  }

  isMockSale(sale) {
    if (!sale) return false;
    const mockIdentifiers = this.MOCK_DATA_IDENTIFIERS.sales;
    return (
      mockIdentifiers.includes(sale.client?.name) ||
      mockIdentifiers.includes(sale.number) ||
      mockIdentifiers.includes(sale.seller?.name) ||
      mockIdentifiers.includes(sale.amount)
    );
  }

  isMockAccount(account) {
    if (!account) return false;
    const mockIdentifiers = this.MOCK_DATA_IDENTIFIERS.accounts;
    return (
      mockIdentifiers.includes(account.name) ||
      mockIdentifiers.includes(account.bankName) ||
      mockIdentifiers.includes(account.accountNumber) ||
      mockIdentifiers.includes(account.balance)
    );
  }

  isMockTransaction(transaction) {
    if (!transaction) return false;
    const mockIdentifiers = this.MOCK_DATA_IDENTIFIERS.transactions;
    return (
      mockIdentifiers.includes(transaction.description) ||
      mockIdentifiers.includes(transaction.reference)
    );
  }

  isMockDashboardStats(stats) {
    if (!stats) return false;
    const mockValues = this.MOCK_DATA_IDENTIFIERS.dashboard;
    return (
      mockValues.includes(stats.totalSales) ||
      mockValues.includes(stats.totalTransactions) ||
      mockValues.includes(stats.averagePerDay) ||
      mockValues.includes(stats.monthlyGrowth)
    );
  }
}

// Testing principal
async function testAutoCleanup() {
  log(`${colors.bright}${colors.magenta}🧪 TESTING SISTEMA DE LIMPIEZA AUTOMÁTICA${colors.reset}`, colors.magenta);

  const storage = new MockLocalStorage();
  const cleanup = new MockDataCleanup(storage);

  // Test 1: Inicializar con datos legacy
  log(`\n${colors.bright}[TEST 1]${colors.reset} Inicializando con datos legacy...`);
  storage.initWithLegacyData();

  const initialState = storage.verifyCleanState();
  log(`  📊 Estado inicial:`);
  log(`    Ventas: ${initialState.sales.count} (legacy: ${initialState.sales.hasLegacy})`);
  log(`    Cuentas: ${initialState.accounts.count} (legacy: ${initialState.accounts.hasLegacy})`);
  log(`    Transacciones: ${initialState.transactions.count} (legacy: ${initialState.transactions.hasLegacy})`);
  log(`    Dashboard stats: legacy = ${initialState.dashboardStats.hasLegacy}`);

  if (initialState.sales.hasLegacy && initialState.accounts.hasLegacy &&
      initialState.transactions.hasLegacy && initialState.dashboardStats.hasLegacy) {
    logSuccess('Datos legacy inicializados correctamente');
  } else {
    logError('Falló la inicialización de datos legacy');
    return false;
  }

  // Test 2: Ejecutar limpieza
  log(`\n${colors.bright}[TEST 2]${colors.reset} Ejecutando sistema de limpieza...`);
  const cleanupResult = await cleanup.runCleanup();

  log(`  🧹 Resultado de limpieza:`);
  log(`    Items removidos: ${cleanupResult.itemsRemoved}`);
  log(`    Claves afectadas: ${cleanupResult.keysAffected.join(', ')}`);
  log(`    Detalles:`, cleanupResult.details);

  if (cleanupResult.cleaned && cleanupResult.itemsRemoved > 0) {
    logSuccess('Limpieza ejecutada correctamente');
  } else {
    logError('La limpieza no funcionó como esperado');
    return false;
  }

  // Test 3: Verificar estado final
  log(`\n${colors.bright}[TEST 3]${colors.reset} Verificando estado final...`);
  const finalState = storage.verifyCleanState();

  log(`  📊 Estado final:`);
  log(`    Ventas: ${finalState.sales.count} (legacy: ${finalState.sales.hasLegacy})`);
  log(`    Cuentas: ${finalState.accounts.count} (legacy: ${finalState.accounts.hasLegacy})`);
  log(`    Transacciones: ${finalState.transactions.count} (legacy: ${finalState.transactions.hasLegacy})`);
  log(`    Dashboard stats: legacy = ${finalState.dashboardStats.hasLegacy}`);

  const allClean = !finalState.sales.hasLegacy && !finalState.accounts.hasLegacy &&
                   !finalState.transactions.hasLegacy && !finalState.dashboardStats.hasLegacy;

  if (allClean) {
    logSuccess('✅ TODOS LOS DATOS LEGACY HAN SIDO LIMPIADOS');
  } else {
    logError('❌ AÚN QUEDAN DATOS LEGACY SIN LIMPIAR');
    return false;
  }

  // Test 4: Verificar preservación de datos válidos
  log(`\n${colors.bright}[TEST 4]${colors.reset} Verificando preservación de datos válidos...`);

  // Agregar datos válidos y verificar que no se eliminen
  const validSale = {
    id: 999,
    number: 'VTA-2025-001',
    client: { name: 'Cliente Real', email: 'real@cliente.com' },
    amount: 12345,
    date: '2025-01-01',
    status: 'completed'
  };

  const currentSales = JSON.parse(storage.getItem('gridmanager_sales') || '[]');
  currentSales.push(validSale);
  storage.setItem('gridmanager_sales', JSON.stringify(currentSales));

  // Ejecutar limpieza nuevamente
  const secondCleanup = await cleanup.runCleanup();

  const salesAfterSecondCleanup = JSON.parse(storage.getItem('gridmanager_sales') || '[]');
  const validSalePreserved = salesAfterSecondCleanup.some(sale => sale.id === 999);

  if (validSalePreserved && !secondCleanup.cleaned) {
    logSuccess('Datos válidos preservados correctamente');
  } else {
    logError('Los datos válidos fueron removidos incorrectamente');
    return false;
  }

  log(`\n${colors.bright}${colors.green}🎉 TODOS LOS TESTS PASARON - SISTEMA DE LIMPIEZA FUNCIONANDO CORRECTAMENTE${colors.reset}`);

  // Generar instrucciones para el usuario
  generateUserInstructions();

  return true;
}

function generateUserInstructions() {
  log(`\n${colors.bright}${colors.blue}📋 INSTRUCCIONES PARA EL USUARIO${colors.reset}`);

  const instructions = `
${colors.yellow}🔄 PARA LIMPIAR DATOS EXISTENTES:${colors.reset}

1. ${colors.cyan}Automático (Recomendado):${colors.reset}
   - La aplicación detectará y limpiará datos legacy automáticamente al cargar
   - Verás una notificación verde cuando se complete la limpieza
   - No requiere acción del usuario

2. ${colors.cyan}Manual (Si es necesario):${colors.reset}
   - Abrir DevTools (F12)
   - Ir a Console
   - Ejecutar: localStorage.clear()
   - Recargar la página

${colors.yellow}✅ DESPUÉS DE LA LIMPIEZA:${colors.reset}
   - Dashboard mostrará stats en 0
   - Página de ventas estará vacía
   - Cuentas empezarán en blanco
   - Sin actividad reciente ficticia

${colors.yellow}📊 PARA VERIFICAR ESTADO LIMPIO:${colors.reset}
   - Dashboard: Todos los números deben estar en 0
   - Ventas: Lista vacía con mensaje "No hay ventas"
   - Cuentas: Sin cuentas precargadas
   - Actividad: "No hay actividad reciente"
`;

  log(instructions);
}

// Ejecutar tests
async function main() {
  try {
    const success = await testAutoCleanup();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logError(`Error durante testing: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testAutoCleanup };