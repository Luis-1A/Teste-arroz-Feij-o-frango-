import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { localStore } from '../services/localStore';
import { Product, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { standardizeProductName, findDuplicateProduct } from '../utils/productStandardizer';
import { smartMatch } from '../utils/searchUtils';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  X,
  Boxes,
  AlertCircle,
  MapPin,
  Tag,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  Folder,
  Package,
  Layers,
  Smartphone,
  Sparkles,
  Shield,
  Cpu,
  Check,
  Zap
} from 'lucide-react';

const COLOR_OPTIONS = [
  { name: 'Azul', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Verde', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Roxo', value: '#8b5cf6', bg: 'bg-purple-500' },
  { name: 'Laranja', value: '#f97316', bg: 'bg-orange-500' },
  { name: 'Rosa', value: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Vermelho', value: '#ef4444', bg: 'bg-rose-500' },
  { name: 'Ciano', value: '#06b6d4', bg: 'bg-cyan-500' },
  { name: 'Cinza', value: '#64748b', bg: 'bg-slate-500' }
];

const ICON_OPTIONS = [
  { id: 'Folder', label: 'Pasta', icon: Folder },
  { id: 'Package', label: 'Pacote', icon: Package },
  { id: 'Layers', label: 'Camadas', icon: Layers },
  { id: 'Tag', label: 'Etiqueta', icon: Tag },
  { id: 'Smartphone', label: 'Celular', icon: Smartphone },
  { id: 'Sparkles', label: 'Acessórios', icon: Sparkles },
  { id: 'Shield', label: 'Proteção', icon: Shield },
  { id: 'Cpu', label: 'Componentes', icon: Cpu }
];

export const Products: React.FC = () => {
  const { canPerform } = useAuth();
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todas');

  // Add/Edit Product Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Management Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [catError, setCatError] = useState('');

  // Form Fields for Product
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [lastUsedCategory, setLastUsedCategory] = useState<string>(() => {
    return localStorage.getItem('facilitando_last_used_category') || '';
  });
  const [marca, setMarca] = useState('Padrão');
  const [estoque, setEstoque] = useState<number>(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(5);
  const [naoRelevante, setNaoRelevante] = useState<boolean>(false);
  const [excluirAoZerar, setExcluirAoZerar] = useState<boolean>(false);
  const [observacao, setObservacao] = useState('');
  const [formError, setFormError] = useState('');
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const [successToastMsg, setSuccessToastMsg] = useState('');

  // Refs for auto-focusing cursor
  const nomeInputRef = useRef<HTMLInputElement>(null);
  const batchTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fast Batch Registration Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchCategory, setBatchCategory] = useState('');
  const [batchMinStock, setBatchMinStock] = useState<number>(3);
  const [batchInitialStock, setBatchInitialStock] = useState<number>(1);
  const [batchNaoRelevante, setBatchNaoRelevante] = useState<boolean>(false);
  const [batchExcluirAoZerar, setBatchExcluirAoZerar] = useState<boolean>(false);
  const [batchNamesText, setBatchNamesText] = useState('');
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  // Smart Name Suggestions Autocomplete
  const nameSuggestions = useMemo(() => {
    if (!nome || nome.trim().length < 2) return [];
    const clean = nome.trim().toLowerCase();
    const matches = rawProducts.filter(
      (p) => p.nome.toLowerCase().includes(clean) || smartMatch(p.nome, clean)
    );
    const seen = new Set<string>();
    const results: Product[] = [];
    for (const p of matches) {
      if (!seen.has(p.nome)) {
        seen.add(p.nome);
        results.push(p);
      }
      if (results.length >= 5) break;
    }
    return results;
  }, [nome, rawProducts]);

  // Delete Confirmation Modal
  const [deleteProductCandidate, setDeleteProductCandidate] = useState<Product | null>(null);
  const [deleteCategoryCandidate, setDeleteCategoryCandidate] = useState<{ id: string; nome: string } | null>(null);

  // Collapsed Category Accordions State (default: open)
  const [collapsedCategories, setCollapsedCategories] = useState<{ [catName: string]: boolean }>({});

  useEffect(() => {
    setLoading(true);
    const unsubProds = firestoreSync.subscribeProducts((allProds) => {
      setRawProducts(allProds || []);
      setLoading(false);
    });

    const unsubCats = firestoreSync.subscribeCategories((cats) => {
      const seen = new Set<string>();
      const uniqueCats: Category[] = [];
      for (const c of cats || []) {
        if (!c || !c.nome) continue;
        const nameKey = c.nome.trim().toLowerCase();
        if (!seen.has(nameKey)) {
          seen.add(nameKey);
          uniqueCats.push(c);
        }
      }
      setCategories(uniqueCats);
    });

    return () => {
      unsubProds();
      unsubCats();
    };
  }, []);

  // Filter products using smart flexible search
  const filteredProducts = useMemo(() => {
    let filtered = rawProducts.filter((p) => p.ativo !== false);
    if (selectedCategoryFilter && selectedCategoryFilter !== 'Todas') {
      filtered = filtered.filter((p) => p.categoria === selectedCategoryFilter);
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter((p) => smartMatch(p.nome, searchTerm));
    }
    return filtered;
  }, [rawProducts, selectedCategoryFilter, searchTerm]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: { [catName: string]: Product[] } = {};
    for (const p of filteredProducts) {
      const cat = p.categoria || 'Sem Categoria';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [filteredProducts]);

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    if (!newCategoryName.trim()) {
      setCatError('Digite o nome da categoria.');
      return;
    }

    try {
      await firestoreSync.createCategory(
        newCategoryName.trim(),
        newCategoryColor,
        newCategoryIcon,
        newCategoryDesc.trim()
      );
      setNewCategoryName('');
      setNewCategoryDesc('');
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      setCatError(err.message || 'Erro ao criar categoria.');
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    const targetCat = (catName || '').trim().toLowerCase();
    // Prevent deletion if products exist in this category
    const productsInCat = rawProducts.filter(
      (p) => (p.categoria || '').trim().toLowerCase() === targetCat && p.ativo !== false
    );

    if (productsInCat.length > 0) {
      alert(
        `Não é possível excluir a categoria "${catName}" pois ainda existem ${productsInCat.length} produto(s) cadastrado(s) nela.\n\nPrimeiro será necessário mover esses produtos para outra categoria.`
      );
      return;
    }

    setDeleteCategoryCandidate({ id: catId, nome: catName });
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCategoryCandidate) return;
    try {
      await firestoreSync.deleteCategory(deleteCategoryCandidate.id);
      setDeleteCategoryCandidate(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao remover categoria.');
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setCategoria(newCat);
    const profile = localStore.getCategoryProfile(newCat);
    if (profile) {
      setEstoqueMinimo(profile.estoque_minimo);
      setNaoRelevante(Boolean(profile.nao_relevante));
      setExcluirAoZerar(Boolean(profile.excluir_ao_zerar));
    }
  };

  const openAddModal = (presetCategory?: any) => {
    setEditingProduct(null);
    setNome('');
    const savedLast = localStorage.getItem('facilitando_last_used_category') || lastUsedCategory;
    const cleanPresetCat = typeof presetCategory === 'string' ? presetCategory : undefined;
    const initialCategory = cleanPresetCat || savedLast || categories[0]?.nome || 'Películas';
    setCategoria(initialCategory);

    // Apply category profile
    const profile = localStore.getCategoryProfile(initialCategory);
    if (profile) {
      setEstoqueMinimo(profile.estoque_minimo);
      setNaoRelevante(Boolean(profile.nao_relevante));
      setExcluirAoZerar(Boolean(profile.excluir_ao_zerar));
    } else {
      setEstoqueMinimo(5);
      setNaoRelevante(false);
      setExcluirAoZerar(false);
    }

    setMarca('Padrão');
    setEstoque(1); // Default quantity = 1
    setObservacao('');
    setFormError('');
    setSuccessToastMsg('');
    setIsModalOpen(true);
    setTimeout(() => {
      nomeInputRef.current?.focus();
    }, 100);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setNome(p.nome);
    setCategoria(p.categoria);
    setMarca(p.marca || 'Padrão');
    setEstoque(p.estoque);
    setEstoqueMinimo(p.estoque_minimo || 5);
    setNaoRelevante(Boolean(p.nao_relevante));
    setExcluirAoZerar(Boolean(p.excluir_ao_zerar));
    setObservacao(p.observacao || '');
    setFormError('');
    setSuccessToastMsg('');
    setIsModalOpen(true);
    setTimeout(() => {
      nomeInputRef.current?.focus();
    }, 100);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nome.trim() || !categoria) {
      setFormError('Por favor, preencha o nome do produto e a categoria.');
      return;
    }

    const standardizedName = standardizeProductName(nome);

    const duplicate = findDuplicateProduct(filteredProducts, standardizedName, categoria, editingProduct?.id);
    if (duplicate) {
      setFormError(`Já existe o produto "${duplicate.nome}" cadastrado na categoria "${categoria}".`);
      return;
    }

    try {
      const generatedCode = editingProduct?.codigo || `PROD-${Math.floor(1000 + Math.random() * 9000)}`;

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          nome: standardizedName,
          categoria,
          marca: marca || 'Padrão',
          codigo: generatedCode,
          estoque: Number(estoque),
          estoque_minimo: naoRelevante ? 0 : Number(estoqueMinimo),
          nao_relevante: naoRelevante,
          excluir_ao_zerar: excluirAoZerar,
          observacao
        });
      } else {
        await api.createProduct({
          nome: standardizedName,
          categoria,
          marca: marca || 'Padrão',
          codigo: generatedCode,
          estoque: Number(estoque),
          estoque_minimo: naoRelevante ? 0 : Number(estoqueMinimo),
          nao_relevante: naoRelevante,
          excluir_ao_zerar: excluirAoZerar,
          observacao
        });
      }

      // Save category profile settings
      localStore.saveCategoryProfile({
        categoria,
        estoque_minimo: estoqueMinimo,
        nao_relevante: naoRelevante,
        excluir_ao_zerar: excluirAoZerar
      });

      // Always save last used category
      if (categoria) {
        localStorage.setItem('facilitando_last_used_category', categoria);
        setLastUsedCategory(categoria);
      }

      if (saveAndAddAnother) {
        // Inherit options from previous product, reset nome to empty string, estoque to 1, focus back on name input
        setSuccessToastMsg(`✅ Produto "${standardizedName}" cadastrado! Digite o próximo.`);
        setNome('');
        setEstoque(1);
        setObservacao('');
        setFormError('');
        setSaveAndAddAnother(false);
        setTimeout(() => {
          nomeInputRef.current?.focus();
        }, 100);
      } else {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar produto.');
    }
  };

  const openBatchModal = () => {
    const savedLast = localStorage.getItem('facilitando_last_used_category') || lastUsedCategory;
    const initialCategory = savedLast || categories[0]?.nome || 'Películas';
    setBatchCategory(initialCategory);

    const profile = localStore.getCategoryProfile(initialCategory);
    if (profile) {
      setBatchMinStock(profile.estoque_minimo);
      setBatchNaoRelevante(Boolean(profile.nao_relevante));
      setBatchExcluirAoZerar(Boolean(profile.excluir_ao_zerar));
    } else {
      setBatchMinStock(3);
      setBatchNaoRelevante(false);
      setBatchExcluirAoZerar(false);
    }
    setBatchInitialStock(1);
    setBatchNamesText('');
    setBatchSuccessMsg('');
    setIsBatchModalOpen(true);
    setTimeout(() => {
      batchTextareaRef.current?.focus();
    }, 100);
  };

  const handleBatchCategoryChange = (newCat: string) => {
    setBatchCategory(newCat);
    const profile = localStore.getCategoryProfile(newCat);
    if (profile) {
      setBatchMinStock(profile.estoque_minimo);
      setBatchNaoRelevante(Boolean(profile.nao_relevante));
      setBatchExcluirAoZerar(Boolean(profile.excluir_ao_zerar));
    }
  };

  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchSuccessMsg('');
    const lines = batchNamesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      alert('Por favor, digite ao menos um nome de produto para cadastrar.');
      return;
    }

    if (!batchCategory) {
      alert('Por favor, selecione uma categoria.');
      return;
    }

    setBatchLoading(true);

    try {
      const itemsToCreate = lines.map((rawName) => {
        const stdName = standardizeProductName(rawName);
        return {
          nome: stdName,
          categoria: batchCategory,
          marca: 'Padrão',
          codigo: `PROD-${Math.floor(10000 + Math.random() * 90000)}`,
          estoque: Number(batchInitialStock) || 1,
          estoque_minimo: batchNaoRelevante ? 0 : Number(batchMinStock),
          nao_relevante: batchNaoRelevante,
          excluir_ao_zerar: batchExcluirAoZerar,
          observacao: 'Cadastrado em lote'
        };
      });

      await firestoreSync.createProductBatch(itemsToCreate);

      // Save category profile
      localStore.saveCategoryProfile({
        categoria: batchCategory,
        estoque_minimo: batchMinStock,
        nao_relevante: batchNaoRelevante,
        excluir_ao_zerar: batchExcluirAoZerar
      });

      setBatchSuccessMsg(`✅ ${lines.length} produto(s) cadastrado(s) com sucesso na categoria "${batchCategory}"!`);
      setBatchNamesText('');
      setTimeout(() => {
        batchTextareaRef.current?.focus();
      }, 100);
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar lote de produtos.');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductCandidate) return;
    try {
      const targetId = deleteProductCandidate.id;
      setRawProducts((prev) => prev.filter((p) => p.id !== targetId));
      await api.deleteProduct(targetId);
      setDeleteProductCandidate(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir produto.');
    }
  };

  const getCategoryMeta = (catName?: string) => {
    if (!catName) {
      return { cor: '#3b82f6', icone: 'Folder', descricao: '' };
    }
    const target = catName.toLowerCase();
    const found = categories.find((c) => c && c.nome && c.nome.toLowerCase() === target);
    return {
      cor: found?.cor || '#3b82f6',
      icone: found?.icone || 'Folder',
      descricao: found?.descricao || ''
    };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-5 rounded-2xl border border-[#1F2937] shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-blue-400" />
            <span>Estoque Central</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organização simplificada por categorias com visualização rápida.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setCatError('');
              setIsCategoryModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-[#0B1220] hover:bg-[#1E293B] text-slate-300 border border-[#1F2937] rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
          >
            <FolderPlus className="w-4 h-4 text-orange-400" />
            <span>+ Categoria</span>
          </button>

          {canPerform('edit_products') && (
            <>
              <button
                onClick={openBatchModal}
                className="px-3.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                title="Cadastrar múltiplos produtos rapidamente"
              >
                <Zap className="w-4 h-4 text-blue-400" />
                <span>⚡ Cadastro Rápido (Lote)</span>
              </button>

              <button
                onClick={() => openAddModal()}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:opacity-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-500/20 flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Produto</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Input (Strictly by Name) & Category Filter */}
      <div className="bg-[#111827] p-4 rounded-2xl border border-[#1F2937] shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar produto pelo nome..."
            className="w-full pl-10 pr-4 py-3 text-xs border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-[#0B1220] text-white placeholder-slate-400 font-medium transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3.5 py-3 text-xs border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-[#0B1220] text-white font-semibold w-full md:w-auto"
          >
            <option value="Todas" className="bg-[#0B1220] text-white">Todas as Categorias ({filteredProducts.length})</option>
            {categories.map((c, idx) => (
              <option key={c.id ? `${c.id}-${idx}` : `${c.nome}-${idx}`} value={c.nome} className="bg-[#0B1220] text-white">
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Folders & Products List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-[#111827] p-8 rounded-2xl border border-[#1F2937] text-center text-slate-400 italic text-xs">
            Carregando produtos do estoque...
          </div>
        ) : Object.keys(groupedProducts).length === 0 ? (
          <div className="bg-[#111827] p-8 rounded-2xl border border-[#1F2937] text-center text-slate-400 text-xs font-medium">
            Nenhum produto encontrado.
          </div>
        ) : (
          Object.entries(groupedProducts).map(([catName, prods]: [string, Product[]]) => {
            const isCollapsed = collapsedCategories[catName];
            const meta = getCategoryMeta(catName);

            return (
              <div
                key={catName}
                className="bg-[#111827] rounded-2xl border border-[#1F2937] shadow-xl overflow-hidden transition-all"
              >
                {/* Folder Accordion Header */}
                <div
                  onClick={() => toggleCategoryCollapse(catName)}
                  className="p-4 bg-[#0B1220] text-white flex items-center justify-between cursor-pointer hover:bg-[#151f32] transition select-none border-b border-[#1F2937]"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                      style={{ backgroundColor: meta.cor }}
                    >
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-tight flex items-center space-x-2">
                        <span>{catName}</span>
                        <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] rounded-full font-mono font-bold">
                          {prods.length} {prods.length === 1 ? 'item' : 'itens'}
                        </span>
                      </h3>
                      {meta.descricao && (
                        <p className="text-[11px] text-slate-400 font-normal mt-0.5">{meta.descricao}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    {canPerform('edit_products') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddModal(catName);
                        }}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
                        title={`Adicionar novo produto na categoria ${catName}`}
                      >
                        <Plus className="w-3 h-3 text-blue-400" />
                        <span>+ Item</span>
                      </button>
                    )}
                    <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline">
                      {isCollapsed ? 'Abrir Pasta' : 'Fechar Pasta'}
                    </span>
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </div>
                </div>

                {/* Folder Contents (Product Cards List) */}
                {!isCollapsed && (
                  <div className="p-4 bg-[#0B1220]/50 space-y-4">
                    {prods.length === 0 ? (
                      <div className="p-6 bg-[#0B1220] rounded-xl border border-dashed border-[#1F2937] text-center text-xs text-slate-400 font-medium">
                        Nenhum produto nesta categoria.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {prods.map((p) => {
                          const isZero = p.estoque === 0;
                          const isNegative = p.estoque < 0;
                          const isLow = !p.nao_relevante && p.estoque > 0 && p.estoque <= (p.estoque_minimo || 5);

                          return (
                            <div
                              key={p.id}
                              className={`p-3.5 rounded-xl border bg-[#111827] transition hover:border-blue-500/40 flex flex-col justify-between space-y-3 ${
                                isNegative
                                  ? 'border-rose-800 bg-rose-950/20'
                                  : isZero
                                  ? 'border-rose-900/60'
                                  : isLow
                                  ? 'border-amber-800/60'
                                  : 'border-[#1F2937]'
                              }`}
                            >
                              <div className="space-y-1">
                                <h4 className="font-bold text-white text-sm leading-tight">{p.nome}</h4>
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                                  <span className="px-2 py-0.5 bg-[#0B1220] border border-[#1F2937] rounded-md font-semibold text-slate-300">
                                    {p.categoria}
                                  </span>
                                  {p.nao_relevante && (
                                    <span className="px-2 py-0.5 bg-purple-950/40 text-purple-300 border border-purple-800/60 rounded-md font-semibold text-[10px]">
                                      Sem Est. Mínimo
                                    </span>
                                  )}
                                  {p.excluir_ao_zerar && (
                                    <span className="px-2 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-800/60 rounded-md font-semibold text-[10px]">
                                      Excluir ao Zerar
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-[#1F2937]">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                                    Estoque
                                  </span>
                                  <span
                                    className={`text-sm font-extrabold ${
                                      isNegative
                                        ? 'text-rose-400'
                                        : isZero
                                        ? 'text-rose-400'
                                        : isLow
                                        ? 'text-amber-400'
                                        : 'text-emerald-400'
                                    }`}
                                  >
                                    {p.estoque} un
                                  </span>
                                </div>

                                <div className="flex items-center space-x-1">
                                  {canPerform('edit_products') && (
                                    <button
                                      onClick={() => openEditModal(p)}
                                      className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-[#0B1220] transition"
                                      title="Editar Produto"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  )}

                                  {canPerform('delete_products') && (
                                    <button
                                      onClick={() => setDeleteProductCandidate(p)}
                                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#0B1220] transition"
                                      title="Excluir Produto"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Category Modal ("Criar Categoria") */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-[#111827] text-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#1F2937]">
            <div className="bg-[#0B1220] p-5 flex items-center justify-between border-b border-[#1F2937]">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Criar Nova Categoria</h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1F2937] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4 text-xs">
              {catError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{catError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Cabos & Adaptadores, Capas, Películas"
                  className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Cor do Ícone</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewCategoryColor(c.value)}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition ${
                        newCategoryColor === c.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                      }`}
                    >
                      {newCategoryColor === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Descrição (opcional)</label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Ex: Acessórios gerais de conectividade e carregamento"
                  className="w-full px-3.5 py-2 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* List of Existing Categories with Deletion Restriction */}
              <div className="pt-2">
                <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">
                  Categorias Atuais ({categories.length})
                </h4>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {categories.map((c, idx) => (
                    <div
                      key={c.id ? `${c.id}-${idx}` : `${c.nome}-${idx}`}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/80"
                    >
                      <span className="font-semibold text-slate-800">{c.nome}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id, c.nome)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition"
                >
                  Criar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteCategoryCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Excluir Categoria?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tem certeza que deseja excluir a categoria{' '}
              <span className="font-bold text-slate-800">"{deleteCategoryCandidate.nome}"</span>?
            </p>
            <div className="flex space-x-2 mt-5">
              <button
                onClick={() => setDeleteCategoryCandidate(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deleteProductCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Excluir Produto?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tem certeza que deseja excluir o produto{' '}
              <span className="font-bold text-slate-800">"{deleteProductCandidate.nome}"</span>?
            </p>
            <div className="flex space-x-2 mt-5">
              <button
                onClick={() => setDeleteProductCandidate(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-[#111827] text-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#1F2937] max-h-[92vh] flex flex-col">
            <div className="bg-[#0B1220] px-4 py-3 flex items-center justify-between border-b border-[#1F2937]">
              <div className="flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1F2937] text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              {successToastMsg && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-700/80 rounded-xl flex items-center space-x-2 text-emerald-300 font-semibold text-[11px] animate-pulse">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successToastMsg}</span>
                </div>
              )}

              {formError && (
                <div className="p-2.5 bg-rose-950/50 border border-rose-800 rounded-xl flex items-center space-x-2 text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-[11px]">{formError}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* 1. Categoria */}
                <div>
                  <label className="block text-slate-300 font-bold text-[11px] uppercase tracking-wider mb-1">
                    1. Categoria *
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-semibold"
                  >
                    {categories.map((c, idx) => (
                      <option key={c.id ? `${c.id}-${idx}` : `${c.nome}-${idx}`} value={c.nome} className="bg-[#0B1220] text-white">
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Nome do Produto */}
                <div className="relative">
                  <label className="block text-slate-300 font-bold text-[11px] uppercase tracking-wider mb-1">
                    2. Nome do Produto *
                  </label>
                  <input
                    ref={nomeInputRef}
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Película 9D Fosca iPhone 14 Pro Max"
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-medium"
                    required
                  />
                  {/* Smart Name Suggestions Autocomplete */}
                  {nome.trim().length >= 2 && !editingProduct && nameSuggestions.length > 0 && (
                    <div className="mt-1 bg-[#0B1220] border border-blue-500/40 rounded-xl p-2 space-y-1 shadow-xl max-h-36 overflow-y-auto">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Sugestões de produtos existentes:</span>
                      </div>
                      {nameSuggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setNome(s.nome)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#1E293B] transition flex items-center justify-between text-xs text-white"
                        >
                          <span className="font-medium text-blue-300">{s.nome}</span>
                          <span className="text-[10px] text-slate-400 bg-[#111827] px-2 py-0.5 rounded-md font-mono">
                            {s.categoria} ({s.estoque} un)
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Quantidade & 4. Estoque Mínimo */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-bold text-[11px] uppercase tracking-wider mb-1">
                      3. Quantidade *
                    </label>
                    <input
                      type="number"
                      value={estoque}
                      onChange={(e) => setEstoque(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold text-[11px] uppercase tracking-wider mb-1">
                      4. Estoque Mínimo *
                    </label>
                    <input
                      type="number"
                      value={naoRelevante ? 0 : estoqueMinimo}
                      onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
                      min="0"
                      disabled={naoRelevante}
                      className={`w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-bold ${
                        naoRelevante ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      required={!naoRelevante}
                    />
                    {/* Atalhos rápidos de Estoque Mínimo */}
                    {!naoRelevante && (
                      <div className="flex items-center space-x-1 mt-1.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Atalhos:</span>
                        {[1, 2, 3, 5, 10].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setEstoqueMinimo(val)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition ${
                              estoqueMinimo === val
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-[#0B1220] border-[#1F2937] text-slate-400 hover:text-white'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Opções do Produto (Compact ON/OFF Switches) */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                    5. Opções do Produto
                  </label>
                  <div className="bg-[#0B1220] p-2.5 rounded-xl border border-[#1F2937] space-y-2">
                    {/* Switch: Produto Não Relevante */}
                    <div className="flex items-center justify-between">
                      <div className="pr-2">
                        <span className="text-xs font-semibold text-white block">Produto não relevante</span>
                        <span className="text-[10px] text-slate-400 leading-tight block">Sem estoque mínimo fixo</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNaoRelevante(!naoRelevante)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          naoRelevante ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            naoRelevante ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Switch: Excluir ao Zerar */}
                    <div className="flex items-center justify-between border-t border-[#1F2937] pt-2">
                      <div className="pr-2">
                        <span className="text-xs font-semibold text-white block">Excluir ao zerar estoque</span>
                        <span className="text-[10px] text-slate-400 leading-tight block">Remove produto quando quantidade for 0</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExcluirAoZerar(!excluirAoZerar)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          excluirAoZerar ? 'bg-rose-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            excluirAoZerar ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Botões */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-2.5 bg-[#1F2937] hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-[#334155]"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cancelar</span>
                </button>

                <button
                  type="submit"
                  onClick={() => setSaveAndAddAnother(false)}
                  className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingProduct ? 'Salvar' : 'Salvar Produto'}</span>
                </button>

                {!editingProduct && (
                  <button
                    type="submit"
                    onClick={() => setSaveAndAddAnother(true)}
                    className="flex-1 py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20"
                    title="Salvar este produto e manter as opções preenchidas para criar o próximo rapidamente"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Salvar e Criar Outro</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fast Batch Registration Modal ("⚡ Cadastro Rápido (Lote)") */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-[#111827] text-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-blue-500/30 max-h-[92vh] flex flex-col">
            <div className="bg-[#0B1220] px-5 py-3.5 flex items-center justify-between border-b border-[#1F2937]">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-600/20 rounded-lg border border-blue-500/30">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Cadastro Rápido em Lote</h3>
                  <p className="text-[10px] text-slate-400">Cadastre múltiplos produtos de uma vez só cole os nomes em linhas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1F2937] text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBatchCreate} className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {batchSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-700/80 rounded-xl flex items-center space-x-2 text-emerald-300 font-semibold text-xs animate-pulse">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{batchSuccessMsg}</span>
                </div>
              )}

              {/* Category Profile Selection & Config Row */}
              <div className="bg-[#0B1220] p-3 rounded-xl border border-[#1F2937] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="block text-slate-300 font-bold text-[10px] uppercase tracking-wider mb-1">
                      Categoria *
                    </label>
                    <select
                      value={batchCategory}
                      onChange={(e) => handleBatchCategoryChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#111827] border border-[#1F2937] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                    >
                      {categories.map((c, idx) => (
                        <option key={c.id ? `${c.id}-${idx}` : `${c.nome}-${idx}`} value={c.nome} className="bg-[#111827] text-white">
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold text-[10px] uppercase tracking-wider mb-1">
                      Estoque Inicial *
                    </label>
                    <input
                      type="number"
                      value={batchInitialStock}
                      onChange={(e) => setBatchInitialStock(Number(e.target.value))}
                      min="0"
                      className="w-full px-2.5 py-1.5 bg-[#111827] border border-[#1F2937] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold text-[10px] uppercase tracking-wider mb-1">
                      Estoque Mínimo *
                    </label>
                    <input
                      type="number"
                      value={batchNaoRelevante ? 0 : batchMinStock}
                      onChange={(e) => setBatchMinStock(Number(e.target.value))}
                      min="0"
                      disabled={batchNaoRelevante}
                      className={`w-full px-2.5 py-1.5 bg-[#111827] border border-[#1F2937] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold ${
                        batchNaoRelevante ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Quick min stock pills for batch */}
                {!batchNaoRelevante && (
                  <div className="flex items-center space-x-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Atalhos Mínimo:</span>
                    {[1, 2, 3, 5, 10].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBatchMinStock(val)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                          batchMinStock === val
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-[#111827] border-[#1F2937] text-slate-400 hover:text-white'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}

                {/* Batch Profile Options */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F2937]/80">
                  <div className="flex items-center justify-between bg-[#111827] px-2.5 py-1.5 rounded-lg border border-[#1F2937]">
                    <span className="text-[11px] font-medium text-slate-300">Não relevante</span>
                    <button
                      type="button"
                      onClick={() => setBatchNaoRelevante(!batchNaoRelevante)}
                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        batchNaoRelevante ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          batchNaoRelevante ? 'translate-x-3' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-[#111827] px-2.5 py-1.5 rounded-lg border border-[#1F2937]">
                    <span className="text-[11px] font-medium text-slate-300">Excluir ao zerar</span>
                    <button
                      type="button"
                      onClick={() => setBatchExcluirAoZerar(!batchExcluirAoZerar)}
                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        batchExcluirAoZerar ? 'bg-rose-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          batchExcluirAoZerar ? 'translate-x-3' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Textarea for Multi-Product Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                    Nomes dos Produtos (1 por linha) *
                  </label>
                  {batchNamesText.trim().length > 0 && (
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-800/40">
                      📦 {batchNamesText.split('\n').filter((l) => l.trim().length > 0).length} produto(s) detectado(s)
                    </span>
                  )}
                </div>
                <textarea
                  ref={batchTextareaRef}
                  value={batchNamesText}
                  onChange={(e) => setBatchNamesText(e.target.value)}
                  rows={6}
                  placeholder={`Cole ou digite os nomes dos produtos, um por linha. Exemplo:\nCapinha iPhone 15 Silicone\nCapinha iPhone 15 Pro Max Transparente\nCapinha iPhone 14 MagSafe\nPelícula 3D iPhone 13`}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="py-2.5 px-4 bg-[#1F2937] hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-[#334155]"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cancelar</span>
                </button>

                <button
                  type="submit"
                  disabled={batchLoading || batchNamesText.trim().length === 0}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>
                    {batchLoading
                      ? 'Cadastrando lote...'
                      : `Cadastrar em Lote (${
                          batchNamesText.split('\n').filter((l) => l.trim().length > 0).length
                        } Itens)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
