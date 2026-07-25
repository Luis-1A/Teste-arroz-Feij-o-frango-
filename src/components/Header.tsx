import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Smartphone,
  Monitor,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebarMobile?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebarMobile, onOpenMobileMenu }) => {
  const handleMenuClick = onToggleSidebarMobile || onOpenMobileMenu;
  const { user, logout, isMobileSimulated, toggleMobileSimulated } = useAuth();

  const getRoleBadge = (cargo?: string) => {
    switch (cargo) {
      case 'admin_supremo':
        return {
          label: 'Administrador Supremo',
          bg: 'bg-indigo-50/80 border-indigo-200/80 text-indigo-700',
          icon: ShieldAlert
        };
      case 'gerente':
        return {
          label: 'Gerente',
          bg: 'bg-blue-50/80 border-blue-200/80 text-blue-700',
          icon: ShieldCheck
        };
      case 'funcionario':
      default:
        return {
          label: 'Funcionário',
          bg: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-700',
          icon: UserCheck
        };
    }
  };

  const roleInfo = getRoleBadge(user?.cargo);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center space-x-3">
          {handleMenuClick && (
            <button
              onClick={handleMenuClick}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100/80 transition-colors"
              title="Abrir Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base leading-tight tracking-tight flex items-center space-x-1.5">
                <span>Bytecas</span>
                <span className="text-blue-600 font-semibold text-[10px] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/80 uppercase tracking-wide">
                  Estoque
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Sistema de Controle de Estoque
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Mobile View / Web Desktop Simulator Toggle */}
          <button
            onClick={toggleMobileSimulated}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all duration-150 ${
              isMobileSimulated
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-500/20'
                : 'bg-slate-50/80 text-slate-700 border-slate-200/80 hover:bg-slate-100'
            }`}
            title="Alternar entre modo Web Computador e Modo Aplicativo Celular (Android/iOS)"
          >
            {isMobileSimulated ? (
              <>
                <Smartphone className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Modo Celular (App)</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Modo Web (Desktop)</span>
              </>
            )}
          </button>

          {/* Role Badge */}
          {user && (
            <div className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${roleInfo.bg}`}>
              <RoleIcon className="w-3.5 h-3.5" />
              <span>{roleInfo.label}</span>
            </div>
          )}

          {/* User Profile */}
          {user && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200/80">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 font-bold text-xs shadow-2xs">
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-none">{user.nome}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px] font-medium">{user.email}</p>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors ml-1"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
