# CLAUDE.md - Grid Manager Documentation

## ⚠️ Estado Actual (octubre 2025)

- **Persistencia limitada**: La versión activa sigue funcionando en modo local-first con Zustand + LocalStorage. No hay sincronización automática entre sesiones ni persistencia en Supabase/Prisma todavía.
- **Interacción incompleta**: Se han detectado botones sin handlers definitivos y formularios que no confirman acciones. Varias páginas requieren wiring adicional para completar el flujo CRUD.
- **Listados inconsistentes**: Algunos módulos (por ejemplo Cuentas y Proveedores) no refrescan la lista tras crear un registro hasta que se recarga manualmente o se inspecciona el store.
- **Diagnóstico en curso**: Se está trabajando en un plan maestro de estabilización. Cada fase de corrección debe referenciar este documento para mantener trazabilidad.
  - Pendiente: captura de evidencia manual desde el frontend requiere navegadores locales; dejar asentado qué versión de Chrome/Firefox se use al hacerlo.
  - Fase 4 · Validación incremental: pendiente de reagendar; Fase 5 se ejecutará con la evidencia disponible en esta iteración.
- **Entorno de reproducción** (07-10-2025): Backend levantado con `npm run dev:api` (con `DEBUG=*`, actualmente con advertencia `Redis not configured - using memory cache`); frontend servido con `npm run dev:web`, Vite reasignado a `http://localhost:5001` porque el puerto 5000 está ocupado.
  - Pruebas automatizadas:
    - 07-10-2025 → primera pasada con warnings residuales en reports/localStorage.
    - 08-10-2025 → segunda pasada tras hotfixes:
      - `node test-critical-errors.js` → 21/21 casos críticos aprobados.
      - `node test-functionality.js` → 81/81 asserts, sin warnings (se añadió `console.warn` en `src/lib/localStorage.ts`).
      - `node test-e2e-simulation.js` → 46/46, sin warnings (se amplió matching semántico de secciones de reportes).
    - Capturas de salida anexadas en el historial de consola de esta sesión; trasladar a `evidence/` en cuanto se consoliden.
  - API Frontend (`apps/web/src/lib/api.ts`): base URL por defecto `http://localhost:5001/api/v1`. Todas las llamadas requieren token válido y cabecera `X-Tenant-Slug`; sin sesión real la API responde 401 y los stores quedan vacíos.

### 🔍 Hallazgos Fase 2 (botones inactivos)

> Actualización 07-10-2025: Los asserts añadidos en `test-functionality.js` confirmaron que `AccountsPage` ya consume las acciones reales del store; mantener el análisis siguiente como referencia histórica hasta completar validación manual.

### 🔄 Fase 5 · Plan de persistencia y sincronización (08-10-2025)

**Snapshot actual de stores con sync**

| Store | Persistencia local | Broadcast entre pestañas | Operaciones API configuradas | Observaciones |
|-------|--------------------|--------------------------|------------------------------|---------------|
| `accountsStore` | ✅ `persist` + `createJSONStorage` | ✅ BroadcastChannel (`grid-manager:accounts`) | `get`, `create`, `update`, `delete` | Delete habilitado (`accountsApi.delete`) y sincroniza con cache local/híbrido. |
| `customersStore` | ✅ `persist` (`grid-manager:customers-store`) | ✅ BroadcastChannel (`grid-manager:customers`) | `get`, `create`, `update`, `delete` | Mutaciones usan cola offline + broadcast. Pendiente surface de `pendingSync`. |
| `productsStore` | ✅ `persist` (`grid-manager:products-store`) | ✅ BroadcastChannel (`grid-manager:products`) | `get`, `create`, `update`, `delete` | Borrado usa `deleteWithSync` + cola offline. Mantiene cache de categorías y movimientos. |
| `suppliersStore` | ✅ `persist` (`grid-manager:suppliers-store`) | ✅ BroadcastChannel (`grid-manager:suppliers`) | `get`, `create`, `update`, `delete` | Eliminaciones ahora van al endpoint real (`suppliersApi.delete`) y respetan la cola offline. |
| `salesStore` | ✅ `persist` (`grid-manager:sales-store`) | ✅ BroadcastChannel (`grid-manager:sales`) | `get`, `create`, `update`, `delete` | Mutaciones usan `updateWithSync`/`deleteWithSync`; se preservan stats y reversión de stock. |

