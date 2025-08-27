import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateTokens } from '../utils/auth';

const prisma = new PrismaClient();

describe('Auth Utils', () => {
  it('should hash and compare passwords correctly', async () => {
    const password = 'test123';
    const hashedPassword = await hashPassword(password);
    
    expect(hashedPassword).not.toBe(password);
    expect(await comparePassword(password, hashedPassword)).toBe(true);
    expect(await comparePassword('wrongpassword', hashedPassword)).toBe(false);
  });

  it('should generate valid JWT tokens', () => {
    const userId = 'test-user-id';
    const tokens = generateTokens(userId);
    
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
  });
});

describe('Auth API', () => {
  let testUser: any;

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: await hashPassword('test123'),
        role: 'SELLER',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    }
    await prisma.$disconnect();
  });

  it('should authenticate user with correct credentials', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    expect(user).toBeTruthy();
    expect(user?.email).toBe('test@example.com');
    expect(user?.name).toBe('Test User');
    
    const isValidPassword = await comparePassword('test123', user!.password);
    expect(isValidPassword).toBe(true);
  });
});