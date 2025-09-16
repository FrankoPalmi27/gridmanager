import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userStr = searchParams.get('user');

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        const tokens = { accessToken, refreshToken };

        setAuth(user, tokens);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login?error=auth_callback_failed');
      }
    } else {
      navigate('/login?error=missing_auth_data');
    }
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">
          Completando inicio de sesión...
        </h2>
        <p className="text-gray-600 mt-2">
          Por favor espera mientras procesamos tu autenticación.
        </p>
      </div>
    </div>
  );
}