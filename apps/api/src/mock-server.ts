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
  totalAvailable: 125000,
  accountsCount: 4,
  customerDebt: 35000,
  supplierDebt: 18000,
  pendingTasks: 3,
  salesLast30Days: [
    { date: '2024-01-01', amount: 12000 },
    { date: '2024-01-02', amount: 15000 },
    { date: '2024-01-03', amount: 8000 },
    { date: '2024-01-04', amount: 22000 },
    { date: '2024-01-05', amount: 18000 },
  ],
  exchangeRates: [
    { currency: 'USD', officialRate: 350.50, blueRate: 785.00, date: new Date() }
  ],
  taskList: [
    { id: '1', title: 'Completar setup inicial', description: 'Configurar datos base del sistema', dueDate: new Date() },
    { id: '2', title: 'Revisar inventario', description: 'Actualizar stock de productos', dueDate: new Date() },
  ]
};

const mockActivityData = {
  recentSales: [
    {
      id: '1',
      number: 'VTA-2024-001',
      customer: 'Juan Pérez',
      seller: 'Ana García',
      total: 25000,
      currency: 'ARS',
      status: 'CONFIRMED',
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2', 
      number: 'VTA-2024-002',
      customer: 'María López',
      seller: 'Carlos Ruiz',
      total: 45000,
      currency: 'ARS',
      status: 'PENDING',
      createdAt: new Date('2024-01-16')
    }
  ],
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

const mockCustomers = [
  { id: '1', name: 'Juan Pérez', email: 'juan@email.com', phone: '+54 11 1234-5678' },
  { id: '2', name: 'María López', email: 'maria@email.com', phone: '+54 11 2345-6789' },
  { id: '3', name: 'Pedro Martín', email: 'pedro@email.com', phone: '+54 11 3456-7890' },
  { id: '4', name: 'Ana García', email: 'ana@email.com', phone: '+54 11 4567-8901' },
  { id: '5', name: 'Carlos Ruiz', email: 'carlos@email.com', phone: '+54 11 5678-9012' },
];

const mockProducts = [
  { id: '1', name: 'Producto A', price: 2500, stock: 50, sku: 'PRD-001' },
  { id: '2', name: 'Producto B', price: 1800, stock: 30, sku: 'PRD-002' },
  { id: '3', name: 'Producto C', price: 3200, stock: 25, sku: 'PRD-003' },
  { id: '4', name: 'Servicio Premium', price: 5000, stock: 999, sku: 'SRV-001' },
  { id: '5', name: 'Consultoría', price: 8000, stock: 999, sku: 'SRV-002' },
];

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