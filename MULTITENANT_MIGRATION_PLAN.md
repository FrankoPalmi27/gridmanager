# Grid Manager - Plan de Migración Multi-Tenant

## 🎯 Objetivo
Convertir Grid Manager de una aplicación single-tenant a una plataforma SaaS multi-tenant donde múltiples clientes pueden registrarse y usar sus propias instancias aisladas.

## 📋 Fases de Implementación

### **FASE 1: Preparación de Base de Datos (1-2 semanas)**

#### 1.1 Agregar Modelo Tenant
```prisma
model Tenant {
  id          String       @id @default(cuid())
  name        String       // Nombre de la empresa
  slug        String       @unique // empresa.gridmanager.com
  email       String       @unique
  plan        TenantPlan   @default(TRIAL)
  status      TenantStatus @default(TRIAL)
  settings    Json?        // Personalización
  limits      Json?        // Límites por plan
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

#### 1.2 Agregar tenantId a Todas las Entidades
- Modificar TODOS los modelos existentes para incluir `tenantId`
- Agregar relación `tenant Tenant @relation(fields: [tenantId], references: [id])`
- Ejemplo:
```prisma
model Customer {
  id       String @id @default(cuid())
  tenantId String  // NUEVO
  name     String
  // ... resto de campos

  tenant   Tenant @relation(fields: [tenantId], references: [id]) // NUEVO
}
```

#### 1.3 Migración de Datos Existentes
```sql
-- Script de migración para datos existentes
-- 1. Crear tenant por defecto para datos actuales
INSERT INTO tenants (id, name, slug, email, plan, status)
VALUES ('default-tenant-id', 'Mi Empresa', 'mi-empresa', 'admin@miempresa.com', 'ENTERPRISE', 'ACTIVE');

-- 2. Asignar tenantId a todos los registros existentes
UPDATE customers SET tenantId = 'default-tenant-id';
UPDATE products SET tenantId = 'default-tenant-id';
UPDATE sales SET tenantId = 'default-tenant-id';
-- ... para todas las tablas
```

### **FASE 2: Backend Multi-Tenant (2-3 semanas)**

#### 2.1 Middleware de Tenant Context
```typescript
// apps/api/src/middleware/tenant.ts
export const tenantMiddleware = async (req, res, next) => {
  try {
    // Extraer tenant desde:
    const tenantSlug = extractTenantFromRequest(req);

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Tenant not found or inactive' });
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (error) {
    next(error);
  }
};
```

#### 2.2 Modificar Todas las Rutas API
```typescript
// Ejemplo: apps/api/src/routes/customers.ts
router.get('/', tenantMiddleware, async (req, res) => {
  const customers = await prisma.customer.findMany({
    where: { tenantId: req.tenantId } // Filtro automático por tenant
  });
  res.json(customers);
});

router.post('/', tenantMiddleware, async (req, res) => {
  const customer = await prisma.customer.create({
    data: {
      ...req.body,
      tenantId: req.tenantId // Asignación automática de tenant
    }
  });
  res.json(customer);
});
```

#### 2.3 Sistema de Registro Público
```typescript
// Nueva ruta pública para registro de tenants
router.post('/register-tenant', async (req, res) => {
  const { companyName, ownerName, email, phone } = req.body;

  // 1. Crear tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: companyName,
      slug: generateSlug(companyName),
      email,
      phone,
      plan: 'TRIAL',
      status: 'TRIAL',
      trialEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 días
    }
  });

  // 2. Crear usuario admin
  const adminUser = await prisma.user.create({
    data: {
      name: ownerName,
      email,
      password: await hashPassword(generateTempPassword()),
      role: 'ADMIN',
      tenantId: tenant.id
    }
  });

  // 3. Enviar email de bienvenida
  await sendWelcomeEmail(email, tenant.slug, tempPassword);

  res.json({ success: true, tenant: { slug: tenant.slug } });
});
```

### **FASE 3: Frontend Multi-Tenant (2-3 semanas)**

#### 3.1 Sistema de Detección de Tenant
```typescript
// apps/web/src/utils/tenant.ts
export const getCurrentTenant = (): string | null => {
  // Opción 1: Subdominio (empresa.gridmanager.com)
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];

  if (subdomain !== 'www' && subdomain !== 'gridmanager') {
    return subdomain;
  }

  // Opción 2: Path (/empresa/dashboard)
  const pathSegments = window.location.pathname.split('/');
  if (pathSegments[1] && pathSegments[1] !== 'login') {
    return pathSegments[1];
  }

  return null;
};
```

#### 3.2 Landing Page Pública
```typescript
// Nueva página de registro público
// apps/web/src/pages/RegisterPage.tsx
export function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto pt-16">
        <h1>Inicia tu prueba gratuita</h1>
        <form onSubmit={handleRegister}>
          <input name="companyName" placeholder="Nombre de tu empresa" required />
          <input name="ownerName" placeholder="Tu nombre completo" required />
          <input name="email" type="email" placeholder="Email empresarial" required />
          <input name="phone" placeholder="Teléfono" />
          <button type="submit">Crear Cuenta Gratis</button>
        </form>
      </div>
    </div>
  );
}
```

#### 3.3 Context de Tenant en Frontend
```typescript
// apps/web/src/contexts/TenantContext.tsx
interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
}

