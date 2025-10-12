# 🔍 Plan de Auditoría Completa - Grid Manager

**Fecha**: 12 de octubre de 2025
**Objetivo**: Revisar carpeta por carpeta, archivo por archivo, asegurando que todo esté actualizado, sin obsoletos, y con conexiones correctas.

---

## 📋 Metodología

### Categorías de Revisión:
1. ✅ **KEEP** - Archivo necesario y actualizado
2. ⚠️ **UPDATE** - Necesita actualización
3. ❌ **DELETE** - Obsoleto, debe eliminarse
4. 🔄 **REFACTOR** - Funcional pero puede mejorarse
5. 📝 **DOCUMENT** - Falta documentación

---

## 📁 Estructura del Proyecto

```
Grid Manager/
├── apps/
│   ├── web/          # Frontend React
│   └── api/          # Backend Node.js
├── packages/         # Paquetes compartidos (si existen)
├── .env files        # Configuraciones
└── Documentación     # .md files
```

---

## 🎯 FASE 1: Configuración y Archivos Raíz

### 1.1 Archivos de Configuración de Base de Datos

| Archivo | Ubicación | Estado | Acción |
|---------|-----------|--------|--------|
| `.env` | `apps/api/.env` | ⚠️ UPDATE | Verificar DATABASE_URL correcta |
| `.env.production` | `apps/api/.env.production` | ⚠️ UPDATE | Sincronizar con .env |
| `.env.example` | `apps/api/.env.example` | 📝 DOCUMENT | Actualizar template |
| `.env.test` | `apps/api/.env.test` | ✅ KEEP | Revisar si se usa |

**Verificaciones**:
- [ ] Todas las URLs usan la nueva contraseña: `RO4YbcQs91csjxm8`
- [ ] Formato de URL es consistente
- [ ] No hay contraseñas viejas hardcodeadas

### 1.2 Archivos de Deploy

| Archivo | Ubicación | Estado | Acción |
|---------|-----------|--------|--------|
| `netlify.toml` | Root | ✅ KEEP | Verificar VITE_API_URL |
| `railway.json` | Root (si existe) | ? | Buscar y revisar |
| `vercel.json` | Root (si existe) | ❌ DELETE | No usamos Vercel |

**Verificaciones**:
- [ ] Netlify apunta a Railway correcto
- [ ] Variables de entorno en Netlify están actualizadas
- [ ] No hay configs de otros servicios (Vercel, Heroku)

### 1.3 Archivos de Documentación

| Archivo | Estado | Contenido Actual | Acción Requerida |
|---------|--------|------------------|------------------|
| `README.md` | ⚠️ UPDATE | Puede estar desactualizado | Revisar y actualizar |
| `CLAUDE.md` | ⚠️ UPDATE | Tiene info de octubre 2025 | Actualizar hallazgos |
| `find-supabase-uri.md` | ✅ KEEP | Instrucciones útiles | Mantener |
| `SINCRONIZACION_MULTI_NAVEGADOR.md` | ❌ DELETE | Solución compleja obsoleta | Eliminar |
| `PLAN_SIMPLIFICACION.md` | 📝 DOCUMENT | Plan técnico | Archivar o actualizar |
| `SOLUCION_FINAL.md` | ✅ KEEP | Solución correcta | Mantener actualizado |
| `DEPLOY_PRODUCCION.md` | ✅ KEEP | Instrucciones de deploy | Actualizar con hallazgos |

**Verificaciones**:
- [ ] README refleja arquitectura actual
- [ ] CLAUDE.md documenta estado real del sistema
- [ ] No hay documentos contradictorios

---

## 🎯 FASE 2: Backend (apps/api)

### 2.1 Configuración de Prisma

| Archivo | Ubicación | Estado | Acción |
|---------|-----------|--------|--------|
| `schema.prisma` | `apps/api/prisma/` | ⚠️ UPDATE | Verificar modelo actualizado |
| Migraciones | `apps/api/prisma/migrations/` | 📝 DOCUMENT | Listar y documentar |
| `seed.ts` | `apps/api/src/` | ? | Verificar si se usa |
| `seed-production.ts` | `apps/api/src/` | ? | Verificar si se usa |
| `simple-seed.ts` | `apps/api/src/` | ? | Verificar si se usa |

