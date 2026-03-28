/**
 * Sync Manager
 * Handles offline queue processing and Supabase synchronization
 * Implements exponential backoff and batching strategies
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { offlineDatabase } from './OfflineDatabase';
import { OfflineTransaction, SyncQueueItem, SyncResult } from './types';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
);

const MAX_SYNC_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 60000;
const BATCH_SIZE = 25;

class SyncManager {
  private isSyncing = false;
  private syncTimeoutId: NodeJS.Timeout | null = null;

  /**
   * Calculate exponential backoff delay
   */
  private getBackoffDelay(attempts: number): number {
    const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempts - 1), MAX_BACKOFF_MS);
    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.max(delay + jitter, 0);
  }

  /**
   * Main sync operation - syncs all pending items in batches
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress, skipping');
      return { success: false, synced: 0, failed: 0, timestamp: Date.now() };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    let synced = 0;
    let failed = 0;
    const errors: Array<{ id: string; error: string }> = [];

    try {
      console.log('[SyncManager] Starting sync operation');

      const pendingItems = await offlineDatabase.getPendingSyncItems();
      console.log(`[SyncManager] Found ${pendingItems.length} pending items`);

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        return { success: true, synced: 0, failed: 0, timestamp: Date.now() };
      }

      // Process in batches
      for (let i = 0; i < pendingItems.length; i += BATCH_SIZE) {
        const batch = pendingItems.slice(i, i + BATCH_SIZE);
        const batchResult = await this.processBatch(batch);

        synced += batchResult.synced;
        failed += batchResult.failed;
        errors.push(...batchResult.errors);
      }

      // Log sync result
      await offlineDatabase.setMetadata('lastSyncAt', Date.now());
      await offlineDatabase.setMetadata('lastSyncResult', {
        synced,
        failed,
        duration: Date.now() - startTime,
      });

      console.log(
        `[SyncManager] Sync completed. Synced: ${synced}, Failed: ${failed}, Duration: ${Date.now() - startTime}ms`
      );

      return {
        success: failed === 0,
        synced,
        failed,
        timestamp: Date.now(),
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('[SyncManager] Sync operation failed:', error);
      return {
        success: false,
        synced,
        failed,
        timestamp: Date.now(),
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a batch of sync queue items
   */
  private async processBatch(
    items: SyncQueueItem[]
  ): Promise<{
    synced: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const results = { synced: 0, failed: 0, errors: [] as Array<{ id: string; error: string }> };

    for (const item of items) {
      try {
        // Check retry limits
        if (item.attempts >= MAX_SYNC_ATTEMPTS) {
          await offlineDatabase.updateSyncQueueItem(item.id, {
            status: 'failed',
            lastError: 'Max retry attempts exceeded',
          });
          results.failed++;
          results.errors.push({ id: item.id, error: 'Max retry attempts exceeded' });
          continue;
        }

        // Check backoff timing
        const delay = this.getBackoffDelay(item.attempts);
        const timeSinceLastAttempt = Date.now() - (item.lastAttemptAt || 0);
        if (timeSinceLastAttempt < delay) {
          console.log(`[SyncManager] Skipping ${item.id} - backoff period not elapsed`);
          continue;
        }

        // Update status to syncing
        await offlineDatabase.updateSyncQueueItem(item.id, {
          status: 'syncing',
          lastAttemptAt: Date.now(),
        });

        // Perform the sync operation
        const success = await this.syncItem(item);

        if (success) {
          // Mark as completed
          await offlineDatabase.updateSyncQueueItem(item.id, {
            status: 'completed',
          });

          // Update transaction sync status
          const transaction = await offlineDatabase.getTransaction(item.transactionId);
          if (transaction) {
            await offlineDatabase.updateTransaction(item.transactionId, {
              syncStatus: 'synced',
              syncAttempts: item.attempts + 1,
            });
          }

          results.synced++;
        } else {
          // Mark as failed
          await offlineDatabase.updateSyncQueueItem(item.id, {
            status: 'failed',
            attempts: item.attempts + 1,
            lastError: 'Sync operation failed',
          });
          results.failed++;
          results.errors.push({ id: item.id, error: 'Sync operation failed' });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await offlineDatabase.updateSyncQueueItem(item.id, {
          status: 'failed',
          attempts: item.attempts + 1,
          lastError: errorMsg,
        });
        results.failed++;
        results.errors.push({ id: item.id, error: errorMsg });
      }
    }

    return results;
  }

  /**
   * Sync a single item to Supabase
   */
  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    try {
      const transaction = await offlineDatabase.getTransaction(item.transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (item.operation === 'create') {
        return await this.createInSupabase(transaction);
      } else if (item.operation === 'update') {
        return await this.updateInSupabase(transaction);
      } else if (item.operation === 'delete') {
        return await this.deleteInSupabase(transaction);
      }

      return false;
    } catch (error) {
      console.error('[SyncManager] Failed to sync item:', error);
      return false;
    }
  }

  /**
   * Create transaction in Supabase
   */
  private async createInSupabase(transaction: OfflineTransaction): Promise<boolean> {
    try {
      const { error } = await supabase.from('records').insert([
        {
          id: transaction.id,
          raw_message: transaction.rawMessage,
          amount: transaction.amount,
          type: transaction.type,
          confidence: transaction.confidence,
          extracted_data: JSON.stringify(transaction.extractedData),
          metadata: JSON.stringify(transaction.metadata),
          source: transaction.source,
          created_at: new Date(transaction.metadata.timestamp).toISOString(),
        },
      ]);

      if (error) {
        console.error('[SyncManager] Supabase insert error:', error);
        return false;
      }

      console.log('[SyncManager] Transaction created in Supabase:', transaction.id);
      return true;
    } catch (error) {
      console.error('[SyncManager] Failed to create transaction in Supabase:', error);
      return false;
    }
  }

  /**
   * Update transaction in Supabase
   */
  private async updateInSupabase(transaction: OfflineTransaction): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('records')
        .update({
          raw_message: transaction.rawMessage,
          amount: transaction.amount,
          type: transaction.type,
          confidence: transaction.confidence,
          extracted_data: JSON.stringify(transaction.extractedData),
          metadata: JSON.stringify(transaction.metadata),
        })
        .eq('id', transaction.id);

      if (error) {
        console.error('[SyncManager] Supabase update error:', error);
        return false;
      }

      console.log('[SyncManager] Transaction updated in Supabase:', transaction.id);
      return true;
    } catch (error) {
      console.error('[SyncManager] Failed to update transaction in Supabase:', error);
      return false;
    }
  }

  /**
   * Delete transaction in Supabase
   */
  private async deleteInSupabase(transaction: OfflineTransaction): Promise<boolean> {
    try {
      const { error } = await supabase.from('records').delete().eq('id', transaction.id);

      if (error) {
        console.error('[SyncManager] Supabase delete error:', error);
        return false;
      }

      console.log('[SyncManager] Transaction deleted in Supabase:', transaction.id);
      return true;
    } catch (error) {
      console.error('[SyncManager] Failed to delete transaction in Supabase:', error);
      return false;
    }
  }

  /**
   * Schedule a sync operation
   */
  scheduleSyncAfter(delayMs: number = 5000): void {
    if (this.syncTimeoutId) {
      clearTimeout(this.syncTimeoutId);
    }

    this.syncTimeoutId = setTimeout(() => {
      this.sync().catch(error => {
        console.error('[SyncManager] Scheduled sync failed:', error);
      });
    }, delayMs) as any;
  }

  /**
   * Cancel scheduled sync
   */
  cancelScheduledSync(): void {
    if (this.syncTimeoutId) {
      clearTimeout(this.syncTimeoutId);
      this.syncTimeoutId = null;
    }
  }

  /**
   * Get current sync status
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Queue a transaction for sync
   */
  async queueTransaction(
    transaction: OfflineTransaction,
    operation: 'create' | 'update' | 'delete' = 'create'
  ): Promise<void> {
    try {
      const queueItem: SyncQueueItem = {
        id: uuidv4(),
        transactionId: transaction.id,
        operation,
        payload: transaction,
        createdAt: Date.now(),
        attempts: 0,
        status: 'pending',
      };

      await offlineDatabase.addToSyncQueue(queueItem);
      console.log('[SyncManager] Transaction queued for sync:', transaction.id);

      // Schedule sync
      this.scheduleSyncAfter();
    } catch (error) {
      console.error('[SyncManager] Failed to queue transaction:', error);
      throw error;
    }
  }

  /**
   * Get statistics about pending syncs
   */
  async getSyncStats(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    completed: number;
  }> {
    try {
      const queue = await offlineDatabase.getSyncQueue();
      return {
        pending: queue.filter(item => item.status === 'pending').length,
        syncing: queue.filter(item => item.status === 'syncing').length,
        failed: queue.filter(item => item.status === 'failed').length,
        completed: queue.filter(item => item.status === 'completed').length,
      };
    } catch (error) {
      console.error('[SyncManager] Failed to get sync stats:', error);
      return { pending: 0, syncing: 0, failed: 0, completed: 0 };
    }
  }
}

export const syncManager = new SyncManager();
