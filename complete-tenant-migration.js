const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function completeTenantMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const client = await pool.connect();

  try {
    console.log('🔗 Connected to production database');

    // Create missing tables for full tenant functionality
    console.log('🚀 Creating tenant support tables...');

    // Create subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
          "id" TEXT NOT NULL,
          "tenantId" TEXT NOT NULL,
          "plan" "TenantPlan" NOT NULL,
          "status" TEXT NOT NULL,
          "currentPeriodStart" TIMESTAMP(3) NOT NULL,
          "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
          "amount" DECIMAL(12,2) NOT NULL,
          "currency" TEXT NOT NULL DEFAULT 'ARS',
          "stripeCustomerId" TEXT,
          "stripeSubscriptionId" TEXT,
          "mercadoPagoId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
      );
    `);

    try {
      await client.query(`
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Foreign key constraint already exists on subscriptions');
      } else {
        console.log('⚠️  Error adding foreign key to subscriptions:', error.message);
      }
    }

    // Create usage_metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "usage_metrics" (
          "id" TEXT NOT NULL,
          "tenantId" TEXT NOT NULL,
          "metric" TEXT NOT NULL,
          "value" INTEGER NOT NULL,
          "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "usage_metrics_tenantId_metric_date_key"
      ON "usage_metrics"("tenantId", "metric", "date");
    `);

    try {
      await client.query(`
        ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Foreign key constraint already exists on usage_metrics');
      } else {
        console.log('⚠️  Error adding foreign key to usage_metrics:', error.message);
      }
    }

    // Create tenant_registrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "tenant_registrations" (
          "id" TEXT NOT NULL,
          "companyName" TEXT NOT NULL,
          "ownerName" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "phone" TEXT,
          "industry" TEXT,
          "employeeCount" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "token" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "tenant_registrations_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "tenant_registrations_email_key"
      ON "tenant_registrations"("email");
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "tenant_registrations_token_key"
      ON "tenant_registrations"("token");
    `);

    // Get default tenant ID
    const defaultTenant = await client.query(`
      SELECT id FROM "tenants" WHERE slug = 'mi-empresa' LIMIT 1;
    `);

    if (defaultTenant.rows.length > 0) {
      const tenantId = defaultTenant.rows[0].id;
      console.log('✅ Found default tenant:', tenantId);

      // Create subscription for default tenant if it doesn't exist
      const existingSub = await client.query(`
        SELECT id FROM "subscriptions" WHERE "tenantId" = $1 LIMIT 1;
      `, [tenantId]);

      if (existingSub.rows.length === 0) {
        await client.query(`
          INSERT INTO "subscriptions" (
              "id", "tenantId", "plan", "status", "currentPeriodStart", "currentPeriodEnd",
              "amount", "currency", "createdAt", "updatedAt"
          ) VALUES (
              $1, $2, 'ENTERPRISE', 'active', CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP + INTERVAL '1 year', 0.00, 'ARS',
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          );
        `, ['sub-' + Math.random().toString(36).substring(2, 10), tenantId]);

        console.log('✅ Created subscription for default tenant');
      }

      // Create initial usage metrics if they don't exist
      const existingMetrics = await client.query(`
        SELECT id FROM "usage_metrics" WHERE "tenantId" = $1 LIMIT 1;
      `, [tenantId]);

      if (existingMetrics.rows.length === 0) {
        const metrics = [
          { metric: 'users_count', value: 5 },
          { metric: 'products_count', value: 5 },
          { metric: 'sales_count', value: 1 }
        ];

        for (const metric of metrics) {
          await client.query(`
            INSERT INTO "usage_metrics" ("id", "tenantId", "metric", "value", "date")
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP);
          `, [
            'metric-' + Math.random().toString(36).substring(2, 10),
            tenantId,
            metric.metric,
            metric.value
          ]);
        }

        console.log('✅ Created initial usage metrics');
      }
    }

    console.log('🎉 Tenant migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
completeTenantMigration()
  .then(() => {
    console.log('✅ Complete tenant migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Complete tenant migration failed:', error);
    process.exit(1);
  });