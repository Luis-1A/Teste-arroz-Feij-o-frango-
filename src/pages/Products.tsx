import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
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
  Check
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
  const [marca, setMarca] = useState('Padrão');
  const [estoque, setEstoque] = useState<number>(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(5);
  const [naoRelevante, setNaoRelevante] = useState<boolean>(false);
  const [observacao, setObservacao] = useState('');
  const [formError, setFormError] = useState('');

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

  const openAddModal = () => {
    setEditingProduct(null);
    setNome('');
    setCategoria(categories[0]?.nome || 'Geral');
    setMarca('Padrão');
    setEstoque(10);
    setEstoqueMinimo(5);
    setNaoRelevante(false);
    setObservacao('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setNome(p.nome);
    setCategoria(p.categoria);
    setMarca(p.marca || 'Padrão');
    setEstoque(p.estoque);
    setEstoqueMinimo(p.estoque_minimo || 5);
    setNaoRelevante(Boolean(p.nao_relevante));
    setObservacao(p.observacao || '');
    setFormError('');
    setIsModalOpen(true);
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
          observacao
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar produto.');
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
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            <span>Estoque Central</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organização por categorias com visualização limpa e pastas sanfonadas.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setCatError('');
              setIsCategoryModalOpen(true);
            }}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-2xs"
          >
            <FolderPlus className="w-4 h-4 text-orange-500" />
            <span>+ Criar Categoria</span>
          </button>

          {canPerform('edit_products') && (
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:opacity-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-500/20 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Produto</span>
            </button>
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
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 italic text-xs">
            Carregando produtos do estoque...
          </div>
        ) : Object.keys(groupedProducts).length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-medium">
            Nenhum produto encontrado.
          </div>
        ) : (
          Object.entries(groupedProducts).map(([catName, prods]: [string, Product[]]) => {
            const isCollapsed = collapsedCategories[catName];
            const meta = getCategoryMeta(catName);

            return (
              <div
                key={catName}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Folder Accordion Header */}
                <div
                  onClick={() => toggleCategoryCollapse(catName)}
                  className="p-4 bg-slate-900 text-white flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none"
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
                        <span className="px-2.5 py-0.5 bg-white/10 text-slate-200 text-[10px] rounded-full font-mono font-bold">
                          {prods.length} {prods.length === 1 ? 'item' : 'itens'}
                        </span>
                      </h3>
                      {meta.descricao && (
                        <p className="text-[11px] text-slate-400 font-normal mt-0.5">{meta.descricao}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline">
                      {isCollapsed ? 'Abrir Pasta' : 'Fechar Pasta'}
                    </span>
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </div>
                </div>

                {/* Folder Contents (Product Cards List) */}
                {!isCollapsed && (
                  <div className="p-4 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {prods.map((p) => {
                        const isZero = p.estoque === 0;
                        const isNegative = p.estoque < 0;
                        const isLow = !p.nao_relevante && p.estoque > 0 && p.estoque <= (p.estoque_minimo || 5);

                        return (
                          <div
                            key={p.id}
                            className={`p-4 rounded-xl border bg-white transition hover:shadow-md flex flex-col justify-between space-y-3 ${
                              isNegative
                                ? 'border-rose-300 bg-rose-50/20'
                                : isZero
                                ? 'border-rose-200'
                                : isLow
                                ? 'border-amber-200'
                                : 'border-slate-200/80'
                            }`}
                          >
                            <div className="space-y-1">
                              <h4 className="font-bold text-slate-900 text-sm leading-tight">{p.nome}</h4>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                                <span className="px-2 py-0.5 bg-slate-100 rounded-md font-semibold text-slate-600">
                                  {p.categoria}
                                </span>
                                {p.nao_relevante && (
                                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-md font-semibold text-[10px]">
                                    Sem Est. Mínimo
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                                  Estoque
                                </span>
                                <span
                                  className={`text-sm font-extrabold ${
                                    isNegative
                                      ? 'text-rose-600'
                                      : isZero
                                      ? 'text-rose-600'
                                      : isLow
                                      ? 'text-amber-600'
                                      : 'text-emerald-700'
                                  }`}
                                >
                                  {p.estoque} un
                                </span>
                              </div>

                              <div className="flex items-center space-x-1">
                                {canPerform('edit_products') && (
                                  <button
                                    onClick={() => openEditModal(p)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                    title="Editar Produto"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}

                                {canPerform('delete_products') && (
                                  <button
                                    onClick={() => setDeleteProductCandidate(p)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-[#111827] text-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#1F2937] max-h-[90vh] flex flex-col">
            <div className="bg-[#0B1220] p-5 flex items-center justify-between border-b border-[#1F2937]">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#1F2937] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl flex items-center space-x-2 text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Cabo USB-C Turbo 65W Nylon 1m"
                    className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Categoria *</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#1F2937] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {categories.map((c, idx) => (
                      <option key={c.id ? `${c.id}-${idx}` : `${c.nome}-${idx}`} value={c.nome} className="bg-[#0B1220] text-white">
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checkbox Produto Nao Relevante */}
                <div className="p-3 bg-[#0B1220] border border-[#1F2937] rounded-xl flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="nao_relevante_chk"
                    checked={naoRelevante}
                    onChange={(e) => setNaoRelevante(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-[#1F2937] focus:ring-blue-500 bg-[#111827] shrink-0 cursor-pointer"
                  />
                  <label htmlFor="nao_relevante_chk" className="text-xs cursor-pointer select-none">
                    <span className="font-bold text-white block">Produto não relevante</span>
                    <span className="text-[11px] text-slate-400">Este produto não possui estoque mínimo.</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Estoque Inicial (UN) *</label>
                    <input
                      type="number"
                      value={estoque}
                      onChange={(e) => setEstoque(Number(e.target.value))}
                      min="0"
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Estoque Mínimo *</label>
                    <input
                      type="number"
                      value={naoRelevante ? 0 : estoqueMinimo}
                      onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
                      min="0"
                      disabled={naoRelevante}
                      className={`w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold ${
                        naoRelevante ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      required={!naoRelevante}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
