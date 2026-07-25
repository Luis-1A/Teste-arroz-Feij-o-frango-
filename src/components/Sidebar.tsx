import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  PackagePlus,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  History,
  Users,
  Building2,
  UserX
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'products'
  | 'entry'
  | 'sales'
  | 'customer-demand'
  | 'low-stock'
  | 'top-selling'
  | 'restock-list'
  | 'history'
  | 'users';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile
}) => {
  const { user } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Visão Geral (Dashboard)',
      icon: LayoutDashboard,
      roles: ['admin_supremo', 'gerente', 'funcionario']
    },
    {
      id: 'products' as TabType,
      label: 'Estoque de Produtos',
      icon: Boxes,
      roles: ['admin_supremo', 'gerente', 'funcionario']
    },
    {
      id: 'entry' as TabType,
      label: 'Entrada de Estoque',
      icon: PackagePlus,
      roles: ['admin_supremo', 'gerente', 'funcionario']
    },
    {
      id: 'sales' as TabType,
      label: 'Painel de Saídas (POS)',
      icon: ShoppingCart,
      roles: ['admin_supremo', 'gerente', 'funcionario']
    },
    {
      id: 'customer-demand' as TabType,
      label: 'Procura de Clientes',
      icon: UserX,
      badge: 'NOVO',
      roles: ['admin_supremo', 'gerente', 'funcionario']
    },
    {
      id: 'low-stock' as TabType,
      label: 'Produtos em Falta',
      icon: AlertTriangle,
      roles: ['admin_supremo', 'gerente', 'funcionario']
    },
    {
      id: 'top-selling' as TabType,
      label: 'Produtos Mais Vendidos',
      icon: TrendingUp,
      roles: ['admin_supremo', 'gerente', 'funcionario']
    },
    {
      id: 'restock-list' as TabType,
      label: 'Lista de Reposição',
      icon: ClipboardList,
      badge: 'AUTO',
      roles: ['admin_supremo', 'gerente', 'funcionario']
    },
    {
      id: 'history' as TabType,
      label: 'Histórico & Auditoria',
      icon: History,
      roles: ['admin_supremo', 'gerente', 'funcionario']
    },
    {
      id: 'users' as TabType,
      label: 'Controle de Usuários',
      icon: Users,
      roles: ['admin_supremo']
    }
  ];

  const allowedItems = navItems.filter(item =>
    item.roles.includes(user?.cargo || 'funcionario')
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 w-64 select-none">
      {/* Company Info Header */}
      <div className="p-4 border-b border-slate-100/80 flex items-center space-x-3 bg-slate-50/60">
        <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-slate-900 tracking-tight">Bytecas Loja e Estoque</h2>
          <p className="text-[10px] text-slate-400 font-medium">Unidade Principal • Matriz</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
          Menu de Navegação
        </p>
        {allowedItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/25'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-100/80 text-blue-700 border border-blue-200/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100/80 text-center bg-slate-50/60">
        <p className="text-[10px] font-medium text-slate-400">Bytecas Estoque v2.4 • Sem Dados Financeiros</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 w-64 max-w-xs bg-white h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
