const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.bcpanxxwahxbvxueeioj:GRIDMANAGER_2025@aws-1-us-east-1.pooler.supabase.com:6543/postgres'
    }
  }
});

async function setupDatabase() {
  try {
    console.log('🔄 Conectando a Supabase...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa!');
    
    // Verificar si ya existen tablas
    console.log('🔄 Verificando tablas existentes...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log(`📊 Tablas encontradas: ${tables.length}`);
    
    if (tables.length === 0) {
      console.log('🔄 Creando schema de base de datos...');
      // Aquí podríamos crear las tablas manualmente, pero es mejor usar Prisma
      console.log('⚠️  Usa: npx prisma db push para crear las tablas');
    } else {
      console.log('✅ Base de datos ya configurada');
      tables.forEach(table => console.log(`  - ${table.table_name}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();