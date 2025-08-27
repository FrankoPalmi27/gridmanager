@echo off
echo ==========================================
echo  Arreglando dependencias de Grid Manager
echo ==========================================

echo.
echo 1. Construyendo el paquete types...
cd packages\types
npm install
npm run build
cd ..\..

echo.
echo 2. Instalando dependencias del API...
cd apps\api
npm install
cd ..\..

echo.
echo 3. Instalando dependencias del frontend...
cd apps\web
npm install
cd ..\..

echo.
echo 4. Generando cliente de Prisma...
cd apps\api
npm run db:generate
cd ..\..

echo.
echo 5. Probando el backend...
cd apps\api
set PORT=5001
npm run dev &
cd ..\..

echo.
echo ==========================================
echo  ✅ Dependencias arregladas!
echo ==========================================
echo.
echo Ahora puedes ejecutar:
echo   npm run dev
echo.
echo Y acceder a: http://localhost:5000
echo ==========================================

pause