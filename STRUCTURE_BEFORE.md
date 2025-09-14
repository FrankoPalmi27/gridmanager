# Grid Manager - Estructura Original (Pre-Limpieza)

## 📁 Estructura Completa del Proyecto

```
Grid Manager/
├── .claude/
│   └── settings.local.json
├── apps/
│   ├── api/
│   │   ├── dist/                    # ❌ TO DELETE - Compiled output
│   │   │   ├── __tests__/           # (17 files)
│   │   │   ├── middleware/          # (6 files)
│   │   │   ├── routes/              # (20 files)
│   │   │   ├── types/               # (2 files)
│   │   │   ├── utils/               # (4 files)
│   │   │   └── server files         # (16 files)
│   │   ├── src/
│   │   │   ├── __tests__/
│   │   │   │   ├── auth.test.ts
│   │   │   │   └── setup.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── validation.ts
│   │   │   ├── routes/
│   │   │   │   ├── accounts.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── customers.ts
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── purchases.ts
│   │   │   │   ├── reports.ts
│   │   │   │   ├── sales.ts
│   │   │   │   ├── suppliers.ts
│   │   │   │   └── users.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   ├── auth.ts
│   │   │   │   └── pagination.ts
│   │   │   ├── mock-server.ts
│   │   │   ├── seed.ts
│   │   │   ├── server.ts
│   │   │   └── server-fixed.ts     # ⚠️ REVIEW - Alternative implementation
│   │   ├── create-admin.js         # ❌ TO DELETE - Development script
│   │   ├── test-data.js            # ❌ TO DELETE - Test script
│   │   ├── test-db.js              # ❌ TO DELETE - Test script  
│   │   ├── test-password.js        # ❌ TO DELETE - Test script
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── dist/                   # ❌ TO DELETE - Build output
│       │   └── assets/             # (4 files)
│       ├── src/
│       │   ├── components/
│       │   │   ├── auth/
│       │   │   │   └── ProtectedRoute.tsx
│       │   │   ├── forms/
│       │   │   │   ├── CategoryModal.tsx
│       │   │   │   ├── CustomerModal.tsx
│       │   │   │   ├── ProductForm.tsx
│       │   │   │   ├── SalesForm.tsx      # 🔄 DUPLICATED localStorage logic
│       │   │   │   └── TransferModal.tsx
│       │   │   ├── layout/
│       │   │   │   ├── Header.tsx         # 📝 TODO comments
│       │   │   │   ├── Layout.tsx
│       │   │   │   └── Sidebar.tsx
│       │   │   ├── tables/
│       │   │   │   └── CategoriesTable.tsx
│       │   │   ├── ui/
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── EmptyState.tsx
│       │   │   │   ├── Input.tsx
│       │   │   │   ├── LoadingSkeleton.tsx
│       │   │   │   ├── Modal.tsx
│       │   │   │   ├── SearchableSelect.tsx
│       │   │   │   ├── StatusBadge.tsx
│       │   │   │   └── Tabs.tsx
│       │   │   └── BulkProductImport.tsx
│       │   ├── hooks/
│       │   │   ├── useDebounce.ts
│       │   │   └── useLocalStorage.ts
│       │   ├── lib/
│       │   │   ├── api.ts
│       │   │   ├── formatters.ts
│       │   │   └── utils.ts               # ⚠️ Some unused utilities
│       │   ├── pages/
│       │   │   ├── AccountsPage.tsx       # 🔄 DUPLICATED scroll + localStorage
│       │   │   ├── CalculatorPage.tsx
│       │   │   ├── CustomersPage.tsx      # 🔄 DUPLICATED scroll + localStorage
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── LoginPage.tsx
│       │   │   ├── ProductsPage.tsx       # 🔄 DUPLICATED scroll + localStorage
│       │   │   ├── PurchasesPage.tsx
│       │   │   ├── ReportsPage.tsx
│       │   │   ├── SalesPage.tsx          # 🔄 DUPLICATED scroll + console.logs
│       │   │   ├── SuppliersPage.tsx      # 🔄 DUPLICATED scroll + TODO functions
│       │   │   └── UsersPage.tsx
│       │   ├── store/                     # ⚠️ DIRECTORY INCONSISTENCY
│       │   │   ├── accountsStore.ts       # 🔄 DUPLICATED localStorage
│       │   │   ├── authStore.ts
│       │   │   ├── customersStore.ts      # 🔄 DUPLICATED localStorage
│       │   │   ├── productsStore.ts       # 🔄 DUPLICATED localStorage
│       │   │   ├── SalesContext.tsx       # 🔄 Mixed state approach
│       │   │   └── salesStore.ts          # 🔄 DUPLICATED localStorage
│       │   ├── stores/                    # ⚠️ DIRECTORY INCONSISTENCY
│       │   │   └── suppliersStore.ts      # 🔄 Need to move to store/
│       │   ├── utils/
│       │   │   └── pdfGenerator.ts
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
├── packages/
│   └── types/
│       ├── dist/                          # ❌ TO DELETE - Compiled output
│       │   ├── index.d.ts
│       │   └── index.js
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── docs/
│   └── logica-del-programa.md
├── netlify/
│   └── functions/
│       └── api.ts
├── test-connection.js                     # ❌ TO DELETE - Root test file
├── test-dotenv.js                         # ❌ TO DELETE - Root test file
├── CLAUDE.md                              # ✅ Main documentation
├── README.md                              # ✅ Project documentation
├── package.json                           # ✅ Root package.json
└── (other config files)
```

