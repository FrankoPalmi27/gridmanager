import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5001', 'http://localhost:5002', 'http://localhost:5003'],
  credentials: true,
}));
app.use(express.json());

// Mock data
const mockDashboardData = {
  totalAvailable: 0,
  accountsCount: 0,
  customerDebt: 0,
  supplierDebt: 0,
  pendingTasks: 0,
  salesLast30Days: [],
  exchangeRates: [
    { currency: 'USD', officialRate: 350.50, blueRate: 785.00, date: new Date() }
  ],
  taskList: []
};

const mockActivityData = {
  recentSales: [],
  recentPurchases: [
    {
      id: '1',
      number: 'COM-2024-001',
      supplier: 'Proveedor ABC',
      total: 15000,
      currency: 'ARS',
      status: 'RECEIVED',
      createdAt: new Date('2024-01-14')
    }
  ]
};

const mockCustomers = [];

const mockProducts = [];

// API Routes
app.get('/api/v1/dashboard/summary', (req, res) => {
  console.log('Dashboard summary requested');
  res.json({
    success: true,
    data: mockDashboardData
  });
});

app.get('/api/v1/dashboard/recent-activity', (req, res) => {
  console.log('Recent activity requested');
  res.json({
    success: true,
    data: mockActivityData
  });
});

app.get('/api/v1/customers', (req, res) => {
  console.log('Customers list requested');
  res.json({
    success: true,
    data: {
      customers: mockCustomers,
      total: mockCustomers.length,
      page: 1,
      limit: 20
    }
  });
});

app.get('/api/v1/products', (req, res) => {
  console.log('Products list requested');
  res.json({
    success: true,
    data: {
      products: mockProducts,
      total: mockProducts.length,
      page: 1,
      limit: 20
    }
  });
});

app.post('/api/v1/sales', (req, res) => {
  console.log('New sale created:', req.body);
  const newSale = {
    id: Date.now().toString(),
    number: `VTA-2024-${Date.now()}`,
    ...req.body,
    status: 'PENDING',
    createdAt: new Date()
  };
  
  res.json({
    success: true,
    data: newSale
  });
});

// Auth mock endpoints
app.post('/api/v1/auth/login', (req, res) => {
  console.log('Login attempt:', req.body.email);
  res.json({
    success: true,
    data: {
      user: {
        id: '1',
        name: 'Usuario Demo',
        email: req.body.email,
        role: 'ADMIN'
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    }
  });
});

app.get('/api/v1/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: '1',
      name: 'Usuario Demo',
      email: 'demo@gridmanager.com',
      role: 'ADMIN'
    }
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    message: 'Grid Manager Mock API is running'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Grid Manager Mock API server running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/v1/dashboard/summary`);
  console.log(`💡 Health check: http://localhost:${PORT}/health`);
});