const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'admin123';
  const hashFromSeed = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8k1e9qTyXsS3qXHmz7AHKCf4Z.qo8K';
  
  console.log('Testing password comparison...');
  console.log('Password:', password);
  console.log('Hash from seed:', hashFromSeed);
  
  const isValid = await bcrypt.compare(password, hashFromSeed);
  console.log('Does it match?', isValid);
  
  // Let's also test with a fresh hash
  const freshHash = await bcrypt.hash(password, 10);
  console.log('Fresh hash for same password:', freshHash);
  
  const freshIsValid = await bcrypt.compare(password, freshHash);
  console.log('Fresh hash matches?', freshIsValid);
}

testPassword().catch(console.error);