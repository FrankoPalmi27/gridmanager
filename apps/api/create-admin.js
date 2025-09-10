const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔄 Creating admin user with correct password...');
    
    // Generate fresh bcrypt hash for "admin123"
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hashedPassword);
    
    // First, get a branch ID
    const branch = await prisma.branch.findFirst();
    console.log('Found branch:', branch?.name);
    
    if (!branch) {
      console.log('No branch found, creating one...');
      const newBranch = await prisma.branch.create({
        data: {
          name: 'Sucursal Centro',
          address: 'Av. Corrientes 1234, CABA',
          phone: '+54 11 1234-5678',
          email: 'centro@gridmanager.com'
        }
      });
      console.log('Created branch:', newBranch.name);
    }
    
    // Delete existing admin if exists
    await prisma.user.deleteMany({
      where: { email: 'admin@gridmanager.com' }
    });
    
    // Create admin user with correct password
    const admin = await prisma.user.create({
      data: {
        email: 'admin@gridmanager.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        branchId: branch?.id || await prisma.branch.findFirst().then(b => b?.id)
      },
      select: { 
        email: true, 
        name: true, 
        role: true, 
        status: true 
      }
    });
    
    console.log('✅ Admin user created successfully:', admin);
    
    // Test the password
    const testMatch = await bcrypt.compare(password, hashedPassword);
    console.log('Password verification test:', testMatch);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();