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
  ArrowLeftRight,
  Cpu,
  Crown,
  FileBarChart,
  ClipboardCheck,
  Megaphone,
  Trash2,
  FileSpreadsheet,
  FileEdit,
  Palette
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
  | 'stock-divergences'
  | 'history'
  | 'users'
  | 'pos-customization'
  | 'system_test'
  | 'admin_supreme_hub';


interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType, extraMode?: 'saida' | 'troca') => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  extraMode?: 'saida' | 'troca';
  customEvent?: string;
  roles: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile
}) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups: { groupLabel: string; items: NavItem[] }[] = [
    {
      groupLabel: 'Frente de Loja',
      items: [
        {
          id: 'dashboard' as TabType,
          label: 'Dashboard',
          icon: LayoutDashboard,
          roles: ['admin_supremo', 'gerente', 'funcionario']
        },
        {
          id: 'sales' as TabType,
          label: 'Frente de Caixa',
          icon: ShoppingCart,
          badge: 'POS',
          roles: ['admin_supremo', 'gerente', 'funcionario']
        },
        {
          id: 'sales' as TabType,
          label: 'Saída de Produtos',
          icon: PackageMinus,
          extraMode: 'saida' as const,
          roles: ['admin_supremo', 'gerente', 'funcionario']
        },
        {
          id: 'sales' as TabType,
          label: 'Trocas e Devoluções',
          icon: ArrowLeftRight,
          extraMode: 'troca' as const,
          badge: 'TROCA',
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
          label: 'Entrada de Estoque',
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
      groupLabel: 'Relatórios & Auditoria',
      items: [
        {
          id: 'top-selling' as TabType,
          label: 'Produtos Mais Saídos',
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
          id: 'stock-divergences' as TabType,
          label: 'Divergências de Estoque',
          icon: AlertTriangle,
          badge: 'ALERTA',
          roles: ['admin_supremo', 'gerente', 'funcionario']
        },
        {
          id: 'history' as TabType,
          label: 'Relatórios e Histórico',
          icon: FileBarChart,
          roles: ['admin_supremo', 'gerente', 'funcionario']
        }
      ]
    },

    {
      groupLabel: 'Ferramentas de Gestão',
      items: [
        {
          id: 'products' as TabType,
          label: 'Inventário Guiado',
          icon: ClipboardCheck,
          customEvent: 'open_guided_inventory',
          roles: ['admin_supremo', 'gerente', 'funcionario']
        },
        {
          id: 'products' as TabType,
          label: 'Mural de Avisos',
          icon: Megaphone,
          customEvent: 'open_announcements',
          roles: ['admin_supremo', 'gerente', 'funcionario']
        },
        {
          id: 'products' as TabType,
          label: 'Lixeira Inteligente',
          icon: Trash2,
          customEvent: 'open_recycle_bin',
          roles: ['admin_supremo', 'gerente']
        },
        {
          id: 'products' as TabType,
          label: 'Importar / Exportar',
          icon: FileSpreadsheet,
          customEvent: 'open_import_export',
          roles: ['admin_supremo', 'gerente']
        }
      ]
    },
    {
      groupLabel: 'Administração',
      items: [
        {
          id: 'admin_supreme_hub' as TabType,
          label: 'Central Supremo (100+)',
          icon: Crown,
          badge: '100+',
          roles: ['admin_supremo']
        },
        {
          id: 'users' as TabType,
          label: 'Controle de Usuários',
          icon: Users,
          roles: ['admin_supremo']
        },
        {
          id: 'pos-customization' as TabType,
          label: 'Configurações do POS',
          icon: Sliders,
          roles: ['admin_supremo']
        }
      ]
    }
  ];

  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-[#111827] text-slate-200 border-r border-[#1F2937] transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header Info */}
      <div className="p-4 border-b border-[#1F2937] flex items-center justify-between bg-[#0B1220]/60">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold shadow-md shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="text-xs font-black text-white tracking-tight truncate">Bosteca Estoque</h2>
              <p className="text-[10px] text-slate-400 font-bold truncate">Menu do Sistema</p>
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
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-1.5">
                  {group.groupLabel}
                </p>
              )}

              {allowedGroupItems.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id && !item.extraMode;

                return (
                  <button
                    key={`${item.id}-${item.extraMode || itemIdx}`}
                    onClick={() => {
                      if ('customEvent' in item && item.customEvent) {
                        window.dispatchEvent(new CustomEvent(item.customEvent as string));
                      } else {
                        onTabChange(item.id, item.extraMode);
                      }
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                    } py-2.5 rounded-xl text-xs font-bold transition-all duration-150 relative ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-transparent text-slate-300 hover:bg-[#1F2937] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-black/30 text-white'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
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
      <div className="p-3 border-t border-[#1F2937] bg-[#0B1220]/60 flex items-center justify-between">
        {!isCollapsed && (
          <p className="text-[10px] font-bold text-slate-400 truncate">
            Bosteca Estoque • Balcão
          </p>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl bg-[#1F2937] border border-[#334155] text-slate-400 hover:text-white hover:bg-slate-700 transition mx-auto shadow-xs"
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
      <aside className="hidden lg:block shrink-0 h-[calc(100vh-80px)] sticky top-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10 w-64 max-w-xs bg-slate-900 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
