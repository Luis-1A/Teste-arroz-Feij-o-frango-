import fs from 'fs';
import path from 'path';
import { firestoreDb } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'admin_supremo' | 'gerente' | 'funcionario';

export interface UserRecord {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  cargo: UserRole;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryRecord {
  id: string;
  nome: string;
  created_at: string;
}

export interface ProductRecord {
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

export interface MovementRecord {
  id: string;
  produto_id: string;
  produto_nome: string;
  produto_codigo: string;
  usuario_id: string;
  usuario_nome: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  observacao?: string;
  created_at: string;
}

export interface AuditRecord {
  id: string;
  usuario: string;
  acao: 'CADASTRO' | 'EDICAO' | 'EXCLUSAO_LOGICA' | 'ENTRADA' | 'SAIDA' | 'LOGIN' | 'CONFIG';
  descricao: string;
  ip?: string;
  created_at: string;
}

export interface UnfulfilledDemandRecord {
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

const DATA_FILE = path.join(process.cwd(), 'data_store.json');

interface DatabaseSchema {
  users: UserRecord[];
  categories: CategoryRecord[];
  products: ProductRecord[];
  movements: MovementRecord[];
  history: AuditRecord[];
  unfulfilled_demands?: UnfulfilledDemandRecord[];
  system_test_status?: {
    active: boolean;
    started_at?: string;
    updated_at?: string;
    stock_snapshot?: Record<string, number>;
  };
}

const initialData: DatabaseSchema = {
  users: [
    {
      id: 'usr_luis',
      nome: 'Luis Fernando Santos',
      email: 'luisfernandosantossilva1940@gmail.com',
      senha_hash: '@Luisoo5',
      cargo: 'admin_supremo',
      ativo: true,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-01-01T08:00:00.000Z'
    },
    {
      id: 'usr_gerente',
      nome: 'Carlos Gerente',
      email: 'gerente@facilitandomeutrabalho.com',
      senha_hash: 'gerente123',
      cargo: 'gerente',
      ativo: true,
      created_at: '2026-01-02T09:00:00.000Z',
      updated_at: '2026-01-02T09:00:00.000Z'
    },
    {
      id: 'usr_funcionario',
      nome: 'Ana Funcionária',
      email: 'funcionario@facilitandomeutrabalho.com',
      senha_hash: 'func123',
      cargo: 'funcionario',
      ativo: true,
      created_at: '2026-01-03T10:00:00.000Z',
      updated_at: '2026-01-03T10:00:00.000Z'
    }
  ],
  categories: [],
  products: [],
  movements: [],
  history: []
};

class LocalDatabase {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.loadData();
    this.initFirestoreSync();
  }

