# Grid Manager - Sistema de Gestión Empresarial

Un sistema de gestión empresarial moderno y escalable desarrollado con React, Node.js, TypeScript y PostgreSQL.

## 🚀 Características Principales

### 📊 Dashboard Completo
- Resumen financiero en tiempo real
- Gráficos de ventas y métricas clave
- Tareas pendientes y onboarding
- Cotización de divisas (mock)

### 💰 Gestión de Ingresos
- **Ventas a clientes**: ABM completo con facturación
- **Presupuestos**: Conversión automática a ventas
- **Otros ingresos**: Registro de ingresos adicionales
- Control de estado de ventas y stock automático

### 💸 Gestión de Egresos
- **Compras a proveedores**: Gestión completa de compras
- **Otros egresos**: Registro de gastos operativos
- Actualización automática de stock y cuentas

### 👥 Gestión de Contactos
- **Clientes**: ABM con cuenta corriente y límites de crédito
- **Proveedores**: Gestión comercial y cuenta corriente
- Historial completo de transacciones

### 📦 Gestión de Productos
- Catálogo completo con SKU, categorías y marcas
- Control de stock con mínimos y movimientos
- Listas de precios con vigencias
- Valorización de inventario

### 🏦 Gestión Financiera
- **Cuentas**: Bancos, cajas, tarjetas de crédito
- **Movimientos**: Registro de ingresos y egresos
- **Cobros y Pagos**: Múltiples medios de pago
- Conciliación bancaria básica

### 📈 Reportes e Informes
- Cuenta corriente de clientes y proveedores
- Informes de ventas, compras y stock
- Ranking de productos y mejores clientes
- Informes financieros y de rentabilidad
- Reportes de vendedores y sucursales

### 👤 Gestión de Usuarios
- Sistema de roles (Admin, Manager, Analyst, Seller)
- Control de acceso basado en roles (RBAC)
- Gestión de sucursales y permisos

### 🔒 Seguridad
- Autenticación JWT con refresh tokens
- Hashing seguro de contraseñas con bcrypt
- Rate limiting y validaciones
- Logs de auditoría completos

## 🏗️ Arquitectura Técnica

### Backend
- **Framework**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL + Prisma ORM
- **Cache**: Redis para sesiones y cache
- **Validación**: Zod para esquemas
- **Documentación**: Swagger/OpenAPI automática

### Frontend
- **Framework**: React 18 + TypeScript
- **Build tool**: Vite
- **Routing**: React Router v6
- **State management**: Zustand + React Query
- **UI**: TailwindCSS + Headless UI
- **Formularios**: React Hook Form + Zod
- **Charts**: Recharts

### DevOps & Desarrollo
- **Monorepo**: PNPM workspaces
- **Linting**: ESLint + Prettier
- **Git hooks**: Husky + lint-staged
- **Testing**: Vitest (backend) + Testing Library (frontend)
- **Containerización**: Docker + Docker Compose

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- PNPM 8+

### Instalación Rápida

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd grid-manager
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Iniciar servicios con Docker**
```bash
docker compose up -d
```

5. **Configurar base de datos**
```bash
pnpm run db:migrate
pnpm run db:seed
```

6. **Iniciar aplicación**
```bash
pnpm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:4000
- **Backend API**: http://localhost:4001
- **API Docs**: http://localhost:4001/api-docs

### Usando Makefile (Opcional)

```bash
# Setup completo
make setup

# Desarrollo completo (Docker + setup + dev)
make dev-setup

# Solo desarrollo
make dev

# Solo build
make build

