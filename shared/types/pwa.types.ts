export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  data?: {
    url: string;
    taskId?: string;
    type: 'reminder' | 'achievement' | 'motivation';
  };
}

export interface OfflineQueueItem {
  id: string;
  type: 'CREATE_TASK' | 'UPDATE_TASK' | 'COMPLETE_TASK' | 'DELETE_TASK';
  data: any;
  timestamp: number;
  retries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingItems: number;
  isSyncing: boolean;
}