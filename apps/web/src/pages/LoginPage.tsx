import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Inline types for deployment
const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const RegisterSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  tenantName: z.string().min(2, 'El nombre de la empresa debe tener al menos 2 caracteres'),
});

type LoginRequest = z.infer<typeof LoginSchema>;
type RegisterRequest = z.infer<typeof RegisterSchema>;

import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { GoogleLoginButton } from '@/components/ui/GoogleLoginButton';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const loginForm = useForm<LoginRequest>({
    resolver: zodResolver(LoginSchema),
  });

  const registerForm = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterSchema),
  });

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
    navigate('/');
  };

  const onLoginSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login(data.email, data.password);
      const { user, tokens } = response.data.data;

      setAuth(user, tokens);

      // Redirect to dashboard after successful login (simple route)
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('🔐 Login error:', err);
      console.error('🔐 Error response:', err.response);
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError('');

    try {
  const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'https://gridmanager-production.up.railway.app/api/v1';

      // Usar axios directamente para evitar interceptores de autenticación
      const response = await axios.post(`${API_BASE_URL}/auth/register-tenant`, {
        email: data.email,
        name: data.name,
        password: data.password,
        tenantName: data.tenantName,
      });

      const { user, tokens } = response.data.data;

      setAuth(user, tokens);

      // Redirect to dashboard after successful registration
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('🔐 Registration error:', err);
      console.error('🔐 Error response:', err.response);
      setError(err.response?.data?.error || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Grid Manager - Sistema de Gestión Empresarial
          </p>
        </div>

        {/* Tabs para Login/Register */}
        <div className="flex border-b border-gray-300">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 text-center font-medium transition-colors ${
              mode === 'login'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 text-center font-medium transition-colors ${
              mode === 'register'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {mode === 'login' ? (
          <form className="mt-8 space-y-6" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="label">
                Correo electrónico
              </label>
              <input
                {...loginForm.register('email')}
                id="login-email"
                type="email"
                className={`input ${loginForm.formState.errors.email ? 'input-error' : ''}`}
                placeholder="admin@gridmanager.com"
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-sm text-error-600">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="label">
                Contraseña
              </label>
              <input
                {...loginForm.register('password')}
                id="login-password"
                type="password"
                className={`input ${loginForm.formState.errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-sm text-error-600">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full justify-center"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="register-name" className="label">
                Nombre completo
              </label>
              <input
                {...registerForm.register('name')}
                id="register-name"
                type="text"
                className={`input ${registerForm.formState.errors.name ? 'input-error' : ''}`}
                placeholder="Juan Pérez"
              />
              {registerForm.formState.errors.name && (
                <p className="mt-1 text-sm text-error-600">{registerForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-tenantName" className="label">
                Nombre de la empresa
              </label>
              <input
                {...registerForm.register('tenantName')}
                id="register-tenantName"
                type="text"
                className={`input ${registerForm.formState.errors.tenantName ? 'input-error' : ''}`}
                placeholder="Mi Empresa S.A."
              />
              {registerForm.formState.errors.tenantName && (
                <p className="mt-1 text-sm text-error-600">{registerForm.formState.errors.tenantName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-email" className="label">
                Correo electrónico
              </label>
              <input
                {...registerForm.register('email')}
                id="register-email"
                type="email"
                className={`input ${registerForm.formState.errors.email ? 'input-error' : ''}`}
                placeholder="admin@miempresa.com"
              />
              {registerForm.formState.errors.email && (
                <p className="mt-1 text-sm text-error-600">{registerForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-password" className="label">
                Contraseña
              </label>
              <input
                {...registerForm.register('password')}
                id="register-password"
                type="password"
                className={`input ${registerForm.formState.errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              {registerForm.formState.errors.password && (
                <p className="mt-1 text-sm text-error-600">{registerForm.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full justify-center"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner mr-2" />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>
        )}

        {mode === 'login' && (
          <>
            {/* Separador */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">O continúa con</span>
                </div>
              </div>
            </div>

            {/* Botón de Google */}
            <div className="mt-6">
              <GoogleLoginButton
                onError={(error) => setError(error)}
                disabled={isLoading}
              />
            </div>

            {/* Botón de desarrollo para saltear login */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSkipLogin}
                className="w-full flex justify-center py-2 px-4 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-800 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
              >
                🚀 Saltear Login (Testing)
              </button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Credenciales de demo:
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div><strong>Admin:</strong> admin@gridmanager.com / admin123</div>
                <div><strong>Manager:</strong> manager@gridmanager.com / manager123</div>
                <div><strong>Vendedor:</strong> vendedor1@gridmanager.com / seller123</div>
                <div><strong>Analista:</strong> analista@gridmanager.com / analyst123</div>
              </div>
            </div>
          </>
        )}

        {mode === 'register' && (
          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm font-medium text-green-900 mb-2">
              ✨ Comienza gratis
            </h3>
            <div className="text-sm text-green-700">
              <p>Crea tu cuenta y obtén 14 días de prueba gratuita con todas las funcionalidades.</p>
              <p className="mt-2">No se requiere tarjeta de crédito.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}