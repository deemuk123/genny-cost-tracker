import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { GeneratorSetup } from '@/components/GeneratorSetup';
import { HourMeterEntry } from '@/components/HourMeterEntry';
import { FuelPurchase } from '@/components/FuelPurchase';
import { FuelIssue } from '@/components/FuelIssue';
import { MonthlyStock } from '@/components/MonthlyStock';
import { CostReports } from '@/components/CostReports';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'generators':
        return <GeneratorSetup />;
      case 'hours':
        return <HourMeterEntry />;
      case 'purchase':
        return <FuelPurchase />;
      case 'issue':
        return <FuelIssue />;
      case 'stock':
        return <MonthlyStock />;
      case 'reports':
        return <CostReports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      sidebarCollapsed={sidebarCollapsed}
      onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      {renderContent()}
    </Layout>
  );
};

export default Index;
