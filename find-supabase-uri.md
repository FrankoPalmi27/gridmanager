# 🔍 Cómo encontrar tu URI de Supabase

## Método 1: Desde Settings > Database
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Settings (⚙️) → Database
4. Scroll hacia abajo hasta "Connection string"
5. Copia la URI

## Método 2: Desde Settings > API  
1. Settings → API
2. Busca "Database URL" 
3. Copia la URL completa

## Método 3: Construir manualmente
Si ves los parámetros separados:

```
Host: db.XXXXXXXX.supabase.co
Database: postgres  
User: postgres.XXXXXXXX
Password: [tu-password]
Port: 5432
```

La URI sería:
```
postgresql://postgres.XXXXXXXX:[tu-password]@db.XXXXXXXX.supabase.co:5432/postgres
```

## ⚠️ Notas importantes:
- Reemplaza `[tu-password]` con la contraseña real (sin corchetes)
- La "X" representa el ID único de tu proyecto
- NO uses espacios en la URL
- La base de datos siempre se llama `postgres` (no cambies esto)

## ✅ Ejemplo real:
```
postgresql://postgres.abcd1234:MiPassword123@db.abcd1234.supabase.co:5432/postgres
```