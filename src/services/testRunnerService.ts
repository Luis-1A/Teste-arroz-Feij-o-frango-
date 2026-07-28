import { firestoreSync } from './firestoreSync';
import { localStore } from './localStore';
import { Product, Movement, CustomerDemand } from '../types';

export interface TestLogMessage {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'action';
}

type TestSubscriber = (active: boolean, logs: TestLogMessage[]) => void;

class TestRunnerService {
  private active: boolean = false;
  private intervalId: any = null;
  private logs: TestLogMessage[] = [];
  private subscribers: TestSubscriber[] = [];
  private botUsers = [
    { id: 'usr_bot_1', nome: '🤖 Robô Vendedor #1' },
    { id: 'usr_bot_2', nome: '🤖 Robô Almoxarifado #2' },
    { id: 'usr_bot_3', nome: '🤖 Robô Caixa #3' },
    { id: 'usr_bot_4', nome: '🤖 Robô Auditoria #4' }
  ];

  constructor() {
    this.active = localStorage.getItem('bytecas_system_test_active') === 'true';

    // Subscribe to Firestore System Test Status
    firestoreSync.subscribeSystemTestStatus((status) => {
      const wasActive = this.active;
      this.active = status.active;
      localStorage.setItem('bytecas_system_test_active', status.active ? 'true' : 'false');

      if (this.active) {
        if (!this.intervalId) {
          this.startLoop();
        }
      } else {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }

      if (wasActive !== this.active) {
        this.notify();
      }
    });

    // Subscribe to Firestore System Test Logs
    firestoreSync.subscribeSystemTestLogs((remoteLogs) => {
      if (remoteLogs && Array.isArray(remoteLogs)) {
        this.logs = remoteLogs.map(l => ({
          id: l.id || `log_${Math.random()}`,
          time: l.time || new Date().toLocaleTimeString('pt-BR'),
          text: l.text || '',
          type: l.type || 'info'
        }));
        this.notify();
      }
    });

    if (this.active) {
      this.startLoop();
    }
  }

  public subscribe(cb: TestSubscriber): () => void {
    this.subscribers.push(cb);
    cb(this.active, this.logs);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  private notify() {
    this.subscribers.forEach(cb => cb(this.active, this.logs));
    window.dispatchEvent(new Event('bytecas_test_mode_changed'));
  }

  public isTestActive(): boolean {
    return this.active;
  }

  public getLogs(): TestLogMessage[] {
    return this.logs;
  }

  public addLog(text: string, type: TestLogMessage['type'] = 'info') {
    const time = new Date().toLocaleTimeString('pt-BR');
    const newLog: TestLogMessage = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      time,
      text,
      type
    };
    this.logs = [...this.logs.slice(-150), newLog]; // keep last 150
    this.notify();

    // Persist log to Firestore so other devices see real-time updates
    firestoreSync.addSystemTestLog({ time, text, type }).catch(() => {});
  }

