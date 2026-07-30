import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  User,
  Package,
  Layers,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  ArrowRight
} from 'lucide-react';
import { StockDivergenceRecord } from '../types';
import { firestoreSync } from '../services/firestoreSync';
import { localStore } from '../services/localStore';

interface StockDivergencesProps {
  onNavigateToProducts?: () => void;
  onNavigateToEntry?: () => void;
}

export const StockDivergences: React.FC<StockDivergencesProps> = ({
  onNavigateToProducts,
  onNavigateToEntry
}) => {
  const [divergences, setDivergences] = useState<StockDivergenceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Aberta' | 'Corrigida'>('todos');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = firestoreSync.subscribeDivergences((data) => {
      setDivergences(data);
    });
    return () => unsub();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setDivergences(localStore.getDivergences());
    setTimeout(() => setLoading(false), 300);
  };

  const filteredDivergences = divergences.filter((d) => {
    const matchesSearch =
      d.produto_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.produto_id && d.produto_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      d.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openCount = divergences.filter((d) => d.status === 'Aberta').length;
  const correctedCount = divergences.filter((d) => d.status === 'Corrigida').length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-200" />
            <span>Auditoria & Correção Automática</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Relatório de Divergências de Estoque</h2>
          <p className="text-xs text-amber-100/90 max-w-2xl leading-relaxed">
            Acompanhe todas as vendas registradas com quantidade maior que o estoque disponível. O sistema mantém
            o histórico de ocorrências e marca automaticamente como corrigido quando novos produtos dão entrada.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleRefresh}
            className={`px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl text-xs font-bold transition flex items-center space-x-2 border border-white/20 ${
              loading ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-extrabold text-xl">
            {openCount}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Divergências Abertas</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400">
              {openCount} {openCount === 1 ? 'produto com estoque negativo' : 'produtos com estoque negativo'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-xl">
            {correctedCount}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Divergências Corrigidas</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {correctedCount} {correctedCount === 1 ? 'ocorrência resolvida' : 'ocorrências resolvidas'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-xl">
            {divergences.length}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Total de Ocorrências</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {divergences.length} {divergences.length === 1 ? 'registro gravado' : 'registros gravados'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por produto, categoria ou usuário..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              statusFilter === 'todos'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todos ({divergences.length})
          </button>
          <button
            onClick={() => setStatusFilter('Aberta')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              statusFilter === 'Aberta'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            Somente Abertas ({openCount})
          </button>
          <button
            onClick={() => setStatusFilter('Corrigida')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              statusFilter === 'Corrigida'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            Corrigidas ({correctedCount})
          </button>
        </div>
      </div>

      {/* Divergences Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredDivergences.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
              Nenhuma divergência encontrada
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'todos'
                ? 'Nenhum resultado para os filtros aplicados.'
                : 'Excelente! Todos os produtos possuem estoque devidamente ajustado sem divergências negativas.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Status</th>
                  <th className="p-4">Produto / Categoria</th>
                  <th className="p-4 text-center">Estoque na Ocorrência</th>
                  <th className="p-4 text-center">Estoque Atual</th>
                  <th className="p-4">Primeira Ocorrência</th>
                  <th className="p-4">Usuário</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDivergences.map((div) => {
                  const isOpen = div.status === 'Aberta';
                  return (
                    <tr
                      key={div.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                        isOpen ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Status */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-extrabold ${
                            isOpen
                              ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {isOpen ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Aberta</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Corrigida</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Product & Category */}
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {div.produto_nome}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 font-medium">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 font-bold">
                            📦 {div.categoria}
                          </span>
                          {div.produto_id && <span className="font-mono text-slate-400">ID: {div.produto_id}</span>}
                        </div>
                      </td>

                      {/* Stock at Moment */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
                          {div.estoque_no_momento} UN
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-black px-3 py-1 rounded-lg text-sm ${
                            div.estoque_atual < 0
                              ? 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800'
                              : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {div.estoque_atual} UN
                        </span>
                      </td>

                      {/* First Occurrence Date */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(div.data_primeira_divergencia)}</span>
                        </div>
                        {div.data_correcao && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Corrigido em: {formatDate(div.data_correcao)}</span>
                          </div>
                        )}
                      </td>

                      {/* User */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span>{div.usuario_nome}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right whitespace-nowrap">
                        {isOpen && onNavigateToEntry && (
                          <button
                            onClick={onNavigateToEntry}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition inline-flex items-center space-x-1"
                          >
                            <span>Dar Entrada</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
