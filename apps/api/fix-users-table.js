const { PrismaClient } = require('@prisma/client');

async function fixUsersTable() {
  // Create new Prisma instance to avoid prepared statement conflicts
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Starting fix for users table...');

    // First, let's create our custom tables if they don't exist
    console.log('📝 Creating Grid Manager tables...');

    // Create tenants table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        "taxId" TEXT,
        plan TEXT DEFAULT 'TRIAL',
        status TEXT DEFAULT 'TRIAL',
        "trialEnds" TIMESTAMP,
        "billingCycle" TEXT,
        settings JSONB,
        limits JSONB,
        features JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create branches table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        "tenantId" TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        active BOOLEAN DEFAULT true,
        FOREIGN KEY ("tenantId") REFERENCES tenants(id)
      );
    `);

    // Drop existing users table if it conflicts and create new one
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS users CASCADE;`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        "tenantId" TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT,
        role TEXT DEFAULT 'SELLER',
        status TEXT DEFAULT 'ACTIVE',
        "branchId" TEXT,
        "googleId" TEXT UNIQUE,
        avatar TEXT,
        provider TEXT DEFAULT 'local',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("tenantId") REFERENCES tenants(id),
        FOREIGN KEY ("branchId") REFERENCES branches(id)
      );
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email);`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS users_googleid_key ON users("googleId");`);

    console.log('✅ Users table recreated successfully with Google OAuth fields!');

    // Verify the table structure
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('📊 Final users table structure:');
    console.table(columns);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsersTable();