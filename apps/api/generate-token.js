const jwt = require('jsonwebtoken');

// This is the JWT_SECRET from your .env file
const JWT_SECRET = 'your-super-secret-jwt-key-here-change-in-production';

// Let's assume we have a user ID (we can get one from the database later)
// For now, let's use a mock user ID
const userId = 'test-user-id';

// Generate access token (same as the API does)
const accessToken = jwt.sign({ userId }, JWT_SECRET, {
  expiresIn: '15m',
});

console.log('Generated JWT Token:');
console.log(accessToken);
console.log('');
console.log('Use this token in Authorization header as:');
console.log('Authorization: Bearer ' + accessToken);
console.log('');

// Let's also verify the token works
try {
  const decoded = jwt.verify(accessToken, JWT_SECRET);
  console.log('Token verification successful:');
  console.log(decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}