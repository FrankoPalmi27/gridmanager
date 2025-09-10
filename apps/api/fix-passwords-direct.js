const bcrypt = require('bcryptjs');

async function generatePasswordHashes() {
  console.log('🔐 Generating correct password hashes...');
  
  const passwords = {
    'admin123': await bcrypt.hash('admin123', 10),
    'manager123': await bcrypt.hash('manager123', 10),
    'seller123': await bcrypt.hash('seller123', 10),
    'analyst123': await bcrypt.hash('analyst123', 10)
  };
  
  console.log('\n📝 SQL UPDATE statements to run in Supabase:');
  console.log('Copy and paste these in the Supabase SQL Editor:\n');
  
  console.log(`-- Update admin user`);
  console.log(`UPDATE users SET password = '${passwords['admin123']}', status = 'ACTIVE' WHERE email = 'admin@gridmanager.com';`);
  
  console.log(`\n-- Update manager user`);
  console.log(`UPDATE users SET password = '${passwords['manager123']}', status = 'ACTIVE' WHERE email = 'manager@gridmanager.com';`);
  
  console.log(`\n-- Update seller users`);
  console.log(`UPDATE users SET password = '${passwords['seller123']}', status = 'ACTIVE' WHERE email = 'seller1@gridmanager.com';`);
  console.log(`UPDATE users SET password = '${passwords['seller123']}', status = 'ACTIVE' WHERE email = 'seller2@gridmanager.com';`);
  
  console.log(`\n-- Update analyst user`);
  console.log(`UPDATE users SET password = '${passwords['analyst123']}', status = 'ACTIVE' WHERE email = 'analyst@gridmanager.com';`);
  
  console.log('\n✅ After running these updates, users will be able to login with:');
  console.log('- admin@gridmanager.com / admin123');
  console.log('- manager@gridmanager.com / manager123');
  console.log('- seller1@gridmanager.com / seller123');
  console.log('- seller2@gridmanager.com / seller123');
  console.log('- analyst@gridmanager.com / analyst123');
}

generatePasswordHashes().catch(console.error);