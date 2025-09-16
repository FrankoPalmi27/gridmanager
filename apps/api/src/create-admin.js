const bcrypt = require('bcryptjs');

async function createAdminUser() {
  console.log('Creating admin user...');

  // Hash password "admin123"
  const hashedPassword = await bcrypt.hash('admin123', 10);
  console.log('Password hash for admin123:', hashedPassword);

  // Log tenant and user IDs that should be used
  console.log('\nTo create admin user, use these SQL commands:');
  console.log(`
-- Insert tenant if not exists
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

-- Insert branch if not exists
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

-- Insert or update admin user
INSERT INTO "User" (id, "tenantId", email, name, password, role, status, "branchId", "createdAt", "updatedAt")
VALUES (
  'cuid123admin',
  'cuid123tenant',
  'admin@gridmanager.com',
  'Admin Usuario',
  '${hashedPassword}',
  'ADMIN',
  'ACTIVE',
  'cuid123branch',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password = '${hashedPassword}',
  "tenantId" = 'cuid123tenant',
  "branchId" = 'cuid123branch';
  `);
}

createAdminUser().catch(console.error);