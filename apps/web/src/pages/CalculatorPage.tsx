import React, { useState, useMemo } from 'react';
import { Input } from '../components/ui/Input';

export function CalculatorPage() {
  const [neto, setNeto] = useState(250000);
  const [comision, setComision] = useState(17);
  const [financiacion, setFinanciacion] = useState(0);
  const [promo, setPromo] = useState(10);
  const [logistica, setLogistica] = useState(2500);
  const [fijo, setFijo] = useState(0);
  const [retenciones, setRetenciones] = useState(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const calculations = useMemo(() => {
    const comisionDecimal = comision / 100;
    const financiacionDecimal = financiacion / 100;
    const promoDecimal = promo / 100;

    const denominador = (1 - promoDecimal) * (1 - comisionDecimal - financiacionDecimal);

    if (denominador <= 0) {
      return {
        isValid: false,
        error: 'Parámetros inválidos: (1 - promoción) × (1 - comisión - financiación) debe ser mayor que 0.'
      };
    }

    const precioPublicar = (neto + logistica + fijo + retenciones) / denominador;
    const precioEfectivo = precioPublicar * (1 - promoDecimal);
    const comisionMonto = precioEfectivo * comisionDecimal;
    const financiacionMonto = precioEfectivo * financiacionDecimal;
    const gastosTotal = logistica + fijo + retenciones;
    const netoCheck = precioEfectivo - comisionMonto - financiacionMonto - gastosTotal;

    return {
      isValid: true,
      precioPublicar,
      precioEfectivo,
      comisionMonto,
      financiacionMonto,
      gastosTotal,
      netoCheck
    };
  }, [neto, comision, financiacion, promo, logistica, fijo, retenciones]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Calculadora MercadoLibre</h1>
          <p className="text-gray-600">Calculadora inversa de precio para determinar el precio de publicación requerido</p>
        </div>

        {/* Calculator Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div>
              <Input
                label="Monto neto deseado (ARS)"
                type="number"
                value={neto.toString()}
                onChange={(e) => setNeto(parseFloat(e.target.value) || 0)}
                step="100"
                min="0"
              />
            </div>

            <div>
              <Input
                label="Comisión ML (%)"
                type="number"
                value={comision.toString()}
                onChange={(e) => setComision(parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Clásica 13% / Premium 17%</p>
            </div>

            <div>
              <Input
                label="Financiación/cuotas (%)"
                type="number"
                value={financiacion.toString()}
                onChange={(e) => setFinanciacion(parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                max="100"
              />
            </div>

            <div>
              <Input
                label="Promoción aplicada (%)"
                type="number"
                value={promo.toString()}
                onChange={(e) => setPromo(parseFloat(e.target.value) || 0)}
                step="0.5"
                min="0"
                max="100"
              />
            </div>

            <div>
              <Input
                label="Costo logístico/Full (ARS)"
                type="number"
                value={logistica.toString()}
                onChange={(e) => setLogistica(parseFloat(e.target.value) || 0)}
                step="100"
                min="0"
              />
            </div>

            <div>
              <Input
                label="Cargo fijo por unidad (ARS)"
                type="number"
                value={fijo.toString()}
                onChange={(e) => setFijo(parseFloat(e.target.value) || 0)}
                step="10"
                min="0"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <Input
                label="Retenciones/impuestos (ARS)"
                type="number"
                value={retenciones.toString()}
                onChange={(e) => setRetenciones(parseFloat(e.target.value) || 0)}
                step="100"
                min="0"
              />
            </div>
          </div>

          {/* Results */}
          <div className="bg-blue-50 rounded-lg p-6">
            {!calculations.isValid ? (
              <div className="text-red-600 font-medium">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {calculations.error}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Main Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-gray-600">Precio de publicación requerido</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculations.precioPublicar)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-gray-600">Precio efectivo con promoción</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(calculations.precioEfectivo)}
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="border-t border-blue-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Desglose de costos:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Comisión ML:</span>
                        <span className="font-medium">{formatCurrency(calculations.comisionMonto)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Financiación:</span>
                        <span className="font-medium">{formatCurrency(calculations.financiacionMonto)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Logística + Cargos + Retenciones:</span>
                        <span className="font-medium">{formatCurrency(calculations.gastosTotal)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-gray-200 pt-2">
                        <span className="text-gray-900">Neto resultante (verificación):</span>
                        <span className="text-green-600">{formatCurrency(calculations.netoCheck)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Formula */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Fórmula utilizada:</h4>
            <div className="text-sm text-gray-600 font-mono">
              Precio = (Neto + Logística + Fijo + Retenciones) / ((1 - Promoción) × (1 - Comisión - Financiación))
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuraciones rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setComision(13);
                setFinanciacion(0);
                setPromo(0);
                setLogistica(0);
                setFijo(0);
                setRetenciones(0);
              }}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Clásica sin promoción</div>
              <div className="text-sm text-gray-500">13% comisión, sin costos adicionales</div>
            </button>

            <button
              onClick={() => {
                setComision(17);
                setFinanciacion(0);
                setPromo(10);
                setLogistica(2500);
                setFijo(0);
                setRetenciones(0);
              }}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Premium con promoción</div>
              <div className="text-sm text-gray-500">17% comisión, 10% promo, Full</div>
            </button>

            <button
              onClick={() => {
                setComision(17);
                setFinanciacion(8);
                setPromo(15);
                setLogistica(2500);
                setFijo(300);
                setRetenciones(5000);
              }}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Escenario completo</div>
              <div className="text-sm text-gray-500">Todos los costos y comisiones incluidos</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}