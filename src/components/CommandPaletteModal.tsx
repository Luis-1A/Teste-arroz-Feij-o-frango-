import React, { useState, useEffect } from 'react';
import { localStore } from '../services/localStore';
import { Product, Category, User, Movement, Announcement } from '../types';
import { TabType } from './Sidebar';
import {
  Search,
  Command,
  Boxes,
  PackagePlus,
  ShoppingCart,
  Users,
  Calendar,
  Goal,
  Trash2,
  Activity,
  Sliders,
  Maximize2,
  FileSpreadsheet,
  Megaphone,
  Bot,
  Layers,
  Sparkles,
  X,
  ArrowRight
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType) => void;
  onOpenProductHistory?: (productId: string) => void;
  onOpenRecycleBin?: () => void;
  onOpenAssistant?: () => void;
  onOpenGuidedInventory?: () => void;
  onOpenImportExport?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenProductHistory,
  onOpenRecycleBin,
  onOpenAssistant,
  onOpenGuidedInventory,
  onOpenImportExport
}) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (isOpen) {
      setProducts(localStore.getProducts().filter(p => !p.lixeira));
      setCategories(localStore.getCategories());
      setAnnouncements(localStore.getAnnouncements());
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Normalized search query
  const cleanQuery = query.toLowerCase().trim();

  // Search Results
  const matchingProducts = cleanQuery
    ? products.filter(
        p =>
          (p.nome || '').toLowerCase().includes(cleanQuery) ||
          (p.codigo || '').toLowerCase().includes(cleanQuery) ||
          (p.marca || '').toLowerCase().includes(cleanQuery) ||
          (p.categoria || '').toLowerCase().includes(cleanQuery) ||
          p.etiquetas?.some(t => (t || '').toLowerCase().includes(cleanQuery))
      ).slice(0, 5)
    : [];

  const matchingCategories = cleanQuery
    ? categories.filter(c => (c.nome || '').toLowerCase().includes(cleanQuery)).slice(0, 3)
    : [];

  const matchingAnnouncements = cleanQuery
    ? announcements.filter(
        a => (a.titulo || '').toLowerCase().includes(cleanQuery) || (a.conteudo || '').toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  const navActions = [
    { label: 'Ir para Dashboard', icon: Command, tab: 'dashboard' as TabType },
    { label: 'Ver Estoque Central', icon: Boxes, tab: 'products' as TabType },
    { label: 'Registrar Entrada de Estoque', icon: PackagePlus, tab: 'entry' as TabType },
    { label: 'Abrir Frente de Caixa (POS)', icon: ShoppingCart, tab: 'sales' as TabType },
    { label: 'Gerenciar Usuários', icon: Users, tab: 'users' as TabType },
    { label: 'Configurações e Customização', icon: Sliders, tab: 'pos-customization' as TabType }
  ];

  const quickTools = [
    {
      label: 'Lixeira Inteligente (Produtos Excluídos)',
      icon: Trash2,
      action: () => {
        onClose();
        if (onOpenRecycleBin) onOpenRecycleBin();
      }
    },
    {
      label: 'Assistente de Organização',
      icon: Bot,
      action: () => {
        onClose();
        if (onOpenAssistant) onOpenAssistant();
      }
    },
    {
      label: 'Inventário Guiado por Contagem',
      icon: Activity,
      action: () => {
        onClose();
        if (onOpenGuidedInventory) onOpenGuidedInventory();
      }
    },
    {
      label: 'Importar / Exportar Dados (CSV / JSON)',
      icon: FileSpreadsheet,
      action: () => {
        onClose();
        if (onOpenImportExport) onOpenImportExport();
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-orange-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Busca global ou navegação por comando (Ex: 'cabo', 'entrada', 'lixeira')..."
            className="w-full bg-transparent text-sm font-bold text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold text-slate-400 bg-slate-800 border border-slate-700 rounded-lg">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results / Navigation Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-6 text-xs">
          {/* SEARCH RESULTS IF TYPING */}
          {cleanQuery ? (
            <>
              {/* Products Found */}
              {matchingProducts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Produtos Encontrados ({matchingProducts.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onClose();
                          onNavigate('products');
                          if (onOpenProductHistory) onOpenProductHistory(p.id);
                        }}
                        className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-white group-hover:text-orange-300 truncate">{p.nome}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            SKU: {p.codigo} • Categoria: {p.categoria}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              p.estoque <= 0
                                ? 'bg-rose-500/20 text-rose-400'
                                : p.estoque < p.estoque_minimo
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {p.estoque} un
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Found */}
              {matchingCategories.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Categorias ({matchingCategories.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingCategories.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onClose();
                          onNavigate('products');
                        }}
                        className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 cursor-pointer transition flex items-center justify-between text-slate-200 font-bold"
                      >
                        <span>{c.nome}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Announcements Found */}
              {matchingAnnouncements.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Avisos ({matchingAnnouncements.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingAnnouncements.map(a => (
                      <div key={a.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                        <p className="font-bold text-amber-300">{a.titulo}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{a.conteudo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchingProducts.length === 0 &&
                matchingCategories.length === 0 &&
                matchingAnnouncements.length === 0 && (
                  <div className="text-center py-8 space-y-2">
                    <Search className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-slate-400 font-bold">Nenhum resultado para "{query}"</p>
                    <p className="text-[11px] text-slate-500">
                      Tente pesquisar por código de barras, nome de categoria ou tag personalizada.
                    </p>
                  </div>
                )}
            </>
          ) : (
            <>
              {/* DEFAULT NAVIGATION COMMANDS */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Navegação Rápida
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {navActions.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          onClose();
                          onNavigate(item.tab);
                        }}
                        className="p-2.5 bg-slate-950 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/90 rounded-2xl transition text-left flex items-center space-x-3 group"
                      >
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-orange-400 group-hover:scale-105 transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-200 group-hover:text-white truncate">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QUICK TOOLS & MODULES */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Ferramentas Especiais do Sistema
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickTools.map((tool, idx) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={idx}
                        onClick={tool.action}
                        className="p-2.5 bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/90 rounded-2xl transition text-left flex items-center space-x-3 group"
                      >
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-200 group-hover:text-amber-300 truncate">
                          {tool.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Atalho Global: Digite <kbd className="text-white bg-slate-800 px-1 rounded">Ctrl + K</kbd> em qualquer tela
          </span>
          <span className="hidden sm:inline font-mono">Facilitando Meu Trabalho v2.0</span>
        </div>
      </div>
    </div>
  );
};
