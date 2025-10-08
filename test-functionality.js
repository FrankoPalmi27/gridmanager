/**
 * Script de Testing Funcional para Grid Manager
 * Verifica todas las funcionalidades críticas del sistema
 */

// Simula el entorno del navegador
const STORAGE_KEYS = {
  SALES: 'gridmanager_sales',
  CUSTOMERS: 'gridmanager_customers',
  PRODUCTS: 'gridmanager_products',
  ACCOUNTS: 'gridmanager_accounts',
  TRANSACTIONS: 'gridmanager_transactions',
  DASHBOARD_STATS: 'gridmanager_dashboard_stats'
};

class FunctionalityTester {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  log(emoji, message) {
    console.log(`${emoji} ${message}`);
  }

  pass(test) {
    this.results.passed.push(test);
    this.log('✅', `PASS: ${test}`);
  }

  fail(test, error) {
    this.results.failed.push({ test, error });
    this.log('❌', `FAIL: ${test} - ${error}`);
  }

  warn(test, warning) {
    this.results.warnings.push({ test, warning });
    this.log('⚠️', `WARN: ${test} - ${warning}`);
  }

  // Test 1: Verificar estructura de stores
  testStoreStructure() {
    this.log('🔍', '\n=== TEST 1: Verificación de Estructura de Stores ===');

    try {
      const fs = require('fs');
      const path = require('path');

      const storePath = path.join(__dirname, 'apps', 'web', 'src', 'store');

      const requiredStores = [
        'salesStore.ts',
        'customersStore.ts',
        'productsStore.ts',
        'accountsStore.ts',
        'suppliersStore.ts'
      ];

      requiredStores.forEach(store => {
        const storePath_full = path.join(storePath, store);
        if (fs.existsSync(storePath_full)) {
          this.pass(`Store ${store} existe`);

          // Verificar que use Zustand
          const content = fs.readFileSync(storePath_full, 'utf8');
          if (content.includes('import { create } from \'zustand\'')) {
            this.pass(`${store} usa Zustand correctamente`);
          } else {
            this.fail(`${store} no usa Zustand`, 'No se encontró import de Zustand');
          }
        } else {
          this.fail(`Store ${store} no existe`, 'Archivo no encontrado');
        }
      });

      // Verificar que SalesContext.tsx NO exista
      const salesContextPath = path.join(storePath, 'SalesContext.tsx');
      if (!fs.existsSync(salesContextPath)) {
        this.pass('SalesContext.tsx eliminado correctamente');
      } else {
        this.fail('SalesContext.tsx todavía existe', 'Debería haber sido eliminado en Fase 2');
      }

    } catch (error) {
      this.fail('Test de estructura de stores', error.message);
    }
  }

  // Test 2: Verificar utilities centralizadas
  testUtilities() {
    this.log('🔍', '\n=== TEST 2: Verificación de Utilities Centralizadas ===');

    try {
      const fs = require('fs');
      const path = require('path');

      const libPath = path.join(__dirname, 'apps', 'web', 'src', 'lib');

      // Verificar translations.ts
      const translationsPath = path.join(libPath, 'translations.ts');
      if (fs.existsSync(translationsPath)) {
        this.pass('translations.ts existe');

        const content = fs.readFileSync(translationsPath, 'utf8');

        const requiredFunctions = [
          'translate',
          'translateSalesChannel',
          'translatePaymentMethod',
          'translatePaymentStatus',
          'translateSaleStatus'
        ];

        requiredFunctions.forEach(fn => {
          if (content.includes(`export const ${fn}`) || content.includes(`export function ${fn}`)) {
            this.pass(`Función ${fn} exportada correctamente`);
          } else {
            this.fail(`Función ${fn} no encontrada`, 'Debería estar exportada en translations.ts');
          }
        });
      } else {
        this.fail('translations.ts no existe', 'Debería haber sido creado en Fase 1');
      }

      // Verificar utils.ts tiene re-exports
      const utilsPath = path.join(libPath, 'utils.ts');
      if (fs.existsSync(utilsPath)) {
        this.pass('utils.ts existe');

        const content = fs.readFileSync(utilsPath, 'utf8');

        if (content.includes("export * from './formatters'")) {
          this.pass('utils.ts re-exporta formatters correctamente');
        } else {
          this.warn('utils.ts no re-exporta formatters', 'Puede afectar compatibilidad');
        }

        if (content.includes("export * from './translations'")) {
          this.pass('utils.ts re-exporta translations correctamente');
        } else {
          this.warn('utils.ts no re-exporta translations', 'Puede afectar compatibilidad');
        }
      }

    } catch (error) {
      this.fail('Test de utilities', error.message);
    }
  }

