const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute the Google OAuth migration
    const migrationPath = path.join(__dirname, 'prisma/migrations/20250916_add_google_oauth_fields/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration:', migrationSQL);

    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully');

    // Verify columns exist
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('googleId', 'avatar', 'provider')
      ORDER BY column_name;
    `);

    console.log('📊 Google OAuth columns in users table:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

runMigration();