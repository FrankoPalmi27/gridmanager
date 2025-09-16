// Simple test without Prisma to isolate the registration logic
const express = require('express');

const app = express();
app.use(express.json());

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

// Mock database in memory for testing
let mockDB = {
  tenants: [],
  users: [],
  branches: []
};

// Test registration endpoint
app.post('/api/v1/auth/register-tenant', async (req, res) => {
  try {
    const { email, name, password, tenantName } = req.body;

    console.log('📝 Received registration request:', { email, name, tenantName });

    if (!email || !name || !password || !tenantName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = mockDB.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password (simple for testing)
    const hashedPassword = 'hashed_' + password;

    // Create tenant
    const tenant = {
      id: `tenant_${Date.now()}`,
      name: tenantName,
      slug: tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      email: email,
      status: 'TRIAL',
      plan: 'TRIAL',
      trialEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };
    mockDB.tenants.push(tenant);

    // Create branch
    const branch = {
      id: `branch_${Date.now()}`,
      tenantId: tenant.id,
      name: 'Principal',
      address: '',
      phone: '',
      status: 'ACTIVE'
    };
    mockDB.branches.push(branch);

    // Create user
    const user = {
      id: `user_${Date.now()}`,
      tenantId: tenant.id,
      email,
      name,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      branchId: branch.id,
      createdAt: new Date()
    };
    mockDB.users.push(user);

    // Generate tokens (simple for testing)
    const tokens = {
      accessToken: `test_access_${user.id}`,
      refreshToken: `test_refresh_${user.id}`
    };

    console.log('✅ Registration successful');

    res.status(201).json({
      success: true,
      data: {
        tokens,
        tenant: {
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          trialEnds: tenant.trialEnds
        },
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        },
        tempPassword: password, // Show original password as temp password
        loginUrl: `/empresa/${tenant.slug}/dashboard`
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Login endpoint for testing
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user in mock DB
    const user = mockDB.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Simple password check (for testing)
    if (user.password !== ('hashed_' + password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Find tenant and branch
    const tenant = mockDB.tenants.find(t => t.id === user.tenantId);
    const branch = mockDB.branches.find(b => b.id === user.branchId);

    // Generate tokens
    const tokens = {
      accessToken: `test_access_${user.id}`,
      refreshToken: `test_refresh_${user.id}`
    };

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
            id: branch?.id,
            name: branch?.name
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
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), test: true });
});

// Debug endpoint
app.get('/debug/db', (req, res) => {
  res.json({
    tenants: mockDB.tenants.length,
    users: mockDB.users.length,
    branches: mockDB.branches.length,
    data: mockDB
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('🔧 Testing registration without Prisma');
});

module.exports = app;