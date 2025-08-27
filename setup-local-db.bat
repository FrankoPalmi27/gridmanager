@echo off
echo ==========================================
echo  Configuración de PostgreSQL Local
echo ==========================================

echo.
echo Si Supabase no funciona, podemos usar Docker para PostgreSQL local:
echo.

echo 1. Detener cualquier servicio corriendo...
docker compose down 2>nul

echo.
echo 2. Iniciar solo PostgreSQL...
echo version: '3.8'>docker-compose-local.yml
echo.>>docker-compose-local.yml
echo services:>>docker-compose-local.yml
echo   postgres:>>docker-compose-local.yml
echo     image: postgres:15-alpine>>docker-compose-local.yml
echo     environment:>>docker-compose-local.yml
echo       POSTGRES_DB: grid_manager>>docker-compose-local.yml
echo       POSTGRES_USER: postgres>>docker-compose-local.yml
echo       POSTGRES_PASSWORD: postgres>>docker-compose-local.yml
echo     ports:>>docker-compose-local.yml
echo       - '5432:5432'>>docker-compose-local.yml
echo     volumes:>>docker-compose-local.yml
echo       - postgres_data:/var/lib/postgresql/data>>docker-compose-local.yml
echo.>>docker-compose-local.yml
echo volumes:>>docker-compose-local.yml
echo   postgres_data:>>docker-compose-local.yml

docker compose -f docker-compose-local.yml up -d

echo.
echo 3. Esperando que PostgreSQL esté listo...
timeout /t 10 /nobreak >nul

echo.
echo 4. Configurando .env para DB local...
echo # Database - LOCAL PostgreSQL>.env.local
echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/grid_manager">>.env.local
echo.>>.env.local
echo # JWT Secrets>>.env.local
echo JWT_SECRET="your-super-secret-jwt-key-change-in-production">>.env.local  
echo JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production">>.env.local
echo.>>.env.local
echo # Server Configuration>>.env.local
echo NODE_ENV="development">>.env.local
echo PORT="5001">>.env.local
echo CORS_ORIGIN="http://localhost:5000">>.env.local
echo VITE_API_URL="http://localhost:5001/api/v1">>.env.local

copy .env.local apps\api\.env

echo.
echo ==========================================
echo  ✅ PostgreSQL Local configurado!
echo ==========================================
echo.
echo Siguiente paso:
echo   npm run db:migrate
echo   npm run db:seed  
echo   npm run dev
echo ==========================================

pause