import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TabType } from './Sidebar';
import { AccountSettingsModal } from './AccountSettingsModal';
import {
  Package,
  Smartphone,
  Monitor,
  LogOut,
  Bell,
  Sliders,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
  User,
  Search,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface HeaderProps {
  activeTab?: TabType;
  onToggleSidebarMobile?: () => void;
  onOpenMobileMenu?: () => void;
  onNavigate?: (tab: TabType) => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'sales',
  onToggleSidebarMobile,
  onOpenMobileMenu,
  onNavigate,
  onOpenCommandPalette
}) => {
  const handleMenuClick = onToggleSidebarMobile || onOpenMobileMenu;
  const { user, logout, isMobileSimulated, toggleMobileSimulated } = useAuth();

  const [time, setTime] = useState(new Date());
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Account Settings Modal State
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const getRoleBadge = (cargo?: string) => {
    switch (cargo) {
      case 'gerente':
        return {
          label: 'Gerente',
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
          icon: ShieldCheck
        };
      case 'admin_supremo':
      case 'funcionario':
      default:
        return {
          label: 'Funcionário',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: UserCheck
        };
    }
  };

  const getPageTitle = (tab: TabType | string) => {
    switch (tab) {
      case 'sales':
        return 'Frente de Caixa (POS)';
      case 'dashboard':
        return 'Dashboard de Operações';
      case 'products':
        return 'Estoque Central';
      case 'entry':
        return 'Entrada de Estoque';
      case 'restock-list':
        return 'Lista de Reposição';
      case 'customer-demand':
        return 'Demanda de Clientes';
      case 'top-selling':
        return 'Produtos Mais Saídos';
      case 'low-stock':
        return 'Produtos em Falta';
      case 'history':
        return 'Histórico & Auditoria';
      case 'users':
        return 'Controle de Usuários';
      case 'pos-customization':
        return 'Personalização da Caixa';
      case 'system_test':
        return 'Central de Testes do Sistema';
      case 'admin_supreme_hub':
        return 'Painel de Gestão Avançada';
      default:
        return 'Frente de Caixa';
    }
  };

  const roleInfo = getRoleBadge(user?.cargo);
  const RoleIcon = roleInfo.icon;

  const formattedDate = time.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const formattedTime = time.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <>
      <header className="bg-[#111827] border-b border-[#1F2937] text-white sticky top-0 z-30 shadow-xl h-20 md:h-22 px-6 flex items-center justify-between w-full select-none">
        {/* LADO ESQUERDO: Logo + Nome da Loja */}
        <div className="flex items-center space-x-3.5">
          {handleMenuClick && (
            <button
              onClick={handleMenuClick}
              className="lg:hidden p-2.5 rounded-2xl bg-[#1F2937] hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-[#334155]"
              title="Abrir Menu Lateral"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-md border border-blue-400/30 shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-black text-white text-lg md:text-xl tracking-tight leading-none">
                  Facilitando Meu Trabalho
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block mt-0.5">
                Sistema de Gestão de Estoque
              </p>
            </div>
          </div>
        </div>

        {/* CENTRO: Nome da Página + Relógio em Tempo Real */}
        <div className="hidden md:flex flex-col items-center justify-center text-center">
          <h2 className="text-base lg:text-lg font-black text-white tracking-wide uppercase">
            {getPageTitle(activeTab)}
          </h2>
          <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-300 mt-0.5 bg-[#0B1220] px-3 py-0.5 rounded-full border border-[#1F2937] font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>{formattedDate} • {formattedTime}</span>
          </div>
        </div>

        {/* LADO DIREITO: Avatar + Nome + Cargo + Botão Sair */}
        <div className="flex items-center space-x-3">
          {user && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAccountModal(true)}
                className="flex items-center space-x-2.5 p-1.5 rounded-2xl hover:bg-[#1F2937] transition group text-left"
                title="Minha Conta"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border border-indigo-400/30 flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition">
                  {(user?.nome || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-black text-white leading-tight">
                    {user?.nome || 'Usuário'}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 capitalize">
                    {roleInfo.label}
                  </div>
                </div>
              </button>

              {/* Botão de Sair */}
              <button
                onClick={logout}
                className="p-2.5 rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-[#1F2937] hover:border-red-500/30"
                title="Sair do Sistema"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* PRIVATE ACCOUNT SETTINGS MODAL */}
      <AccountSettingsModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </>
  );
};

