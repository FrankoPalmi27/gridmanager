import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'https://gridmanager-production.up.railway.app/api/v1';

const getTenantSlugFromLocation = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const segments = window.location.pathname.split('/').filter(Boolean);
  const empresaIndex = segments.indexOf('empresa');
  if (empresaIndex !== -1 && segments[empresaIndex + 1]) {
    return segments[empresaIndex + 1];
  }

  return null;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const { tokens, tenant } = useAuthStore.getState();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  const tenantSlug = tenant?.slug ?? getTenantSlugFromLocation();
  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
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

      if (tokens?.refreshToken && tokens.refreshToken !== 'mock-refresh-token') {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });

          const newTokens = response.data.data.tokens;
          updateTokens(newTokens);

          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Don't redirect automatically - let the app handle it
          clearAuth();
          console.error('Token refresh failed:', refreshError);
          return Promise.reject(refreshError);
        }
      } else {
        // Don't redirect automatically for mock tokens or missing refresh token
        console.warn('No valid refresh token available');
        return Promise.reject(error);
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

  delete: (id: string) =>
    api.delete(`/suppliers/${id}`),
    
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

  delete: (id: string) =>
    api.delete(`/products/${id}`),
    
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

  create: async (data: any) => {
    // Transform frontend Sale format to backend CreateSaleSchema format

    // Obtener el primer branch del tenant si no hay branchId
    let branchId = data.branchId;
    if (!branchId) {
      try {
        // Intentar obtener branches del tenant
        const branchesResponse = await api.get('/branches', { params: { limit: 1 } });
        const branches = branchesResponse.data?.data?.data || branchesResponse.data?.data || [];
        if (branches.length > 0) {
          branchId = branches[0].id;
        }
      } catch (error) {
        console.warn('[salesApi] No se pudo obtener branch, la venta se guardará solo localmente');
        // Si no hay branches, lanzar error para que se guarde solo localmente
        throw new Error('No hay sucursales disponibles. La venta se guardará localmente.');
      }
    }

    const backendData = {
      customerId: data.customerId || data.client?.id,
      branchId,
      currency: 'ARS',
      notes: data.notes || `Venta ${data.number || ''} - ${data.client?.name || ''}`.trim(),
      items: data.items && Array.isArray(data.items)
        ? data.items
        : [{
            productId: data.productId,
            quantity: typeof data.items === 'number' ? data.items : data.quantity || 1,
            unitPrice: data.price || (data.amount / (typeof data.items === 'number' ? data.items : 1)),
          }],
    };
    return api.post('/sales', backendData);
  },

  update: (id: number | string, data: any) =>
    api.put(`/sales/${id}`, data),

  delete: (id: number | string) =>
    api.delete(`/sales/${id}`),

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

  create: (data: any) => {
    // Transform frontend data to backend format
    const backendData = {
      name: data.name,
      type: data.accountType || 'BANK', // accountType → type
      accountNumber: data.accountNumber || null,
      currentBalance: data.balance || 0, // balance → currentBalance
      currency: data.currency || 'ARS',
      active: data.active !== undefined ? data.active : true,
    };
    return api.post('/accounts', backendData);
  },

  update: (id: string, data: any) => {
    // Transform frontend data to backend format
    const backendData: any = {};
    if (data.name !== undefined) backendData.name = data.name;
    if (data.accountType !== undefined) backendData.type = data.accountType;
    if (data.accountNumber !== undefined) backendData.accountNumber = data.accountNumber;
    if (data.balance !== undefined) backendData.currentBalance = data.balance;
    if (data.currency !== undefined) backendData.currency = data.currency;
    if (data.active !== undefined) backendData.active = data.active;

    return api.put(`/accounts/${id}`, backendData);
  },

  delete: (id: string) =>
    api.delete(`/accounts/${id}`),
    
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

export const systemConfigApi = {
  get: () => api.get('/settings/system'),
  update: (data: any) => api.put('/settings/system', data),
};