import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { dashboardRoutes } from './routes/dashboard';
import { customerRoutes } from './routes/customers';
import { supplierRoutes } from './routes/suppliers';
import { productRoutes } from './routes/products';
import { saleRoutes } from './routes/sales';
import { purchaseRoutes } from './routes/purchases';
import { userRoutes } from './routes/users';
import { accountRoutes } from './routes/accounts';
import { reportRoutes } from './routes/reports';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/reports', reportRoutes);

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
    // Connect to Redis (if available)
    if (process.env.REDIS_URL) {
      await redis.connect();
      console.log('✅ Connected to Redis');
    }

    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL (Supabase)');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API docs available at http://localhost:${PORT}/api-docs`);
    });
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