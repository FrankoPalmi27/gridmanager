import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Inline types for deployment
const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginRequest = z.infer<typeof LoginSchema>;
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { GoogleLoginButton } from '@/components/ui/GoogleLoginButton';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login(data.email, data.password);
      const { user, tokens } = response.data.data;
      setAuth(user, tokens);

      // Redirect to dashboard after successful login (simple route)
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Grid Manager - Sistema de Gestión Empresarial
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">
              Correo electrónico
            </label>
            <input
              {...register('email')}
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="admin@gridmanager.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <input
              {...register('password')}
              type="password"
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
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
      </div>
    </div>
  );
}