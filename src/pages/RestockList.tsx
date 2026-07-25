import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
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
  Sparkles,
  TrendingUp
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
  const [copied, setCopied] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProducts, allCategories, allDemands] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getCustomerDemands()
      ]);
      setProducts(allProducts);
      setCategories(allCategories.map(c => c.nome));
      setDemands(allDemands);
    } catch (err) {
      console.error('Erro ao carregar dados de reposição:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  // Apply search & category filters
  const filteredRestockItems = restockItems.filter(item => {
    const matchesSearch =
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.marca.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Todas' || item.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalUnidadesComprar = restockItems.reduce(
    (acc, item) => acc + item.sugerido_compra,
    0
  );

  // Generate copyable formatted text for WhatsApp / Purchasing Manager
  const generateFormattedListText = () => {
    const dataHora = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let text = `📋 *LISTA AUTOMÁTICA DE REPOSIÇÃO DE ESTOQUE*\n`;
    text += `🏢 *Empresa:* Bytecas Loja e Estoque\n`;
    text += `📅 *Emissão:* ${dataHora}\n`;
    text += `--------------------------------------------------\n\n`;

    if (restockItems.length === 0) {
      text += `✅ *Nenhum produto cadastrado precisando de reposição no momento.*\n`;
      text += `Todos os itens cadastrados estão com estoque acima do nível mínimo.\n\n`;
    } else {
      text += `📦 *ITENS DO CATÁLOGO COM NECESSIDADE DE COMPRA:*\n`;
      restockItems.forEach((item, index) => {
        text += `${index + 1}. *[CÓD: ${item.codigo}] ${item.nome}*\n`;
        text += `   • Categoria: ${item.categoria} | Marca: ${item.marca}\n`;
        text += `   • Localização: ${item.localizacao}\n`;
        text += `   • Estoque Atual: ${item.estoque} un | Mínimo: ${item.estoque_minimo} un\n`;
        text += `   👉 *SUGESTÃO DE COMPRA: ${item.sugerido_compra} un*\n\n`;
      });
    }

    if (unregisteredDemands.length > 0) {
      text += `--------------------------------------------------\n`;
      text += `🚨 *PRODUTOS NÃO CADASTRADOS SOLICITADOS POR CLIENTES:*\n`;
      unregisteredDemands.forEach((item, index) => {
        text += `${index + 1}. *${item.produto_nome}*\n`;
        text += `   • Procura de clientes: *${item.quantidade_solicitacoes} pessoa(s)*\n`;
        text += `   • Status: Produto Não Cadastrado\n\n`;
      });
    }

    text += `--------------------------------------------------\n`;
    text += `📊 *RESUMO PARA COMPRA:*\n`;
    text += `• Total de produtos para repor: *${restockItems.length} item(ns)*\n`;
    text += `• Total de unidades recomendadas: *${totalUnidadesComprar} unidades*\n`;
    text += `• Novos produtos solicitados por clientes: *${unregisteredDemands.length} item(ns)*\n\n`;
    text += `_Relatório gerado matematicamente pelo Sistema de Gestão de Estoque._`;
    return text;
  };

  const handleCopyList = () => {
    const formattedText = generateFormattedListText();
    navigator.clipboard.writeText(formattedText).then(() => {
      setCopied(true);
      setCopyNotification(true);
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setCopyNotification(false), 4000);
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
              <span>Análise Matemática de Estoque • 100% Automático</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Lista Automática de Reposição</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Lista gerada exclusivamente com base nas quantidades disponíveis e no estoque mínimo definido. Copie os dados formatados com um clique para enviar ao comprador.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyList}
              disabled={products.length === 0}
              className={`px-5 py-3 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center space-x-2.5 ${
                copied
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Lista Copiada!' : 'Copiar Lista de Reposição'}</span>
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
              <p className="text-xs font-bold">Lista copiada com sucesso!</p>
              <p className="text-[11px] text-emerald-700">
                O texto formatado já está na sua área de transferência. Basta colar (Ctrl+V) no WhatsApp ou e-mail do fornecedor.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCopyNotification(false)}
            className="text-emerald-700 text-xs font-semibold hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Database Completely Empty State */}
      {products.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-2xs text-center max-w-2xl mx-auto my-8 space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <PackageX className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Nenhum produto cadastrado no banco de dados</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              O sistema iniciou totalmente vazio conforme a especificação. Cadastre os produtos da sua loja e defina o estoque mínimo para ativar a lista de reposição automática.
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
                <span className="text-xs font-semibold text-slate-500">Fórmula de Cálculo</span>
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl border border-slate-200">
                  <Calculator className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-800 block">
                  (Mínimo × 2) - Estoque
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Cálculo 100% matemático</span>
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
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unregistered Products Demanded by Customers Banner */}
          {unregisteredDemands.length > 0 && (
            <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white p-5 rounded-2xl border border-rose-500/30 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                      Demanda de Clientes • Produtos Não Cadastrados ({unregisteredDemands.length} Itens)
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Estes produtos não existem no sistema mas foram procurados por clientes na loja.
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

          {/* Restock Items List / Table */}
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
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Produtos com Reposição Recomendada ({filteredRestockItems.length})
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Clique em "Copiar Lista" para exportar todos os itens formatados
                  </p>
                </div>
                <button
                  onClick={handleCopyList}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200/80 flex items-center space-x-1.5 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Produto & Código</th>
                      <th className="py-3 px-4">Categoria / Marca</th>
                      <th className="py-3 px-4">Localização</th>
                      <th className="py-3 px-4 text-center">Estoque Atual</th>
                      <th className="py-3 px-4 text-center">Mínimo</th>
                      <th className="py-3 px-4 text-center">Qtd Sugerida</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRestockItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{item.nome}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            CÓD: {item.codigo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <p className="font-semibold text-slate-800">{item.categoria}</p>
                          <p className="text-[10px] text-slate-400">{item.marca}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {item.localizacao}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block font-extrabold px-2.5 py-1 rounded-lg text-xs ${
                              item.estoque === 0
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {item.estoque} un
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                          {item.estoque_minimo} un
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-black text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-lg text-xs">
                            +{item.sugerido_compra} un
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {onNavigateToEntry && (
                            <button
                              onClick={onNavigateToEntry}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-[11px] font-bold transition-all inline-flex items-center space-x-1"
                            >
                              <span>Dar Entrada</span>
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
          )}
        </>
      )}
    </div>
  );
};
