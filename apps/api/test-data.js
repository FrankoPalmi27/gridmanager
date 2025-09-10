const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.bcpanxxwahxbvxueeioj:GRIDMANAGER_2025@aws-1-us-east-1.pooler.supabase.com:6543/postgres'
    }
  }
});

async function testData() {
  try {
    console.log('🔄 Probando datos en la base...');
    
    const users = await prisma.user.findMany({ select: { email: true, role: true } });
    console.log(`👥 Usuarios: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    
    const customers = await prisma.customer.findMany({ select: { name: true } });
    console.log(`🏢 Clientes: ${customers.length}`);
    
    const products = await prisma.product.findMany({ select: { name: true, currentStock: true } });
    console.log(`📦 Productos: ${products.length}`);
    products.forEach(p => console.log(`  - ${p.name} (Stock: ${p.currentStock})`));
    
    const accounts = await prisma.account.findMany({ select: { name: true, currentBalance: true } });
    console.log(`💰 Cuentas: ${accounts.length}`);
    accounts.forEach(a => console.log(`  - ${a.name}: $${a.currentBalance}`));
    
    console.log('\n✅ ¡Base de datos lista para usar!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testData();