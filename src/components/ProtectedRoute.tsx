import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { canAccess } from '@/lib/permissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  feature?: 'dashboard' | 'generators' | 'hours' | 'purchase' | 'issue' | 'stock' | 'reports' | 'users' | 'api-keys';
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, feature, fallback }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login for route-level protection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a feature is specified, check permissions
  if (feature && !canAccess(user.role, feature)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to access this feature.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Your role: <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for checking permissions in components
export function usePermission(feature: 'dashboard' | 'generators' | 'hours' | 'purchase' | 'issue' | 'stock' | 'reports' | 'users' | 'api-keys') {
  const { user } = useAuth();
  return user ? canAccess(user.role, feature) : false;
}
