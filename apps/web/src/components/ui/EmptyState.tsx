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
    <div className={`text-center py-12 ${className}`}>
      <div className="text-6xl mb-4 animate-bounce-soft">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2 animate-fade-in">
        {title}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
        {description}
      </p>
      {action && (
        <button 
          onClick={action.onClick}
          className="btn btn-primary inline-flex items-center gap-2 animate-scale-up ripple-effect"
          style={{ animationDelay: '200ms' }}
        >
          {action.icon && <action.icon className="h-5 w-5" />}
          {action.label}
        </button>
      )}
    </div>
  );
}