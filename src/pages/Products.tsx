import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { Product, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import {
  Search,
  Plus,
  Filter,
  Camera,
  Edit2,
  Trash2,
  X,
  Boxes,
  Check,
  AlertCircle,
  MapPin,
  Tag,
  Barcode,
  Layers,
  RotateCcw,
  Copy,
  FolderPlus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const Products: React.FC = () => {
  const { canPerform } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Scanner modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Add/Edit Product Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Management Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [catError, setCatError] = useState('');

  // Copy product name state
  const [copiedProdId, setCopiedProdId] = useState<string | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [estoque, setEstoque] = useState<number>(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(5);
  const [localizacao, setLocalizacao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal
  const [deleteProductCandidate, setDeleteProductCandidate] = useState<Product | null>(null);

  // Collapsed Category Accordions State
  const [collapsedCategories, setCollapsedCategories] = useState<{ [catName: string]: boolean }>({});

  useEffect(() => {
    setLoading(true);
    const unsubProds = firestoreSync.subscribeProducts((allProds) => {
      let filtered = allProds.filter((p) => p.ativo);
      if (selectedCategory && selectedCategory !== 'Todas') {
        filtered = filtered.filter((p) => p.categoria === selectedCategory);
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.nome.toLowerCase().includes(term) ||
            p.marca.toLowerCase().includes(term) ||
            p.codigo.toLowerCase().includes(term) ||
            p.localizacao.toLowerCase().includes(term) ||
            (p.codigo_barras && p.codigo_barras.toLowerCase().includes(term))
        );
      }
      setProducts(filtered);
      setLoading(false);
    });

    const unsubCats = firestoreSync.subscribeCategories((cats) => {
      setCategories(cats);
    });

    return () => {
      unsubProds();
      unsubCats();
    };
  }, [searchTerm, selectedCategory]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: { [catName: string]: Product[] } = {};
    for (const p of products) {
      const cat = p.categoria || 'Sem Categoria';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [products]);

  const copyProductName = (p: Product) => {
    navigator.clipboard.writeText(p.nome);
    setCopiedProdId(p.id);
    setTimeout(() => setCopiedProdId(null), 2000);
  };

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    if (!newCategoryName.trim()) {
      setCatError('Digite o nome da nova categoria.');
      return;
    }
    try {
      await firestoreSync.createCategory(newCategoryName.trim());
      setNewCategoryName('');
    } catch (err: any) {
      setCatError(err.message || 'Erro ao criar categoria.');
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (window.confirm(`Excluir a categoria "${catName}"?`)) {
      try {
        await firestoreSync.deleteCategory(catId);
      } catch (err: any) {
        alert(err.message || 'Erro ao remover categoria.');
      }
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setNome('');
    setCategoria(categories[0]?.nome || 'Acessórios e Cabos');
    setMarca('');
    setCodigo(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
    setCodigoBarras('');
    setEstoque(10);
    setEstoqueMinimo(5);
    setLocalizacao('Prateleira A1');
    setObservacao('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setNome(p.nome);
    setCategoria(p.categoria);
    setMarca(p.marca);
    setCodigo(p.codigo);
    setCodigoBarras(p.codigo_barras || '');
    setEstoque(p.estoque);
    setEstoqueMinimo(p.estoque_minimo);
    setLocalizacao(p.localizacao);
    setObservacao(p.observacao || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nome || !categoria || !marca || !codigo || estoque === undefined || estoqueMinimo === undefined || !localizacao) {
      setFormError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          nome,
          categoria,
          marca,
          codigo,
          codigo_barras: codigoBarras,
          estoque: Number(estoque),
          estoque_minimo: Number(estoqueMinimo),
          localizacao,
          observacao
        });
      } else {
        await api.createProduct({
          nome,
          categoria,
          marca,
          codigo,
          codigo_barras: codigoBarras,
          estoque: Number(estoque),
          estoque_minimo: Number(estoqueMinimo),
          localizacao,
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
      setProducts(prev => prev.filter(p => p.id !== targetId));
      await api.deleteProduct(targetId);
      setDeleteProductCandidate(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir produto.');
    }
  };

  const handleScanSuccess = (product: Product) => {
    setSearchTerm(product.codigo_barras || product.codigo);
  };

  const handleZeroAllStock = async () => {
    if (window.confirm('⚠️ Tem certeza que deseja ZERAR O ESTOQUE de TODOS os produtos? As quantidades passarão para 0 UN.')) {
      setLoading(true);
      await firestoreSync.zeroAllProductsStock();
      setLoading(false);
      alert('Estoque de todos os produtos foi zerado com sucesso!');
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('🧹 ZERAR ESTOQUE E LIMPAR TUDO?\n\nIsso zerará a quantidade em estoque de todos os produtos E removerá o histórico de movimentações e demandas temporárias.')) {
      setLoading(true);
      await firestoreSync.clearAllDataAndResetStock();
      setLoading(false);
      alert('Estoque zerado e todas as movimentações foram limpas com sucesso!');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-blue-600" />
            <span>Controle de Estoque Físico</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Divisão por categorias com cópia rápida de nome e gerenciamento de categorias.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
            title="Criar e gerenciar categorias de produtos"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>+ Criar Categorias</span>
          </button>

          <button
            onClick={handleZeroAllStock}
            className="px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            title="Zerar a quantidade em estoque de todos os produtos"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Zerar Estoque</span>
          </button>

          <button
            onClick={handleClearAllData}
            className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            title="Zerar estoques e apagar histórico de movimentações"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Limpar Tudo</span>
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <Camera className="w-4 h-4 text-slate-600" />
            <span>Ler Barcode</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Search & Dynamic Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Dynamic Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, marca, código ou local..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 focus:bg-white font-medium transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 text-slate-700 font-semibold w-full md:w-auto"
          >
            <option value="Todas">Todas as Categorias ({products.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grouped Products List by Category */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 italic text-xs">
            Carregando produtos e estoque...
          </div>
        ) : Object.keys(groupedProducts).length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-medium">
            Nenhum produto encontrado com os filtros selecionados.
          </div>
        ) : (
          Object.entries(groupedProducts).map(([catName, prods]) => {
            const isCollapsed = collapsedCategories[catName];

            return (
              <div key={catName} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                {/* Category Header Bar */}
                <div
                  onClick={() => toggleCategoryCollapse(catName)}
                  className="bg-slate-900 text-white p-4 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs tracking-wide flex items-center space-x-2">
                        <span>{catName}</span>
                        <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 text-[10px] rounded-full font-mono font-bold">
                          {prods.length} {prods.length === 1 ? 'produto' : 'produtos'}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="text-[10px] uppercase tracking-wider font-bold hidden sm:inline">
                      {isCollapsed ? 'Expandir' : 'Recolher'}
                    </span>
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>

                {/* Category Products Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="p-3.5">Nome do Produto & Copiar</th>
                          <th className="p-3.5">Marca</th>
                          <th className="p-3.5">Código / Barcode</th>
                          <th className="p-3.5 text-center">Estoque Atual</th>
                          <th className="p-3.5">Localização</th>
                          <th className="p-3.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {prods.map(p => {
                          const isZero = p.estoque === 0;
                          const isLow = p.estoque > 0 && p.estoque <= p.estoque_minimo;
                          const isCopied = copiedProdId === p.id;

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                              {/* Name with Copy Option */}
                              <td className="p-3.5">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {p.nome}
                                  </span>
                                  <button
                                    onClick={() => copyProductName(p)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 ${
                                      isCopied
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 border border-slate-200'
                                    }`}
                                    title="Copiar nome do produto"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Copiado!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Brand */}
                              <td className="p-3.5 text-slate-600 font-medium">
                                <span className="inline-flex items-center space-x-1">
                                  <Tag className="w-3 h-3 text-slate-400" />
                                  <span>{p.marca}</span>
                                </span>
                              </td>

                              {/* Code & Barcode */}
                              <td className="p-3.5 font-mono text-[11px]">
                                <div className="font-bold text-slate-800">{p.codigo}</div>
                                {p.codigo_barras && (
                                  <div className="text-slate-400 text-[10px] flex items-center space-x-1 mt-0.5">
                                    <Barcode className="w-3 h-3" />
                                    <span>{p.codigo_barras}</span>
                                  </div>
                                )}
                              </td>

                              {/* Quantity Badge */}
                              <td className="p-3.5 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span
                                    className={`px-3 py-1 rounded-full font-bold text-xs ${
                                      isZero
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : isLow
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {p.estoque} un
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                    Mín: {p.estoque_minimo}
                                  </span>
                                </div>
                              </td>

                              {/* Location */}
                              <td className="p-3.5">
                                <div className="flex items-center space-x-1 text-slate-600">
                                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span className="font-semibold">{p.localizacao}</span>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  {canPerform('edit_products') && (
                                    <button
                                      onClick={() => openEditModal(p)}
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      title="Editar Produto"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  )}

                                  {canPerform('delete_products') && (
                                    <button
                                      onClick={() => setDeleteProductCandidate(p)}
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                      title="Excluir Produto"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Category Creation & Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Gerenciar & Criar Categorias</h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Form to Add New Category */}
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <label className="block font-bold text-slate-700">Nova Categoria de Produtos</label>
                {catError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{catError}</span>
                  </div>
                )}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Capas Premium, Fontes GaN, Caixas de Som"
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-md shrink-0"
                  >
                    Criar
                  </button>
                </div>
              </form>

              {/* List of Existing Categories */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">
                  Categorias Existentes ({categories.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {categories.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100 transition"
                    >
                      <span className="font-semibold text-slate-800">{c.nome}</span>
                      <button
                        onClick={() => handleDeleteCategory(c.id, c.nome)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remover Categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onScanSuccess={handleScanSuccess}
      />

      {/* Delete Product Confirmation Modal */}
      {deleteProductCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Excluir Produto?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tem certeza que deseja excluir o produto <span className="font-bold text-slate-800 font-mono">"{deleteProductCandidate.nome}"</span>?
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  {editingProduct ? 'Editar Produto do Estoque' : 'Cadastrar Novo Produto'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Ex: Cabo USB-C Turbo 65W Nylon 1m"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoria *</label>
                  <select
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.nome}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Marca / Fabricante *</label>
                  <input
                    type="text"
                    value={marca}
                    onChange={e => setMarca(e.target.value)}
                    placeholder="Ex: Baseus, Anker, Samsung"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Código Interno *</label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={e => setCodigo(e.target.value)}
                    placeholder="PROD-1020"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Código de Barras (Barcode)</label>
                  <input
                    type="text"
                    value={codigoBarras}
                    onChange={e => setCodigoBarras(e.target.value)}
                    placeholder="7891234567890"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Quantidade em Estoque (UN) *</label>
                  <input
                    type="number"
                    value={estoque}
                    onChange={e => setEstoque(Number(e.target.value))}
                    min="0"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estoque Mínimo de Alerta *</label>
                  <input
                    type="number"
                    value={estoqueMinimo}
                    onChange={e => setEstoqueMinimo(Number(e.target.value))}
                    min="1"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Localização no Almoxarifado *</label>
                  <input
                    type="text"
                    value={localizacao}
                    onChange={e => setLocalizacao(e.target.value)}
                    placeholder="Ex: Prateleira B3 • Corredor 2"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Observações Internas</label>
                  <textarea
                    value={observacao}
                    onChange={e => setObservacao(e.target.value)}
                    rows={2}
                    placeholder="Notas técnicas ou detalhes adicionais..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
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
