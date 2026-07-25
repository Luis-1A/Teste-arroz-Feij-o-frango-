import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { db, UserRole } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI Client
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Helper middleware to check mock session token
  const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // Default fallback to supremo admin for easy preview usage
      (req as any).user = db.getUsers().find(u => u.cargo === 'admin_supremo') || db.getUsers()[0];
      return next();
    }
    const userId = authHeader.replace('Bearer ', '');
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }
    (req as any).user = user;
    next();
  };

  // --------------------------------------------------------------------------
  // API ROUTES
  // --------------------------------------------------------------------------

  // Auth: Register (Primeiro Cadastro)
  app.post('/api/auth/register', (req, res) => {
    const { nome, email, senha, cargo } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
    }

    const userRole: UserRole = (cargo as UserRole) || 'gerente';

    const newUser = db.createUser({
      nome,
      email,
      senha_hash: senha,
      cargo: userRole,
      ativo: true
    });

    db.addHistory(newUser.nome, 'CADASTRO', `Primeiro cadastro de usuário realizado (${newUser.cargo}).`, req.ip);

    res.status(201).json({
      token: newUser.id,
      user: {
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email,
        cargo: newUser.cargo,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      }
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = db.getUserByEmail(email);
    if (!user || user.senha_hash !== senha) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique o e-mail e a senha.' });
    }

    db.addHistory(user.nome, 'LOGIN', `Acesso efetuado no sistema (${user.cargo}).`, req.ip);

    res.json({
      token: user.id,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  });

  // Auth: Forgot Password
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'E-mail não cadastrado no sistema Bytecas.' });
    }
    // Simulated reset email
    res.json({ message: `Instruções de recuperação enviadas com sucesso para ${email}.` });
  });

  // Auth: Get current user
  app.get('/api/auth/me', authenticateUser, (req, res) => {
    const user = (req as any).user;
    res.json({ user });
  });

  // Users Management
  app.get('/api/users', authenticateUser, (req, res) => {
    const user = (req as any).user;
    if (user.cargo !== 'admin_supremo') {
      return res.status(403).json({ error: 'Acesso restrito ao Administrador Supremo.' });
    }
    res.json(db.getUsers());
  });

  app.post('/api/users', authenticateUser, (req, res) => {
    const currentUser = (req as any).user;
    if (currentUser.cargo !== 'admin_supremo') {
      return res.status(403).json({ error: 'Apenas o Administrador Supremo pode criar novos usuários.' });
    }

    const { nome, email, senha, cargo } = req.body;
    if (!nome || !email || !senha || !cargo) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    const newUser = db.createUser({
      nome,
      email,
      senha_hash: senha,
      cargo: cargo as UserRole,
      ativo: true
    });

    db.addHistory(currentUser.nome, 'CADASTRO', `Cadastrou o usuário ${nome} (${cargo}).`, req.ip);

    res.status(201).json(newUser);
  });

  app.put('/api/users/:id', authenticateUser, (req, res) => {
    const currentUser = (req as any).user;
    if (currentUser.cargo !== 'admin_supremo') {
      return res.status(403).json({ error: 'Apenas o Administrador Supremo pode editar permissões.' });
    }

    const { id } = req.params;
    const { nome, email, cargo, senha } = req.body;

    const dataToUpdate: any = {};
    if (nome) dataToUpdate.nome = nome;
    if (email) dataToUpdate.email = email;
    if (cargo) dataToUpdate.cargo = cargo;
    if (senha) dataToUpdate.senha_hash = senha;

    const updated = db.updateUser(id, dataToUpdate);
    if (!updated) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    db.addHistory(currentUser.nome, 'EDICAO', `Atualizou dados/permissões do usuário ${updated.nome}.`, req.ip);

    res.json(updated);
  });

  app.delete('/api/users/:id', authenticateUser, (req, res) => {
    const currentUser = (req as any).user;
    if (currentUser.cargo !== 'admin_supremo') {
      return res.status(403).json({ error: 'Apenas o Administrador Supremo pode remover usuários.' });
    }

    const { id } = req.params;
    try {
      const deletedUser = db.getUserById(id);
      const success = db.deleteUserLogical(id);
      if (!success) return res.status(404).json({ error: 'Usuário não encontrado.' });

      db.addHistory(currentUser.nome, 'EXCLUSAO_LOGICA', `Excluiu o usuário ${deletedUser?.nome}.`, req.ip);

      res.json({ message: 'Usuário removido com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao deletar usuário.' });
    }
  });

  // Categories
  app.get('/api/categories', (req, res) => {
    res.json(db.getCategories());
  });

  app.post('/api/categories', authenticateUser, (req, res) => {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    const cat = db.createCategory(nome);
    res.status(201).json(cat);
  });

  // Products
  app.get('/api/products', (req, res) => {
    const { search, categoria } = req.query;
    const products = db.getProducts(search as string, categoria as string);
    res.json(products);
  });

  app.get('/api/products/:id', (req, res) => {
    const product = db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(product);
  });

  app.post('/api/products', authenticateUser, (req, res) => {
    const currentUser = (req as any).user;
    // Both Admin and Manager/Employee can add products per doc
    const { nome, categoria, marca, codigo, codigo_barras, estoque, estoque_minimo, localizacao, observacao } = req.body;

    if (!nome || !categoria || !marca || !codigo || estoque === undefined || estoque_minimo === undefined || !localizacao) {
      return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios.' });
    }

    const newProd = db.createProduct({
      nome,
      categoria,
      marca,
      codigo,
      codigo_barras: codigo_barras || '',
      estoque: Number(estoque),
      estoque_minimo: Number(estoque_minimo),
      localizacao,
      observacao: observacao || ''
    }, currentUser.nome);

    res.status(201).json(newProd);
  });

  app.put('/api/products/:id', authenticateUser, (req, res) => {
    const currentUser = (req as any).user;
    if (currentUser.cargo === 'funcionario') {
      return res.status(403).json({ error: 'Funcionários não possuem permissão para editar cadastros de produtos.' });
    }

    const updated = db.updateProduct(req.params.id, req.body, currentUser.nome);
    if (!updated) return res.status(404).json({ error: 'Produto não encontrado.' });

    res.json(updated);
  });

  app.delete('/api/products/:id', authenticateUser, (req, res) => {
    const currentUser = (req as any).user;
    if (currentUser.cargo === 'funcionario') {
      return res.status(403).json({ error: 'Funcionários não possuem permissão para excluir produtos.' });
    }

    const success = db.deleteProductLogical(req.params.id, currentUser.nome);
    if (!success) return res.status(404).json({ error: 'Produto não encontrado.' });

    res.json({ message: 'Produto excluído logicamente com sucesso.' });
  });

  // Stock Entries
  app.post('/api/stock/entry', authenticateUser, (req, res) => {
    const currentUser = (req as any).user;
    const { produto_id, quantidade, observacao } = req.body;

    if (!produto_id || !quantidade || quantidade <= 0) {
      return res.status(400).json({ error: 'Informe o produto e uma quantidade válida.' });
    }

    try {
      const updatedProduct = db.addStockEntry(produto_id, Number(quantidade), observacao, currentUser);
      res.json(updatedProduct);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao registrar entrada.' });
    }
  });

  // Stock Exits (Painel de Saídas / Vendas - Sem Preço)
  app.post('/api/stock/exit', authenticateUser, (req, res) => {
    const currentUser = (req as any).user;
    const { items, observacao } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Selecione ao menos um produto para registrar saída.' });
    }

    try {
      const movements = db.addStockExit(items, observacao, currentUser);
      res.json({ message: 'Saída de produtos registrada com sucesso.', movements });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao registrar saída de estoque.' });
    }
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', (req, res) => {
    res.json(db.getDashboardStats());
  });

  // Reports: Low Stock
  app.get('/api/reports/out-of-stock', (req, res) => {
    res.json(db.getOutOfStock());
  });

  // Reports: Top Moved / Best Sellers
  app.get('/api/reports/top-moved', (req, res) => {
    const periodo = (req.query.periodo as 'hoje' | 'semana' | 'mes' | 'ano') || 'hoje';
    res.json(db.getTopMoved(periodo));
  });

  // History Audit Log
  app.get('/api/history', authenticateUser, (req, res) => {
    res.json(db.getHistory());
  });

  // Mathematical Stock Analysis & Restock Suggestions (Sem IA - Cálculos Matemáticos)
  app.get('/api/restock-analysis', (req, res) => {
    const products = db.getProducts();
    const outOfStock = db.getOutOfStock();

    const restockItems = outOfStock.map(p => {
      const sugerida = Math.max(1, (p.estoque_minimo * 2) - p.estoque);
      let nivelRisco: 'CRITICO' | 'ALERTA' | 'ESTAVEL' = 'ALERTA';
      if (p.estoque === 0) {
        nivelRisco = 'CRITICO';
      } else if (p.estoque <= Math.floor(p.estoque_minimo / 2)) {
        nivelRisco = 'CRITICO';
      }

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
        nivel_risco: nivelRisco
      };
    });

    res.json({
      total_produtos_criticos: restockItems.length,
      total_unidades_sugeridas: restockItems.reduce((acc, item) => acc + item.quantidade_sugerida, 0),
      items: restockItems,
      source: 'math_engine'
    });
  });

  // Legacy fallback endpoint for backwards compatibility using pure math
  app.post('/api/ai-insights', (req, res) => {
    const products = db.getProducts();
    const outOfStock = db.getOutOfStock();

    const mathInsights = [];

    if (products.length === 0) {
      return res.json({
        insights: [
          {
            id: 'ins_empty',
            tipo: 'otimizacao',
            titulo: 'Estoque Vazio (Aguardando Cadastros)',
            descricao: 'Nenhum produto cadastrado no banco de dados. Cadastre os itens da loja para ativar os cálculos matemáticos de reposição.',
            prioridade: 'baixa',
            data_analise: new Date().toISOString()
          }
        ],
        source: 'math_engine'
      });
    }

    if (outOfStock.length > 0) {
      mathInsights.push({
        id: 'ins_math_1',
        tipo: 'reposicao_urgente',
        titulo: `Cálculo de Reposição - ${outOfStock.length} Item(ns) Abaixo do Mínimo`,
        descricao: `Análise matemática identificou que ${outOfStock.length} produto(s) possuem saldo físico menor ou igual ao estoque mínimo.`,
        prioridade: 'alta',
        data_analise: new Date().toISOString()
      });
    }

    res.json({ insights: mathInsights, source: 'math_engine' });
  });

  // Unfulfilled Customer Demands ("Cliente veio comprar e não tinha")
  app.get('/api/customer-demands', (req, res) => {
    res.json(db.getUnfulfilledDemands());
  });

  app.post('/api/customer-demands', (req, res) => {
    const { produto_nome, produto_id, solicitante_nome, confirmou_erro_contagem } = req.body;
    if (!produto_nome && !produto_id) {
      return res.status(400).json({ error: 'Informe o nome ou código do produto.' });
    }

    try {
      const result = db.processCustomerDemand({
        produto_nome: produto_nome || '',
        produto_id,
        solicitante_nome,
        confirmou_erro_contagem: Boolean(confirmou_erro_contagem)
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao processar solicitação do cliente.' });
    }
  });

  app.delete('/api/customer-demands/:id', authenticateUser, (req, res) => {
    const { id } = req.params;
    const success = db.deleteUnfulfilledDemand(id);
    if (!success) return res.status(404).json({ error: 'Item não encontrado.' });
    res.json({ message: 'Removido com sucesso.' });
  });

  // --------------------------------------------------------------------------
  // VITE / STATIC SERVING
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Bytecas running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