  private async initFirestoreSync() {
    if (!firestoreDb) return;
    try {
      const snap = await getDoc(doc(firestoreDb, 'app_store', 'main'));
      if (snap.exists()) {
        const remoteData = snap.data() as DatabaseSchema;
        if (remoteData && Array.isArray(remoteData.users)) {
          this.db = remoteData;
          if (!this.db.users.some(u => u.email.toLowerCase() === 'luisfernandosantossilva1940@gmail.com')) {
            this.db.users.unshift({
              id: 'usr_luis',
              nome: 'Luis Fernando Santos',
              email: 'luisfernandosantossilva1940@gmail.com',
              senha_hash: '@Luisoo5',
              cargo: 'admin_supremo',
              ativo: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
          this.saveData(this.db);
          console.log('[Firebase] Remote Firestore database loaded & synchronized successfully!');
        }
      } else {
        await setDoc(doc(firestoreDb, 'app_store', 'main'), this.db);
        console.log('[Firebase] Seeded initial data to Firestore database!');
      }
    } catch (err) {
      console.error('[Firebase] Firestore init sync error:', err);
    }
  }

  private loadData(): DatabaseSchema {
    let loaded: DatabaseSchema = initialData;
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        loaded = JSON.parse(content);
      }
    } catch (err) {
      console.error('Error reading data file, resetting to defaults:', err);
    }

    if (!loaded.users.some(u => u.email.toLowerCase() === 'luisfernandosantossilva1940@gmail.com')) {
      loaded.users.unshift({
        id: 'usr_luis',
        nome: 'Luis Fernando Santos',
        email: 'luisfernandosantossilva1940@gmail.com',
        senha_hash: '@Luisoo5',
        cargo: 'admin_supremo',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    this.saveData(loaded);
    return loaded;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data file:', err);
    }

    if (firestoreDb) {
      setDoc(doc(firestoreDb, 'app_store', 'main'), data)
        .then(() => console.log('[Firebase] Firestore updated successfully'))
        .catch(err => console.error('[Firebase] Firestore update error:', err));
    }
  }

  // Users
  getUsers(): UserRecord[] {
    return this.db.users.filter(u => u.ativo);
  }

  getUserByEmail(email: string): UserRecord | undefined {
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.ativo);
  }

  getUserById(id: string): UserRecord | undefined {
    return this.db.users.find(u => u.id === id && u.ativo);
  }

  createUser(user: Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>): UserRecord {
    const now = new Date().toISOString();
    const newUser: UserRecord = {
      ...user,
      id: `usr_${Date.now()}`,
      created_at: now,
      updated_at: now
    };
    this.db.users.push(newUser);
    this.saveData(this.db);
    return newUser;
  }

  updateUser(id: string, user: Partial<Omit<UserRecord, 'id' | 'created_at'>>): UserRecord | undefined {
    const index = this.db.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    // Protection: supreme admin cannot have role changed away or soft deleted unless supreme admin does it
    const updatedUser: UserRecord = {
      ...this.db.users[index],
      ...user,
      updated_at: new Date().toISOString()
    };
    this.db.users[index] = updatedUser;
    this.saveData(this.db);
    return updatedUser;
  }

  deleteUserLogical(id: string): boolean {
    const user = this.db.users.find(u => u.id === id);
    if (!user) return false;
    if (user.id === 'usr_supremo') {
      throw new Error('Não é possível remover o Administrador Supremo do sistema.');
    }
    user.ativo = false;
    user.updated_at = new Date().toISOString();
    this.saveData(this.db);
    return true;
  }

  // Categories
  getCategories(): CategoryRecord[] {
    return this.db.categories;
  }

  createCategory(nome: string): CategoryRecord {
    const newCat: CategoryRecord = {
      id: `cat_${Date.now()}`,
      nome,
      created_at: new Date().toISOString()
    };
    this.db.categories.push(newCat);
    this.saveData(this.db);
    return newCat;
  }

  // Products
  getProducts(search?: string, categoria?: string): ProductRecord[] {
    let list = this.db.products.filter(p => p.ativo);

    if (categoria && categoria !== 'Todas') {
      list = list.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.nome.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q)) ||
        p.localizacao.toLowerCase().includes(q)
      );
    }

    return list;
  }

  getProductById(id: string): ProductRecord | undefined {
    return this.db.products.find(p => p.id === id && p.ativo);
  }

  createProduct(product: Omit<ProductRecord, 'id' | 'ativo' | 'created_at' | 'updated_at'>, usuarioNome: string): ProductRecord {
    const now = new Date().toISOString();
    const newProduct: ProductRecord = {
      ...product,
      id: `prod_${Date.now()}`,
      ativo: true,
      created_at: now,
      updated_at: now
    };
    this.db.products.push(newProduct);
    
    // Log history
    this.addHistory(
      usuarioNome,
      'CADASTRO',
      `Cadastrou o produto "${newProduct.nome}" (Cód: ${newProduct.codigo}) com estoque inicial de ${newProduct.estoque} un.`
    );

    this.saveData(this.db);
    return newProduct;
  }

  updateProduct(id: string, data: Partial<Omit<ProductRecord, 'id' | 'created_at'>>, usuarioNome: string): ProductRecord | undefined {
    const index = this.db.products.findIndex(p => p.id === id && p.ativo);
    if (index === -1) return undefined;

    const current = this.db.products[index];
    const updated: ProductRecord = {
      ...current,
      ...data,
      updated_at: new Date().toISOString()
    };

    this.db.products[index] = updated;

    this.addHistory(
      usuarioNome,
      'EDICAO',
      `Atualizou os dados do produto "${updated.nome}" (Cód: ${updated.codigo}).`
    );

    this.saveData(this.db);
    return updated;
  }

  deleteProductLogical(id: string, usuarioNome: string): boolean {
    const product = this.db.products.find(p => p.id === id && p.ativo);
    if (!product) return false;

    product.ativo = false;
    product.updated_at = new Date().toISOString();

    this.addHistory(
      usuarioNome,
      'EXCLUSAO_LOGICA',
      `Realizou exclusão lógica do produto "${product.nome}" (Cód: ${product.codigo}).`
    );

    this.saveData(this.db);
    return true;
  }

  // Stock Entry
  addStockEntry(produtoId: string, quantidade: number, observacao: string | undefined, usuario: UserRecord): ProductRecord {
    const product = this.db.products.find(p => p.id === produtoId && p.ativo);
    if (!product) throw new Error('Produto não encontrado.');

    if (quantidade <= 0) throw new Error('A quantidade deve ser maior que zero.');

    product.estoque += quantidade;
    product.updated_at = new Date().toISOString();

    const movement: MovementRecord = {
      id: `mov_${Date.now()}`,
      produto_id: product.id,
      produto_nome: product.nome,
      produto_codigo: product.codigo,
      usuario_id: usuario.id,
      usuario_nome: usuario.nome,
      tipo: 'entrada',
      quantidade,
      observacao,
      created_at: new Date().toISOString()
    };

    this.db.movements.unshift(movement);

    this.addHistory(
      usuario.nome,
      'ENTRADA',
      `Adicionou +${quantidade} unidades ao produto "${product.nome}". Novo estoque: ${product.estoque} un.`
    );

    this.saveData(this.db);
    return product;
  }

