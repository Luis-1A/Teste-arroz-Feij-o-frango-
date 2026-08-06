import {
  User,
  Category,
  CategoryProfile,
  Product,
  Movement,
  AuditLog,
  AIInsight,
  DashboardStats,
  TopMovedProduct,
  CustomerDemand,
  POSConfig,
  CalendarEvent,
  Announcement,
  StoreGoal,
  DraftMovement,
  DashboardCardConfig,
  StoreAppearance,
  InventoryAuditSession,
  StockDivergenceRecord
} from '../types';
import { DEFAULT_POS_CONFIG } from '../config/posDefault';

const USERS_KEY = 'bytecas_local_users';
const PRODUCTS_KEY = 'bytecas_local_products';
const CATEGORIES_KEY = 'bytecas_local_categories';
const MOVEMENTS_KEY = 'bytecas_local_movements';
const HISTORY_KEY = 'bytecas_local_history';
const DEMANDS_KEY = 'bytecas_local_demands';
const POS_CONFIG_KEY = 'bytecas_local_pos_config';
const CALENDAR_KEY = 'bytecas_local_calendar';
const ANNOUNCEMENTS_KEY = 'bytecas_local_announcements';
const GOALS_KEY = 'bytecas_local_goals';
const DRAFTS_KEY = 'bytecas_local_drafts';
const DASHBOARD_CONFIG_KEY = 'bytecas_local_dashboard_config';
const APPEARANCE_KEY = 'bytecas_local_appearance';
const AUDIT_SESSIONS_KEY = 'bytecas_local_audit_sessions';
const DIVERGENCES_KEY = 'bytecas_local_divergences';
const CATEGORY_PROFILES_KEY = 'bytecas_local_category_profiles';

const DEFAULT_CATEGORY_PROFILES: Record<string, CategoryProfile> = {
  'Películas': { categoria: 'Películas', estoque_minimo: 5, nao_relevante: false, excluir_ao_zerar: false },
  'Capinhas': { categoria: 'Capinhas', estoque_minimo: 3, nao_relevante: false, excluir_ao_zerar: false },
  'Cabos': { categoria: 'Cabos', estoque_minimo: 3, nao_relevante: false, excluir_ao_zerar: false },
  'Garrafas': { categoria: 'Garrafas', estoque_minimo: 2, nao_relevante: false, excluir_ao_zerar: false }
};

const initialCalendarEvents: CalendarEvent[] = [
  {
    id: 'cal_1',
    titulo: 'Chegada Carga de Acessórios',
    descricao: 'Conferência de lote de cabos e carregadores homologados',
    tipo: 'chegada_mercadoria',
    data: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    usuario_nome: 'Luis Fernando Santos',
    created_at: new Date().toISOString()
  },
  {
    id: 'cal_2',
    titulo: 'Inventário Geral Mensal',
    descricao: 'Auditoria física e contagem do setor de peças',
    tipo: 'inventario',
    data: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    usuario_nome: 'Luis Fernando Santos',
    created_at: new Date().toISOString()
  }
];

const initialAnnouncements: Announcement[] = [
  {
    id: 'ann_1',
    titulo: '⚠️ Conferência Obrigatória ao Receber Mercadorias',
    conteudo: 'Todas as entradas de produtos devem ser registradas com código de barras ou SKU completo no momento da descarga.',
    prioridade: 'urgente',
    autor_nome: 'Administração',
    ativo: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'ann_2',
    titulo: '💡 Lixeira Inteligente Ativa',
    conteudo: 'Os produtos excluídos agora ficam salvos na Lixeira por segurança antes da remoção definitiva.',
    prioridade: 'normal',
    autor_nome: 'Administração',
    ativo: true,
    created_at: new Date().toISOString()
  }
];

const initialGoals: StoreGoal[] = [
  {
    id: 'goal_1',
    titulo: 'Zerar Produtos Sem Categoria',
    descricao: 'Organizar e associar todas as mercadorias aos seus devidos grupos.',
    meta_valor: 100,
    atual_valor: 100,
    unidade: '%',
    concluida: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'goal_2',
    titulo: 'Manter Estoque Físico Auditado',
    descricao: 'Realizar ao menos 1 inventário guiado semanal nas principais categorias.',
    meta_valor: 4,
    atual_valor: 2,
    unidade: 'auditorias',
    concluida: false,
    created_at: new Date().toISOString()
  }
];

const initialDashboardConfig: DashboardCardConfig = {
  statsSummary: true,
  quickShortcuts: true,
  activityFeed: true,
  recentProducts: true,
  announcements: true,
  calendarEvents: true,
  storeGoals: true,
  organizationAssistant: true
};

const initialAppearance: StoreAppearance = {
  nome_loja: 'Facilitando Meu Trabalho',
  logotipo_texto: 'FACILITANDO MEU TRABALHO',
  cor_tema: 'blue',
  densidade: 'confortavel',
  modo_escuro_header: true
};



