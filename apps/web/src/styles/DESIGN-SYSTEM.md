# 🎨 Grid Manager - Sistema de Diseño

## 📋 Resumen Ejecutivo

Sistema de tokens de diseño para Grid Manager, definiendo variables CSS para una identidad visual moderna y consistente.

**Estado**: ✅ Variables definidas - **NO aplicadas aún**
**Versión**: 1.0.0
**Archivo**: `src/styles/design-tokens.css`

---

## 🎯 Filosofía de Diseño

### Principios Core
- **Simplicidad**: Paleta limitada y consistente
- **Profesionalismo**: Colores serios para entorno empresarial
- **Accesibilidad**: Contrastes adecuados (WCAG AA)
- **Escalabilidad**: Sistema modular y extensible

---

## 🎨 Paleta de Colores

### 🔵 Primary - Azul Profundo
```css
/* Color principal para acciones importantes */
--primary-500: #3b82f6  /* Base */
--primary-600: #2563eb  /* Hover */
--primary-700: #1d4ed8  /* Active */
```
**Uso**: Botones principales, links, elementos de navegación activos

### 🟢 Secondary - Verde Suave
```css
/* Color secundario para indicadores positivos */
--secondary-500: #22c55e  /* Base */
--secondary-600: #16a34a  /* Hover */
--secondary-700: #15803d  /* Active */
```
**Uso**: Estados de éxito, confirmaciones, indicadores positivos

### ⚫ Neutral - Grises Modernos
```css
/* Escala completa de grises */
--neutral-0: #ffffff    /* Fondo principal */
--neutral-50: #f8fafc   /* Fondo muy claro */
--neutral-100: #f1f5f9  /* Fondo claro */
--neutral-200: #e2e8f0  /* Bordes suaves */
--neutral-300: #cbd5e1  /* Bordes */
--neutral-500: #64748b  /* Texto medio */
--neutral-700: #334155  /* Texto principal */
--neutral-900: #0f172a  /* Texto oscuro */
```

### 🚦 Colores Semánticos
- **Success**: `--success-500: #10b981` (Verde esmeralda)
- **Warning**: `--warning-500: #f59e0b` (Ámbar)
- **Error**: `--error-500: #ef4444` (Rojo)
- **Info**: `--info-500: #3b82f6` (Azul info)

---

## 📝 Tipografía

### 🔤 Familias de Fuentes
```css
--font-primary: 'Inter', system-ui, sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', monospace
```

### 📏 Escala Tipográfica
```css
--font-size-xs: 0.75rem     /* 12px - Badges, labels */
--font-size-sm: 0.875rem    /* 14px - Texto secundario */
--font-size-base: 1rem      /* 16px - Texto principal */
--font-size-lg: 1.125rem    /* 18px - Subtítulos */
--font-size-xl: 1.25rem     /* 20px - Títulos de sección */
--font-size-2xl: 1.5rem     /* 24px - Títulos principales */
--font-size-3xl: 1.875rem   /* 30px - Títulos destacados */
```

### ⚖️ Pesos de Fuente
```css
--font-weight-normal: 400   /* Texto regular */
--font-weight-medium: 500   /* Texto medio */
--font-weight-semibold: 600 /* Subtítulos */
--font-weight-bold: 700     /* Títulos */
```

---

## 📐 Espaciado

### 📏 Escala de Espaciado
Basada en múltiplos de 4px para consistencia visual:

```css
--spacing-1: 0.25rem   /* 4px */
--spacing-2: 0.5rem    /* 8px */
--spacing-3: 0.75rem   /* 12px */
--spacing-4: 1rem      /* 16px */
--spacing-6: 1.5rem    /* 24px */
--spacing-8: 2rem      /* 32px */
--spacing-12: 3rem     /* 48px */
--spacing-16: 4rem     /* 64px */
```

### 🏗️ Espaciado Semántico
```css
--space-content: var(--spacing-4)    /* Padding interno */
--space-element: var(--spacing-8)    /* Entre elementos */
--space-component: var(--spacing-16) /* Entre componentes */
--space-section: var(--spacing-24)   /* Entre secciones */
```

---

## 🔘 Bordes y Redondeo

### 📐 Radio de Bordes
```css
--radius-sm: 0.125rem      /* 2px - Elementos pequeños */
--radius-md: 0.375rem      /* 6px - Inputs */
--radius-lg: 0.5rem        /* 8px - Botones */
--radius-xl: 0.75rem       /* 12px - Cards */
--radius-2xl: 1rem         /* 16px - Modales */
--radius-full: 9999px      /* Badges, avatars */
```

