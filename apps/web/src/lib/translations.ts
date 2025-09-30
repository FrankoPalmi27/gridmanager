/**
 * Centralized translations and string mappings
 * Used across the application for consistent labeling
 */

export const TRANSLATIONS = {
  salesChannel: {
    store: 'Tienda física',
    online: 'Online',
    phone: 'Teléfono',
    whatsapp: 'WhatsApp',
    other: 'Otro',
  },
  paymentMethod: {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
    check: 'Cheque',
    other: 'Otro',
  },
  paymentStatus: {
    paid: 'Pagado',
    unpaid: 'Impago',
    pending: 'Pendiente',
    partial: 'Parcial',
  },
  saleStatus: {
    completed: 'Completada',
    pending: 'Pendiente',
    cancelled: 'Cancelada',
    draft: 'Borrador',
  },
  purchaseStatus: {
    received: 'Recibida',
    pending: 'Pendiente',
    cancelled: 'Cancelada',
    draft: 'Borrador',
    ordered: 'Ordenada',
    confirmed: 'Confirmada',
  },
  userStatus: {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
  },
  status: {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
    pending: 'Pendiente',
    completed: 'Completado',
    cancelled: 'Cancelado',
    draft: 'Borrador',
    confirmed: 'Confirmado',
    paid: 'Pagado',
    unpaid: 'Impago',
    overdue: 'Vencido',
    received: 'Recibido',
    ordered: 'Ordenado',
  },
  userRole: {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    ANALYST: 'Analista',
    SELLER: 'Vendedor',
  },
  stockStatus: {
    inStock: 'En Stock',
    lowStock: 'Stock Bajo',
    outOfStock: 'Sin Stock',
  },
} as const;

/**
 * Generic translation function with type safety
 */
export function translate<T extends keyof typeof TRANSLATIONS>(
  category: T,
  key: string,
  defaultValue?: string
): string {
  const translations = TRANSLATIONS[category] as Record<string, string>;
  return translations[key] || defaultValue || key;
}

/**
 * Specific translation helpers for common use cases
 */
export const translateSalesChannel = (channel?: string): string => {
  if (!channel) return 'No especificado';
  return translate('salesChannel', channel, 'No especificado');
};

export const translatePaymentMethod = (method?: string): string => {
  if (!method) return 'No especificado';
  return translate('paymentMethod', method, 'No especificado');
};

export const translatePaymentStatus = (status?: string): string => {
  if (!status) return 'No especificado';
  return translate('paymentStatus', status, 'No especificado');
};

export const translateSaleStatus = (status: string): string => {
  return translate('saleStatus', status, status);
};

export const translatePurchaseStatus = (status: string): string => {
  return translate('purchaseStatus', status, status);
};

export const translateUserStatus = (status: string): string => {
  return translate('userStatus', status, status);
};

export const translateUserRole = (role: string): string => {
  return translate('userRole', role, role);
};

export const translateStatus = (status: string): string => {
  return translate('status', status, status);
};
