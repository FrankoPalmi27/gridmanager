import { beforeAll } from 'vitest';
import dotenv from 'dotenv';

beforeAll(() => {
  // Load test environment variables
  dotenv.config({ path: '.env.test' });
  
  // Set test environment
  process.env.NODE_ENV = 'test';
});