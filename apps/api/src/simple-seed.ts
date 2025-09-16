import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple database seeding...');

  // Create tenant first
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Grid Manager Demo',
      slug: 'demo',
      email: 'demo@gridmanager.com',
      phone: '+54 11 4555-0000',
      address: 'Buenos Aires, Argentina',
      plan: 'PRO',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created tenant');

  // Create branch
  const branch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Sucursal Principal',
      address: 'Av. Corrientes 1234, CABA',
      phone: '+54 11 4555-0001',
      email: 'principal@gridmanager.com',
    },
  });

  console.log('✅ Created branch');

  // Create admin user for login
  const adminPassword = await hashPassword('admin123');

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@gridmanager.com',
      name: 'Admin Usuario',
      password: adminPassword,
      role: 'ADMIN',
      branchId: branch.id,
    },
  });

  console.log('✅ Created admin user');

  console.log('🎉 Simple database seeding completed!');
  console.log('\n🔐 Login credentials:');
  console.log('Email: admin@gridmanager.com');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });