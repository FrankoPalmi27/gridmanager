import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSystemConfigStore, DEFAULT_SYSTEM_CONFIG, type SystemConfig } from '@/store/systemConfigStore';

const currencyOptions = [
  { label: 'Peso Argentino (ARS)', value: 'ARS' },
  { label: 'Dólar Estadounidense (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
];

const dateFormatOptions = [
  { label: 'DD/MM/YYYY (Argentina)', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY (USA)', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD (ISO)', value: 'YYYY-MM-DD' },
];

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

export function SystemSettingsPage(): JSX.Element {
  const {
    config,
    isLoading,
    error,
    hasLoaded,
    loadConfig,
    updateConfig,
    resetConfig,
  } = useSystemConfigStore();

  const [formState, setFormState] = useState<SystemConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      void loadConfig();
    }
  }, [hasLoaded, isLoading, loadConfig]);

  useEffect(() => {
    setFormState(config);
  }, [config]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const pendingChanges = useMemo(() => {
    return JSON.stringify(formState) !== JSON.stringify(config);
  }, [config, formState]);

  const handleNumericChange = (key: keyof Pick<SystemConfig, 'stockWarningThreshold' | 'maxStockAlerts'>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      setFormState((prev) => ({
        ...prev,
        [key]: Number.isNaN(value) ? prev[key] : value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      await updateConfig(formState);
      setFeedback({ type: 'success', message: 'Configuración actualizada correctamente.' });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'No se pudo guardar la configuración.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      await resetConfig();
      setFeedback({ type: 'success', message: 'Configuración restablecida a los valores por defecto.' });
    } catch (resetError) {
      const message = resetError instanceof Error ? resetError.message : 'No se pudo restablecer la configuración.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSaving(false);
    }
  };

  const showSkeleton = isLoading && !hasLoaded;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">Configuración del sistema</h1>
        <p className="text-sm text-gray-600 max-w-2xl">
          Define parámetros globales que impactan el inventario, la facturación y los procesos automáticos de Grid Manager.
        </p>
      </header>

      {(error || feedback) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback?.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback?.message ?? error}
        </div>
      )}

      <form className="space-y-10" onSubmit={handleSubmit}>
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Inventario</h2>
          <p className="mt-1 text-sm text-gray-600">
            Controla cómo responder ante faltantes de stock y define alertas tempranas.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formState.allowNegativeStock}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, allowNegativeStock: event.target.checked }))
                  }
                  disabled={isSaving || showSkeleton}
                />
                <span className="text-sm font-medium text-gray-800">Permitir stock negativo</span>
              </label>
              <p className="text-sm text-gray-500">
                Cuando está activo, se registran ventas aunque el inventario quede en negativo. Si está desactivado, se bloquean operaciones cuando no hay stock.
              </p>
            </div>

            <Input
              type="number"
              label="Umbral de alerta de stock (%)"
              value={formState.stockWarningThreshold.toString()}
              min={0}
              max={1000}
              step={5}
              onChange={handleNumericChange('stockWarningThreshold')}
              disabled={isSaving || showSkeleton}
              helperText="Cuando el stock sea menor a minStock x este porcentaje, se mostrará una alerta."
            />

            <Input
              type="number"
              label="Máximo de alertas simultáneas"
              value={formState.maxStockAlerts.toString()}
              min={0}
              max={10000}
              step={1}
              onChange={handleNumericChange('maxStockAlerts')}
              disabled={isSaving || showSkeleton}
              helperText="Limita cuántos productos se muestran en la bandeja de alertas para evitar saturar la vista."
            />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Finanzas y formatos</h2>
          <p className="mt-1 text-sm text-gray-600">
            Ajustes generales para reportes, exportaciones y resúmenes financieros.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="currency-select">
                Moneda por defecto
              </label>
              <select
                id="currency-select"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formState.defaultCurrency}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, defaultCurrency: event.target.value }))
                }
                disabled={isSaving || showSkeleton}
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500">
                Se usa como moneda base para reportes y cálculos financieros cuando no se especifica otra.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="date-format-select">
                Formato de fecha
              </label>
              <select
                id="date-format-select"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formState.dateFormat}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, dateFormat: event.target.value }))
                }
                disabled={isSaving || showSkeleton}
              >
                {dateFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500">
                Se utiliza para documentos, exportaciones y reportes que generen fechas legibles para el equipo.
              </p>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formState.autoBackup}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, autoBackup: event.target.checked }))
                }
                disabled={isSaving || showSkeleton}
              />
              <div>
                <p className="text-sm font-medium text-gray-800">Habilitar auto-backup</p>
                <p className="text-sm text-gray-500">
                  Genera copias automáticas de seguridad en horarios de menor demanda para evitar pérdidas de información.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formState.enableAuditLog}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, enableAuditLog: event.target.checked }))
                }
                disabled={isSaving || showSkeleton}
              />
              <div>
                <p className="text-sm font-medium text-gray-800">Registrar auditoría</p>
                <p className="text-sm text-gray-500">
                  Mantiene un historial detallado de cambios críticos para cumplir con requerimientos contables y regulatorios.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formState.debugMode}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, debugMode: event.target.checked }))
                }
                disabled={isSaving || showSkeleton}
              />
              <div>
                <p className="text-sm font-medium text-gray-800">Modo diagnóstico</p>
                <p className="text-sm text-gray-500">
                  Activa registros adicionales en consola para seguimiento técnico. Recomendado solo para troubleshooting.</p>
              </div>
            </label>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            {showSkeleton ? 'Cargando configuración...' : `Valores por defecto: ${DEFAULT_SYSTEM_CONFIG.stockWarningThreshold}% de umbral, moneda ${DEFAULT_SYSTEM_CONFIG.defaultCurrency}.`}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSaving || showSkeleton}
            >
              Restablecer valores
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSaving}
              disabled={!pendingChanges || isSaving || showSkeleton}
            >
              Guardar cambios
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}

export default SystemSettingsPage;
