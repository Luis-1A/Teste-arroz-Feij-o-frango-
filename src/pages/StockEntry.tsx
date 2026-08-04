import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { Product, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  PackagePlus,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowDownLeft,
  Calendar,
  User as UserIcon,
  Layers,
  Package,
  Plus,
  ChevronRight,
  Check
} from 'lucide-react';

export const StockEntry: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [quantidadeRecebida, setQuantidadeRecebida] = useState<number>(10);
  const [observacao, setObservacao] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Subscribe to products and categories directly from Firestore / DB
  useEffect(() => {
    const unsubProds = firestoreSync.subscribeProducts((prods) => {
      setProducts(prods || []);
      if (selectedProduct) {
        const updated = (prods || []).find(p => p.id === selectedProduct.id);
        if (updated) setSelectedProduct(updated);
      }
    });

    const unsubCats = firestoreSync.subscribeCategories((cats) => {
      setCategories(cats || []);
    });

    return () => {
      unsubProds();
      unsubCats();
    };
  }, [selectedProduct?.id]);

  // Categories extracted strictly from registered database categories and existing DB products
  const categoryList = useMemo(() => {
    const categoryMap = new Map<string, string>(); // lowercase key -> formatted display name
    
    // Add registered DB categories
    categories.forEach(c => {
      if (c.nome && c.nome.trim()) {
        const trimmed = c.nome.trim();
        categoryMap.set(trimmed.toLowerCase(), trimmed);
      }
    });

    // Also include categories from DB products
    products.forEach(p => {
      if (p.categoria && p.categoria.trim()) {
        const trimmed = p.categoria.trim();
        const key = trimmed.toLowerCase();
        if (!categoryMap.has(key)) {
          categoryMap.set(key, trimmed);
        }
      }
    });

    return Array.from(categoryMap.values()).map(catName => {
      const count = products.filter(p => (p.categoria || '').trim().toLowerCase() === catName.toLowerCase()).length;
      return {
        nome: catName,
        count
      };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [categories, products]);

  // Filter products by selected category and optional search term
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter(p => {
      const matchesCategory = (p.categoria || '').toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = !searchTerm || (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleAddQuantity = (num: number) => {
    setQuantidadeRecebida(prev => Math.max(1, (prev || 0) + num));
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedProduct) {
      setErrorMsg('Selecione um produto para adicionar a entrada de estoque.');
      return;
    }

    if (!quantidadeRecebida || quantidadeRecebida <= 0) {
      setErrorMsg('Informe uma quantidade válida maior que zero.');
      return;
    }

    setLoading(true);
    try {
      const updatedProduct = await api.addStockEntry(selectedProduct.id, quantidadeRecebida, observacao);
      setSuccessMsg(
        `Entrada confirmada! Adicionadas +${quantidadeRecebida} un ao produto "${updatedProduct.nome}". Novo estoque total: ${updatedProduct.estoque} un.`
      );
      setSelectedProduct(updatedProduct);
      setQuantidadeRecebida(10);
      setObservacao('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar entrada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
          <PackagePlus className="w-6 h-6 text-blue-400" />
          <span>Entrada de Estoque</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Selecione a categoria, escolha o produto e informe a quantidade recebida.
        </p>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/80 rounded-xl flex items-start space-x-2.5 text-emerald-300 text-xs font-medium shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs font-medium shadow-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* BLOCO 1 — CATEGORIA */}
      <div className="bg-[#111827] p-4 sm:p-5 rounded-2xl border border-[#1F2937] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              1. Selecionar Categoria
            </h3>
          </div>
          {selectedCategory && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedProduct(null);
                setSearchTerm('');
              }}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-bold transition-colors"
            >
              Limpar Seleção
            </button>
          )}
        </div>

        {categoryList.length === 0 ? (
          <div className="p-4 text-center bg-[#0B1220] border border-dashed border-[#1F2937] rounded-xl text-xs text-slate-400 font-medium">
            Nenhuma categoria cadastrada no banco de dados.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {categoryList.map(cat => {
              const isSelected = selectedCategory?.toLowerCase() === cat.nome.toLowerCase();
              return (
                <button
                  key={cat.nome}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.nome);
                    setSelectedProduct(null);
                    setSearchTerm('');
                    setErrorMsg('');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/50'
                      : 'bg-[#0B1220] hover:bg-[#1E293B] border-[#1F2937] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs truncate">{cat.nome}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium">
                    {cat.count} {cat.count === 1 ? 'produto' : 'produtos'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* BLOCO 2 — LISTA DE PRODUTOS DA CATEGORIA */}
      {selectedCategory && !selectedProduct && (
        <div className="bg-[#111827] p-4 sm:p-5 rounded-2xl border border-[#1F2937] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Package className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                2. Produtos em <span className="text-blue-400">{selectedCategory}</span>
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {categoryProducts.length} itens encontrados
            </span>
          </div>

          {/* Search bar inside category */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={`Filtrar produto em ${selectedCategory}...`}
              className="w-full pl-10 pr-4 py-2 text-xs border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-[#0B1220] text-white placeholder-slate-400 font-medium"
            />
          </div>

          {categoryProducts.length === 0 ? (
            <div className="p-6 text-center bg-[#0B1220] border border-dashed border-[#1F2937] rounded-xl">
              <p className="text-xs text-slate-400 font-medium">
                Nenhum produto cadastrado nesta categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {categoryProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="p-3 rounded-xl border border-[#1F2937] bg-[#0B1220] hover:bg-[#1E293B] cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                      <span>📦</span>
                      <span className="truncate">{p.nome}</span>
                    </p>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium flex items-center gap-2">
                      <span>Estoque: <strong className="text-slate-200">{p.estoque} un</strong></span>
                      <span>•</span>
                      <span>{p.categoria}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BLOCO 3 — PRODUTO SELECIONADO */}
      {selectedProduct && (
        <div className="bg-[#111827] p-4 sm:p-5 rounded-2xl border border-[#1F2937] shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                3. Produto Selecionado
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-bold transition-colors"
            >
              Trocar Produto
            </button>
          </div>

          <div className="p-3.5 bg-[#0B1220] border border-blue-500/40 rounded-xl text-xs flex items-center justify-between">
            <div>
              <p className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>📦</span>
                <span>{selectedProduct.nome}</span>
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Categoria: <strong className="text-slate-300">{selectedProduct.categoria}</strong>
              </p>
            </div>
            <div className="text-right bg-[#1E293B] px-3 py-1.5 rounded-lg border border-[#374151]">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Estoque Atual</span>
              <span className="font-black text-sm text-blue-400">{selectedProduct.estoque} un</span>
            </div>
          </div>

          <form onSubmit={handleSubmitEntry} className="space-y-4 pt-2">
            {/* BLOCO 4 — QUANTIDADE */}
            <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1F2937] space-y-3">
              <label className="block text-xs font-extrabold text-white uppercase tracking-wider">
                4. Quantidade Recebida
              </label>

              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  required
                  min={1}
                  value={quantidadeRecebida || ''}
                  onChange={e => setQuantidadeRecebida(Number(e.target.value))}
                  className="w-32 px-4 py-2.5 text-center text-xl font-black border border-[#1F2937] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#111827] text-white"
                />

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 5, 10, 20].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleAddQuantity(num)}
                      className="px-3 py-2 bg-[#1E293B] hover:bg-[#334155] active:scale-95 text-xs font-bold text-slate-200 rounded-xl border border-[#374151] transition-all flex items-center space-x-0.5"
                    >
                      <Plus className="w-3 h-3 text-blue-400" />
                      <span>{num}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-emerald-400 font-semibold pt-1">
                Novo estoque projetado: <strong>{selectedProduct.estoque + (quantidadeRecebida || 0)} unidades</strong>
              </div>
            </div>

            {/* BLOCO 5 — OBSERVAÇÃO */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                5. Observação (opcional)
              </label>
              <input
                type="text"
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                placeholder="Ex: Recebimento do fornecedor..."
                className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#1F2937] text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
              />
            </div>

            {/* Responsável e Data Info */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
              <span className="flex items-center space-x-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Responsável: <strong className="text-slate-300">{user?.nome}</strong></span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date().toLocaleDateString('pt-BR')}</span>
              </span>
            </div>

            {/* BLOCO 6 — BOTÃO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{loading ? 'Registrando...' : 'Registrar Entrada'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
