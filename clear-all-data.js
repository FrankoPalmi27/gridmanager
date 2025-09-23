#!/usr/bin/env node

/**
 * SCRIPT PARA LIMPIAR TODOS LOS DATOS DE DEMOSTRACIÓN
 *
 * Este script limpia completamente el localStorage y restablece
 * la aplicación a un estado inicial limpio sin datos precargados.
 */

const fs = require('fs');
const path = require('path');

// Lista de todas las claves de localStorage que deben ser limpiadas
const STORAGE_KEYS = {
  CUSTOMERS: 'gridmanager_customers',
  PRODUCTS: 'gridmanager_products',
  CATEGORIES: 'gridmanager_categories',
  STOCK_MOVEMENTS: 'gridmanager_stock_movements',
  SALES: 'gridmanager_sales',
  ACCOUNTS: 'gridmanager_accounts',
  TRANSACTIONS: 'gridmanager_transactions',
  SUPPLIERS: 'gridmanager_suppliers',
  PURCHASES: 'gridmanager_purchases',
  PURCHASE_STATS: 'gridmanager_purchase_stats',
  AUTH: 'gridmanager_auth',
  DASHBOARD_STATS: 'gridmanager_dashboard_stats',
  SYSTEM_CONFIG: 'gridmanager_system_config',
};

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

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

// Simular localStorage para generar el script de limpieza
class LocalStorageCleaner {
  constructor() {
    this.clearedKeys = [];
    this.errors = [];
  }

  generateClearScript() {
    const clearCommands = Object.values(STORAGE_KEYS).map(key =>
      `localStorage.removeItem('${key}');`
    ).join('\n    ');

    return `
// Script para ejecutar en el navegador (Consola de DevTools)
// Este script limpia todos los datos de Grid Manager

console.log('🧹 Iniciando limpieza de datos...');

try {
    // Limpiar todas las claves específicas de Grid Manager
    ${clearCommands}

    // Verificar que se limpiaron correctamente
    const remainingKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gridmanager_')) {
            remainingKeys.push(key);
        }
    }

    if (remainingKeys.length === 0) {
        console.log('✅ Todos los datos han sido limpiados correctamente');
        console.log('🔄 Recarga la página para ver la aplicación en estado limpio');
    } else {
        console.warn('⚠️ Algunas claves no se pudieron limpiar:', remainingKeys);
    }

} catch (error) {
    console.error('❌ Error durante la limpieza:', error);
}
`;
  }

  validateCleanState() {
    log(`${colors.bright}${colors.magenta}🧹 VALIDANDO ESTADO LIMPIO DE LA APLICACIÓN${colors.reset}`);

    const validationResults = {
      salesStore: this.validateSalesStore(),
      accountsStore: this.validateAccountsStore(),
      dashboardStats: this.validateDashboardStats(),
      activitySection: this.validateActivitySection()
    };

    let allClean = true;
    let totalIssues = 0;

    for (const [component, result] of Object.entries(validationResults)) {
      if (result.issues.length > 0) {
        allClean = false;
        totalIssues += result.issues.length;
        logError(`${component}: ${result.issues.length} problemas encontrados`);
        result.issues.forEach(issue => log(`  - ${issue}`, colors.red));
      } else {
        logSuccess(`${component}: Limpio`);
      }
    }

    if (allClean) {
      logSuccess(`\n🎉 APLICACIÓN COMPLETAMENTE LIMPIA - Sin datos precargados`);
    } else {
      logError(`\n🚨 ${totalIssues} PROBLEMAS ENCONTRADOS - Requieren atención`);
    }

    return { allClean, totalIssues, results: validationResults };
  }

  validateSalesStore() {
    const issues = [];

    // Verificar que el salesStore no tenga datos mock
    const salesStorePath = 'apps/web/src/store/salesStore.ts';
    try {
      if (fs.existsSync(salesStorePath)) {
        const content = fs.readFileSync(salesStorePath, 'utf8');

        // Verificar stats iniciales
        if (content.includes('totalSales: 87420') || content.includes('totalTransactions: 142')) {
          issues.push('Dashboard stats still contain mock data');
        }

        // Verificar que stats estén en 0
        if (!content.includes('totalSales: 0') || !content.includes('totalTransactions: 0')) {
          issues.push('Dashboard stats not properly reset to zero');
        }
      }
    } catch (error) {
      issues.push(`Error reading salesStore: ${error.message}`);
    }

    return { issues };
  }

