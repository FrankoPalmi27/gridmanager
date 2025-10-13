import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, AuthenticatedRequest, managerOrAbove } from '../middleware/auth';
import { TenantRequest } from '../middleware/tenant';
import { createError } from '../middleware/errorHandler';

const router = Router();

interface SystemConfigPayload {
  allowNegativeStock: boolean;
  stockWarningThreshold: number;
  defaultCurrency: string;
  dateFormat: string;
  autoBackup: boolean;
  enableAuditLog: boolean;
  maxStockAlerts: number;
  debugMode: boolean;
}

const DEFAULT_SYSTEM_CONFIG: SystemConfigPayload = {
  allowNegativeStock: false,
  stockWarningThreshold: 120,
  defaultCurrency: 'ARS',
  dateFormat: 'DD/MM/YYYY',
  autoBackup: true,
  enableAuditLog: true,
  maxStockAlerts: 50,
  debugMode: false,
};

const numericField = (min: number, max: number) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }

    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }, z.number().min(min).max(max)).optional();

const UpdateSystemConfigSchema = z.object({
  allowNegativeStock: z.boolean().optional(),
  stockWarningThreshold: numericField(0, 1000),
  defaultCurrency: z.string().min(1).max(10).optional(),
  dateFormat: z.string().min(2).max(20).optional(),
  autoBackup: z.boolean().optional(),
  enableAuditLog: z.boolean().optional(),
  maxStockAlerts: numericField(0, 10000),
  debugMode: z.boolean().optional(),
}).strict();

const normalizeSystemConfig = (config: unknown): SystemConfigPayload => {
  if (!config || typeof config !== 'object') {
    return { ...DEFAULT_SYSTEM_CONFIG };
  }

  const raw = config as Partial<SystemConfigPayload>;
  return {
    allowNegativeStock: typeof raw.allowNegativeStock === 'boolean'
      ? raw.allowNegativeStock
      : DEFAULT_SYSTEM_CONFIG.allowNegativeStock,
    stockWarningThreshold: typeof raw.stockWarningThreshold === 'number'
      ? raw.stockWarningThreshold
      : DEFAULT_SYSTEM_CONFIG.stockWarningThreshold,
    defaultCurrency: typeof raw.defaultCurrency === 'string' && raw.defaultCurrency.trim().length > 0
      ? raw.defaultCurrency
      : DEFAULT_SYSTEM_CONFIG.defaultCurrency,
    dateFormat: typeof raw.dateFormat === 'string' && raw.dateFormat.trim().length > 0
      ? raw.dateFormat
      : DEFAULT_SYSTEM_CONFIG.dateFormat,
    autoBackup: typeof raw.autoBackup === 'boolean'
      ? raw.autoBackup
      : DEFAULT_SYSTEM_CONFIG.autoBackup,
    enableAuditLog: typeof raw.enableAuditLog === 'boolean'
      ? raw.enableAuditLog
      : DEFAULT_SYSTEM_CONFIG.enableAuditLog,
    maxStockAlerts: typeof raw.maxStockAlerts === 'number'
      ? raw.maxStockAlerts
      : DEFAULT_SYSTEM_CONFIG.maxStockAlerts,
    debugMode: typeof raw.debugMode === 'boolean'
      ? raw.debugMode
      : DEFAULT_SYSTEM_CONFIG.debugMode,
  };
};

const parseNumericField = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const mergeConfig = (current: SystemConfigPayload, updates: Partial<SystemConfigPayload>): SystemConfigPayload => ({
  ...current,
  ...updates,
  stockWarningThreshold: updates.stockWarningThreshold !== undefined
    ? parseNumericField(updates.stockWarningThreshold, current.stockWarningThreshold)
    : current.stockWarningThreshold,
  maxStockAlerts: updates.maxStockAlerts !== undefined
    ? parseNumericField(updates.maxStockAlerts, current.maxStockAlerts)
    : current.maxStockAlerts,
});

const getTenantIdentifiers = (req: AuthenticatedRequest & TenantRequest) => {
  if (!req.user?.tenantId || !req.tenantId) {
    throw createError('Tenant no encontrado en el contexto de la solicitud', 400);
  }

  if (req.user.tenantId !== req.tenantId) {
    throw createError('Tenant inválido para el usuario autenticado', 403);
  }

  return { tenantId: req.tenantId, userId: req.user.id };
};

router.get('/system', authenticate, managerOrAbove, async (req, res, next) => {
  try {
    const { tenantId } = getTenantIdentifiers(req as AuthenticatedRequest & TenantRequest);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const settings = tenant?.settings;
    const settingsObject =
      settings && typeof settings === 'object' && !Array.isArray(settings)
        ? (settings as Record<string, unknown>)
        : {};

  const storedConfig = settingsObject['systemConfig'] as unknown;
    const config = normalizeSystemConfig(storedConfig ?? settingsObject);

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/system', authenticate, managerOrAbove, async (req, res, next) => {
  try {
    const { tenantId, userId } = getTenantIdentifiers(req as AuthenticatedRequest & TenantRequest);

    const payload = UpdateSystemConfigSchema.parse(req.body);

    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    const currentSettings = existingTenant?.settings;
    const settingsObject =
      currentSettings && typeof currentSettings === 'object' && !Array.isArray(currentSettings)
        ? (currentSettings as Record<string, unknown>)
        : {};

  const storedConfig = settingsObject['systemConfig'] as unknown;
    const previousConfig = normalizeSystemConfig(storedConfig ?? settingsObject);

    const mergedConfig = mergeConfig(previousConfig, payload);

    const nextSettings: Record<string, unknown> = {
      ...settingsObject,
      systemConfig: mergedConfig,
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: nextSettings },
    });

    const userAgentHeader = req.headers['user-agent'];
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_SYSTEM_CONFIG',
        resource: 'SYSTEM_CONFIG',
        resourceId: tenantId,
        oldValues: previousConfig,
        newValues: mergedConfig,
        ip: req.ip,
        userAgent: Array.isArray(userAgentHeader) ? userAgentHeader.join(', ') : userAgentHeader ?? undefined,
      },
    });

    res.json({
      success: true,
      data: mergedConfig,
    });
  } catch (error) {
    next(error);
  }
});

export const settingsRoutes = router;
