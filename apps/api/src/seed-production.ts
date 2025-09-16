import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils/auth';

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('🌱 Starting production database seeding...');

  try {
    // Create main tenant for production
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'gridmanager' },
      update: {},
      create: {
        name: 'Grid Manager',
        slug: 'gridmanager',
        email: 'admin@gridmanager.com',
        phone: '+54 11 4000-0000',
        address: 'Buenos Aires, Argentina',
        plan: 'PRO',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Created/found tenant:', tenant.slug);

    // Create main branch
    const branch = await prisma.branch.upsert({
      where: { id: 'main-branch' },
      update: {},
      create: {
        id: 'main-branch',
        tenantId: tenant.id,
        name: 'Sucursal Principal',
        address: 'Av. Corrientes 1234, CABA',
        phone: '+54 11 4000-0001',
        email: 'principal@gridmanager.com',
      },
    });

    console.log('✅ Created/found branch:', branch.name);

    // Create admin user
    const adminPassword = await hashPassword('GridManager2025!');

    const admin = await prisma.user.upsert({
      where: { email: 'admin@gridmanager.com' },
      update: {
        password: adminPassword,
        tenantId: tenant.id,
        branchId: branch.id,
      },
      create: {
        tenantId: tenant.id,
        email: 'admin@gridmanager.com',
        name: 'Administrador',
        password: adminPassword,
        role: 'ADMIN',
        branchId: branch.id,
      },
    });

    console.log('✅ Created/updated admin user:', admin.email);

    // Create manager user
    const managerPassword = await hashPassword('Manager2025!');

    const manager = await prisma.user.upsert({
      where: { email: 'manager@gridmanager.com' },
      update: {
        password: managerPassword,
        tenantId: tenant.id,
        branchId: branch.id,
      },
      create: {
        tenantId: tenant.id,
        email: 'manager@gridmanager.com',
        name: 'Manager',
        password: managerPassword,
        role: 'MANAGER',
        branchId: branch.id,
      },
    });

    console.log('✅ Created/updated manager user:', manager.email);

    console.log('🎉 Production database seeding completed!');
    console.log('\n🔐 Production login credentials:');
    console.log('Tenant Slug: gridmanager');
    console.log('Admin - Email: admin@gridmanager.com | Password: GridManager2025!');
    console.log('Manager - Email: manager@gridmanager.com | Password: Manager2025!');

  } catch (error) {
    console.error('❌ Error during production seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedProduction()
    .catch((e) => {
      console.error('❌ Production seeding failed:', e);
      process.exit(1);
    });
}

export { seedProduction };