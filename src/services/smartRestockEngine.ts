import { Product, Movement, CustomerDemand, StockDivergenceRecord } from '../types';

export interface ProductTelemetry {
  productId: string;
  productName: string;
  categoria: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  totalVendasQty: number;
  frequenciaVendas: number;
  ultimaVenda: string | null;
  ultimaEntrada: string | null;
  diasSemReposicao: number;
  diasSemVenda: number;
  vezesZerou: number;
  diasZerado: number;
  procurasClienteCount: number;
  divergenciasCount: number;
  temEstoqueNegativo: boolean;
  naoRelevante: boolean;
  excluirAoZerar: boolean;
  vendasPorDia: number;
  diasAteEsgotar: number | null;
  tendenciaVendas: 'CRESCIMENTO' | 'ESTAVEL' | 'QUEDA';
}

export interface SmartRestockItem extends Product {
  nivel_urgencia: 'CRITICO' | 'ALERTA' | 'NORMAL';
  motivos: string[];
  telemetry: ProductTelemetry;
}

export interface RestockInsightsStats {
  produtosMaisVendidos: { id: string; nome: string; quantidade: number }[];
  produtosMenosVendidos: { id: string; nome: string; quantidade: number }[];
  categoriasMaisMovimentadas: { categoria: string; totalVendas: number }[];
  produtosFrequentesZerados: { id: string; nome: string; vezesZerou: number }[];
  produtosMaisProcurados: { id: string; nome: string; procuras: number }[];
  tempoMedioEsgotarDias: number;
  tempoMedioEntreReposicoesDias: number;
}

export interface RestockAnalysisResult {
  generatedAtDate: string;
  generatedAtTime: string;
  generatedByUser: string;
  categoriesAnalyzed: number;
  productsAnalyzed: number;
  timeSpentMs: number;
  items: SmartRestockItem[];
  allProducts: Product[];
  categories: string[];
  customerDemands: CustomerDemand[];
  stats: RestockInsightsStats;
}

/**
 * Motor Inteligente de Decisão de Reposição
 * Analisa 15+ fatores de telemetria por produto e gera ranking de prioridade real.
 */