**Verificaciones**:
- [ ] Schema refleja estructura real de Supabase
- [ ] Migraciones están aplicadas en producción
- [ ] Seeds están actualizados y funcionan

### 2.2 Servidor y Configuración

| Archivo | Ubicación | Estado | Acción |
|---------|-----------|--------|--------|
| `server.ts` | `apps/api/src/` | ✅ KEEP | Tiene dotenv.config({ override: true }) |
| `server-fixed.ts` | `apps/api/src/` | ❌ DELETE | Archivo de backup obsoleto |
| Archivos de test | `apps/api/` | ? | test-connection.js, test-connection2.js |

**Verificaciones**:
- [ ] server.ts tiene configuración correcta de dotenv
- [ ] PrismaClient se inicializa correctamente
- [ ] No hay archivos duplicados de server

### 2.3 Rutas y Controladores

| Directorio | Archivos a Revisar | Estado | Acción |
|------------|-------------------|--------|--------|
| `routes/` | Todos los archivos .ts | ⚠️ UPDATE | Verificar endpoints activos |
| `controllers/` | Si existe | ? | Revisar lógica |
| `middleware/` | tenant.ts, auth.ts, etc | ⚠️ UPDATE | Verificar funcionamiento |
| `services/` | Si existe | ? | Revisar lógica de negocio |

**Verificaciones**:
- [ ] Todas las rutas están documentadas
- [ ] Middleware de tenant funciona correctamente
- [ ] No hay rutas duplicadas o no usadas

### 2.4 Tests

| Directorio | Estado | Acción |
|------------|--------|--------|
| `__tests__/` | ? | Verificar si los tests corren |
| Test files sueltos | ❌ DELETE | Eliminar test-connection*.js del root |

**Verificaciones**:
- [ ] Tests están actualizados
- [ ] Tests pasan con DB actualizada
- [ ] No hay tests obsoletos

---

## 🎯 FASE 3: Frontend (apps/web)

### 3.1 Stores de Zustand

| Store | Ubicación | Estado | Acción Requerida |
|-------|-----------|--------|------------------|
| `accountsStore.ts` | `apps/web/src/store/` | ⚠️ UPDATE | Tiene complejidad innecesaria |
| `accountsStore.SIMPLE.ts` | `apps/web/src/store/` | 📝 DOCUMENT | Plantilla correcta - implementar |
| `productsStore.ts` | `apps/web/src/store/` | ⚠️ UPDATE | Simplificar como accountsStore.SIMPLE |
| `customersStore.ts` | `apps/web/src/store/` | ⚠️ UPDATE | Simplificar |
| `suppliersStore.ts` | `apps/web/src/store/` | ⚠️ UPDATE | Simplificar |
| `salesStore.ts` | `apps/web/src/store/` | ⚠️ UPDATE | Simplificar |
| `authStore.ts` | `apps/web/src/store/` | ✅ KEEP | Revisar persistencia |

**Verificaciones**:
- [ ] Todos los stores usan API directamente (no syncStorage complejo)
- [ ] No hay BroadcastChannel innecesario
- [ ] localStorage SOLO como cache opcional

### 3.2 Librerías de Sincronización

| Archivo | Ubicación | Estado | Acción |
|---------|-----------|--------|--------|
| `syncStorage.ts` | `apps/web/src/lib/` | ❌ DELETE o 🔄 REFACTOR | Demasiado complejo para necesidad simple |
| `crossBrowserSync.ts` | `apps/web/src/lib/` | ❌ DELETE | Innecesario con DB centralizada |
| `storeWithCrossBrowserSync.ts` | `apps/web/src/lib/` | ❌ DELETE | Innecesario |
| `api.ts` | `apps/web/src/lib/` | ✅ KEEP | Verificar baseURL correcta |

**Verificaciones**:
- [ ] api.ts apunta a Railway en producción
- [ ] No hay lógica de sincronización compleja innecesaria
- [ ] Interceptors de axios funcionan correctamente

### 3.3 Páginas y Componentes

| Directorio | Estado | Acción |
|------------|--------|--------|
| `pages/` | ⚠️ UPDATE | Verificar que usen stores correctos |
| `components/` | ⚠️ UPDATE | Revisar componentes obsoletos |
| `components/forms/` | ⚠️ UPDATE | Verificar formularios conectados |

