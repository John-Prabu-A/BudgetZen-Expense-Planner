/**
 * Offline-First System Type Definitions
 * Defines all types for offline data storage, sync queues, and background processing
 */

/**
 * Transaction record for offline storage
 */
export interface OfflineTransaction {
  id: string;
  source: 'sms' | 'notification' | 'manual';
  rawMessage: string;
  amount: number;
  type: 'debit' | 'credit' | 'transfer' | 'unknown';
  confidence: number;
  extractedData: {
    amount: number;
    date?: Date;
    account?: string;
    payee?: string;
    reference?: string;
  };
  metadata: {
    timestamp: number;
    phoneNumber?: string;
    sender?: string;
    hasBeenProcessed: boolean;
    processingError?: string;
  };
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncError?: string;
  lastSyncAttempt?: number;
}

/**
 * Sync queue item for batched cloud synchronization
 */
export interface SyncQueueItem {
  id: string;
  transactionId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Partial<OfflineTransaction>;
  createdAt: number;
  attempts: number;
  lastAttemptAt?: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

/**
 * Background job for scheduled processing
 */
export interface BackgroundJob {
  id: string;
  type: 'sync' | 'cleanup' | 'process_queue' | 'check_messages';
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Permission status tracking
 */
export interface PermissionStatus {
  sms: 'granted' | 'denied' | 'not_requested' | 'restricted';
  notifications: 'granted' | 'denied' | 'not_requested' | 'restricted';
  readContacts: 'granted' | 'denied' | 'not_requested' | 'restricted';
  lastRequestedAt?: {
    sms?: number;
    notifications?: number;
    readContacts?: number;
  };
}

/**
 * Offline sync state
 */
export interface OfflineSyncState {
  isOnline: boolean;
  lastSyncAt?: number;
  pendingCount: number;
  failedCount: number;
  syncInProgress: boolean;
}

/**
 * Message processing event
 */
export interface MessageProcessingEvent {
  id: string;
  messageId: string;
  timestamp: number;
  source: 'sms' | 'notification';
  status: 'received' | 'processing' | 'completed' | 'failed';
  result?: {
    amount: number;
    type: string;
    confidence: number;
  };
  error?: string;
}

/**
 * Batch sync payload
 */
export interface BatchSyncPayload {
  transactions: OfflineTransaction[];
  queueItems: SyncQueueItem[];
  timestamp: number;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  timestamp: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

/**
 * App initialization state
 */
export interface AppInitializationState {
  databaseReady: boolean;
  permissionsRequested: boolean;
  backgroundServiceStarted: boolean;
  isSyncing: boolean;
  lastInitAt: number;
}
