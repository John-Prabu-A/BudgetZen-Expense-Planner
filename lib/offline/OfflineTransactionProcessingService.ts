/**
 * Offline Transaction Processing Service
 * Integrates transaction detection with offline-first storage
 * Handles message processing, storage, and sync
 */

import { v4 as uuidv4 } from 'uuid';
import { TransactionProcessingPipeline } from '../transactionDetection/TransactionProcessingPipeline';
import { AmountExtractionEngine } from '../transactionDetection/engines/AmountExtractionEngine';
import { IntentClassificationEngine } from '../transactionDetection/engines/IntentClassificationEngine';
import { offlineDatabase } from './OfflineDatabase';
import { syncManager } from './SyncManager';
import { MessageProcessingEvent, OfflineTransaction } from './types';

class OfflineTransactionProcessingService {
  private amountEngine = new AmountExtractionEngine();
  private intentEngine = new IntentClassificationEngine();
  private pipeline: TransactionProcessingPipeline | null = null;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      await offlineDatabase.initialize();
      console.log('[OfflineTransactionProcessing] Service initialized');
    } catch (error) {
      console.error('[OfflineTransactionProcessing] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process a message (SMS or notification)
   * Detects transaction info and stores offline
   * Uses direct engine processing (no database record creation)
   */
  async processMessage(
    message: string,
    source: 'sms' | 'notification' = 'sms',
    phoneNumber?: string
  ): Promise<{
    success: boolean;
    transactionId?: string;
    amount?: number;
    type?: string;
    confidence?: number;
    error?: string;
  }> {
    const eventId = uuidv4();
    const startTime = Date.now();

    try {
      // Log message received event
      await this.logEvent({
        id: eventId,
        messageId: uuidv4(),
        timestamp: startTime,
        source,
        status: 'received',
      });

      console.log(`[OfflineTransactionProcessing] Processing ${source} message:`, message.substring(0, 50));

      // Update event status
      await this.logEvent({
        id: eventId,
        messageId: uuidv4(),
        timestamp: Date.now(),
        source,
        status: 'processing',
      });

      // STEP 1: Extract Amount
      const amountResult = this.amountEngine.extract(message);
      if (!amountResult.amount) {
        console.log('[OfflineTransactionProcessing] No amount detected');
        throw new Error('No amount detected in message');
      }

      // STEP 2: Classify Intent
      const intentResult = this.intentEngine.classify(message, phoneNumber || 'Unknown');
      if (intentResult.intent === 'Ignore') {
        console.log('[OfflineTransactionProcessing] Intent classified as Ignore');
        throw new Error('Message appears to be spam or alert');
      }

      // STEP 3: Calculate confidence (40% amount, 60% intent)
      const amountConfidence = Math.min(amountResult.confidence || 0.8, 1);
      const intentConfidence = intentResult.confidence || 0.7;
      const confidence = amountConfidence * 0.4 + intentConfidence * 0.6;

      // Map intent to transaction type
      const typeMap: Record<string, 'debit' | 'credit' | 'transfer' | 'unknown'> = {
        Debit: 'debit',
        Credit: 'credit',
        Transfer: 'transfer',
        Ignore: 'unknown',
      };

      const transactionType = typeMap[intentResult.intent] || 'unknown';

      // Create offline transaction
      const transactionId = uuidv4();
      const transaction: OfflineTransaction = {
        id: transactionId,
        source,
        rawMessage: message,
        amount: amountResult.amount,
        type: transactionType,
        confidence,
        extractedData: {
          amount: amountResult.amount,
          date: undefined,
          account: undefined,
          payee: undefined,
          reference: undefined,
        },
        metadata: {
          timestamp: startTime,
          phoneNumber,
          sender: phoneNumber,
          hasBeenProcessed: false,
          processingError: undefined,
        },
        syncStatus: 'pending',
        syncAttempts: 0,
      };

      // Save to offline storage
      await offlineDatabase.addTransaction(transaction);
      console.log(`[OfflineTransactionProcessing] Transaction saved:`, transactionId);

      // Queue for sync
      await syncManager.queueTransaction(transaction, 'create');

      // Log success event
      await this.logEvent({
        id: eventId,
        messageId: transactionId,
        timestamp: Date.now(),
        source,
        status: 'completed',
        result: {
          amount: amountResult.amount,
          type: transactionType,
          confidence,
        },
      });

      console.log(`[OfflineTransactionProcessing] Message processed successfully in ${Date.now() - startTime}ms`);

      return {
        success: true,
        transactionId,
        amount: amountResult.amount,
        type: transactionType,
        confidence,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[OfflineTransactionProcessing] Processing failed:`, error);

      // Log error event
      await this.logEvent({
        id: eventId,
        messageId: uuidv4(),
        timestamp: Date.now(),
        source,
        status: 'failed',
        error: errorMsg,
      });

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Process multiple messages in batch
   */
  async processMessageBatch(
    messages: Array<{
      text: string;
      source: 'sms' | 'notification';
      phoneNumber?: string;
    }>
  ): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      text: string;
      success: boolean;
      transactionId?: string;
      error?: string;
    }>;
  }> {
    console.log(`[OfflineTransactionProcessing] Processing batch of ${messages.length} messages`);

    const results: Array<{
      text: string;
      success: boolean;
      transactionId?: string;
      error?: string;
    }> = [];

    let successful = 0;
    let failed = 0;

    for (const msg of messages) {
      const result = await this.processMessage(msg.text, msg.source, msg.phoneNumber);
      results.push({
        text: msg.text,
        success: result.success,
        transactionId: result.transactionId,
        error: result.error,
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    console.log(
      `[OfflineTransactionProcessing] Batch processing complete. Successful: ${successful}, Failed: ${failed}`
    );

    return {
      processed: messages.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Get all offline transactions
   */
  async getOfflineTransactions(filter?: {
    syncStatus?: 'pending' | 'synced' | 'failed';
    source?: 'sms' | 'notification' | 'manual';
    type?: 'debit' | 'credit' | 'transfer' | 'unknown';
  }): Promise<OfflineTransaction[]> {
    try {
      let transactions = await offlineDatabase.getTransactions();

      if (filter) {
        if (filter.syncStatus) {
          transactions = transactions.filter(t => t.syncStatus === filter.syncStatus);
        }
        if (filter.source) {
          transactions = transactions.filter(t => t.source === filter.source);
        }
        if (filter.type) {
          transactions = transactions.filter(t => t.type === filter.type);
        }
      }

      return transactions;
    } catch (error) {
      console.error('[OfflineTransactionProcessing] Failed to get transactions:', error);
      return [];
    }
  }

  /**
   * Get transaction statistics
   */
  async getStatistics(): Promise<{
    totalTransactions: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    bySyncStatus: Record<string, number>;
    totalAmount: number;
    totalDebitAmount: number;
    totalCreditAmount: number;
  }> {
    try {
      const transactions = await offlineDatabase.getTransactions();
      const storageStats = await offlineDatabase.getStorageStats();

      const stats = {
        totalTransactions: transactions.length,
        byType: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        bySyncStatus: {} as Record<string, number>,
        totalAmount: 0,
        totalDebitAmount: 0,
        totalCreditAmount: 0,
      };

      for (const transaction of transactions) {
        // Type stats
        stats.byType[transaction.type] = (stats.byType[transaction.type] || 0) + 1;

        // Source stats
        stats.bySource[transaction.source] = (stats.bySource[transaction.source] || 0) + 1;

        // Sync status stats
        stats.bySyncStatus[transaction.syncStatus] = (stats.bySyncStatus[transaction.syncStatus] || 0) + 1;

        // Amount stats
        stats.totalAmount += transaction.amount;
        if (transaction.type === 'debit') {
          stats.totalDebitAmount += transaction.amount;
        } else if (transaction.type === 'credit') {
          stats.totalCreditAmount += transaction.amount;
        }
      }

      return stats;
    } catch (error) {
      console.error('[OfflineTransactionProcessing] Failed to get statistics:', error);
      return {
        totalTransactions: 0,
        byType: {},
        bySource: {},
        bySyncStatus: {},
        totalAmount: 0,
        totalDebitAmount: 0,
        totalCreditAmount: 0,
      };
    }
  }

  /**
   * Get message processing history
   */
  async getMessageHistory(limit?: number): Promise<MessageProcessingEvent[]> {
    try {
      return await offlineDatabase.getMessageEvents(limit || 50);
    } catch (error) {
      console.error('[OfflineTransactionProcessing] Failed to get message history:', error);
      return [];
    }
  }

  /**
   * Sync all pending transactions
   */
  async syncPendingTransactions(): Promise<{
    synced: number;
    failed: number;
    message: string;
  }> {
    try {
      console.log('[OfflineTransactionProcessing] Starting manual sync');
      const result = await syncManager.sync();

      return {
        synced: result.synced,
        failed: result.failed,
        message: result.success
          ? `Successfully synced ${result.synced} transactions`
          : `Sync completed with ${result.failed} failures`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[OfflineTransactionProcessing] Sync failed:', error);
      return {
        synced: 0,
        failed: 0,
        message: `Sync failed: ${errorMsg}`,
      };
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    completed: number;
    lastSyncAt?: number;
  }> {
    try {
      const stats = await syncManager.getSyncStats();
      const metadata = await offlineDatabase.getMetadata();

      return {
        ...stats,
        lastSyncAt: metadata.lastSyncAt,
      };
    } catch (error) {
      console.error('[OfflineTransactionProcessing] Failed to get sync status:', error);
      return {
        pending: 0,
        syncing: 0,
        failed: 0,
        completed: 0,
      };
    }
  }

  /**
   * Clear all offline data (development only)
   */
  async clearAllData(): Promise<void> {
    try {
      await offlineDatabase.clearAllData();
      console.log('[OfflineTransactionProcessing] All offline data cleared');
    } catch (error) {
      console.error('[OfflineTransactionProcessing] Failed to clear data:', error);
      throw error;
    }
  }

  /**
   * Get storage stats
   */
  async getStorageStats(): Promise<{
    transactionCount: number;
    queueCount: number;
    jobCount: number;
    eventCount: number;
  }> {
    try {
      return await offlineDatabase.getStorageStats();
    } catch (error) {
      console.error('[OfflineTransactionProcessing] Failed to get storage stats:', error);
      return { transactionCount: 0, queueCount: 0, jobCount: 0, eventCount: 0 };
    }
  }

  /**
   * Log a message processing event
   */
  private async logEvent(event: MessageProcessingEvent): Promise<void> {
    try {
      await offlineDatabase.logMessageEvent(event);
    } catch (error) {
      console.warn('[OfflineTransactionProcessing] Failed to log event:', error);
    }
  }
}

export const offlineTransactionProcessingService = new OfflineTransactionProcessingService();
