import { ReactNode } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Clock, 
  Fuel, 
  Droplets, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Zap,
  Users,
  Key
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { canAccess } from '@/lib/permissions';
import { RoleIndicator } from '@/components/RoleIndicator';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

type FeatureId = 'dashboard' | 'generators' | 'hours' | 'purchase' | 'issue' | 'stock' | 'reports' | 'users' | 'api-keys';

const navItems: { id: FeatureId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'generators', label: 'Generators', icon: Settings },
  { id: 'hours', label: 'Hour Meter Entry', icon: Clock },
  { id: 'purchase', label: 'Fuel Purchase', icon: Fuel },
  { id: 'issue', label: 'Issue Fuel', icon: Droplets },
  { id: 'stock', label: 'Monthly Stock', icon: BarChart3 },
  { id: 'reports', label: 'Cost Reports', icon: BarChart3 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'api-keys', label: 'API Keys', icon: Key },
];

export function Layout({ children, activeTab, onTabChange, sidebarCollapsed, onSidebarToggle }: LayoutProps) {
  const { user } = useAuth();
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => 
    user ? canAccess(user.role, item.id) : true
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in">
              <h1 className="font-heading font-bold text-lg text-sidebar-foreground">DG Tracker</h1>
              <p className="text-xs text-sidebar-foreground/60">Hours & Cost</p>
            </div>
          )}
        </div>

        {/* Role Indicator */}
        {!sidebarCollapsed && user && (
          <div className="px-3 py-2">
            <RoleIndicator />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                activeTab === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium animate-fade-in">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="ml-2">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
