/**
 * Generator Tracker Module Entry Point
 * 
 * Use this file to embed the Generator Tracker into your existing React application.
 * 
 * Usage in your parent app:
 * 
 * ```tsx
 * import { GeneratorTrackerModule } from './modules/generator-tracker/module-entry';
 * import { AuthContext } from './modules/generator-tracker/hooks/useAuth';
 * 
 * function App() {
 *   const authValue = {
 *     user: { id: '1', name: 'John', email: 'john@example.com', role: 'admin', token: 'jwt...' },
 *     isAuthenticated: true,
 *     isLoading: false,
 *     login: async (token) => { ... },
 *     logout: () => { ... },
 *   };
 * 
 *   return (
 *     <AuthContext.Provider value={authValue}>
 *       <GeneratorTrackerModule />
 *     </AuthContext.Provider>
 *   );
 * }
 * ```
 */

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { GeneratorSetup } from '@/components/GeneratorSetup';
import { HourMeterEntry } from '@/components/HourMeterEntry';
import { FuelPurchase } from '@/components/FuelPurchase';
import { FuelIssue } from '@/components/FuelIssue';
import { MonthlyStock } from '@/components/MonthlyStock';
import { CostReports } from '@/components/CostReports';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Create a client for the module
const queryClient = new QueryClient();

export function GeneratorTrackerModule() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ProtectedRoute feature="dashboard">
            <Dashboard />
          </ProtectedRoute>
        );
      case 'generators':
        return (
          <ProtectedRoute feature="generators">
            <GeneratorSetup />
          </ProtectedRoute>
        );
      case 'hours':
        return (
          <ProtectedRoute feature="hours">
            <HourMeterEntry />
          </ProtectedRoute>
        );
      case 'purchase':
        return (
          <ProtectedRoute feature="purchase">
            <FuelPurchase />
          </ProtectedRoute>
        );
      case 'issue':
        return (
          <ProtectedRoute feature="issue">
            <FuelIssue />
          </ProtectedRoute>
        );
      case 'stock':
        return (
          <ProtectedRoute feature="stock">
            <MonthlyStock />
          </ProtectedRoute>
        );
      case 'reports':
        return (
          <ProtectedRoute feature="reports">
            <CostReports />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute feature="dashboard">
            <Dashboard />
          </ProtectedRoute>
        );
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {renderContent()}
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

// Export individual components for flexible integration
export { Dashboard } from '@/components/Dashboard';
export { GeneratorSetup } from '@/components/GeneratorSetup';
export { HourMeterEntry } from '@/components/HourMeterEntry';
export { FuelPurchase } from '@/components/FuelPurchase';
export { FuelIssue } from '@/components/FuelIssue';
export { MonthlyStock } from '@/components/MonthlyStock';
export { CostReports } from '@/components/CostReports';
export { Layout } from '@/components/Layout';
export { ProtectedRoute, usePermission } from '@/components/ProtectedRoute';
export { AuthContext, useAuth } from '@/hooks/useAuth';
export type { User, UserRole, AuthContextType } from '@/hooks/useAuth';
