-- Align suppliers table with Prisma schema
ALTER TABLE "suppliers"
  ADD COLUMN IF NOT EXISTS "businessName" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentTerms" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "creditLimit" NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS "totalPurchases" NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastPurchaseDate" TIMESTAMP;
