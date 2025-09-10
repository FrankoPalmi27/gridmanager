-- Grid Manager Database Schema
-- Execute this in Supabase SQL Editor

-- Create ENUM types first
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ANALYST', 'SELLER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "Currency" AS ENUM ('ARS', 'USD');
CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'PENDING', 'RECEIVED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK');
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER');
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED');

-- Create branches table first (no dependencies)
CREATE TABLE "branches" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- Create users table (depends on branches)
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SELLER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("branchId") REFERENCES "branches"("id")
);

-- Create customers table (no dependencies)
CREATE TABLE "customers" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "taxId" TEXT UNIQUE,
    "birthday" TIMESTAMP(3),
    "creditLimit" DECIMAL(12,2),
    "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create suppliers table (no dependencies)
CREATE TABLE "suppliers" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "taxId" TEXT UNIQUE,
    "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create products table (no dependencies)
CREATE TABLE "products" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "sku" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "brand" TEXT,
    "cost" DECIMAL(12,2) NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'UNIT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create accounts table (no dependencies)
CREATE TABLE "accounts" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accountNumber" TEXT,
    "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'ARS',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create price_lists table (no dependencies)
CREATE TABLE "price_lists" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create price_list_items table (depends on price_lists and products)
CREATE TABLE "price_list_items" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "priceListId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
    UNIQUE ("priceListId", "productId")
);

-- Create quotes table (depends on customers and users)
CREATE TABLE "quotes" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "number" TEXT UNIQUE NOT NULL,
    "customerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxes" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ARS',
    "notes" TEXT,
    "convertedToSale" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES "customers"("id"),
    FOREIGN KEY ("sellerId") REFERENCES "users"("id")
);

-- Create quote_items table (depends on quotes and products)
CREATE TABLE "quote_items" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "products"("id")
);

-- Create sales table (depends on customers, users, and branches)
CREATE TABLE "sales" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "number" TEXT UNIQUE NOT NULL,
    "customerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxes" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ARS',
    "notes" TEXT,
    "quoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES "customers"("id"),
    FOREIGN KEY ("sellerId") REFERENCES "users"("id"),
    FOREIGN KEY ("branchId") REFERENCES "branches"("id")
);

-- Create sale_items table (depends on sales and products)
CREATE TABLE "sale_items" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "products"("id")
);

-- Create purchases table (depends on suppliers and branches)
CREATE TABLE "purchases" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "number" TEXT UNIQUE NOT NULL,
    "supplierId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxes" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ARS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id"),
    FOREIGN KEY ("branchId") REFERENCES "branches"("id")
);

-- Create purchase_items table (depends on purchases and products)
CREATE TABLE "purchase_items" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES "products"("id")
);

-- Create incomes table (depends on accounts)
CREATE TABLE "incomes" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ARS',
    "category" TEXT,
    "accountId" TEXT,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
);

-- Create expenses table (depends on accounts)
CREATE TABLE "expenses" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ARS',
    "category" TEXT,
    "accountId" TEXT,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
);

-- Create account_movements table (depends on accounts)
CREATE TABLE "account_movements" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
);

-- Create collections table (depends on sales, customers, users, and accounts)
CREATE TABLE "collections" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "saleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ARS',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "accountId" TEXT,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("saleId") REFERENCES "sales"("id"),
    FOREIGN KEY ("customerId") REFERENCES "customers"("id"),
    FOREIGN KEY ("userId") REFERENCES "users"("id"),
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
);

-- Create payments table (depends on purchases, suppliers, users, and accounts)
CREATE TABLE "payments" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "purchaseId" TEXT,
    "supplierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ARS',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "accountId" TEXT,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id"),
    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id"),
    FOREIGN KEY ("userId") REFERENCES "users"("id"),
    FOREIGN KEY ("accountId") REFERENCES "accounts"("id")
);

-- Create shipments table (depends on sales)
CREATE TABLE "shipments" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "saleId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "carrier" TEXT,
    "trackingId" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("saleId") REFERENCES "sales"("id")
);

-- Create stock_movements table (depends on products and branches)
CREATE TABLE "stock_movements" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("productId") REFERENCES "products"("id"),
    FOREIGN KEY ("branchId") REFERENCES "branches"("id")
);

-- Create cash_registers table (depends on branches)
CREATE TABLE "cash_registers" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "branchId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "closedBy" TEXT,
    "openAmount" DECIMAL(12,2) NOT NULL,
    "closeAmount" DECIMAL(12,2),
    "expectedAmount" DECIMAL(12,2),
    "difference" DECIMAL(12,2),
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    FOREIGN KEY ("branchId") REFERENCES "branches"("id")
);

-- Create tasks table (depends on users)
CREATE TABLE "tasks" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "users"("id")
);

-- Create exchange_rates table (no dependencies)
CREATE TABLE "exchange_rates" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "currency" "Currency" NOT NULL,
    "officialRate" DECIMAL(10,4) NOT NULL,
    "blueRate" DECIMAL(10,4),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("currency", "date")
);

-- Create audit_logs table (depends on users)
CREATE TABLE "audit_logs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" JSON,
    "newValues" JSON,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "users"("id")
);

-- Create indexes for better performance
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_users_role" ON "users"("role");
CREATE INDEX "idx_customers_email" ON "customers"("email");
CREATE INDEX "idx_products_sku" ON "products"("sku");
CREATE INDEX "idx_sales_status" ON "sales"("status");
CREATE INDEX "idx_sales_date" ON "sales"("createdAt");
CREATE INDEX "idx_purchases_status" ON "purchases"("status");
CREATE INDEX "idx_stock_movements_product" ON "stock_movements"("productId");
CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("userId");
CREATE INDEX "idx_audit_logs_date" ON "audit_logs"("createdAt");

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables that need updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON "customers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON "suppliers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON "products" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON "accounts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON "sales" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON "purchases" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();