export function analyzeSmartRestock(
  allProducts: Product[],
  allMovements: Movement[] = [],
  allDemands: CustomerDemand[] = [],
  allDivergences: StockDivergenceRecord[] = [],
  userEmailOrName: string = 'Administrador'
): RestockAnalysisResult {
  const startTime = performance.now();
  const now = new Date();

  // Filter active products (excluding auto-deleted zero-stock products)
  const activeProducts = (allProducts || []).filter(p => p.ativo !== false && !p.lixeira && !(p.excluir_ao_zerar && p.estoque <= 0));

  // Group movements by product
  const productMovementsMap = new Map<string, Movement[]>();
  (allMovements || []).forEach(m => {
    if (!m.produto_id) return;
    if (!productMovementsMap.has(m.produto_id)) {
      productMovementsMap.set(m.produto_id, []);
    }
    productMovementsMap.get(m.produto_id)!.push(m);
  });

  // Group demands by product or name
  const productDemandsMap = new Map<string, number>();
  (allDemands || []).forEach(d => {
    if (d.status === 'resolvido') return;
    const key = d.produto_id || (d.produto_nome || '').trim().toLowerCase();
    const count = d.quantidade_solicitacoes || 1;
    productDemandsMap.set(key, (productDemandsMap.get(key) || 0) + count);
  });

  // Group divergences
  const productDivergencesMap = new Map<string, number>();
  (allDivergences || []).forEach(div => {
    if (!div.produto_id) return;
    productDivergencesMap.set(div.produto_id, (productDivergencesMap.get(div.produto_id) || 0) + 1);
  });

  const evaluatedItems: SmartRestockItem[] = [];

  // Track global insight stats
  const salesByProduct = new Map<string, { nome: string; total: number }>();
  const salesByCategory = new Map<string, number>();
  const zeroStockProducts = new Map<string, { nome: string; count: number }>();
  const customerDemandProducts = new Map<string, { nome: string; total: number }>();
  const runoutDaysList: number[] = [];
  const restockIntervalDaysList: number[] = [];

  for (const product of activeProducts) {
    const pMovements = productMovementsMap.get(product.id) || [];
    
    // Sort movements by date
    pMovements.sort((a, b) => new Date(b.created_at || b.data_movimentacao || 0).getTime() - new Date(a.created_at || a.data_movimentacao || 0).getTime());

    // Separate sales (saida) and entries (entrada)
    const sales = pMovements.filter(m => m.tipo === 'saida');
    const entries = pMovements.filter(m => m.tipo === 'entrada');

    // Total sales quantity & frequency
    const totalVendasQty = sales.reduce((acc, s) => acc + (s.quantidade || 0), 0);
    const frequenciaVendas = sales.length;

    // Track for stats
    if (totalVendasQty > 0) {
      salesByProduct.set(product.id, { nome: product.nome, total: totalVendasQty });
      const cat = product.categoria || 'Geral';
      salesByCategory.set(cat, (salesByCategory.get(cat) || 0) + totalVendasQty);
    }

    // Last sale & last entry timestamps
    const ultimaVenda = sales.length > 0 ? (sales[0].created_at || sales[0].data_movimentacao || null) : null;
    const ultimaEntrada = entries.length > 0 ? (entries[0].created_at || entries[0].data_movimentacao || null) : null;

    // Days since last entry / restock
    let diasSemReposicao = 30; // default baseline if no recorded entry
    if (ultimaEntrada) {
      const entryTime = new Date(ultimaEntrada).getTime();
      diasSemReposicao = Math.max(0, Math.floor((now.getTime() - entryTime) / (1000 * 60 * 60 * 24)));
    } else if (product.created_at) {
      const createTime = new Date(product.created_at).getTime();
      diasSemReposicao = Math.max(0, Math.floor((now.getTime() - createTime) / (1000 * 60 * 60 * 24)));
    }

    // Days between restocks calculation for stats
    if (entries.length >= 2) {
      for (let i = 0; i < entries.length - 1; i++) {
        const t1 = new Date(entries[i].created_at || entries[i].data_movimentacao || 0).getTime();
        const t2 = new Date(entries[i + 1].created_at || entries[i + 1].data_movimentacao || 0).getTime();
        const diffDays = Math.abs(t1 - t2) / (1000 * 60 * 60 * 24);
        if (diffDays > 0) restockIntervalDaysList.push(diffDays);
      }
    }

    // Days since last sale
    let diasSemVenda = 999;
    if (ultimaVenda) {
      const saleTime = new Date(ultimaVenda).getTime();
      diasSemVenda = Math.max(0, Math.floor((now.getTime() - saleTime) / (1000 * 60 * 60 * 24)));
    }

    // Zero stock occurrences & estimated days zero
    let vezesZerou = 0;
    if (product.estoque <= 0) vezesZerou += 1;
    pMovements.forEach(m => {
      if (m.observacao?.toLowerCase().includes('zerad') || m.observacao?.toLowerCase().includes('estoque 0')) {
        vezesZerou += 1;
      }
    });

    let diasZerado = 0;
    if (product.estoque <= 0) {
      if (ultimaVenda) {
        diasZerado = Math.max(1, Math.floor((now.getTime() - new Date(ultimaVenda).getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        diasZerado = 5;
      }
      zeroStockProducts.set(product.id, { nome: product.nome, count: Math.max(1, vezesZerou) });
    }

    // Customer unfulfilled demand count
    const demandByKey = productDemandsMap.get(product.id) || productDemandsMap.get(product.nome.trim().toLowerCase()) || 0;
    if (demandByKey > 0) {
      customerDemandProducts.set(product.id, { nome: product.nome, total: demandByKey });
    }

    // Divergences & negative stock history
    const divergenciasCount = productDivergencesMap.get(product.id) || 0;
    const temEstoqueNegativo = product.estoque < 0 || pMovements.some(m => m.observacao?.toLowerCase().includes('negativ'));

    // Sales velocity (average units sold per day over last 30 days)
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    const recentSales = sales.filter(s => new Date(s.created_at || s.data_movimentacao || 0).getTime() >= thirtyDaysAgo);
    const recentTotal = recentSales.reduce((sum, s) => sum + (s.quantidade || 0), 0);
    const vendasPorDia = Number((recentTotal / 30).toFixed(2));

    // Sales Trend (recent 15 days vs previous 15 days)
    const fifteenDaysAgo = now.getTime() - 15 * 24 * 60 * 60 * 1000;
    const salesLast15 = sales.filter(s => new Date(s.created_at || s.data_movimentacao || 0).getTime() >= fifteenDaysAgo)
      .reduce((sum, s) => sum + (s.quantidade || 0), 0);
    const salesPrev15 = sales.filter(s => {
      const t = new Date(s.created_at || s.data_movimentacao || 0).getTime();
      return t >= thirtyDaysAgo && t < fifteenDaysAgo;
    }).reduce((sum, s) => sum + (s.quantidade || 0), 0);

    let tendenciaVendas: 'CRESCIMENTO' | 'ESTAVEL' | 'QUEDA' = 'ESTAVEL';
    if (salesLast15 > salesPrev15 + 2) tendenciaVendas = 'CRESCIMENTO';
    else if (salesPrev15 > salesLast15 + 2) tendenciaVendas = 'QUEDA';

    // Estimated days to run out of stock
    let diasAteEsgotar: number | null = null;
    if (vendasPorDia > 0 && product.estoque > 0) {
      diasAteEsgotar = Math.ceil(product.estoque / vendasPorDia);
      runoutDaysList.push(diasAteEsgotar);
    }

    const telemetry: ProductTelemetry = {
      productId: product.id,
      productName: product.nome,
      categoria: product.categoria || 'Geral',
      estoqueAtual: product.estoque,
      estoqueMinimo: product.estoque_minimo || 5,
      totalVendasQty,
      frequenciaVendas,
      ultimaVenda,
      ultimaEntrada,
      diasSemReposicao,
      diasSemVenda,
      vezesZerou,
      diasZerado,
      procurasClienteCount: demandByKey,
      divergenciasCount,
      temEstoqueNegativo,
      naoRelevante: !!product.nao_relevante,
      excluirAoZerar: !!product.excluir_ao_zerar,
      vendasPorDia,
      diasAteEsgotar,
      tendenciaVendas
    };

    // --- REPLENISHMENT EVALUATION ENGINE (Objective Stock Rules) ---
    const motivos: string[] = [];
    const minRequired = product.estoque_minimo || 5;

    // Determine Urgency & Reasons based on real stock
    let nivel_urgencia: 'CRITICO' | 'ALERTA' | 'NORMAL' = 'NORMAL';

    if (product.estoque < 0) {
      nivel_urgencia = 'CRITICO';
      motivos.push(`Estoque Negativo (${product.estoque} un)`);
    } else if (product.estoque === 0) {
      nivel_urgencia = 'CRITICO';
      motivos.push(diasZerado > 1 ? `Zerado há ${diasZerado} dias` : 'Estoque Zerado');
    } else if (product.estoque <= minRequired) {
      nivel_urgencia = 'ALERTA';
      motivos.push(`Abaixo do Mínimo (${product.estoque}/${minRequired} un)`);
    } else if (demandByKey > 0) {
      nivel_urgencia = 'ALERTA';
      motivos.push(`Procurado por clientes (${demandByKey}x)`);
    }

    if (demandByKey > 0 && !motivos.some(m => m.includes('Procurado'))) {
      motivos.push(`Procurado ${demandByKey}x por clientes`);
    }

    // Determine if item requires restock
    const needsRestock =
      !product.nao_relevante &&
      (product.estoque <= minRequired || product.estoque <= 0 || demandByKey > 0);

    if (needsRestock && nivel_urgencia !== 'NORMAL') {
      evaluatedItems.push({
        ...product,
        nivel_urgencia,
        motivos: motivos.slice(0, 3),
        telemetry
      });
    }
  }

  // Sort items: CRITICO first, then ALERTA, then alphabetically by product name
  evaluatedItems.sort((a, b) => {
    if (a.nivel_urgencia === 'CRITICO' && b.nivel_urgencia !== 'CRITICO') return -1;
    if (a.nivel_urgencia !== 'CRITICO' && b.nivel_urgencia === 'CRITICO') return 1;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });

  // Categories list
  const categoryNames = Array.from(
    new Set(activeProducts.map(p => (p.categoria || 'Geral').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Calculate Restock Insight Statistics
  const topVendidos = Array.from(salesByProduct.entries())
    .map(([id, val]) => ({ id, nome: val.nome, quantidade: val.total }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  const menosVendidos = activeProducts
    .map(p => {
      const salesVal = salesByProduct.get(p.id)?.total || 0;
      return { id: p.id, nome: p.nome, quantidade: salesVal };
    })
    .sort((a, b) => a.quantidade - b.quantidade)
    .slice(0, 5);

  const topCats = Array.from(salesByCategory.entries())
    .map(([categoria, totalVendas]) => ({ categoria, totalVendas }))
    .sort((a, b) => b.totalVendas - a.totalVendas)
    .slice(0, 5);

  const topZerados = Array.from(zeroStockProducts.entries())
    .map(([id, val]) => ({ id, nome: val.nome, vezesZerou: val.count }))
    .sort((a, b) => b.vezesZerou - a.vezesZerou)
    .slice(0, 5);

  const topProcurados = Array.from(customerDemandProducts.entries())
    .map(([id, val]) => ({ id, nome: val.nome, procuras: val.total }))
    .sort((a, b) => b.procuras - a.procuras)
    .slice(0, 5);

  const avgRunout = runoutDaysList.length > 0
    ? Math.round(runoutDaysList.reduce((a, b) => a + b, 0) / runoutDaysList.length)
    : 12;

  const avgRestockInterval = restockIntervalDaysList.length > 0
    ? Math.round(restockIntervalDaysList.reduce((a, b) => a + b, 0) / restockIntervalDaysList.length)
    : 15;

  const endTime = performance.now();
  const timeSpentMs = Math.round(endTime - startTime);

  return {
    generatedAtDate: now.toLocaleDateString('pt-BR'),
    generatedAtTime: now.toLocaleTimeString('pt-BR'),
    generatedByUser: userEmailOrName,
    categoriesAnalyzed: categoryNames.length,
    productsAnalyzed: activeProducts.length,
    timeSpentMs,
    items: evaluatedItems,
    allProducts: activeProducts,
    categories: categoryNames,
    customerDemands: allDemands || [],
    stats: {
      produtosMaisVendidos: topVendidos,
      produtosMenosVendidos: menosVendidos,
      categoriasMaisMovimentadas: topCats,
      produtosFrequentesZerados: topZerados,
      produtosMaisProcurados: topProcurados,
      tempoMedioEsgotarDias: avgRunout,
      tempoMedioEntreReposicoesDias: avgRestockInterval
    }
  };
}