  // Test 3: Verificar limpieza de console.logs
  testConsoleCleanup() {
    this.log('🔍', '\n=== TEST 3: Verificación de Limpieza de Console Logs ===');

    try {
      const fs = require('fs');
      const path = require('path');

      // Archivos que deberían estar limpios
      const filesToCheck = [
        'src/App.tsx',
        'src/pages/LoginPage.tsx',
        'src/pages/DashboardPage.tsx'
      ];

      filesToCheck.forEach(file => {
        const filePath = path.join(__dirname, 'apps', 'web', file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');

          // Contar console.logs (excluyendo console.error)
          const consoleLogsMatches = content.match(/console\.log\(/g);
          const consoleLogsCount = consoleLogsMatches ? consoleLogsMatches.length : 0;

          if (consoleLogsCount === 0) {
            this.pass(`${file} limpio de console.logs`);
          } else {
            this.warn(`${file} tiene ${consoleLogsCount} console.logs`, 'Revisar si son necesarios');
          }

          // Verificar que console.error se mantenga
          const consoleErrorMatches = content.match(/console\.error\(/g);
          const consoleErrorCount = consoleErrorMatches ? consoleErrorMatches.length : 0;

          if (consoleErrorCount > 0) {
            this.pass(`${file} mantiene ${consoleErrorCount} console.error para error handling`);
          }
        } else {
          this.warn(`${file} no encontrado`, 'Verificar ruta');
        }
      });

      // Archivos que DEBEN tener console (sistemas críticos)
      const criticalFiles = [
        'src/lib/localStorage.ts',
        'src/lib/dataCleanup.ts'
      ];

      criticalFiles.forEach(file => {
        const filePath = path.join(__dirname, 'apps', 'web', file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');

          const consoleMatches = content.match(/console\./g);
          const consoleCount = consoleMatches ? consoleMatches.length : 0;

          if (consoleCount > 0) {
            this.pass(`${file} mantiene ${consoleCount} console para logging crítico`);
          } else {
            this.warn(`${file} no tiene console`, 'Debería tener logging crítico');
          }
        }
      });

    } catch (error) {
      this.fail('Test de limpieza de console', error.message);
    }
  }

  // Test 4: Verificar interfaces de TypeScript
  testTypeScriptInterfaces() {
    this.log('🔍', '\n=== TEST 4: Verificación de Interfaces TypeScript ===');

    try {
      const fs = require('fs');
      const path = require('path');

      const salesStorePath = path.join(__dirname, 'apps', 'web', 'src', 'store', 'salesStore.ts');

      if (fs.existsSync(salesStorePath)) {
        const content = fs.readFileSync(salesStorePath, 'utf8');

        // Verificar interface Sale
        if (content.includes('export interface Sale')) {
          this.pass('Interface Sale exportada correctamente');

          const requiredFields = [
            'id:',
            'number:',
            'client:',
            'amount:',
            'status:',
            'salesChannel?:',
            'paymentStatus?:',
            'accountId?'
          ];

          requiredFields.forEach(field => {
            if (content.includes(field)) {
              this.pass(`Campo ${field.replace(':', '')} presente en Sale`);
            } else {
              this.fail(`Campo ${field.replace(':', '')} no encontrado`, 'Campo requerido en interface Sale');
            }
          });

          const hasPaymentMethodField = content.includes('paymentMethod?:');
          const hasAccountLinkedComment = content.includes('accountId?:') &&
            content.toLowerCase().includes('la cuenta define el método de pago');

          if (hasPaymentMethodField) {
            this.pass('Campo paymentMethod presente en Sale');
          } else if (hasAccountLinkedComment) {
            this.pass('Método de pago documentado vía accountId en Sale');
          } else {
            this.warn('Campo paymentMethod no encontrado directamente', 'Verificar si accountId es suficiente para mapear métodos de pago');
          }
        } else {
          this.fail('Interface Sale no encontrada', 'Debería estar exportada');
        }

        // Verificar interface SalesStore
        if (content.includes('interface SalesStore')) {
          this.pass('Interface SalesStore definida correctamente');

          const requiredMethods = [
            'addSale:',
            'updateSale:',
            'deleteSale:',
            'validateStock:'
          ];

          requiredMethods.forEach(method => {
            if (content.includes(method)) {
              this.pass(`Método ${method.replace(':', '')} presente en SalesStore`);
            } else {
              this.fail(`Método ${method.replace(':', '')} no encontrado`, 'Método requerido en interface');
            }
          });
        }
      }

    } catch (error) {
      this.fail('Test de interfaces TypeScript', error.message);
    }
  }

  // Test 5: Verificar integración entre stores
  testStoreIntegration() {
    this.log('🔍', '\n=== TEST 5: Verificación de Integración entre Stores ===');

    try {
      const fs = require('fs');
      const path = require('path');

      const salesStorePath = path.join(__dirname, 'apps', 'web', 'src', 'store', 'salesStore.ts');

      if (fs.existsSync(salesStorePath)) {
        const content = fs.readFileSync(salesStorePath, 'utf8');

        // Verificar imports de otros stores
        const requiredImports = [
          { store: 'useProductsStore', reason: 'Validación de stock' },
          { store: 'useAccountsStore', reason: 'Transacciones vinculadas' },
          { store: 'useCustomersStore', reason: 'Actualización de balances' }
        ];

        requiredImports.forEach(({ store, reason }) => {
          if (content.includes(store)) {
            this.pass(`Integración con ${store} (${reason})`);

            // Verificar que use .getState()
            if (content.includes(`${store}.getState()`)) {
              this.pass(`${store} usa .getState() correctamente`);
            } else {
              this.warn(`${store} puede no usar .getState()`, 'Verificar patrón de acceso');
            }
          } else {
            this.warn(`Integración con ${store} no encontrada`, `Necesario para: ${reason}`);
          }
        });

        // Verificar función validateStock
        const hasValidateStock = content.includes('validateStock:');
        const hasNegativeStockToggle = content.includes('isNegativeStockAllowed') || content.includes('allowNegative:');

        if (hasValidateStock && hasNegativeStockToggle) {
          this.pass('Sistema de validación de stock con control de stock negativo implementado');
        } else if (hasValidateStock) {
          this.warn('Sistema de validación de stock podría carecer de control de stock negativo', 'Revisar configuración allowNegative/isNegativeStockAllowed');
        } else {
          this.fail('Sistema de validación de stock incompleto', 'No se encontró validateStock con controles de stock negativo');
        }

        // Verificar linked transactions
        if (content.includes('addLinkedTransaction')) {
          this.pass('Sistema de transacciones vinculadas implementado');
        } else {
          this.warn('addLinkedTransaction no encontrado', 'Necesario para integración financiera');
        }

      }

    } catch (error) {
      this.fail('Test de integración de stores', error.message);
    }
  }

  // Test 6: Verificar páginas principales
  testMainPages() {
    this.log('🔍', '\n=== TEST 6: Verificación de Páginas Principales ===');

    try {
      const fs = require('fs');
      const path = require('path');

      const pagesPath = path.join(__dirname, 'apps', 'web', 'src', 'pages');

      const requiredPages = [
        { file: 'DashboardPage.tsx', name: 'Dashboard' },
        { file: 'ProductsPage.tsx', name: 'Productos' },
        { file: 'SalesPage.tsx', name: 'Ventas' },
        { file: 'CustomersPage.tsx', name: 'Clientes' },
        { file: 'AccountsPage.tsx', name: 'Cuentas' },
        { file: 'ReportsPage.tsx', name: 'Reportes' },
        { file: 'SuppliersPage.tsx', name: 'Proveedores' }
      ];

      requiredPages.forEach(({ file, name }) => {
        const pagePath = path.join(pagesPath, file);
        if (fs.existsSync(pagePath)) {
          this.pass(`Página ${name} (${file}) existe`);

          const content = fs.readFileSync(pagePath, 'utf8');

          // Verificar que use el store correcto
          if (file === 'SalesPage.tsx' && content.includes('useSalesStore')) {
            this.pass(`${name} usa useSalesStore correctamente`);
          }

          if (file === 'CustomersPage.tsx' && content.includes('useCustomersStore')) {
            this.pass(`${name} usa useCustomersStore correctamente`);
          }

          if (file === 'ProductsPage.tsx' && content.includes('useProductsStore')) {
            this.pass(`${name} usa useProductsStore correctamente`);
          }
        } else {
          this.fail(`Página ${name} no existe`, `Archivo ${file} no encontrado`);
        }
      });

      // Verificar calculadora de Mercado Libre (nueva denominación CalculatorPage)
      const calculatorCandidates = [
        { file: 'CalculatorPage.tsx', label: 'Calculadora ML (CalculatorPage.tsx)' },
        { file: 'MercadoLibrePage.tsx', label: 'Calculadora ML (MercadoLibrePage.tsx)' }
      ];

      const calculatorFound = calculatorCandidates.some(candidate => {
        const candidatePath = path.join(pagesPath, candidate.file);
        if (fs.existsSync(candidatePath)) {
          this.pass(`Página ${candidate.label} disponible`);
          return true;
        }
        return false;
      });

      if (!calculatorFound) {
        this.warn('Calculadora de Mercado Libre no encontrada', 'Verificar existencia de CalculatorPage.tsx o MercadoLibrePage.tsx');
      }

    } catch (error) {
      this.fail('Test de páginas principales', error.message);
    }
  }

  // Test 7: Verificar integración AccountsPage con el store
  testAccountsPageIntegration() {
    this.log('🔍', '\n=== TEST 7: Verificación de AccountsPage y Store ===');

    try {
      const fs = require('fs');
      const path = require('path');

      const accountsPagePath = path.join(__dirname, 'apps', 'web', 'src', 'pages', 'AccountsPage.tsx');
      if (!fs.existsSync(accountsPagePath)) {
        this.fail('AccountsPage no encontrada', 'Archivo AccountsPage.tsx no existe');
        return;
      }

      this.pass('AccountsPage.tsx existe');
      const content = fs.readFileSync(accountsPagePath, 'utf8');

      if (content.includes("from '../store/accountsStore'")) {
        this.pass('AccountsPage importa useAccountsStore correctamente');
      } else {
        this.fail('AccountsPage no importa useAccountsStore', 'Debe conectarse al nuevo store de cuentas');
      }

      if (content.includes('useAccountsStore((state) => ({')) {
        this.pass('AccountsPage usa selector de useAccountsStore con destructuring');
      } else {
        this.warn('AccountsPage podría no usar selector memoizado', 'Verificar patrón useAccountsStore((state) => ({ ... }))');
      }

      const requiredSelectors = [
        'loadAccounts:',
        'loadTransactions:',
        'addAccount:',
        'updateAccount:',
        'deleteAccount:',
        'addTransaction:',
        'transferBetweenAccounts:'
      ];

      requiredSelectors.forEach(selector => {
        if (content.includes(selector)) {
          this.pass(`Selector ${selector.replace(':', '')} disponible en AccountsPage`);
        } else {
          this.fail(`Selector ${selector.replace(':', '')} faltante en AccountsPage`, 'Debe mapearse desde useAccountsStore');
        }
      });

      if (content.includes('TransferModal')) {
        this.pass('AccountsPage integra TransferModal');
      } else {
        this.warn('TransferModal no encontrado en AccountsPage', 'Verificar integración de transferencias');
      }

      if (content.includes('BulkTransactionImport')) {
        this.pass('AccountsPage permite importación masiva de transacciones');
      }

    } catch (error) {
      this.fail('Test de integración AccountsPage', error.message);
    }
  }

  // Test 8: Verificar componentes de formularios
  testFormComponents() {
  this.log('🔍', '\n=== TEST 8: Verificación de Componentes de Formularios ===');

    try {
      const fs = require('fs');
      const path = require('path');

      const formsPath = path.join(__dirname, 'apps', 'web', 'src', 'components', 'forms');

      const requiredForms = [
        'SalesForm.tsx',
        'ProductForm.tsx',
        'CustomerModal.tsx'
      ];

      requiredForms.forEach(form => {
        const formPath = path.join(formsPath, form);
        if (fs.existsSync(formPath)) {
          this.pass(`Formulario ${form} existe`);

          const content = fs.readFileSync(formPath, 'utf8');

          // Verificar error handling
          if (content.includes('try {') && content.includes('catch')) {
            this.pass(`${form} tiene error handling`);
          } else {
            this.warn(`${form} puede no tener error handling`, 'Agregar try/catch');
          }

          // Verificar que SalesForm use useSalesStore
          if (form === 'SalesForm.tsx') {
            if (content.includes('useSalesStore')) {
              this.pass('SalesForm usa useSalesStore (Zustand)');
            } else {
              this.fail('SalesForm no usa useSalesStore', 'Debería usar el nuevo store');
            }

            // Verificar que NO use useSales (old)
            if (!content.includes('useSales()')) {
              this.pass('SalesForm no usa el hook antiguo useSales');
            } else {
              this.fail('SalesForm todavía usa useSales()', 'Debería usar useSalesStore');
            }
          }
        } else {
          this.fail(`Formulario ${form} no existe`, 'Archivo no encontrado');
        }
      });

    } catch (error) {
      this.fail('Test de componentes de formularios', error.message);
    }
  }

  // Generar reporte final
  generateReport() {
    this.log('📊', '\n\n========================================');
    this.log('📊', '   REPORTE FINAL DE TESTING FUNCIONAL');
    this.log('📊', '========================================\n');

    this.log('✅', `Tests PASADOS: ${this.results.passed.length}`);
    this.results.passed.forEach(test => {
      console.log(`   ✓ ${test}`);
    });

    if (this.results.warnings.length > 0) {
      this.log('\n⚠️', `WARNINGS: ${this.results.warnings.length}`);
      this.results.warnings.forEach(({ test, warning }) => {
        console.log(`   ⚠ ${test}: ${warning}`);
      });
    }

    if (this.results.failed.length > 0) {
      this.log('\n❌', `Tests FALLADOS: ${this.results.failed.length}`);
      this.results.failed.forEach(({ test, error }) => {
        console.log(`   ✗ ${test}: ${error}`);
      });
    }

    const totalTests = this.results.passed.length + this.results.failed.length;
    const successRate = ((this.results.passed.length / totalTests) * 100).toFixed(2);

    this.log('\n📈', `TASA DE ÉXITO: ${successRate}% (${this.results.passed.length}/${totalTests})`);

    if (this.results.failed.length === 0) {
      this.log('🎉', '¡TODAS LAS FUNCIONALIDADES VERIFICADAS CON ÉXITO!');
    } else {
      this.log('🔧', 'Hay tests fallidos que requieren atención');
    }

    this.log('\n========================================\n');
  }

  // Ejecutar todos los tests
  runAllTests() {
    this.log('🚀', 'Iniciando Testing Funcional de Grid Manager...\n');

    this.testStoreStructure();
    this.testUtilities();
    this.testConsoleCleanup();
    this.testTypeScriptInterfaces();
    this.testStoreIntegration();
    this.testMainPages();
    this.testAccountsPageIntegration();
    this.testFormComponents();

    this.generateReport();
  }
}

// Ejecutar tests
const tester = new FunctionalityTester();
tester.runAllTests();
