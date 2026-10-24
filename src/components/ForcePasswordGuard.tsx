import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ForcePasswordGuard({ children }: { children: React.ReactNode }) {
  const { user, token, forcePasswordChange } = useAuth();
  const location = useLocation();

  // 1. Not authenticated → redirect to /signin
  if (!user && !token) {
    return <Navigate to="/signin" replace />;
  }

  // 2. Authenticated but must change password → force /change-password
  if (forcePasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // 3. Otherwise render normally
  return <>{children}</>;
}