import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Eye } from 'lucide-react';

const roleConfig = {
  admin: { label: 'Admin', icon: Shield, variant: 'default' as const },
  operator: { label: 'Operator', icon: User, variant: 'secondary' as const },
  viewer: { label: 'Viewer', icon: Eye, variant: 'outline' as const },
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
