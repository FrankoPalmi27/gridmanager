@echo off
echo ==========================================
echo  Grid Manager - Setup con NPM (Corregido)
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
cd ..\..

echo.
echo 5. Construyendo el paquete types...
cd packages\types
npm run build
cd ..\..

echo.
echo 6. Copiando variables de entorno...
if not exist .env copy .env.example .env

echo.
echo 7. Verificando si Docker esta disponible...
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  ADVERTENCIA: Docker no esta disponible
    echo    Puedes instalarlo desde: https://www.docker.com/products/docker-desktop
    echo    O continuar sin Docker usando una base de datos local
    echo.
    goto :SKIP_DOCKER
)

echo.
echo 8. Iniciando servicios de Docker...
docker compose up -d
if errorlevel 1 (
    echo.
    echo ❌ Error al iniciar Docker. Verifica que Docker Desktop esté corriendo
    echo.
    goto :SKIP_DOCKER
)

echo.
echo 9. Esperando que la base de datos esté lista...
timeout /t 10 /nobreak >nul

echo.
echo 10. Configurando base de datos...
npm run db:migrate
npm run db:seed

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
goto :END

:SKIP_DOCKER
echo.
echo ==========================================
echo  ⚠️  Setup parcial completado
echo ==========================================
echo.
echo Sin Docker necesitas:
echo 1. Instalar PostgreSQL localmente
echo 2. Crear base de datos 'grid_manager'
echo 3. Configurar .env con tu conexion local
echo 4. npm run db:migrate
echo 5. npm run db:seed
echo 6. npm run dev
echo.

:END
echo Credenciales demo:
echo - Admin: admin@gridmanager.com / admin123
echo - Manager: manager@gridmanager.com / manager123  
echo - Vendedor: vendedor1@gridmanager.com / seller123
echo ==========================================

pause