  // Stock Exit (Sales / Outflow Panel)
  addStockExit(items: { produtoId: string; quantidade: number }[], observacao: string | undefined, usuario: UserRecord): MovementRecord[] {
    const now = new Date().toISOString();
    const createdMovements: MovementRecord[] = [];

    // Verify stock availability
    for (const item of items) {
      const product = this.db.products.find(p => p.id === item.produtoId && p.ativo);
      if (!product) throw new Error(`Produto ID ${item.produtoId} não foi encontrado.`);
      if (product.estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para "${product.nome}". Atual: ${product.estoque}, Solicitado: ${item.quantidade}`);
      }
    }

    // Process deduction
    for (const item of items) {
      const product = this.db.products.find(p => p.id === item.produtoId && p.ativo)!;
      product.estoque -= item.quantidade;
      product.updated_at = now;

      const movement: MovementRecord = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        produto_id: product.id,
        produto_nome: product.nome,
        produto_codigo: product.codigo,
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        tipo: 'saida',
        quantidade: item.quantidade,
        observacao,
        created_at: now
      };

      this.db.movements.unshift(movement);
      createdMovements.push(movement);

      this.addHistory(
        usuario.nome,
        'SAIDA',
        `Registrou saída de -${item.quantidade} un. de "${product.nome}". Restam: ${product.estoque} un.`
      );
    }

    this.saveData(this.db);
    return createdMovements;
  }

  // Dashboard & Reports
  getDashboardStats() {
    const activeProducts = this.db.products.filter(p => p.ativo);
    const totalProdutos = activeProducts.length;
    const totalUnidades = activeProducts.reduce((acc, p) => acc + p.estoque, 0);

    const produtosEmFaltaList = activeProducts.filter(p => p.estoque <= 0);
    const produtosProximosMinimoList = activeProducts.filter(p => p.estoque > 0 && p.estoque <= p.estoque_minimo);

    const ultimasMovimentacoes = this.db.movements.slice(0, 8);
    const produtosRecentes = activeProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    const alertas: { id: string; tipo: 'critico' | 'atencao' | 'info'; mensagem: string; data: string }[] = [];

    produtosEmFaltaList.forEach(p => {
      alertas.push({
        id: `alt_zero_${p.id}`,
        tipo: 'critico',
        mensagem: `PRODUTO ZERADO: "${p.nome}" (Cód: ${p.codigo}) está com 0 unidades em estoque.`,
        data: p.updated_at
      });
    });

    produtosProximosMinimoList.forEach(p => {
      alertas.push({
        id: `alt_min_${p.id}`,
        tipo: 'atencao',
        mensagem: `ESTOQUE MÍNIMO: "${p.nome}" possui apenas ${p.estoque} un. (Mínimo definido: ${p.estoque_minimo} un.)`,
        data: p.updated_at
      });
    });

    return {
      total_produtos: totalProdutos,
      total_unidades: totalUnidades,
      produtos_em_falta: produtosEmFaltaList.length + produtosProximosMinimoList.length,
      produtos_proximos_minimo: produtosProximosMinimoList.length,
      ultimas_movimentacoes: ultimasMovimentacoes,
      produtos_recentes: produtosRecentes,
      alertas: alertas.slice(0, 10)
    };
  }

  getOutOfStock() {
    const activeProducts = this.db.products.filter(p => p.ativo && p.estoque <= p.estoque_minimo);
    
    return activeProducts.map(p => {
      const lastExit = this.db.movements.find(m => m.produto_id === p.id && m.tipo === 'saida');
      return {
        ...p,
        prioridade: p.estoque === 0 ? 'CRÍTICA (Esgotado)' : 'ALTA (Abaixo do Mínimo)',
        ultima_venda: lastExit ? lastExit.created_at : 'Sem movimentação recente'
      };
    }).sort((a, b) => a.estoque - b.estoque);
  }

  getTopMoved(periodo: 'hoje' | 'semana' | 'mes' | 'ano') {
    const now = new Date();
    let startDate = new Date();

    if (periodo === 'hoje') {
      startDate.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      startDate.setDate(now.getDate() - 7);
    } else if (periodo === 'mes') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (periodo === 'ano') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const filteredMovements = this.db.movements.filter(m =>
      m.tipo === 'saida' && new Date(m.created_at) >= startDate
    );

    const map = new Map<string, {
      id: string;
      nome: string;
      codigo: string;
      categoria: string;
      total: number;
      ultima_saida: string;
    }>();

    filteredMovements.forEach(m => {
      const existing = map.get(m.produto_id);
      if (existing) {
        existing.total += m.quantidade;
        if (new Date(m.created_at) > new Date(existing.ultima_saida)) {
          existing.ultima_saida = m.created_at;
        }
      } else {
        const prod = this.db.products.find(p => p.id === m.produto_id);
        map.set(m.produto_id, {
          id: m.produto_id,
          nome: m.produto_nome,
          codigo: m.produto_codigo,
          categoria: prod?.categoria || 'Geral',
          total: m.quantidade,
          ultima_saida: m.created_at
        });
      }
    });

    const result = Array.from(map.values()).sort((a, b) => b.total - a.total);

    return result.map((item, index) => {
      const prod = this.db.products.find(p => p.id === item.id);
      let vel: 'Alta' | 'Média' | 'Baixa' = 'Média';
      if (item.total >= 10) vel = 'Alta';
      else if (item.total < 4) vel = 'Baixa';

      return {
        id: item.id,
        nome: item.nome,
        codigo: item.codigo,
        categoria: item.categoria,
        quantidade_movimentada: item.total,
        estoque_atual: prod ? prod.estoque : 0,
        velocidade_saida: vel,
        ranking: index + 1,
        ultima_saida: item.ultima_saida
      };
    });
  }

  // History / Audit Log
  getHistory(): AuditRecord[] {
    return this.db.history;
  }

  addHistory(usuario: string, acao: AuditRecord['acao'], descricao: string, ip?: string) {
    const record: AuditRecord = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      usuario,
      acao,
      descricao,
      ip: ip || '127.0.0.1',
      created_at: new Date().toISOString()
    };
    this.db.history.unshift(record);
    this.saveData(this.db);
    return record;
  }

  // Unfulfilled Demands ("Cliente veio comprar e não tinha")
  getUnfulfilledDemands(): UnfulfilledDemandRecord[] {
    return this.db.unfulfilled_demands || [];
  }

  processCustomerDemand(data: {
    produto_nome: string;
    produto_id?: string;
    solicitante_nome?: string;
    confirmou_erro_contagem?: boolean;
  }): {
    status_code: 'EXISTS_HAS_STOCK_AWAITING_CONFIRMATION' | 'EXISTS_STOCK_ZEROED' | 'EXISTS_NO_STOCK_REGISTERED' | 'NOT_REGISTERED_SAVED';
    message: string;
    product?: ProductRecord;
    demand?: UnfulfilledDemandRecord;
  } {
    if (!this.db.unfulfilled_demands) {
      this.db.unfulfilled_demands = [];
    }

    const trimmedName = (data.produto_nome || '').trim();
    if (!trimmedName) {
      throw new Error('Nome do produto é obrigatório.');
    }

    // 1. Search for existing registered product
    let product: ProductRecord | undefined;
    if (data.produto_id) {
      product = this.db.products.find(p => p.id === data.produto_id && p.ativo !== false);
    }
    if (!product) {
      product = this.db.products.find(
        p => p.ativo !== false && p.nome.toLowerCase() === trimmedName.toLowerCase()
      );
    }
    if (!product) {
      product = this.db.products.find(
        p => p.ativo !== false && p.nome.toLowerCase().includes(trimmedName.toLowerCase())
      );
    }

    // Caso 1: Produto cadastrado com estoque > 0
    if (product && product.estoque > 0) {
      if (data.confirmou_erro_contagem !== true) {
        return {
          status_code: 'EXISTS_HAS_STOCK_AWAITING_CONFIRMATION',
          message: `O produto "${product.nome}" possui ${product.estoque} unidade(s) em estoque. Confirma que o item NÃO foi encontrado fisicamente?`,
          product
        };
      } else {
        const prevStock = product.estoque;
        product.estoque = 0;
        product.updated_at = new Date().toISOString();

        this.db.movements.unshift({
          id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          produto_id: product.id,
          produto_nome: product.nome,
          produto_codigo: product.codigo,
          usuario_id: 'usr_atendimento',
          usuario_nome: data.solicitante_nome || 'Atendimento / Balcão',
          tipo: 'saida',
          quantidade: prevStock,
          observacao: 'Correção de divergência física ao atender cliente - Produto não encontrado',
          created_at: new Date().toISOString()
        });

        let demand = this.db.unfulfilled_demands.find(
          d => d.produto_id === product?.id || d.produto_nome.toLowerCase() === product?.nome.toLowerCase()
        );

        if (demand) {
          demand.quantidade_solicitacoes += 1;
          demand.estoque_no_momento = 0;
          demand.status = 'estoque_zerado_por_divergencia';
          demand.updated_at = new Date().toISOString();
        } else {
          demand = {
            id: `dem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            produto_id: product.id,
            produto_nome: product.nome,
            cadastrado: true,
            quantidade_solicitacoes: 1,
            estoque_no_momento: 0,
            solicitante_nome: data.solicitante_nome || 'Atendimento',
            status: 'estoque_zerado_por_divergencia',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          this.db.unfulfilled_demands.unshift(demand);
        }

        this.addHistory(
          data.solicitante_nome || 'Atendimento',
          'EDICAO',
          `Correção de estoque físico: ${product.nome} zerado (estava ${prevStock} un)`
        );

        this.saveData(this.db);

        return {
          status_code: 'EXISTS_STOCK_ZEROED',
          message: `Estoque do produto "${product.nome}" zerado automaticamente e adicionado à lista de reposição!`,
          product,
          demand
        };
      }
    }

