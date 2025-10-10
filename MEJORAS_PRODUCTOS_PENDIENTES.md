# 📋 Mejoras Pendientes - Módulo de Productos

**Fecha de creación:** 2025-10-10
**Estado:** Backlog de mejoras futuras
**Prioridad:** Media-Baja (Nice to have)

---

## 🎯 Mejoras Implementadas (Completadas hoy)

### ✅ 1. Validación de SKU Único
- **Estado:** ✅ Completado
- **Descripción:** Validación en tiempo de creación para evitar SKUs duplicados
- **Ubicación:** `apps/web/src/store/productsStore.ts:387-390`
- **Impacto:** Previene duplicados y mejora la integridad de datos

### ✅ 2. Búsqueda de Proveedores en Dropdown
- **Estado:** ✅ Completado
- **Descripción:** Selector searchable para proveedores con filtrado en tiempo real
- **Ubicación:** `apps/web/src/components/forms/ProductForm.tsx:284-308`
- **Componente:** `SearchableSelect` (ya existía, integrado ahora)
- **Impacto:** Mejor UX cuando hay muchos proveedores

### ✅ 3. Exportación de Productos a CSV
- **Estado:** ✅ Completado
- **Descripción:** Exportación de productos filtrados/ordenados a CSV con timestamp
- **Ubicación:** `apps/web/src/pages/ProductsPage.tsx:221-290`
- **Features:**
  - Exporta productos visibles (respeta filtros y búsqueda)
  - Nombre de archivo con timestamp y cantidad
  - 13 columnas de datos incluyendo proveedor y margen

### ✅ 4. Historial de Precios
- **Estado:** ✅ Completado
- **Descripción:** Sistema de tracking automático de cambios de costo/precio
- **Ubicación:** `apps/web/src/store/productsStore.ts:52-62, 715-735`
- **Features:**
  - Registra cambios automáticos en `updateProduct`
  - Almacena valores anteriores y nuevos
  - Timestamped y con información de usuario
  - Funciones: `addPriceHistory`, `getPriceHistoryByProduct`

---

## 🔮 Mejoras Pendientes (Backlog)

### 5. Campo de Imagen Funcional
**Prioridad:** Media
**Esfuerzo:** 4 horas
**Descripción:**
El campo `imageUrl` está definido en el interface `Product` pero no se usa en el formulario.

**Implementación sugerida:**
```typescript
// En ProductForm.tsx
<Input
  label="URL de Imagen"
  name="imageUrl"
  type="url"
  placeholder="https://ejemplo.com/producto.jpg"
/>

// Preview de imagen
{formData.imageUrl && (
  <div className="mt-2">
    <img
      src={formData.imageUrl}
      alt="Preview"
      className="w-32 h-32 object-cover rounded-lg border"
      onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
    />
  </div>
)}
```

**Mejoras futuras:**
- Upload directo de archivos (Cloudinary/S3)
- Redimensionamiento automático
- Galería de imágenes por producto

---

### 6. Alertas Proactivas en Dashboard
**Prioridad:** Alta
**Esfuerzo:** 3 horas
**Descripción:**
Actualmente las alertas de stock solo son visibles en `/products`. Deberían mostrarse en el Dashboard para acción inmediata.

**Implementación sugerida:**
```typescript
// En DashboardPage.tsx
const { getStockAlerts } = useProductsStore();
const criticalAlerts = getStockAlerts().filter(a => a.level === 'critical');

<AlertWidget
  title="Productos sin stock"
  count={criticalAlerts.length}
  severity="critical"
  onClick={() => navigate('/products?filter=critical')}
  icon={<ExclamationCircleOutlined />}
>
  {criticalAlerts.slice(0, 3).map(alert => (
    <AlertItem key={alert.id} product={alert.productName} />
  ))}
</AlertWidget>
```

---

### 7. Códigos de Barras / QR
**Prioridad:** Media
**Esfuerzo:** 8 horas (requiere hardware/library)
**Descripción:**
Soporte para escaneo de códigos de barras para búsqueda rápida y gestión de inventario.

**Implementación sugerida:**
```typescript
// Agregar campo barcode al interface Product
export interface Product {
  // ... campos existentes
  barcode?: string;
}

// Integrar librería de escaneo
import { BarcodeScanner } from '@components/BarcodeScanner';

<div className="flex gap-2">
  <Input value={searchTerm} onChange={...} />
  <Button onClick={openBarcodeScanner}>
    <BarcodeIcon className="w-5 h-5" />
  </Button>
</div>

// Al escanear, buscar por barcode o SKU
const handleScan = (code: string) => {
  const product = products.find(p =>
    p.barcode === code || p.sku === code
  );
  if (product) {
    // Abrir modal de edición o mostrar detalles
  }
};
```

**Librerías recomendadas:**
- `quagga2` - Barcode scanner para web
- `react-qr-reader` - QR code scanner
- `@zxing/browser` - Universal code reader

---

