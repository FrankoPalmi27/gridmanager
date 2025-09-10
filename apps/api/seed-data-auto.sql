-- Grid Manager Initial Data with AUTO IDs
-- Execute this AFTER creating tables

-- Insert initial branches (using default UUIDs)
INSERT INTO "branches" ("name", "address", "phone", "email") VALUES 
('Sucursal Centro', 'Av. Corrientes 1234, CABA', '+54 11 1234-5678', 'centro@gridmanager.com'),
('Sucursal Norte', 'Av. Cabildo 5678, CABA', '+54 11 8765-4321', 'norte@gridmanager.com');

-- Get branch IDs for reference
DO $$
DECLARE
    branch_centro_id TEXT;
    branch_norte_id TEXT;
    admin_user_id TEXT;
    manager_user_id TEXT;
    seller1_user_id TEXT;
    seller2_user_id TEXT;
    analyst_user_id TEXT;
    customer1_id TEXT;
    customer2_id TEXT;
    customer3_id TEXT;
    customer4_id TEXT;
    supplier1_id TEXT;
    supplier2_id TEXT;
    supplier3_id TEXT;
    product1_id TEXT;
    product2_id TEXT;
    product3_id TEXT;
    product4_id TEXT;
    product5_id TEXT;
    account1_id TEXT;
    account2_id TEXT;
    account3_id TEXT;
    account4_id TEXT;
BEGIN
    -- Get branch IDs
    SELECT id INTO branch_centro_id FROM "branches" WHERE "name" = 'Sucursal Centro';
    SELECT id INTO branch_norte_id FROM "branches" WHERE "name" = 'Sucursal Norte';
    
    -- Insert users
    INSERT INTO "users" ("email", "name", "password", "role", "branchId") VALUES 
    ('admin@gridmanager.com', 'Administrador', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8k1e9qTyXsS3qXHmz7AHKCf4Z.qo8K', 'ADMIN', branch_centro_id),
    ('manager@gridmanager.com', 'Gerente General', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8k1e9qTyXsS3qXHmz7AHKCf4Z.qo8K', 'MANAGER', branch_centro_id),
    ('seller1@gridmanager.com', 'Vendedor 1', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8k1e9qTyXsS3qXHmz7AHKCf4Z.qo8K', 'SELLER', branch_centro_id),
    ('seller2@gridmanager.com', 'Vendedor 2', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8k1e9qTyXsS3qXHmz7AHKCf4Z.qo8K', 'SELLER', branch_norte_id),
    ('analyst@gridmanager.com', 'Analista', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8k1e9qTyXsS3qXHmz7AHKCf4Z.qo8K', 'ANALYST', branch_centro_id);

    -- Get user IDs
    SELECT id INTO admin_user_id FROM "users" WHERE "email" = 'admin@gridmanager.com';
    SELECT id INTO manager_user_id FROM "users" WHERE "email" = 'manager@gridmanager.com';
    SELECT id INTO seller1_user_id FROM "users" WHERE "email" = 'seller1@gridmanager.com';
    SELECT id INTO seller2_user_id FROM "users" WHERE "email" = 'seller2@gridmanager.com';
    SELECT id INTO analyst_user_id FROM "users" WHERE "email" = 'analyst@gridmanager.com';

    -- Insert customers
    INSERT INTO "customers" ("name", "email", "phone", "address", "taxId", "creditLimit", "currentBalance") VALUES 
    ('Empresa ABC S.A.', 'contacto@empresaabc.com', '+54 11 2222-3333', 'Av. Libertador 1000, CABA', '30-12345678-9', 100000, 0),
    ('Comercial XYZ', 'ventas@comercialxyz.com', '+54 11 4444-5555', 'Av. Santa Fe 2000, CABA', '30-87654321-0', 50000, 0),
    ('Juan Pérez', 'juan.perez@email.com', '+54 9 11 6666-7777', 'Corrientes 500, CABA', '20-11223344-5', 25000, 0),
    ('María González', 'maria.gonzalez@email.com', '+54 9 11 8888-9999', 'Rivadavia 800, CABA', '27-44556677-8', 15000, 0);

    -- Insert suppliers
    INSERT INTO "suppliers" ("name", "email", "phone", "address", "taxId", "currentBalance") VALUES 
    ('Proveedor Mayorista SA', 'compras@mayorista.com', '+54 11 1111-2222', 'Av. Industrial 100, San Martín', '30-99887766-1', 0),
    ('Distribuidora Centro', 'ventas@distcentro.com', '+54 11 3333-4444', 'Av. Mitre 500, Avellaneda', '30-55443322-2', 0),
    ('Importadora del Sur', 'info@impsur.com', '+54 11 7777-8888', 'Av. Belgrano 1500, CABA', '30-11998877-3', 0);

    -- Insert products
    INSERT INTO "products" ("sku", "name", "description", "category", "brand", "cost", "basePrice", "taxRate", "currentStock", "minStock") VALUES 
    ('PROD-001', 'Notebook Dell Inspiron 15', 'Notebook 15.6" Intel i5 8GB RAM 256GB SSD', 'Computación', 'Dell', 80000, 120000, 21, 10, 2),
    ('PROD-002', 'Mouse Logitech M100', 'Mouse óptico USB con cable', 'Periféricos', 'Logitech', 1500, 2500, 21, 50, 10),
    ('PROD-003', 'Teclado Genius KB-110', 'Teclado USB estándar', 'Periféricos', 'Genius', 2000, 3500, 21, 30, 5),
    ('PROD-004', 'Monitor Samsung 24"', 'Monitor LED 24" Full HD', 'Monitores', 'Samsung', 45000, 65000, 21, 8, 2),
    ('PROD-005', 'Impresora HP DeskJet', 'Impresora multifunción color', 'Impresoras', 'HP', 35000, 55000, 21, 5, 1);

    -- Insert accounts
    INSERT INTO "accounts" ("name", "type", "accountNumber", "currentBalance", "currency") VALUES 
    ('Caja Principal', 'CASH', NULL, 10000, 'ARS'),
    ('Banco Santander CC', 'BANK', '123-456789-0', 50000, 'ARS'),
    ('Banco Galicia USD', 'BANK', '987-654321-1', 5000, 'USD'),
    ('Mercado Pago', 'CARD', 'MP-001122334455', 15000, 'ARS');

    -- Insert exchange rates
    INSERT INTO "exchange_rates" ("currency", "officialRate", "blueRate", "date") VALUES 
    ('USD', 900, 1200, CURRENT_DATE);

    -- Insert tasks
    INSERT INTO "tasks" ("userId", "title", "description", "status", "dueDate") VALUES 
    (admin_user_id, 'Configurar sistema de facturación', 'Implementar módulo de facturación electrónica', 'PENDING', CURRENT_DATE + INTERVAL '7 days'),
    (manager_user_id, 'Revisión inventario mensual', 'Realizar conteo físico de productos', 'PENDING', CURRENT_DATE + INTERVAL '5 days'),
    (seller1_user_id, 'Contactar cliente ABC', 'Seguimiento de propuesta comercial', 'PENDING', CURRENT_DATE + INTERVAL '2 days');

END $$;