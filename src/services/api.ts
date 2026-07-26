import {
  User,
  Category,
  Product,
  Movement,
  AuditLog,
  AIInsight,
  DashboardStats,
  TopMovedProduct,
  CustomerDemand,
  POSConfig
} from '../types';
import { localStore } from './localStore';
import { firestoreSync } from './firestoreSync';


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

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (netErr) {
    console.warn('Backend endpoint unreachable, using client store fallback:', netErr);
    throw new Error('SERVER_UNREACHABLE');
  }

  const contentType = response.headers.get('content-type') || '';
  if (response.status === 404 || contentType.includes('text/html') || response.status === 502 || response.status === 503) {
    // Static hosting (like Vercel SPA) without active Express backend
    throw new Error('SERVER_UNREACHABLE');
  }

  if (!response.ok) {
    let errorMessage = 'E-mail ou senha incorretos.';
    try {
      const errObj = await response.json();
      if (errObj && errObj.error) {
        errorMessage = errObj.error;
      }
    } catch {
      if (response.status === 401) {
        errorMessage = 'E-mail ou senha incorretos.';
      } else if (response.status === 403) {
        errorMessage = 'Você não possui permissão para realizar esta operação.';
      } else {
        errorMessage = 'SERVER_UNREACHABLE';
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  register: async (userData: { nome: string; email: string; senha: string; cargo?: string }) => {
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      setAuthToken(res.token);
      return res;
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        const res = localStore.register(userData);
        setAuthToken(res.token);
        return res;
      }
      throw err;
    }
  },

  login: async (email: string, senha: string) => {
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });
      setAuthToken(res.token);
      return res;
    } catch (err: any) {
      // In browser or static environment, automatically use client local store fallback
      try {
        const res = localStore.login(email, senha);
        setAuthToken(res.token);
        return res;
      } catch (localErr: any) {
        throw (err.message === 'SERVER_UNREACHABLE' ? localErr : err);
      }
    }
  },

  getMe: async () => {
    try {
      return await apiRequest<{ user: User }>('/api/auth/me');
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.getMe(getAuthToken());
      }
      throw err;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      return await apiRequest<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return { message: 'Se o e-mail estiver cadastrado, as instruções de recuperação foram enviadas.' };
      }
      throw err;
    }
  },

  // Users
  getUsers: async () => {
    try {
      return await apiRequest<User[]>('/api/users');
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.getUsersList();
      }
      throw err;
    }
  },

  createUser: async (userData: { nome: string; email: string; senha: string; cargo: string }) => {
    try {
      return await apiRequest<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.createUser(userData);
      }
      throw err;
    }
  },

  updateUser: async (id: string, userData: Partial<User & { senha?: string }>) => {
    try {
      return await apiRequest<User>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.updateUser(id, userData);
      }
      throw err;
    }
  },

  deleteUser: async (id: string) => {
    try {
      return await apiRequest<{ message: string }>(`/api/users/${id}`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.deleteUser(id);
      }
      throw err;
    }
  },

  // Categories
  getCategories: async () => {
    try {
      return await apiRequest<Category[]>('/api/categories');
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.getCategoriesList();
      }
      throw err;
    }
  },

  createCategory: async (nome: string) => {
    return firestoreSync.createCategory(nome);
  },

  // Products
  getProducts: async (search?: string, categoria?: string) => {
    return localStore.getProductsList(search, categoria);
  },

  getProductById: async (id: string) => {
    return localStore.getProductById(id) || null;
  },

  createProduct: async (productData: Omit<Product, 'id' | 'ativo' | 'created_at' | 'updated_at'>) => {
    return firestoreSync.createProduct(productData);
  },

  updateProduct: async (id: string, productData: Partial<Product>) => {
    return firestoreSync.updateProduct(id, productData);
  },

  deleteProduct: async (id: string) => {
    return firestoreSync.deleteProduct(id);
  },

  // Stock Entry & Exit
  addStockEntry: async (produto_id: string, quantidade: number, observacao?: string) => {
    try {
      return await apiRequest<Product>('/api/stock/entry', {
        method: 'POST',
        body: JSON.stringify({ produto_id, quantidade, observacao })
      });
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.addStockEntry(produto_id, quantidade, observacao);
      }
      throw err;
    }
  },

  addStockExit: async (items: { produtoId: string; quantidade: number }[], observacao?: string) => {
    try {
      return await apiRequest<{ message: string; movements: Movement[] }>('/api/stock/exit', {
        method: 'POST',
        body: JSON.stringify({ items, observacao })
      });
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.addStockExit(items, observacao);
      }
      throw err;
    }
  },

  // Dashboard & Reports
  getDashboardStats: async () => {
    try {
      return await apiRequest<DashboardStats>('/api/dashboard/stats');
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.getDashboardStats();
      }
      throw err;
    }
  },

  getOutOfStock: async () => {
    try {
      return await apiRequest<(Product & { prioridade: string; ultima_venda: string })[]>('/api/reports/out-of-stock');
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.getOutOfStock();
      }
      throw err;
    }
  },

  getTopMoved: async (periodo: 'hoje' | 'semana' | 'mes' | 'ano' = 'hoje') => {
    try {
      return await apiRequest<TopMovedProduct[]>(`/api/reports/top-moved?periodo=${periodo}`);
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.getTopMoved(periodo);
      }
      throw err;
    }
  },

  // History Log
  getHistory: async () => {
    try {
      return await apiRequest<AuditLog[]>('/api/history');
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.getHistory();
      }
      throw err;
    }
  },

  // Mathematical Restock Analysis
  getRestockAnalysis: async () => {
    try {
      return await apiRequest<{
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
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.getRestockAnalysis();
      }
      throw err;
    }
  },

  // Stock Analysis Insights
  getAIInsights: async () => {
    try {
      return await apiRequest<{ insights: AIInsight[]; source: string }>('/api/ai-insights', {
        method: 'POST'
      });
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.getAIInsights();
      }
      throw err;
    }
  },

  // Customer Unfulfilled Demand
  getCustomerDemands: async () => {
    try {
      return await apiRequest<CustomerDemand[]>('/api/customer-demands');
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.getCustomerDemands();
      }
      throw err;
    }
  },

  registerCustomerDemand: async (data: {
    produto_nome: string;
    produto_id?: string;
    solicitante_nome?: string;
    confirmou_erro_contagem?: boolean;
  }) => {
    try {
      return await apiRequest<{
        status_code: 'EXISTS_HAS_STOCK_AWAITING_CONFIRMATION' | 'EXISTS_STOCK_ZEROED' | 'EXISTS_NO_STOCK_REGISTERED' | 'NOT_REGISTERED_SAVED';
        message: string;
        product?: Product;
        demand?: CustomerDemand;
      }>('/api/customer-demands', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.registerCustomerDemand(data);
      }
      throw err;
    }
  },

  deleteCustomerDemand: async (id: string) => {
    try {
      return await apiRequest<{ message: string }>(`/api/customer-demands/${id}`, {
        method: 'DELETE'
      });
    } catch (err: any) {
      if (err.message === 'SERVER_UNREACHABLE') {
        return localStore.deleteCustomerDemand(id);
      }
      throw err;
    }
  },

  getPOSConfig: async (): Promise<POSConfig> => {
    return localStore.getPOSConfig();
  },

  updatePOSConfig: async (config: POSConfig, userEmail?: string): Promise<POSConfig> => {
    return firestoreSync.updatePOSConfig(config, userEmail);
  },

  registerStockExit: async (
    items: { productId: string; quantity: number }[],
    user: { id: string; nome: string },
    observacao?: string,
    tipoSaida: string = 'venda'
  ): Promise<void> => {
    return firestoreSync.registerStockExit(items, user, observacao, tipoSaida);
  }
};