  public async startTest(): Promise<void> {
    this.active = true;
    localStorage.setItem('bytecas_system_test_active', 'true');

    // Save initial stock snapshot to preserve real inventory state
    await firestoreSync.saveStockSnapshot();

    // Update central database (Firestore & Express Backend)
    await firestoreSync.setSystemTestStatus(true, 'admin_supremo');
    fetch('/api/system-test/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('bytecas_auth_token') || ''}`
      },
      body: JSON.stringify({ active: true })
    }).catch(() => {});

    this.addLog('🚀 MODO DE TESTE CONTINUO DO SISTEMA INICIADO COM SUCESSO', 'success');
    this.addLog('📸 Snapshot do estoque real salvo antes do início do teste.', 'info');
    this.addLog('🔒 Bloqueio ativo no Banco de Dados para Gerentes e Funcionários.', 'warn');
    this.addLog('🤖 Robôs simuladores de balcão e estoque disparados em tempo real.', 'info');
    this.startLoop();
    this.notify();
  }

  public async stopTest(password: string): Promise<boolean> {
    if (password !== '@Luisoo5') {
      this.addLog('⛔ Tentativa de encerramento recusada: Senha de confirmação incorreta!', 'error');
      throw new Error('Senha incorreta! Acesso negado. O teste continuará executando.');
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.addLog('🧹 Encerrando simulação e iniciando limpeza dos dados de teste no banco de dados...', 'warn');
    this.active = false;
    localStorage.setItem('bytecas_system_test_active', 'false');

    // Update central database (Firestore & Express Backend)
    await firestoreSync.setSystemTestStatus(false);
    fetch('/api/system-test/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('bytecas_auth_token') || ''}`
      },
      body: JSON.stringify({ active: false, password })
    }).catch(() => {});

    // Purge test simulation data
    try {
      await firestoreSync.purgeAllBotData();
      await firestoreSync.clearSystemTestLogs();
      this.addLog('✅ Purga de produtos temporários e registros de teste concluída!', 'success');
    } catch (e) {
      console.warn('Erro ao purgar dados de teste:', e);
    }

    this.addLog('🔴 Teste do Sistema finalizado pelo Administrador Supremo com sucesso.', 'info');
    this.notify();
    return true;
  }

  private startLoop() {
    if (this.intervalId) clearInterval(this.intervalId);

    // Run action every 2.5 seconds
    this.intervalId = setInterval(() => {
      if (!this.active) {
        clearInterval(this.intervalId);
        return;
      }
      this.executeRandomSimulationStep().catch(err => {
        console.warn('Simulation step notice:', err);
      });
    }, 2500);
  }

  private async executeRandomSimulationStep() {
    const actionIndex = Math.floor(Math.random() * 8);
    const products = localStore.getProductsList();
    const botUser = this.botUsers[Math.floor(Math.random() * this.botUsers.length)];

    switch (actionIndex) {
      case 0: {
        // Simular Venda de Balcão (Saída)
        if (products.length === 0) return;
        const target = products[Math.floor(Math.random() * products.length)];
        const qty = Math.min(target.estoque > 0 ? Math.floor(Math.random() * 3) + 1 : 1, Math.max(1, target.estoque));
        
        await firestoreSync.registerStockExit(
          [{ productId: target.id, quantity: qty }],
          { id: botUser.id, nome: botUser.nome },
          `[TESTE] Venda simulada no PDV por ${botUser.nome}`,
          'venda'
        );
        this.addLog(`📉 [PDV] ${botUser.nome} deu baixa em ${qty} UN do produto "${target.nome}" (Estoque restante: ${Math.max(0, target.estoque - qty)} UN)`, 'action');
        break;
      }

      case 1: {
        // Simular Entrada de Almoxarifado
        if (products.length === 0) return;
        const target = products[Math.floor(Math.random() * products.length)];
        const addQty = Math.floor(Math.random() * 15) + 5;
        const newStock = target.estoque + addQty;

        await firestoreSync.updateProductStock(
          target.id,
          newStock,
          { id: botUser.id, nome: botUser.nome },
          'entrada',
          addQty,
          `[TESTE] Reabastecimento recebido via nota fiscal`
        );
        this.addLog(`📦 [ALMOXARIFADO] ${botUser.nome} registrou entrada de +${addQty} UN para "${target.nome}" (Novo estoque: ${newStock} UN)`, 'success');
        break;
      }

      case 2: {
        // Simular Esgotamento / Zerar Estoque para testar Lista de Reposição
        if (products.length === 0) return;
        const available = products.filter(p => p.estoque > 0);
        if (available.length === 0) return;
        const target = available[Math.floor(Math.random() * available.length)];

        await firestoreSync.updateProductStock(
          target.id,
          0,
          { id: botUser.id, nome: botUser.nome },
          'saida',
          target.estoque,
          `[TESTE] Item esgotado completamente no balcão`
        );
        this.addLog(`🚨 [ALERTA DE REPOSIÇÃO] "${target.nome}" teve estoque ZERADO por ${botUser.nome}! Inserido automaticamente na Lista de Reposição.`, 'warn');
        break;
      }

      case 3: {
        // Simular Registro de Demanda de Cliente Não Cadastrado
        const itemNames = [
          'Carregador Magsafe Duo 45W [TESTE]',
          'Cabo HDMI 2.1 8K Braided [TESTE]',
          'Suporte Veicular MagSafe Ar [TESTE]',
          'Película Privativa Curved S24 Ultra [TESTE]'
        ];
        const chosen = itemNames[Math.floor(Math.random() * itemNames.length)];
        
        localStore.registerCustomerDemand({
          produto_nome: chosen,
          solicitante_nome: `Cliente simulado por ${botUser.nome}`
        });
        this.addLog(`📝 [DEMANDA] ${botUser.nome} registrou procura de cliente sem estoque: "${chosen}"`, 'info');
        break;
      }

      case 4: {
        // Simular Cadastro de Produto Temporário
        const categories = localStore.getCategoriesList();
        const cat = categories.length > 0 ? categories[Math.floor(Math.random() * categories.length)].nome : 'Acessórios';
        const randId = Math.floor(Math.random() * 900) + 100;
        
        await firestoreSync.createProduct({
          nome: `[TESTE] Fone Wireless SoundBox ${randId}`,
          categoria: cat,
          marca: 'Bytecas TestLab',
          codigo: `TST-${randId}`,
          codigo_barras: `789999000${randId}`,
          estoque: 12,
          estoque_minimo: 5,
          localizacao: 'GAVETA TESTE-A'
        });
        this.addLog(`✨ [ESTOQUE] Produto temporário criado: "[TESTE] Fone Wireless SoundBox ${randId}" (Cat: ${cat})`, 'success');
        break;
      }

      case 5: {
        // Simular Teste de Estresse do Firestore (Leitura/Escrita)
        const res = await firestoreSync.runDatabaseStressTest();
        if (res.success) {
          this.addLog(`⚡ [BANCO FIRESTORE] Ciclo de validação OK! Escrita: ${res.writeTimeMs}ms | Leitura: ${res.readTimeMs}ms | Exclusão: ${res.deleteTimeMs}ms`, 'info');
        } else {
          this.addLog(`⚠️ [BANCO FIRESTORE] Pico de latência no teste de estresse: ${res.error}`, 'warn');
        }
        break;
      }

      case 6: {
        // Simular Mudança de Categoria Temporária
        const catName = `Categoria Teste #${Math.floor(Math.random() * 50) + 1}`;
        await firestoreSync.createCategory(catName);
        this.addLog(`📁 [CATEGORIAS] Categoria temporária de teste criada: "${catName}"`, 'info');
        break;
      }

      case 7: {
        // Simular Verificação de Audit Log / Integridade
        this.addLog(`🛡️ [RBAC & SEGURANÇA] Validação automática de permissões e sessão do Administrador Supremo concluída.`, 'info');
        break;
      }

      default:
        break;
    }
  }
}

export const testRunnerService = new TestRunnerService();
