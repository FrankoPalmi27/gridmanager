import { PrismaClient } from '@prisma/client';
import { comparePassword } from './utils/auth';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database contents...');

  // Check tenants
  const tenants = await prisma.tenant.findMany();
  console.log('\n📊 Tenants:');
  tenants.forEach(tenant => {
    console.log(`- ID: ${tenant.id}, Slug: ${tenant.slug}, Name: ${tenant.name}, Status: ${tenant.status}`);
  });

  // Check users
  const users = await prisma.user.findMany({
    include: { tenant: true }
  });
  console.log('\n👥 Users:');
  users.forEach(user => {
    console.log(`- Email: ${user.email}, Name: ${user.name}, Role: ${user.role}, Tenant: ${user.tenant.slug}`);
  });

  // Test password hash for admin
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@gridmanager.com' }
  });

  if (adminUser) {
    console.log('\n🔐 Testing admin password...');
    try {
      const passwordMatch = await comparePassword('admin123', adminUser.password);
      console.log(`Password match: ${passwordMatch}`);
    } catch (error) {
      console.log(`Password test error: ${error}`);
    }
  } else {
    console.log('\n❌ Admin user not found');
  }

  await prisma.$disconnect();
}

checkDatabase().catch(console.error);