# CLAUDE.md - Grid Manager Documentation

## 📋 Información del Proyecto

**Grid Manager** es una aplicación completa de gestión empresarial desarrollada con React/TypeScript y Node.js, que incluye gestión de inventario, ventas, clientes, cuentas financieras y reportes avanzados.

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
- **Vercel** para frontend
- **Supabase** para base de datos PostgreSQL
- **GitHub Actions** para CI/CD

## 🔒 Autenticación y Seguridad

### Sistema de Auth
- **JWT tokens** para sesiones
- **Middleware de autenticación** en todas las rutas protegidas
- **Encriptación bcrypt** para contraseñas
- **Validación de entrada** con esquemas TypeScript

### Roles y Permisos
- **Usuario básico**: CRUD básico
- **Admin**: Acceso completo a reportes y configuración
- **Manager**: Acceso a ventas y reportes

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
- **Lazy loading** de componentes
- **Memoización** de cálculos pesados
- **Virtualización** de listas largas
- **Debounce** en búsquedas
- **Caching** de consultas frecuentes

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

### Unit Tests
- Stores (Zustand)
- Utility functions
- Components aislados

### Integration Tests  
- Flujos completos de ventas
- Interacciones entre stores
- API endpoints

### E2E Tests
- Flujos críticos de usuario
- Responsive design
- Performance benchmarks

## 📝 Notas para Futuras Sesiones

### Próximas Mejoras Sugeridas
1. **Notificaciones push** para stocks críticos
2. **Backup automático** de datos
3. **Multi-tenancy** para múltiples empresas
4. **Integración** con APIs de bancos
5. **Dashboard mobile app** nativo
6. **Machine learning** para predicciones de venta
7. **Sincronización offline** con service workers

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