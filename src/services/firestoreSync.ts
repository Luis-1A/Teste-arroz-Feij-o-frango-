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
import { Product, Category, Movement, AuditLog, CustomerDemand, POSConfig, StockDivergenceRecord, User } from '../types';

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

export interface ProductExchangeParams {
  itemReturned: {
    productId: string;
    quantity: number;
    returnToStock: boolean;
    motivoDevolucao?: string;
  };
  itemTaken: {
    productId: string;
    quantity: number;
  };
  user: {
    id: string;
    nome: string;
  };
  observacao?: string;
}

// Global subscribers
type Listener<T> = (data: T) => void;

class FirestoreSyncService {
  private productsListeners: Listener<Product[]>[] = [];
  private movementsListeners: Listener<Movement[]>[] = [];
  private configListeners: Listener<POSConfig>[] = [];
  private categoriesListeners: Listener<Category[]>[] = [];
  private demandsListeners: Listener<CustomerDemand[]>[] = [];
  private divergencesListeners: Listener<StockDivergenceRecord[]>[] = [];
  private usersListeners: Listener<User[]>[] = [];
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
            localStore.saveProductsToLocal([]);
            this.notifyProducts([]);
          } else {
            const products: Product[] = [];
            for (const docSnap of snapshot.docs) {
              const p = { id: docSnap.id, ...docSnap.data() } as Product;
              if (p.excluir_ao_zerar && p.estoque <= 0) {
                deleteDoc(doc(db, 'products', p.id)).catch(() => {});
              } else {
                products.push(p);
              }
            }
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
            localStore.saveCategoriesToLocal([]);
            this.notifyCategories([]);
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
              !d.produto_nome || (!d.produto_nome.includes('[BOT_TEST]') && !d.produto_nome.includes('Produto Solicitado'))
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

    // 5b. Sync Stock Divergences
    try {
      const divsRef = collection(db, 'divergences');
      onSnapshot(
        divsRef,
        (snapshot) => {
          const divergences: StockDivergenceRecord[] = [];
          snapshot.forEach((docSnap) => {
            const div = { id: docSnap.id, ...docSnap.data() } as StockDivergenceRecord;
            divergences.push(div);
          });
          divergences.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          localStore.saveDivergencesToLocal(divergences);
          this.notifyDivergences(divergences);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'divergences')
      );
    } catch (e) {
      console.warn('Failed to attach Divergences listener', e);
    }

    // 5c. Sync Users
    try {
      const usersRef = collection(db, 'users');
      onSnapshot(
        usersRef,
        async (snapshot) => {
          if (snapshot.empty) {
            const initialUsers = localStore.getUsersList();
            for (const u of initialUsers) {
              await setDoc(doc(db, 'users', u.id), u).catch(() => {});
            }
          } else {
            const usersList: User[] = [];
            snapshot.forEach((docSnap) => {
              usersList.push({ id: docSnap.id, ...docSnap.data() } as User);
            });
            localStore.saveUsersToLocal(usersList);
            this.notifyUsers(usersList);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'users')
      );
    } catch (e) {
      console.warn('Failed to attach Users listener', e);
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

  public subscribeDivergences(cb: Listener<StockDivergenceRecord[]>): () => void {
    this.divergencesListeners.push(cb);
    cb(localStore.getDivergences());
    return () => {
      this.divergencesListeners = this.divergencesListeners.filter((l) => l !== cb);
    };
  }

  public subscribeUsers(cb: Listener<User[]>): () => void {
    this.usersListeners.push(cb);
    cb(localStore.getUsersList());
    return () => {
      this.usersListeners = this.usersListeners.filter((l) => l !== cb);
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
  private notifyDivergences(data: StockDivergenceRecord[]) {
    this.divergencesListeners.forEach((l) => l(data));
  }
  private notifyUsers(data: User[]) {
    this.usersListeners.forEach((l) => l(data));
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

  public async saveDashboardLayout(userId: string, layout: string[]): Promise<void> {
    const cleanId = userId || 'default';
    localStore.saveDashboardLayout(cleanId, layout);
    try {
      const layoutRef = doc(db, 'user_layouts', cleanId);
      await setDoc(layoutRef, { layout, updated_at: new Date().toISOString() }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `user_layouts/${cleanId}`);
    }
  }

  public async loadDashboardLayout(userId: string): Promise<string[]> {
    const cleanId = userId || 'default';
    const local = localStore.getDashboardLayout(cleanId);
    try {
      const layoutRef = doc(db, 'user_layouts', cleanId);
      const snap = await getDoc(layoutRef);
      if (snap.exists() && snap.data()?.layout) {
        const remoteLayout = snap.data().layout as string[];
        localStore.saveDashboardLayout(cleanId, remoteLayout);
        return remoteLayout;
      }
    } catch (e) {
      // fallback to local
    }
    return local || ['card_header', 'card_stats', 'card_shortcuts', 'card_alerts', 'card_restock', 'card_activities'];
  }

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
      let product = localStore.getProductById(item.productId);
      if (!product) {
        const allLocal = localStore.getProducts();
        product = allLocal.find(p => p.id === item.productId || p.codigo === item.productId) || null;
      }
      if (!product) {
        console.warn(`Produto com ID/código ${item.productId} não foi encontrado no estoque.`);
        continue;
      }

      const newQty = product.estoque - item.quantity;

      // 1. Update product in Firestore
      try {
        await setDoc(doc(db, 'products', product.id), {
          estoque: newQty,
          updated_at: nowIso
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
      }

      // 2. Manage Divergence document in Firestore if stock becomes negative
      if (newQty < 0) {
        const divDocRef = doc(db, 'divergences', `div_${product.id}`);
        const divData: StockDivergenceRecord = {
          id: `div_${product.id}`,
          produto_id: product.id,
          produto_nome: product.nome,
          categoria: product.categoria,
          estoque_no_momento: newQty,
          estoque_atual: newQty,
          data_primeira_divergencia: nowIso,
          usuario_id: user.id,
          usuario_nome: user.nome,
          status: 'Aberta',
          created_at: nowIso,
          updated_at: nowIso
        };
        try {
          await setDoc(divDocRef, divData, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `divergences/div_${product.id}`);
        }
      } else {
        const divDocRef = doc(db, 'divergences', `div_${product.id}`);
        try {
          await setDoc(divDocRef, {
            status: 'Corrigida',
            estoque_atual: newQty,
            data_correcao: nowIso,
            updated_at: nowIso
          }, { merge: true });
        } catch (err) {
          // Ignored if non-existent
        }
      }

      // 3. Create Movement in Firestore
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

      // Update localStore product directly with exact newQty (preventing double subtraction)
      if (product.excluir_ao_zerar && newQty <= 0) {
        localStore.deleteProduct(product.id);
        deleteDoc(doc(db, 'products', product.id)).catch(() => {});
      } else {
        localStore.updateProduct(product.id, { estoque: newQty });
      }

      // Save movement to localStore movements list without subtracting stock a second time
      const localMovs = localStore.getMovements();
      if (!localMovs.some(m => m.id === newMovement.id)) {
        localMovs.unshift(newMovement);
        localStore.saveMovementsToLocal(localMovs);
      }
    }
    this.notifyProducts(localStore.getProducts());
    this.notifyMovements(localStore.getMovements());
    this.notifyDivergences(localStore.getDivergences());
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
      await setDoc(doc(db, 'products', productId), {
        estoque: newStock,
        updated_at: nowIso
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }

    if (newStock >= 0) {
      const divDocRef = doc(db, 'divergences', `div_${productId}`);
      try {
        await setDoc(divDocRef, {
          status: 'Corrigida',
          estoque_atual: newStock,
          data_correcao: nowIso,
          updated_at: nowIso
        }, { merge: true });
      } catch (e) {
        // Ignored
      }
    } else {
      const divDocRef = doc(db, 'divergences', `div_${productId}`);
      try {
        await setDoc(divDocRef, {
          id: `div_${productId}`,
          produto_id: productId,
          produto_nome: product.nome,
          categoria: product.categoria,
          estoque_no_momento: newStock,
          estoque_atual: newStock,
          data_primeira_divergencia: nowIso,
          usuario_id: user.id,
          usuario_nome: user.nome,
          status: 'Aberta',
          created_at: nowIso,
          updated_at: nowIso
        }, { merge: true });
      } catch (e) {
        // Ignored
      }
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
    
    // Auto-delete if zero and excluir_ao_zerar is true
    if (product.excluir_ao_zerar && newStock <= 0) {
      localStore.deleteProduct(productId);
      try {
        await deleteDoc(doc(db, 'products', productId)).catch(async () => {
          await updateDoc(doc(db, 'products', productId), { ativo: false, updated_at: nowIso });
        });
      } catch (e) {}
    }

    const localMovs = localStore.getMovements();
    if (!localMovs.some(m => m.id === newMovement.id)) {
      localMovs.unshift(newMovement);
      localStore.saveMovementsToLocal(localMovs);
    }
    this.notifyProducts(localStore.getProducts());
    this.notifyMovements(localStore.getMovements());
    this.notifyDivergences(localStore.getDivergences());
    return updatedProd;
  }


  public async createProduct(productData: Omit<Product, 'id' | 'ativo' | 'created_at' | 'updated_at'>): Promise<Product> {
    const newProd = localStore.createProduct(productData);
    this.notifyProducts(localStore.getProducts());
    try {
      await setDoc(doc(db, 'products', newProd.id), newProd, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${newProd.id}`);
    }
    return newProd;
  }

  public async createProductBatch(items: Omit<Product, 'id' | 'ativo' | 'created_at' | 'updated_at'>[]): Promise<Product[]> {
    const createdList: Product[] = [];
    for (const item of items) {
      const newProd = localStore.createProduct(item);
      createdList.push(newProd);
      try {
        await setDoc(doc(db, 'products', newProd.id), newProd, { merge: true });
      } catch (e) {}
    }
    this.notifyProducts(localStore.getProducts());
    return createdList;
  }

  public async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const updated = localStore.updateProduct(id, productData);
    if (updated.excluir_ao_zerar && updated.estoque <= 0) {
      localStore.deleteProduct(id);
      this.notifyProducts(localStore.getProducts());
      try {
        await deleteDoc(doc(db, 'products', id)).catch(async () => {
          await updateDoc(doc(db, 'products', id), { ativo: false, updated_at: new Date().toISOString() });
        });
      } catch (e) {}
    } else {
      this.notifyProducts(localStore.getProducts());
      try {
        await setDoc(doc(db, 'products', id), {
          ...productData,
          updated_at: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
      }
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

  public async registerProductExchange(params: ProductExchangeParams) {
    const { itemReturned, itemTaken, user, observacao } = params;

    // VALIDAÇÃO 1: Verificar se o produto devolvido e o produto levado existem no cadastro do sistema
    const returnedProd = localStore.getProductById(itemReturned.productId);
    const takenProd = localStore.getProductById(itemTaken.productId);

    if (!returnedProd || !returnedProd.ativo) {
      throw new Error('Validação 1 Falhou: O produto devolvido não existe ou está inativo no cadastro do sistema.');
    }
    if (!takenProd || !takenProd.ativo) {
      throw new Error('Validação 1 Falhou: O produto a ser entregue não existe ou está inativo no cadastro do sistema.');
    }

    if (takenProd.estoque < itemTaken.quantity) {
      throw new Error(
        `Validação 1 Falhou: Estoque insuficiente do produto entregue "${takenProd.nome}". Disponível: ${takenProd.estoque} UN.`
      );
    }

    const exchangeId = `exc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    // VALIDAÇÃO 2: Preparar e verificar o registro correto de ambas as movimentações (entrada e saída) no histórico
    const movReturned: Movement = {
      id: `mov_${Date.now()}_ret`,
      produto_id: returnedProd.id,
      produto_nome: returnedProd.nome,
      produto_codigo: returnedProd.codigo || returnedProd.id,
      usuario_id: user.id,
      usuario_nome: user.nome,
      tipo: itemReturned.returnToStock ? 'entrada' : 'saida',
      quantidade: itemReturned.quantity,
      observacao: itemReturned.returnToStock
        ? `[TROCA / DEVOLUÇÃO PRO ESTOQUE] Item devolvido em troca (${exchangeId}). Motivo: ${itemReturned.motivoDevolucao || 'Troca de produto'}. ${observacao || ''}`.trim()
        : `[TROCA / AVARIA - FORA DO ESTOQUE] Devolvido pelo cliente sem retorno ao estoque vendável (${exchangeId}). Motivo: ${itemReturned.motivoDevolucao || 'Defeito/Avaria'}. ${observacao || ''}`.trim(),
      created_at: nowIso
    };

    const movTaken: Movement = {
      id: `mov_${Date.now()}_tak`,
      produto_id: takenProd.id,
      produto_nome: takenProd.nome,
      produto_codigo: takenProd.codigo || takenProd.id,
      usuario_id: user.id,
      usuario_nome: user.nome,
      tipo: 'saida',
      quantidade: itemTaken.quantity,
      observacao: `[TROCA / SAÍDA] Produto levado em troca pelo item ${returnedProd.nome} (${exchangeId}). ${observacao || ''}`.trim(),
      created_at: nowIso
    };

    if (!movReturned.produto_id || !movTaken.produto_id || movReturned.quantidade <= 0 || movTaken.quantidade <= 0) {
      throw new Error('Validação 2 Falhou: Inconsistência nos dados das movimentações de entrada e saída.');
    }

    // Process Returned Product Stock Update
    const newReturnedStock = itemReturned.returnToStock
      ? returnedProd.estoque + itemReturned.quantity
      : returnedProd.estoque;

    localStore.updateProduct(returnedProd.id, { estoque: newReturnedStock });

    try {
      if (itemReturned.returnToStock) {
        await updateDoc(doc(db, 'products', returnedProd.id), {
          estoque: newReturnedStock,
          updated_at: nowIso
        });
      }
      await setDoc(doc(db, 'movements', movReturned.id), movReturned);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `movements/${movReturned.id}`);
    }

    // Process Taken Product Stock Update
    const newTakenStock = Math.max(0, takenProd.estoque - itemTaken.quantity);
    localStore.updateProduct(takenProd.id, { estoque: newTakenStock });

    try {
      await updateDoc(doc(db, 'products', takenProd.id), {
        estoque: newTakenStock,
        updated_at: nowIso
      });
      await setDoc(doc(db, 'movements', movTaken.id), movTaken);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `movements/${movTaken.id}`);
    }

    // VALIDAÇÃO 3: Confirmar que o estoque foi atualizado e sincronizado para ambos os produtos
    const updatedReturnedInLocal = localStore.getProductById(returnedProd.id);
    const updatedTakenInLocal = localStore.getProductById(takenProd.id);

    if (itemReturned.returnToStock && updatedReturnedInLocal?.estoque !== newReturnedStock) {
      throw new Error('Validação 3 Falhou: O estoque do produto devolvido não foi atualizado corretamente.');
    }
    if (updatedTakenInLocal?.estoque !== newTakenStock) {
      throw new Error('Validação 3 Falhou: O estoque do produto entregue não foi atualizado corretamente.');
    }

    // Sincronizar em tempo real com todos os dispositivos
    this.notifyProducts(localStore.getProducts());
    this.notifyMovements(localStore.getMovements());

    return {
      exchangeId,
      returnedProduct: returnedProd,
      takenProduct: takenProd,
      validationsPassed: { v1: true, v2: true, v3: true }
    };
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

  public async deleteCustomerDemand(id: string): Promise<{ message: string }> {
    const res = localStore.deleteCustomerDemand(id);
    this.notifyDemands(localStore.getDemands());
    try {
      await deleteDoc(doc(db, 'demands', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `demands/${id}`);
    }
    return res;
  }

  public async restoreProductFromRecycleBin(id: string, userName: string): Promise<Product | null> {
    const prod = localStore.restoreFromRecycleBin(id, userName);
    this.notifyProducts(localStore.getProducts());
    try {
      await updateDoc(doc(db, 'products', id), {
        lixeira: false,
        lixeira_data: null,
        alterado_por: userName,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
    return prod;
  }

  public async purgeProductFromRecycleBin(id: string, userName: string): Promise<void> {
    localStore.purgeFromRecycleBin(id, userName);
    this.notifyProducts(localStore.getProducts());
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  }

  public async createUser(userData: { nome: string; email: string; senha: string; cargo: string }): Promise<User> {
    const newUser = localStore.createUser(userData);
    this.notifyUsers(localStore.getUsersList());
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${newUser.id}`);
    }
    return newUser;
  }

  public async updateUser(id: string, userData: Partial<User & { senha?: string }>): Promise<User> {
    const updated = localStore.updateUser(id, userData);
    this.notifyUsers(localStore.getUsersList());
    try {
      await updateDoc(doc(db, 'users', id), {
        ...userData,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
    return updated;
  }

  public async deleteUser(id: string): Promise<{ message: string }> {
    const result = localStore.deleteUser(id);
    this.notifyUsers(localStore.getUsersList());
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

  public async createCategory(nome: string, cor?: string, icone?: string, descricao?: string): Promise<Category> {
    const newCat = localStore.createCategory(nome, cor, icone, descricao);
    this.notifyCategories(localStore.getCategories());
    try {
      await setDoc(doc(db, 'categories', newCat.id), newCat, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${newCat.id}`);
    }
    return newCat;
  }

  public async updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
    const updated = localStore.updateCategory(id, data);
    this.notifyCategories(localStore.getCategories());
    if (updated) {
      try {
        await setDoc(doc(db, 'categories', id), updated, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `categories/${id}`);
      }
    }
    return updated;
  }

  public async deleteCategory(id: string): Promise<{ message: string }> {
    const res = localStore.deleteCategory(id);
    this.notifyCategories(localStore.getCategories());
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
          data.marca === 'Facilitando Meu Trabalho TestLab' ||
          data.marca === 'Bosteca TestLab' ||
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

  public async seedTestProductsList(userName: string = 'Sistema'): Promise<number> {
    const count = localStore.seedTestProductsList(userName);
    const products = localStore.getProducts();
    const categories = localStore.getCategories();

    for (const cat of categories) {
      await setDoc(doc(db, 'categories', cat.id), cat, { merge: true }).catch(() => {});
    }

    for (const prod of products) {
      await setDoc(doc(db, 'products', prod.id), prod, { merge: true }).catch(() => {});
    }

    this.notifyCategories(categories);
    this.notifyProducts(products);
    return count;
  }

  public async clearAllTestData(): Promise<void> {
    localStore.clearAllTestData();
    const collectionsToPurge = ['products', 'categories', 'movements', 'demands', 'divergences', 'history', 'announcements', 'calendar', 'goals', 'audit_sessions'];
    for (const colName of collectionsToPurge) {
      try {
        const colRef = collection(db, colName);
        const snap = await getDocs(colRef);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, colName, d.id)).catch(() => {});
        }
      } catch (e) {
        console.warn(`Failed to purge Firestore collection ${colName}`, e);
      }
    }
    this.notifyProducts([]);
    this.notifyCategories([]);
    this.notifyMovements([]);
    this.notifyDemands([]);
    this.notifyDivergences([]);
    localStorage.setItem('bytecas_firestore_purged_v3', 'true');
  }
}

export const firestoreSync = new FirestoreSyncService();

// Trigger background purge of test data for real tests
if (typeof window !== 'undefined' && localStorage.getItem('bytecas_firestore_purged_v3') !== 'true') {
  firestoreSync.clearAllTestData().catch((e) => console.warn('Background Firestore purge error:', e));
}

