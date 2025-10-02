# Sistema de Registro de Usuarios - Grid Manager

## 🎯 Implementación Completa

Se ha implementado un sistema completo de registro de usuarios que permite crear cuentas nuevas con sincronización backend automática.

## 🔑 Características del Sistema

### 1. Registro de Tenants (Empresas)
- **Endpoint**: `POST /api/v1/auth/register-tenant`
- **Público**: No requiere autenticación previa
- **Crea automáticamente**:
  - ✅ Tenant (empresa)
  - ✅ Branch principal (sucursal)
  - ✅ Usuario administrador
  - ✅ Tokens de acceso (JWT)

### 2. Datos Requeridos
```typescript
{
  name: string,          // Nombre del usuario
  email: string,         // Email (será el username)
  password: string,      // Contraseña (mínimo 6 caracteres)
  tenantName: string     // Nombre de la empresa
}
```

### 3. Beneficios de Cuenta Nueva
- 🎁 **14 días de prueba gratuita**
- ✅ **Todas las funcionalidades habilitadas**
- 💳 **No requiere tarjeta de crédito**
- 🏢 **Datos aislados por tenant** (multi-tenancy)

## 🖥️ Interfaz de Usuario

### Tabs de Navegación
La página de login ahora tiene dos tabs:
1. **Iniciar Sesión** - Login tradicional
2. **Crear Cuenta** - Registro nuevo

### Modo Login
- Email y contraseña
- Botón "Iniciar sesión"
- Login con Google
- Botón "Saltear Login" (solo testing)
- Credenciales de demo

### Modo Registro
- Nombre completo
- Nombre de la empresa
- Email
- Contraseña
- Botón "Crear cuenta"
- Mensaje de beneficios de prueba

## 🔄 Flujo de Registro

### Paso a Paso
1. Usuario hace clic en tab "Crear Cuenta"
2. Completa formulario:
   - **Nombre**: "Juan Pérez"
   - **Empresa**: "Mi Empresa S.A."
   - **Email**: "admin@miempresa.com"
   - **Contraseña**: "mipassword123"
3. Click en "Crear cuenta"
4. Sistema llama a `/auth/register-tenant`
5. Backend crea:
   - Tenant con slug único
   - Branch "Principal"
   - Usuario ADMIN con rol completo
6. Backend retorna:
   - User object
   - Access token
   - Refresh token
7. Frontend guarda tokens en authStore
8. Redirección automática a `/dashboard`

### Respuesta del Backend
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm4pek4s00001wevbnkp6r5p3",
      "name": "Juan Pérez",
      "email": "admin@miempresa.com",
      "role": "ADMIN",
      "tenantId": "cm4pek4s00000wevb0n6wrxqx",
      "branchId": "cm4pek4s00002wevbhq71tg9x"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

## 🔐 Diferencias con Registro Normal

### `/auth/register` (PROTEGIDO)
- ❌ Requiere autenticación
- ❌ Solo ADMIN/MANAGER pueden crear usuarios
- ✅ Crea usuarios dentro del tenant existente
- ✅ No crea tenant nuevo

### `/auth/register-tenant` (PÚBLICO) ✅
- ✅ No requiere autenticación
- ✅ Cualquiera puede registrarse
- ✅ Crea tenant + branch + usuario
- ✅ Usuario inicial es ADMIN automáticamente

## 📱 Validaciones Frontend

### Esquema de Validación (Zod)
```typescript
const RegisterSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  tenantName: z.string().min(2, 'El nombre de la empresa debe tener al menos 2 caracteres'),
});
```

### Mensajes de Error
- Nombre muy corto: "El nombre debe tener al menos 2 caracteres"
- Email inválido: "Email inválido"
- Contraseña corta: "La contraseña debe tener al menos 6 caracteres"
- Empresa sin nombre: "El nombre de la empresa debe tener al menos 2 caracteres"

## 🧪 Prueba del Sistema

