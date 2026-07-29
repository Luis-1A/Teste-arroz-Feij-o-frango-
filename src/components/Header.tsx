import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TabType } from './Sidebar';
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
  X
} from 'lucide-react';

interface HeaderProps {
  activeTab?: TabType;
  onToggleSidebarMobile?: () => void;
  onOpenMobileMenu?: () => void;
  onNavigate?: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'sales',
  onToggleSidebarMobile,
  onOpenMobileMenu,
  onNavigate
}) => {
  const handleMenuClick = onToggleSidebarMobile || onOpenMobileMenu;
  const { user, logout, isMobileSimulated, toggleMobileSimulated } = useAuth();

  const [time, setTime] = useState(new Date());
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadge = (cargo?: string) => {
    switch (cargo) {
      case 'admin_supremo':
        return {
          label: 'Administrador Supremo',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: ShieldAlert
        };
      case 'gerente':
        return {
          label: 'Gerente',
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
          icon: ShieldCheck
        };
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
        return 'Hub Administrador Supremo';
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
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-xl h-20 md:h-22 px-4 md:px-6 flex items-center justify-between select-none">
      {/* LADO ESQUERDO: Logo + Nome + Descrição */}
      <div className="flex items-center space-x-3.5">
        {handleMenuClick && (
          <button
            onClick={handleMenuClick}
            className="lg:hidden p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700/60"
            title="Abrir Menu Lateral"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-950/40 shrink-0 ring-1 ring-orange-400/30">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-white text-base md:text-lg tracking-tight leading-none">
                Bytecas
              </h1>
              <span className="text-[10px] font-black bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                Estoque
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block mt-0.5">
              Sistema de Gestão de Loja e Controle Físico
            </p>
          </div>
        </div>
      </div>

      {/* CENTRO: Nome da Página Atual + Status Online */}
      <div className="hidden md:flex flex-col items-center justify-center">
        <h2 className="text-sm lg:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>{getPageTitle(activeTab)}</span>
        </h2>
        <div className="flex items-center space-x-1.5 mt-0.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Sincronizado • Online</span>
        </div>
      </div>

      {/* LADO DIREITO: Data/Hora + Avatar + Cargo + Ações */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Date & Time */}
        <div className="hidden lg:flex flex-col items-end text-right font-mono pr-2 border-r border-slate-800">
          <div className="flex items-center space-x-1.5 text-xs text-slate-200 font-bold">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Mobile simulator toggle */}
        <button
          onClick={toggleMobileSimulated}
          className={`p-2 md:px-3 md:py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
            isMobileSimulated
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
          }`}
          title="Alternar Simulação Mobile / PC"
        >
          {isMobileSimulated ? (
            <>
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline">Celular</span>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4 text-slate-400" />
              <span className="hidden xl:inline">PC / Notebook</span>
            </>
          )}
        </button>

        {/* Notifications Button */}
        <button
          onClick={() => setShowNotificationsModal(!showNotificationsModal)}
          className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
          title="Notificações do Sistema"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
        </button>

        {/* Quick Settings Button */}
        {onNavigate && user?.cargo === 'admin_supremo' && (
          <button
            onClick={() => onNavigate('pos-customization')}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
            title="Configurações Rápidas do POS"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-extrabold text-white leading-tight">{user.nome}</div>
              <div className={`mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold ${roleInfo.bg}`}>
                <RoleIcon className="w-2.5 h-2.5" />
                <span>{roleInfo.label}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="absolute right-4 top-20 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-slate-200 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-orange-400" />
              Notificações de Estoque
            </h4>
            <button
              onClick={() => setShowNotificationsModal(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-emerald-400 font-semibold">
                <span>Sincronização em Tempo Real</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-slate-400">
                O banco de dados Firestore está conectado. Qualquer movimentação atualiza instantaneamente todos os caixas.
              </p>
            </div>

            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-orange-400 font-semibold">Módulo de Troca Ativo</div>
              <p className="text-[11px] text-slate-400">
                Selecione o tipo "Transferência / Troca" para abrir a janela de devolução física com reposição automática de estoque.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