# Tests
make test
```

## 🔑 Credenciales Demo

El sistema viene con usuarios pre-configurados para pruebas:

| Rol | Email | Contraseña | Descripción |
|-----|--------|------------|-------------|
| **Admin** | admin@gridmanager.com | admin123 | Acceso completo al sistema |
| **Manager** | manager@gridmanager.com | manager123 | Gestión general sin usuarios |
| **Seller** | vendedor1@gridmanager.com | seller123 | Ventas y clientes |
| **Analyst** | analista@gridmanager.com | analyst123 | Solo lectura y reportes |

## 📊 Estructura del Proyecto

```
grid-manager/
├── apps/
│   ├── api/              # Backend API
│   │   ├── src/
│   │   │   ├── routes/   # Endpoints de la API
│   │   │   ├── middleware/ # Middlewares
│   │   │   ├── utils/    # Utilidades
│   │   │   └── prisma/   # Schema de base de datos
│   │   └── tests/        # Tests del backend
│   └── web/              # Frontend React
│       ├── src/
│       │   ├── components/ # Componentes React
│       │   ├── pages/    # Páginas/Vistas
│       │   ├── store/    # Estado global
│       │   └── lib/      # Utilidades y API client
│       └── tests/        # Tests del frontend
├── packages/
│   ├── types/            # Types compartidos
│   └── ui/               # Componentes UI compartidos
└── docker-compose.yml    # Servicios Docker
```

## 🛠️ Scripts Disponibles

### Globales (desde root)
```bash
pnpm dev          # Desarrollo (frontend + backend)
pnpm build        # Build de producción
pnpm test         # Ejecutar todos los tests
pnpm lint         # Linting de código
pnpm format       # Formateo con Prettier
pnpm db:migrate   # Ejecutar migraciones
pnpm db:seed      # Poblar base de datos
pnpm db:reset     # Reset completo de BD
```

### Backend específico
```bash
pnpm --filter=api dev        # Solo backend
pnpm --filter=api test       # Tests backend
pnpm --filter=api db:studio  # Prisma Studio
```

### Frontend específico
```bash
pnpm --filter=web dev        # Solo frontend
pnpm --filter=web test       # Tests frontend
pnpm --filter=web build      # Build frontend
```

## 🔧 Configuración de Entorno

### Variables de Backend (.env)
```env
# Base de datos
DATABASE_URL="postgresql://user:pass@localhost:5432/grid_manager"
REDIS_URL="redis://localhost:6379"

# JWT (cambiar en producción)
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Servidor
NODE_ENV="development"
PORT="3001"
CORS_ORIGIN="http://localhost:3000"
```

### Variables de Frontend (.env.local)
```env
VITE_API_URL="http://localhost:3001/api/v1"
```

## 📋 Funcionalidades por Rol

### 🔴 Admin (Acceso Total)
- Gestión completa de usuarios y roles
- Configuración del sistema
- Acceso a todos los módulos y reportes
- Gestión de sucursales

### 🟡 Manager (Gestión Operativa)
- Todas las funciones excepto gestión de usuarios admin
- Creación de usuarios (no admin)
- Acceso completo a reportes y configuraciones
- Gestión de sucursal asignada

### 🟢 Analyst (Solo Lectura + Reportes)
- Acceso de solo lectura a registros
- Generación y exportación de reportes
- Visualización de dashboards y métricas
- Sin capacidad de modificación

### 🔵 Seller (Ventas y Clientes)
- Gestión de clientes y productos
- Creación y gestión de ventas/presupuestos
- Acceso limitado a su sucursal
- Reportes básicos de rendimiento

## 🐳 Despliegue con Docker

### Desarrollo
```bash
docker compose up -d
```

### Producción
```bash
docker compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### Backend Tests
```bash
cd apps/api
pnpm test
pnpm test:coverage
```

### Frontend Tests  
```bash
cd apps/web
pnpm test
pnpm test:ui
```

### E2E Tests (Future)
```bash
pnpm test:e2e
```

## 📈 Métricas y Monitoring

### Health Check
- **Backend**: `GET /health`
- **Database**: Incluido en health check
- **Redis**: Incluido en health check

### Logs
- Logs estructurados con timestamps
- Levels: error, warn, info, debug
- Audit logs para acciones críticas

## 🚦 Roadmap y Mejoras Futuras

### Corto Plazo
- [ ] Completar todas las vistas CRUD
- [ ] Integración con AFIP (Argentina)
- [ ] Reportes avanzados con filtros
- [ ] Notificaciones en tiempo real

### Mediano Plazo
- [ ] App móvil (React Native)
- [ ] Integración con sistemas de pago
- [ ] Workflow de aprobaciones
- [ ] Sistema de inventario avanzado

### Largo Plazo
- [ ] BI y Analytics avanzados
- [ ] Integración con ERPs
- [ ] Multi-tenancy
- [ ] API pública para integraciones

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Crear Pull Request

### Standards
- TypeScript estricto
- Conventional Commits
- Tests para nuevas features
- Documentación actualizada

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte y preguntas:

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentación**: Ver `/docs` para documentación detallada
- **API**: Swagger UI disponible en `/api-docs`

## 🙏 Agradecimientos

- [Prisma](https://prisma.io) - ORM
- [TailwindCSS](https://tailwindcss.com) - Styling
- [React Query](https://tanstack.com/query) - Data fetching
- [Zustand](https://github.com/pmndrs/zustand) - State management

---

**Grid Manager** - Sistema de Gestión Empresarial © 2024