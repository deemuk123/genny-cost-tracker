import { ReactNode } from 'react';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { canAccess } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  feature: 'dashboard' | 'generators' | 'hours' | 'purchase' | 'issue' | 'stock' | 'reports';
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, feature, fallback }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h2>
        <p className="text-muted-foreground">Please log in to access this feature.</p>
      </div>
    );
  }

  if (!canAccess(user.role, feature)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to access this feature.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Your role: <span className="font-medium capitalize">{user.role}</span>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for checking permissions in components
export function usePermission(feature: 'dashboard' | 'generators' | 'hours' | 'purchase' | 'issue' | 'stock' | 'reports') {
  const { user } = useAuth();
  return user ? canAccess(user.role, feature) : false;
}