**Cambio aplicado (08-10-2025)**
- `syncStorage.ts` ahora cachea automáticamente la última respuesta exitosa en `localStorage` (`gridmanager-sync-cache:<storageKey>`).
- En modo offline (`getSyncMode() === 'offline'`) `loadWithSync` devuelve el snapshot cacheado para evitar arranque vacío.
- `create/update/deleteWithSync` sincronizan el cache tras mutaciones exitosas, manteniendo consistencia mientras llega la respuesta del backend.

**Backlog prioritario para habilitar modo online real**
1. **Endpoints faltantes**
  - ✅ `accountsApi.delete` expuesto en `accountsSyncConfig.apiDelete` (10-10-2025).
  - ✅ `salesApi.update/delete` cableados al store (10-10-2025) con sincronización híbrida.
  - ✅ `productsApi.delete` y `suppliersApi.delete` integrados en sus stores con cola offline (10-10-2025).
2. **Cola de operaciones offline**
  - ✅ `syncStorage` ahora encola `create/update/delete` cuando `isAuthenticated()` es `false`, guarda las mutaciones en `localStorage` y las reprocesa al volver a estar online.
  - Pendiente: registrar un flag `pendingSync`/feedback visual y disparar un refresh del store tras cada vaciado exitoso.
3. **Persistencia uniforme**
  - ✅ `customers/products/suppliers/sales` migrados a `persist` + `BroadcastChannel` reutilizando la cola offline (10-10-2025).
  - Pendiente: reducir logs en producción (hoy se imprime cada operación de carga) y centralizar métricas.
4. **Health checks**
  - Agregar pruebas automatizadas que simulen modo offline (deshabilitar auth store) y verifiquen que `loadWithSync` devuelve el snapshot esperado.
  - Documentar procedimiento de “resync” en `SINCRONIZACION.md`.

> Con el cache local y la cola offline activos, los usuarios conservan datos al refrescar y las mutaciones se reintentan automáticamente al recuperar sesión. Falta exponer feedback visual y refrescos automáticos para completar la experiencia offline-first.

**Actualización 10-10-2025**
- Se habilitaron los endpoints reales de `productsApi.delete`, `suppliersApi.delete` y `salesApi.update/delete`, y los stores ahora usan `deleteWithSync`/`updateWithSync` para mantener cache + broadcast sincronizados incluso offline.

- `AccountsPage` (`apps/web/src/pages/AccountsPage.tsx`)
  - Los botones **“Nueva Cuenta”**, **“Editar”**, **“Eliminar”**, **“Nueva Transacción”** y **“Transferir”** cierran sus modales pero no persisten cambios. El handler delega en `setAccounts`/`setTransactions`, funciones locales vacías que quedaron como shims al migrar a `useAccountsStore`.
  - Efecto observado: el usuario recibe feedback visual mínimo (modal se cierra) pero la lista permanece igual incluso después de refrescar; los logs agregados en la store confirman que no se invoca `addAccount`/`updateAccount`/`deleteAccount`.
  - Resolución sugerida: reemplazar los shims por las acciones reales del store (`addAccount`, `updateAccount`, `deleteAccount`, `addTransaction`) y propagar validaciones de error desde la API para evitar estados inconsistentes.
- `TransferModal` (`apps/web/src/components/forms/TransferModal.tsx`)
  - Al completar una transferencia se invoca `onTransferCompleted`, pero en la página principal la lógica vuelve a usar los mismos shims sin mutar balances. Resultado: la transferencia no queda registrada ni ajusta saldos.
  - Recomendación: exponer un método `transferBetweenAccounts` en el store que cree las dos transacciones y actualice balances de forma atómica.
- `SuppliersPage` (`apps/web/src/pages/SuppliersPage.tsx`)
  - Los botones **“Pagar”** y **“Ver”** disparan únicamente `alert('Funcionalidad ... en desarrollo')`. No existe modal ni navegación posterior, por lo que el flujo de pagos a proveedores es inexistente.
  - Próximos pasos: definir contrato del modal de pagos (cuenta origen, monto, referencia) y aprovechar `useAccountsStore` para registrar egresos asociados al proveedor.

