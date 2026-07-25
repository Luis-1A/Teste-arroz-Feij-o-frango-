import {
  User,
  Category,
  Product,
  Movement,
  AuditLog,
  AIInsight,
  DashboardStats,
  TopMovedProduct,
  CustomerDemand
} from '../types';

const TOKEN_KEY = 'bytecas_token';

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMessage = 'Erro ao se comunicar com o servidor Bytecas.';
    try {
      const errObj = await response.json();
      if (errObj.error) errorMessage = errObj.error;
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  register: async (userData: { nome: string; email: string; senha: string; cargo?: string }) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    setAuthToken(res.token);
    return res;
  },

  login: async (email: string, senha: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    setAuthToken(res.token);
    return res;
  },

  getMe: async () => {
    return apiRequest<{ user: User }>('/api/auth/me');
  },

  forgotPassword: async (email: string) => {
    return apiRequest<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  // Users
  getUsers: async () => {
    return apiRequest<User[]>('/api/users');
  },

  createUser: async (userData: { nome: string; email: string; senha: string; cargo: string }) => {
    return apiRequest<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  updateUser: async (id: string, userData: Partial<User & { senha?: string }>) => {
    return apiRequest<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  deleteUser: async (id: string) => {
    return apiRequest<{ message: string }>(`/api/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Categories
  getCategories: async () => {
    return apiRequest<Category[]>('/api/categories');
  },

  createCategory: async (nome: string) => {
    return apiRequest<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ nome })
    });
  },

  // Products
  getProducts: async (search?: string, categoria?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoria && categoria !== 'Todas') params.append('categoria', categoria);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<Product[]>(`/api/products${query}`);
  },

  getProductById: async (id: string) => {
    return apiRequest<Product>(`/api/products/${id}`);
  },

  createProduct: async (productData: Omit<Product, 'id' | 'ativo' | 'created_at' | 'updated_at'>) => {
    return apiRequest<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  updateProduct: async (id: string, productData: Partial<Product>) => {
    return apiRequest<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  deleteProduct: async (id: string) => {
    return apiRequest<{ message: string }>(`/api/products/${id}`, {
      method: 'DELETE'
    });
  },

  // Stock Entry & Exit
  addStockEntry: async (produto_id: string, quantidade: number, observacao?: string) => {
    return apiRequest<Product>('/api/stock/entry', {
      method: 'POST',
      body: JSON.stringify({ produto_id, quantidade, observacao })
    });
  },

  addStockExit: async (items: { produtoId: string; quantidade: number }[], observacao?: string) => {
    return apiRequest<{ message: string; movements: Movement[] }>('/api/stock/exit', {
      method: 'POST',
      body: JSON.stringify({ items, observacao })
    });
  },

  // Dashboard & Reports
  getDashboardStats: async () => {
    return apiRequest<DashboardStats>('/api/dashboard/stats');
  },

  getOutOfStock: async () => {
    return apiRequest<(Product & { prioridade: string; ultima_venda: string })[]>('/api/reports/out-of-stock');
  },

  getTopMoved: async (periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'hoje') => {
    return apiRequest<TopMovedProduct[]>(`/api/reports/top-moved?periodo=${periodo}`);
  },

  // History Log
  getHistory: async () => {
    return apiRequest<AuditLog[]>('/api/history');
  },

  // Mathematical Restock Analysis
  getRestockAnalysis: async () => {
    return apiRequest<{
      total_produtos_criticos: number;
      total_unidades_sugeridas: number;
      items: {
        id: string;
        nome: string;
        codigo: string;
        categoria: string;
        marca: string;
        localizacao: string;
        estoque_atual: number;
        estoque_minimo: number;
        quantidade_sugerida: number;
        nivel_risco: 'CRITICO' | 'ALERTA' | 'ESTAVEL';
      }[];
      source: string;
    }>('/api/restock-analysis');
  },

  // Stock Analysis Insights (Calculado matematicamente)
  getAIInsights: async () => {
    return apiRequest<{ insights: AIInsight[]; source: string }>('/api/ai-insights', {
      method: 'POST'
    });
  },

  // Customer Unfulfilled Demand ("Cliente veio e não tinha")
  getCustomerDemands: async () => {
    return apiRequest<CustomerDemand[]>('/api/customer-demands');
  },

  registerCustomerDemand: async (data: {
    produto_nome: string;
    produto_id?: string;
    solicitante_nome?: string;
    confirmou_erro_contagem?: boolean;
  }) => {
    return apiRequest<{
      status_code: 'EXISTS_HAS_STOCK_AWAITING_CONFIRMATION' | 'EXISTS_STOCK_ZEROED' | 'EXISTS_NO_STOCK_REGISTERED' | 'NOT_REGISTERED_SAVED';
      message: string;
      product?: Product;
      demand?: CustomerDemand;
    }>('/api/customer-demands', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  deleteCustomerDemand: async (id: string) => {
    return apiRequest<{ message: string }>(`/api/customer-demands/${id}`, {
      method: 'DELETE'
    });
  }
};
