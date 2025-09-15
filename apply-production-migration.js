const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const client = await pool.connect();

  try {
    console.log('🔗 Connected to production database');

    // Check if tenants table already exists
    const existingTenants = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
      );
    `);

    if (existingTenants.rows[0].exists) {
      console.log('✅ Tenants table already exists, skipping migration');
      return;
    }

    console.log('🚀 Starting multi-tenant migration...');

    // STEP 1: Create tenant tables
    await client.query(`
      CREATE TYPE "TenantPlan" AS ENUM ('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE');
      CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
    `);

    await client.query(`
      CREATE TABLE "tenants" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "phone" TEXT,
          "address" TEXT,
          "taxId" TEXT,
          "plan" "TenantPlan" NOT NULL DEFAULT 'TRIAL',
          "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
          "trialEnds" TIMESTAMP(3),
          "billingCycle" TEXT,
          "settings" JSONB,
          "limits" JSONB,
          "features" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
      CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");
    `);

    // STEP 2: Create default tenant
    const defaultTenantId = 'default-tenant-' + Math.random().toString(36).substring(2, 10);

    await client.query(`
      INSERT INTO "tenants" (
          "id", "name", "slug", "email", "plan", "status", "settings", "limits", "features", "createdAt", "updatedAt"
      ) VALUES (
          $1, 'Mi Empresa', 'mi-empresa', 'admin@miempresa.com', 'ENTERPRISE', 'ACTIVE',
          '{"branding": {"logo": "", "primaryColor": "#10b981", "secondaryColor": "#3b82f6", "companyName": "Mi Empresa"}}',
          '{"maxUsers": 999, "maxProducts": 99999, "maxSalesPerMonth": 99999, "storageGB": 100}',
          '{"analytics": true, "multiCurrency": true, "api": true, "customReports": true}',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      );
    `, [defaultTenantId]);

    console.log('✅ Default tenant created with ID:', defaultTenantId);

    // STEP 3: Add tenantId columns to existing tables
    const tables = ['users', 'branches', 'customers', 'suppliers', 'products', 'sales', 'purchases', 'accounts', 'incomes', 'expenses'];

    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE "${table}" ADD COLUMN "tenantId" TEXT;`);
        console.log(`✅ Added tenantId to ${table}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  tenantId already exists in ${table}`);
        } else {
          throw error;
        }
      }
    }

    // STEP 4: Populate tenantId for existing records
    for (const table of tables) {
      const result = await client.query(`UPDATE "${table}" SET "tenantId" = $1 WHERE "tenantId" IS NULL;`, [defaultTenantId]);
      console.log(`✅ Updated ${result.rowCount} records in ${table}`);
    }

    // STEP 5: Add NOT NULL constraints
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE "${table}" ALTER COLUMN "tenantId" SET NOT NULL;`);
        console.log(`✅ Set NOT NULL constraint on ${table}.tenantId`);
      } catch (error) {
        console.log(`⚠️  Constraint already exists on ${table}.tenantId`);
      }
    }

    // STEP 6: Add foreign key constraints
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${table}_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
        console.log(`✅ Added foreign key constraint on ${table}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Foreign key already exists on ${table}`);
        } else {
          console.log(`❌ Error adding foreign key to ${table}:`, error.message);
        }
      }
    }

    // STEP 7: Create indexes for performance
    for (const table of tables) {
      try {
        await client.query(`CREATE INDEX "${table}_tenantId_idx" ON "${table}"("tenantId");`);
        console.log(`✅ Created index on ${table}.tenantId`);
      } catch (error) {
        console.log(`⚠️  Index already exists on ${table}.tenantId`);
      }
    }

    console.log('🎉 Multi-tenant migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });