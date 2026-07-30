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
import { StockDivergences } from './pages/StockDivergences';
import { HistoryLogs } from './pages/HistoryLogs';

import { UsersManagement } from './pages/UsersManagement';
import { POSCustomization } from './pages/POSCustomization';
import { SystemTestHub } from './pages/SystemTestHub';
import { AdminSupremeHub } from './pages/AdminSupremeHub';
import { testRunnerService } from './services/testRunnerService';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';

// Feature Modals
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { GuidedInventoryModal } from './components/GuidedInventoryModal';
import { ImportExportModal } from './components/ImportExportModal';
import { AnnouncementsBoardModal } from './components/AnnouncementsBoardModal';
import { CalendarModal } from './components/CalendarModal';
import { StoreGoalsModal } from './components/StoreGoalsModal';
import { RecycleBinModal } from './components/RecycleBinModal';
import { SystemHealthModal } from './components/SystemHealthModal';
import { StoreTemplatesModal } from './components/StoreTemplatesModal';
import { AppearanceModal } from './components/AppearanceModal';
import { DraftsModal } from './components/DraftsModal';
import { ProductHistoryModal } from './components/ProductHistoryModal';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [salesExtraMode, setSalesExtraMode] = useState<'saida' | 'troca' | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isTestModeActive, setIsTestModeActive] = useState<boolean>(() => {
    return localStorage.getItem('bytecas_system_test_active') === 'true';
  });

  // Feature Modals State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isGuidedInventoryOpen, setIsGuidedInventoryOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isStoreGoalsOpen, setIsStoreGoalsOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isSystemHealthOpen, setIsSystemHealthOpen] = useState(false);
  const [isStoreTemplatesOpen, setIsStoreTemplatesOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [selectedHistoryProductId, setSelectedHistoryProductId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = testRunnerService.subscribe((active) => {
      setIsTestModeActive(active);
    });

    const checkTestMode = () => {
      setIsTestModeActive(localStorage.getItem('bytecas_system_test_active') === 'true');
    };
    window.addEventListener('storage', checkTestMode);
    window.addEventListener('bytecas_test_mode_changed', checkTestMode);

    // Global Keydown listener for Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Custom Event Listeners
    const openCmd = () => setIsCommandPaletteOpen(true);
    const openGuided = () => setIsGuidedInventoryOpen(true);
    const openImpExp = () => setIsImportExportOpen(true);
    const openAnn = () => setIsAnnouncementsOpen(true);
    const openCal = () => setIsCalendarOpen(true);
    const openGoals = () => setIsStoreGoalsOpen(true);
    const openBin = () => setIsRecycleBinOpen(true);
    const openHealth = () => setIsSystemHealthOpen(true);
    const openTpl = () => setIsStoreTemplatesOpen(true);
    const openAppr = () => setIsAppearanceOpen(true);
    const openDraft = () => setIsDraftsOpen(true);
    const openHist = (e: any) => setSelectedHistoryProductId(e.detail?.productId || null);

    window.addEventListener('open_command_palette', openCmd);
    window.addEventListener('open_guided_inventory', openGuided);
    window.addEventListener('open_import_export', openImpExp);
    window.addEventListener('open_announcements', openAnn);
    window.addEventListener('open_calendar', openCal);
    window.addEventListener('open_store_goals', openGoals);
    window.addEventListener('open_recycle_bin', openBin);
    window.addEventListener('open_system_health', openHealth);
    window.addEventListener('open_store_templates', openTpl);
    window.addEventListener('open_appearance', openAppr);
    window.addEventListener('open_drafts', openDraft);
    window.addEventListener('open_product_history', openHist);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', checkTestMode);
      window.removeEventListener('bytecas_test_mode_changed', checkTestMode);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open_command_palette', openCmd);
      window.removeEventListener('open_guided_inventory', openGuided);
      window.removeEventListener('open_import_export', openImpExp);
      window.removeEventListener('open_announcements', openAnn);
      window.removeEventListener('open_calendar', openCal);
      window.removeEventListener('open_store_goals', openGoals);
      window.removeEventListener('open_recycle_bin', openBin);
      window.removeEventListener('open_system_health', openHealth);
      window.removeEventListener('open_store_templates', openTpl);
      window.removeEventListener('open_appearance', openAppr);
      window.removeEventListener('open_drafts', openDraft);
      window.removeEventListener('open_product_history', openHist);
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
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Fixed Top Header */}
      <Header
        activeTab={activeTab}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        onNavigate={tab => setActiveTab(tab)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Layout Body */}
      <div className="flex flex-1 relative w-full min-w-0">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab, extraMode) => {
            setActiveTab(tab);
            setSalesExtraMode(extraMode);
          }}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {activeTab === 'dashboard' && <Dashboard onNavigate={tab => setActiveTab(tab)} />}
          {activeTab === 'products' && <Products />}
          {activeTab === 'entry' && <StockEntry />}
          {activeTab === 'sales' && <SalesPanel initialExtraMode={salesExtraMode} />}
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
          {activeTab === 'stock-divergences' && (
            <StockDivergences
              onNavigateToProducts={() => setActiveTab('products')}
              onNavigateToEntry={() => setActiveTab('entry')}
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

      {/* GLOBAL FEATURE MODALS */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      <GuidedInventoryModal
        isOpen={isGuidedInventoryOpen}
        onClose={() => setIsGuidedInventoryOpen(false)}
        userName={user.nome}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        userName={user.nome}
      />

      <AnnouncementsBoardModal
        isOpen={isAnnouncementsOpen}
        onClose={() => setIsAnnouncementsOpen(false)}
        userName={user.nome}
        isSupremeAdmin={user.cargo === 'admin_supremo'}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        userName={user.nome}
      />

      <StoreGoalsModal
        isOpen={isStoreGoalsOpen}
        onClose={() => setIsStoreGoalsOpen(false)}
        userName={user.nome}
      />

      <RecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        userName={user.nome}
      />

      <SystemHealthModal
        isOpen={isSystemHealthOpen}
        onClose={() => setIsSystemHealthOpen(false)}
      />

      <StoreTemplatesModal
        isOpen={isStoreTemplatesOpen}
        onClose={() => setIsStoreTemplatesOpen(false)}
        userName={user.nome}
      />

      <AppearanceModal
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
        userName={user.nome}
      />

      <DraftsModal
        isOpen={isDraftsOpen}
        onClose={() => setIsDraftsOpen(false)}
        userName={user.nome}
      />

      <ProductHistoryModal
        productId={selectedHistoryProductId}
        onClose={() => setSelectedHistoryProductId(null)}
      />
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