### 8. Variantes de Producto
**Prioridad:** Baja
**Esfuerzo:** 16+ horas (cambio estructural)
**Descripción:**
Soporte para productos con variantes (tallas, colores, etc.)

**Schema propuesto:**
```typescript
export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // "Talla M", "Color Rojo"
  sku: string; // SKU único por variante
  stock: number;
  additionalCost?: number; // Diferencial sobre precio base
  attributes: Record<string, string>; // { talla: "M", color: "Azul" }
  active: boolean;
}

// Modificar Product para soportar variantes
export interface Product {
  // ... campos existentes
  hasVariants: boolean;
  variants?: ProductVariant[];
}
```

**Consideraciones:**
- Requiere cambios en la base de datos (nueva tabla)
- UI compleja para gestión de variantes
- Lógica de stock por variante vs stock total
- Impacto en ventas (seleccionar variante al vender)

---

### 9. Búsqueda Avanzada con Filtros
**Prioridad:** Media
**Esfuerzo:** 6 horas
**Descripción:**
Panel de filtros avanzados para búsquedas más específicas.

**Filtros sugeridos:**
```typescript
interface AdvancedFilters {
  categories: string[]; // Multi-selección
  suppliers: string[]; // Multi-selección
  priceRange: { min: number; max: number };
  marginRange: { min: number; max: number };
  stockStatus: 'critical' | 'low' | 'normal' | 'all';
  dateRange: { from: Date; to: Date };
}

// UI: Modal o sidebar con formulario de filtros
<AdvancedFiltersPanel
  filters={filters}
  onApply={setFilters}
  onReset={() => setFilters(defaultFilters)}
/>
```

---

### 10. Importación con Validación Avanzada
**Prioridad:** Media
**Esfuerzo:** 4 horas
**Descripción:**
Mejorar el importador CSV actual con validaciones más robustas.

**Mejoras sugeridas:**
- Validar proveedores (debe existir en la base)
- Validar categorías (opción de crear automáticamente)
- Preview completo antes de confirmar
- Modo "actualizar" para productos existentes (match por SKU)
- Rollback automático en caso de error parcial

---

### 11. Tests Automatizados
**Prioridad:** Alta (deuda técnica)
**Esfuerzo:** 12 horas
**Descripción:**
Cobertura de tests para el módulo de productos.

**Áreas a testear:**
```typescript
// Unit tests para funciones puras
describe('calculations', () => {
  test('calculateMargin devuelve margen correcto', () => {
    expect(calculateMargin(100, 70)).toBe(30);
  });
});

// Integration tests para el store
describe('productsStore', () => {
  test('addProduct valida SKU único', async () => {
    // ...
  });

  test('updateProduct guarda historial de precios', async () => {
    // ...
  });
});

// E2E tests para flujos completos
describe('Products flow', () => {
  test('Usuario puede crear, editar y eliminar producto', async () => {
    // ...
  });
});
```

---

### 12. Integración con API de Proveedores
**Prioridad:** Baja
**Esfuerzo:** 20+ horas
**Descripción:**
Sincronización automática de catálogos con proveedores externos.

**Ejemplo de flujo:**
1. Configurar credenciales API del proveedor
2. Mapear campos (SKU proveedor → SKU interno)
3. Sincronización programada (diaria/semanal)
4. Actualización automática de precios/stock
5. Notificaciones de cambios

---

### 13. Analytics de Productos
**Prioridad:** Media
**Esfuerzo:** 8 horas
**Descripción:**
Dashboard específico para análisis de productos.

**Métricas sugeridas:**
- Productos más vendidos (últimos 30/60/90 días)
- Productos con menor rotación
- Margen promedio por categoría
- Evolución de precios (usando historial)
- Rentabilidad por producto
- Curva ABC de inventario

---

## 📊 Matriz de Priorización

| Mejora | Prioridad | Esfuerzo | ROI | Próximo Sprint |
|--------|-----------|----------|-----|----------------|
| 6. Alertas Dashboard | Alta | Bajo | Alto | ✅ Sí |
| 11. Tests | Alta | Alto | Alto | ✅ Sí |
| 5. Imágenes | Media | Bajo | Medio | Considerar |
| 9. Filtros avanzados | Media | Medio | Medio | Considerar |
| 7. Códigos barras | Media | Alto | Medio | No |
| 8. Variantes | Baja | Muy Alto | Medio | No |
| 12. API proveedores | Baja | Muy Alto | Bajo | No |

---

## 🔄 Historial de Actualizaciones

- **2025-10-10:** Documento creado con 4 mejoras implementadas y 9 pendientes
- **2025-10-10:** Implementadas mejoras 1-4 durante sesión de refactoring

---

## 📝 Notas

- Este documento debe actualizarse al completar cada mejora
- Prioridades pueden cambiar según feedback de usuarios
- Esfuerzos son estimaciones aproximadas para un desarrollador senior
- ROI estimado basado en impacto usuario vs esfuerzo implementación

---

**Mantenido por:** Claude (AI Assistant)
**Última revisión:** 2025-10-10