### 🔍 Hallazgos Fase 2 (multi-sesión y sincronización)

- `useAuthStore` (`apps/web/src/store/authStore.ts`)
  - Única store con persistencia. Guarda usuario/tokens en `localStorage` bajo la clave `gridmanager-auth-storage`.
  - El botón “Saltear login” en `TenantLoginPage` inyecta tokens mock (`mock-access-token`/`mock-refresh-token`). `getSyncMode()` detecta este valor y fuerza **modo offline permanente**, evitando llamadas reales a la API aun cuando el resto del UI opera como si existiese persistencia.
- Stores de dominio (`accountsStore`, `customersStore`, `productsStore`, `suppliersStore`, `salesStore`)
  - ✅ Ahora utilizan `persist` + `BroadcastChannel` y comparten la cola offline de `syncStorage`, por lo que refrescos y nuevas pestañas conservan datos aun sin token válido.
  - Persisten snapshots y, al recuperar autenticación, vacían la cola pendiente antes de recargar desde la API. Falta exponer feedback visual (`pendingSync`) para mutaciones diferidas.
  - Los stores que aún no poseen `apiDelete` o `apiUpdate` reales (productos, proveedores, ventas) siguen aplicando mutaciones locales, por lo que la sincronización real con backend depende de completar esos endpoints.
- Implicancias prácticas
  - Un usuario que ingresa desde dos pestañas con login simulado verá datos diferentes y podría sobreescribir cambios sin advertencias.
  - El flujo actual bloquea totalmente la sincronización multi-dispositivo mientras no exista autenticación real con tokens válidos y endpoints completos en Railway/Supabase.
- Recomendaciones inmediatas
  - Priorizar una sesión real contra Railway para desbloquear `syncMode: 'online'` y validar la cobertura de endpoints (`create/update/delete`).
  - Habilitar persistencia mínima (zustand `persist`) o wallets locales (`indexedDB`) para los stores clave mientras se completa el backend.
  - Añadir difusión entre pestañas (`storage` event o `BroadcastChannel`) para evitar estados divergentes, y definir una política de resolución de conflictos (timestamp, versionado o re-fetch tras cada mutación).

### 🧭 Fase 3 · Mapeo y priorización

| Síntoma | Módulos / Stores afectados | API / Infra involucrada | Clasificación | Notas clave |
| --- | --- | --- | --- | --- |
| Persistencia limitada / sesiones mock | `useAuthStore`, `syncStorage`, `accountsStore`, `customersStore`, `salesStore` | Railway (`/auth`, `/accounts`, `/customers`, `/sales`), Supabase (PostgreSQL), Redis opcional | **Full-stack** | Sin tokens válidos la app queda en modo offline; incluso con login real se requiere validar cobertura `create/update/delete` para asegurar sincronización. |
| Botones sin acción | `AccountsPage`, `TransferModal`, `SuppliersPage`, `accountsStore` | `accountsApi` (falta `apiDelete`), futuros endpoints de pagos proveedor | **Frontend** (con dependencias API) | Falta cableado a acciones del store y confirmación de endpoints; bloquear actualizaciones mínimas impide CRUD básico desde UI. |
| Listados inconsistentes tras crear registros | `AccountsPage`, `SuppliersPage`, `CustomersPage`, `Bulk*Import` | `loadWithSync` sobre `/accounts`, `/suppliers`, `/customers` | **Frontend** | Shims locales obsoletos y falta de re-fetch impiden ver datos recién creados; debe reemplazarse por acciones reales + refresco tras mutaciones. |
| Multi-sesión sin sincronización entre pestañas | `useAuthStore`, `syncStorage`, stores de dominio | `/auth/refresh`, almacenamiento compartido (localStorage, BroadcastChannel) | **Full-stack** | Requiere tokens reales + estrategia de difusion y caché local; sin esto, estados divergen y se pierden datos al refrescar. |

