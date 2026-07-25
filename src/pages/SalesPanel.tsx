import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  PackageCheck,
  User as UserIcon,
  X,
  Clock,
  Boxes,
  Tag,
  Keyboard,
  Info,
  Check,
  MapPin,
  ClipboardList,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Radio,
  FileSpreadsheet,
  Zap,
  PackageX
} from 'lucide-react';

interface SelectedItem {
  product: Product;
  quantidade: number;
}

export const SalesPanel: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Selected items list for stock exit
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [observacao, setObservacao] = useState('');
  const [tipoSaida, setTipoSaida] = useState<'venda' | 'uso_interno' | 'transferencia' | 'descarte'>('venda');

  // UI Modals & Notifications
  const [loading, setLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Floating Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  // Realtime Clock
  const [now, setNow] = useState(new Date());

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live clock timer
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const list = await api.getProducts();
      setProducts(list);
    } catch (err) {
      console.error('Erro ao carregar catálogo de estoque:', err);
      showToast('error', 'Falha ao conectar com o catálogo de produtos.');
    }
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
  };

  // Dynamic search suggestions while typing
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    const q = searchTerm.toLowerCase().trim();
    const matches = products.filter(
      p =>
        p.nome.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q)) ||
        p.categoria.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q)
    );

    setSuggestions(matches);
    setShowSuggestions(true);
    setSelectedIndex(matches.length > 0 ? 0 : -1);
  }, [searchTerm, products]);

  // Keyboard navigation & Shortcuts (F2 = search, F10 = confirm, ESC = cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F10') {
        e.preventDefault();
        if (selectedItems.length > 0) {
          setIsConfirmModalOpen(true);
        } else {
          showToast('warning', 'Adicione produtos à lista antes de confirmar a saída.');
        }
      } else if (e.key === 'Escape') {
        if (showSuggestions) {
          setShowSuggestions(false);
        } else if (isConfirmModalOpen) {
          setIsConfirmModalOpen(false);
        } else if (isClearModalOpen) {
          setIsClearModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, showSuggestions, isConfirmModalOpen, isClearModalOpen]);

  // Handle arrow navigation in search suggestions
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && searchTerm.trim()) {
        const exactMatch = products.find(
          p => p.codigo_barras === searchTerm.trim() || p.codigo.toLowerCase() === searchTerm.trim().toLowerCase()
        );
        if (exactMatch) {
          addItem(exactMatch);
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        addItem(suggestions[selectedIndex]);
      }
    }
  };

  const addItem = (product: Product) => {
    if (product.estoque <= 0) {
      showToast('error', `Produto "${product.nome}" indisponível em estoque (0 UN).`);
      return;
    }

    setSelectedItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantidade + 1 > product.estoque) {
          showToast('warning', `Limite de estoque atingido para "${product.nome}" (${product.estoque} UN).`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantidade: 1 }];
      }
    });

    showToast('success', `Adicionado: ${product.nome}`);
    setSearchTerm('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    searchInputRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedItems(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantidade + delta;
            if (newQty > item.product.estoque) {
              showToast('warning', `Estoque máximo disponível: ${item.product.estoque} UN.`);
              return item;
            }
            return { ...item, quantidade: newQty };
          }
          return item;
        })
        .filter(item => item.quantidade > 0)
    );
  };

  const setDirectQuantity = (productId: string, qtyString: string) => {
    const val = parseInt(qtyString, 10);
    if (isNaN(val) || val <= 0) return;

    setSelectedItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          if (val > item.product.estoque) {
            showToast('warning', `Estoque disponível: ${item.product.estoque} UN.`);
            return { ...item, quantidade: item.product.estoque };
          }
          return { ...item, quantidade: val };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    const item = selectedItems.find(i => i.product.id === productId);
    if (item) {
      setSelectedItems(prev => prev.filter(i => i.product.id !== productId));
      showToast('info', `Removido: ${item.product.nome}`);
    }
  };

  const clearList = () => {
    setSelectedItems([]);
    setObservacao('');
    setIsClearModalOpen(false);
    showToast('info', 'Lista de itens limpa com sucesso.');
    searchInputRef.current?.focus();
  };

  const handleScanSuccess = (prod: Product) => {
    addItem(prod);
  };

  // Total items calculation
  const totalUnidades = selectedItems.reduce((acc, item) => acc + item.quantidade, 0);

  // Submit stock exit
  const handleConfirmStockExit = async () => {
    if (selectedItems.length === 0) {
      showToast('error', 'Adicione ao menos um produto para registrar a baixa.');
      return;
    }

    setLoading(true);

    try {
      const itemsToSubmit = selectedItems.map(i => ({
        produtoId: i.product.id,
        quantidade: i.quantidade
      }));

      const rotuloTipo = {
        venda: 'Saída por Venda/Balcão',
        uso_interno: 'Baixa para Uso Interno',
        transferencia: 'Saída por Transferência',
        descarte: 'Baixa por Descarte/Avaria'
      }[tipoSaida];

      const obsFormatted = [
        rotuloTipo,
        observacao ? `Obs: ${observacao}` : '',
        `Registrado por: ${user?.nome || 'Operador'}`
      ].filter(Boolean).join(' | ');

      await api.addStockExit(itemsToSubmit, obsFormatted);

      showToast('success', `Baixa de ${totalUnidades} unidade(s) registrada no estoque!`);
      setSelectedItems([]);
      setObservacao('');
      setIsConfirmModalOpen(false);
      loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao registrar movimentação de estoque.');
    } finally {
      setLoading(false);
      searchInputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col space-y-5 text-slate-800 font-sans select-none pb-12">

      {/* 1. TOP HEADER BANNER - HIGH TECH ENTERPRISE CONTROL BAR */}
      <header className="bg-slate-900 text-white rounded-2xl p-4 sm:px-6 sm:py-4.5 border border-slate-800/80 shadow-md flex flex-wrap items-center justify-between gap-4 shrink-0 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/25 shrink-0 border border-blue-400/30">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="font-black text-base sm:text-lg tracking-tight text-white leading-none">
                BYTECAS ESTOQUE
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-400/30">
                Frente de Caixa • Registro de Saídas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Terminal Operacional de Baixa e Controle de Produtos em Tempo Real
            </p>
          </div>
        </div>

        {/* Live System Info Indicators */}
        <div className="flex items-center space-x-3 text-xs font-medium text-slate-300 ml-auto sm:ml-0 relative z-10">
          <div className="hidden md:flex items-center space-x-2 bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700/80">
            <UserIcon className="w-4 h-4 text-blue-400" />
            <span>Operador: <strong className="text-white font-semibold">{user?.nome || 'Atendente'}</strong></span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700/80">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-white text-xs font-semibold">
              {now.toLocaleDateString('pt-BR')} • {now.toLocaleTimeString('pt-BR')}
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/25">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ESTOQUE ATIVO</span>
          </div>
        </div>
      </header>


      {/* 2. MAIN POS WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">

        {/* LEFT COLUMN (8 Cols): PROTAGONIST SEARCH BAR & QUICK SHORTCUTS */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">

          {/* MAIN PROTAGONIST SEARCH CONTAINER */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm relative space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span>Localizar Produto para Registrar Saída</span>
              </label>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors border border-slate-200"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Escanear Código</span>
                </button>

                <span className="hidden sm:inline-block px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-mono font-bold rounded-lg border border-slate-200">
                  [F2] Pesquisar
                </span>
              </div>
            </div>

            {/* LARGE MODERN PROMINENT SEARCH INPUT */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Pesquise um produto pelo nome, código interno ou código de barras... [F2]"
                className="w-full pl-4 pr-12 py-4 text-base sm:text-lg font-bold text-slate-900 border-2 border-slate-200/90 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 bg-slate-50/50 focus:bg-white transition-all shadow-2xs"
                autoFocus
              />

              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setShowSuggestions(false);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              )}

              {/* AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-40 max-h-96 overflow-y-auto divide-y divide-slate-100">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Resultados da busca ({suggestions.length})</span>
                    <span>Navegue com ↑ ↓ e pressione [Enter]</span>
                  </div>

                  {suggestions.map((p, idx) => {
                    const isSelected = idx === selectedIndex;

                    return (
                      <div
                        key={p.id}
                        onClick={() => addItem(p)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`p-3.5 sm:p-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                          isSelected ? 'bg-blue-50/90 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                              {p.codigo}
                            </span>
                            <p className="font-bold text-slate-900 text-sm truncate">
                              {p.nome}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">{p.categoria}</span>
                            <span>•</span>
                            <span>Marca: {p.marca}</span>
                            {p.localizacao && (
                              <>
                                <span>•</span>
                                <span className="flex items-center text-slate-600">
                                  <MapPin className="w-3 h-3 mr-0.5 text-slate-400" />
                                  Local: {p.localizacao}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Stock Badge ONLY (Zero Prices) */}
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                              p.estoque === 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : p.estoque <= p.estoque_minimo
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            <Boxes className="w-3.5 h-3.5 mr-1" />
                            <span>{p.estoque} UN Disponíveis</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showSuggestions && suggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-5 text-center z-40">
                  <p className="text-xs text-slate-600 font-medium">
                    Nenhum produto em estoque encontrado com o termo "<strong>{searchTerm}</strong>".
                  </p>
                </div>
              )}
            </div>
          </div>


          {/* HIGH TURNOVER SHORTCUT CARDS GRID */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Atalhos Rápidos de Alta Rotatividade</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">Clique para adicionar 1 un</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {products.slice(0, 8).map(p => {
                const isOutOfStock = p.estoque <= 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItem(p)}
                    disabled={isOutOfStock}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all active:scale-[0.98] disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent group relative bg-slate-50/50 hover:bg-white flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block mb-0.5">
                        {p.codigo}
                      </span>
                      <p className="font-bold text-slate-900 text-xs line-clamp-2 group-hover:text-blue-600 leading-snug">
                        {p.nome}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium truncate max-w-[85px]">{p.categoria}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {p.estoque} UN
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>


          {/* KEYBOARD SHORTCUTS GUIDE FOOTER BAR */}
          <div className="bg-slate-100/90 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex items-center space-x-2 font-medium">
              <Keyboard className="w-4 h-4 text-slate-500" />
              <span>Atalhos Rápidos de Operação:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span><kbd className="bg-white px-2 py-0.5 rounded-md border border-slate-300 font-mono text-xs font-bold text-slate-800 shadow-2xs">F2</kbd> Pesquisar</span>
              <span><kbd className="bg-white px-2 py-0.5 rounded-md border border-slate-300 font-mono text-xs font-bold text-slate-800 shadow-2xs">F10</kbd> Confirmar Registros</span>
              <span><kbd className="bg-white px-2 py-0.5 rounded-md border border-slate-300 font-mono text-xs font-bold text-slate-800 shadow-2xs">ESC</kbd> Fechar / Cancelar</span>
            </div>
          </div>

        </div>


        {/* RIGHT COLUMN (4/5 Cols): REGISTERED ITEMS PANEL FOR STOCK EXIT */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 sticky top-4">

            {/* Panel Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900">Itens Registrados para Baixa</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Lista de movimentação de estoque</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-200/80">
                  {totalUnidades} UN
                </span>

                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsClearModalOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Esvaziar Lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ITEMS LIST */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {selectedItems.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2.5">
                  <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Nenhum produto selecionado.</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Pesquise um item acima ou clique nos atalhos rápidos para iniciar o registro de saída.
                  </p>
                </div>
              ) : (
                selectedItems.map(item => {
                  const restara = item.product.estoque - item.quantidade;

                  return (
                    <div
                      key={item.product.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 transition-all hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs truncate">{item.product.nome}</p>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono font-bold text-blue-600">{item.product.codigo}</span>
                            {item.product.localizacao && (
                              <>
                                <span>•</span>
                                <span>Local: {item.product.localizacao}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantity Controls & Projected Stock */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <div className="text-[11px]">
                          <span className="text-slate-500">Estoque atual: </span>
                          <strong className="text-slate-700">{item.product.estoque} un</strong>
                          <span className="text-slate-400 mx-1">➔</span>
                          <span className="text-slate-500">Restará: </span>
                          <strong className={restara < 5 ? 'text-amber-700' : 'text-emerald-700'}>
                            {restara} un
                          </strong>
                        </div>

                        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-700 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="text"
                            value={item.quantidade}
                            onChange={e => setDirectQuantity(item.product.id, e.target.value)}
                            className="w-10 text-center text-xs font-extrabold text-slate-900 border-none focus:outline-none p-0"
                          />

                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-700 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ACTION SUMMARY & SUBMIT BUTTON */}
            <div className="pt-3.5 border-t border-slate-100 space-y-3">
              <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total de Produtos
                  </span>
                  <span className="text-lg font-black text-white">
                    {selectedItems.length} tipo(s) • {totalUnidades} UN
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-400/30">
                    PRONTO
                  </span>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={selectedItems.length === 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-extrabold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar Registros de Saída [F10]</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base text-white">Confirmar Baixa no Estoque</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">

              {/* Items Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Quantidade de Itens Diferentes:</span>
                  <strong className="text-slate-900">{selectedItems.length} produto(s)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total de Unidades a Retirar:</span>
                  <strong className="text-blue-700 text-sm font-black">{totalUnidades} UN</strong>
                </div>
              </div>

              {/* Tipo de Saída */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Finalidade da Movimentação:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'venda', label: 'Saída por Venda/Balcão' },
                    { id: 'uso_interno', label: 'Uso Interno / Consumo' },
                    { id: 'transferencia', label: 'Transferência de Filial' },
                    { id: 'descarte', label: 'Descarte / Avaria' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTipoSaida(item.id as any)}
                      className={`p-3 rounded-xl border font-bold text-left transition-all ${
                        tipoSaida === item.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observation Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observação / Destinatário / Nº do Pedido (Opcional):
                </label>
                <input
                  type="text"
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Ex: Retirada setor de assistência / Pedido #842"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar [ESC]
              </button>

              <button
                type="button"
                onClick={handleConfirmStockExit}
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <span>Processando...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Concluir Movimentação de Saída</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR LIST MODAL */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4 border border-slate-200 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">Limpar lista de itens?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta ação removerá todos os {totalUnidades} produto(s) selecionados para baixa.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={clearList}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs"
              >
                Sim, Esvaziar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER MODAL */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onScanSuccess={handleScanSuccess}
      />

      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border flex items-center space-x-3 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 max-w-sm ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : toast.type === 'error'
              ? 'bg-rose-950 text-white border-rose-800'
              : toast.type === 'warning'
              ? 'bg-amber-950 text-white border-amber-800'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}

          <span className="leading-snug">{toast.message}</span>

          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
