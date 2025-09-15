import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { createError } from './errorHandler';

// Extend Request interface to include tenant info
export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    settings?: any;
    limits?: any;
    features?: any;
  };
  tenantId?: string;
}

/**
 * Extract tenant slug from request
 * Supports multiple strategies:
 * 1. Path-based: /empresa/dashboard -> empresa
 * 2. Header: X-Tenant-Slug
 * 3. Query parameter: ?tenant=empresa
 */
function extractTenantSlug(req: Request): string | null {
  // Strategy 1: Path-based (/empresa/dashboard)
  const pathSegments = req.path.split('/').filter(Boolean);
  if (pathSegments.length > 0 && !isPublicRoute(req.path)) {
    const potentialSlug = pathSegments[0];
    // Validate it's not an API route
    if (potentialSlug !== 'api' && potentialSlug !== 'auth' && !potentialSlug.startsWith('_')) {
      return potentialSlug;
    }
  }

  // Strategy 2: Header-based
  const headerSlug = req.headers['x-tenant-slug'] as string;
  if (headerSlug) {
    return headerSlug;
  }

  // Strategy 3: Query parameter
  const querySlug = req.query.tenant as string;
  if (querySlug) {
    return querySlug;
  }

  return null;
}

/**
 * Check if route should bypass tenant middleware
 */
function isPublicRoute(path: string): boolean {
  const publicRoutes = [
    '/api/auth/register-tenant',
    '/api/auth/verify-tenant',
    '/api/health',
    '/api/ping',
    '/api-docs',
    '/',
    '/register',
    '/pricing',
    '/about',
    '/contact'
  ];

  return publicRoutes.some(route => path.startsWith(route)) ||
         path.includes('/public/') ||
         path.includes('/static/');
}

/**
 * Validate tenant limits before processing request
 */
async function validateTenantLimits(tenant: any, req: Request): Promise<void> {
  if (!tenant.limits) return;

  const limits = tenant.limits;

  // Check user limits for user creation endpoints
  if (req.path.includes('/users') && req.method === 'POST') {
    const userCount = await prisma.user.count({
      where: { tenantId: tenant.id }
    });

    if (limits.maxUsers && userCount >= limits.maxUsers) {
      throw createError(`Límite de usuarios alcanzado (${limits.maxUsers}). Actualiza tu plan.`, 403);
    }
  }

  // Check product limits
  if (req.path.includes('/products') && req.method === 'POST') {
    const productCount = await prisma.product.count({
      where: { tenantId: tenant.id }
    });

    if (limits.maxProducts && productCount >= limits.maxProducts) {
      throw createError(`Límite de productos alcanzado (${limits.maxProducts}). Actualiza tu plan.`, 403);
    }
  }

  // Check monthly sales limits
  if (req.path.includes('/sales') && req.method === 'POST') {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlySalesCount = await prisma.sale.count({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: currentMonth
        }
      }
    });

    if (limits.maxSalesPerMonth && monthlySalesCount >= limits.maxSalesPerMonth) {
      throw createError(`Límite de ventas mensuales alcanzado (${limits.maxSalesPerMonth}). Actualiza tu plan.`, 403);
    }
  }
}

/**
 * Tenant middleware - extracts and validates tenant from request
 */
export const tenantMiddleware = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    // Skip tenant validation for public routes
    if (isPublicRoute(req.path)) {
      return next();
    }

    // Extract tenant slug
    const tenantSlug = extractTenantSlug(req);

    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        error: 'Tenant no especificado. Accede a través de /empresa/dashboard'
      });
    }

    // Find tenant in database
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        trialEnds: true,
        settings: true,
        limits: true,
        features: true
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Empresa no encontrada. Verifica la URL.'
      });
    }

    // Check tenant status
    if (tenant.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: 'Cuenta suspendida. Contacta al soporte.'
      });
    }

    if (tenant.status === 'CANCELLED') {
      return res.status(403).json({
        success: false,
        error: 'Cuenta cancelada. Reactiva tu suscripción.'
      });
    }

    // Check trial expiration
    if (tenant.status === 'TRIAL' && tenant.trialEnds) {
      const now = new Date();
      if (now > new Date(tenant.trialEnds)) {
        return res.status(402).json({
          success: false,
          error: 'Período de prueba expirado. Suscríbete para continuar.',
          action: 'UPGRADE_REQUIRED'
        });
      }
    }

    // Validate tenant limits
    await validateTenantLimits(tenant, req);

    // Attach tenant info to request
    req.tenant = tenant;
    req.tenantId = tenant.id;

    // Add tenant info to response headers for debugging
    res.setHeader('X-Tenant-ID', tenant.id);
    res.setHeader('X-Tenant-Slug', tenant.slug);
    res.setHeader('X-Tenant-Plan', tenant.plan);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional tenant middleware - for routes that can work with or without tenant
 */
export const optionalTenantMiddleware = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const tenantSlug = extractTenantSlug(req);

    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          status: true,
          settings: true,
          limits: true,
          features: true
        }
      });

      if (tenant && tenant.status === 'ACTIVE') {
        req.tenant = tenant;
        req.tenantId = tenant.id;
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional tenant middleware
    next();
  }
};

/**
 * Admin-only middleware for tenant management
 */
export const tenantAdminMiddleware = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    // This middleware is for super-admin operations across all tenants
    // Check if user has global admin privileges
    const user = (req as any).user;

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Se requieren privilegios de administrador.'
      });
    }

    // Super admin can bypass tenant restrictions
    next();
  } catch (error) {
    next(error);
  }
};

export default tenantMiddleware;