# 🔄 Guía de Sincronización Multi-Navegador

## ✅ ¿Qué se implementó?

Grid Manager ahora tiene **sincronización híbrida** entre el **frontend** (Netlify) y el **backend** (Railway + PostgreSQL).

### **Stores Migrados:**
1. ✅ **customersStore** - Clientes
2. ✅ **salesStore** - Ventas
3. ✅ **productsStore** - Productos
4. ✅ **accountsStore** - Cuentas y transacciones

## 🚀 Cómo Funciona

### **Modo Online (Con Login)**
```
Usuario → Login → Token guardado → API disponible
↓
Crear Cliente → API (PostgreSQL) + Cache (localStorage)
↓
Otro navegador → Login → Carga desde API
✅ VE EL MISMO CLIENTE
```

### **Modo Offline (Sin Login)**
```
Usuario → Sin login → Solo localStorage
↓
Crear Cliente → Solo localStorage
↓
Otro navegador → Solo su localStorage
❌ NO SINCRONIZA
```

## 📋 Instrucciones de Uso

### **Paso 1: Hacer Login**

#### **Opción A: Login Real (Recomendado)**
```
1. Ir a: https://obsidiangridmanager.netlify.app/login
2. Usar credenciales:
   - Admin: admin@gridmanager.com / admin123
   - Manager: manager@gridmanager.com / manager123
```

#### **Opción B: Saltear Login (Testing)**
```
1. Ir a: https://obsidiangridmanager.netlify.app/login
2. Click en "🚀 Saltear Login (Testing)"
3. Mock token se guarda automáticamente
```

### **Paso 2: Usar el Sistema**

Una vez logueado, **todos los datos se sincronizan automáticamente**:

| Módulo | Sincroniza | Modo Offline |
|--------|-----------|-------------|
| **Clientes** | ✅ Completo | ✅ Cache |
| **Ventas** | ✅ Load + Create | ✅ Cache |
| **Productos** | ✅ Load | ✅ Cache |
| **Cuentas** | ✅ Completo | ✅ Cache |

### **Paso 3: Probar Multi-Navegador**

#### **Test Rápido:**
```bash
# Navegador Chrome
1. Abrir: https://obsidiangridmanager.netlify.app/login
2. Saltear Login
3. Ir a Clientes
4. Crear cliente "Juan Pérez"

# Navegador Firefox (misma máquina)
1. Abrir: https://obsidiangridmanager.netlify.app/login
2. Saltear Login
3. Ir a Clientes
4. ✅ Debería VER "Juan Pérez"
```

## 🔧 Arquitectura Técnica

### **Flujo de Sincronización:**

```typescript
// 1. Al montar componente
useEffect(() => {
  loadCustomers(); // Intenta cargar desde API
}, []);

// 2. loadCustomers() ejecuta:
const customers = await loadWithSync(config, []);
// → Intenta API
// → Si falla, usa localStorage cache

// 3. Al crear cliente
const customer = await createWithSync(config, newCustomer, currentCustomers);
// → Intenta crear en API
// → Si falla, guarda en localStorage solo
// → Actualiza estado local inmediatamente (optimistic update)
```

### **Helper de Sincronización:**

`apps/web/src/lib/syncStorage.ts` provee:

- **loadWithSync**: Carga desde API → fallback localStorage
- **createWithSync**: Crea en API → fallback localStorage
- **updateWithSync**: Actualiza en API → fallback localStorage
- **deleteWithSync**: Elimina en API → fallback localStorage
- **getSyncMode**: Detecta si está online/offline

## 🎯 Estados de Sincronización

Cada store tiene:

```typescript
{
  isLoading: boolean;  // True durante carga desde API
  syncMode: 'online' | 'offline';  // Estado actual
}
```

### **Detectar Modo:**

```typescript
import { getSyncMode, isAuthenticated } from '@/lib/syncStorage';

const mode = getSyncMode(); // 'online' si hay token, 'offline' si no
const hasAuth = isAuthenticated(); // true/false
```

## 📊 Ejemplo Real

### **Escenario: Crear Venta**

