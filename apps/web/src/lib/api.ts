import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const { tokens } = useAuthStore.getState();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const { tokens, updateTokens, clearAuth } = useAuthStore.getState();
      
      if (tokens?.refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });
          
          const newTokens = response.data.data.tokens;
          updateTokens(newTokens);
          
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          clearAuth();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearAuth();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
    
  register: (data: any) =>
    api.post('/auth/register', data),
    
  me: () =>
    api.get('/auth/me'),
    
  logout: () =>
    api.post('/auth/logout'),
};

export const dashboardApi = {
  getSummary: () =>
    api.get('/dashboard/summary'),
    
  getRecentActivity: () =>
    api.get('/dashboard/recent-activity'),
};

export const customersApi = {
  getAll: (params?: any) =>
    api.get('/customers', { params }),
    
  getById: (id: string) =>
    api.get(`/customers/${id}`),
    
  create: (data: any) =>
    api.post('/customers', data),
    
  update: (id: string, data: any) =>
    api.put(`/customers/${id}`, data),
    
  getAccount: (id: string) =>
    api.get(`/customers/${id}/account`),
};

export const suppliersApi = {
  getAll: (params?: any) =>
    api.get('/suppliers', { params }),
    
  getById: (id: string) =>
    api.get(`/suppliers/${id}`),
    
  create: (data: any) =>
    api.post('/suppliers', data),
    
  update: (id: string, data: any) =>
    api.put(`/suppliers/${id}`, data),
    
  getAccount: (id: string) =>
    api.get(`/suppliers/${id}/account`),
};

export const productsApi = {
  getAll: (params?: any) =>
    api.get('/products', { params }),
    
  getById: (id: string) =>
    api.get(`/products/${id}`),
    
  create: (data: any) =>
    api.post('/products', data),
    
  update: (id: string, data: any) =>
    api.put(`/products/${id}`, data),
    
  getStockMovements: (id: string) =>
    api.get(`/products/${id}/stock-movements`),
    
  getCategories: () =>
    api.get('/products/categories'),
    
  getBrands: () =>
    api.get('/products/brands'),
};

export const salesApi = {
  getAll: (params?: any) =>
    api.get('/sales', { params }),
    
  getById: (id: string) =>
    api.get(`/sales/${id}`),
    
  create: (data: any) =>
    api.post('/sales', data),
    
  updateStatus: (id: string, status: string) =>
    api.patch(`/sales/${id}/status`, { status }),
};

export const purchasesApi = {
  getAll: (params?: any) =>
    api.get('/purchases', { params }),
    
  getById: (id: string) =>
    api.get(`/purchases/${id}`),
    
  create: (data: any) =>
    api.post('/purchases', data),
    
  updateStatus: (id: string, status: string) =>
    api.patch(`/purchases/${id}/status`, { status }),
};

export const usersApi = {
  getAll: (params?: any) =>
    api.get('/users', { params }),
    
  getById: (id: string) =>
    api.get(`/users/${id}`),
    
  update: (id: string, data: any) =>
    api.put(`/users/${id}`, data),
    
  changePassword: (id: string, data: any) =>
    api.post(`/users/${id}/change-password`, data),
};

export const accountsApi = {
  getAll: (params?: any) =>
    api.get('/accounts', { params }),
    
  getById: (id: string) =>
    api.get(`/accounts/${id}`),
    
  create: (data: any) =>
    api.post('/accounts', data),
    
  update: (id: string, data: any) =>
    api.put(`/accounts/${id}`, data),
    
  getMovements: (id: string, params?: any) =>
    api.get(`/accounts/${id}/movements`, { params }),
    
  createMovement: (id: string, data: any) =>
    api.post(`/accounts/${id}/movements`, data),
};

export const reportsApi = {
  getSales: (params?: any) =>
    api.get('/reports/sales', { params }),
    
  getCustomerAccounts: () =>
    api.get('/reports/customer-accounts'),
    
  getStock: () =>
    api.get('/reports/stock'),
    
  getFinancial: (params?: any) =>
    api.get('/reports/financial', { params }),
};