  validateAccountsStore() {
    const issues = [];

    const accountsStorePath = 'apps/web/src/store/accountsStore.ts';
    try {
      if (fs.existsSync(accountsStorePath)) {
        const content = fs.readFileSync(accountsStorePath, 'utf8');

        // Verificar que no haya cuentas precargadas
        if (content.includes('Banco ARS') || content.includes('Efectivo ARS')) {
          issues.push('AccountsStore still contains pre-loaded accounts');
        }

        // Verificar array vacío
        if (!content.includes('const initialAccounts: Account[] = [];')) {
          issues.push('AccountsStore initialAccounts not properly emptied');
        }
      }
    } catch (error) {
      issues.push(`Error reading accountsStore: ${error.message}`);
    }

    return { issues };
  }

  validateDashboardStats() {
    const issues = [];

    const salesStorePath = 'apps/web/src/store/salesStore.ts';
    try {
      if (fs.existsSync(salesStorePath)) {
        const content = fs.readFileSync(salesStorePath, 'utf8');

        if (!content.includes('// Estado inicial del dashboard - LIMPIO')) {
          issues.push('Dashboard stats comment not updated');
        }
      }
    } catch (error) {
      issues.push(`Error validating dashboard stats: ${error.message}`);
    }

    return { issues };
  }

  validateActivitySection() {
    const issues = [];

    const dashboardPath = 'apps/web/src/pages/DashboardPage.tsx';
    try {
      if (fs.existsSync(dashboardPath)) {
        const content = fs.readFileSync(dashboardPath, 'utf8');

        // Verificar que no tenga actividad estática
        if (content.includes('Cliente: Juan Pérez - $2,500')) {
          issues.push('Dashboard still contains static activity data');
        }

        // Verificar que tenga estado vacío
        if (!content.includes('No hay actividad reciente')) {
          issues.push('Dashboard does not have empty state for activity');
        }
      }
    } catch (error) {
      issues.push(`Error validating activity section: ${error.message}`);
    }

    return { issues };
  }

  generateCleanupReport() {
    const report = {
      timestamp: new Date().toISOString(),
      storageKeys: Object.keys(STORAGE_KEYS).length,
      cleanupScript: this.generateClearScript(),
      validation: this.validateCleanState(),
      instructions: {
        browser: [
          '1. Abrir DevTools (F12)',
          '2. Ir a la pestaña Console',
          '3. Pegar el script de limpieza',
          '4. Presionar Enter',
          '5. Recargar la página (F5)'
        ],
        developer: [
          '1. Los stores ya están limpios en el código',
          '2. Para testing local, ejecutar el script del navegador',
          '3. Para producción, los usuarios nuevos ya verán el estado limpio',
          '4. Los usuarios existentes pueden limpiar con el script'
        ]
      }
    };

    // Guardar reporte
    try {
      fs.writeFileSync('./cleanup-report.json', JSON.stringify(report, null, 2));
      logSuccess('Reporte de limpieza guardado en cleanup-report.json');
    } catch (error) {
      logError(`Error guardando reporte: ${error.message}`);
    }

    // Guardar script del navegador
    try {
      fs.writeFileSync('./browser-cleanup-script.js', report.cleanupScript);
      logSuccess('Script del navegador guardado en browser-cleanup-script.js');
    } catch (error) {
      logError(`Error guardando script: ${error.message}`);
    }

    return report;
  }

  printSummary(report) {
    log(`\n${colors.bright}${colors.blue}📋 RESUMEN DE LIMPIEZA${colors.reset}`);
    log(`${colors.cyan}Timestamp: ${report.timestamp}${colors.reset}`);
    log(`${colors.cyan}Storage keys a limpiar: ${report.storageKeys}${colors.reset}`);

    if (report.validation.allClean) {
      log(`${colors.green}✅ Código fuente: LIMPIO${colors.reset}`);
    } else {
      log(`${colors.red}❌ Código fuente: ${report.validation.totalIssues} problemas${colors.reset}`);
    }

    log(`\n${colors.bright}🎯 PRÓXIMOS PASOS:${colors.reset}`);
    log(`${colors.yellow}Para desarrolladores:${colors.reset}`);
    report.instructions.developer.forEach(step => log(`  ${step}`));

    log(`\n${colors.yellow}Para usuarios existentes (limpiar datos locales):${colors.reset}`);
    report.instructions.browser.forEach(step => log(`  ${step}`));

    log(`\n${colors.bright}📁 Archivos generados:${colors.reset}`);
    log(`  📄 cleanup-report.json - Reporte completo`);
    log(`  🟨 browser-cleanup-script.js - Script para navegador`);
  }
}

// Ejecución principal
async function main() {
  const cleaner = new LocalStorageCleaner();
  const report = cleaner.generateCleanupReport();
  cleaner.printSummary(report);
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { LocalStorageCleaner };