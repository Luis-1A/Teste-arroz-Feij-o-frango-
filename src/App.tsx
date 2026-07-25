import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { MobileNavigation } from './components/MobileNavigation';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { StockEntry } from './pages/StockEntry';
import { SalesPanel } from './pages/SalesPanel';
import { LowStock } from './pages/LowStock';
import { TopSelling } from './pages/TopSelling';
import { RestockList } from './pages/RestockList';
import { CustomerDemandPage } from './pages/CustomerDemandPage';
import { HistoryLogs } from './pages/HistoryLogs';
import { UsersManagement } from './pages/UsersManagement';

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Fixed Top Header */}
      <Header onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />

      {/* Main Layout Body */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={tab => setActiveTab(tab)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard onNavigate={tab => setActiveTab(tab)} />}
          {activeTab === 'products' && <Products />}
          {activeTab === 'entry' && <StockEntry />}
          {activeTab === 'sales' && <SalesPanel />}
          {activeTab === 'customer-demand' && (
            <CustomerDemandPage
              onNavigateToProducts={() => setActiveTab('products')}
              onNavigateToEntry={() => setActiveTab('entry')}
            />
          )}
          {activeTab === 'low-stock' && (
            <LowStock onNavigateToEntry={() => setActiveTab('entry')} />
          )}
          {activeTab === 'top-selling' && <TopSelling />}
          {activeTab === 'restock-list' && (
            <RestockList
              onNavigateToProducts={() => setActiveTab('products')}
              onNavigateToEntry={() => setActiveTab('entry')}
              onNavigateToCustomerDemand={() => setActiveTab('customer-demand')}
            />
          )}
          {activeTab === 'history' && <HistoryLogs />}
          {activeTab === 'users' && <UsersManagement />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation activeTab={activeTab} onTabChange={tab => setActiveTab(tab)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
