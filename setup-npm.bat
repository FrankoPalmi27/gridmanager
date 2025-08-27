@echo off
echo ==========================================
echo  Grid Manager - Setup con NPM
echo ==========================================

echo.
echo 1. Copiando configuracion de NPM...
copy package-npm.json package.json

echo.
echo 2. Instalando dependencias del proyecto principal...
npm install

echo.
echo 3. Instalando dependencias del backend...
cd apps\api
npm install
cd ..\..

echo.
echo 4. Instalando dependencias del frontend...
cd apps\web
npm install
cd ..\..

echo.
echo 5. Instalando dependencias de types...
cd packages\types
npm install
cd ..\..

echo.
echo 6. Copiando variables de entorno...
copy .env.example .env

echo.
echo ==========================================
echo  Setup completado!
echo ==========================================
echo.
echo Para continuar:
echo 1. docker compose up -d
echo 2. npm run db:migrate
echo 3. npm run db:seed  
echo 4. npm run dev
echo.
echo Accede a: http://localhost:4000
echo ==========================================

pause