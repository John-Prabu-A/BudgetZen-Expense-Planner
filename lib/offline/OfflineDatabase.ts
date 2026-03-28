/**
 * Offline Database Manager
 * Handles all local data persistence using AsyncStorage
 * Provides CRUD operations for transactions and sync queue
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackgroundJob, MessageProcessingEvent, OfflineTransaction, SyncQueueItem } from './types';

const DB_KEYS = {
  TRANSACTIONS: '@budgetzen/transactions',
  SYNC_QUEUE: '@budgetzen/sync_queue',
  BACKGROUND_JOBS: '@budgetzen/background_jobs',
  MESSAGE_EVENTS: '@budgetzen/message_events',
  METADATA: '@budgetzen/metadata',
};

class OfflineDatabase {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure all required keys exist
      const keys = Object.values(DB_KEYS);
      for (const key of keys) {
        const exists = await AsyncStorage.getItem(key);
        if (!exists) {
          await AsyncStorage.setItem(key, JSON.stringify([]));
        }
      }
      this.isInitialized = true;
      console.log('[OfflineDB] Database initialized successfully');
    } catch (error) {
      console.error('[OfflineDB] Initialization failed:', error);
      throw error;
    }
  }

  // ============= TRANSACTION OPERATIONS =============

  async addTransaction(transaction: OfflineTransaction): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      transactions.push(transaction);
      await AsyncStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      console.log('[OfflineDB] Transaction added:', transaction.id);
    } catch (error) {
      console.error('[OfflineDB] Failed to add transaction:', error);
      throw error;
    }
  }

  async getTransactions(): Promise<OfflineTransaction[]> {
    try {
      const data = await AsyncStorage.getItem(DB_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[OfflineDB] Failed to get transactions:', error);
      return [];
    }
  }

  async getTransaction(id: string): Promise<OfflineTransaction | null> {
    try {
      const transactions = await this.getTransactions();
      return transactions.find(t => t.id === id) || null;
    } catch (error) {
      console.error('[OfflineDB] Failed to get transaction:', error);
      return null;
    }
  }

  async updateTransaction(id: string, updates: Partial<OfflineTransaction>): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === id);
      if (index === -1) throw new Error(`Transaction ${id} not found`);

      transactions[index] = { ...transactions[index], ...updates };
      await AsyncStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      console.log('[OfflineDB] Transaction updated:', id);
    } catch (error) {
      console.error('[OfflineDB] Failed to update transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const filtered = transactions.filter(t => t.id !== id);
      await AsyncStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(filtered));
      console.log('[OfflineDB] Transaction deleted:', id);
    } catch (error) {
      console.error('[OfflineDB] Failed to delete transaction:', error);
      throw error;
    }
  }

  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    try {
      const transactions = await this.getTransactions();
      return transactions.filter(t => t.syncStatus === 'pending' || t.syncStatus === 'failed');
    } catch (error) {
      console.error('[OfflineDB] Failed to get pending transactions:', error);
      return [];
    }
  }

  // ============= SYNC QUEUE OPERATIONS =============

  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue.push(item);
      await AsyncStorage.setItem(DB_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      console.log('[OfflineDB] Item added to sync queue:', item.id);
    } catch (error) {
      console.error('[OfflineDB] Failed to add to sync queue:', error);
      throw error;
    }
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(DB_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[OfflineDB] Failed to get sync queue:', error);
      return [];
    }
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const index = queue.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Queue item ${id} not found`);

      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(DB_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('[OfflineDB] Failed to update sync queue item:', error);
      throw error;
    }
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const filtered = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(DB_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
    } catch (error) {
      console.error('[OfflineDB] Failed to remove sync queue item:', error);
      throw error;
    }
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    try {
      const queue = await this.getSyncQueue();
      return queue.filter(item => item.status === 'pending' || item.status === 'failed');
    } catch (error) {
      console.error('[OfflineDB] Failed to get pending sync items:', error);
      return [];
    }
  }

  // ============= BACKGROUND JOB OPERATIONS =============

  async addBackgroundJob(job: BackgroundJob): Promise<void> {
    try {
      const jobs = await this.getBackgroundJobs();
      jobs.push(job);
      await AsyncStorage.setItem(DB_KEYS.BACKGROUND_JOBS, JSON.stringify(jobs));
    } catch (error) {
      console.error('[OfflineDB] Failed to add background job:', error);
      throw error;
    }
  }

  async getBackgroundJobs(): Promise<BackgroundJob[]> {
    try {
      const data = await AsyncStorage.getItem(DB_KEYS.BACKGROUND_JOBS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[OfflineDB] Failed to get background jobs:', error);
      return [];
    }
  }

  async updateBackgroundJob(id: string, updates: Partial<BackgroundJob>): Promise<void> {
    try {
      const jobs = await this.getBackgroundJobs();
      const index = jobs.findIndex(job => job.id === id);
      if (index === -1) throw new Error(`Job ${id} not found`);

      jobs[index] = { ...jobs[index], ...updates };
      await AsyncStorage.setItem(DB_KEYS.BACKGROUND_JOBS, JSON.stringify(jobs));
    } catch (error) {
      console.error('[OfflineDB] Failed to update background job:', error);
      throw error;
    }
  }

  async cleanupOldJobs(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const jobs = await this.getBackgroundJobs();
      const cutoff = Date.now() - olderThanMs;
      const filtered = jobs.filter(job => (job.completedAt || job.scheduledAt) > cutoff);
      await AsyncStorage.setItem(DB_KEYS.BACKGROUND_JOBS, JSON.stringify(filtered));
    } catch (error) {
      console.error('[OfflineDB] Failed to cleanup old jobs:', error);
    }
  }

  // ============= MESSAGE EVENT LOGGING =============

  async logMessageEvent(event: MessageProcessingEvent): Promise<void> {
    try {
      const events = await this.getMessageEvents();
      events.push(event);
      // Keep only last 500 events
      if (events.length > 500) {
        events.splice(0, events.length - 500);
      }
      await AsyncStorage.setItem(DB_KEYS.MESSAGE_EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error('[OfflineDB] Failed to log message event:', error);
    }
  }

  async getMessageEvents(limit?: number): Promise<MessageProcessingEvent[]> {
    try {
      const data = await AsyncStorage.getItem(DB_KEYS.MESSAGE_EVENTS);
      let events = data ? JSON.parse(data) : [];
      if (limit) {
        events = events.slice(-limit);
      }
      return events;
    } catch (error) {
      console.error('[OfflineDB] Failed to get message events:', error);
      return [];
    }
  }

  // ============= METADATA OPERATIONS =============

  async setMetadata(key: string, value: any): Promise<void> {
    try {
      const metadata = await this.getMetadata();
      metadata[key] = value;
      await AsyncStorage.setItem(DB_KEYS.METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('[OfflineDB] Failed to set metadata:', error);
    }
  }

  async getMetadata(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(DB_KEYS.METADATA);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('[OfflineDB] Failed to get metadata:', error);
      return {};
    }
  }

  async getMetadataKey(key: string): Promise<any> {
    try {
      const metadata = await this.getMetadata();
      return metadata[key];
    } catch (error) {
      console.error('[OfflineDB] Failed to get metadata key:', error);
      return null;
    }
  }

  // ============= UTILITY OPERATIONS =============

  async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(DB_KEYS);
      await AsyncStorage.multiRemove(keys);
      console.log('[OfflineDB] All data cleared');
    } catch (error) {
      console.error('[OfflineDB] Failed to clear all data:', error);
      throw error;
    }
  }

  async getStorageStats(): Promise<{
    transactionCount: number;
    queueCount: number;
    jobCount: number;
    eventCount: number;
  }> {
    try {
      const transactions = await this.getTransactions();
      const queue = await this.getSyncQueue();
      const jobs = await this.getBackgroundJobs();
      const events = await this.getMessageEvents();

      return {
        transactionCount: transactions.length,
        queueCount: queue.length,
        jobCount: jobs.length,
        eventCount: events.length,
      };
    } catch (error) {
      console.error('[OfflineDB] Failed to get storage stats:', error);
      return { transactionCount: 0, queueCount: 0, jobCount: 0, eventCount: 0 };
    }
  }
}

export const offlineDatabase = new OfflineDatabase();
