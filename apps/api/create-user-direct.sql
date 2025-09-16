-- Create tenant and user directly in PostgreSQL
-- Execute this in psql or any PostgreSQL client

-- First, ensure we have a tenant
INSERT INTO "Tenant" (id, name, slug, email, plan, status, "createdAt", "updatedAt")
VALUES (
  'cuid123tenant',
  'Grid Manager Demo',
  'demo',
  'demo@gridmanager.com',
  'PRO',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Create a branch for the tenant
INSERT INTO "Branch" (id, "tenantId", name, address, phone, email, active, "createdAt", "updatedAt")
VALUES (
  'cuid123branch',
  'cuid123tenant',
  'Sucursal Principal',
  'Av. Corrientes 1234, CABA',
  '+54 11 4555-0001',
  'principal@gridmanager.com',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create admin user with known password hash
-- Password hash for 'admin123' using bcrypt
INSERT INTO "User" (id, "tenantId", email, name, password, role, status, "branchId", "createdAt", "updatedAt")
VALUES (
  'cuid123admin',
  'cuid123tenant',
  'admin@gridmanager.com',
  'Admin Usuario',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'admin123'
  'ADMIN',
  'ACTIVE',
  'cuid123branch',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  "tenantId" = 'cuid123tenant',
  "branchId" = 'cuid123branch';

-- Verify the data
SELECT 'Tenant created:' as info, t.name, t.slug, t.status FROM "Tenant" t WHERE t.slug = 'demo';
SELECT 'User created:' as info, u.email, u.name, u.role, t.slug as tenant FROM "User" u JOIN "Tenant" t ON u."tenantId" = t.id WHERE u.email = 'admin@gridmanager.com';