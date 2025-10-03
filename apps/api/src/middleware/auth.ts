import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types/index';
import { prisma } from '../server';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string;
    branchId?: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        tenantId: true,
        branchId: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({
        success: false,
        error: 'Invalid or inactive user',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      tenantId: user.tenantId,
      ...(user.branchId && { branchId: user.branchId }),
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
    return;
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

// Convenience middleware for common role checks
export const adminOnly = authorize([UserRole.ADMIN]);
export const managerOrAbove = authorize([UserRole.ADMIN, UserRole.MANAGER]);
export const analystOrAbove = authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST]);
export const allRoles = authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.ANALYST, UserRole.SELLER]);