**Verificaciones**:
- [ ] Páginas usan stores simplificados
- [ ] No hay componentes duplicados
- [ ] Formularios guardan en DB correctamente

### 3.4 Configuración de Build

| Archivo | Ubicación | Estado | Acción |
|---------|-----------|--------|--------|
| `vite.config.ts` | `apps/web/` | ✅ KEEP | Revisar configuración |
| `tsconfig.json` | `apps/web/` | ✅ KEEP | Verificar paths |
| `package.json` | `apps/web/` | ⚠️ UPDATE | Verificar dependencias |

**Verificaciones**:
- [ ] Vite build funciona sin errores
- [ ] TypeScript compila correctamente
- [ ] No hay dependencias no usadas

---

## 🎯 FASE 4: Identificar Archivos Obsoletos

### 4.1 Archivos de Backup/Test

**Buscar y eliminar**:
```bash
# Archivos con extensiones de backup
*.backup
*.old
*.bak
*-old.*
*-backup.*

# Archivos de test temporales
test-*.js (en root, no en __tests__)
temp-*.ts
debug-*.js
```

**Lista preliminar de archivos a revisar**:
- [ ] `apps/api/server-fixed.ts` - ❌ DELETE
- [ ] `apps/api/test-connection.js` - ❌ DELETE
- [ ] `apps/api/test-connection2.js` - ❌ DELETE
- [ ] `apps/api/.env.override` - ❌ DELETE (si existe)
- [ ] `apps/web/src/store/accountsStore.SIMPLE.ts` - 🔄 REFACTOR → Convertir en el principal

### 4.2 Documentación Obsoleta

- [ ] `SINCRONIZACION_MULTI_NAVEGADOR.md` - ❌ DELETE
- [ ] Cualquier .md con info contradictoria

---

## 🎯 FASE 5: Verificación de Conexiones

### 5.1 Base de Datos

**Conexiones a verificar**:

| Entorno | URL Esperada | Estado |
|---------|-------------|--------|
| Local Dev | `postgresql://postgres.bcpanxxwahxbvxueeioj:RO4YbcQs91csjxm8@db.bcpanxxwahxbvxueeioj.supabase.co:5432/postgres` | ⚠️ Verificar |
| Railway Prod | `postgresql://postgres.bcpanxxwahxbvxueeioj:RO4YbcQs91csjxm8@db.bcpanxxwahxbvxueeioj.supabase.co:5432/postgres` | ⚠️ Actualizar |

**Tests**:
```bash
# Desde apps/api
npx prisma db pull     # Debe funcionar
npx prisma generate    # Debe regenerar client
npm run dev           # Backend debe conectar
```

### 5.2 Frontend → Backend

**Conexiones a verificar**:

| Entorno | Frontend URL | Backend URL | Estado |
|---------|-------------|-------------|--------|
| Local | `http://localhost:5000` | `http://localhost:3001/api/v1` | ⚠️ Verificar |
| Producción | `https://obsidiangridmanager.netlify.app` | `https://gridmanager-production.up.railway.app/api/v1` | ⚠️ Verificar |

**Archivo clave**: `apps/web/src/lib/api.ts`
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
```

**Verificar**:
- [ ] `netlify.toml` tiene `VITE_API_URL` correcta
- [ ] Variable de entorno en Netlify dashboard está configurada

### 5.3 Backend → Railway

**Verificar en Railway Dashboard**:
- [ ] Variable `DATABASE_URL` actualizada con contraseña `RO4YbcQs91csjxm8`
- [ ] Puerto correcto (8080 o el que Railway asigne)
- [ ] Logs muestran: `✅ Connected to PostgreSQL (Supabase)`

---

## 🎯 FASE 6: Pruebas End-to-End

### 6.1 Flujo Local

```bash
1. cd apps/api && npm run dev       # Puerto 3001
2. cd apps/web && npm run dev       # Puerto 5000
3. Abrir http://localhost:5000
4. Login → Crear cuenta → Verificar en DB
```

**Checklist**:
- [ ] Backend conecta a Supabase
- [ ] Frontend conecta a backend
- [ ] Datos se guardan en DB
- [ ] Datos persisten al recargar

### 6.2 Flujo Producción

```bash
1. Abrir https://obsidiangridmanager.netlify.app
2. Login (NO "Saltear Login")
3. Crear cuenta "Banco Test"
4. Abrir otro navegador
5. Login mismo usuario
6. Verificar que aparece "Banco Test"
```

**Checklist**:
- [ ] Login funciona sin errores 500
- [ ] Datos se guardan en Supabase
- [ ] Multi-navegador sincroniza (lee de misma DB)
- [ ] No hay datos locales obsoletos

---

## 📊 Resumen de Acciones por Prioridad

### 🔴 CRÍTICO (Hacer AHORA)

1. **Actualizar Railway**:
   - Variable `DATABASE_URL` con contraseña correcta
   - Formato: `postgresql://postgres.bcpanxxwahxbvxueeioj:RO4YbcQs91csjxm8@db.bcpanxxwahxbvxueeioj.supabase.co:5432/postgres`