**Orden de priorización recomendado**
1. **Persistencia** – desbloquea el resto del flujo y evita pérdida de datos.
2. **Botones sin acción** – impiden a los usuarios ejecutar tareas básicas.
3. **Listados inconsistentes** – ocultan los cambios realizados aunque existan.
4. **Multi-sesión** – abordarlo luego de garantizar persistencia y CRUD; podría escalarse como fase aparte si requiere trabajo server-side amplio.

> **Nota**: Este archivo es la referencia única sobre el estado del sistema. Cualquier plan de trabajo o checklist granular debe apuntar a esta sección para validar supuestos antes de ejecutar cambios.

## 📋 Información del Proyecto

**Grid Manager** es una aplicación de gestión empresarial desarrollada con React/TypeScript y Node.js, estructurada como monorepo. La funcionalidad descrita a continuación representa la intención de diseño; revisar la sección de limitaciones para conocer el alcance realmente disponible hoy.

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios
```
Grid Manager/
├── apps/
│   ├── web/          # Frontend React/TypeScript
│   └── api/          # Backend Node.js/Express
├── packages/         # Packages compartidos
├── README.md
├── find-supabase-uri.md
└── CLAUDE.md        # Este archivo
```

### Frontend (apps/web/)
```
src/
├── components/      # Componentes reutilizables
│   ├── ui/         # Componentes base (Button, Modal, Input, etc.)
│   └── layout/     # Layout components (Header, Sidebar, Layout)
├── pages/          # Páginas principales de la aplicación
├── store/          # Estado global con Zustand
├── lib/            # Utilidades y helpers
└── assets/         # Assets estáticos
```

## 🎯 Funcionalidad General del Sistema

Grid Manager es un **ERP completo** que permite:

1. **Gestión de Inventario**: Control de productos, categorías, stock
2. **Gestión de Ventas**: Proceso completo de ventas con múltiples canales
3. **Gestión de Clientes**: Base de datos completa con balances y análisis
4. **Gestión Financiera**: Cuentas, transacciones y flujo de efectivo
5. **Reportes y Analytics**: Dashboards avanzados con exportación
6. **Calculadora MercadoLibre**: Herramienta especializada para cálculo de comisiones
7. **Gestión de Proveedores**: Control de proveedores y relaciones comerciales

## 📱 Páginas y Funcionalidades Detalladas

### 1. Dashboard Principal (`/`)
- **Archivo**: `src/pages/DashboardPage.tsx`
- **Función**: Pantalla principal con métricas clave
- **Características**:
  - Resumen de ventas del día/semana/mes
  - Gráficos de tendencias
  - Alertas de stock bajo
  - Accesos rápidos a funciones principales
- **Datos**: Consulta múltiples stores para métricas consolidadas

### 2. Gestión de Productos (`/products`)
- **Archivo**: `src/pages/ProductsPage.tsx`
- **Store**: `src/store/productsStore.ts`
- **Funciones**:
  - ✅ Crear/editar/eliminar productos
  - ✅ Gestión de categorías dinámicas
  - ✅ Control de stock y stock mínimo
  - ✅ SKU automático generado
  - ✅ Estados activo/inactivo
  - ✅ Búsqueda y filtrado
  - ✅ Alertas de stock crítico

#### Interfaz Product
```typescript
interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  description?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  status: 'active' | 'inactive';
  createdAt: string;
}
```

### 3. Gestión de Ventas (`/sales`)
- **Archivo**: `src/pages/SalesPage.tsx`
- **Store**: `src/store/SalesContext.tsx` + `src/store/salesStore.ts`
- **Funciones**:
  - ✅ Proceso completo de ventas
  - ✅ Múltiples canales: tienda, online, teléfono, WhatsApp
  - ✅ Estados de pago: pagado, pendiente, parcial
  - ✅ Métodos de pago: efectivo, transferencia, tarjeta, cheque
  - ✅ Integración con cuentas financieras
  - ✅ Actualización automática de balances de clientes
  - ✅ Historial completo de transacciones

