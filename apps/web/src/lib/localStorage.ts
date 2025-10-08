/**
 * LocalStorage helpers were removed as part of the backend-only migration.
 * Importers should replace any dependency on this module with API-driven persistence.
 *
 * Leaving a console warning here mantiene trazabilidad cuando aún se importa este módulo
 * desde código legacy y satisface los checks de logging crítico en los scripts de validación.
 */
export function localStorageUnsupported(): never {
  const message = '[localStorage] helpers were removed. Use backend APIs instead.';

  // Logging explícito para facilitar auditorías y debug (requerido por el plan de QA Fase 5)
  console.warn(message);

  throw new Error(message);
}