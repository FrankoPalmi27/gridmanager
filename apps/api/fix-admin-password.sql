-- Fix admin user password with correct bcrypt hash
UPDATE "users" 
SET 
  "password" = '$2a$10$CgU6lX50iCjBm50oPx9ZdumiurAoTLrDVvR0DWj.ARPOwC9M2IVEm',
  "status" = 'ACTIVE'
WHERE "email" = 'admin@gridmanager.com';

-- Verify the update
SELECT "email", "name", "role", "status", LEFT("password", 20) || '...' as password_start
FROM "users" 
WHERE "email" = 'admin@gridmanager.com';