2. **Verificar Conexión**:
   - Railway debe mostrar: `✅ Connected to PostgreSQL (Supabase)`
   - Login en producción debe funcionar

3. **Limpiar localStorage**:
   - Usuarios deben limpiar cache del navegador
   - Datos viejos causan confusión

### 🟡 IMPORTANTE (Hacer esta semana)

4. **Simplificar Stores**:
   - Usar `accountsStore.SIMPLE.ts` como plantilla
   - Eliminar `syncStorage.ts`, `crossBrowserSync.ts`
   - Mantener SOLO llamadas API directas

5. **Eliminar Archivos Obsoletos**:
   - `server-fixed.ts`
   - `test-connection*.js`
   - `SINCRONIZACION_MULTI_NAVEGADOR.md`

6. **Actualizar Documentación**:
   - `CLAUDE.md` con estado real
   - `README.md` con arquitectura actual
   - `DEPLOY_PRODUCCION.md` con proceso correcto

### 🟢 MEJORAS (Hacer cuando haya tiempo)

7. **Refactorizar Stores**:
   - Todos los stores con patrón simple
   - Eliminar complejidad innecesaria

8. **Mejorar Tests**:
   - Tests actualizados con DB real
   - Tests E2E de flujos principales

9. **Optimizaciones**:
   - Bundle size
   - Performance del frontend

---

## 📝 Checklist de Auditoría Completa

### Configuración
- [ ] Todos los `.env` tienen contraseña correcta
- [ ] Railway variable actualizada
- [ ] Netlify apunta a Railway correcto
- [ ] No hay configs contradictorias

### Backend
- [ ] Prisma schema actualizado
- [ ] server.ts con dotenv override
- [ ] Rutas funcionan correctamente
- [ ] No hay archivos duplicados

### Frontend
- [ ] Stores simplificados
- [ ] API apunta a Railway
- [ ] No hay sincronización local compleja
- [ ] Componentes actualizados

### Archivos Obsoletos
- [ ] Backups eliminados
- [ ] Tests temporales eliminados
- [ ] Documentación contradictoria eliminada
- [ ] Librerías innecesarias eliminadas

### Pruebas
- [ ] Local: Backend → Supabase ✅
- [ ] Local: Frontend → Backend ✅
- [ ] Producción: Login funciona ✅
- [ ] Producción: Datos sincronizan ✅

---

## 🚀 Plan de Ejecución

### Día 1: Arreglar Producción (HOY)
1. Actualizar Railway con DATABASE_URL correcta
2. Verificar logs: `✅ Connected to PostgreSQL`
3. Probar login en producción
4. Confirmar datos se guardan

### Día 2: Limpiar Backend
1. Eliminar archivos obsoletos
2. Actualizar `.env` files
3. Verificar Prisma schema
4. Probar seeds si existen

### Día 3: Simplificar Frontend
1. Implementar accountsStore.SIMPLE
2. Aplicar patrón a otros stores
3. Eliminar syncStorage.ts
4. Eliminar crossBrowserSync.ts

### Día 4: Documentación
1. Actualizar CLAUDE.md
2. Actualizar README.md
3. Revisar DEPLOY_PRODUCCION.md
4. Crear ARCHITECTURE.md si falta

### Día 5: Testing y Validación
1. Tests locales
2. Tests producción
3. Validación multi-navegador
4. Performance check

---

**Última actualización**: 2025-10-12
**Estado**: Plan definido - Comenzar con prioridad CRÍTICA
