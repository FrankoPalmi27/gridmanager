const { PrismaClient } = require('@prisma/client');

async function checkSchema() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking database schemas and tables...');

    // Check all schemas
    const schemas = await prisma.$queryRaw`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast');
    `;

    console.log('📊 Available schemas:');
    console.table(schemas);

    // Check tables in public schema
    const tables = await prisma.$queryRaw`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log('📊 Tables in public schema:');
    console.table(tables);

    // Check if our Grid Manager tables exist
    const gridTables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'tenants', 'branches')
      ORDER BY table_name;
    `;

    console.log('📊 Grid Manager tables:');
    console.table(gridTables);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();