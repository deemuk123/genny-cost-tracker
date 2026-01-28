import { UserRole } from '@/hooks/useAuth';

type Feature = 'dashboard' | 'generators' | 'hours' | 'daily-report' | 'purchase' | 'issue' | 'stock' | 'reports' | 'users' | 'api-keys';

const rolePermissions: Record<UserRole, Feature[]> = {
  super_admin: ['dashboard', 'generators', 'hours', 'daily-report', 'purchase', 'issue', 'stock', 'reports', 'users', 'api-keys'],
  admin: ['dashboard', 'generators', 'hours', 'daily-report', 'purchase', 'issue', 'stock', 'reports'],
  maintenance: ['dashboard', 'hours', 'daily-report', 'issue', 'stock', 'reports'],
  operator: ['dashboard', 'hours', 'daily-report', 'issue'],
  viewer: ['dashboard', 'daily-report', 'reports'],
};

export function canAccess(role: UserRole, feature: Feature): boolean {
  return rolePermissions[role]?.includes(feature) ?? false;
}

export function getAccessibleFeatures(role: UserRole): Feature[] {
  return rolePermissions[role] ?? [];
}

export function hasAnyPermission(role: UserRole, features: Feature[]): boolean {
  return features.some(feature => canAccess(role, feature));
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin';
}
