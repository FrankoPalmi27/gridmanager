# 🚨 DIAGNÓSTICO ERROR 500 EN RAILWAY

**Fecha**: 2025-10-12
**Estado**: Error persiste después de actualizar DATABASE_URL

---

## 🔍 SÍNTOMAS

```
POST https://gridmanager-production.up.railway.app/api/v1/tenant/login 500 (Internal Server Error)
Response: {"success":false,"error":"Internal server error"}
```

- ✅ El servidor está UP (`/health` responde OK)
- ❌ El endpoint `/api/v1/tenant/login` falla con 500

---

## 🎯 CAUSA MÁS PROBABLE

**Conexión a la base de datos Supabase está fallando en Railway.**

Posibles razones:
1. DATABASE_URL tiene formato incorrecto
2. DATABASE_URL tiene espacios o caracteres invisibles
3. Railway no re-deployó después del cambio
4. Puerto 5432 está bloqueado en Railway (necesita pooler)
5. La contraseña de Supabase cambió de nuevo

---

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Verificar el valor EXACTO en Railway

1. Ve a Railway Dashboard
2. Abre tu proyecto → Variables
3. Haz clic en `DATABASE_URL` para ver el valor completo
4. **Copia EXACTAMENTE lo que ves** y pégalo en un archivo de texto

### PASO 2: Comparar con los valores correctos

Compara lo que tienes en Railway con estas 2 opciones:

#### ✅ OPCIÓN A: Conexión Directa (puerto 5432)
```
postgresql://postgres.bcpanxxwahxbvxueeioj:RO4YbcQs91csjxm8@db.bcpanxxwahxbvxueeioj.supabase.co:5432/postgres
```

**Características**:
- Puerto: `5432`
- Host: `db.bcpanxxwahxbvxueeioj.supabase.co`
- Username: `postgres.bcpanxxwahxbvxueeioj` (con el sufijo completo)
- Password: `RO4YbcQs91csjxm8`

#### ✅ OPCIÓN B: Pooler (puerto 6543) - SI OPCIÓN A NO FUNCIONA
```
postgresql://postgres:RO4YbcQs91csjxm8@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Características**:
- Puerto: `6543`
- Host: `aws-1-us-east-1.pooler.supabase.com`
- Username: `postgres` (SIN sufijo - esto es crítico)
- Password: `RO4YbcQs91csjxm8`
- Query param: `?pgbouncer=true`

### PASO 3: Actualizar en Railway (si no coincide)

1. **Borra completamente** el valor actual de `DATABASE_URL` en Railway
2. **Copia y pega** una de las opciones de arriba (empieza con Opción A)
3. **Verifica que NO haya**:
   - Espacios al principio o al final
   - Comillas (`"` o `'`)
   - Saltos de línea
4. **Guarda** la variable
5. **Espera 2-3 minutos** a que Railway re-deployee

### PASO 4: Verificar que la contraseña es correcta

La contraseña actual según Supabase debe ser: `RO4YbcQs91csjxm8`

**Para verificar**:
1. Ve a Supabase Dashboard
2. Settings → Database
3. Connection String → Mira la password
4. **Si es diferente**, actualiza TODAS las ocurrencias en Railway y en el código

---

## 🧪 TESTS DE VERIFICACIÓN

### Test 1: Health Check (debería funcionar)
```bash
curl https://gridmanager-production.up.railway.app/health
```

**Respuesta esperada**:
```json
{"status":"ok","timestamp":"...","port":"8080"}
```

### Test 2: Login (debería funcionar después del fix)
Desde tu navegador, intenta hacer login en:
```
https://obsidiangridmanager.netlify.app
```

**Si funciona**: Deberías poder iniciar sesión sin error 500

**Si sigue fallando**: Ve al PASO 5

---

## 🔧 PASO 5: SI OPCIÓN A NO FUNCIONA - PROBAR OPCIÓN B

Algunos entornos de Railway bloquean el puerto 5432. Si después de 5 minutos sigue fallando:

1. Ve a Railway → Variables
2. Reemplaza `DATABASE_URL` con **OPCIÓN B** (pooler)
3. **CRÍTICO**: Asegúrate que el username sea `postgres` (SIN sufijo)
4. Guarda y espera re-deploy

---

## 📊 CHECKLIST DE VERIFICACIÓN

Marca cada item después de verificarlo:

- [ ] DATABASE_URL en Railway coincide EXACTAMENTE con Opción A o B
- [ ] No hay espacios extra, comillas, ni saltos de línea
- [ ] La password es `RO4YbcQs91csjxm8`
- [ ] Railway re-deployó (timestamp del último deploy es reciente)
- [ ] El endpoint `/health` responde OK
- [ ] Esperé al menos 3 minutos después de cambiar la variable

---

## 🆘 SI NADA FUNCIONA

Si después de probar ambas opciones el error persiste:

### Opción 1: Verificar logs de Railway

1. Railway → Deployments → Último deployment
2. Click en "View Logs"
3. Busca líneas con:
   - `error`
   - `database`
   - `connection`
   - `authentication`
4. **Copia y pégame los errores específicos**

### Opción 2: Verificar que Supabase no está pausado

1. Ve a Supabase Dashboard
2. Tu proyecto `bcpanxxwahxbvxueeioj`
3. Si aparece "Project is paused" → Click en "Restore"
4. Espera 2 minutos y prueba de nuevo

### Opción 3: Regenerar password de Supabase

1. Supabase → Settings → Database
2. Database password → Reset password
3. **Guarda la nueva password**
4. Actualiza en Railway
5. Actualiza en el código local (`.env`, `.env.production`)

---

## 💡 DATOS ADICIONALES QUE NECESITO

Para ayudarte mejor, por favor envíame:

1. **El valor EXACTO** de `DATABASE_URL` que tienes en Railway (puedes ocultar la password si quieres)
2. **Screenshot** de la página de variables en Railway (opcional)
3. **Logs de Railway** si los puedes copiar (busca las últimas 20-30 líneas)
4. **Confirma**: ¿Supabase está activo (no pausado)?

---

## 📝 FORMATOS PARA COMPARAR

### ❌ INCORRECTOS (causarán error 500):

```
# Formato pooler con username incorrecto
postgresql://postgres.bcpanxxwahxbvxueeioj:RO4YbcQs91csjxm8@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# Con comillas (incorrecto)
"postgresql://postgres.bcpanxxwahxbvxueeioj:RO4YbcQs91csjxm8@db.bcpanxxwahxbvxueeioj.supabase.co:5432/postgres"

# Con espacios (incorrecto)
postgresql://postgres.bcpanxxwahxbvxueeioj:RO4YbcQs91csjxm8@db.bcpanxxwahxbvxueeioj.supabase.co:5432/postgres

# Password incorrecta (incorrecto)
postgresql://postgres.bcpanxxwahxbvxueeioj:GRIDMANAGER_2025@db.bcpanxxwahxbvxueeioj.supabase.co:5432/postgres
```

### ✅ CORRECTOS:

```
# Directo (puerto 5432)
postgresql://postgres.bcpanxxwahxbvxueeioj:RO4YbcQs91csjxm8@db.bcpanxxwahxbvxueeioj.supabase.co:5432/postgres

# Pooler (puerto 6543) - username SIN sufijo
postgresql://postgres:RO4YbcQs91csjxm8@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

**Última actualización**: 2025-10-12
**Próximo paso**: Verificar DATABASE_URL en Railway y comparar con las opciones correctas
