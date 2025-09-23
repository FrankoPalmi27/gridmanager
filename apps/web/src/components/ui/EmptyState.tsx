import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  className?: string;
}

export function EmptyState({
  icon = '📄',
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      <div
        className="text-6xl mb-4 pulse-gentle"
        style={{
          fontSize: '3rem',
          marginBottom: 'var(--spacing-4)'
        }}
      >
        {icon}
      </div>
      <h3 className="empty-state-title fade-in">
        {title}
      </h3>
      <p
        className="empty-state-description slide-in-up"
        style={{ animationDelay: '100ms' }}
      >
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary inline-flex items-center gap-2 hover-lift slide-in-up"
          style={{
            animationDelay: '200ms',
            marginTop: 'var(--spacing-6)',
            gap: 'var(--spacing-2)'
          }}
        >
          {action.icon && <action.icon className="h-5 w-5" />}
          {action.label}
        </button>
      )}
    </div>
  );
}