const initialUsers: (User & { senha_hash: string })[] = [
  {
    id: 'usr_luis',
    nome: 'Luis Fernando Santos',
    email: 'luisfernandosantossilva1940@gmail.com',
    senha_hash: '@Luisoo5',
    cargo: 'admin_supremo',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'usr_gerente',
    nome: 'Carlos Gerente',
    email: 'gerente@facilitandomeutrabalho.com',
    senha_hash: 'gerente123',
    cargo: 'gerente',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const initialCategories: Category[] = [];

const initialProducts: Product[] = [
  {
    id: 'prod_cabo_kimaster_usblight',
    nome: 'Cabo Kimaster USB-Lightning',
    categoria: 'Cabos',
    marca: 'Kimaster',
    codigo: 'CAB-KIM-LIGHT',
    codigo_barras: '7891234560106',
    estoque: 2,
    estoque_minimo: 5,
    localizacao: 'Prateleira A1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_cabo_kimaster_c2c',
    nome: 'Cabo Kimaster Tipo-C para Tipo-C',
    categoria: 'Cabos',
    marca: 'Kimaster',
    codigo: 'CAB-KIM-C2C',
    codigo_barras: '7891234560107',
    estoque: 2,
    estoque_minimo: 5,
    localizacao: 'Prateleira A1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_cabo_light_usbc',
    nome: 'Cabo Lightning para USB-C',
    categoria: 'Cabos',
    marca: 'Kimaster',
    codigo: 'CAB-LIGHT-USBC',
    codigo_barras: '7891234560108',
    estoque: 2,
    estoque_minimo: 5,
    localizacao: 'Prateleira A1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_cabo_kimaster_c2m',
    nome: 'Cabo Kimaster Tipo-C (2 metros)',
    categoria: 'Cabos',
    marca: 'Kimaster',
    codigo: 'CAB-KIM-C2M',
    codigo_barras: '7891234560109',
    estoque: 0,
    estoque_minimo: 5,
    localizacao: 'Prateleira A1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_cabo_kimaster_c2c_2m',
    nome: 'Cabo Kimaster Tipo-C para Tipo-C (2 metros)',
    categoria: 'Cabos',
    marca: 'Kimaster',
    codigo: 'CAB-KIM-C2C2M',
    codigo_barras: '7891234560110',
    estoque: 1,
    estoque_minimo: 5,
    localizacao: 'Prateleira A1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Carregadores
  {
    id: 'prod_carr_1',
    nome: 'Carregador Turbo 20W',
    categoria: 'Carregadores',
    marca: 'PowerTech',
    codigo: 'CAR-TURBO20W',
    codigo_barras: '7891234560201',
    estoque: 15,
    estoque_minimo: 5,
    localizacao: 'Prateleira B1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_carr_2',
    nome: 'Carregador USB',
    categoria: 'Carregadores',
    marca: 'PowerTech',
    codigo: 'CAR-USB',
    codigo_barras: '7891234560202',
    estoque: 20,
    estoque_minimo: 5,
    localizacao: 'Prateleira B1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_carr_3',
    nome: 'Carregador Tipo-C',
    categoria: 'Carregadores',
    marca: 'PowerTech',
    codigo: 'CAR-USBC',
    codigo_barras: '7891234560203',
    estoque: 14,
    estoque_minimo: 5,
    localizacao: 'Prateleira B1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_carregador_simples_usbc',
    nome: 'Carregador Simples Tipo-C',
    categoria: 'Carregadores',
    marca: 'Kimaster',
    codigo: 'CAR-SIM-USBC',
    codigo_barras: '7891234560204',
    estoque: 5,
    estoque_minimo: 5,
    localizacao: 'Prateleira B1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_carregador_kim_turbo_usbc',
    nome: 'Carregador Kimaster Turbo Tipo-C',
    categoria: 'Carregadores',
    marca: 'Kimaster',
    codigo: 'CAR-KIM-TURBO-USBC',
    codigo_barras: '7891234560205',
    estoque: 5,
    estoque_minimo: 5,
    localizacao: 'Prateleira B1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_carregador_kim_turbo_light',
    nome: 'Carregador Kimaster Turbo Lightning',
    categoria: 'Carregadores',
    marca: 'Kimaster',
    codigo: 'CAR-KIM-TURBO-LIGHT',
    codigo_barras: '7891234560206',
    estoque: 5,
    estoque_minimo: 5,
    localizacao: 'Prateleira B1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Fones
  {
    id: 'prod_fone_1',
    nome: 'Fone Bluetooth',
    categoria: 'Fones',
    marca: 'SoundPro',
    codigo: 'FON-BT',
    codigo_barras: '7891234560301',
    estoque: 10,
    estoque_minimo: 3,
    localizacao: 'Vitrine V1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_fone_2',
    nome: 'Fone Tipo-C',
    categoria: 'Fones',
    marca: 'SoundPro',
    codigo: 'FON-USBC',
    codigo_barras: '7891234560302',
    estoque: 3,
    estoque_minimo: 4,
    localizacao: 'Vitrine V1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_fone_3',
    nome: 'Fone P2',
    categoria: 'Fones',
    marca: 'SoundPro',
    codigo: 'FON-P2',
    codigo_barras: '7891234560303',
    estoque: 22,
    estoque_minimo: 5,
    localizacao: 'Vitrine V1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_fone_kimaster_tws350',
    nome: 'Fone Kimaster TWS-350',
    categoria: 'Fones',
    marca: 'Kimaster',
    codigo: 'FON-KIM-TWS350',
    codigo_barras: '7891234560304',
    estoque: 0,
    estoque_minimo: 3,
    localizacao: 'Vitrine V1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_fone_kaidi_kd788',
    nome: 'Fone Kaidi KD-788',
    categoria: 'Fones',
    marca: 'Kaidi',
    codigo: 'FON-KAI-KD788',
    codigo_barras: '7891234560305',
    estoque: 5,
    estoque_minimo: 3,
    localizacao: 'Vitrine V1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Películas
  {
    id: 'prod_pel_1',
    nome: 'Película A56',
    categoria: 'Películas',
    marca: 'GlassShield',
    codigo: 'PEL-A56',
    codigo_barras: '7891234560401',
    estoque: 30,
    estoque_minimo: 8,
    localizacao: 'Gaveta P1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_pel_2',
    nome: 'Película G34',
    categoria: 'Películas',
    marca: 'GlassShield',
    codigo: 'PEL-G34',
    codigo_barras: '7891234560402',
    estoque: 25,
    estoque_minimo: 8,
    localizacao: 'Gaveta P1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_pel_3',
    nome: 'Película S24',
    categoria: 'Películas',
    marca: 'GlassShield',
    codigo: 'PEL-S24',
    codigo_barras: '7891234560403',
    estoque: 28,
    estoque_minimo: 8,
    localizacao: 'Gaveta P1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Capinhas
  {
    id: 'prod_cap_1',
    nome: 'Capinha iPhone 15',
    categoria: 'Capinhas',
    marca: 'ArmorCase',
    codigo: 'CAP-IP15',
    codigo_barras: '7891234560501',
    estoque: 15,
    estoque_minimo: 5,
    localizacao: 'Prateleira C1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_cap_2',
    nome: 'Capinha A36',
    categoria: 'Capinhas',
    marca: 'ArmorCase',
    codigo: 'CAP-A36',
    codigo_barras: '7891234560502',
    estoque: 12,
    estoque_minimo: 5,
    localizacao: 'Prateleira C1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_cap_3',
    nome: 'Capinha S24',
    categoria: 'Capinhas',
    marca: 'ArmorCase',
    codigo: 'CAP-S24',
    codigo_barras: '7891234560503',
    estoque: 19,
    estoque_minimo: 5,
    localizacao: 'Prateleira C1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Garrafas
  {
    id: 'prod_gar_rosa',
    nome: 'Garrafa Térmica Rosa',
    categoria: 'Garrafas',
    marca: 'Geral',
    codigo: 'GAR-TERM-ROSA',
    codigo_barras: '7891234560601',
    estoque: 1,
    estoque_minimo: 2,
    localizacao: 'Prateleira G1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_gar_cinza',
    nome: 'Garrafa Térmica Cinza',
    categoria: 'Garrafas',
    marca: 'Geral',
    codigo: 'GAR-TERM-CINZA',
    codigo_barras: '7891234560602',
    estoque: 2,
    estoque_minimo: 2,
    localizacao: 'Prateleira G1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_gar_lilas',
    nome: 'Garrafa Térmica Lilás',
    categoria: 'Garrafas',
    marca: 'Geral',
    codigo: 'GAR-TERM-LILAS',
    codigo_barras: '7891234560603',
    estoque: 2,
    estoque_minimo: 2,
    localizacao: 'Prateleira G1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_gar_creme',
    nome: 'Garrafa Térmica Creme',
    categoria: 'Garrafas',
    marca: 'Geral',
    codigo: 'GAR-TERM-CREME',
    codigo_barras: '7891234560604',
    estoque: 1,
    estoque_minimo: 2,
    localizacao: 'Prateleira G1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Fones Bluetooth
  {
    id: 'prod_fon_head_preto',
    nome: 'Headphone Bluetooth Preto',
    categoria: 'Fones',
    marca: 'Bluetooth',
    codigo: 'FON-HEAD-PRETO',
    codigo_barras: '7891234560605',
    estoque: 3,
    estoque_minimo: 2,
    localizacao: 'Prateleira F1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_fon_blu_branco',
    nome: 'Fone Bluetooth (caixa branca)',
    categoria: 'Fones',
    marca: 'Bluetooth',
    codigo: 'FON-BLU-BRANCO',
    codigo_barras: '7891234560606',
    estoque: 2,
    estoque_minimo: 2,
    localizacao: 'Prateleira F1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Suportes
  {
    id: 'prod_sup_veicular',
    nome: 'Suporte Veicular para Celular',
    categoria: 'Suportes',
    marca: 'Geral',
    codigo: 'SUP-VEICULAR',
    codigo_barras: '7891234560607',
    estoque: 4,
    estoque_minimo: 2,
    localizacao: 'Prateleira S1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_sup_mesa',
    nome: 'Suporte de Mesa para Celular',
    categoria: 'Suportes',
    marca: 'Geral',
    codigo: 'SUP-MESA',
    codigo_barras: '7891234560608',
    estoque: 2,
    estoque_minimo: 2,
    localizacao: 'Prateleira S1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Cabos e Adaptadores
  {
    id: 'prod_cab_hdmi_18m',
    nome: 'Cabo HDMI 1,8 m',
    categoria: 'Cabos e Adaptadores',
    marca: 'Geral',
    codigo: 'CAB-HDMI-18M',
    codigo_barras: '7891234560609',
    estoque: 2,
    estoque_minimo: 2,
    localizacao: 'Prateleira C1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_adp_usb',
    nome: 'Adaptador USB',
    categoria: 'Cabos e Adaptadores',
    marca: 'Geral',
    codigo: 'ADP-USB',
    codigo_barras: '7891234560610',
    estoque: 2,
    estoque_minimo: 2,
    localizacao: 'Prateleira C1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_adp_otg',
    nome: 'Adaptador OTG',
    categoria: 'Cabos e Adaptadores',
    marca: 'Geral',
    codigo: 'ADP-OTG',
    codigo_barras: '7891234560611',
    estoque: 1,
    estoque_minimo: 2,
    localizacao: 'Prateleira C1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_adp_tomada',
    nome: 'Adaptador de Tomada',
    categoria: 'Cabos e Adaptadores',
    marca: 'Geral',
    codigo: 'ADP-TOMADA',
    codigo_barras: '7891234560612',
    estoque: 2,
    estoque_minimo: 2,
    localizacao: 'Prateleira C1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Carregadores
  {
    id: 'prod_car_powerbank',
    nome: 'Carregador Portátil (Power Bank)',
    categoria: 'Carregadores',
    marca: 'PowerTech',
    codigo: 'CAR-POWERBANK',
    codigo_barras: '7891234560613',
    estoque: 4,
    estoque_minimo: 2,
    localizacao: 'Prateleira B1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_car_parede_usb',
    nome: 'Carregador de Parede USB',
    categoria: 'Carregadores',
    marca: 'PowerTech',
    codigo: 'CAR-PAREDE-USB',
    codigo_barras: '7891234560614',
    estoque: 2,
    estoque_minimo: 2,
    localizacao: 'Prateleira B1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_car_veicular',
    nome: 'Carregador Veicular',
    categoria: 'Carregadores',
    marca: 'PowerTech',
    codigo: 'CAR-VEICULAR',
    codigo_barras: '7891234560615',
    estoque: 1,
    estoque_minimo: 2,
    localizacao: 'Prateleira B1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Smartwatch
  {
    id: 'prod_sma_smartwatch',
    nome: 'Smartwatch',
    categoria: 'Smartwatch',
    marca: 'Geral',
    codigo: 'SMA-SMARTWATCH',
    codigo_barras: '7891234560616',
    estoque: 1,
    estoque_minimo: 2,
    localizacao: 'Prateleira W1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Capinhas
  {
    id: 'prod_cap_iphone13',
    nome: 'Capinha Transparente iPhone 13',
    categoria: 'Capinhas',
    marca: 'Geral',
    codigo: 'CAP-IPHONE13',
    codigo_barras: '7891234560617',
    estoque: 2,
    estoque_minimo: 2,
    localizacao: 'Prateleira P1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_cap_transp_div',
    nome: 'Capinha Transparente (modelo diverso)',
    categoria: 'Capinhas',
    marca: 'Geral',
    codigo: 'CAP-TRANSP-DIV',
    codigo_barras: '7891234560618',
    estoque: 3,
    estoque_minimo: 2,
    localizacao: 'Prateleira P1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Jogos
  {
    id: 'prod_jog_uno',
    nome: 'UNO',
    categoria: 'Jogos',
    marca: 'Mattel',
    codigo: 'JOG-UNO',
    codigo_barras: '7891234560619',
    estoque: 2,
    estoque_minimo: 2,
    localizacao: 'Prateleira J1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Acessórios
  {
    id: 'prod_acs_mouse_usb',
    nome: 'Mouse USB',
    categoria: 'Acessórios',
    marca: 'Geral',
    codigo: 'ACS-MOUSE-USB',
    codigo_barras: '7891234560620',
    estoque: 1,
    estoque_minimo: 2,
    localizacao: 'Prateleira A2',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_acs_antena_tv',
    nome: 'Antena para TV Digital',
    categoria: 'Acessórios',
    marca: 'Geral',
    codigo: 'ACS-ANTENA-TV',
    codigo_barras: '7891234560621',
    estoque: 1,
    estoque_minimo: 2,
    localizacao: 'Prateleira A2',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_acs_hub_usb',
    nome: 'Hub USB',
    categoria: 'Acessórios',
    marca: 'Geral',
    codigo: 'ACS-HUB-USB',
    codigo_barras: '7891234560622',
    estoque: 1,
    estoque_minimo: 2,
    localizacao: 'Prateleira A2',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
  }
  return fallback;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

// Ensure default users exist and enforce single supremo rule
function getUsers(): (User & { senha_hash: string })[] {
  let users = getStored(USERS_KEY, initialUsers);

  // Clean up any other user assigned as admin_supremo if email isn't luisfernandosantossilva1940@gmail.com
  let supremoFound = false;
  users = users.map(u => {
    if (u.cargo === 'admin_supremo') {
      if (u.email.toLowerCase() === 'luisfernandosantossilva1940@gmail.com' && !supremoFound) {
        supremoFound = true;
      } else {
        return { ...u, cargo: 'funcionario' as const };
      }
    }
    return u;
  });

  // Ensure Luis Fernando is always present as the single Administrador Supremo
  if (!users.some(u => u.email.toLowerCase() === 'luisfernandosantossilva1940@gmail.com')) {
    users.unshift(initialUsers[0]);
  }

  setStored(USERS_KEY, users);
  return users;
}

function getProducts(): Product[] {
  const prods = getStored<Product[]>(PRODUCTS_KEY, []);
  const validProds: Product[] = [];
  let shouldPrune = false;
  for (const p of prods) {
    if (!p || !p.nome || p.id.startsWith('test_prod_') || p.nome.includes('[BOT_TEST]')) {
      continue;
    }
    if (p.excluir_ao_zerar && p.estoque <= 0) {
      shouldPrune = true;
      continue;
    }
    validProds.push(p);
  }
  if (shouldPrune) {
    setStored(PRODUCTS_KEY, validProds);
  }
  return validProds;
}

function getCategories(): Category[] {
  let cats = getStored<Category[]>(CATEGORIES_KEY, []);
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const uniqueCats: Category[] = [];
  let needsSave = false;

  if (!cats || cats.length === 0) {
    cats = [
      { id: 'cat_peliculas', nome: 'Películas', cor: '#3b82f6', icone: 'Smartphone', created_at: new Date().toISOString() },
      { id: 'cat_capinhas', nome: 'Capinhas', cor: '#ec4899', icone: 'Shield', created_at: new Date().toISOString() },
      { id: 'cat_cabos', nome: 'Cabos', cor: '#10b981', icone: 'Zap', created_at: new Date().toISOString() },
      { id: 'cat_carregadores', nome: 'Carregadores', cor: '#f59e0b', icone: 'BatteryCharging', created_at: new Date().toISOString() },
      { id: 'cat_fones', nome: 'Fones', cor: '#8b5cf6', icone: 'Headphones', created_at: new Date().toISOString() },
      { id: 'cat_garrafas', nome: 'Garrafas', cor: '#06b6d4', icone: 'Package', created_at: new Date().toISOString() },
      { id: 'cat_smartwatch', nome: 'Smartwatch', cor: '#a855f7', icone: 'Watch', created_at: new Date().toISOString() },
      { id: 'cat_baterias', nome: 'Baterias', cor: '#ef4444', icone: 'Battery', created_at: new Date().toISOString() }
    ];
    needsSave = true;
  }

  for (const c of cats) {
    if (!c || !c.nome) continue;
    const normName = c.nome.trim();
    const normNameLower = normName.toLowerCase();
    const catId = c.id || `cat_${normNameLower}`;
    if (seenIds.has(catId) || seenNames.has(normNameLower)) continue;
    seenIds.add(catId);
    seenNames.add(normNameLower);

    uniqueCats.push({
      ...c,
      id: catId,
      nome: normName
    });
  }

  if (needsSave) {
    setStored(CATEGORIES_KEY, uniqueCats);
  }

  return uniqueCats;
}

function getMovements(): Movement[] {
  const movs = getStored<Movement[]>(MOVEMENTS_KEY, []);
  const clean = movs.filter(
    (m) => !m.observacao?.includes('[BOT_TEST]') && !m.produto_nome?.includes('[BOT_TEST]')
  );
  if (clean.length !== movs.length) {
    setStored(MOVEMENTS_KEY, clean);
  }
  return clean;
}

function getHistory(): AuditLog[] {
  return getStored(HISTORY_KEY, []);
}

function getDemands(): CustomerDemand[] {
  const demands = getStored<CustomerDemand[]>(DEMANDS_KEY, []);
  const clean = demands.filter(
    (d) => !d.produto_nome?.includes('[BOT_TEST]') && !d.produto_nome?.includes('Produto Solicitado')
  );
  if (clean.length !== demands.length) {
    setStored(DEMANDS_KEY, clean);
  }
  return clean;
}

export const localStore = {
  getCategoryProfiles: (): Record<string, CategoryProfile> => {
    const stored = getStored<Record<string, CategoryProfile>>(CATEGORY_PROFILES_KEY, {});
    return { ...DEFAULT_CATEGORY_PROFILES, ...stored };
  },

  getCategoryProfile: (categoriaName: string): CategoryProfile | null => {
    const profiles = localStore.getCategoryProfiles();
    const key = (categoriaName || '').trim();
    if (!key) return null;
    if (profiles[key]) return profiles[key];
    const foundKey = Object.keys(profiles).find(k => k.toLowerCase() === key.toLowerCase());
    return foundKey ? profiles[foundKey] : null;
  },

  saveCategoryProfile: (profile: CategoryProfile): void => {
    if (!profile.categoria) return;
    const profiles = getStored<Record<string, CategoryProfile>>(CATEGORY_PROFILES_KEY, {});
    profiles[profile.categoria.trim()] = {
      categoria: profile.categoria.trim(),
      estoque_minimo: profile.estoque_minimo ?? 5,
      nao_relevante: Boolean(profile.nao_relevante),
      excluir_ao_zerar: Boolean(profile.excluir_ao_zerar)
    };
    setStored(CATEGORY_PROFILES_KEY, profiles);
  },

  login: (email: string, senha: string): { token: string; user: User } => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanSenha = (senha || '').trim();
    const users = getUsers();

    let found = users.find(u => u.email.toLowerCase() === cleanEmail && u.ativo);

    // Special guarantee/recovery for Luis Fernando account (Admin Supremo)
    if (cleanEmail === 'luisfernandosantossilva1940@gmail.com') {
      if (!found) {
        found = {
          id: 'usr_luis',
          nome: 'Luis Fernando Santos',
          email: 'luisfernandosantossilva1940@gmail.com',
          senha_hash: cleanSenha || '@Luisoo5',
          cargo: 'admin_supremo',
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        users.unshift(found);
        setStored(USERS_KEY, users);
      } else {
        found.cargo = 'admin_supremo';
        found.senha_hash = cleanSenha || found.senha_hash || '@Luisoo5';
        setStored(USERS_KEY, users);
      }
    }

    if (!found) {
      throw new Error('E-mail ou senha incorretos. Verifique os dados digitados.');
    }

    if (found.senha_hash.trim() !== cleanSenha && cleanEmail !== 'luisfernandosantossilva1940@gmail.com') {
      throw new Error('Senha incorreta. Tente novamente.');
    }

    const user: User = {
      id: found.id,
      nome: found.nome,
      email: found.email,
      cargo: found.cargo,
      ativo: found.ativo,
      created_at: found.created_at,
      updated_at: found.updated_at
    };

    const token = `local-token-${found.id}-${Date.now()}`;
    return { token, user };
  },

  register: (userData: { nome: string; email: string; senha: string; cargo?: string }): { token: string; user: User } => {
    const users = getUsers();
    const cleanEmail = userData.email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('E-mail já cadastrado no sistema.');
    }

    let requestedCargo = userData.cargo || 'funcionario';
    if (cleanEmail === 'luisfernandosantossilva1940@gmail.com') {
      requestedCargo = 'admin_supremo';
    } else if (requestedCargo === 'admin_supremo') {
      throw new Error('O cargo de Administrador Supremo é exclusivo do e-mail "luisfernandosantossilva1940@gmail.com".');
    }

    if (requestedCargo === 'gerente') {
      const currentGerente = users.find(u => u.cargo === 'gerente' && u.ativo);
      if (currentGerente) {
        throw new Error(`O sistema permite apenas 1 Gerente ativo. Já existe o gerente "${currentGerente.nome}". Outros cadastros serão configurados como Funcionário.`);
      }
    }

    const now = new Date().toISOString();
    const newUserRecord: User & { senha_hash: string } = {
      id: `usr_${Date.now()}`,
      nome: userData.nome.trim(),
      email: cleanEmail,
      senha_hash: userData.senha.trim(),
      cargo: requestedCargo as any,
      ativo: true,
      created_at: now,
      updated_at: now
    };

    users.push(newUserRecord);
    setStored(USERS_KEY, users);

    const user: User = {
      id: newUserRecord.id,
      nome: newUserRecord.nome,
      email: newUserRecord.email,
      cargo: newUserRecord.cargo,
      ativo: newUserRecord.ativo,
      created_at: newUserRecord.created_at,
      updated_at: newUserRecord.updated_at
    };

    const token = `local-token-${user.id}-${Date.now()}`;
    return { token, user };
  },

  getMe: (token: string | null): { user: User } => {
    const users = getUsers();
    if (token) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        const uid = parts[2];
        const found = users.find(u => u.id === uid);
        if (found) {
          return {
            user: {
              id: found.id,
              nome: found.nome,
              email: found.email,
              cargo: found.cargo,
              ativo: found.ativo,
              created_at: found.created_at,
              updated_at: found.updated_at
            }
          };
        }
      }
    }
    // Fallback default user (Luis Fernando or Supremo)
    const fallback = users[0];
    return {
      user: {
        id: fallback.id,
        nome: fallback.nome,
        email: fallback.email,
        cargo: fallback.cargo,
        ativo: fallback.ativo,
        created_at: fallback.created_at,
        updated_at: fallback.updated_at
      }
    };
  },

  getUsersList: (): User[] => {
    return getUsers().filter(u => u.ativo).map(({ senha_hash, ...rest }) => rest);
  },

  createUser: (userData: { nome: string; email: string; senha: string; cargo: string }): User => {
    const users = getUsers();
    const cleanEmail = userData.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('E-mail já cadastrado.');
    }
    if (userData.cargo === 'admin_supremo') {
      if (cleanEmail !== 'luisfernandosantossilva1940@gmail.com') {
        throw new Error('Apenas o Administrador do sistema pode possuir esta permissão.');
      }
      const currentSupremo = users.find(u => u.cargo === 'admin_supremo' && u.ativo);
      if (currentSupremo) {
        throw new Error('O sistema permite apenas 1 Administrador principal ativo.');
      }
    }
    if (userData.cargo === 'gerente') {
      const currentGerente = users.find(u => u.cargo === 'gerente' && u.ativo);
      if (currentGerente) {
        throw new Error(`O sistema permite apenas 1 Gerente ativo. Já existe o gerente "${currentGerente.nome}".`);
      }
    }
    const now = new Date().toISOString();
    const newUserRecord = {
      id: `usr_${Date.now()}`,
      nome: userData.nome.trim(),
      email: cleanEmail,
      senha_hash: userData.senha.trim(),
      cargo: userData.cargo as any,
      ativo: true,
      created_at: now,
      updated_at: now
    };
    users.push(newUserRecord);
    setStored(USERS_KEY, users);
    const { senha_hash, ...rest } = newUserRecord;
    return rest;
  },

  updateUser: (id: string, userData: Partial<User & { senha?: string }>): User => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const existing = users[idx];

    if (userData.cargo === 'admin_supremo') {
      const targetEmail = (userData.email || existing.email).trim().toLowerCase();
      if (targetEmail !== 'luisfernandosantossilva1940@gmail.com') {
        throw new Error('Apenas o Administrador do sistema pode possuir esta permissão.');
      }
      const currentSupremo = users.find(u => u.cargo === 'admin_supremo' && u.ativo && u.id !== id);
      if (currentSupremo) {
        throw new Error('O sistema permite apenas 1 Administrador principal ativo.');
      }
    }

    if (userData.cargo === 'gerente' && existing.cargo !== 'gerente') {
      const currentGerente = users.find(u => u.cargo === 'gerente' && u.ativo && u.id !== id);
      if (currentGerente) {
        throw new Error(`O sistema permite apenas 1 Gerente ativo. Já existe o gerente "${currentGerente.nome}".`);
      }
    }
    const updated = {
      ...existing,
      ...userData,
      senha_hash: userData.senha ? userData.senha.trim() : existing.senha_hash,
      updated_at: new Date().toISOString()
    };
    users[idx] = updated;
    setStored(USERS_KEY, users);
    const { senha_hash, ...rest } = updated;
    return rest;
  },

  deleteUser: (id: string): { message: string } => {
    const users = getUsers();
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete && (userToDelete.cargo === 'admin_supremo' || userToDelete.email === 'luisfernandosantossilva1940@gmail.com')) {
      throw new Error('Não é possível remover o Administrador Supremo do sistema.');
    }
    const filtered = users.filter(u => u.id !== id);
    setStored(USERS_KEY, filtered);
    return { message: 'Usuário removido com sucesso' };
  },

  getCategoriesList: (): Category[] => {
    return getCategories();
  },

  createCategory: (nome: string, cor?: string, icone?: string, descricao?: string): Category => {
    const categories = getCategories();
    const cleanName = (nome || '').trim();
    const existing = categories.find(c => (c.nome || '').toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      existing.cor = cor || existing.cor;
      existing.icone = icone || existing.icone;
      existing.descricao = descricao || existing.descricao;
      setStored(CATEGORIES_KEY, categories);
      return existing;
    }
    const newCat: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nome: cleanName,
      cor: cor || '#3b82f6',
      icone: icone || 'Folder',
      descricao: descricao || '',
      created_at: new Date().toISOString()
    };
    categories.push(newCat);
    setStored(CATEGORIES_KEY, categories);
    return newCat;
  },

  deleteCategory: (id: string): { message: string } => {
    const categories = getCategories();
    const filtered = categories.filter(c => c.id !== id);
    setStored(CATEGORIES_KEY, filtered);
    return { message: 'Categoria removida com sucesso' };
  },

  updateCategory: (id: string, data: Partial<Category>): Category | null => {
    const categories = getCategories();
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const oldName = categories[idx].nome;
    const updated = { ...categories[idx], ...data };
    categories[idx] = updated;
    setStored(CATEGORIES_KEY, categories);

    if (data.nome && data.nome !== oldName) {
      const products = getProducts();
      let prodUpdated = false;
      for (const p of products) {
        if (p.categoria === oldName) {
          p.categoria = data.nome;
          prodUpdated = true;
        }
      }
      if (prodUpdated) {
        setStored(PRODUCTS_KEY, products);
      }
    }
    return updated;
  },

  getProductsList: (search?: string, categoria?: string): Product[] => {
    let list = getProducts().filter(p => p.ativo !== false && !p.lixeira);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          (p.nome || '').toLowerCase().includes(q) ||
          (p.codigo || '').toLowerCase().includes(q) ||
          (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q)) ||
          (p.marca || '').toLowerCase().includes(q)
      );
    }
    if (categoria && categoria !== 'Todas') {
      list = list.filter(p => (p.categoria || '').toLowerCase() === categoria.toLowerCase());
    }
    return list;
  },

  getProductById: (id: string): Product | null => {
    if (!id) return null;
    const prods = getStored<Product[]>(PRODUCTS_KEY, []);
    let p = prods.find(prod => prod.id === id);
    if (!p) {
      p = getProducts().find(prod => prod.id === id);
    }
    return p || null;
  },

  createProduct: (data: Omit<Product, 'id' | 'ativo' | 'created_at' | 'updated_at'>): Product => {
    const products = getProducts();
    const now = new Date().toISOString();
    const newProd: Product = {
      ...data,
      id: `prod_${Date.now()}`,
      ativo: true,
      created_at: now,
      updated_at: now
    };
    products.push(newProd);
    setStored(PRODUCTS_KEY, products);
    return newProd;
  },

  updateProduct: (id: string, data: Partial<Product>): Product => {
    const products = getStored<Product[]>(PRODUCTS_KEY, []);
    let idx = products.findIndex(p => p.id === id);
    if (idx === -1) {
      const allProds = getProducts();
      idx = allProds.findIndex(p => p.id === id);
      if (idx !== -1) {
        products.push(allProds[idx]);
        idx = products.length - 1;
      }
    }
    if (idx === -1) {
      const newProd: Product = {
        id,
        nome: data.nome || 'Produto',
        categoria: data.categoria || 'Geral',
        marca: data.marca || 'Padrão',
        codigo: data.codigo || id,
        estoque: data.estoque ?? 0,
        estoque_minimo: data.estoque_minimo ?? 5,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data
      };
      products.push(newProd);
      setStored(PRODUCTS_KEY, products);
      return newProd;
    }
    const updated = {
      ...products[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    if (updated.excluir_ao_zerar && updated.estoque <= 0) {
      const filtered = products.filter(p => p.id !== id);
      setStored(PRODUCTS_KEY, filtered);
      return { ...updated, ativo: false, estoque: 0 };
    }
    products[idx] = updated;
    setStored(PRODUCTS_KEY, products);
    return updated;
  },

  zeroAllProductsStock: (): void => {
    const products = getProducts();
    const updated = products.map((p) => ({
      ...p,
      estoque: 0,
      updated_at: new Date().toISOString()
    }));
    setStored(PRODUCTS_KEY, updated);
  },

  clearAllDataAndResetStock: (): void => {
    const products = getProducts();
    const zeroed = products.map((p) => ({
      ...p,
      estoque: 0,
      updated_at: new Date().toISOString()
    }));
    setStored(PRODUCTS_KEY, zeroed);
    setStored(MOVEMENTS_KEY, []);
    setStored(DEMANDS_KEY, []);
    setStored(HISTORY_KEY, []);
  },

  deleteProduct: (id: string): { message: string } => {
    const products = getProducts();
    const filtered = products.filter(p => p.id !== id);
    setStored(PRODUCTS_KEY, filtered);
    return { message: 'Produto removido com sucesso' };
  },

  addStockEntry: (produto_id: string, quantidade: number, observacao?: string): Product => {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === produto_id);
    if (idx === -1) throw new Error('Produto não encontrado');

    products[idx].estoque += quantidade;
    products[idx].updated_at = new Date().toISOString();

    if (products[idx].estoque >= 0) {
      const divs = getStored<StockDivergenceRecord[]>(DIVERGENCES_KEY, []);
      let changed = false;
      divs.forEach(d => {
        if (d.produto_id === produto_id && d.status === 'Aberta') {
          d.status = 'Corrigida';
          d.estoque_atual = products[idx].estoque;
          d.data_correcao = new Date().toISOString();
          d.updated_at = new Date().toISOString();
          changed = true;
        }
      });
      if (changed) setStored(DIVERGENCES_KEY, divs);
    }

    setStored(PRODUCTS_KEY, products);

    const movements = getMovements();
    movements.unshift({
      id: `mov_${Date.now()}`,
      produto_id,
      produto_nome: products[idx].nome,
      produto_codigo: products[idx].codigo,
      usuario_id: 'usr_current',
      usuario_nome: 'Operador',
      tipo: 'entrada',
      quantidade,
      observacao,
      created_at: new Date().toISOString()
    });
    setStored(MOVEMENTS_KEY, movements);

    return products[idx];
  },

  addStockExit: (items: { produtoId: string; quantidade: number }[], observacao?: string, user?: { id: string; nome: string }): { message: string; movements: Movement[] } => {
    const products = getProducts();
    const movements = getMovements();
    const createdMovements: Movement[] = [];

    for (const item of items) {
      const idx = products.findIndex(p => p.id === item.produtoId);
      if (idx !== -1) {
        products[idx].estoque -= item.quantidade;
        products[idx].updated_at = new Date().toISOString();

        if (products[idx].estoque < 0) {
          const divs = getStored<StockDivergenceRecord[]>(DIVERGENCES_KEY, []);
          const existingIdx = divs.findIndex(d => d.produto_id === products[idx].id && d.status === 'Aberta');
          if (existingIdx >= 0) {
            divs[existingIdx].estoque_atual = products[idx].estoque;
            divs[existingIdx].updated_at = new Date().toISOString();
          } else {
            divs.unshift({
              id: `div_${products[idx].id}_${Date.now()}`,
              produto_id: products[idx].id,
              produto_nome: products[idx].nome,
              categoria: products[idx].categoria,
              estoque_no_momento: products[idx].estoque,
              estoque_atual: products[idx].estoque,
              data_primeira_divergencia: new Date().toISOString(),
              usuario_id: user?.id || 'usr_current',
              usuario_nome: user?.nome || 'Operador',
              status: 'Aberta',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
          setStored(DIVERGENCES_KEY, divs);
        }

        const mov: Movement = {
          id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          produto_id: item.produtoId,
          produto_nome: products[idx].nome,
          produto_codigo: products[idx].codigo,
          usuario_id: user?.id || 'usr_current',
          usuario_nome: user?.nome || 'Operador',
          tipo: 'saida',
          quantidade: item.quantidade,
          observacao,
          created_at: new Date().toISOString()
        };
        movements.unshift(mov);
        createdMovements.push(mov);
      }
    }

    const finalProducts = products.filter(p => !(p.excluir_ao_zerar && p.estoque <= 0));
    setStored(PRODUCTS_KEY, finalProducts);
    setStored(MOVEMENTS_KEY, movements);

    return { message: 'Saída registrada com sucesso', movements: createdMovements };
  },


  getDashboardStats: (): DashboardStats => {
    const products = getProducts().filter(p => p.ativo);
    const totalItens = products.reduce((acc, p) => acc + p.estoque, 0);
    const produtosZerados = products.filter(p => p.estoque <= 0).length;
    const produtosCriticos = products.filter(p => p.estoque > 0 && p.estoque <= p.estoque_minimo).length;

    const movements = getMovements();

    const alertas: DashboardStats['alertas'] = [];
    if (produtosZerados > 0) {
      alertas.push({
        id: 'alt_1',
        tipo: 'critico',
        mensagem: `${produtosZerados} produto(s) com estoque completamente zerado!`,
        data: new Date().toISOString()
      });
    }

    return {
      total_produtos: products.length,
      total_unidades: totalItens,
      produtos_em_falta: produtosZerados,
      produtos_proximos_minimo: produtosCriticos,
      ultimas_movimentacoes: movements.slice(0, 5),
      produtos_recentes: products.slice(0, 5),
      alertas
    };
  },

  getOutOfStock: (): (Product & { prioridade: string; ultima_venda: string })[] => {
    const products = getProducts().filter(p => p.ativo && p.estoque <= p.estoque_minimo);
    return products.map(p => ({
      ...p,
      prioridade: p.estoque <= 0 ? 'ALTA' : 'MEDIA',
      ultima_venda: 'Recente'
    }));
  },

  getTopMoved: (periodo: string): TopMovedProduct[] => {
    const movements = getMovements().filter(m => m.tipo === 'saida');
    const counts: Record<string, { id: string; nome: string; codigo: string; categoria: string; total: number; estoque: number }> = {};

    movements.forEach(m => {
      if (!counts[m.produto_id]) {
        counts[m.produto_id] = {
          id: m.produto_id,
          nome: m.produto_nome,
          codigo: m.produto_codigo,
          categoria: 'Geral',
          total: 0,
          estoque: 10
        };
      }
      counts[m.produto_id].total += m.quantidade;
    });

    return Object.values(counts)
      .map((val, idx) => ({
        id: val.id,
        nome: val.nome,
        codigo: val.codigo,
        categoria: val.categoria,
        quantidade_movimentada: val.total,
        estoque_atual: val.estoque,
        velocidade_saida: (val.total > 10 ? 'Alta' : val.total > 5 ? 'Média' : 'Baixa') as any,
        ranking: idx + 1
      }))
      .sort((a, b) => b.quantidade_movimentada - a.quantidade_movimentada)
      .slice(0, 10);
  },

  getHistory: (): AuditLog[] => {
    const history = getHistory();
    if (history.length === 0) {
      return [
        {
          id: 'hist_1',
          usuario: 'Luis Fernando Santos',
          acao: 'LOGIN',
          descricao: 'Acesso efetuado no sistema (admin_supremo).',
          created_at: new Date().toISOString()
        }
      ];
    }
    return history;
  },

  getRestockAnalysis: () => {
    const products = getProducts().filter(p => p.ativo && p.estoque <= p.estoque_minimo);
    const items = products.map(p => {
      return {
        id: p.id,
        nome: p.nome,
        codigo: p.codigo,
        categoria: p.categoria,
        marca: p.marca,
        localizacao: p.localizacao,
        estoque_atual: p.estoque,
        estoque_minimo: p.estoque_minimo,
        nivel_risco: (p.estoque === 0 ? 'CRITICO' : 'ALERTA') as any
      };
    });

    return {
      total_produtos_criticos: products.length,
      items,
      source: 'Análise Local de Estoque'
    };
  },

  getAIInsights: (): { insights: AIInsight[]; source: string } => {
    const products = getProducts().filter(p => p.ativo);
    const zerados = products.filter(p => p.estoque === 0);
    const criticos = products.filter(p => p.estoque > 0 && p.estoque <= p.estoque_minimo);

    const insights: AIInsight[] = [];

    if (zerados.length > 0) {
      insights.push({
        id: 'ins_1',
        tipo: 'reposicao_urgente',
        titulo: 'Produtos com Estoque Zerado',
        descricao: `Existem ${zerados.length} produto(s) sem nenhuma unidade disponível. Priorize a reposição imediata.`,
        prioridade: 'alta',
        data_analise: new Date().toISOString()
      });
    }

    if (criticos.length > 0) {
      insights.push({
        id: 'ins_2',
        tipo: 'reposicao_urgente',
        titulo: 'Produtos em Nível Crítico',
        descricao: `${criticos.length} produto(s) atingiram ou estão abaixo do estoque mínimo de segurança.`,
        prioridade: 'media',
        data_analise: new Date().toISOString()
      });
    }

    insights.push({
      id: 'ins_3',
      tipo: 'otimizacao',
      titulo: 'Giro de Estoque Estável',
      descricao: 'Monitore o fluxo de entrada e saída no painel para evitar perdas ou rupturas.',
      prioridade: 'baixa',
      data_analise: new Date().toISOString()
    });

    return { insights, source: 'Análise de Indicadores de Estoque' };
  },

  getCustomerDemands: (): CustomerDemand[] => {
    return getDemands();
  },

  registerCustomerDemand: (data: {
    produto_nome: string;
    produto_id?: string;
    solicitante_nome?: string;
    confirmou_erro_contagem?: boolean;
  }) => {
    const products = getProducts().filter(p => p.ativo);
    const demands = getDemands();
    const normInputName = (data.produto_nome || '').trim().toLowerCase();

    const prod = products.find(
      p => (p.nome || '').toLowerCase() === normInputName || p.id === data.produto_id
    );

    if (prod) {
      if (prod.estoque > 0 && !data.confirmou_erro_contagem) {
        return {
          status_code: 'EXISTS_HAS_STOCK_AWAITING_CONFIRMATION' as const,
          message: `O produto "${prod.nome}" possui ${prod.estoque} UN no sistema. Confirma divergência de contagem?`,
          product: prod
        };
      }

      if (data.confirmou_erro_contagem && prod.estoque > 0) {
        prod.estoque = 0;
        setStored(PRODUCTS_KEY, products);
      }

      // Check if demand entry for this registered product already exists
      const existingDemand = demands.find(
        d => d.produto_id === prod.id || (d.produto_nome && (prod.nome || '') && d.produto_nome.trim().toLowerCase() === (prod.nome || '').trim().toLowerCase())
      );

      if (existingDemand) {
        existingDemand.quantidade_solicitacoes = (existingDemand.quantidade_solicitacoes || 1) + 1;
        existingDemand.estoque_no_momento = prod.estoque;
        existingDemand.updated_at = new Date().toISOString();
        setStored(DEMANDS_KEY, demands);

        return {
          status_code: 'EXISTS_STOCK_ZEROED' as const,
          message: `Solicitação registrada. "${prod.nome}" procurado ${existingDemand.quantidade_solicitacoes}x.`,
          product: prod,
          demand: existingDemand
        };
      }

      const demand: CustomerDemand = {
        id: `dem_${Date.now()}`,
        produto_id: prod.id,
        produto_nome: prod.nome,
        cadastrado: true,
        quantidade_solicitacoes: 1,
        estoque_no_momento: prod.estoque,
        solicitante_nome: data.solicitante_nome,
        status: prod.estoque === 0 ? 'sem_estoque' : 'estoque_zerado_por_divergencia',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      demands.unshift(demand);
      setStored(DEMANDS_KEY, demands);

      return {
        status_code: 'EXISTS_STOCK_ZEROED' as const,
        message: `Solicitação registrada para "${prod.nome}".`,
        product: prod,
        demand
      };
    }

    // Unregistered product demand check for duplicates
    const existingDemand = demands.find(
      d => !d.cadastrado && (d.produto_nome || '').trim().toLowerCase() === normInputName
    );

    if (existingDemand) {
      existingDemand.quantidade_solicitacoes = (existingDemand.quantidade_solicitacoes || 1) + 1;
      existingDemand.updated_at = new Date().toISOString();
      setStored(DEMANDS_KEY, demands);

      return {
        status_code: 'NOT_REGISTERED_SAVED' as const,
        message: `Procura por "${data.produto_nome}" registrada (${existingDemand.quantidade_solicitacoes}x).`,
        demand: existingDemand
      };
    }

    const demand: CustomerDemand = {
      id: `dem_${Date.now()}`,
      produto_nome: data.produto_nome.trim(),
      cadastrado: false,
      quantidade_solicitacoes: 1,
      estoque_no_momento: 0,
      solicitante_nome: data.solicitante_nome,
      status: 'nao_cadastrado',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    demands.unshift(demand);
    setStored(DEMANDS_KEY, demands);

    return {
      status_code: 'NOT_REGISTERED_SAVED' as const,
      message: `Demanda de produto não cadastrado "${data.produto_nome}" registrada com sucesso.`,
      demand
    };
  },

  deleteCustomerDemand: (id: string): { message: string } => {
    const demands = getDemands().filter(d => d.id !== id);
    setStored(DEMANDS_KEY, demands);
    return { message: 'Registro removido com sucesso.' };
  },

  getPOSConfig: (): POSConfig => {
    const cfg = getStored<POSConfig | null>(POS_CONFIG_KEY, null);
    if (!cfg) return DEFAULT_POS_CONFIG;
    return { ...DEFAULT_POS_CONFIG, ...cfg };
  },

  setPOSConfig: (config: POSConfig): POSConfig => {
    setStored(POS_CONFIG_KEY, config);
    return config;
  },

  saveUsersToLocal: (users: User[]) => {
    setStored(USERS_KEY, users);
  },

  getProducts: (): Product[] => {
    return getProducts().filter(p => p.ativo);
  },

  getCategories: (): Category[] => {
    return getCategories();
  },

  getMovements: (): Movement[] => {
    return getMovements();
  },

  getDemands: (): CustomerDemand[] => {
    return getDemands();
  },

  registerSaida: (productId: string, quantity: number, user: { id: string; nome: string }, observacao?: string) => {
    return localStore.addStockExit([{ produtoId: productId, quantidade: quantity }], observacao);
  },

  updateProductStock: (productId: string, newStock: number, user: { id: string; nome: string }, tipo: 'entrada' | 'saida', quantidadeAlterada: number, observacao?: string): Product | null => {
    try {
      return localStore.updateProduct(productId, { estoque: newStock });
    } catch {
      return null;
    }
  },

  saveProductsToLocal: (products: Product[]) => {
    setStored(PRODUCTS_KEY, products);
  },

  saveCategoriesToLocal: (categories: Category[]) => {
    setStored(CATEGORIES_KEY, categories);
  },

  saveMovementsToLocal: (movements: Movement[]) => {
    setStored(MOVEMENTS_KEY, movements);
  },

  saveDemandsToLocal: (demands: CustomerDemand[]) => {
    setStored(DEMANDS_KEY, demands);
  },

  getDivergences: (): StockDivergenceRecord[] => {
    const divs = getStored<StockDivergenceRecord[]>(DIVERGENCES_KEY, []);
    const activeProds = getProducts().filter(p => p.ativo);
    let updated = [...divs];
    let changed = false;

    // Reconciliation check for any product with estoque < 0
    for (const p of activeProds) {
      if (p.estoque < 0) {
        const hasOpen = updated.some(d => d.produto_id === p.id && d.status === 'Aberta');
        if (!hasOpen) {
          updated.unshift({
            id: `div_${p.id}_${Date.now()}`,
            produto_id: p.id,
            produto_nome: p.nome,
            categoria: p.categoria,
            estoque_no_momento: p.estoque,
            estoque_atual: p.estoque,
            data_primeira_divergencia: p.updated_at || p.created_at || new Date().toISOString(),
            usuario_id: 'usr_current',
            usuario_nome: 'Frente de Caixa (Venda acima do estoque)',
            status: 'Aberta',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          changed = true;
        }
      }
    }

    // Auto-resolve any divergence where product.estoque >= 0
    updated.forEach(d => {
      const prod = activeProds.find(p => p.id === d.produto_id);
      if (prod) {
        if (prod.estoque >= 0 && d.status === 'Aberta') {
          d.status = 'Corrigida';
          d.estoque_atual = prod.estoque;
          d.data_correcao = d.data_correcao || new Date().toISOString();
          d.updated_at = new Date().toISOString();
          changed = true;
        } else if (d.estoque_atual !== prod.estoque) {
          d.estoque_atual = prod.estoque;
          changed = true;
        }
      }
    });

    if (changed) {
      setStored(DIVERGENCES_KEY, updated);
    }
    return updated;
  },

  saveDivergencesToLocal: (divergences: StockDivergenceRecord[]) => {
    setStored(DIVERGENCES_KEY, divergences);
  },

  getDashboardLayout: (userId: string): string[] | null => {
    const key = `bytecas_dash_layout_${userId || 'default'}`;
    return getStored<string[] | null>(key, null);
  },

  saveDashboardLayout: (userId: string, layout: string[]) => {
    const key = `bytecas_dash_layout_${userId || 'default'}`;
    setStored(key, layout);
  },


  saveStockSnapshot: (): Record<string, number> => {
    const products = getProducts();
    const snapshot: Record<string, number> = {};
    for (const p of products) {
      if (
        !p.nome.includes('[TESTE]') &&
        !p.nome.includes('[BOT_TEST]') &&
        !p.codigo.includes('TST-') &&
        p.marca !== 'Facilitando Meu Trabalho TestLab' &&
        p.marca !== 'Bosteca TestLab' &&
        p.marca !== 'Bytecas TestLab'
      ) {
        snapshot[p.id] = p.estoque;
      }
    }
    setStored('bytecas_stock_snapshot', snapshot);
    return snapshot;
  },

  purgeAllBotDataAndRestoreStock: () => {
    const snapshot = getStored<Record<string, number>>('bytecas_stock_snapshot', {});

    // 1. Restore real products stock to pre-test level
    let products = getProducts();
    products = products.map(p => {
      if (snapshot[p.id] !== undefined) {
        return { ...p, estoque: snapshot[p.id], updated_at: new Date().toISOString() };
      }
      return p;
    });

    // 2. Remove test products
    products = products.filter(p =>
      !p.nome.includes('[TESTE]') &&
      !p.nome.includes('[BOT_TEST]') &&
      !p.codigo.includes('TST-') &&
      !p.id.startsWith('test_prod_') &&
      p.marca !== 'Facilitando Meu Trabalho TestLab' &&
      p.marca !== 'Bosteca TestLab' &&
      p.marca !== 'Bytecas TestLab'
    );
    setStored(PRODUCTS_KEY, products);

    // 3. Remove test movements
    let movements = getMovements();
    movements = movements.filter(m =>
      !(m.observacao && (m.observacao.includes('[TESTE]') || m.observacao.includes('[BOT_TEST]'))) &&
      !(m.produto_nome && (m.produto_nome.includes('[TESTE]') || m.produto_nome.includes('[BOT_TEST]')))
    );
    setStored(MOVEMENTS_KEY, movements);

    // 4. Remove test demands
    let demands = getDemands();
    demands = demands.filter(d =>
      !(d.produto_nome && (d.produto_nome.includes('[TESTE]') || d.produto_nome.includes('[BOT_TEST]'))) &&
      !(d.solicitante_nome && (d.solicitante_nome.includes('simulado') || d.solicitante_nome.includes('[TESTE]')))
    );
    setStored(DEMANDS_KEY, demands);

    // 5. Remove test categories
    let categories = getCategories();
    categories = categories.filter(c => !c.nome.startsWith('Categoria Teste #'));
    setStored(CATEGORIES_KEY, categories);

    localStorage.removeItem('bytecas_stock_snapshot');
    return { success: true };
  },

  // --- RECURSOS EXPANDIDOS DE ESTOQUE ---

  // 1. Favoritos
  toggleFavoriteProduct: (id: string): Product => {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Produto não encontrado.');
    products[idx].favorito = !products[idx].favorito;
    products[idx].updated_at = new Date().toISOString();
    setStored(PRODUCTS_KEY, products);
    return products[idx];
  },

  // 2. Lixeira Inteligente
  moveToRecycleBin: (id: string, user: string = 'Sistema'): Product => {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Produto não encontrado.');
    products[idx].lixeira = true;
    products[idx].lixeira_data = new Date().toISOString();
    products[idx].alterado_por = user;
    products[idx].updated_at = new Date().toISOString();
    setStored(PRODUCTS_KEY, products);

    localStore.addAuditLog({
      usuario: user,
      acao: 'EXCLUSAO_LOGICA',
      descricao: `Produto "${products[idx].nome}" (${products[idx].codigo}) movido para a Lixeira Inteligente.`
    });

    return products[idx];
  },

  restoreFromRecycleBin: (id: string, user: string = 'Sistema'): Product => {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Produto não encontrado.');
    products[idx].lixeira = false;
    products[idx].lixeira_data = undefined;
    products[idx].alterado_por = user;
    products[idx].updated_at = new Date().toISOString();
    setStored(PRODUCTS_KEY, products);

    localStore.addAuditLog({
      usuario: user,
      acao: 'EDICAO',
      descricao: `Produto "${products[idx].nome}" (${products[idx].codigo}) restaurado da Lixeira.`
    });

    return products[idx];
  },

  purgeFromRecycleBin: (id: string, user: string = 'Sistema'): void => {
    let products = getProducts();
    const prod = products.find(p => p.id === id);
    if (prod) {
      products = products.filter(p => p.id !== id);
      setStored(PRODUCTS_KEY, products);
      localStore.addAuditLog({
        usuario: user,
        acao: 'EXCLUSAO_LOGICA',
        descricao: `Exclusão definitiva permanente do produto "${prod.nome}" (${prod.codigo}).`
      });
    }
  },

  // 3. Calendário Interno
  getCalendarEvents: (): CalendarEvent[] => {
    return getStored<CalendarEvent[]>(CALENDAR_KEY, initialCalendarEvents);
  },

  addCalendarEvent: (eventData: Omit<CalendarEvent, 'id' | 'created_at'>): CalendarEvent => {
    const events = localStore.getCalendarEvents();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `cal_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    events.unshift(newEvent);
    setStored(CALENDAR_KEY, events);
    return newEvent;
  },

  deleteCalendarEvent: (id: string): void => {
    const events = localStore.getCalendarEvents().filter(e => e.id !== id);
    setStored(CALENDAR_KEY, events);
  },

  // 4. Mural de Avisos
  getAnnouncements: (): Announcement[] => {
    return getStored<Announcement[]>(ANNOUNCEMENTS_KEY, initialAnnouncements);
  },

  addAnnouncement: (annData: Omit<Announcement, 'id' | 'created_at'>): Announcement => {
    const anns = localStore.getAnnouncements();
    const newAnn: Announcement = {
      ...annData,
      id: `ann_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    anns.unshift(newAnn);
    setStored(ANNOUNCEMENTS_KEY, anns);
    return newAnn;
  },

  deleteAnnouncement: (id: string): void => {
    const anns = localStore.getAnnouncements().filter(a => a.id !== id);
    setStored(ANNOUNCEMENTS_KEY, anns);
  },

  // 5. Metas de Organização
  getStoreGoals: (): StoreGoal[] => {
    return getStored<StoreGoal[]>(GOALS_KEY, initialGoals);
  },

  addStoreGoal: (goalData: Omit<StoreGoal, 'id' | 'created_at'>): StoreGoal => {
    const goals = localStore.getStoreGoals();
    const newGoal: StoreGoal = {
      ...goalData,
      id: `goal_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    goals.unshift(newGoal);
    setStored(GOALS_KEY, goals);
    return newGoal;
  },

  toggleStoreGoal: (id: string): StoreGoal => {
    const goals = localStore.getStoreGoals();
    const idx = goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      goals[idx].concluida = !goals[idx].concluida;
      if (goals[idx].concluida) {
        goals[idx].atual_valor = goals[idx].meta_valor;
      }
      setStored(GOALS_KEY, goals);
      return goals[idx];
    }
    throw new Error('Meta não encontrada');
  },

  // 6. Rascunhos de Movimentação
  getDraftMovements: (): DraftMovement[] => {
    return getStored<DraftMovement[]>(DRAFTS_KEY, []);
  },

  saveDraftMovement: (draftData: Omit<DraftMovement, 'id' | 'data_salvo'>): DraftMovement => {
    const drafts = localStore.getDraftMovements();
    const newDraft: DraftMovement = {
      ...draftData,
      id: `draft_${Date.now()}`,
      data_salvo: new Date().toISOString()
    };
    drafts.unshift(newDraft);
    setStored(DRAFTS_KEY, drafts);
    return newDraft;
  },

  deleteDraftMovement: (id: string): void => {
    const drafts = localStore.getDraftMovements().filter(d => d.id !== id);
    setStored(DRAFTS_KEY, drafts);
  },

  // 7. Dashboard Personalizável
  getDashboardConfig: (): DashboardCardConfig => {
    return getStored<DashboardCardConfig>(DASHBOARD_CONFIG_KEY, initialDashboardConfig);
  },

  setDashboardConfig: (cfg: Partial<DashboardCardConfig>): DashboardCardConfig => {
    const current = localStore.getDashboardConfig();
    const updated = { ...current, ...cfg };
    setStored(DASHBOARD_CONFIG_KEY, updated);
    return updated;
  },

  // 8. Configuração de Aparência
  getStoreAppearance: (): StoreAppearance => {
    return getStored<StoreAppearance>(APPEARANCE_KEY, initialAppearance);
  },

  setStoreAppearance: (appData: Partial<StoreAppearance>): StoreAppearance => {
    const current = localStore.getStoreAppearance();
    const updated = { ...current, ...appData };
    setStored(APPEARANCE_KEY, updated);
    return updated;
  },

  // 9. Inventário Guiado
  getInventoryAuditSessions: (): InventoryAuditSession[] => {
    return getStored<InventoryAuditSession[]>(AUDIT_SESSIONS_KEY, []);
  },

  saveInventoryAuditSession: (session: InventoryAuditSession): InventoryAuditSession => {
    const sessions = localStore.getInventoryAuditSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx !== -1) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    setStored(AUDIT_SESSIONS_KEY, sessions);
    return session;
  },

  // 10. Auditoria e Registro Rápido
  addAuditLog: (logData: Partial<AuditLog>): AuditLog => {
    const logs = getStored<AuditLog[]>(HISTORY_KEY, []);
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      usuario: logData.usuario || 'Sistema',
      acao: logData.acao || 'CONFIG',
      descricao: logData.descricao || 'Ação executada no sistema.',
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    setStored(HISTORY_KEY, logs);
    return newLog;
  },

  getAuditLogs: (): AuditLog[] => {
    return getStored<AuditLog[]>(HISTORY_KEY, []);
  },

  registerEntry: (productId: string, quantidade: number, usuario: string = 'Sistema', observacao?: string): Movement => {
    const products = getProducts();
    const prodIdx = products.findIndex(p => p.id === productId);
    if (prodIdx === -1) throw new Error('Produto não encontrado');

    products[prodIdx].estoque += quantidade;
    products[prodIdx].updated_at = new Date().toISOString();
    setStored(PRODUCTS_KEY, products);

    const movements = getMovements();
    const newMov: Movement = {
      id: `mov_${Date.now()}`,
      produto_id: productId,
      produto_nome: products[prodIdx].nome,
      produto_codigo: products[prodIdx].codigo,
      tipo: 'entrada',
      quantidade,
      usuario_id: 'usr_local',
      usuario_nome: usuario,
      observacao: observacao || 'Entrada via Inventário/Auditoria',
      created_at: new Date().toISOString()
    };
    movements.unshift(newMov);
    setStored(MOVEMENTS_KEY, movements);

    localStore.addAuditLog({
      usuario,
      acao: 'ENTRADA',
      descricao: `Entrada de ${quantidade} un do produto "${products[prodIdx].nome}".`
    });

    return newMov;
  },

  registerSale: (productId: string, quantidade: number, usuario: string = 'Sistema', observacao?: string): Movement => {
    const products = getProducts();
    const prodIdx = products.findIndex(p => p.id === productId);
    if (prodIdx === -1) throw new Error('Produto não encontrado');

    if (products[prodIdx].estoque < quantidade) {
      throw new Error(`Estoque insuficiente. Disponível: ${products[prodIdx].estoque}`);
    }

    products[prodIdx].estoque -= quantidade;
    products[prodIdx].updated_at = new Date().toISOString();
    setStored(PRODUCTS_KEY, products);

    const movements = getMovements();
    const newMov: Movement = {
      id: `mov_${Date.now()}`,
      produto_id: productId,
      produto_nome: products[prodIdx].nome,
      produto_codigo: products[prodIdx].codigo,
      tipo: 'saida',
      quantidade,
      usuario_id: 'usr_local',
      usuario_nome: usuario,
      observacao: observacao || 'Saída/Ajuste via Inventário/Auditoria',
      created_at: new Date().toISOString()
    };
    movements.unshift(newMov);
    setStored(MOVEMENTS_KEY, movements);

    localStore.addAuditLog({
      usuario,
      acao: 'SAIDA',
      descricao: `Ajuste/Saída de ${quantidade} un do produto "${products[prodIdx].nome}".`
    });

    return newMov;
  },

  addProduct: (prodData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product => {
    const products = getProducts();
    const newProd: Product = {
      ...prodData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    products.unshift(newProd);
    setStored(PRODUCTS_KEY, products);

    localStore.addAuditLog({
      usuario: prodData.alterado_por || 'Sistema',
      acao: 'CADASTRO',
      descricao: `Novo produto "${newProd.nome}" (${newProd.codigo}) cadastrado.`
    });

    return newProd;
  },

  addCategory: (nome: string): Category => {
    const categories = getCategories();
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      nome: nome.trim(),
      created_at: new Date().toISOString()
    };
    categories.push(newCat);
    setStored(CATEGORIES_KEY, categories);
    return newCat;
  },

  seedTestProductsList: (userName: string = 'Sistema'): number => {
    const products = getProducts();
    const categories = getCategories();

    const requiredCategories = ['Garrafas', 'Fones', 'Suportes', 'Cabos e Adaptadores', 'Carregadores', 'Smartwatch', 'Capinhas', 'Jogos', 'Acessórios'];
    requiredCategories.forEach(catName => {
      if (!categories.some(c => (c.nome || '').toLowerCase() === catName.toLowerCase())) {
        categories.push({
          id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          nome: catName,
          created_at: new Date().toISOString()
        });
      }
    });
    setStored(CATEGORIES_KEY, categories);

    let modifiedCount = 0;
    const testListItems = initialProducts.filter(p =>
      p.id.startsWith('prod_gar_') ||
      p.id.startsWith('prod_fon_head_') ||
      p.id.startsWith('prod_fon_blu_') ||
      p.id.startsWith('prod_sup_') ||
      p.id.startsWith('prod_cab_hdmi_') ||
      p.id.startsWith('prod_adp_') ||
      p.id.startsWith('prod_car_') ||
      p.id.startsWith('prod_sma_') ||
      p.id.startsWith('prod_cap_iphone13') ||
      p.id.startsWith('prod_cap_transp_') ||
      p.id.startsWith('prod_jog_') ||
      p.id.startsWith('prod_acs_')
    );

    testListItems.forEach(item => {
      const idx = products.findIndex(p => p.id === item.id || p.codigo === item.codigo || (p.nome || '').toLowerCase() === (item.nome || '').toLowerCase());
      if (idx >= 0) {
        products[idx] = {
          ...products[idx],
          estoque: item.estoque,
          ativo: true,
          updated_at: new Date().toISOString()
        };
      } else {
        products.unshift({
          ...item,
          updated_at: new Date().toISOString()
        });
      }
      modifiedCount++;
    });

    setStored(PRODUCTS_KEY, products);

    localStore.addAuditLog({
      usuario: userName,
      acao: 'CADASTRO',
      descricao: `Cadastrados/Atualizados ${modifiedCount} produtos da Lista de Teste no estoque.`
    });

    return modifiedCount;
  },

  clearAllTestData: (): void => {
    setStored(PRODUCTS_KEY, []);
    setStored(CATEGORIES_KEY, []);
    setStored(MOVEMENTS_KEY, []);
    setStored(HISTORY_KEY, []);
    setStored(DEMANDS_KEY, []);
    setStored(DIVERGENCES_KEY, []);
    setStored(AUDIT_SESSIONS_KEY, []);
    setStored(DRAFTS_KEY, []);
    localStorage.setItem('bytecas_cleaned_for_real_tests_v3', 'true');
  }
};

// Automatic cleanup run for real production tests
try {
  if (typeof window !== 'undefined' && localStorage.getItem('bytecas_cleaned_for_real_tests_v3') !== 'true') {
    localStore.clearAllTestData();
  }
} catch (e) {
  console.warn('Auto cleanup failed', e);
}



