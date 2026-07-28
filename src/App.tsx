import React, { useState, useEffect } from 'react';
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
import { POSCustomization } from './pages/POSCustomization';
import { SystemTestHub } from './pages/SystemTestHub';
import { AdminSupremeHub } from './pages/AdminSupremeHub';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';


const AppContent: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isTestModeActive, setIsTestModeActive] = useState<boolean>(() => {
    return localStorage.getItem('bytecas_system_test_active') === 'true';
  });

  useEffect(() => {
    const checkTestMode = () => {
      setIsTestModeActive(localStorage.getItem('bytecas_system_test_active') === 'true');
    };
    window.addEventListener('storage', checkTestMode);
    const interval = setInterval(checkTestMode, 1000);
    return () => {
      window.removeEventListener('storage', checkTestMode);
      clearInterval(interval);
    };
  }, []);

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  // Lockout non-supremo users during System Test Mode
  if (isTestModeActive && user.cargo !== 'admin_supremo') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 flex items-center justify-center mx-auto animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight">Sistema em Modo de Teste</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              O sistema está passando por um teste no momento para melhorar a experiência do usuário. Por favor, tente novamente mais tarde ou contate o Administrador Supremo.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 font-mono text-[11px] text-slate-400">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Simulação Automática de Balcão e Estoque...</span>
            </div>
            <p>• Acesso suspenso para Gerentes e Funcionários.</p>
            <p>• Testes de integridade do banco de dados em execução.</p>
          </div>

          <button
            onClick={logout}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition shadow-lg flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </div>
    );
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
          {activeTab === 'pos-customization' && <POSCustomization />}
          {activeTab === 'system_test' && <SystemTestHub />}
          {activeTab === 'admin_supreme_hub' && <AdminSupremeHub onNavigate={tab => setActiveTab(tab as TabType)} />}
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
