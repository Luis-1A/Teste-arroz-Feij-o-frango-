import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category, Movement, AuditLog, CustomerDemand, POSConfig } from '../types';

import { DEFAULT_POS_CONFIG } from '../config/posDefault';
import { localStore } from './localStore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  console.warn(`Firestore Sync Notice (${operationType} @ ${path}):`, errMessage);
}

// Global subscribers
type Listener<T> = (data: T) => void;

class FirestoreSyncService {
  private productsListeners: Listener<Product[]>[] = [];
  private movementsListeners: Listener<Movement[]>[] = [];
  private configListeners: Listener<POSConfig>[] = [];
  private categoriesListeners: Listener<Category[]>[] = [];
  private demandsListeners: Listener<CustomerDemand[]>[] = [];
  private systemTestStatusListeners: Listener<{ active: boolean; started_at?: string; started_by?: string }>[] = [];
  private systemTestLogsListeners: Listener<any[]>[] = [];

  private isInitialized = false;
  private currentConfig: POSConfig = DEFAULT_POS_CONFIG;

  constructor() {
    this.initRealtimeListeners();
  }

  public async initRealtimeListeners() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Sync POS Config
    try {
      const configDocRef = doc(db, 'config', 'pos_layout');
      onSnapshot(
        configDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as POSConfig;
            this.currentConfig = { ...DEFAULT_POS_CONFIG, ...data };
          } else {
            // Seed initial POS config
            setDoc(configDocRef, { ...DEFAULT_POS_CONFIG, updated_at: new Date().toISOString() }).catch(() => {});
            this.currentConfig = DEFAULT_POS_CONFIG;
          }
          // Save to local store for offline consistency
          localStore.setPOSConfig(this.currentConfig);
          this.notifyConfig(this.currentConfig);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'config/pos_layout')
      );
    } catch (e) {
      console.warn('Failed to attach POS Config listener', e);
    }

    // 2. Sync Products
    try {
      const productsRef = collection(db, 'products');
      onSnapshot(
        productsRef,
        async (snapshot) => {
          if (snapshot.empty) {
            // Seed initial products from localStore if cloud DB is completely empty
            const initialProds = localStore.getProducts();
            for (const prod of initialProds) {
              await setDoc(doc(db, 'products', prod.id), prod).catch(() => {});
            }
          } else {
            const products: Product[] = [];
            snapshot.forEach((docSnap) => {
              const p = { id: docSnap.id, ...docSnap.data() } as Product;
              products.push(p);
            });
            localStore.saveProductsToLocal(products);
            this.notifyProducts(products);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'products')
      );
    } catch (e) {
      console.warn('Failed to attach Products listener', e);
    }

    // 3. Sync Categories
    try {
      const categoriesRef = collection(db, 'categories');
      onSnapshot(
        categoriesRef,
        async (snapshot) => {
          if (snapshot.empty) {
            const initialCats = localStore.getCategories();
            for (const cat of initialCats) {
              await setDoc(doc(db, 'categories', cat.id), cat).catch(() => {});
            }
          } else {
            const cats: Category[] = [];
            snapshot.forEach((docSnap) => {
              cats.push({ id: docSnap.id, ...docSnap.data() } as Category);
            });
            localStore.saveCategoriesToLocal(cats);
            this.notifyCategories(cats);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'categories')
      );
    } catch (e) {
      console.warn('Failed to attach Categories listener', e);
    }

    // 4. Sync Movements
    try {
      const movementsRef = collection(db, 'movements');
      onSnapshot(
        movementsRef,
        async (snapshot) => {
          const movements: Movement[] = [];
          snapshot.forEach((docSnap) => {
            const m = { id: docSnap.id, ...docSnap.data() } as Movement;
            if (
              (!m.observacao || !m.observacao.includes('[BOT_TEST]')) &&
              (!m.produto_nome || !m.produto_nome.includes('[BOT_TEST]'))
            ) {
              movements.push(m);
            }
          });
          // Sort newest first
          movements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          localStore.saveMovementsToLocal(movements);
          this.notifyMovements(movements);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'movements')
      );
    } catch (e) {
      console.warn('Failed to attach Movements listener', e);
    }

    // 5. Sync Customer Demands
    try {
      const demandsRef = collection(db, 'demands');
      onSnapshot(
        demandsRef,
        (snapshot) => {
          const demands: CustomerDemand[] = [];
          snapshot.forEach((docSnap) => {
            const d = { id: docSnap.id, ...docSnap.data() } as CustomerDemand;
            if (
              !d.id.startsWith('dem_') &&
              (!d.produto_nome || (!d.produto_nome.includes('[BOT_TEST]') && !d.produto_nome.includes('Produto Solicitado')))
            ) {
              demands.push(d);
            }
          });
          demands.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          localStore.saveDemandsToLocal(demands);
          this.notifyDemands(demands);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'demands')
      );
    } catch (e) {
      console.warn('Failed to attach Demands listener', e);
    }

    // 6. Sync System Test Status
    try {
      const systemTestDocRef = doc(db, 'system_test', 'status');
      onSnapshot(
        systemTestDocRef,
        (snapshot) => {
          let testStatus = { active: false };
          if (snapshot.exists()) {
            testStatus = snapshot.data() as any;
          }
          localStorage.setItem('bytecas_system_test_active', testStatus.active ? 'true' : 'false');
          window.dispatchEvent(new Event('bytecas_test_mode_changed'));
          this.notifySystemTestStatus(testStatus);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'system_test/status')
      );
    } catch (e) {
      console.warn('Failed to attach System Test status listener', e);
    }

    // 7. Sync System Test Logs
    try {
      const testLogsRef = collection(db, 'system_test_logs');
      onSnapshot(
        testLogsRef,
        (snapshot) => {
          const logs: any[] = [];
          snapshot.forEach((docSnap) => {
            logs.push({ id: docSnap.id, ...docSnap.data() });
          });
          logs.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
          this.notifySystemTestLogs(logs);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'system_test_logs')
      );
    } catch (e) {
      console.warn('Failed to attach System Test logs listener', e);
    }
  }

  // Subscriptions
  public subscribeProducts(cb: Listener<Product[]>): () => void {
    this.productsListeners.push(cb);
    cb(localStore.getProducts());
    return () => {
      this.productsListeners = this.productsListeners.filter((l) => l !== cb);
    };
  }

  public subscribeMovements(cb: Listener<Movement[]>): () => void {
    this.movementsListeners.push(cb);
    cb(localStore.getMovements());
    return () => {
      this.movementsListeners = this.movementsListeners.filter((l) => l !== cb);
    };
  }

  public subscribeConfig(cb: Listener<POSConfig>): () => void {
    this.configListeners.push(cb);
    cb(localStore.getPOSConfig());
    return () => {
      this.configListeners = this.configListeners.filter((l) => l !== cb);
    };
  }

  public subscribeCategories(cb: Listener<Category[]>): () => void {
    this.categoriesListeners.push(cb);
    cb(localStore.getCategories());
    return () => {
      this.categoriesListeners = this.categoriesListeners.filter((l) => l !== cb);
    };
  }

  public subscribeDemands(cb: Listener<CustomerDemand[]>): () => void {
    this.demandsListeners.push(cb);
    cb(localStore.getDemands());
    return () => {
      this.demandsListeners = this.demandsListeners.filter((l) => l !== cb);
    };
  }

  public subscribeSystemTestStatus(cb: Listener<{ active: boolean; started_at?: string; started_by?: string }>): () => void {
    this.systemTestStatusListeners.push(cb);
    cb({ active: localStorage.getItem('bytecas_system_test_active') === 'true' });
    return () => {
      this.systemTestStatusListeners = this.systemTestStatusListeners.filter((l) => l !== cb);
    };
  }

  public subscribeSystemTestLogs(cb: Listener<any[]>): () => void {
    this.systemTestLogsListeners.push(cb);
    return () => {
      this.systemTestLogsListeners = this.systemTestLogsListeners.filter((l) => l !== cb);
    };
  }

  private notifyProducts(data: Product[]) {
    this.productsListeners.forEach((l) => l(data));
  }
  private notifyMovements(data: Movement[]) {
    this.movementsListeners.forEach((l) => l(data));
  }
  private notifyConfig(data: POSConfig) {
    this.configListeners.forEach((l) => l(data));
  }
  private notifyCategories(data: Category[]) {
    this.categoriesListeners.forEach((l) => l(data));
  }
  private notifyDemands(data: CustomerDemand[]) {
    this.demandsListeners.forEach((l) => l(data));
  }
  private notifySystemTestStatus(data: { active: boolean; started_at?: string; started_by?: string }) {
    this.systemTestStatusListeners.forEach((l) => l(data));
  }
  private notifySystemTestLogs(data: any[]) {
    this.systemTestLogsListeners.forEach((l) => l(data));
  }

  // --- SYSTEM TEST FIRESTORE MUTATIONS ---

  public async setSystemTestStatus(active: boolean, startedBy: string = 'admin_supremo'): Promise<void> {
    const statusData = {
      active,
      started_by: active ? startedBy : '',
      updated_at: new Date().toISOString()
    };
    localStorage.setItem('bytecas_system_test_active', active ? 'true' : 'false');
    window.dispatchEvent(new Event('bytecas_test_mode_changed'));
    this.notifySystemTestStatus({ active, started_by: statusData.started_by });

    try {
      await setDoc(doc(db, 'system_test', 'status'), statusData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system_test/status');
    }
  }

  public async addSystemTestLog(log: { time: string; text: string; type: string }): Promise<void> {
    try {
      await addDoc(collection(db, 'system_test_logs'), {
        ...log,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system_test_logs');
    }
  }

  public async clearSystemTestLogs(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'system_test_logs'));
      for (const docSnap of snap.docs) {
        await deleteDoc(doc(db, 'system_test_logs', docSnap.id)).catch(() => {});
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'system_test_logs');
    }
  }

  // --- ACTIONS (Write to Firestore & Local) ---

  public async updatePOSConfig(newConfig: POSConfig, userEmail: string = 'admin'): Promise<POSConfig> {
    const configToSave: POSConfig = {
      ...newConfig,
      updated_at: new Date().toISOString(),
      updated_by: userEmail
    };

    // Update locally immediately
    localStore.setPOSConfig(configToSave);
    this.notifyConfig(configToSave);

    // Save centrally in Firestore so ALL devices update
    try {
      const configDocRef = doc(db, 'config', 'pos_layout');
      await setDoc(configDocRef, configToSave, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'config/pos_layout');
    }

    return configToSave;
  }

  public async registerStockExit(
    items: { productId: string; quantity: number }[],
    user: { id: string; nome: string },
    observacao?: string,
    tipoSaida: string = 'venda'
  ): Promise<void> {
    const nowIso = new Date().toISOString();

    for (const item of items) {
      const product = localStore.getProductById(item.productId);
      if (!product) continue;

      const newQty = Math.max(0, product.estoque - item.quantity);

      // 1. Update product in Firestore
      try {
        await updateDoc(doc(db, 'products', product.id), {
          estoque: newQty,
          updated_at: nowIso
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
      }

      // 2. Create Movement in Firestore
      const newMovement: Movement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        produto_id: product.id,
        produto_nome: product.nome,
        produto_codigo: product.codigo,
        usuario_id: user.id,
        usuario_nome: user.nome,
        tipo: 'saida',
        quantidade: item.quantity,
        observacao: observacao ? `[${tipoSaida.toUpperCase()}] ${observacao}` : `[${tipoSaida.toUpperCase()}] Saída realizada na Frente de Caixa`,
        created_at: nowIso
      };

      try {
        await setDoc(doc(db, 'movements', newMovement.id), newMovement);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `movements/${newMovement.id}`);
      }

      // Also perform local update in localStore so immediate state is updated
      localStore.registerSaida(product.id, item.quantity, user, observacao);
    }
    this.notifyProducts(localStore.getProducts());
    this.notifyMovements(localStore.getMovements());
  }

  public async updateProductStock(
    productId: string,
    newStock: number,
    user: { id: string; nome: string },
    tipo: 'entrada' | 'saida',
    quantidadeAlterada: number,
    observacao?: string
  ): Promise<Product | null> {
    const product = localStore.getProductById(productId);
    if (!product) return null;

    const nowIso = new Date().toISOString();

    try {
      await updateDoc(doc(db, 'products', productId), {
        estoque: newStock,
        updated_at: nowIso
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }

    const newMovement: Movement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      produto_id: product.id,
      produto_nome: product.nome,
      produto_codigo: product.codigo,
      usuario_id: user.id,
      usuario_nome: user.nome,
      tipo,
      quantidade: quantidadeAlterada,
      observacao: observacao || `Ajuste direto de estoque (${tipo})`,
      created_at: nowIso
    };

    try {
      await setDoc(doc(db, 'movements', newMovement.id), newMovement);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `movements/${newMovement.id}`);
    }

    const updatedProd = localStore.updateProductStock(productId, newStock, user, tipo, quantidadeAlterada, observacao);
    this.notifyProducts(localStore.getProducts());
    this.notifyMovements(localStore.getMovements());
    return updatedProd;
  }

  public async createProduct(productData: Omit<Product, 'id' | 'ativo' | 'created_at' | 'updated_at'>): Promise<Product> {
    const newProd = localStore.createProduct(productData);
    this.notifyProducts(localStore.getProducts());
    try {
      await setDoc(doc(db, 'products', newProd.id), newProd);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${newProd.id}`);
    }
    return newProd;
  }

  public async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const updated = localStore.updateProduct(id, productData);
    this.notifyProducts(localStore.getProducts());
    try {
      await updateDoc(doc(db, 'products', id), {
        ...productData,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
    return updated;
  }

  public async deleteProduct(id: string): Promise<{ message: string }> {
    const result = localStore.deleteProduct(id);
    this.notifyProducts(localStore.getProducts());
    try {
      await deleteDoc(doc(db, 'products', id)).catch(async () => {
        await updateDoc(doc(db, 'products', id), {
          ativo: false,
          updated_at: new Date().toISOString()
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
    return result;
  }

  public async registerCustomerDemand(demandData: {
    produto_nome: string;
    produto_id?: string;
    observacao?: string;
    solicitante_nome?: string;
    confirmou_erro_contagem?: boolean;
  }) {
    const res = localStore.registerCustomerDemand(demandData);
    this.notifyDemands(localStore.getDemands());
    this.notifyProducts(localStore.getProducts());
    if (res.demand) {
      try {
        await setDoc(doc(db, 'demands', res.demand.id), res.demand);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `demands/${res.demand.id}`);
      }
    }
    return res;
  }

  public async deleteUser(id: string): Promise<{ message: string }> {
    const result = localStore.deleteUser(id);
    try {
      await deleteDoc(doc(db, 'users', id)).catch(async () => {
        await updateDoc(doc(db, 'users', id), {
          ativo: false,
          updated_at: new Date().toISOString()
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
    return result;
  }

  public async createCategory(nome: string): Promise<Category> {
    const newCat = localStore.createCategory(nome);
    try {
      await setDoc(doc(db, 'categories', newCat.id), newCat);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${newCat.id}`);
    }
    return newCat;
  }

  public async deleteCategory(id: string): Promise<{ message: string }> {
    const res = localStore.deleteCategory(id);
    try {
      await deleteDoc(doc(db, 'categories', id)).catch(() => {});
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
    return res;
  }

  public async zeroAllProductsStock(): Promise<{ updatedCount: number }> {
    localStore.zeroAllProductsStock();
    let updatedCount = 0;

    try {
      const snap = await getDocs(collection(db, 'products'));
      for (const docSnap of snap.docs) {
        await updateDoc(doc(db, 'products', docSnap.id), {
          estoque: 0,
          updated_at: new Date().toISOString()
        }).catch(() => {});
        updatedCount++;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'products');
    }

    return { updatedCount };
  }

  public async saveStockSnapshot(): Promise<Record<string, number>> {
    const snapshot = localStore.saveStockSnapshot();
    try {
      await setDoc(doc(db, 'system_test', 'stock_snapshot'), {
        snapshot,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Failed to save stock snapshot to Firestore:', err);
    }
    return snapshot;
  }

  public async purgeAllBotData(): Promise<{ deletedCount: number }> {
    let deletedCount = 0;

    // Purge local store first and restore local stocks
    localStore.purgeAllBotDataAndRestoreStock();

    try {
      // 1. Restore product stocks from Firestore snapshot if available
      try {
        const snapDoc = await getDoc(doc(db, 'system_test', 'stock_snapshot'));
        if (snapDoc.exists()) {
          const snapshotData = snapDoc.data().snapshot as Record<string, number>;
          if (snapshotData) {
            for (const [prodId, origStock] of Object.entries(snapshotData)) {
              await updateDoc(doc(db, 'products', prodId), {
                estoque: origStock,
                updated_at: new Date().toISOString()
              }).catch(() => {});
            }
          }
          await deleteDoc(doc(db, 'system_test', 'stock_snapshot')).catch(() => {});
        }
      } catch (e) {
        console.warn('Could not read/restore stock snapshot from Firestore:', e);
      }

      // 2. Delete bot products
      const snapProds = await getDocs(collection(db, 'products'));
      for (const docSnap of snapProds.docs) {
        const data = docSnap.data();
        if (
          docSnap.id.startsWith('test_prod_') ||
          (data.nome && (data.nome.includes('[BOT_TEST]') || data.nome.includes('[TESTE]'))) ||
          (data.codigo && data.codigo.includes('TST-')) ||
          data.marca === 'Bytecas TestLab'
        ) {
          await deleteDoc(doc(db, 'products', docSnap.id)).catch(() => {});
          deletedCount++;
        }
      }

      // 3. Delete bot movements
      const snapMovs = await getDocs(collection(db, 'movements'));
      for (const docSnap of snapMovs.docs) {
        const data = docSnap.data();
        if (
          (data.observacao && (data.observacao.includes('[BOT_TEST]') || data.observacao.includes('[TESTE]'))) ||
          (data.produto_nome && (data.produto_nome.includes('[BOT_TEST]') || data.produto_nome.includes('[TESTE]')))
        ) {
          await deleteDoc(doc(db, 'movements', docSnap.id)).catch(() => {});
          deletedCount++;
        }
      }

      // 4. Delete bot categories
      const snapCats = await getDocs(collection(db, 'categories'));
      for (const docSnap of snapCats.docs) {
        const data = docSnap.data();
        if (data.nome && data.nome.startsWith('Categoria Teste #')) {
          await deleteDoc(doc(db, 'categories', docSnap.id)).catch(() => {});
          deletedCount++;
        }
      }

      // 5. Delete bot demands in 'demands' and 'customer_demands'
      const snapDemands = await getDocs(collection(db, 'demands'));
      for (const docSnap of snapDemands.docs) {
        const data = docSnap.data();
        if (
          docSnap.id.startsWith('dem_') ||
          (data.produto_nome && (data.produto_nome.includes('[BOT_TEST]') || data.produto_nome.includes('[TESTE]') || data.produto_nome.includes('Produto Solicitado'))) ||
          (data.solicitante_nome && (data.solicitante_nome.includes('simulado') || data.solicitante_nome.includes('[TESTE]')))
        ) {
          await deleteDoc(doc(db, 'demands', docSnap.id)).catch(() => {});
          deletedCount++;
        }
      }

      const snapCustDemands = await getDocs(collection(db, 'customer_demands'));
      for (const docSnap of snapCustDemands.docs) {
        const data = docSnap.data();
        if (
          docSnap.id.startsWith('dem_') ||
          (data.produto_nome && (data.produto_nome.includes('[BOT_TEST]') || data.produto_nome.includes('[TESTE]') || data.produto_nome.includes('Produto Solicitado'))) ||
          (data.solicitante_nome && (data.solicitante_nome.includes('simulado') || data.solicitante_nome.includes('[TESTE]')))
        ) {
          await deleteDoc(doc(db, 'customer_demands', docSnap.id)).catch(() => {});
          deletedCount++;
        }
      }

      // 6. Delete test heat load docs
      const snapHeat = await getDocs(collection(db, 'system_test_heat_load'));
      for (const docSnap of snapHeat.docs) {
        await deleteDoc(doc(db, 'system_test_heat_load', docSnap.id)).catch(() => {});
        deletedCount++;
      }

      // 7. Delete test reports
      const snapReports = await getDocs(collection(db, 'system_test_reports'));
      for (const docSnap of snapReports.docs) {
        await deleteDoc(doc(db, 'system_test_reports', docSnap.id)).catch(() => {});
        deletedCount++;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'purge_bot_data');
    }

    return { deletedCount };
  }

  public async clearAllDataAndResetStock(): Promise<{ message: string }> {
    localStore.clearAllDataAndResetStock();
    await this.purgeAllBotData();

    try {
      // Zero all real product stocks in Firestore
      const snapProds = await getDocs(collection(db, 'products'));
      for (const docSnap of snapProds.docs) {
        await updateDoc(doc(db, 'products', docSnap.id), {
          estoque: 0,
          updated_at: new Date().toISOString()
        }).catch(() => {});
      }

      // Clear all movements in Firestore
      const snapMovs = await getDocs(collection(db, 'movements'));
      for (const docSnap of snapMovs.docs) {
        await deleteDoc(doc(db, 'movements', docSnap.id)).catch(() => {});
      }

      // Clear all demands in Firestore
      const snapDemands = await getDocs(collection(db, 'demands'));
      for (const docSnap of snapDemands.docs) {
        await deleteDoc(doc(db, 'demands', docSnap.id)).catch(() => {});
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'bulk_cleanup');
    }

    return { message: 'Estoque zerado e todas as movimentações e dados do bot foram totalmente limpos!' };
  }

  // --- SYSTEM TEST BOT REPORT PERSISTENCE & REAL STRESS OPERATIONS ---

  public async runDatabaseStressTest(): Promise<{ success: boolean; writeTimeMs: number; readTimeMs: number; deleteTimeMs: number; error?: string }> {
    const tempId = `stress_ping_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tempRef = doc(db, 'system_test_pings', tempId);
    
    try {
      // 1. Write phase
      const wStart = Date.now();
      await setDoc(tempRef, {
        ping: 'BYTECAS_TEST_BOT_PAYLOAD',
        timestamp: new Date().toISOString(),
        payloadSize: 'X'.repeat(500)
      });
      const writeTimeMs = Date.now() - wStart;

      // 2. Read phase
      const rStart = Date.now();
      const snap = await getDoc(tempRef);
      const readTimeMs = Date.now() - rStart;

      if (!snap.exists() || snap.data()?.ping !== 'BYTECAS_TEST_BOT_PAYLOAD') {
        throw new Error('Inconsistência na leitura do documento de teste no Firestore.');
      }

      // 3. Delete phase
      const dStart = Date.now();
      await deleteDoc(tempRef);
      const deleteTimeMs = Date.now() - dStart;

      return { success: true, writeTimeMs, readTimeMs, deleteTimeMs };
    } catch (err: any) {
      // Clean up if left behind
      deleteDoc(tempRef).catch(() => {});
      return {
        success: false,
        writeTimeMs: 0,
        readTimeMs: 0,
        deleteTimeMs: 0,
        error: err?.message || String(err)
      };
    }
  }
}

export const firestoreSync = new FirestoreSyncService();

