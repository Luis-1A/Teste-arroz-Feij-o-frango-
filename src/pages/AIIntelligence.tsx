import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { firestoreSync } from '../services/firestoreSync';
import { AIInsight } from '../types';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  PackageX,
  Lightbulb,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

export const AIIntelligence: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('gemini_ai');

  const loadAIInsights = async () => {
    setLoading(true);
    try {
      const res = await api.getAIInsights();
      setInsights(res.insights);
      setSource(res.source);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAIInsights();
    const unsub = firestoreSync.subscribeProducts(() => {
      loadAIInsights();
    });
    return () => unsub();
  }, []);

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'alta':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'media':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'baixa':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getInsightIcon = (tipo: string) => {
    switch (tipo) {
      case 'reposicao_urgente':
        return <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'alta_rotatividade':
        return <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'estocado_sem_saida':
        return <PackageX className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'otimizacao':
      default:
        return <Lightbulb className="w-5 h-5 text-blue-600 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full text-blue-300 text-xs font-medium mb-2 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Inteligência Artificial • Gemini 3.6 Flash</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Análise Preditiva de Estoque</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Algoritmos neurais do Facilitando Meu Trabalho analisam continuamente velocidade de movimentação, estoque crítico e produtos estocados sem saída.
            </p>
          </div>

          <button
            onClick={loadAIInsights}
            disabled={loading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Gerar Nova Análise IA</span>
          </button>
        </div>
      </div>

      {/* AI Analysis Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold">Analisando histórico de vendas e estoques com IA...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
            <span>Motor de inteligência ativo ({source === 'gemini_ai' ? 'Gemini 3.6 Flash Server' : 'Motor Local de Estoque'})</span>
            <span>{insights.length} Recomendações Geradas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map(item => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/80">
                        {getInsightIcon(item.tipo)}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{item.titulo}</h3>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0 ${getPriorityBadge(
                        item.prioridade
                      )}`}
                    >
                      Prioridade {item.prioridade}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-10 font-medium">{item.descricao}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Analisado em: {new Date(item.data_analise).toLocaleTimeString('pt-BR')}</span>
                  </div>

                  <span className="text-blue-600 font-semibold flex items-center space-x-1 cursor-pointer hover:underline">
                    <span>Ação Sugerida</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
