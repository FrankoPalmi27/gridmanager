const { PrismaClient } = require('@prisma/client');

async function fixProductionDB() {
  let prisma;

  try {
    prisma = new PrismaClient();
    console.log('🔧 Starting production database fix...');

    // 1. First, add Google OAuth columns to users table
    console.log('➕ Adding Google OAuth columns...');

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "googleId" TEXT,
        ADD COLUMN IF NOT EXISTS avatar TEXT,
        ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'local';
      `);
      console.log('✅ OAuth columns added successfully');
    } catch (error) {
      console.log('⚠️ OAuth columns might already exist:', error.message);
    }

    // 2. Create unique index for googleId
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS users_googleid_key ON users("googleId");
      `);
      console.log('✅ Unique index for googleId created');
    } catch (error) {
      console.log('⚠️ Index might already exist:', error.message);
    }

    // 3. Check current users table structure
    console.log('📊 Checking final users table structure...');
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Users table structure:');
    console.table(columns.filter(col =>
      ['id', 'tenantId', 'email', 'name', 'password', 'role', 'status', 'branchId', 'googleId', 'avatar', 'provider'].includes(col.column_name)
    ));

    // 4. Verify Google OAuth columns exist
    const oauthColumns = columns.filter(col =>
      ['googleId', 'avatar', 'provider'].includes(col.column_name)
    );

    if (oauthColumns.length === 3) {
      console.log('✅ All Google OAuth columns are present!');
      return true;
    } else {
      console.log('❌ Missing OAuth columns:', 3 - oauthColumns.length);
      return false;
    }

  } catch (error) {
    console.error('❌ Database fix error:', error.message);
    return false;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Run the fix
fixProductionDB().then(success => {
  if (success) {
    console.log('\n🎉 Production database is ready!');
    console.log('💡 You can now restart the main API server');
  } else {
    console.log('\n💥 Database fix failed');
    console.log('🔍 Check the errors above for details');
  }
  process.exit(success ? 0 : 1);
});