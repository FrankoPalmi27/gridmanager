const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.bcpanxxwahxbvxueeioj:GRIDMANAGER_2025@aws-1-us-east-1.pooler.supabase.com:6543/postgres'
    }
  }
});

async function testConnection() {
  try {
    console.log('🔄 Probando conexión a Supabase...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa!');
    
    // Crear una tabla simple para probar
    console.log('🔄 Probando operación...');
    const result = await prisma.$executeRaw`SELECT 1 as test`;
    console.log('✅ Operación exitosa!', result);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();