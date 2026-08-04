import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { Product, CustomerDemand } from '../types';
import { smartMatch } from '../utils/searchUtils';
import {
  UserX,
  Search,
  CheckCircle2,
  AlertTriangle,
  PackageX,
  PlusCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  PackageCheck,
  ArrowRight,
  Trash2,
  Clock,
  Layers,
  HelpCircle,
  Building2,
  Check
} from 'lucide-react';

interface CustomerDemandPageProps {
  onNavigateToProducts?: () => void;
  onNavigateToEntry?: () => void;
}

export const CustomerDemandPage: React.FC<CustomerDemandPageProps> = ({
  onNavigateToProducts,
  onNavigateToEntry
}) => {
  const [demands, setDemands] = useState<CustomerDemand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [inputValue, setInputValue] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Confirmation Modal for Physical Discrepancy (Stock > 0)
  const [confirmationModal, setConfirmationModal] = useState<{
    open: boolean;
    product: Product | null;
    message: string;
  }>({
    open: false,
    product: null,
    message: ''
  });

  // Modal to register new unregistered product directly
  const [newProductModal, setNewProductModal] = useState<{
    open: boolean;
    demand: CustomerDemand | null;
  }>({
    open: false,
    demand: null
  });

  const [newProdForm, setNewProdForm] = useState({
    nome: '',
    categoria: '',
    marca: '',
    codigo: '',
    estoque: 0,
    estoque_minimo: 5,
    observacao: ''
  });

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Filter & tab state
  const [activeTab, setActiveTab] = useState<'nao_cadastrados' | 'cadastrados_sem_estoque'>('nao_cadastrados');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDemandCandidate, setDeleteDemandCandidate] = useState<CustomerDemand | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubDemands = firestoreSync.subscribeDemands((dems) => {
      setDemands(dems || []);
      setLoading(false);
    });
    const unsubProds = firestoreSync.subscribeProducts((prods) => {
      setProducts(prods || []);
    });
    const unsubCats = firestoreSync.subscribeCategories((cats) => {
      const names = Array.from(new Set((cats || []).map((c) => (c?.nome || '').trim()).filter(Boolean)));
      setCategories(names);
    });

    return () => {
      unsubDemands();
      unsubProds();
      unsubCats();
    };
  }, []);

  // Filtered autocomplete options using smartMatch
  const autocompleteSuggestions = inputValue.trim().length > 0
    ? products.filter(
        p => smartMatch(p.nome, inputValue) || smartMatch(p.marca || '', inputValue)
      ).slice(0, 5)
    : [];

  const handleSelectAutocomplete = (product: Product) => {
    setSelectedProduct(product);
    setInputValue(product.nome);
    setShowAutocomplete(false);
  };

  const handleSubmitDemand = async (e?: React.FormEvent, confirmError = false) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) {
      setFeedback({
        type: 'warning',
        text: 'Por favor, informe o nome do produto que o cliente procurou.'
      });
      return;
    }

    setProcessing(true);
    setFeedback(null);

    try {
      const res = await api.registerCustomerDemand({
        produto_nome: inputValue.trim(),
        produto_id: selectedProduct?.id,
        solicitante_nome: 'Atendimento / Balcão',
        confirmou_erro_contagem: confirmError
      });

      if (res.status_code === 'EXISTS_HAS_STOCK_AWAITING_CONFIRMATION') {
        // Open confirmation modal
        setConfirmationModal({
          open: true,
          product: res.product || selectedProduct,
          message: res.message
        });
        setProcessing(false);
        return;
      }

      // Action succeeded
      setConfirmationModal({ open: false, product: null, message: '' });
      setInputValue('');
      setSelectedProduct(null);

      const response = res as any;
      if (response.status_code === 'EXISTS_STOCK_ZEROED') {
        setFeedback({
          type: 'warning',
          text: response.message
        });
      } else if (response.status_code === 'NOT_REGISTERED_SAVED') {
        setFeedback({
          type: 'info',
          text: response.message
        });
      } else {
        setFeedback({
          type: 'success',
          text: response.message
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Erro ao registrar procura do cliente.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteDemandConfirm = async () => {
    if (!deleteDemandCandidate) return;
    try {
      await api.deleteCustomerDemand(deleteDemandCandidate.id);
      setDemands(prev => prev.filter(d => d.id !== deleteDemandCandidate.id));
      setFeedback({
        type: 'success',
        text: 'Registro removido com sucesso.'
      });
      setDeleteDemandCandidate(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao deletar registro.');
    }
  };

  const handleOpenRegisterProductModal = (demand: CustomerDemand) => {
    setNewProdForm({
      nome: demand.produto_nome,
      categoria: categories[0] || 'Geral',
      marca: 'A definir',
      codigo: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      estoque: 0,
      estoque_minimo: 5,
      observacao: `Produto cadastrado a partir de ${demand.quantidade_solicitacoes} solicitação(ões) de cliente(s).`
    });
    setNewProductModal({ open: true, demand });
  };

  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        ...newProdForm,
        ativo: true
      });

      if (newProductModal.demand) {
        await api.deleteCustomerDemand(newProductModal.demand.id);
      }

      setNewProductModal({ open: false, demand: null });
      setFeedback({
        type: 'success',
        text: `Produto "${newProdForm.nome}" cadastrado com sucesso no estoque!`
      });
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar produto.');
    }
  };

  const unregisteredDemands = demands.filter(d => !d.cadastrado);
  const registeredNoStockDemands = demands.filter(d => d.cadastrado);

  const filteredDemands = (
    activeTab === 'nao_cadastrados' ? unregisteredDemands : registeredNoStockDemands
  ).filter(d => !searchTerm.trim() || smartMatch(d.produto_nome, searchTerm));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">Carregando solicitações de clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-rose-500/20 px-3 py-1 rounded-full text-rose-300 text-xs font-medium mb-2 border border-rose-500/30">
              <UserX className="w-3.5 h-3.5 text-rose-400" />
              <span>Módulo: Cliente Veio Comprar e Não Tinha</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Procura de Clientes & Demanda</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Acompanhe a demanda não atendida na loja. Registre rapidamente o que o cliente procurou para atualizar o estoque físico e identificar novos produtos de alta procura.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-center px-4">
              <span className="text-2xl font-black text-rose-400 block leading-tight">
                {unregisteredDemands.reduce((acc, d) => acc + d.quantidade_solicitacoes, 0)}
              </span>
              <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
                Procuras Não Cadastadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ultra-Fast Quick Registration Box */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registrar Procura de Cliente</h3>
              <p className="text-[11px] text-slate-500">
                Digite o nome do produto procurado. O sistema verifica o estoque automaticamente em 1 clique.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={e => handleSubmitDemand(e, false)} className="relative space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ex: Capa Transparente iPhone 15, Carregador Turbo 20W..."
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  setSelectedProduct(null);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                className="w-full pl-10 pr-4 py-3 bg-[#0B1220] border border-[#1F2937] rounded-2xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              />

              {/* Autocomplete Dropdown */}
              {showAutocomplete && autocompleteSuggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-[#111827] border border-[#1F2937] rounded-2xl shadow-xl overflow-hidden divide-y divide-[#1F2937]">
                  <div className="p-2 bg-[#0B1220] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Produtos Cadastrados Sugeridos
                  </div>
                  {autocompleteSuggestions.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectAutocomplete(p)}
                      className="w-full p-3 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{p.nome}</p>
                        <p className="text-[10px] text-slate-400">
                          CÓD: {p.codigo} • {p.categoria}
                        </p>
                      </div>
                      <span
                        className={`font-black px-2 py-0.5 rounded-lg text-[10px] ${
                          p.estoque > 0
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {p.estoque > 0 ? `${p.estoque} un em estoque` : 'Sem estoque (0 un)'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={processing || !inputValue.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center space-x-2 shrink-0 active:scale-95 disabled:opacity-50"
            >
              {processing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UserX className="w-4 h-4" />
              )}
              <span>Registrar Ocorrência</span>
            </button>
          </div>
        </form>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : feedback.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : feedback.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
              {feedback.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />}
              {feedback.type === 'info' && <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />}
              {feedback.type === 'error' && <PackageX className="w-4 h-4 shrink-0 text-rose-600" />}
              <span className="font-semibold">{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-[11px] font-bold underline ml-3 shrink-0"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Physical Stock Error (Stock > 0) */}
      {confirmationModal.open && confirmationModal.product && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Atenção: Produto Consta com Estoque no Sistema
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {confirmationModal.message}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <p className="font-bold text-slate-800">{confirmationModal.product.nome}</p>
              <p className="text-slate-500 text-[11px]">
                CÓDIGO: <span className="font-mono">{confirmationModal.product.codigo}</span>
              </p>
              <p className="text-slate-500 text-[11px]">
                Estoque Cadastrado: <strong className="text-emerald-700">{confirmationModal.product.estoque} unidades</strong>
              </p>
            </div>

            <p className="text-[11px] text-amber-800 font-medium bg-amber-50 p-3 rounded-xl border border-amber-200/80">
              Caso confirme que o produto <strong>não foi encontrado fisicamente</strong>, o sistema atualizará o estoque automaticamente para <strong>0 unidades</strong> e registrará no histórico de correções.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSubmitDemand(undefined, true)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Sim, Não Foi Encontrado (Zerar Estoque)
              </button>
              <button
                type="button"
                onClick={() => setConfirmationModal({ open: false, product: null, message: '' })}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('nao_cadastrados')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'nao_cadastrados'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackageX className="w-4 h-4" />
              <span>Produtos Não Cadastrados ({unregisteredDemands.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cadastrados_sem_estoque')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'cadastrados_sem_estoque'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Cadastrados Sem Estoque ({registeredNoStockDemands.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar solicitação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Produtos Não Cadastrados Solicitados Por Clientes */}
      {activeTab === 'nao_cadastrados' && (
        <div className="space-y-4">
          <div className="bg-rose-50/70 border border-rose-200/80 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-950">
                  Lista de Produtos Não Cadastrados Solicitados por Clientes
                </h4>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Estes itens não existem no estoque da loja, mas foram procurados por clientes. O administrador pode decidir cadastrá-los para começar a vendê-los.
                </p>
              </div>
            </div>
          </div>

          {filteredDemands.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs text-center py-12">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">
                Nenhum produto não cadastrado na lista
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Quando um cliente procurar um produto que ainda não existe na loja, use o campo acima para registrá-lo.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Produto Solicitado</th>
                      <th className="py-3 px-4 text-center">Procuras do Cliente</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Última Solicitação</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDemands.map(demand => (
                      <tr key={demand.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {demand.produto_nome}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 font-extrabold px-3 py-1 rounded-xl text-xs bg-rose-100 text-rose-800 border border-rose-200">
                            <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                            <span>{demand.quantidade_solicitacoes} cliente(s)</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Produto não cadastrado
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(demand.updated_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenRegisterProductModal(demand)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all flex items-center space-x-1"
                              title="Cadastrar produto no catálogo oficial"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Cadastrar Produto</span>
                            </button>
                            <button
                              onClick={() => setDeleteDemandCandidate(demand)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remover solicitação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Cadastrados Sem Estoque */}
      {activeTab === 'cadastrados_sem_estoque' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950">
                  Produtos Cadastrados Solicitados Sem Estoque
                </h4>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Lista de produtos do catálogo oficial que os clientes procuraram mas estavam zerados ou não foram encontrados.
                </p>
              </div>
            </div>
          </div>

          {filteredDemands.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs text-center py-12">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">
                Nenhum produto cadastrado sem estoque na lista
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Registros de produtos da loja sem estoque procurados por clientes aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Produto Cadastrado</th>
                      <th className="py-3 px-4 text-center">Procuras do Cliente</th>
                      <th className="py-3 px-4">Origem / Status</th>
                      <th className="py-3 px-4">Última Ocorrência</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDemands.map(demand => (
                      <tr key={demand.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {demand.produto_nome}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 font-extrabold px-3 py-1 rounded-xl text-xs bg-amber-100 text-amber-800 border border-amber-200">
                            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                            <span>{demand.quantidade_solicitacoes} cliente(s)</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {demand.status === 'estoque_zerado_por_divergencia' ? (
                            <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Divergência Física (Zerado pelo Balcão)
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Estoque 0 no Sistema
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(demand.updated_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {onNavigateToEntry && (
                              <button
                                onClick={onNavigateToEntry}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-[11px] font-bold transition-all inline-flex items-center space-x-1"
                              >
                                <span>Dar Entrada</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteDemandCandidate(demand)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remover solicitação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal to Register New Product Directly */}
      {newProductModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Produto Solicitado</h3>
                  <p className="text-[11px] text-slate-500">
                    Transforme a solicitação do cliente em um produto oficial do catálogo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNewProductModal({ open: false, demand: null })}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  required
                  value={newProdForm.nome}
                  onChange={e => setNewProdForm({ ...newProdForm, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] rounded-xl text-xs font-semibold text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={newProdForm.categoria}
                    onChange={e => setNewProdForm({ ...newProdForm, categoria: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] rounded-xl text-xs text-white"
                  >
                    {categories.map((cat, idx) => (
                      <option key={`${cat}-${idx}`} value={cat} className="bg-[#0B1220] text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdForm.marca}
                    onChange={e => setNewProdForm({ ...newProdForm, marca: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdForm.codigo}
                    onChange={e => setNewProdForm({ ...newProdForm, codigo: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] rounded-xl text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProdForm.estoque_minimo}
                    onChange={e => setNewProdForm({ ...newProdForm, estoque_minimo: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#1F2937] rounded-xl text-xs font-bold text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewProductModal({ open: false, demand: null })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Cadastro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Demand Confirmation Modal */}
      {deleteDemandCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Excluir Solicitação?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tem certeza que deseja excluir esta solicitação para{' '}
              <span className="font-bold text-slate-800">"{deleteDemandCandidate.produto_nome}"</span>?
            </p>
            <div className="flex space-x-2 mt-5">
              <button
                onClick={() => setDeleteDemandCandidate(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteDemandConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
