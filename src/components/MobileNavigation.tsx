import React from 'react';
import { TabType } from './Sidebar';
import {
  LayoutDashboard,
  Boxes,
  PackagePlus,
  ShoppingCart,
  ClipboardList,
  UserX
} from 'lucide-react';

interface MobileNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ activeTab, onTabChange }) => {
  const items = [
    { id: 'dashboard' as TabType, label: 'Início', icon: LayoutDashboard },
    { id: 'products' as TabType, label: 'Estoque', icon: Boxes },
    { id: 'sales' as TabType, label: 'Saídas', icon: ShoppingCart },
    { id: 'customer-demand' as TabType, label: 'Procura', icon: UserX },
    { id: 'restock-list' as TabType, label: 'Reposição', icon: ClipboardList }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 px-2 py-1.5 flex items-center justify-around lg:hidden shadow-lg">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
              isActive ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 scale-110' : ''} transition-transform`} />
            <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
