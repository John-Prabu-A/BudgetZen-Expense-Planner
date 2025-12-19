/**
 * Unified Transaction Ingestion Service
 * Main orchestrator for the entire transaction detection pipeline
 */

import { TransactionClassificationEngine } from './engines/ClassificationEngine';
import { DeduplicationEngine } from './engines/DeduplicationEngine';
import { TransactionDetectionEngine } from './engines/DetectionEngine';
import { MessageNormalizationEngine } from './engines/NormalizationEngine';
import { PersistenceLayer } from './engines/PersistenceLayer';
import {
    IngestionResult,
    IngestionSettings,
    UnifiedMessage
} from './types';

/**
 * Main Transaction Ingestion Service
 * Coordinates all processing stages
 */
export class UnifiedTransactionIngestionService {
  private normalizationEngine: MessageNormalizationEngine;
  private detectionEngine: TransactionDetectionEngine;
  private classificationEngine: TransactionClassificationEngine;
  private deduplicationEngine: DeduplicationEngine;
  private persistenceLayer: PersistenceLayer;
  private settings: IngestionSettings;
  private processingQueue: UnifiedMessage[] = [];
  private isProcessing = false;

  constructor(settings: Partial<IngestionSettings> = {}) {
    this.normalizationEngine = new MessageNormalizationEngine();
    this.detectionEngine = new TransactionDetectionEngine();
    this.classificationEngine = new TransactionClassificationEngine();
    this.deduplicationEngine = new DeduplicationEngine();
    this.persistenceLayer = new PersistenceLayer();

    this.settings = {
      autoDetectionEnabled: true,
      confidenceThreshold: 0.6,
      androidSmsEnabled: true,
      notificationsEnabled: true,
      emailParsingEnabled: false,
      manualScanEnabled: true,
      autoCategoryEnabled: true,
      debugMode: false,
      bankConfigurations: [],
      ...settings,
    };
  }

  /**
   * Ingest a unified message from any source
   */
  async ingest(
    message: UnifiedMessage,
    userId: string,
    accountId: string
  ): Promise<IngestionResult> {
    // Check if source is enabled
    if (!this.isSourceEnabled(message.sourceType)) {
      return {
        success: false,
        error: 'Source disabled',
        reason: `${message.sourceType} ingestion is disabled`,
        messageId: message.rawText,
        metadata: { sourceType: message.sourceType },
      };
    }

    // Check if auto-detection is enabled
    if (!this.settings.autoDetectionEnabled) {
      return {
        success: false,
        error: 'Auto-detection disabled',
        reason: 'Automatic transaction detection is currently disabled',
        messageId: message.rawText,
        metadata: {},
      };
    }

    try {
      // Stage 1: Normalize
      console.log(`[Ingestion] Starting ingestion for message from ${message.sourceType}`);
      const normalizedMessage = this.normalizationEngine.normalize(message);

      // Stage 2: Detect
      const candidate = this.detectionEngine.detectTransaction(
        normalizedMessage,
        this.settings.confidenceThreshold
      );

      if (!candidate) {
        return {
          success: false,
          error: 'No transaction detected',
          reason: 'Message does not contain identifiable transaction',
          messageId: message.rawText,
          metadata: { sourceType: message.sourceType },
        };
      }

      // Stage 3: Classify
      if (this.settings.autoCategoryEnabled) {
        candidate.classification = this.classificationEngine.classify(candidate);
      }

      // Stage 4: Persist
      const result = await this.persistenceLayer.createTransactionFromCandidate(
        candidate,
        userId,
        accountId,
        this.settings.confidenceThreshold
      );

      if (this.settings.debugMode) {
        console.log('[Ingestion Debug]', result);
      }

      return result;
    } catch (error: any) {
      console.error('[Ingestion Error]', error);
      return {
        success: false,
        error: error.message,
        reason: 'Unexpected error during ingestion',
        messageId: message.rawText,
        metadata: { error: error.toString() },
      };
    }
  }

  /**
   * Batch ingest multiple messages
   */
  async ingestBatch(
    messages: UnifiedMessage[],
    userId: string,
    accountId: string
  ): Promise<IngestionResult[]> {
    const results: IngestionResult[] = [];

    for (const message of messages) {
      const result = await this.ingest(message, userId, accountId);
      results.push(result);

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Process queued messages
   */
  async processQueue(userId: string, accountId: string): Promise<IngestionResult[]> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return [];
    }

    this.isProcessing = true;
    const results: IngestionResult[] = [];

    try {
      while (this.processingQueue.length > 0) {
        const message = this.processingQueue.shift();
        if (message) {
          const result = await this.ingest(message, userId, accountId);
          results.push(result);
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  /**
   * Queue a message for processing
   */
  queueMessage(message: UnifiedMessage): void {
    this.processingQueue.push(message);
  }

  /**
   * Check if source type is enabled
   */
  private isSourceEnabled(sourceType: string): boolean {
    switch (sourceType) {
      case 'SMS':
        return this.settings.androidSmsEnabled || this.settings.androidSmsEnabled;
      case 'Notification':
        return this.settings.notificationsEnabled;
      case 'Email':
        return this.settings.emailParsingEnabled;
      case 'Manual':
        return this.settings.manualScanEnabled;
      default:
        return false;
    }
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<IngestionSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings,
    };
  }

  /**
   * Get current settings
   */
  getSettings(): IngestionSettings {
    return { ...this.settings };
  }

  /**
   * Enable/disable source
   */
  setSourceEnabled(sourceType: string, enabled: boolean): void {
    switch (sourceType) {
      case 'SMS':
        this.settings.androidSmsEnabled = enabled;
        break;
      case 'Notification':
        this.settings.notificationsEnabled = enabled;
        break;
      case 'Email':
        this.settings.emailParsingEnabled = enabled;
        break;
      case 'Manual':
        this.settings.manualScanEnabled = enabled;
        break;
    }
  }

  /**
   * Set confidence threshold
   */
  setConfidenceThreshold(threshold: number): void {
    this.settings.confidenceThreshold = Math.min(1, Math.max(0, threshold));
  }

  /**
   * Toggle debug mode
   */
  toggleDebugMode(): void {
    this.settings.debugMode = !this.settings.debugMode;
  }

  /**
   * Get normalization engine
   */
  getNormalizationEngine(): MessageNormalizationEngine {
    return this.normalizationEngine;
  }

  /**
   * Get detection engine
   */
  getDetectionEngine(): TransactionDetectionEngine {
    return this.detectionEngine;
  }

  /**
   * Get classification engine
   */
  getClassificationEngine(): TransactionClassificationEngine {
    return this.classificationEngine;
  }

  /**
   * Get deduplication engine
   */
  getDeduplicationEngine(): DeduplicationEngine {
    return this.deduplicationEngine;
  }

  /**
   * Get persistence layer
   */
  getPersistenceLayer(): PersistenceLayer {
    return this.persistenceLayer;
  }

  /**
   * Get processing queue size
   */
  getQueueSize(): number {
    return this.processingQueue.length;
  }

  /**
   * Clear processing queue
   */
  clearQueue(): void {
    this.processingQueue = [];
  }

  /**
   * Check if currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

// Export singleton instance
export const transactionIngestionService = new UnifiedTransactionIngestionService();

export default UnifiedTransactionIngestionService;
