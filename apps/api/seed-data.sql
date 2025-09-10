-- Grid Manager Initial Data
-- Execute this AFTER creating tables

-- Insert initial branches
INSERT INTO "branches" ("id", "name", "address", "phone", "email") VALUES 
('branch_001', 'Sucursal Centro', 'Av. Corrientes 1234, CABA', '+54 11 1234-5678', 'centro@gridmanager.com'),
('branch_002', 'Sucursal Norte', 'Av. Cabildo 5678, CABA', '+54 11 8765-4321', 'norte@gridmanager.com');

-- Insert initial users (passwords are hashed versions of 'admin123', 'manager123', etc.)
INSERT INTO "users" ("id", "email", "name", "password", "role", "branchId") VALUES 
('user_admin', 'admin@gridmanager.com', 'Administrador', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'branch_001'),
('user_manager', 'manager@gridmanager.com', 'Gerente General', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'MANAGER', 'branch_001'),
('user_seller1', 'seller1@gridmanager.com', 'Vendedor 1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SELLER', 'branch_001'),
('user_seller2', 'seller2@gridmanager.com', 'Vendedor 2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SELLER', 'branch_002'),
('user_analyst', 'analyst@gridmanager.com', 'Analista', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ANALYST', 'branch_001');

-- Insert initial customers
INSERT INTO "customers" ("id", "name", "email", "phone", "address", "taxId", "creditLimit", "currentBalance") VALUES 
('customer_001', 'Empresa ABC S.A.', 'contacto@empresaabc.com', '+54 11 2222-3333', 'Av. Libertador 1000, CABA', '30-12345678-9', 100000, 0),
('customer_002', 'Comercial XYZ', 'ventas@comercialxyz.com', '+54 11 4444-5555', 'Av. Santa Fe 2000, CABA', '30-87654321-0', 50000, 0),
('customer_003', 'Juan Pérez', 'juan.perez@email.com', '+54 9 11 6666-7777', 'Corrientes 500, CABA', '20-11223344-5', 25000, 0),
('customer_004', 'María González', 'maria.gonzalez@email.com', '+54 9 11 8888-9999', 'Rivadavia 800, CABA', '27-44556677-8', 15000, 0);

-- Insert initial suppliers
INSERT INTO "suppliers" ("id", "name", "email", "phone", "address", "taxId", "currentBalance") VALUES 
('supplier_001', 'Proveedor Mayorista SA', 'compras@mayorista.com', '+54 11 1111-2222', 'Av. Industrial 100, San Martín', '30-99887766-1', 0),
('supplier_002', 'Distribuidora Centro', 'ventas@distcentro.com', '+54 11 3333-4444', 'Av. Mitre 500, Avellaneda', '30-55443322-2', 0),
('supplier_003', 'Importadora del Sur', 'info@impsur.com', '+54 11 7777-8888', 'Av. Belgrano 1500, CABA', '30-11998877-3', 0);

-- Insert initial products
INSERT INTO "products" ("id", "sku", "name", "description", "category", "brand", "cost", "basePrice", "taxRate", "currentStock", "minStock") VALUES 
('product_001', 'PROD-001', 'Notebook Dell Inspiron 15', 'Notebook 15.6" Intel i5 8GB RAM 256GB SSD', 'Computación', 'Dell', 80000, 120000, 21, 10, 2),
('product_002', 'PROD-002', 'Mouse Logitech M100', 'Mouse óptico USB con cable', 'Periféricos', 'Logitech', 1500, 2500, 21, 50, 10),
('product_003', 'PROD-003', 'Teclado Genius KB-110', 'Teclado USB estándar', 'Periféricos', 'Genius', 2000, 3500, 21, 30, 5),
('product_004', 'PROD-004', 'Monitor Samsung 24"', 'Monitor LED 24" Full HD', 'Monitores', 'Samsung', 45000, 65000, 21, 8, 2),
('product_005', 'PROD-005', 'Impresora HP DeskJet', 'Impresora multifunción color', 'Impresoras', 'HP', 35000, 55000, 21, 5, 1);

-- Insert initial accounts
INSERT INTO "accounts" ("id", "name", "type", "accountNumber", "currentBalance", "currency") VALUES 
('account_001', 'Caja Principal', 'CASH', NULL, 10000, 'ARS'),
('account_002', 'Banco Santander CC', 'BANK', '123-456789-0', 50000, 'ARS'),
('account_003', 'Banco Galicia USD', 'BANK', '987-654321-1', 5000, 'USD'),
('account_004', 'Mercado Pago', 'CARD', 'MP-001122334455', 15000, 'ARS');

-- Insert exchange rates
INSERT INTO "exchange_rates" ("currency", "officialRate", "blueRate", "date") VALUES 
('USD', 900, 1200, CURRENT_DATE);

-- Insert initial tasks
INSERT INTO "tasks" ("id", "userId", "title", "description", "status", "dueDate") VALUES 
('task_001', 'user_admin', 'Configurar sistema de facturación', 'Implementar módulo de facturación electrónica', 'PENDING', CURRENT_DATE + INTERVAL '7 days'),
('task_002', 'user_manager', 'Revisión inventario mensual', 'Realizar conteo físico de productos', 'PENDING', CURRENT_DATE + INTERVAL '5 days'),
('task_003', 'user_seller1', 'Contactar cliente ABC', 'Seguimiento de propuesta comercial', 'PENDING', CURRENT_DATE + INTERVAL '2 days');

-- Insert sample sale
INSERT INTO "sales" ("id", "number", "customerId", "sellerId", "branchId", "status", "subtotal", "taxes", "total", "currency") VALUES 
('sale_001', 'VTA-2024-001', 'customer_001', 'user_seller1', 'branch_001', 'CONFIRMED', 100000, 21000, 121000, 'ARS');

-- Insert sale items
INSERT INTO "sale_items" ("id", "saleId", "productId", "quantity", "unitPrice", "total") VALUES 
('saleitem_001', 'sale_001', 'product_004', 1, 65000, 65000),
('saleitem_002', 'sale_001', 'product_002', 2, 2500, 5000),
('saleitem_003', 'sale_001', 'product_003', 1, 3500, 3500);

-- Insert stock movements for the sale
INSERT INTO "stock_movements" ("productId", "branchId", "type", "quantity", "reference") VALUES 
('product_004', 'branch_001', 'OUT', -1, 'SALE:sale_001'),
('product_002', 'branch_001', 'OUT', -2, 'SALE:sale_001'),
('product_003', 'branch_001', 'OUT', -1, 'SALE:sale_001');

-- Update product stock after sale
UPDATE "products" SET "currentStock" = "currentStock" - 1 WHERE "id" = 'product_004';
UPDATE "products" SET "currentStock" = "currentStock" - 2 WHERE "id" = 'product_002';
UPDATE "products" SET "currentStock" = "currentStock" - 1 WHERE "id" = 'product_003';

-- Insert collection for the sale
INSERT INTO "collections" ("id", "saleId", "customerId", "userId", "amount", "paymentMethod", "accountId") VALUES 
('collection_001', 'sale_001', 'customer_001', 'user_seller1', 121000, 'TRANSFER', 'account_002');

-- Insert account movement for collection
INSERT INTO "account_movements" ("accountId", "amount", "description", "reference") VALUES 
('account_002', 121000, 'Cobro venta VTA-2024-001', 'COLLECTION:collection_001');

-- Update account balance
UPDATE "accounts" SET "currentBalance" = "currentBalance" + 121000 WHERE "id" = 'account_002';

-- Insert sample purchase
INSERT INTO "purchases" ("id", "number", "supplierId", "branchId", "status", "subtotal", "taxes", "total", "currency") VALUES 
('purchase_001', 'COMP-2024-001', 'supplier_001', 'branch_001', 'RECEIVED', 200000, 42000, 242000, 'ARS');

-- Insert purchase items
INSERT INTO "purchase_items" ("id", "purchaseId", "productId", "quantity", "unitPrice", "total") VALUES 
('purchaseitem_001', 'purchase_001', 'product_001', 2, 80000, 160000),
('purchaseitem_002', 'purchase_001', 'product_005', 1, 35000, 35000);

-- Insert stock movements for the purchase
INSERT INTO "stock_movements" ("productId", "branchId", "type", "quantity", "reference") VALUES 
('product_001', 'branch_001', 'IN', 2, 'PURCHASE:purchase_001'),
('product_005', 'branch_001', 'IN', 1, 'PURCHASE:purchase_001');

-- Update product stock after purchase
UPDATE "products" SET "currentStock" = "currentStock" + 2 WHERE "id" = 'product_001';
UPDATE "products" SET "currentStock" = "currentStock" + 1 WHERE "id" = 'product_005';

-- Insert payment for the purchase
INSERT INTO "payments" ("id", "purchaseId", "supplierId", "userId", "amount", "paymentMethod", "accountId") VALUES 
('payment_001', 'purchase_001', 'supplier_001', 'user_admin', 242000, 'TRANSFER', 'account_002');

-- Insert account movement for payment
INSERT INTO "account_movements" ("accountId", "amount", "description", "reference") VALUES 
('account_002', -242000, 'Pago compra COMP-2024-001', 'PAYMENT:payment_001');

-- Update account balance
UPDATE "accounts" SET "currentBalance" = "currentBalance" - 242000 WHERE "id" = 'account_002';

-- Insert audit log entries
INSERT INTO "audit_logs" ("userId", "action", "resource", "resourceId", "newValues") VALUES 
('user_admin', 'CREATE', 'sale', 'sale_001', '{"total": 121000, "status": "CONFIRMED"}'),
('user_admin', 'CREATE', 'purchase', 'purchase_001', '{"total": 242000, "status": "RECEIVED"}');

COMMIT;