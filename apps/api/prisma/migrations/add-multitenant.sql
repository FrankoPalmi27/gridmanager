-- Migration Script: Add Multi-Tenant Support to Grid Manager
-- This script converts the existing single-tenant database to multi-tenant

-- STEP 1: Create new tenant-related tables
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'TRIAL',
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "trialEnds" TIMESTAMP(3),
    "billingCycle" TEXT,
    "settings" JSONB,
    "limits" JSONB,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "mercadoPagoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usage_metrics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenant_registrations" (
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

-- STEP 2: Create unique constraints
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");
CREATE UNIQUE INDEX "tenant_registrations_email_key" ON "tenant_registrations"("email");
CREATE UNIQUE INDEX "tenant_registrations_token_key" ON "tenant_registrations"("token");
CREATE UNIQUE INDEX "usage_metrics_tenantId_metric_date_key" ON "usage_metrics"("tenantId", "metric", "date");

-- STEP 3: Add foreign key constraints
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usage_metrics" ADD CONSTRAINT "usage_metrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- STEP 4: Create default tenant for existing data
INSERT INTO "tenants" (
    "id",
    "name",
    "slug",
    "email",
    "plan",
    "status",
    "settings",
    "limits",
    "features",
    "createdAt",
    "updatedAt"
) VALUES (
    'default-tenant-' || substr(md5(random()::text), 1, 8),
    'Mi Empresa',
    'mi-empresa',
    'admin@miempresa.com',
    'ENTERPRISE',
    'ACTIVE',
    '{"branding": {"logo": "", "primaryColor": "#10b981", "secondaryColor": "#3b82f6", "companyName": "Mi Empresa"}}',
    '{"maxUsers": 999, "maxProducts": 99999, "maxSalesPerMonth": 99999, "storageGB": 100}',
    '{"analytics": true, "multiCurrency": true, "api": true, "customReports": true}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- STEP 5: Add tenantId columns to existing tables (without constraints first)
ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "branches" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "customers" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "products" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "price_lists" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "quotes" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "sales" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "purchases" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "incomes" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "expenses" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "accounts" ADD COLUMN "tenantId" TEXT;

-- STEP 6: Populate tenantId for all existing records
UPDATE "users" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "branches" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "customers" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "suppliers" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "products" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "price_lists" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "quotes" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "sales" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "purchases" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "incomes" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "expenses" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);
UPDATE "accounts" SET "tenantId" = (SELECT "id" FROM "tenants" WHERE "slug" = 'mi-empresa' LIMIT 1);

-- STEP 7: Make tenantId columns NOT NULL after populating data
ALTER TABLE "users" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "branches" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "customers" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "suppliers" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "price_lists" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "quotes" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "purchases" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "incomes" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "accounts" ALTER COLUMN "tenantId" SET NOT NULL;

-- STEP 8: Add foreign key constraints for tenant relationships
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "branches" ADD CONSTRAINT "branches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- STEP 9: Create indexes for performance on tenantId columns
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");
CREATE INDEX "branches_tenantId_idx" ON "branches"("tenantId");
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");
CREATE INDEX "suppliers_tenantId_idx" ON "suppliers"("tenantId");
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");
CREATE INDEX "price_lists_tenantId_idx" ON "price_lists"("tenantId");
CREATE INDEX "quotes_tenantId_idx" ON "quotes"("tenantId");
CREATE INDEX "sales_tenantId_idx" ON "sales"("tenantId");
CREATE INDEX "purchases_tenantId_idx" ON "purchases"("tenantId");
CREATE INDEX "incomes_tenantId_idx" ON "incomes"("tenantId");
CREATE INDEX "expenses_tenantId_idx" ON "expenses"("tenantId");
CREATE INDEX "accounts_tenantId_idx" ON "accounts"("tenantId");

-- STEP 10: Create initial usage metrics for default tenant
INSERT INTO "usage_metrics" ("id", "tenantId", "metric", "value", "date")
SELECT
    'metric-' || substr(md5(random()::text), 1, 8),
    t.id,
    'users_count',
    (SELECT COUNT(*) FROM "users" WHERE "tenantId" = t.id),
    CURRENT_TIMESTAMP
FROM "tenants" t WHERE t.slug = 'mi-empresa';

INSERT INTO "usage_metrics" ("id", "tenantId", "metric", "value", "date")
SELECT
    'metric-' || substr(md5(random()::text), 1, 8),
    t.id,
    'products_count',
    (SELECT COUNT(*) FROM "products" WHERE "tenantId" = t.id),
    CURRENT_TIMESTAMP
FROM "tenants" t WHERE t.slug = 'mi-empresa';

INSERT INTO "usage_metrics" ("id", "tenantId", "metric", "value", "date")
SELECT
    'metric-' || substr(md5(random()::text), 1, 8),
    t.id,
    'sales_count',
    (SELECT COUNT(*) FROM "sales" WHERE "tenantId" = t.id),
    CURRENT_TIMESTAMP
FROM "tenants" t WHERE t.slug = 'mi-empresa';

-- STEP 11: Create initial subscription for default tenant
INSERT INTO "subscriptions" (
    "id",
    "tenantId",
    "plan",
    "status",
    "currentPeriodStart",
    "currentPeriodEnd",
    "amount",
    "currency",
    "createdAt",
    "updatedAt"
)
SELECT
    'sub-' || substr(md5(random()::text), 1, 8),
    t.id,
    'ENTERPRISE',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    0.00,
    'ARS',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "tenants" t WHERE t.slug = 'mi-empresa';

-- Migration completed successfully!
-- The database is now ready for multi-tenant operation.