### 🎯 Uso Semántico
```css
--radius-button: var(--radius-lg)
--radius-card: var(--radius-xl)
--radius-input: var(--radius-md)
--radius-badge: var(--radius-full)
```

---

## 🌟 Sombras

### 💫 Niveles de Elevación
```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05)         /* Sutil */
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1)          /* Cards */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)       /* Botones hover */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)     /* Dropdowns */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)     /* Modales */
```

### 🎯 Uso Semántico
```css
--shadow-card: var(--shadow-sm)
--shadow-button: var(--shadow-xs)
--shadow-button-hover: var(--shadow-md)
--shadow-dropdown: var(--shadow-lg)
--shadow-modal: var(--shadow-xl)
```

---

## ⚡ Transiciones

### ⏱️ Duraciones
```css
--duration-fast: 150ms     /* Micro-interacciones */
--duration-normal: 200ms   /* Hover, focus */
--duration-slow: 300ms     /* Transiciones complejas */
```

### 🎭 Funciones de Tiempo
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)  /* Suave y natural */
--ease-out: cubic-bezier(0, 0, 0.2, 1)       /* Inicio rápido */
```

### 🔄 Transiciones Comunes
```css
--transition-colors: color 200ms ease-in-out, background-color 200ms ease-in-out
--transition-shadow: box-shadow 200ms ease-in-out
--transition-transform: transform 200ms ease-in-out
```

---

## 📱 Breakpoints

### 📐 Puntos de Quiebre
```css
--breakpoint-sm: 640px    /* Tablet pequeño */
--breakpoint-md: 768px    /* Tablet */
--breakpoint-lg: 1024px   /* Desktop */
--breakpoint-xl: 1280px   /* Desktop grande */
```

---

## 📋 Convenciones de Nomenclatura

### 🏷️ Estructura de Variables
```
--{categoria}-{subcategoria}-{modificador}
```

### 📝 Ejemplos
```css
/* Colores */
--primary-500        /* Color base */
--primary-600        /* Variante hover */
--neutral-50         /* Tono más claro */

/* Espaciado */
--spacing-4          /* Tamaño base */
--space-content      /* Uso semántico */

/* Tipografía */
--font-size-lg       /* Tamaño */
--font-weight-bold   /* Peso */

/* Efectos */
--shadow-md          /* Nivel medio */
--radius-lg          /* Redondeo grande */
```

---

## 🚀 Guía de Uso

### ✅ Implementación Recomendada

1. **Import del archivo**:
```css
@import './styles/design-tokens.css';
```

2. **Uso en componentes**:
```css
.button-primary {
  background-color: var(--primary-500);
  color: var(--neutral-0);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-button);
  box-shadow: var(--shadow-button);
  transition: var(--transition-colors);
}

.button-primary:hover {
  background-color: var(--primary-600);
  box-shadow: var(--shadow-button-hover);
}
```

3. **Configuración Tailwind** (futuro):
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          // ...
        }
      }
    }
  }
}
```

### ⚠️ Importante

- **NO aplicar aún** a componentes existentes
- **Mantener** clases actuales funcionando
- **Testear** variables en elementos aislados primero
- **Migrar gradualmente** por componente

---

## 🔧 Herramientas de Desarrollo

### 🐛 Debugging
```css
/* Clase para inspeccionar variables en DevTools */
.debug-tokens {
  --debug-primary: var(--primary-500);
  --debug-spacing: var(--spacing-4);
  /* ... todas las variables para inspección */
}
```

### 📊 Validación
- Usar DevTools para verificar valores
- Contrastar colores con herramientas de accesibilidad
- Probar en diferentes tamaños de pantalla

---

## 📈 Roadmap

### 🎯 Fase 1: Variables (Completado)
- ✅ Definir tokens de diseño
- ✅ Documentar sistema
- ✅ Crear guías de uso

### 🎯 Fase 2: Implementación (Próximo)
- 🔄 Actualizar Tailwind config
- 🔄 Migrar componentes core
- 🔄 Testear compatibilidad

### 🎯 Fase 3: Refinamiento
- 🔄 Modo oscuro
- 🔄 Animaciones avanzadas
- 🔄 Tokens específicos por componente

---

## 📞 Soporte

Para dudas sobre el sistema de diseño:
1. Revisar esta documentación
2. Inspeccionar variables en `design-tokens.css`
3. Consultar ejemplos de uso
4. Verificar en DevTools

---

**Última actualización**: 2025-09-23
**Próxima revisión**: Al implementar en componentes