### Usando la UI
1. Ir a https://obsidiangridmanager.netlify.app/login
2. Click en tab "Crear Cuenta"
3. Completar formulario
4. Click en "Crear cuenta"
5. Verificar redirección a dashboard
6. Verificar que datos sincronicen entre navegadores

### Usando curl (Testing Manual)
```bash
curl -X POST "https://gridmanager-production.up.railway.app/api/v1/auth/register-tenant" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@testempresa.com",
    "name": "Admin Test",
    "password": "test123",
    "tenantName": "Empresa de Prueba"
  }'
```

## 🔧 Archivos Modificados

### 1. `apps/web/src/pages/LoginPage.tsx`
- Agregado estado `mode` para tabs
- Dos formularios separados (loginForm, registerForm)
- Función `onRegisterSubmit` con llamada directa a API
- UI con tabs de navegación
- Validaciones con react-hook-form + zod
- Mensajes contextuales por modo

### 2. `apps/web/src/lib/syncStorage.ts`
- Modificado `isAuthenticated()` para excluir mock tokens
- Previene llamadas API con tokens inválidos

## 🎨 Experiencia de Usuario

### Beneficios Visuales
- 🎯 Tabs claros entre Login y Registro
- 🎨 Diseño consistente con resto de la app
- ✅ Validación en tiempo real
- 🔄 Loading states durante creación
- ❌ Mensajes de error claros
- 🚀 Redirección automática post-registro

### Estados de Carga
- Login: "Iniciando sesión..."
- Registro: "Creando cuenta..."
- Botones deshabilitados durante proceso
- Spinner visual

## 📊 Plan de Tenants

### Estado Inicial
- **Plan**: TRIAL
- **Duración**: 14 días
- **Fecha de expiración**: Automática (createdAt + 14 días)
- **Funcionalidades**: Todas habilitadas

### Campos en Base de Datos
```prisma
model Tenant {
  id         String   @id @default(cuid())
  name       String
  slug       String   @unique
  email      String
  status     String   @default("TRIAL")
  plan       String   @default("TRIAL")
  trialEnds  DateTime
  createdAt  DateTime @default(now())
  // ... relaciones
}
```

## 🔄 Sincronización Multi-Browser

### Antes del Registro
- ❌ Mock token → localStorage only
- ❌ Sin sincronización entre navegadores
- ⚠️ Datos solo locales

### Después del Registro
- ✅ Token real → API sync habilitado
- ✅ Datos sincronizados entre navegadores
- ✅ Persistencia en base de datos PostgreSQL
- ✅ Todos los stores sincronizados:
  - Customers
  - Sales
  - Products
  - Accounts
  - Suppliers

## 🚨 Manejo de Errores

### Errores Comunes
1. **Email ya existe**:
   - Backend: "Email already registered"
   - Frontend: Muestra mensaje de error

2. **Error de red**:
   - Frontend: "Error al registrar usuario"
   - Logs en consola para debugging

3. **Validación fallida**:
   - Mensajes específicos por campo
   - Highlighting de campos con error

## 📝 Próximos Pasos

### Mejoras Sugeridas
1. **Email verification**:
   - Enviar email de confirmación
   - Activar cuenta al verificar

2. **Password recovery**:
   - Forgot password flow
   - Reset password por email

3. **Plan upgrade**:
   - Página de planes
   - Upgrade de TRIAL a PAID

4. **Onboarding**:
   - Tour guiado para nuevos usuarios
   - Setup wizard inicial

5. **Multi-language**:
   - i18n para registro
   - Soporte español/inglés

## 🎉 Conclusión

El sistema de registro está completamente funcional y permite:
- ✅ Crear cuentas nuevas sin autenticación previa
- ✅ Sincronización automática entre navegadores
- ✅ Datos persistentes en base de datos
- ✅ Multi-tenancy completo
- ✅ Trial de 14 días incluido

Los usuarios ahora pueden registrarse directamente desde la app y comenzar a usar Grid Manager con todas sus funcionalidades.

---

**Última actualización**: 2025-10-02
**Estado**: ✅ Implementado y desplegado
**Deployment**: https://obsidiangridmanager.netlify.app/login