export const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true
});

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const tenantSlug = getCurrentTenant();

  useEffect(() => {
    if (tenantSlug) {
      fetchTenantInfo(tenantSlug).then(setTenant);
    }
  }, [tenantSlug]);

  return (
    <TenantContext.Provider value={{ tenant, isLoading: !tenant }}>
      {children}
    </TenantContext.Provider>
  );
}
```

### **FASE 4: Funcionalidades SaaS (3-4 semanas)**

#### 4.1 Panel de Administración de Tenants
- Lista de todos los tenants
- Métricas de uso por tenant
- Gestión de planes y facturación
- Soporte y logs de auditoría

#### 4.2 Facturación y Suscripciones
- Integración con Stripe/MercadoPago
- Planes BASIC, PRO, ENTERPRISE
- Límites por plan (usuarios, productos, ventas/mes)
- Facturación automática

#### 4.3 Personalización por Tenant
```typescript
// Configuraciones por tenant
interface TenantSettings {
  branding: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
  };
  features: {
    multiCurrency: boolean;
    analytics: boolean;
    apiAccess: boolean;
    customReports: boolean;
  };
  limits: {
    maxUsers: number;
    maxProducts: number;
    maxSalesPerMonth: number;
    storageGB: number;
  };
}
```

## 🔧 Configuración Técnica

### Variables de Entorno
```env
# Multi-tenant configuration
MULTITENANT_ENABLED=true
DEFAULT_DOMAIN=gridmanager.com
ALLOW_SUBDOMAIN_ROUTING=true

# Email service for onboarding
SMTP_HOST=smtp.gmail.com
SMTP_USER=noreply@gridmanager.com
SMTP_PASS=your-app-password

# Payment providers
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MERCADOPAGO_ACCESS_TOKEN=TEST-...
```

### Infraestructura de Despliegue
1. **Wildcard DNS**: `*.gridmanager.com` → Servidor
2. **SSL Wildcard**: Certificado para `*.gridmanager.com`
3. **Reverse Proxy**: Nginx para ruteo de subdominios
4. **Database**: PostgreSQL con conexión pooling
5. **Redis**: Para caché y sesiones
6. **File Storage**: S3/CloudFront para logos y archivos

## 💰 Modelo de Precios Sugerido

### **Plan TRIAL** (14 días gratis)
- 1 usuario
- 50 productos
- 100 ventas/mes
- Soporte por email

### **Plan BASIC** ($29/mes)
- 3 usuarios
- 500 productos
- 1,000 ventas/mes
- Reportes básicos
- Soporte prioritario

### **Plan PRO** ($79/mes)
- 10 usuarios
- 2,000 productos
- Ventas ilimitadas
- Reportes avanzados
- API access
- Soporte telefónico

### **Plan ENTERPRISE** ($199/mes)
- Usuarios ilimitados
- Productos ilimitados
- Todo ilimitado
- Personalización completa
- Integraciones custom
- Gerente de cuenta dedicado

## 🎯 Métricas de Éxito

### KPIs a Trackear
- **Registros de trial por semana**
- **Tasa de conversión trial → pago**
- **Churn rate por plan**
- **MRR (Monthly Recurring Revenue)**
- **Tiempo promedio de setup inicial**
- **Uso por tenant (productos, ventas, usuarios)**

## ⚠️ Consideraciones de Seguridad

1. **Aislamiento de Datos**: Verificar que ningún tenant acceda a datos de otro
2. **Rate Limiting**: Por tenant y por plan
3. **Backups**: Aislados por tenant
4. **Compliance**: GDPR, LGPD para datos de clientes
5. **Auditoría**: Logs detallados de acceso entre tenants

## 🚀 Timeline Estimado

- **Semana 1-2**: Modificaciones de schema y migración
- **Semana 3-4**: Backend multi-tenant y APIs
- **Semana 5-6**: Frontend y detección de tenants
- **Semana 7-8**: Landing page y registro público
- **Semana 9-10**: Panel admin y facturación
- **Semana 11-12**: Testing, seguridad y deployment

**Total: ~3 meses de desarrollo**

## 📞 Próximos Pasos Inmediatos

1. ✅ **Decisión arquitectónica**: Subdominios vs paths
2. 📋 **Backup completo** de base de datos actual
3. 🔄 **Implementar schema multitenant** en desarrollo
4. 🧪 **Migrar datos existentes** de prueba
5. 🌐 **Configurar DNS wildcard** en desarrollo
6. 🎨 **Diseñar landing page** de registro

¿Quieres que empecemos con alguna de estas fases específicas?