import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { Product, CustomerDemand } from '../types';
import {
  ClipboardList,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  PackageX,
  PackageCheck,
  Search,
  Filter,
  PlusCircle,
  ArrowRight,
  Calculator,
  UserX,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

interface RestockItem extends Product {
  sugerido_compra: number;
  nivel_urgencia: 'CRITICO' | 'ALERTA';
}

interface RestockListProps {
  onNavigateToProducts?: () => void;
  onNavigateToEntry?: () => void;
  onNavigateToCustomerDemand?: () => void;
}

export const RestockList: React.FC<RestockListProps> = ({
  onNavigateToProducts,
  onNavigateToEntry,
  onNavigateToCustomerDemand
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [demands, setDemands] = useState<CustomerDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [categories, setCategories] = useState<string[]>([]);
  
  // Copy notification states
  const [copied, setCopied] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);

  // Copy Options Modal State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedCopyCategory, setSelectedCopyCategory] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProducts, allCategories, allDemands] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getCustomerDemands()
      ]);
      setProducts(allProducts);
      setCategories(allCategories.map((c) => c.nome));
      setDemands(allDemands);
    } catch (err) {
      console.error('Erro ao carregar dados de reposição:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubProds = firestoreSync.subscribeProducts((allProducts) => {
      setProducts(allProducts || []);
      setLoading(false);
    });
    const unsubCats = firestoreSync.subscribeCategories((allCats) => {
      const names = Array.from(new Set((allCats || []).map((c) => c.nome.trim()).filter(Boolean)));
      setCategories(names);
    });
    const unsubDemands = firestoreSync.subscribeDemands((allDemands) => {
      setDemands(allDemands || []);
    });

    return () => {
      unsubProds();
      unsubCats();
      unsubDemands();
    };
  }, []);

  // Filter products that need restock mathematically (estoque <= estoque_minimo)
  const restockItems: RestockItem[] = products
    .filter(p => p.estoque <= p.estoque_minimo)
    .map(p => {
      const sugerido = Math.max(1, (p.estoque_minimo * 2) - p.estoque);
      const nivel = p.estoque === 0 || p.estoque <= Math.floor(p.estoque_minimo / 2) ? 'CRITICO' : 'ALERTA';
      return {
        ...p,
        sugerido_compra: sugerido,
        nivel_urgencia: nivel
      };
    });

  const unregisteredDemands = demands.filter(d => !d.cadastrado);

  const filteredRestockItems = restockItems.filter(item => {
    const matchesSearch =
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.marca.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Todas' || item.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group restock items strictly by Category and sort inside alphabetically
  const groupedRestockItems = useMemo(() => {
    const groups: { [catName: string]: RestockItem[] } = {};

    // Sort items alphabetically by product name
    const sortedItems = [...filteredRestockItems].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR')
    );

    for (const item of sortedItems) {
      const cat = item.categoria || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    // Sort categories alphabetically
    const sortedGroups: { [catName: string]: RestockItem[] } = {};
    Object.keys(groups)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .forEach(cat => {
        sortedGroups[cat] = groups[cat];
      });

    return sortedGroups;
  }, [filteredRestockItems]);

  const totalUnidadesComprar = restockItems.reduce(
    (acc, item) => acc + item.sugerido_compra,
    0
  );

  /**
   * Generates clean formatted text as strictly specified:
   * 
   * CABOS
   * 
   * Cabo Lightning
   * Cabo Micro USB
   * Cabo Tipo-C
   * 
   * CAPINHAS
   * 
   * Capinha A36
   * Capinha iPhone 15
   * Capinha S24
   */
  const generateCleanTextList = (
    filterMode: 'all' | 'outOfStock' | 'lowStock' | 'category',
    targetCatName?: string
  ) => {
    let itemsToInclude = restockItems;

    if (filterMode === 'outOfStock') {
      itemsToInclude = restockItems.filter(p => p.estoque === 0);
    } else if (filterMode === 'lowStock') {
      itemsToInclude = restockItems.filter(p => p.estoque > 0 && p.estoque <= p.estoque_minimo);
    } else if (filterMode === 'category' && targetCatName) {
      itemsToInclude = restockItems.filter(p => (p.categoria || 'Outros') === targetCatName);
    }

    if (itemsToInclude.length === 0) {
      return 'Nenhum produto encontrado para este filtro.';
    }

    // Group items by category
    const groups: { [catName: string]: RestockItem[] } = {};
    for (const item of itemsToInclude) {
      const cat = (item.categoria || 'OUTROS').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    // Sort categories alphabetically
    const sortedCategories = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const categoryBlocks: string[] = [];

    for (const catName of sortedCategories) {
      // Sort products alphabetically inside category
      const sortedProds = groups[catName].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      const prodLines = sortedProds.map(p => p.nome).join('\n');
      categoryBlocks.push(`${catName}\n\n${prodLines}`);
    }

    return categoryBlocks.join('\n\n');
  };

  /**
   * Generates a detailed technical report with quantities for suppliers
   */
  const generateDetailedReportText = () => {
    const dataHora = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let text = `📋 LISTA DETALHADA DE REPOSIÇÃO - BYTECAS\n`;
    text += `Emissão: ${dataHora}\n`;
    text += `--------------------------------------------------\n\n`;

    const groups: { [catName: string]: RestockItem[] } = {};
    for (const item of restockItems) {
      const cat = (item.categoria || 'Outros').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    const sortedCats = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    for (const catName of sortedCats) {
      text += `📦 ${catName}\n`;
      const sortedProds = groups[catName].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      sortedProds.forEach(item => {
        text += `• ${item.nome} [CÓD: ${item.codigo}]\n`;
        text += `  Estoque Atual: ${item.estoque} un | Sugestão Compra: ${item.sugerido_compra} un\n`;
      });
      text += `\n`;
    }

    text += `--------------------------------------------------\n`;
    text += `Total de Itens: ${restockItems.length} | Total Unidades: ${totalUnidadesComprar} un`;
    return text;
  };

  const handleCopyCleanList = () => {
    const text = generateCleanTextList('all');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setCopyNotification('Lista formatada limpa copiada com sucesso!');
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setCopyNotification(null), 4000);
    });
  };

  const handleCopyOption = (
    mode: 'all' | 'outOfStock' | 'lowStock' | 'category' | 'detailed',
    catName?: string
  ) => {
    let text = '';
    let successMsg = '';

    if (mode === 'detailed') {
      text = generateDetailedReportText();
      successMsg = 'Lista técnica detalhada copiada com sucesso!';
    } else {
      text = generateCleanTextList(mode, catName);
      if (mode === 'all') successMsg = 'Toda a lista copiada no formato limpo!';
      else if (mode === 'outOfStock') successMsg = 'Produtos sem estoque copiados!';
      else if (mode === 'lowStock') successMsg = 'Produtos com estoque baixo copiados!';
      else if (mode === 'category') successMsg = `Categoria "${catName}" copiada!`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setIsCopyModalOpen(false);
      setCopyNotification(successMsg);
      setTimeout(() => setCopyNotification(null), 4000);
    });
  };

  const copySingleItemName = (itemName: string) => {
    navigator.clipboard.writeText(itemName).then(() => {
      setCopyNotification(`Nome "${itemName}" copiado!`);
      setTimeout(() => setCopyNotification(null), 3000);
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">Analisando estoque e gerando lista de reposição...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 text-xs font-medium mb-2 border border-blue-500/30">
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>Organização por Categoria • Ordem Alfabética</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Lista de Reposição de Estoque</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Organizada estritamente por categoria em ordem alfabética. Copie com um clique no formato limpo sem símbolos técnicos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Copy Button */}
            <button
              onClick={handleCopyCleanList}
              disabled={products.length === 0}
              className={`px-5 py-3 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center space-x-2.5 ${
                copied
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Lista Copiada!' : 'Copiar Lista'}</span>
            </button>

            {/* Copy Options Menu Trigger */}
            <button
              onClick={() => setIsCopyModalOpen(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              title="Opções avançadas de cópia"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Opções de Cópia</span>
            </button>

            <button
              onClick={loadData}
              className="p-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all"
              title="Atualizar análise"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Copy Success Alert Notification */}
      {copyNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">{copyNotification}</p>
              <p className="text-[11px] text-emerald-700">
                O conteúdo formatado já está na sua área de transferência. Basta colar (Ctrl+V) onde desejar.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCopyNotification(null)}
            className="text-emerald-700 text-xs font-semibold hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Database Empty State */}
      {products.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-2xs text-center max-w-2xl mx-auto my-8 space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <PackageX className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Nenhum produto cadastrado no banco de dados</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Cadastre os produtos da sua loja e defina o estoque mínimo para ativar a lista de reposição automática.
            </p>
          </div>
          {onNavigateToProducts && (
            <button
              onClick={onNavigateToProducts}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Primeiro Produto</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Quantitative Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Itens em Reposição</span>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {restockItems.length}
                </span>
                <span className="text-[11px] text-slate-400 ml-1.5 font-medium">de {products.length} cadastrados</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Unidades Sugeridas</span>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {totalUnidadesComprar}
                </span>
                <span className="text-[11px] text-slate-400 ml-1.5 font-medium">unidades no total</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Organização Rígida</span>
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl border border-slate-200">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Por Categoria & Ordem Alfabética
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Formatação padrão sem exceções</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, código ou marca..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full sm:w-48 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Todas">Todas as Categorias</option>
                {categories.map((cat, idx) => (
                  <option key={`${cat}-${idx}`} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unregistered Customer Demands Banner */}
          {unregisteredDemands.length > 0 && (
            <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white p-5 rounded-2xl border border-rose-500/30 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                      Procura por Produtos Não Cadastrados ({unregisteredDemands.length} Itens)
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Produtos não cadastrados solicitados por clientes na loja.
                    </p>
                  </div>
                </div>

                {onNavigateToCustomerDemand && (
                  <button
                    onClick={onNavigateToCustomerDemand}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 shrink-0"
                  >
                    <span>Ver Gerenciador de Procura</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {unregisteredDemands.slice(0, 6).map(item => (
                  <div
                    key={item.id}
                    className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white truncate max-w-[160px]">
                      {item.produto_nome}
                    </span>
                    <span className="px-2 py-0.5 bg-rose-500/30 text-rose-200 border border-rose-400/30 font-black text-[10px] rounded-lg flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-rose-300" />
                      <span>{item.quantidade_solicitacoes}x procurado</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorized Restock List View */}
          {filteredRestockItems.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs text-center py-12">
              <PackageCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-900">
                {searchTerm || selectedCategory !== 'Todas'
                  ? 'Nenhum item encontrado com os filtros aplicados'
                  : 'Nenhum produto precisando de reposição no momento!'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Todos os produtos cadastrados estão com quantidades acima do nível mínimo de estoque.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category Blocks Display */}
              {Object.entries(groupedRestockItems).map(([catName, items]: [string, RestockItem[]]) => {
                // Ensure items inside category are sorted alphabetically
                const sortedItems = [...items].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

                return (
                  <div key={catName} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {/* Category Header as specified: 📦 CATEGORIA */}
                    <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-lg">📦</span>
                        <h3 className="font-extrabold text-sm tracking-wider uppercase text-blue-300">
                          {catName}
                        </h3>
                        <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded-full font-mono font-bold border border-blue-500/30">
                          {sortedItems.length} {sortedItems.length === 1 ? 'produto' : 'produtos'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyOption('category', catName)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition border border-white/20 flex items-center space-x-1.5"
                        title={`Copiar lista limpa da categoria ${catName}`}
                      >
                        <Copy className="w-3.5 h-3.5 text-blue-300" />
                        <span>Copiar Categoria</span>
                      </button>
                    </div>

                    {/* Bullet List Display of Products */}
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                      <ul className="space-y-1.5 text-xs font-medium text-slate-800">
                        {sortedItems.map(p => (
                          <li key={p.id} className="flex items-center justify-between group hover:bg-white p-1.5 rounded-lg transition">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-600 font-bold">•</span>
                              <span className="font-semibold">{p.nome}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                p.estoque === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {p.estoque === 0 ? 'Acabou (0 un)' : `${p.estoque} un`}
                              </span>
                              <button
                                onClick={() => copySingleItemName(p.nome)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition opacity-80 group-hover:opacity-100"
                                title="Copiar nome do produto"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Technical Details Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-4">Produto & Código</th>
                            <th className="py-2.5 px-4">Marca & Local</th>
                            <th className="py-2.5 px-4 text-center">Estoque Atual</th>
                            <th className="py-2.5 px-4 text-center">Mínimo</th>
                            <th className="py-2.5 px-4 text-center">Sugerido Compra</th>
                            <th className="py-2.5 px-4 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {sortedItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-900">{item.nome}</p>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  CÓD: {item.codigo}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                <p className="font-semibold text-slate-800">{item.marca}</p>
                                <p className="text-[10px] text-slate-400">{item.localizacao}</p>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block font-extrabold px-2.5 py-0.5 rounded-lg text-xs ${
                                    item.estoque === 0
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {item.estoque} un
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-600">
                                {item.estoque_minimo} un
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-black text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-lg text-xs">
                                  +{item.sugerido_compra} un
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {onNavigateToEntry && (
                                  <button
                                    onClick={onNavigateToEntry}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 shadow-xs ml-auto"
                                  >
                                    <span>Entrada</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Copy Options Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Copy className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Opções de Cópia da Lista</h3>
              </div>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Escolha como deseja copiar a lista de reposição para envio:
              </p>

              <div className="space-y-2">
                {/* Option 1: Clean Full List */}
                <button
                  onClick={() => handleCopyOption('all')}
                  className="w-full p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-700">
                      📋 Toda a Lista (Padrão Limpo)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Organizada por categorias em ordem alfabética. Sem códigos ou símbolos técnicos.
                    </div>
                  </div>
                  <Copy className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                </button>

                {/* Option 2: Only Out of Stock */}
                <button
                  onClick={() => handleCopyOption('outOfStock')}
                  className="w-full p-3.5 bg-rose-50/50 hover:bg-rose-50 border border-rose-200/80 rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-rose-900">
                      🚫 Apenas Produtos Sem Estoque (Acabou - 0 un)
                    </div>
                    <div className="text-[11px] text-rose-700/80 mt-0.5">
                      Copia apenas os produtos que estão com estoque zerado no momento.
                    </div>
                  </div>
                  <Copy className="w-4 h-4 text-rose-500 shrink-0" />
                </button>

                {/* Option 3: Only Low Stock */}
                <button
                  onClick={() => handleCopyOption('lowStock')}
                  className="w-full p-3.5 bg-amber-50/50 hover:bg-amber-50 border border-amber-200/80 rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-amber-900">
                      ⚠️ Apenas Produtos com Estoque Baixo
                    </div>
                    <div className="text-[11px] text-amber-700/80 mt-0.5">
                      Copia produtos que estão abaixo do estoque mínimo, mas ainda possuem unidades.
                    </div>
                  </div>
                  <Copy className="w-4 h-4 text-amber-500 shrink-0" />
                </button>

                {/* Option 4: Single Category */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="font-bold text-slate-900">📂 Copiar Apenas Uma Categoria</div>
                  <div className="flex space-x-2">
                    <select
                      value={selectedCopyCategory}
                      onChange={e => setSelectedCopyCategory(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {categories.map((c, idx) => (
                        <option key={`${c}-${idx}`} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (selectedCopyCategory) {
                          handleCopyOption('category', selectedCopyCategory);
                        }
                      }}
                      disabled={!selectedCopyCategory}
                      className="px-4 py-2 bg-blue-600 disabled:bg-slate-300 hover:bg-blue-700 text-white rounded-xl font-bold transition shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {/* Option 5: Detailed Report */}
                <button
                  onClick={() => handleCopyOption('detailed')}
                  className="w-full p-3.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      📊 Lista Detalhada (Com Quantidades e Códigos)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Inclui sugestão de compra em unidades e códigos internos de cada item.
                    </div>
                  </div>
                  <Copy className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsCopyModalOpen(false)}
                  className="w-full py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