```typescript
// SalesForm.tsx
const handleSubmit = async (data) => {
  try {
    // addSale ahora es async y sincroniza con API
    const newSale = await addSale({
      client: data.client,
      product: data.product,
      quantity: data.quantity,
      price: data.price,
      paymentStatus: 'paid'
    });

    // Proceso automático:
    // 1. Valida stock en productos
    // 2. Crea venta en API (si está online)
    // 3. Actualiza inventario
    // 4. Crea transacción en cuenta
    // 5. Actualiza balance de cliente
    // 6. Guarda en localStorage como cache

    console.log('Venta creada:', newSale);
    // ✅ Visible en otros navegadores inmediatamente
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 🐛 Troubleshooting

### **Problema: No veo datos en otro navegador**

**Solución:**
1. Verificar que ambos navegadores hicieron login
2. Verificar que el backend está funcionando:
   ```bash
   curl https://gridmanager-production.up.railway.app/health
   # Debe responder: {"status":"ok"}
   ```
3. Abrir consola del navegador y buscar:
   ```
   ✅ Loaded customers from API
   # O
   ⚠️ API error for customers, using localStorage cache
   ```

### **Problema: Error "Access token required"**

**Solución:**
- Hacer login nuevamente
- Verificar que el token se guardó:
  ```javascript
  // En consola del navegador:
  JSON.parse(localStorage.getItem('grid-manager-auth'))
  // Debe tener: { state: { tokens: { accessToken: "..." } } }
  ```

### **Problema: Datos antiguos persisten**

**Solución:**
- Limpiar localStorage:
  ```javascript
  // En consola del navegador:
  localStorage.clear();
  location.reload();
  ```

## 🔒 Seguridad

### **Tokens JWT**
- Se guardan en localStorage con el key `grid-manager-auth`
- Se envían automáticamente en cada request a la API
- Se refrescan automáticamente cuando expiran

### **CORS**
- El backend acepta requests desde:
  - `https://obsidiangridmanager.netlify.app`
  - `https://gridmanager.netlify.app`
  - `http://localhost:*` (desarrollo)

## 📈 Próximas Mejoras

### **Pendiente de Implementar:**
1. **Cola de sincronización offline**
   - Guardar operaciones cuando está offline
   - Sincronizar cuando vuelve online

2. **Indicador visual de sync**
   - Badge mostrando "Online" / "Offline"
   - Spinner durante sincronización

3. **Conflict resolution**
   - Resolver conflictos cuando dos usuarios editan lo mismo

4. **Real-time updates**
   - WebSockets para actualizaciones en tiempo real
   - Ver cambios de otros usuarios sin refresh

5. **Supplier store migration**
   - Migrar suppliersStore a API

## 💡 Notas Importantes

### **LocalStorage como Cache:**
- Sirve para funcionar offline
- Sirve para cargar rápido (mientras se sincroniza con API)
- Se actualiza automáticamente cuando se sincroniza con API

### **Optimistic Updates:**
- La UI se actualiza inmediatamente
- La sincronización con API ocurre en background
- Si falla API, los datos quedan en localStorage

### **Multi-Tenancy:**
- El backend soporta múltiples empresas (tenants)
- Por ahora todos usan el mismo tenant de testing
- En producción cada empresa tendría su tenant

## 🔗 URLs Importantes

| Servicio | URL | Estado |
|----------|-----|--------|
| **Frontend** | https://obsidiangridmanager.netlify.app | ✅ Activo |
| **Backend API** | https://gridmanager-production.up.railway.app | ✅ Activo |
| **Base de Datos** | Supabase PostgreSQL | ✅ Activo |
| **Health Check** | https://gridmanager-production.up.railway.app/health | ✅ Activo |

## 📞 Soporte

Si algo no funciona:
1. Revisar consola del navegador
2. Verificar que el backend esté activo (health check)
3. Limpiar localStorage y reintentar
4. Crear issue en GitHub

---

**Última actualización:** 2025-10-02
**Versión:** 3.0.0 (Sincronización Híbrida)
**Estado:** ✅ Producción
