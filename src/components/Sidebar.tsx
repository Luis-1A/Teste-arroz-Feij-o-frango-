import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreSync } from '../services/firestoreSync';
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
  FileBarChart,
  ClipboardCheck,
  Megaphone,
  Trash2,
  FileSpreadsheet,
  FolderTree,
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
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [divergenceCount, setDivergenceCount] = useState<number>(0);

  useEffect(() => {
    const unsubProds = firestoreSync.subscribeProducts((products) => {
      const lowStockItems = (products || []).filter(
        (p) => p.ativo !== false && p.estoque <= (p.estoque_minimo || 5)
      );
      setLowStockCount(lowStockItems.length);
    });

    const unsubDivs = firestoreSync.subscribeDivergences((divergences) => {
      const openDivs = (divergences || []).filter((d) => d.status === 'Aberta');
      setDivergenceCount(openDivs.length);
    });

    return () => {
      unsubProds();
      unsubDivs();
    };
  }, []);

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
          badge: 'FOTO',
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
              <h2 className="text-xs font-black text-white tracking-tight truncate">Facilitando Meu Trabalho</h2>
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

                const isLowStock = item.id === 'low-stock';
                const isStockDivergence = item.id === 'stock-divergences';

                const hasLowStockAlert = isLowStock && lowStockCount > 0;
                const hasDivergenceAlert = isStockDivergence && divergenceCount > 0;
                const hasCriticalAlert = hasLowStockAlert || hasDivergenceAlert;

                let badgeText = item.badge;
                if (hasLowStockAlert) {
                  badgeText = `${lowStockCount} FALTA`;
                } else if (hasDivergenceAlert) {
                  badgeText = `${divergenceCount} ALERTA`;
                }

                let buttonStyle = isActive
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-transparent text-slate-300 hover:bg-[#1F2937] hover:text-white';

                if (hasLowStockAlert) {
                  buttonStyle = isActive
                    ? 'bg-gradient-to-r from-rose-600 via-rose-700 to-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/80 animate-pulse'
                    : 'bg-rose-950/40 text-rose-200 border border-rose-500/40 hover:bg-rose-900/50 animate-pulse shadow-xs shadow-rose-900/30';
                } else if (hasDivergenceAlert) {
                  buttonStyle = isActive
                    ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/80 animate-pulse'
                    : 'bg-amber-950/40 text-amber-200 border border-amber-500/40 hover:bg-amber-900/50 animate-pulse shadow-xs shadow-amber-900/30';
                }

                let iconStyle = isActive ? 'text-white' : 'text-slate-400';
                if (hasLowStockAlert) {
                  iconStyle = 'text-rose-400 animate-pulse';
                } else if (hasDivergenceAlert) {
                  iconStyle = 'text-amber-400 animate-pulse';
                }

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
                    } py-2.5 rounded-xl text-xs font-bold transition-all duration-150 relative ${buttonStyle}`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="relative flex items-center justify-center shrink-0">
                        <Icon className={`w-4.5 h-4.5 ${iconStyle}`} />
                        {hasCriticalAlert && isCollapsed && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                                hasLowStockAlert ? 'bg-rose-400' : 'bg-amber-400'
                              } opacity-75`}
                            ></span>
                            <span
                              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                hasLowStockAlert ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                            ></span>
                          </span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <div className="flex items-center space-x-2 truncate">
                          <span className="truncate">{item.label}</span>
                          {hasCriticalAlert && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                                  hasLowStockAlert ? 'bg-rose-400' : 'bg-amber-400'
                                } opacity-75`}
                              ></span>
                              <span
                                className={`relative inline-flex rounded-full h-2 w-2 ${
                                  hasLowStockAlert ? 'bg-rose-500' : 'bg-amber-500'
                                }`}
                              ></span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!isCollapsed && badgeText && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          hasLowStockAlert
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : hasDivergenceAlert
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : isActive
                            ? 'bg-black/30 text-white'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {badgeText}
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
            Facilitando Meu Trabalho • Balcão
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
