import React, { useState } from 'react';
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
  UserX,
  Sliders,
  ChevronLeft,
  ChevronRight,
  PackageMinus,
  Cpu,
  Crown
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
  | 'users'
  | 'pos-customization'
  | 'system_test'
  | 'admin_supreme_hub';


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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups = [
    {
      groupLabel: 'Principal',
      items: [
        {
          id: 'dashboard' as TabType,
          label: 'Dashboard',
          icon: LayoutDashboard,
          roles: ['admin_supremo', 'gerente', 'funcionario']
        },
        {
          id: 'sales' as TabType,
          label: 'Frente de Caixa (POS)',
          icon: ShoppingCart,
          badge: 'CAIXA',
          roles: ['admin_supremo', 'gerente', 'funcionario']
        }
      ]
    },
    {
      groupLabel: 'Estoque & Operações',
      items: [
        {
          id: 'products' as TabType,
          label: 'Estoque Central',
          icon: Boxes,
          roles: ['admin_supremo', 'gerente', 'funcionario']
        },
        {
          id: 'entry' as TabType,
          label: 'Entrada de Produtos',
          icon: PackagePlus,
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
          id: 'customer-demand' as TabType,
          label: 'Cliente Veio e Não Tinha',
          icon: UserX,
          badge: 'DEMANDA',
          roles: ['admin_supremo', 'gerente', 'funcionario']
        }
      ]
    },
    {
      groupLabel: 'Relatórios & Desempenho',
      items: [
        {
          id: 'top-selling' as TabType,
          label: 'Produtos Mais Vendidos',
          icon: TrendingUp,
          roles: ['admin_supremo', 'gerente', 'funcionario']
        },
        {
          id: 'low-stock' as TabType,
          label: 'Produtos em Falta',
          icon: AlertTriangle,
          roles: ['admin_supremo', 'gerente', 'funcionario']
        },
        {
          id: 'history' as TabType,
          label: 'Histórico & Auditoria',
          icon: History,
          roles: ['admin_supremo', 'gerente', 'funcionario']
        }
      ]
    },
    {
      groupLabel: 'Administração & Personalização',
      items: [
        {
          id: 'admin_supreme_hub' as TabType,
          label: 'Central Supremo (100+)',
          icon: Crown,
          badge: '100+',
          roles: ['admin_supremo']
        },
        {
          id: 'system_test' as TabType,
          label: 'Teste do Sistema',
          icon: Cpu,
          badge: '@Luisoo5',
          roles: ['admin_supremo']
        },
        {
          id: 'pos-customization' as TabType,
          label: 'Personalização da Caixa',
          icon: Sliders,
          badge: 'SUPREMO',
          roles: ['admin_supremo']
        },
        {
          id: 'users' as TabType,
          label: 'Controle de Usuários',
          icon: Users,
          roles: ['admin_supremo']
        }
      ]
    }
  ];

  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-white border-r border-slate-200/90 transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header Info */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="text-xs font-black text-slate-900 tracking-tight truncate">Bytecas Estoque</h2>
              <p className="text-[10px] text-slate-400 font-bold truncate">Loja & Unidade Central</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links Grouped */}
      <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto custom-scrollbar">
        {navGroups.map((group, idx) => {
          const allowedGroupItems = group.items.filter((item) =>
            item.roles.includes(user?.cargo || 'funcionario')
          );

          if (allowedGroupItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-1.5">
                  {group.groupLabel}
                </p>
              )}

              {allowedGroupItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                    } py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-150 relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/20'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
        {!isCollapsed && (
          <p className="text-[10px] font-bold text-slate-400 truncate">
            Bytecas Estoque v2.4 • Notebook Pro
          </p>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition mx-auto shadow-2xs"
          title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 w-64 max-w-xs bg-white h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
