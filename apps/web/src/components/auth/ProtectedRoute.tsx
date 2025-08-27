import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, tokens } = useAuthStore();

  if (!user || !tokens) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}