## 🔍 Análisis de Duplicaciones Identificadas

### 1. localStorage Utilities (6 archivos)
**Patrón duplicado:**
```typescript
const loadFromStorage = <T>(key: string, defaultValue: T): T => { ... }
const saveToStorage = <T>(key: string, value: T): void => { ... }
```
**Ubicaciones:** store/customersStore.ts, store/accountsStore.ts, store/salesStore.ts, store/productsStore.ts, pages/AccountsPage.tsx, components/forms/SalesForm.tsx

### 2. Table Scroll Logic (5 archivos)
**Patrón duplicado:**
```typescript
const tableScrollRef = React.useRef<HTMLDivElement>(null);
const scrollLeft = () => { ... };
const scrollRight = () => { ... };
```
**Ubicaciones:** pages/CustomersPage.tsx, pages/SalesPage.tsx, pages/ProductsPage.tsx, pages/AccountsPage.tsx, pages/SuppliersPage.tsx

### 3. Stats Cards Layout (5+ archivos)
**Patrón duplicado:** Grid layout con iconos, títulos y valores estadísticos
**Ubicaciones:** Múltiples páginas con variaciones mínimas

## 🗑️ Archivos Marcados para Eliminación

### 100% Seguros:
- **apps/api/dist/** (65+ archivos) - Output de compilación TypeScript
- **apps/web/dist/** (4 archivos) - Output de build de Vite
- **packages/types/dist/** (2 archivos) - Output de compilación
- **test-connection.js** - Script de testing temporal
- **test-dotenv.js** - Script de testing temporal
- **apps/api/test-*.js** - Scripts de desarrollo/testing

### Requieren Revisión:
- **apps/api/src/server-fixed.ts** - Implementación alternativa
- **Console.log statements** - 28+ statements en 8 archivos
- **TODO functions** - SuppliersPage.tsx funciones sin implementar

## 📊 Métricas Pre-Limpieza

- **Total archivos**: 144
- **Archivos en /dist/**: 71 (49% del total)
- **Archivos fuente**: 73
- **Duplicaciones identificadas**: 35% del código de utilidades
- **Tamaño estimado dist folders**: 20-50 MB
- **Líneas de código duplicado**: ~400 líneas

## 🎯 Estado de Dependencias NPM

**apps/web/package.json** - Todas las dependencias parecen usadas:
- React ecosystem: ✅ Usado extensivamente
- UI libraries: ✅ @headlessui/react, @heroicons/react, lucide-react
- Forms: ✅ react-hook-form, @hookform/resolvers, zod
- Data fetching: ✅ @tanstack/react-query, axios
- PDF generation: ✅ html2canvas, jspdf
- Charts: ✅ recharts
- State: ✅ zustand
- Routing: ✅ react-router-dom

**No se detectaron dependencias sin uso que requieran eliminación.**

---

**Timestamp**: 2025-01-13 19:30 UTC  
**Git Commit**: 7d3526d (backup branch)  
**Status**: Estructura documentada, listo para limpieza  