import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestoreSync } from '../services/firestoreSync';
import { Product, POSConfig, Category } from '../types';
import { DEFAULT_POS_CONFIG } from '../config/posDefault';
import { soundEffects } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { ProductExchangeModal } from '../components/ProductExchangeModal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PackageCheck,
  User as UserIcon,
  X,
  Boxes,
  Info,
  Check,
  MapPin,
  ClipboardList,
  Zap,
  ShoppingBag,
  Volume2,
  VolumeX,
  Star,
  PlusCircle,
  Filter,
  ArrowLeftRight
} from 'lucide-react';

interface SelectedItem {
  product: Product;
  quantidade: number;
}

export const SalesPanel: React.FC = () => {
  const { user } = useAuth();
  
  // Realtime state from Firestore
  const [posConfig, setPosConfig] = useState<POSConfig>(DEFAULT_POS_CONFIG);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  // Sound effects state
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('bytecas_pos_muted') === 'true';
  });

  // Favorite product IDs
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bytecas_pos_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Search & Suggestions
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Selected items queued for stock exit
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [observacao, setObservacao] = useState('');
  const [tipoSaida, setTipoSaida] = useState<string>('venda');

  // Shortcut Cards active tab
  const [shortcutTab, setShortcutTab] = useState<'movimentados' | 'favoritos' | 'recentes'>('movimentados');

  // Modals & Notifications
  const [loading, setLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  // Live Clock
  const [now, setNow] = useState(new Date());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearInterval(timer);
    }
  }, [toast]);

  // Subscribe to Firestore Realtime DB for Products, Categories, Movements and POS Config
  useEffect(() => {
    const unsubConfig = firestoreSync.subscribeConfig((config) => {
      setPosConfig(config);
      setShortcutTab(config.shortcutTabDefault || 'movimentados');
    });

    const unsubProducts = firestoreSync.subscribeProducts((prods) => {
      setProducts(prods);
    });

    const unsubCategories = firestoreSync.subscribeCategories((cats) => {
      setCategories(cats);
    });

    const unsubMovements = firestoreSync.subscribeMovements((movs) => {
      setMovements(movs);
    });

    return () => {
      unsubConfig();
      unsubProducts();
      unsubCategories();
      unsubMovements();
    };
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
  };

  // Keyboard Shortcuts (F2, F4, F5, F8, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (selectedItems.length > 0) setIsClearModalOpen(true);
      } else if (e.key === 'F5') {
        e.preventDefault();
        showToast('info', 'Dados sincronizados com o banco de dados central.');
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (selectedItems.length > 0) setIsConfirmModalOpen(true);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setIsConfirmModalOpen(false);
        setIsClearModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems]);

  // Filter search suggestions as user types
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = products
      .filter((p) => p.ativo)
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(term) ||
          p.categoria.toLowerCase().includes(term)
      )
      .slice(0, 8);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm, products]);

  // Add Product to Selected List
  const handleSelectProduct = (product: Product) => {
    if (product.estoque <= 0) {
      soundEffects.playWarningTone(!isMuted);
      triggerHaptic('warning');
      showToast('warning', `Atenção: O produto "${product.nome}" está sem estoque!`);
    } else {
      soundEffects.playAddBeep(!isMuted);
      triggerHaptic('light');
    }

    setSelectedItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantidade;
        if (currentQty + 1 > product.estoque) {
          soundEffects.playWarningTone(!isMuted);
          showToast('warning', `A quantidade excede o estoque disponível (${product.estoque} UN).`);
        }
        updated[existingIndex].quantidade += 1;
        return updated;
      }
      return [{ product, quantidade: 1 }, ...prev];
    });

    setSearchTerm('');
    setShowSuggestions(false);
    showToast('info', `"${product.nome}" adicionado à lista.`);
  };

  // Handle Search Input KeyDown (e.g. Enter key from keyboard or barcode scanner)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
        handleSelectProduct(suggestions[targetIndex]);
      } else if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const exactMatch = products.find(
          (p) => p.ativo && (p.codigo.toLowerCase() === term || p.codigo_barras?.toLowerCase() === term)
        );
        if (exactMatch) {
          handleSelectProduct(exactMatch);
        } else {
          showToast('error', `Nenhum produto encontrado para "${searchTerm}".`);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    }
  };

  // Quantity updates in selected list
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }

    const item = selectedItems[index];
    if (newQty > item.product.estoque) {
      showToast('warning', `Estoque máximo para "${item.product.nome}" é de ${item.product.estoque} UN.`);
    }

    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index].quantidade = newQty;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    const item = selectedItems[index];
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
    showToast('info', `"${item.product.nome}" removido da lista.`);
  };

  const clearList = () => {
    setSelectedItems([]);
    setObservacao('');
    setIsClearModalOpen(false);
    showToast('info', 'Lista de movimentação limpa com sucesso.');
  };

  // REGISTER STOCK EXIT IN CENTRALIZED FIRESTORE DB
  const handleConfirmExit = async () => {
    if (selectedItems.length === 0) return;

    setLoading(true);
    try {
      const itemsToExit = selectedItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantidade
      }));

      await firestoreSync.registerStockExit(
        itemsToExit,
        { id: user?.id || 'usr_1', nome: user?.nome || 'Usuário' },
        observacao,
        tipoSaida
      );

      setSelectedItems([]);
      setObservacao('');
      setIsConfirmModalOpen(false);
      soundEffects.playSuccessChime(!isMuted);
      triggerHaptic('success');
      showToast('success', 'Saída de estoque registrada e sincronizada em tempo real!');
    } catch (err: any) {
      console.error('Erro ao registrar saída no banco:', err);
      soundEffects.playWarningTone(!isMuted);
      showToast('error', 'Falha ao sincronizar saída com o banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalUnitsSelected = selectedItems.reduce((acc, curr) => acc + curr.quantidade, 0);
  const categoriesInSelected = Array.from(new Set(selectedItems.map((i) => i.product.categoria))).length;

  // Shortcut Products Computation
  const getShortcutProducts = (): Product[] => {
    const limit = posConfig.shortcutCardCount || 6;

    if (shortcutTab === 'movimentados') {
      const movementCounts: Record<string, number> = {};
      movements.forEach((m) => {
        movementCounts[m.produto_id] = (movementCounts[m.produto_id] || 0) + (m.quantidade || 1);
      });

      return [...products]
        .filter((p) => p.ativo)
        .sort((a, b) => (movementCounts[b.id] || 0) - (movementCounts[a.id] || 0))
        .slice(0, limit);
    }

    if (shortcutTab === 'favoritos') {
      return [...products]
        .filter((p) => p.ativo)
        .sort((a, b) => a.estoque - b.estoque)
        .slice(0, limit);
    }

    return [...products]
      .filter((p) => p.ativo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  };

  const shortcutProducts = getShortcutProducts();

  // Border radius utility class map based on config
  const getRadiusClass = (radius: POSConfig['borderRadius']) => {
    switch (radius) {
      case 'sharp': return 'rounded-none';
      case 'soft': return 'rounded-lg';
      case 'rounded': return 'rounded-2xl';
      case 'pill': return 'rounded-3xl';
      default: return 'rounded-2xl';
    }
  };

  const radiusClass = getRadiusClass(posConfig.borderRadius);

  return (
    <div className={`min-h-[calc(100vh-80px)] flex flex-col font-sans ${posConfig.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
              : toast.type === 'warning'
              ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
              : 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-white shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-white shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-white shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      {posConfig.showHeader && (
        <header
          className={`px-6 border-b flex items-center justify-between shadow-2xs relative z-20 ${
            posConfig.theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200/80 text-slate-900'
          }`}
          style={{ height: `${posConfig.headerHeight || 80}px` }}
        >
          {/* Left Brand Info */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 shrink-0">
              B
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold tracking-tight">Bytecas Estoque</h1>
                <span className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Frente de Caixa (POS)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Controle de Saídas de Estoque • Banco de Dados Único Central</p>
            </div>
          </div>

          {/* Right Status & User Info */}
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="text-left">
                <span className="block text-[10px] uppercase tracking-wider text-emerald-600 font-extrabold">Status do Banco</span>
                <span className="text-xs font-bold text-emerald-900">Sincronizado (Único Central)</span>
              </div>
            </div>

            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs font-mono text-blue-600 font-bold">{now.toLocaleTimeString('pt-BR')}</p>
            </div>

            <div className="flex items-center space-x-3 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 flex items-center justify-center font-bold">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.nome}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{user?.cargo}</p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* MAIN BODY LAYOUT */}
      <div className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1800px] w-full mx-auto">
        {/* LEFT / CENTER AREA */}
        <div className={`space-y-6 ${posConfig.showRightPanel ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {/* SEARCH FIELD */}
          {posConfig.showSearch && (
            <div className="relative">
              <div className={`bg-white dark:bg-slate-900 p-2 ${radiusClass} border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center space-x-3 focus-within:ring-2 focus-within:ring-blue-600 transition`}>
                <div className="pl-3 text-slate-400 shrink-0">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (searchTerm.trim()) setShowSuggestions(true);
                  }}
                  placeholder="Pesquisar produto pelo nome... (pressione Enter)"
                  className="w-full bg-transparent text-sm md:text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none py-2"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setShowSuggestions(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-30 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                  {suggestions.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectProduct(item)}
                      className={`w-full p-3.5 text-left flex items-center justify-between hover:bg-blue-50/80 dark:hover:bg-slate-800/80 transition ${
                        idx === selectedIndex ? 'bg-blue-50 dark:bg-slate-800' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        {posConfig.showProductImage && (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200/60">
                            <Boxes className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.nome}</p>
                          <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
                            {posConfig.showProductCategory && <span>Categoria: {item.categoria}</span>}
                            {posConfig.showProductLocation && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{item.localizacao}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        {posConfig.showStockRemainingBadge && (
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block ${
                              item.estoque <= 0
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : item.estoque <= item.estoque_minimo
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {item.estoque} UN em estoque
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SHORTCUT CARDS */}
          {posConfig.showShortcutCards && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Acesso Rápido a Produtos
                  </span>
                </div>

                <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl space-x-1">
                  <button
                    onClick={() => setShortcutTab('movimentados')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      shortcutTab === 'movimentados'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Mais Movimentados
                  </button>
                  <button
                    onClick={() => setShortcutTab('favoritos')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      shortcutTab === 'favoritos'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Favoritos
                  </button>
                  <button
                    onClick={() => setShortcutTab('recentes')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      shortcutTab === 'recentes'
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Recentes
                  </button>
                </div>
              </div>

              {/* Shortcut Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
                {shortcutProducts.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className={`p-3.5 bg-white dark:bg-slate-900 ${radiusClass} border border-slate-200/80 dark:border-slate-800 text-left hover:border-blue-500 hover:shadow-md transition group flex flex-col justify-between space-y-2`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900 truncate max-w-[120px]">
                          {prod.categoria}
                        </span>
                        <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition shrink-0" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {prod.nome}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      {posConfig.showProductCode && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {prod.codigo}
                        </span>
                      )}
                      {posConfig.showStockRemainingBadge && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            prod.estoque <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : prod.estoque <= prod.estoque_minimo
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {prod.estoque} UN
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SELECTED ITEMS LIST */}
          {posConfig.showSelectedList && (
            <div className={`bg-white dark:bg-slate-900 ${radiusClass} border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden`}>
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-white">
                    Produtos Selecionados para Saída de Estoque
                  </h2>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setIsClearModalOpen(true)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Todos</span>
                  </button>
                )}
              </div>

              {selectedItems.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Boxes className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhum produto selecionado para saída</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Pesquise o nome do produto no campo de busca acima ou clique em um dos cartões de atalho rápido para adicionar à lista.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={item.product.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {posConfig.showProductImage && (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200/60">
                            <Boxes className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.product.nome}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {posConfig.showProductCategory && (
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 font-medium">
                                {item.product.categoria}
                              </span>
                            )}
                            {posConfig.showProductCode && <span>COD: {item.product.codigo}</span>}
                            {posConfig.showProductLocation && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{item.product.localizacao}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls & Stock Badge */}
                      <div className="flex items-center space-x-4 shrink-0">
                        {posConfig.showStockRemainingBadge && (
                          <div className="text-right hidden sm:block">
                            <span className="text-[10px] text-slate-400 block">Estoque Restante:</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {Math.max(0, item.product.estoque - item.quantidade)} UN
                            </span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => updateQuantity(idx, item.quantidade - 1)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition shadow-2xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-slate-900 dark:text-white">
                            {item.quantidade}
                          </span>
                          <button
                            onClick={() => updateQuantity(idx, item.quantidade + 1)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                          title="Remover produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDE PANEL */}
        {posConfig.showRightPanel && (
          <div className="lg:col-span-4 space-y-6">
            <div className={`bg-white dark:bg-slate-900 ${radiusClass} border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-5 sticky top-24`}>
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Resumo da Movimentação</h3>
                  <p className="text-[11px] text-slate-400">Controle estritamente de quantidade física</p>
                </div>
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>

              {/* Movement Stats */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total de Unidades</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{totalUnitsSelected} UN</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Categorias</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{categoriesInSelected}</span>
                </div>
              </div>

              {/* Motivo / Observação Input */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tipo de Saída / Motivo da Movimentação
                </label>

                <div className="grid grid-cols-1 gap-2">
                  {posConfig.customActionButtons.map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => {
                        setTipoSaida(btn.tipoSaida);
                        if (btn.tipoSaida === 'troca') {
                          setIsExchangeModalOpen(true);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition ${
                        tipoSaida === btn.tipoSaida
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{btn.label}</span>
                      {tipoSaida === btn.tipoSaida && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>

                {tipoSaida === 'troca' && (
                  <button
                    type="button"
                    onClick={() => setIsExchangeModalOpen(true)}
                    className="w-full p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-sm active:scale-95"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-emerald-200" />
                    <span>Abrir Janela de Troca (Item Devolvido + Item Levado)</span>
                  </button>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Observações Internas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Ex: Saída registrada para cliente na loja física..."
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={selectedItems.length === 0 || loading}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-extrabold text-white flex items-center justify-center space-x-2 transition shadow-md ${
                    selectedItems.length === 0 || loading
                      ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
                  }`}
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{loading ? 'Sincronizando...' : 'Registrar Saída de Estoque (F8)'}</span>
                </button>

                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setIsClearModalOpen(true)}
                    className="w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
                  >
                    Limpar Seleção (F4)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE STICKY BOTTOM REGISTER BAR */}
      {selectedItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'} selecionados
              </span>
              <span className="text-sm font-black text-white">{totalUnitsSelected} UN no Total</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsClearModalOpen(true)}
                className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-rose-400 hover:bg-slate-700 text-xs font-bold"
                title="Limpar"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-extrabold text-xs shadow-lg shadow-orange-950/50 flex items-center gap-2 active:scale-95 transition"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Registrar Saída ({totalUnitsSelected} UN)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      {posConfig.showFooter && (
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-4 font-mono text-[11px]">
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 font-bold">[F2] Pesquisar</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 font-bold">[F4] Limpar</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 font-bold">[F5] Atualizar</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 font-bold">[F8] Registrar</span>
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 font-bold">[ESC] Sair</span>
            </div>
            <div>
              <span>Bytecas Estoque v2.4 • Banco de Dados Central Sincronizado</span>
            </div>
          </div>
        </footer>
      )}

      {/* CONFIRMATION MODAL */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Confirmar Saída de Estoque</h3>
                <p className="text-xs text-slate-400">Esta ação atualizará o estoque central em todos os aparelhos.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total de Unidades:</span>
                <span className="font-bold text-slate-900 dark:text-white">{totalUnitsSelected} UN</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Tipo de Saída:</span>
                <span className="font-bold text-blue-600 uppercase">{tipoSaida}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar (ESC)
              </button>
              <button
                onClick={handleConfirmExit}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md shadow-blue-500/25 transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Sincronizando...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar Saída</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR SELECTION MODAL */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 max-w-sm w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Limpar Seleção?</h3>
                <p className="text-xs text-slate-400">Todos os itens adicionados serão removidos da lista.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={clearList}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-md shadow-rose-500/25 transition"
              >
                Sim, Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT EXCHANGE / DEVOLUTION MODAL */}
      <ProductExchangeModal
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        products={products}
        onSuccess={(msg) => setToast({ type: 'success', message: msg })}
      />
    </div>
  );
};

