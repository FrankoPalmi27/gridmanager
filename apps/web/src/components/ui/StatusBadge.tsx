import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        secondary: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        // Sales specific statuses
        completed: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        cancelled: 'bg-red-100 text-red-800',
        draft: 'bg-gray-100 text-gray-800',
        // Purchase specific statuses
        received: 'bg-green-100 text-green-800',
        ordered: 'bg-blue-100 text-blue-800',
        // User/System statuses
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        suspended: 'bg-red-100 text-red-800',
        // Financial statuses
        paid: 'bg-green-100 text-green-800',
        unpaid: 'bg-red-100 text-red-800',
        overdue: 'bg-red-100 text-red-800',
        // Stock statuses
        inStock: 'bg-green-100 text-green-800',
        lowStock: 'bg-yellow-100 text-yellow-800',
        outOfStock: 'bg-red-100 text-red-800',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  dot?: boolean;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, size, children, icon, dot = false, ...props }, ref) => {
    return (
      <span
        className={cn(statusBadgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {dot && (
          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
        )}
        {icon && !dot && (
          <span className="mr-1.5">{icon}</span>
        )}
        {children}
      </span>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

// Convenience functions for common status badges
export const SaleStatusBadge: React.FC<{ status: 'completed' | 'pending' | 'cancelled' | 'draft' }> = ({ status }) => {
  const statusLabels = {
    completed: 'Completada',
    pending: 'Pendiente', 
    cancelled: 'Cancelada',
    draft: 'Borrador',
  };

  return (
    <StatusBadge variant={status} dot>
      {statusLabels[status]}
    </StatusBadge>
  );
};

export const PurchaseStatusBadge: React.FC<{ status: 'received' | 'pending' | 'cancelled' | 'draft' | 'ordered' }> = ({ status }) => {
  const statusLabels = {
    received: 'Recibida',
    pending: 'Pendiente',
    cancelled: 'Cancelada', 
    draft: 'Borrador',
    ordered: 'Ordenada',
  };

  const variantMap = {
    received: 'success',
    pending: 'warning',
    cancelled: 'danger',
    draft: 'default',
    ordered: 'info',
  } as const;

  return (
    <StatusBadge variant={variantMap[status]} dot>
      {statusLabels[status]}
    </StatusBadge>
  );
};

export const UserStatusBadge: React.FC<{ status: 'active' | 'inactive' | 'suspended' }> = ({ status }) => {
  const statusLabels = {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
  };

  return (
    <StatusBadge variant={status} dot>
      {statusLabels[status]}
    </StatusBadge>
  );
};

export const PaymentStatusBadge: React.FC<{ status: 'paid' | 'unpaid' | 'overdue' | 'pending' }> = ({ status }) => {
  const statusLabels = {
    paid: 'Pagado',
    unpaid: 'Impago',
    overdue: 'Vencido',
    pending: 'Pendiente',
  };

  const variantMap = {
    paid: 'success',
    unpaid: 'danger', 
    overdue: 'danger',
    pending: 'warning',
  } as const;

  return (
    <StatusBadge variant={variantMap[status]} dot>
      {statusLabels[status]}
    </StatusBadge>
  );
};

export const StockStatusBadge: React.FC<{ currentStock: number; minStock: number }> = ({ currentStock, minStock }) => {
  let status: 'inStock' | 'lowStock' | 'outOfStock';
  let label: string;

  if (currentStock === 0) {
    status = 'outOfStock';
    label = 'Sin Stock';
  } else if (currentStock <= minStock) {
    status = 'lowStock';
    label = 'Stock Bajo';
  } else {
    status = 'inStock';
    label = 'Disponible';
  }

  return (
    <StatusBadge variant={status} dot>
      {label}
    </StatusBadge>
  );
};

export { StatusBadge, statusBadgeVariants };