export type UserRole = 'admin_supremo' | 'gerente' | 'funcionario';

export interface User {
  id: string;
  nome: string;
  email: string;
  cargo: UserRole;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  nome: string;
  created_at: string;
}

export interface Product {
  id: string;
  nome: string;
  categoria: string;
  marca: string;
  codigo: string;
  codigo_barras?: string;
  estoque: number;
  estoque_minimo: number;
  localizacao: string;
  observacao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type MovementType = 'entrada' | 'saida';

export interface Movement {
  id: string;
  produto_id: string;
  produto_nome: string;
  produto_codigo: string;
  usuario_id: string;
  usuario_nome: string;
  tipo: MovementType;
  quantidade: number;
  observacao?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  usuario: string;
  acao: 'CADASTRO' | 'EDICAO' | 'EXCLUSAO_LOGICA' | 'ENTRADA' | 'SAIDA' | 'LOGIN' | 'CONFIG';
  descricao: string;
  ip?: string;
  created_at: string;
}

export interface AIInsight {
  id: string;
  tipo: 'reposicao_urgente' | 'alta_rotatividade' | 'estocado_sem_saida' | 'otimizacao';
  titulo: string;
  descricao: string;
  produto_id?: string;
  produto_nome?: string;
  prioridade: 'alta' | 'media' | 'baixa';
  data_analise: string;
}

export interface DashboardStats {
  total_produtos: number;
  total_unidades: number;
  produtos_em_falta: number;
  produtos_proximos_minimo: number;
  ultimas_movimentacoes: Movement[];
  produtos_recentes: Product[];
  alertas: {
    id: string;
    tipo: 'critico' | 'atencao' | 'info';
    mensagem: string;
    data: string;
  }[];
}

export interface TopMovedProduct {
  id: string;
  nome: string;
  codigo: string;
  categoria: string;
  quantidade_movimentada: number;
  estoque_atual: number;
  velocidade_saida: 'Alta' | 'Média' | 'Baixa';
  ranking: number;
  ultima_saida?: string;
}

export interface CustomerDemand {
  id: string;
  produto_id?: string;
  produto_nome: string;
  cadastrado: boolean;
  quantidade_solicitacoes: number;
  estoque_no_momento: number;
  solicitante_nome?: string;
  status: 'estoque_zerado_por_divergencia' | 'sem_estoque' | 'nao_cadastrado' | 'resolvido';
  created_at: string;
  updated_at: string;
}

