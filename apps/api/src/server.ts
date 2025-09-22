import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import passport from './config/passport';

import { errorHandler } from './middleware/errorHandler';
import { tenantMiddleware, optionalTenantMiddleware } from './middleware/tenant';
import { authRoutes } from './routes/auth';
import { tenantRoutes } from './routes/tenant';
import { dashboardRoutes } from './routes/dashboard';
import { customerRoutes } from './routes/customers';
import { supplierRoutes } from './routes/suppliers';
import { productRoutes } from './routes/products';
import { saleRoutes } from './routes/sales';
import { purchaseRoutes } from './routes/purchases';
import { userRoutes } from './routes/users';
import { accountRoutes } from './routes/accounts';
import { reportRoutes } from './routes/reports';

// Factory function for creating the Express app (for serverless functions)
export function createApp() {
  const app = express();

  // Database and Redis clients
  // (Redis setup will be done in the main server section)

  // Middleware
  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'https://obsidiangridmanager.netlify.app',
        'https://gridmanager-production.up.railway.app'
      ];

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // All routes use v1 versioning for consistency

  // Health check - simple and fast
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || '3001'
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Grid Manager Multi-Tenant API',
      version: '2.0.0',
      multiTenant: process.env.MULTITENANT_ENABLED === 'true',
      health: '/health',
      docs: '/api-docs',
      endpoints: {
        auth: '/api/v1/auth',
        tenantRegister: '/api/v1/tenant/register',
        tenantLogin: '/api/v1/tenant/login'
      }
    });
  });

  // Google OAuth is now handled by authRoutes
  console.log('🔗 Google OAuth routes handled by /api/v1/auth');
  console.log('🔄 Forcing Railway redeploy - timestamp:', new Date().toISOString());

  // Error handler
  app.use(errorHandler);

  return app;
}

const app = createApp();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Database and Redis clients
export const prisma = new PrismaClient();

// Redis is optional for development
let redis: any = null;
if (process.env.REDIS_URL) {
  redis = createClient({
    url: process.env.REDIS_URL,
  });
} else {
  console.log('⚠️  Redis not configured - using memory cache');
  redis = {
    connect: () => Promise.resolve(),
    disconnect: () => Promise.resolve(),
  };
}

export { redis };

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Grid Manager API',
      version: '1.0.0',
      description: 'Modern business management system API',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


// Public API Routes (no tenant required)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenant', tenantRoutes);

// Tenant-aware API Routes (require tenant context)
app.use('/api/v1/dashboard', tenantMiddleware, dashboardRoutes);
app.use('/api/v1/customers', tenantMiddleware, customerRoutes);
app.use('/api/v1/suppliers', tenantMiddleware, supplierRoutes);
app.use('/api/v1/products', tenantMiddleware, productRoutes);
app.use('/api/v1/sales', tenantMiddleware, saleRoutes);
app.use('/api/v1/purchases', tenantMiddleware, purchaseRoutes);
app.use('/api/v1/users', tenantMiddleware, userRoutes);
app.use('/api/v1/accounts', tenantMiddleware, accountRoutes);
app.use('/api/v1/reports', tenantMiddleware, reportRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

async function startServer() {
  try {
    console.log(`🔧 Starting server on port ${PORT}...`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Start server first (Railway needs this to respond to health checks)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
    });

    // Handle server startup errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Connect to services after server is running
    try {
      // Connect to Redis (if available)
      if (process.env.REDIS_URL) {
        await redis.connect();
        console.log('✅ Connected to Redis');
      } else {
        console.log('⚠️  Redis not configured - using memory cache');
      }

      // Test database connection
      await prisma.$connect();
      console.log('✅ Connected to PostgreSQL (Supabase)');
    } catch (dbError) {
      console.warn('⚠️  Database connection failed, but server is still running:', dbError);
      // Don't exit - let the server run even if DB is not ready
    }

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  if (process.env.REDIS_URL && redis) {
    await redis.disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  if (process.env.REDIS_URL && redis) {
    await redis.disconnect();
  }
  process.exit(0);
});

startServer();
