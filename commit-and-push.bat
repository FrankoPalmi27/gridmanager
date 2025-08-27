@echo off
echo ==========================================
echo  Preparando archivos para deploy
echo ==========================================

echo.
echo 1. Agregando todos los archivos...
git add .

echo.
echo 2. Creando commit...
git commit -m "Setup for deployment: separate frontend and backend configs

- Added netlify.toml for frontend deploy
- Added Railway/Vercel configs for backend
- Updated package.json for proper builds
- Fixed memory issues in build process"

echo.
echo 3. Haciendo push a GitHub...
git push origin main

echo.
echo ==========================================
echo  ✅ Archivos listos en GitHub!
echo ==========================================
echo.
echo Siguiente paso: Deploy del backend en Railway
echo Ve a: https://railway.app/
echo ==========================================

pause