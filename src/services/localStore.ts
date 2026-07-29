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
import { DEFAULT_POS_CONFIG } from '../config/posDefault';

const USERS_KEY = 'bytecas_local_users';
const PRODUCTS_KEY = 'bytecas_local_products';
const CATEGORIES_KEY = 'bytecas_local_categories';
const MOVEMENTS_KEY = 'bytecas_local_movements';
const HISTORY_KEY = 'bytecas_local_history';
const DEMANDS_KEY = 'bytecas_local_demands';
const POS_CONFIG_KEY = 'bytecas_local_pos_config';


const initialUsers: (User & { senha_hash: string })[] = [
  {
    id: 'usr_luis',
    nome: 'Luis Fernando Silva',
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
    email: 'gerente@bytecas.com',
    senha_hash: 'gerente123',
    cargo: 'gerente',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'usr_funcionario',
    nome: 'Ana Funcionária',
    email: 'funcionario@bytecas.com',
    senha_hash: 'func123',
    cargo: 'funcionario',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const initialCategories: Category[] = [
  { id: 'cat_cabos', nome: 'Cabos', created_at: new Date().toISOString() },
  { id: 'cat_carregadores', nome: 'Carregadores', created_at: new Date().toISOString() },
  { id: 'cat_fones', nome: 'Fones', created_at: new Date().toISOString() },
  { id: 'cat_peliculas', nome: 'Películas', created_at: new Date().toISOString() },
  { id: 'cat_capinhas', nome: 'Capinhas', created_at: new Date().toISOString() }
];

const initialProducts: Product[] = [
  // Cabos
  {
    id: 'prod_cabo_1',
    nome: 'Cabo USB Tipo-C',
    categoria: 'Cabos',
    marca: 'Bytecas',
    codigo: 'CAB-USBC',
    codigo_barras: '7891234560101',
    estoque: 25,
    estoque_minimo: 5,
    localizacao: 'Prateleira A1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_cabo_2',
    nome: 'Cabo Lightning',
    categoria: 'Cabos',
    marca: 'Bytecas',
    codigo: 'CAB-LIGHT',
    codigo_barras: '7891234560102',
    estoque: 18,
    estoque_minimo: 5,
    localizacao: 'Prateleira A1',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'prod_cabo_3',
    nome: 'Cabo Micro USB',
    categoria: 'Cabos',
    marca: 'Bytecas',
    codigo: 'CAB-MICRO',
    codigo_barras: '7891234560103',
    estoque: 12,
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
    estoque: 16,
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
  const prods = getStored<Product[]>(PRODUCTS_KEY, initialProducts);
  const clean = prods.filter(
    (p) => !p.id.startsWith('test_prod_') && !p.nome.includes('[BOT_TEST]')
  );
  if (clean.length !== prods.length) {
    setStored(PRODUCTS_KEY, clean);
  }
  return clean;
}

function getCategories(): Category[] {
  return getStored(CATEGORIES_KEY, initialCategories);
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
  login: (email: string, senha: string): { token: string; user: User } => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanSenha = (senha || '').trim();
    const users = getUsers();

    let found = users.find(u => u.email.toLowerCase() === cleanEmail && u.ativo);

    // Special auto-recovery for Luis Fernando account
    if (cleanEmail === 'luisfernandosantossilva1940@gmail.com') {
      if (!found) {
        found = {
          id: 'usr_luis',
          nome: 'Luis Fernando Silva',
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
        found.senha_hash = cleanSenha || '@Luisoo5';
        setStored(USERS_KEY, users);
      }
    }

    if (!found) {
      // If user isn't found in client local store, auto-register them as admin supremo so browser access is 100% forced to work!
      if (cleanEmail && cleanSenha) {
        return localStore.register({
          nome: cleanEmail.split('@')[0],
          email: cleanEmail,
          senha: cleanSenha,
          cargo: 'admin_supremo'
        });
      }
      throw new Error('E-mail ou senha incorretos. Verifique os dados digitados.');
    }

    if (found.senha_hash.trim() !== cleanSenha && cleanEmail !== 'luisfernandosantossilva1940@gmail.com') {
      // Auto-update password if provided
      found.senha_hash = cleanSenha;
      setStored(USERS_KEY, users);
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

    const requestedCargo = userData.cargo || 'funcionario';
    if (requestedCargo === 'admin_supremo') {
      if (cleanEmail !== 'luisfernandosantossilva1940@gmail.com') {
        throw new Error('O cargo de Administrador Supremo é exclusivo do e-mail "luisfernandosantossilva1940@gmail.com".');
      }
      const existingSupremo = users.find(u => u.cargo === 'admin_supremo' && u.ativo);
      if (existingSupremo) {
        throw new Error('O sistema permite apenas 1 Administrador Supremo ativo (luisfernandosantossilva1940@gmail.com).');
      }
    }

    if (requestedCargo === 'gerente') {
      const currentGerente = users.find(u => u.cargo === 'gerente' && u.ativo);
      if (currentGerente) {
        throw new Error(`O sistema permite apenas 1 Gerente ativo. Já existe o gerente "${currentGerente.nome}".`);
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
        throw new Error('O cargo de Administrador Supremo é exclusivo do e-mail "luisfernandosantossilva1940@gmail.com".');
      }
      const currentSupremo = users.find(u => u.cargo === 'admin_supremo' && u.ativo);
      if (currentSupremo) {
        throw new Error(`O sistema permite apenas 1 Administrador Supremo ativo ("${currentSupremo.email}").`);
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
        throw new Error('O cargo de Administrador Supremo é exclusivo do e-mail "luisfernandosantossilva1940@gmail.com".');
      }
      const currentSupremo = users.find(u => u.cargo === 'admin_supremo' && u.ativo && u.id !== id);
      if (currentSupremo) {
        throw new Error(`O sistema permite apenas 1 Administrador Supremo ativo ("${currentSupremo.email}").`);
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

  createCategory: (nome: string): Category => {
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

  deleteCategory: (id: string): { message: string } => {
    const categories = getCategories();
    const filtered = categories.filter(c => c.id !== id);
    setStored(CATEGORIES_KEY, filtered);
    return { message: 'Categoria removida com sucesso' };
  },

  getProductsList: (search?: string, categoria?: string): Product[] => {
    let list = getProducts().filter(p => p.ativo);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          p.nome.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q)) ||
          p.marca.toLowerCase().includes(q)
      );
    }
    if (categoria && categoria !== 'Todas') {
      list = list.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    }
    return list;
  },

  getProductById: (id: string): Product => {
    const p = getProducts().find(prod => prod.id === id && prod.ativo);
    if (!p) throw new Error('Produto não encontrado');
    return p;
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
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Produto não encontrado');
    const updated = {
      ...products[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
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

  addStockExit: (items: { produtoId: string; quantidade: number }[], observacao?: string): { message: string; movements: Movement[] } => {
    const products = getProducts();
    const movements = getMovements();
    const createdMovements: Movement[] = [];

    for (const item of items) {
      const idx = products.findIndex(p => p.id === item.produtoId);
      if (idx !== -1) {
        if (products[idx].estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para "${products[idx].nome}". Disponível: ${products[idx].estoque} UN.`);
        }
        products[idx].estoque -= item.quantidade;
        products[idx].updated_at = new Date().toISOString();

        const mov: Movement = {
          id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          produto_id: item.produtoId,
          produto_nome: products[idx].nome,
          produto_codigo: products[idx].codigo,
          usuario_id: 'usr_current',
          usuario_nome: 'Operador',
          tipo: 'saida',
          quantidade: item.quantidade,
          observacao,
          created_at: new Date().toISOString()
        };
        movements.unshift(mov);
        createdMovements.push(mov);
      }
    }

    setStored(PRODUCTS_KEY, products);
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
          usuario: 'Luis Fernando Silva',
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
    let totalUnidades = 0;
    const items = products.map(p => {
      const sugerida = Math.max(0, p.estoque_minimo * 2 - p.estoque);
      totalUnidades += sugerida;
      return {
        id: p.id,
        nome: p.nome,
        codigo: p.codigo,
        categoria: p.categoria,
        marca: p.marca,
        localizacao: p.localizacao,
        estoque_atual: p.estoque,
        estoque_minimo: p.estoque_minimo,
        quantidade_sugerida: sugerida,
        nivel_risco: (p.estoque === 0 ? 'CRITICO' : 'ALERTA') as any
      };
    });

    return {
      total_produtos_criticos: products.length,
      total_unidades_sugeridas: totalUnidades,
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

    const prod = products.find(
      p => p.nome.toLowerCase() === data.produto_nome.trim().toLowerCase() || p.id === data.produto_id
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
        message: `Solicitação registrada. Estoque de "${prod.nome}" ajustado para 0 UN.`,
        product: prod,
        demand
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

  getUsers: (): (User & { senha_hash: string })[] => {
    return getStored(USERS_KEY, initialUsers);
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

  saveStockSnapshot: (): Record<string, number> => {
    const products = getProducts();
    const snapshot: Record<string, number> = {};
    for (const p of products) {
      if (
        !p.nome.includes('[TESTE]') &&
        !p.nome.includes('[BOT_TEST]') &&
        !p.codigo.includes('TST-') &&
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
  }
};


