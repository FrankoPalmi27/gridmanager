// Production server using PostgreSQL directly (bypassing Prisma prepared statement issues)
const express = require('express');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// Load environment variables
require('dotenv').config();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Database connection helper
async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  return client;
}

// Generate JWT tokens
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// Tenant registration endpoint
app.post('/api/v1/auth/register-tenant', async (req, res) => {
  const client = await getDbClient();

  try {
    const { email, name, password, tenantName } = req.body;

    console.log('📝 Tenant registration request:', { email, name, tenantName });

    if (!email || !name || !password || !tenantName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    await client.query('BEGIN');

    try {
      // Create tenant
      const tenantId = uuidv4();
      const slug = tenantName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      const tenant = await client.query(`
        INSERT INTO tenants (id, name, slug, email, status, plan, "trialEnds", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 'TRIAL', 'TRIAL', $5, NOW(), NOW())
        RETURNING *
      `, [tenantId, tenantName, slug, email, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)]);

      // Create branch
      const branchId = uuidv4();
      const branch = await client.query(`
        INSERT INTO branches (id, "tenantId", name, address, phone, active)
        VALUES ($1, $2, 'Principal', '', '', true)
        RETURNING *
      `, [branchId, tenantId]);

      // Create user
      const userId = uuidv4();
      const user = await client.query(`
        INSERT INTO users (id, "tenantId", email, name, password, role, status, "branchId", provider, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 'ADMIN', 'ACTIVE', $6, 'local', NOW(), NOW())
        RETURNING id, email, name, role, "branchId"
      `, [userId, tenantId, email, name, hashedPassword, branchId]);

      // Commit transaction
      await client.query('COMMIT');

      // Generate tokens
      const tokens = generateTokens(userId);

      console.log('✅ Tenant registration successful');

      res.status(201).json({
        success: true,
        data: {
          tokens,
          tenant: {
            name: tenant.rows[0].name,
            slug: tenant.rows[0].slug,
            plan: tenant.rows[0].plan,
            trialEnds: tenant.rows[0].trialEnds
          },
          user: {
            name: user.rows[0].name,
            email: user.rows[0].email,
            role: user.rows[0].role
          },
          tempPassword: password,
          loginUrl: `/empresa/${slug}/dashboard`
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  } finally {
    await client.end();
  }
});

// Login endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  const client = await getDbClient();

  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const userResult = await client.query(`
      SELECT u.id, u.email, u.name, u.password, u.role, u.status, u."branchId",
             b.id as branch_id, b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u."branchId" = b.id
      WHERE u.email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = userResult.rows[0];

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: 'Account is not active'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    console.log('✅ Login successful');

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branchId: user.branchId,
          branch: {
            id: user.branch_id,
            name: user.branch_name
          }
        },
        tokens
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } finally {
    await client.end();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'production',
    database: 'postgresql'
  });
});

// API docs redirect
app.get('/api-docs', (req, res) => {
  res.json({
    message: 'Grid Manager API',
    version: '1.0.0',
    endpoints: {
      'POST /api/v1/auth/register-tenant': 'Register new tenant',
      'POST /api/v1/auth/login': 'User login',
      'GET /health': 'Health check'
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Production server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
  console.log('🎯 Ready for production traffic!');
});

module.exports = app;