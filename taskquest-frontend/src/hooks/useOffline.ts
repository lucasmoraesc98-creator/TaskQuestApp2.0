import { useState, useEffect } from 'react';
import { OfflineQueueItem, SyncStatus } from '../../../shared/types/pwa.types';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingItems: 0,
    isSyncing: false
  });

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conectado - sincronizando dados...');
      setIsOnline(true);
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      processOfflineQueue();
    };

    const handleOffline = () => {
      console.log('📴 Modo offline ativado');
      setIsOnline(false);
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Carregar fila do IndexedDB
    loadOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineQueue = async () => {
    try {
      const savedQueue = await getOfflineQueueFromDB();
      setQueue(savedQueue);
      setSyncStatus(prev => ({ ...prev, pendingItems: savedQueue.length }));
    } catch (error) {
      console.error('❌ Erro ao carregar fila offline:', error);
    }
  };

  const addToQueue = async (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>) => {
    const newItem: OfflineQueueItem = {
      id: generateId(),
      timestamp: Date.now(),
      retries: 0,
      ...item
    };

    const newQueue = [...queue, newItem];
    setQueue(newQueue);
    setSyncStatus(prev => ({ ...prev, pendingItems: newQueue.length }));
    
    await saveOfflineQueueToDB(newQueue);
  };

  const processOfflineQueue = async () => {
    if (queue.length === 0 || syncStatus.isSyncing) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    console.log(`🔄 Processando ${queue.length} itens da fila offline...`);

    const successful: string[] = [];
    const failed: OfflineQueueItem[] = [];

    for (const item of queue) {
      try {
        await syncItemWithBackend(item);
        successful.push(item.id);
      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${item.id}:`, error);
        
        if (item.retries < 3) {
          // Re-tentar mais tarde
          failed.push({ ...item, retries: item.retries + 1 });
        } else {
          console.warn(`🗑️ Removendo item após 3 tentativas: ${item.id}`);
        }
      }
    }

    // Atualizar fila
    const remainingQueue = failed;
    setQueue(remainingQueue);
    setSyncStatus(prev => ({
      ...prev,
      pendingItems: remainingQueue.length,
      isSyncing: false,
      lastSync: new Date()
    }));

    await saveOfflineQueueToDB(remainingQueue);

    console.log(`✅ ${successful.length} itens sincronizados, ${failed.length} falhas`);
  };

  // Funções auxiliares para IndexedDB
  const getOfflineQueueFromDB = async (): Promise<OfflineQueueItem[]> => {
    // Implementar com IndexedDB
    return [];
  };

  const saveOfflineQueueToDB = async (queue: OfflineQueueItem[]): Promise<void> => {
    // Implementar com IndexedDB
  };

  const syncItemWithBackend = async (item: OfflineQueueItem): Promise<void> => {
    // Implementar sincronização com backend
  };

  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  return {
    isOnline,
    queue,
    syncStatus,
    addToQueue,
    processOfflineQueue,
    getQueueSize: () => queue.length
  };
};