#### Interfaz Sale
```typescript
interface Sale {
  id: number;
  number: string;          // VTA-2024-001
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
  salesChannel?: 'store' | 'online' | 'phone' | 'whatsapp' | 'other';
  paymentStatus?: 'paid' | 'pending' | 'partial';
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'check' | 'other';
  accountId?: string;      // ID de cuenta donde se registra el pago
}
```

### 4. Gestión de Clientes (`/customers`)
- **Archivo**: `src/pages/CustomersPage.tsx`
- **Store**: `src/store/customersStore.ts`
- **Funciones**:
  - ✅ CRUD completo de clientes
  - ✅ Gestión de balances (cuenta corriente)
  - ✅ Estados activo/inactivo
  - ✅ Historial de compras integrado
  - ✅ Vista móvil responsive (cards + tabla)
  - ✅ Estadísticas de clientes
  - ✅ Búsqueda y filtrado avanzado

#### Interfaz Customer
```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;         // Puede ser positivo o negativo
  status: 'active' | 'inactive';
  createdAt: string;
  address?: string;
  notes?: string;
}
```

### 5. Gestión Financiera (`/accounts`)
- **Archivo**: `src/pages/AccountsPage.tsx`
- **Store**: `src/store/accountsStore.ts`
- **Funciones**:
  - ✅ Gestión de múltiples cuentas (banco, efectivo, tarjetas)
  - ✅ Registro de transacciones de ingresos/egresos
  - ✅ Integración automática con ventas
  - ✅ Balances en tiempo real
  - ✅ Múltiples monedas (ARS, USD)
  - ✅ Categorización de gastos

#### Interfaces Financieras
```typescript
interface Account {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  balance: number;
  currency: string;
  active: boolean;
  createdDate: string;
  description?: string;
}

interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category?: string;
  reference?: string;      // Referencia a venta, factura, etc.
}
```

### 6. Reportes y Analytics (`/reports`)
- **Archivo**: `src/pages/ReportsPage.tsx`
- **Función**: Sistema completo de Business Intelligence
- **Secciones**:

#### 6.1 Resumen General
- Métricas clave con tendencias
- Gráficos de área para ventas temporales
- Gráficos de torta para canales de venta
- Productos más vendidos
- Balances por cuenta

#### 6.2 Análisis de Ventas
- Ventas por vendedor
- Análisis por canal de venta
- Ticket promedio
- Tabla detallada de todas las ventas con filtros

#### 6.3 Análisis Financiero
- Estado de resultados completo
- Gastos por categoría (gráfico de torta)
- Márgenes de ganancia
- Análisis de flujo de efectivo
- Tabla de transacciones detallada

#### 6.4 Análisis de Clientes
- Top 10 clientes por facturación
- Distribución activos/inactivos
- Clientes nuevos por mes
- Análisis de balances
- Segmentación de clientes

#### 6.5 Análisis de Inventario
- Valor total de inventario
- Productos con stock crítico (alertas visuales)
- Distribución por categoría
- Top productos por valor en stock
- Análisis completo con rotación

#### 6.6 🆕 Análisis de Rendimiento (KPIs)
- Tasa de conversión
- ROI mensual
- Margen promedio
- Productividad (ventas por día)
- KPIs avanzados de eficiencia

### Funcionalidades de Exportación
- ✅ **CSV funcional**: Datos reales por sección
- ✅ **PDF con vista previa**: Reportes completos imprimibles
- ✅ **Email**: Resumen ejecutivo automático
- ✅ Nombres de archivo inteligentes con fecha

### 7. Calculadora MercadoLibre (`/mercadolibre`)
- **Archivo**: `src/pages/MercadoLibrePage.tsx`
- **Función**: Calculadora especializada para comisiones de MercadoLibre
- **Características**:
  - Cálculo de comisiones por categoría
  - Costos de envío
  - Análisis de rentabilidad
  - Precio sugerido de venta

### 8. Gestión de Proveedores (`/suppliers`)
- **Store**: `src/stores/suppliersStore.ts`
- **Funciones**:
  - Gestión completa de proveedores
  - Contactos y términos comerciales
  - Historial de compras

## 🔄 Interacciones Entre Bases de Datos

