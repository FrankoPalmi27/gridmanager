@echo off
echo ========================================
echo    GRID MANAGER - DEPLOY TO PRODUCTION
echo ========================================

echo.
echo 1. Building frontend...
cd apps\web
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo 2. Building backend...
cd ..\api
call npm run build
if %errorlevel% neq 0 (
    echo Backend build failed!
    pause
    exit /b 1
)

echo.
echo 3. Testing backend...
call npm test
if %errorlevel% neq 0 (
    echo Backend tests failed!
    pause
    exit /b 1
)

echo.
echo 4. Deploying to Railway (Backend)...
call railway deploy

echo.
echo 5. Deploying to Netlify (Frontend)...
cd ..\web
call netlify deploy --prod --dir=dist

echo.
echo ========================================
echo           DEPLOYMENT COMPLETE!
echo ========================================
echo Backend URL: https://gridmanager-api.up.railway.app
echo Frontend URL: https://gridmanager.netlify.app
echo.
echo Login credentials:
echo Tenant: gridmanager
echo Email: admin@gridmanager.com
echo Password: GridManager2025!
echo ========================================

pause