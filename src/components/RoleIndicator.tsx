import { useAuth, UserRole } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Eye, Crown, Wrench, Gauge } from 'lucide-react';

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; variant: 'default' | 'secondary' | 'outline' }> = {
  super_admin: { label: 'Super Admin', icon: Crown, variant: 'default' },
  admin: { label: 'Admin', icon: Shield, variant: 'default' },
  maintenance: { label: 'Maintenance', icon: Wrench, variant: 'secondary' },
  operator: { label: 'Operator', icon: Gauge, variant: 'secondary' },
  viewer: { label: 'Viewer', icon: Eye, variant: 'outline' },
};

export function RoleIndicator() {
  const { user } = useAuth();

  if (!user) return null;

  const config = roleConfig[user.role];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-sidebar-accent/50 rounded-lg">
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
      <span className="text-xs text-sidebar-foreground/60 truncate max-w-[120px]">
        {user.name}
      </span>
    </div>
  );
}
