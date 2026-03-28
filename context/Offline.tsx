/**
 * Offline System Context
 * React Context for managing offline-first architecture
 * Provides access to all offline services and state
 */

import { backgroundServiceManager } from '@/lib/offline/BackgroundServiceManager';
import { offlineDatabase } from '@/lib/offline/OfflineDatabase';
import { offlineTransactionProcessingService } from '@/lib/offline/OfflineTransactionProcessingService';
import { permissionManager } from '@/lib/offline/PermissionManager';
import { syncManager } from '@/lib/offline/SyncManager';
import { OfflineSyncState, OfflineTransaction, PermissionStatus } from '@/lib/offline/types';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface OfflineContextType {
  // Permissions
  permissions: PermissionStatus;
  requestPermissions: () => Promise<void>;
  hasPermission: (type: 'sms' | 'notifications' | 'contacts') => boolean;

  // Transactions
  transactions: OfflineTransaction[];
  processMessage: (message: string, source?: 'sms' | 'notification') => Promise<void>;
  getTransactions: (filter?: any) => Promise<OfflineTransaction[]>;
  getStatistics: () => Promise<any>;

  // Sync
  syncStatus: OfflineSyncState;
  syncNow: () => Promise<void>;
  isSyncing: boolean;

  // Background service
  backgroundServiceStatus: any;
  startBackgroundService: () => Promise<void>;
  stopBackgroundService: () => Promise<void>;

  // Storage
  storageStats: {
    transactionCount: number;
    queueCount: number;
    jobCount: number;
    eventCount: number;
  };
  clearAllData: () => Promise<void>;

  // Initialization
  isInitialized: boolean;
  isInitializing: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [permissions, setPermissions] = useState<PermissionStatus>({
    sms: 'not_requested',
    notifications: 'not_requested',
    readContacts: 'not_requested',
  });
  const [transactions, setTransactions] = useState<OfflineTransaction[]>([]);
  const [syncStatus, setSyncStatus] = useState<OfflineSyncState>({
    isOnline: true,
    pendingCount: 0,
    failedCount: 0,
    syncInProgress: false,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [backgroundServiceStatus, setBackgroundServiceStatus] = useState<any>(null);
  const [storageStats, setStorageStats] = useState({
    transactionCount: 0,
    queueCount: 0,
    jobCount: 0,
    eventCount: 0,
  });

  // Initialize offline system on mount
  useEffect(() => {
    initializeOfflineSystem();
  }, []);

  const initializeOfflineSystem = async () => {
    try {
      setIsInitializing(true);
      console.log('[OfflineContext] Initializing offline system');

      // Initialize database
      await offlineDatabase.initialize();

      // Initialize permission manager
      await permissionManager.initialize();

      // Get initial permissions
      const initialPermissions = await permissionManager.getPermissionStatus();
      setPermissions(initialPermissions);

      // Initialize background service
      await backgroundServiceManager.initialize();

      // Initialize transaction processing service
      await offlineTransactionProcessingService.initialize();

      // Load initial data
      await refreshTransactions();
      await refreshSyncStatus();
      await refreshStorageStats();

      setIsInitialized(true);
      console.log('[OfflineContext] Offline system initialized successfully');
    } catch (error) {
      console.error('[OfflineContext] Initialization failed:', error);
      setIsInitialized(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const requestPermissions = async () => {
    try {
      console.log('[OfflineContext] Requesting permissions');
      const result = await permissionManager.requestAllPermissions();
      const updated = await permissionManager.getPermissionStatus();
      setPermissions(updated);
      console.log('[OfflineContext] Permissions result:', result);
    } catch (error) {
      console.error('[OfflineContext] Failed to request permissions:', error);
    }
  };

  const hasPermission = (type: 'sms' | 'notifications' | 'contacts'): boolean => {
    const mapping = {
      sms: permissions.sms,
      notifications: permissions.notifications,
      contacts: permissions.readContacts,
    };
    return mapping[type] === 'granted';
  };

  const processMessage = async (message: string, source: 'sms' | 'notification' = 'sms') => {
    try {
      console.log('[OfflineContext] Processing message');
      await offlineTransactionProcessingService.processMessage(message, source);
      await refreshTransactions();
      await refreshSyncStatus();
      await refreshStorageStats();
    } catch (error) {
      console.error('[OfflineContext] Failed to process message:', error);
    }
  };

  const getTransactions = async (filter?: any): Promise<OfflineTransaction[]> => {
    try {
      return await offlineTransactionProcessingService.getOfflineTransactions(filter);
    } catch (error) {
      console.error('[OfflineContext] Failed to get transactions:', error);
      return [];
    }
  };

  const getStatistics = async () => {
    try {
      return await offlineTransactionProcessingService.getStatistics();
    } catch (error) {
      console.error('[OfflineContext] Failed to get statistics:', error);
      return null;
    }
  };

  const syncNow = async () => {
    try {
      setIsSyncing(true);
      console.log('[OfflineContext] Starting sync');
      const result = await syncManager.sync();
      console.log('[OfflineContext] Sync result:', result);
      await refreshSyncStatus();
      await refreshTransactions();
    } catch (error) {
      console.error('[OfflineContext] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const startBackgroundService = async () => {
    try {
      console.log('[OfflineContext] Starting background service');
      await backgroundServiceManager.initialize();
      const status = await backgroundServiceManager.getStatus();
      setBackgroundServiceStatus(status);
    } catch (error) {
      console.error('[OfflineContext] Failed to start background service:', error);
    }
  };

  const stopBackgroundService = async () => {
    try {
      console.log('[OfflineContext] Stopping background service');
      await backgroundServiceManager.shutdown();
      setBackgroundServiceStatus(null);
    } catch (error) {
      console.error('[OfflineContext] Failed to stop background service:', error);
    }
  };

  const clearAllData = async () => {
    try {
      console.log('[OfflineContext] Clearing all data');
      await offlineTransactionProcessingService.clearAllData();
      await refreshTransactions();
      await refreshSyncStatus();
      await refreshStorageStats();
    } catch (error) {
      console.error('[OfflineContext] Failed to clear data:', error);
    }
  };

  const refreshTransactions = async () => {
    try {
      const trans = await offlineTransactionProcessingService.getOfflineTransactions();
      setTransactions(trans);
    } catch (error) {
      console.error('[OfflineContext] Failed to refresh transactions:', error);
    }
  };

  const refreshSyncStatus = async () => {
    try {
      const stats = await offlineTransactionProcessingService.getSyncStatus();
      setSyncStatus({
        isOnline: true,
        pendingCount: stats.pending,
        failedCount: stats.failed,
        syncInProgress: isSyncing,
        lastSyncAt: stats.lastSyncAt,
      });
    } catch (error) {
      console.error('[OfflineContext] Failed to refresh sync status:', error);
    }
  };

  const refreshStorageStats = async () => {
    try {
      const stats = await offlineTransactionProcessingService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('[OfflineContext] Failed to refresh storage stats:', error);
    }
  };

  const value: OfflineContextType = {
    permissions,
    requestPermissions,
    hasPermission,
    transactions,
    processMessage,
    getTransactions,
    getStatistics,
    syncStatus,
    syncNow,
    isSyncing,
    backgroundServiceStatus,
    startBackgroundService,
    stopBackgroundService,
    storageStats,
    clearAllData,
    isInitialized,
    isInitializing,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};
