@echo off
echo ==========================================
echo  Grid Manager - Setup con Supabase
echo ==========================================

echo.
echo 1. Instalando dependencias principales...
npm install

echo.
echo 2. Instalando dependencias del backend...
cd apps\api
npm install
cd ..\..

echo.
echo 3. Instalando dependencias del frontend...
cd apps\web
npm install
cd ..\..

echo.
echo 4. Instalando dependencias de types...
cd packages\types
npm install
npm run build
cd ..\..

echo.
echo 5. Configurando variables de entorno...
if not exist .env copy .env.example .env
if not exist apps\api\.env copy apps\api\.env.example apps\api\.env

echo.
echo ==========================================
echo  ⚠️  CONFIGURACION REQUERIDA
echo ==========================================
echo.
echo ANTES DE CONTINUAR:
echo.
echo 1. Ve a https://supabase.com/dashboard
echo 2. Selecciona tu proyecto 'grid-manager'
echo 3. Ve a Settings ^> Database
echo 4. Copia la "Connection string" (URI)
echo 5. Edita el archivo .env
echo 6. Reemplaza DATABASE_URL con tu conexion de Supabase
echo.
echo La URL se ve asi:
echo postgresql://postgres.xxxx:[TU-PASSWORD]@aws-xxx.pooler.supabase.com:6543/postgres
echo.
echo Presiona ENTER cuando hayas configurado la DATABASE_URL...
pause

echo.
echo 6. Configurando base de datos...
npm run db:migrate
if errorlevel 1 (
    echo.
    echo ❌ Error en migraciones. Verifica tu DATABASE_URL en .env
    pause
    exit /b 1
)

echo.
echo 7. Poblando base de datos con datos de prueba...
npm run db:seed
if errorlevel 1 (
    echo.
    echo ❌ Error en seed. Verifica la conexion a la base de datos
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  ✅ Setup completado exitosamente!
echo ==========================================
echo.
echo Para iniciar la aplicacion:
echo   npm run dev
echo.
echo Accede a: http://localhost:4000
echo API Docs: http://localhost:4001/api-docs
echo.
echo Credenciales demo:
echo - Admin: admin@gridmanager.com / admin123
echo - Manager: manager@gridmanager.com / manager123
echo - Vendedor: vendedor1@gridmanager.com / seller123
echo - Analista: analista@gridmanager.com / analyst123
echo ==========================================

pause