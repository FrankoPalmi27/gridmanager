import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';

const CompleteRegistrationSchema = z.object({
  tenantName: z.string().min(2, 'El nombre de la empresa debe tener al menos 2 caracteres'),
});

type CompleteRegistrationRequest = z.infer<typeof CompleteRegistrationSchema>;

export function CompleteRegistrationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();

  const googleId = searchParams.get('googleId');
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const avatar = searchParams.get('avatar');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteRegistrationRequest>({
    resolver: zodResolver(CompleteRegistrationSchema),
  });

  const onSubmit = async (data: CompleteRegistrationRequest) => {
    if (!googleId || !email || !name) {
      setError('Faltan datos de Google. Por favor, intenta de nuevo.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
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
          tenantName: data.tenantName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al completar el registro');
      }

      const { user, tokens } = result.data;
      setAuth(user, tokens);
      navigate('/dashboard');
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
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Volver al inicio de sesión
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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="tenantName" className="label">
              Nombre de tu empresa
            </label>
            <input
              {...register('tenantName')}
              type="text"
              className={`input ${errors.tenantName ? 'input-error' : ''}`}
              placeholder="Mi Empresa S.A."
            />
            {errors.tenantName && (
              <p className="mt-1 text-sm text-error-600">{errors.tenantName.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Este será el nombre de tu organización en Grid Manager.
            </p>
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
              'Completar registro'
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}