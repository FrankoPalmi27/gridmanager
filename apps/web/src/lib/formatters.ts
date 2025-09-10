/**
 * Unified formatting utilities for consistent data display across the application
 */

/**
 * Format currency amounts with consistent formatting
 */
export const formatCurrency = (amount: number, currency: string = 'ARS', locale: string = 'es-AR'): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    const symbol = currency === 'USD' ? '$' : '$';
    return `${symbol}${amount.toLocaleString('es-AR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
};

/**
 * Format currency amounts for display (simplified version)
 */
export const formatAmount = (amount: number): string => {
  return `$${amount.toLocaleString('es-AR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

/**
 * Format dates with consistent formatting across the application
 */
export const formatDate = (date: Date | string, format: 'short' | 'medium' | 'long' = 'short', locale: string = 'es-AR'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  const options: Intl.DateTimeFormatOptions = {
    short: { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    },
    medium: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    },
    long: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    }
  }[format];

  try {
    return dateObj.toLocaleDateString(locale, options);
  } catch (error) {
    // Fallback formatting
    return dateObj.toLocaleDateString();
  }
};

/**
 * Format dates for input fields (YYYY-MM-DD format)
 */
export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toISOString().split('T')[0];
};

/**
 * Format date with time
 */
export const formatDateTime = (date: Date | string, locale: string = 'es-AR'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  try {
    return dateObj.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateObj.toLocaleString();
  }
};

/**
 * Format numbers with consistent formatting
 */
export const formatNumber = (number: number, decimals: number = 0, locale: string = 'es-AR'): string => {
  try {
    return number.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    return number.toFixed(decimals);
  }
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format phone numbers (Argentina format)
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Argentina phone number formatting
  if (cleaned.length === 10) {
    // Format: (011) 1234-5678
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('54')) {
    // International format with country code
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
  }
  
  // Return original if doesn't match expected format
  return phone;
};

/**
 * Format tax ID (CUIT/CUIL format for Argentina)
 */
export const formatTaxId = (taxId: string): string => {
  // Remove all non-digits
  const cleaned = taxId.replace(/\D/g, '');
  
  // CUIT/CUIL format: 20-12345678-9
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
  }
  
  // Return original if doesn't match expected format
  return taxId;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate initials from a name
 */
export const generateInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Format status text for display
 */
export const formatStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
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
  };

  return statusMap[status.toLowerCase()] || status;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format business hours
 */
export const formatBusinessHours = (startTime: string, endTime: string): string => {
  return `${startTime} - ${endTime}`;
};

/**
 * Format duration (in minutes) to human readable format
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};