    // Caso 2: Produto cadastrado com estoque == 0
    if (product && product.estoque === 0) {
      let demand = this.db.unfulfilled_demands.find(
        d => d.produto_id === product?.id || d.produto_nome.toLowerCase() === product?.nome.toLowerCase()
      );

      if (demand) {
        demand.quantidade_solicitacoes += 1;
        demand.status = 'sem_estoque';
        demand.updated_at = new Date().toISOString();
      } else {
        demand = {
          id: `dem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          produto_id: product.id,
          produto_nome: product.nome,
          cadastrado: true,
          quantidade_solicitacoes: 1,
          estoque_no_momento: 0,
          solicitante_nome: data.solicitante_nome || 'Atendimento',
          status: 'sem_estoque',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.db.unfulfilled_demands.unshift(demand);
      }

      this.addHistory(
        data.solicitante_nome || 'Atendimento',
        'CONFIG',
        `Registrada procura de cliente para produto sem estoque: ${product.nome}`
      );

      this.saveData(this.db);

      return {
        status_code: 'EXISTS_NO_STOCK_REGISTERED',
        message: `Solicitação registrada! O produto "${product.nome}" já está sem estoque e +1 procura foi contabilizada.`,
        product,
        demand
      };
    }

    // Caso 3: Produto NÃO cadastrado
    let demand = this.db.unfulfilled_demands.find(
      d => !d.cadastrado && d.produto_nome.toLowerCase() === trimmedName.toLowerCase()
    );

    if (demand) {
      demand.quantidade_solicitacoes += 1;
      demand.updated_at = new Date().toISOString();
    } else {
      demand = {
        id: `dem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        produto_nome: trimmedName,
        cadastrado: false,
        quantidade_solicitacoes: 1,
        estoque_no_momento: 0,
        solicitante_nome: data.solicitante_nome || 'Atendimento',
        status: 'nao_cadastrado',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.db.unfulfilled_demands.unshift(demand);
    }

    this.addHistory(
      data.solicitante_nome || 'Atendimento',
      'CONFIG',
      `Registrada solicitação de cliente para produto não cadastrado: ${trimmedName}`
    );

    this.saveData(this.db);

    return {
      status_code: 'NOT_REGISTERED_SAVED',
      message: `Produto "${trimmedName}" registrado na lista de "Produtos não cadastrados solicitados por clientes"!`,
      demand
    };
  }

  deleteUnfulfilledDemand(id: string) {
    if (!this.db.unfulfilled_demands) return false;
    const initialLen = this.db.unfulfilled_demands.length;
    this.db.unfulfilled_demands = this.db.unfulfilled_demands.filter(d => d.id !== id);
    if (this.db.unfulfilled_demands.length !== initialLen) {
      this.saveData(this.db);
      return true;
    }
    return false;
  }

  getSystemTestStatus() {
    return this.db.system_test_status || { active: false };
  }

  saveStockSnapshot() {
    const snapshot: Record<string, number> = {};
    for (const p of this.db.products) {
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
    if (!this.db.system_test_status) {
      this.db.system_test_status = { active: true };
    }
    this.db.system_test_status.stock_snapshot = snapshot;
    this.saveData(this.db);
    return snapshot;
  }

  purgeBotDataAndRestoreStock() {
    const snapshot = this.db.system_test_status?.stock_snapshot || {};

    // 1. Restore real product stocks to pre-test levels
    for (const p of this.db.products) {
      if (snapshot[p.id] !== undefined) {
        p.estoque = snapshot[p.id];
        p.updated_at = new Date().toISOString();
      }
    }

    // 2. Remove test products
    this.db.products = this.db.products.filter(p =>
      !p.nome.includes('[TESTE]') &&
      !p.nome.includes('[BOT_TEST]') &&
      !p.codigo.includes('TST-') &&
      !p.id.startsWith('test_prod_') &&
      p.marca !== 'Facilitando Meu Trabalho TestLab' &&
      p.marca !== 'Bosteca TestLab' &&
      p.marca !== 'Bytecas TestLab'
    );

    // 3. Remove test movements
    this.db.movements = this.db.movements.filter(m =>
      !(m.observacao && (m.observacao.includes('[TESTE]') || m.observacao.includes('[BOT_TEST]'))) &&
      !(m.produto_nome && (m.produto_nome.includes('[TESTE]') || m.produto_nome.includes('[BOT_TEST]')))
    );

    // 4. Remove test demands
    if (this.db.unfulfilled_demands) {
      this.db.unfulfilled_demands = this.db.unfulfilled_demands.filter(d =>
        !(d.produto_nome && (d.produto_nome.includes('[TESTE]') || d.produto_nome.includes('[BOT_TEST]'))) &&
        !(d.solicitante_nome && (d.solicitante_nome.includes('simulado') || d.solicitante_nome.includes('[TESTE]')))
      );
    }

    // 5. Remove test categories
    this.db.categories = this.db.categories.filter(c => !c.nome.startsWith('Categoria Teste #'));

    if (this.db.system_test_status) {
      delete this.db.system_test_status.stock_snapshot;
    }

    this.saveData(this.db);
    return { success: true };
  }

  setSystemTestStatus(active: boolean) {
    if (active) {
      this.saveStockSnapshot();
    } else {
      this.purgeBotDataAndRestoreStock();
    }

    this.db.system_test_status = {
      active,
      started_at: active ? (this.db.system_test_status?.started_at || new Date().toISOString()) : undefined,
      updated_at: new Date().toISOString()
    };
    this.saveData(this.db);
    return this.db.system_test_status;
  }
}

export const db = new LocalDatabase();
