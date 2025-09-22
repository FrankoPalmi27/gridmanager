import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function AuthCallbackPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const handleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('accessToken');
      const refreshToken = urlParams.get('refreshToken');
      const userString = urlParams.get('user');

      if (accessToken && refreshToken && userString) {
        try {
          const user = JSON.parse(userString);

          // Set authentication in store
          setAuth(user, { accessToken, refreshToken });

          // Navigate to dashboard
          onNavigate('dashboard');
        } catch (error) {
          console.error('Error parsing user data:', error);
          onNavigate('home');
        }
      } else {
        console.error('Missing authentication data in callback');
        onNavigate('home');
      }
    };

    handleCallback();
  }, [onNavigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="text-xl font-semibold text-gray-900 mt-4">
          Completando inicio de sesión...
        </h2>
        <p className="text-gray-600 mt-2">
          Por favor espera mientras procesamos tu autenticación.
        </p>
      </div>
    </div>
  );
}