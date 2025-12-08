import { UserRole } from '@/hooks/useAuth';

type Feature = 'dashboard' | 'generators' | 'hours' | 'purchase' | 'issue' | 'stock' | 'reports';

const rolePermissions: Record<UserRole, Feature[]> = {
  admin: ['dashboard', 'generators', 'hours', 'purchase', 'issue', 'stock', 'reports'],
  operator: ['dashboard', 'hours', 'issue'],
  viewer: ['dashboard', 'reports'],
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
