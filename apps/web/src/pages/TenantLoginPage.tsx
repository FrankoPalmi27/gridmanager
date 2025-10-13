import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { GoogleLoginButton } from '../components/ui/GoogleLoginButton';
import { useAuthStore } from '../store/authStore';

interface LoginForm {
  email: string;
  password: string;
  tenantSlug: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    tenant: {
      id: string;
      name: string;
      slug: string;
      plan: string;
      status: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  error?: string;
}

export function TenantLoginPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { setAuth, setTenant } = useAuthStore();
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    tenantSlug: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || 'https://gridmanager-production.up.railway.app/api';
  const response = await fetch(`${apiBaseUrl}/tenant/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.data) {
        // Use the auth store to set authentication state
  const { setAuth, setTenant } = useAuthStore.getState();
  setAuth(data.data.user, data.data.tokens);
  setTenant(data.data.tenant);

        // Navigate to dashboard using the onNavigate function
        onNavigate('dashboard');
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      setError('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Función para saltear login (solo para testing)
  const handleSkipLogin = () => {
    // Crear usuario mock para testing
    const mockUser = {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Usuario Test',
      role: 'ADMIN',
      tenantId: 'test-tenant'
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    };

  setAuth(mockUser, mockTokens);
  setTenant(null);
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3"></div>
            <span className="text-2xl font-bold text-gray-900">Grid Manager</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h1>
          <p className="text-gray-600">Accede a tu cuenta empresarial</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug de la Empresa *
            </label>
            <input
              type="text"
              name="tenantSlug"
              value={form.tenantSlug}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="mi-empresa"
            />
            <p className="text-xs text-gray-500 mt-1">
              El slug aparece en la URL de tu empresa: /empresa/mi-empresa
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin@miempresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña *
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        {/* Separador */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>
        </div>

        {/* Botón de Google */}
        <div className="mt-6">
          <GoogleLoginButton
            onError={(error) => setError(error)}
            disabled={loading}
          />
        </div>

        {/* Botón de desarrollo para saltear login */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleSkipLogin}
            className="w-full flex justify-center py-2 px-4 border border-yellow-300 rounded-lg shadow-sm text-sm font-medium text-yellow-800 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            🚀 Saltear Login (Testing)
          </button>
        </div>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/register');
                onNavigate('tenant-register');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear cuenta gratis
            </button>
          </p>

          <button
            onClick={() => {
              window.history.pushState({}, '', '/');
              onNavigate('home');
            }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Volver al Inicio
          </button>
        </div>

        {/* Demo access */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🎯 Acceso Demo</h4>
          <p className="text-sm text-blue-700 mb-3">
            Prueba Grid Manager con datos de demostración:
          </p>
          <div className="space-y-1 text-xs text-blue-600 font-mono">
            <div>Empresa: <strong>mi-empresa</strong></div>
            <div>Email: <strong>admin@miempresa.com</strong></div>
            <div>Contraseña: <em>La generada en el registro</em></div>
          </div>
        </div>
      </div>
    </div>
  );
}