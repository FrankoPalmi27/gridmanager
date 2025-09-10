const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.bcpanxxwahxbvxueeioj:GRIDMANAGER_2025@aws-1-us-east-1.pooler.supabase.com:6543/postgres'
    }
  }
});

const JWT_SECRET = 'your-super-secret-jwt-key-here-change-in-production';

async function getUserAndGenerateToken() {
  try {
    console.log('Getting real user from database...');
    
    // Get the first user from the database
    const user = await prisma.user.findFirst({
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        status: true 
      }
    });
    
    if (!user) {
      console.log('No users found in database');
      return;
    }
    
    console.log('Found user:', user);
    
    // Generate token with real user ID
    const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '15m',
    });
    
    console.log('\\nGenerated JWT Token for user:', user.email);
    console.log(accessToken);
    console.log('\\nUse this in API calls:');
    console.log('Authorization: Bearer ' + accessToken);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getUserAndGenerateToken();