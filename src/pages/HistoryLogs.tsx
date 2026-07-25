import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import {
  History,
  Search,
  Filter,
  User as UserIcon,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  Plus,
  LogIn,
  ShieldAlert
} from 'lucide-react';

export const HistoryLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('TODAS');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.descricao.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'TODAS' || log.acao === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (acao: AuditLog['acao']) => {
    switch (acao) {
      case 'ENTRADA':
        return { label: 'Entrada', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ArrowDownLeft };
      case 'SAIDA':
        return { label: 'Saída (POS)', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: ArrowUpRight };
      case 'CADASTRO':
        return { label: 'Cadastro', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Plus };
      case 'EDICAO':
        return { label: 'Edição', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Edit2 };
      case 'EXCLUSAO_LOGICA':
        return { label: 'Exclusão', bg: 'bg-red-50 text-red-700 border-red-200', icon: Trash2 };
      case 'LOGIN':
        return { label: 'Acesso', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: LogIn };
      default:
        return { label: acao, bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: ShieldAlert };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <History className="w-6 h-6 text-blue-600" />
          <span>Histórico de Auditoria & Movimentações</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Trilha completa e permanente de todas as operações realizadas no sistema Bytecas.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por usuário ou descrição..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 font-medium transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 text-slate-700 font-semibold w-full md:w-auto"
          >
            <option value="TODAS">Todas as Operações ({logs.length})</option>
            <option value="ENTRADA">Entradas (+)</option>
            <option value="SAIDA">Saídas (-)</option>
            <option value="CADASTRO">Cadastros</option>
            <option value="EDICAO">Edições</option>
            <option value="EXCLUSAO_LOGICA">Exclusões Lógicas</option>
            <option value="LOGIN">Acessos/Logins</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Operação</th>
                <th className="p-4">Usuário Responsável</th>
                <th className="p-4">Descrição da Ação</th>
                <th className="p-4">Endereço IP</th>
                <th className="p-4 text-right">Data & Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                    Carregando histórico de auditoria...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const badge = getActionBadge(log.acao);
                  const Icon = badge.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Action Badge */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center space-x-1.5 ${badge.bg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* User */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.usuario}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="p-4 font-medium text-slate-800">{log.descricao}</td>

                      {/* IP */}
                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        {log.ip || '127.0.0.1'}
                      </td>

                      {/* Timestamp */}
                      <td className="p-4 text-right text-slate-500 font-medium">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