### Flujo de Ventas Completo
```
1. VENTA CREADA (SalesStore)
   ↓
2. CLIENTE ACTUALIZADO (CustomersStore)
   - Balance del cliente se modifica
   ↓
3. CUENTA FINANCIERA (AccountsStore)
   - Si pago = "pagado" → Balance de cuenta aumenta
   - Transacción automática creada
   ↓
4. INVENTARIO (ProductsStore)
   - Stock se reduce automáticamente
   ↓
5. REPORTES (ReportsPage)
   - Métricas se recalculan en tiempo real
```

### Sincronización de Estados
- **Zustand** para gestión de estado global
- **LocalStorage** para persistencia
- **Cálculos memoizados** para rendimiento (`useMemo`)
- **Actualización reactiva** entre stores

### Ejemplo de Actualización en Cadena
```typescript
// Al crear una venta:
const newSale = addSale({
  client: "Juan Pérez",
  amount: 50000,
  paymentStatus: "paid",
  accountId: "1"
});

// Automáticamente:
// 1. Cliente "Juan Pérez" → balance += 50000
// 2. Cuenta "1" → balance += 50000  
// 3. Transacción creada con referencia a venta
// 4. Reportes muestran nuevos datos
```

## 🛠️ Comandos Útiles

### Desarrollo
```bash
# Iniciar frontend
cd apps/web && npm run dev

# Iniciar backend  
cd apps/api && npm run dev

# Ejecutar ambos desde raíz
npm run dev
```

### Base de Datos (Prisma)
```bash
# Migrar base de datos
npx prisma db push

# Ver base de datos
npx prisma studio

# Seed inicial
npm run db:seed
```

### Git
```bash
# Ver estado
git status

# Commit típico
git add .
git commit -m "feat: descripción del cambio"
git push
```

### Testing
```bash
# Frontend tests
cd apps/web && npm test

# Backend tests  
cd apps/api && npm test
```

## 📊 Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Zustand** para estado global
- **React Router** para navegación
- **Headless UI** para componentes accesibles
- **Vite** como bundler

### Backend
- **Node.js** con Express
- **Prisma ORM** para base de datos
- **PostgreSQL** (Supabase)
- **JWT** para autenticación
- **Swagger** para documentación API

### Deployment
- **Frontend**: Netlify (deploy principal en producción)
- **Backend API**: Railway (Node/Express + Prisma)
- **Base de datos**: Supabase (PostgreSQL gestionado)
- **CI/CD**: GitHub Actions (ajustar pipelines para reflejar nuevos entornos si cambian)

> **Recordatorio**: Los entornos locales usan servicios mock/LocalStorage; cualquier prueba contra producción debe considerar Railway/Netlify/Supabase y variables de entorno correspondientes.

## 🔒 Autenticación y Seguridad

### Sistema de Auth
- Se cuenta con infraestructura de autenticación basada en JWT y middleware dependiendo del backend Express. **Estado actual**: el frontend sigue trabajando principalmente con datos mock/local, por lo que el flujo completo aún no se usa de forma consistente.
- Encriptación bcrypt para contraseñas y validaciones Zod disponibles.

### Roles y Permisos
- Definidos a nivel conceptual (Básico, Admin, Manager). **Pendiente** la verificación end-to-end dentro del cliente web.

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px

### Características Mobile
- ✅ Sidebar colapsible
- ✅ Tablas → Cards en móvil
- ✅ Botones full-width
- ✅ Touch-friendly targets
- ✅ Navegación optimizada

## 🚀 Performance

### Optimizaciones Implementadas
- Lazy loading de componentes, memoización y debounce configurados en el código base.
- Virtualización de listas e índices para tablas extensas aún en revisión; validar antes de confiar en ambientes con >1000 registros.

## 🐛 Debugging

### Herramientas
- **React DevTools** para componentes
- **Zustand DevTools** para estado
- **Network tab** para API calls
- **Console logs** estratégicos

### Logs Útiles
```typescript
// En stores
console.log('Sale created:', newSale);
console.log('Customer balance updated:', customer.balance);

// En componentes  
console.log('Filtered data:', filteredData);
console.log('Current state:', state);
```

## 📈 Métricas y Analytics

