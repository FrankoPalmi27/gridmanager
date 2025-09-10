import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// formatCurrency moved to formatters.ts to avoid duplication

export function formatNumber(
  value: number,
  locale: string = 'es-AR'
) {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
) {
  return new Intl.DateTimeFormat('es-AR', options).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function getStatusBadge(status: string) {
  const statusMap = {
    ACTIVE: { label: 'Activo', class: 'badge-success' },
    INACTIVE: { label: 'Inactivo', class: 'badge-gray' },
    SUSPENDED: { label: 'Suspendido', class: 'badge-error' },
    CONFIRMED: { label: 'Confirmada', class: 'badge-success' },
    PENDING: { label: 'Pendiente', class: 'badge-warning' },
    CANCELLED: { label: 'Cancelada', class: 'badge-error' },
    DRAFT: { label: 'Borrador', class: 'badge-gray' },
    RECEIVED: { label: 'Recibida', class: 'badge-success' },
    DELIVERED: { label: 'Entregada', class: 'badge-success' },
    IN_TRANSIT: { label: 'En tránsito', class: 'badge-warning' },
    COMPLETED: { label: 'Completada', class: 'badge-success' },
  };

  return statusMap[status as keyof typeof statusMap] || { 
    label: status, 
    class: 'badge-gray' 
  };
}

export function getUserRoleLabel(role: string) {
  const roleMap = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    ANALYST: 'Analista',
    SELLER: 'Vendedor',
  };

  return roleMap[role as keyof typeof roleMap] || role;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generatePagination(
  currentPage: number,
  totalPages: number,
  delta: number = 2
) {
  const range = [];
  const rangeWithDots = [];

  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }

  if (currentPage - delta > 2) {
    rangeWithDots.push(1, '...');
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push('...', totalPages);
  } else {
    rangeWithDots.push(totalPages);
  }

  return rangeWithDots;
}

export function downloadCSV(data: any[], filename: string) {
  const csvContent = convertToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvArray = [];

  // Add headers
  csvArray.push(headers.join(','));

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvArray.push(values.join(','));
  });

  return csvArray.join('\n');
}