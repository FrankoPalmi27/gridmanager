import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function CompleteRegistrationPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenantName, setTenantName] = useState('');
  const { setAuth } = useAuthStore();

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const googleId = urlParams.get('googleId');
  const email = urlParams.get('email');
  const name = urlParams.get('name');
  const avatar = urlParams.get('avatar');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantName.trim()) {
      setError('El nombre de la empresa es requerido');
      return;
    }

    if (!googleId || !email || !name) {
      setError('Faltan datos de Google. Por favor, intenta de nuevo.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://gridmanager-production.up.railway.app/api/v1';
      const response = await fetch(`${apiUrl}/auth/google/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleId,
          email,
          name,
          avatar,
          tenantName: tenantName.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al completar el registro');
      }

      const { user, tokens } = result.data;
      setAuth(user, tokens);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al completar el registro');
    } finally {
      setIsLoading(false);
    }
  };

  if (!googleId || !email || !name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Error de autenticación
          </h2>
          <p className="text-gray-600 mb-4">
            Faltan datos de Google. Por favor, intenta iniciar sesión de nuevo.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Completa tu registro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ¡Casi terminamos! Solo necesitamos algunos datos más.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-4">
            {avatar && (
              <img
                src={avatar}
                alt={name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{name}</p>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">
              Nombre de tu empresa
            </label>
            <input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mi Empresa S.A."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Este será el nombre de tu organización en Grid Manager.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando cuenta...
              </>
            ) : (
              'Completar registro'
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => onNavigate('home')}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}