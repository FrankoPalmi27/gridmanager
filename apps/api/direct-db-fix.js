// Direct database fix without Prisma to avoid prepared statement conflicts
const { Client } = require('pg');

async function directDatabaseFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL database');

    // SQL to add OAuth columns if they don't exist
    const addOAuthColumns = `
      -- Add Google OAuth columns if they don't exist
      DO $$
      BEGIN
          -- Add googleId column
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'users' AND column_name = 'googleId'
          ) THEN
              ALTER TABLE users ADD COLUMN "googleId" TEXT;
              ALTER TABLE users ADD CONSTRAINT users_googleid_key UNIQUE ("googleId");
              RAISE NOTICE 'Added googleId column with unique constraint';
          ELSE
              RAISE NOTICE 'googleId column already exists';
          END IF;

          -- Add avatar column
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'users' AND column_name = 'avatar'
          ) THEN
              ALTER TABLE users ADD COLUMN avatar TEXT;
              RAISE NOTICE 'Added avatar column';
          ELSE
              RAISE NOTICE 'avatar column already exists';
          END IF;

          -- Add provider column
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'users' AND column_name = 'provider'
          ) THEN
              ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local';
              RAISE NOTICE 'Added provider column with default value';
          ELSE
              RAISE NOTICE 'provider column already exists';
          END IF;
      END $$;
    `;

    console.log('🔧 Executing OAuth columns addition...');
    const result = await client.query(addOAuthColumns);
    console.log('✅ OAuth columns operation completed');

    // Verify the changes
    console.log('📊 Verifying final structure...');
    const verification = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('id', 'email', 'name', 'password', 'role', 'googleId', 'avatar', 'provider')
      ORDER BY ordinal_position;
    `);

    console.log('📋 Users table OAuth columns:');
    console.table(verification.rows);

    // Check if all OAuth columns exist
    const oauthColumns = verification.rows.filter(row =>
      ['googleId', 'avatar', 'provider'].includes(row.column_name)
    );

    if (oauthColumns.length === 3) {
      console.log('🎉 SUCCESS: All OAuth columns are present!');
      return true;
    } else {
      console.log(`❌ MISSING: ${3 - oauthColumns.length} OAuth columns`);
      return false;
    }

  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
    return false;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Load environment variables
require('dotenv').config();

// Run the fix
directDatabaseFix().then(success => {
  if (success) {
    console.log('\n🚀 Database is ready for OAuth!');
    console.log('💡 You can now start the API server');
  } else {
    console.log('\n💥 Database fix failed');
    console.log('🔍 Check the errors above');
  }
  process.exit(success ? 0 : 1);
});