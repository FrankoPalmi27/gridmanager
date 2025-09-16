const { PrismaClient } = require('@prisma/client');

async function runMigration() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Connecting to database...');

    // Check current schema
    console.log('📊 Checking current users table schema...');
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;

    console.log('Current users table columns:');
    console.table(result);

    // Add Google OAuth columns if they don't exist
    console.log('🔧 Adding Google OAuth columns...');

    try {
      await prisma.$executeRaw`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "googleId" TEXT UNIQUE,
        ADD COLUMN IF NOT EXISTS avatar TEXT,
        ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'local';
      `;
      console.log('✅ Columns added successfully');
    } catch (error) {
      console.log('⚠️ Error adding columns (may already exist):', error.message);
    }

    // Create unique index for googleId if not exists
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS users_googleid_key ON users("googleId");
      `;
      console.log('✅ Unique index created successfully');
    } catch (error) {
      console.log('⚠️ Error creating index (may already exist):', error.message);
    }

    // Verify final schema
    console.log('📊 Verifying final schema...');
    const finalResult = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('googleId', 'avatar', 'provider')
      ORDER BY column_name;
    `;

    console.log('Google OAuth columns:');
    console.table(finalResult);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();