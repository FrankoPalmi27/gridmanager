import { z } from 'zod';

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ANALYST = 'ANALYST',
  SELLER = 'SELLER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum Currency {
  ARS = 'ARS',
  USD = 'USD',
}

export enum SaleStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum PurchaseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CHECK = 'CHECK',
}

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

export enum ShipmentStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  branchId?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  active: boolean;
}

export interface Customer extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  birthday?: Date;
  creditLimit?: number;
  currentBalance: number;
  active: boolean;
}

export interface Supplier extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  currentBalance: number;
  active: boolean;
}

export interface Product extends BaseEntity {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  cost: number;
  basePrice: number;
  taxRate: number;
  currentStock: number;
  minStock: number;
  unit: string;
  active: boolean;
}

export interface Sale extends BaseEntity {
  number: string;
  customerId: string;
  sellerId: string;
  branchId: string;
  status: SaleStatus;
  subtotal: number;
  taxes: number;
  total: number;
  currency: Currency;
  notes?: string;
  quoteId?: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId?: string;
}

// Dashboard types
export interface DashboardSummary {
  totalAvailable: number;
  accounts: number;
  customerDebt: number;
  supplierDebt: number;
  pendingTasks: number;
  salesLast30Days: {
    date: string;
    amount: number;
  }[];
  exchangeRates: {
    currency: Currency;
    officialRate: number;
    blueRate?: number;
    date: Date;
  }[];
}

// Validation schemas
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).optional(),
  branchId: z.string().optional(),
});

export const CreateCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  birthday: z.string().datetime().optional(),
  creditLimit: z.number().optional(),
});

export const CreateProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  cost: z.number().min(0),
  basePrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
  minStock: z.number().min(0).default(0),
  unit: z.string().default('UNIT'),
});

export const CreateSaleSchema = z.object({
  customerId: z.string(),
  branchId: z.string(),
  currency: z.nativeEnum(Currency).default(Currency.ARS),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })),
});

// Filter and query types
export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface SaleFilters extends BaseFilters, DateRangeFilter {
  customerId?: string;
  sellerId?: string;
  branchId?: string;
  status?: SaleStatus;
  currency?: Currency;
}

export interface ProductFilters extends BaseFilters {
  category?: string;
  brand?: string;
  active?: boolean;
  lowStock?: boolean;
}

export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type CreateCustomerRequest = z.infer<typeof CreateCustomerSchema>;
export type CreateProductRequest = z.infer<typeof CreateProductSchema>;
export type CreateSaleRequest = z.infer<typeof CreateSaleSchema>;