### KPIs Principales Trackados
- **Ventas totales** por período
- **Crecimiento** comparativo
- **Margen promedio** de productos
- **Tasa de conversión** cliente/venta
- **ROI mensual**
- **Rotación de inventario**
- **Productos críticos** (stock bajo)

### Exportación de Datos
- **CSV**: Datos tabulares por sección
- **PDF**: Reportes ejecutivos completos
- **Email**: Resúmenes automáticos

## 🔄 Estados de la Aplicación

### Estados Globales (Zustand)
```typescript
// Sales State
- sales: Sale[]
- dashboardStats: DashboardStats
- addSale, updateSale, updateSaleStatus

// Customers State  
- customers: Customer[]
- stats: CustomerStats
- addCustomer, updateCustomer, updateCustomerBalance

// Products State
- products: Product[]
- categories: Category[]
- stats: ProductStats
- addProduct, updateProduct, updateStock

// Accounts State
- accounts: Account[]
- transactions: Transaction[]
- addAccount, addTransaction, getTransactionsByAccount
```

### LocalStorage Keys
```typescript
// Persistencia automática
'gridmanager_sales'
'gridmanager_customers'  
'gridmanager_products'
'gridmanager_accounts'
'gridmanager_transactions'
'gridmanager_dashboard_stats'
```

## 🧪 Testing Strategy

### Estado actual de las pruebas
- Existen scripts (`test-critical-errors.js`, `test-e2e-simulation.js`, etc.) que cubren escenarios clave, pero deben ejecutarse tras cada cambio significativo para asegurar que los flujos descritos siguen vigentes.
- La cobertura de integración/E2E se está ampliando conforme se repara la persistencia y se conectan los módulos.

## 📝 Notas para Futuras Sesiones

### Próximas Mejoras Sugeridas
1. **Persistencia centralizada** (Supabase/Prisma) y sincronización multi-sesión.
2. **Notificaciones push** para stocks críticos.
3. **Backup automático** de datos.
4. **Integración** con APIs de bancos.
5. **Dashboard mobile app** nativo.
6. **Machine learning** para predicciones de venta.
7. **Sincronización offline** con service workers.

### Limitaciones y problemas conocidos (octubre 2025)
- Persistencia: Los stores dependen de LocalStorage; al abrir otra sesión/navegador los datos no se comparten.
- Análisis 07-10-2025: `accountsStore`, `customersStore` y `salesStore` utilizan `loadWithSync/createWithSync` (API de Railway). `saveWithSync` está deprecado y no persiste en LocalStorage, por lo que si la API falla o no hay token válido el estado vuelve al arreglo vacío tras recargar.
- Cobertura CRUD: `accountsStore`, `productsStore`, `suppliersStore` y `salesStore` ya enlazan `apiDelete`/`apiUpdate`. Validar en Railway que los endpoints respondan antes de habilitarlos en producción.
- Instrumentación temporal (07-10-2025): Se añadieron logs en `accountsStore` y `salesStore` para registrar `syncMode`, cantidad de registros cargados y resultado de operaciones `create/update/delete`. Revisar consola del navegador al reproducir fallos.
- UX: Botones y formularios críticos necesitan wiring (handlers, loaders, mensajes de confirmación).
- Listados: Varios listados no se refrescan tras agregar datos hasta recargar la página.
- Evidencia pendiente: Se necesitan HAR y capturas desde sesión real cuando se reproduzcan los fallos en UI.
- Multi-tenancy: Documentación previa declara la migración como completa, pero la implementación actual requiere validación y ajustes antes de activarla.
- Documentación: Este archivo es la fuente actualizada; mantenerlo alineado tras cada iteración.

### Bugs Conocidos a Investigar
- [ ] Performance en listas > 1000 items
- [ ] Timezone handling en reportes
- [ ] Edge cases en cálculos de balance

### Deuda Técnica
- [ ] Migrar algunos componentes a TypeScript strict
- [ ] Optimizar bundle size
- [ ] Añadir más tests de integración
- [ ] Documentar APIs backend

---

**Última actualización**: 2025-09-11  
**Versión**: 2.1.0  
**Estado**: Producción estable con reportes avanzados