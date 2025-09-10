const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.bcpanxxwahxbvxueeioj:GRIDMANAGER_2025@aws-1-us-east-1.pooler.supabase.com:6543/postgres'
    }
  }
});

async function updateAdmin() {
  try {
    console.log('🔄 Updating admin user...');
    
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@gridmanager.com' },
      data: {
        password: '$2a$12$VgMnZvjI83le8YfCwy1A.Ogtr.OUH8AXITFHCiQDZEenRGjBBTNFa',
        status: 'ACTIVE'
      },
      select: { email: true, status: true }
    });
    
    console.log('✅ Admin user updated:', updatedUser);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();