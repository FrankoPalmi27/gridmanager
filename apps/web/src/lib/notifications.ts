/**
 * Sistema de notificaciones simple para feedback visual
 * Usando solo CSS y manipulación DOM directa
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number; // en milisegundos
}

class NotificationManager {
  private container: HTMLDivElement | null = null;
  private notifications: Map<string, HTMLDivElement> = new Map();

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        z-index: var(--z-toast);
        padding: var(--spacing-6);
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  }

  show(options: NotificationOptions): string {
    this.ensureContainer();

    const id = Date.now().toString();
    const notification = document.createElement('div');

    notification.className = `notification notification-${options.type} slide-in-down`;
    notification.style.cssText = `
      margin-bottom: var(--spacing-3);
      pointer-events: auto;
      cursor: pointer;
    `;

    const icon = this.getIcon(options.type);
    const title = options.title ? `<div style="font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-1);">${options.title}</div>` : '';

    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: var(--spacing-3);">
        <div style="flex-shrink: 0;">${icon}</div>
        <div style="flex: 1;">
          ${title}
          <div style="font-size: var(--font-size-sm);">${options.message}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-1);
          color: currentColor;
          opacity: 0.7;
          flex-shrink: 0;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    // Auto-remove después del tiempo especificado
    const duration = options.duration || 5000;
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOutUp 0.3s ease-in forwards';
        setTimeout(() => {
          notification.remove();
          this.notifications.delete(id);
        }, 300);
      }
    }, duration);

    // Agregar al contenedor
    this.container!.appendChild(notification);
    this.notifications.set(id, notification);

    return id;
  }

  private getIcon(type: NotificationType): string {
    const iconStyle = `font-size: 20px; display: flex; align-items: center; justify-content: center;`;

    switch (type) {
      case 'success':
        return `<span style="${iconStyle} color: var(--success-600);">
          <svg viewBox="64 64 896 896" focusable="false" data-icon="check-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"></path>
          </svg>
        </span>`;
      case 'error':
        return `<span style="${iconStyle} color: var(--error-600);">
          <svg viewBox="64 64 896 896" focusable="false" data-icon="close-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 01-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"></path>
          </svg>
        </span>`;
      case 'warning':
        return `<span style="${iconStyle} color: var(--warning-600);">
          <svg viewBox="64 64 896 896" focusable="false" data-icon="exclamation-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-32 232c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V296zm32 440a48.01 48.01 0 010-96 48.01 48.01 0 010 96z"></path>
          </svg>
        </span>`;
      case 'info':
        return `<span style="${iconStyle} color: var(--info-600);">
          <svg viewBox="64 64 896 896" focusable="false" data-icon="info-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm32 664c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V456c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272zm-32-344a48.01 48.01 0 010-96 48.01 48.01 0 010 96z"></path>
          </svg>
        </span>`;
    }
  }

  remove(id: string) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.remove();
      this.notifications.delete(id);
    }
  }

  clear() {
    this.notifications.forEach(notification => notification.remove());
    this.notifications.clear();
  }
}

// Keyframe adicional para salida
const slideOutUpKeyframes = `
@keyframes slideOutUp {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}
`;

// Inyectar keyframes si no existen
if (!document.querySelector('#notification-keyframes')) {
  const style = document.createElement('style');
  style.id = 'notification-keyframes';
  style.textContent = slideOutUpKeyframes;
  document.head.appendChild(style);
}

// Instancia global
export const notifications = new NotificationManager();

// Funciones de conveniencia
export const showSuccess = (message: string, title?: string) =>
  notifications.show({ type: 'success', message, title });

export const showError = (message: string, title?: string) =>
  notifications.show({ type: 'error', message, title });

export const showWarning = (message: string, title?: string) =>
  notifications.show({ type: 'warning', message, title });

export const showInfo = (message: string, title?: string) =>
  notifications.show({ type: 'info', message, title });