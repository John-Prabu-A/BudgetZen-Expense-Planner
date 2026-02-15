/**
 * Record Creation Service
 * Handles automatic record creation from detected transactions
 * 
 * Responsibilities:
 * - Create transaction records in database
 * - Perform deduplication checks
 * - Store ingestion history
 * - Handle confidence thresholds
 * - Provide transaction logging
 */

import { TransactionCandidate, TransactionClassification } from './types';
import crypto from 'crypto';

export interface RecordCreationConfig {
  confidenceThreshold: number;
  enableAutoCreation: boolean;
  deduplicationWindow: number; // milliseconds
  requireManualApproval: boolean;
  logIngestionHistory: boolean;
}

export interface RecordCreationResult {
  success: boolean;
  recordId?: string;
  message: string;
  warnings?: string[];
  isDuplicate?: boolean;
  duplicateRecordId?: string;
}

/**
 * Record Creation Service
 */
export class RecordCreationService {
  private supabase: any;
  private config: RecordCreationConfig;
  private deduplicationCache: Map<string, { recordId: string; timestamp: number }> = new Map();

  constructor(supabase: any, config: Partial<RecordCreationConfig> = {}) {
    this.supabase = supabase;
    this.config = {
      confidenceThreshold: 0.7,
      enableAutoCreation: true,
      deduplicationWindow: 5 * 60 * 1000, // 5 minutes
      requireManualApproval: false,
      logIngestionHistory: true,
      ...config,
    };
  }

  /**
   * Create a record from detected transaction
   */
  async createRecord(
    userId: string,
    accountId: string,
    candidate: TransactionCandidate,
    classification: TransactionClassification,
    autoApprove: boolean = false
  ): Promise<RecordCreationResult> {
    try {
      // Check confidence threshold
      if (candidate.confidenceScore < this.config.confidenceThreshold) {
        return {
          success: false,
          message: `Confidence score ${candidate.confidenceScore} below threshold ${this.config.confidenceThreshold}`,
          warnings: ['Low confidence - record not created'],
        };
      }

      // Check for duplicates
      const deduplicationResult = await this.checkForDuplicates(
        userId,
        accountId,
        candidate,
        classification
      );

      if (deduplicationResult.isDuplicate) {
        return {
          success: false,
          message: 'Duplicate transaction detected',
          isDuplicate: true,
          duplicateRecordId: deduplicationResult.recordId,
          warnings: ['Transaction already exists in system'],
        };
      }

      // Create the record
      const recordData = this.buildRecordData(
        userId,
        accountId,
        candidate,
        classification
      );

      const { data, error } = await this.supabase
        .from('records')
        .insert(recordData)
        .select()
        .single();

      if (error) {
        console.error('[RecordCreationService] Database insert error:', error);
        return {
          success: false,
          message: `Failed to create record: ${error.message}`,
          warnings: ['Database error occurred'],
        };
      }

      // Log ingestion history
      if (this.config.logIngestionHistory) {
        await this.logIngestionHistory(
          userId,
          accountId,
          candidate,
          data.id,
          'success'
        );
      }

      // Cache for deduplication
      const hash = this.generateTransactionHash(candidate, classification);
      this.deduplicationCache.set(hash, {
        recordId: data.id,
        timestamp: Date.now(),
      });

      return {
        success: true,
        recordId: data.id,
        message: 'Record created successfully',
        warnings: candidate.extractionDetails.warnings,
      };
    } catch (error) {
      console.error('[RecordCreationService] Record creation error:', error);
      return {
        success: false,
        message: `Record creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: ['Unexpected error during record creation'],
      };
    }
  }

  /**
   * Check for duplicate transactions
   */
  private async checkForDuplicates(
    userId: string,
    accountId: string,
    candidate: TransactionCandidate,
    classification: TransactionClassification
  ): Promise<{ isDuplicate: boolean; recordId?: string }> {
    try {
      // Check cache first
      const hash = this.generateTransactionHash(candidate, classification);
      const cacheEntry = this.deduplicationCache.get(hash);

      if (cacheEntry) {
        const age = Date.now() - cacheEntry.timestamp;
        if (age < this.config.deduplicationWindow) {
          return {
            isDuplicate: true,
            recordId: cacheEntry.recordId,
          };
        } else {
          this.deduplicationCache.delete(hash);
        }
      }

      // Query database for similar transactions
      const targetDate = this.getTargetDate(candidate);
      const amount = candidate.extractedData.amount;

      if (!amount) {
        return { isDuplicate: false };
      }

      // Search for records with same amount on same date
      const { data, error } = await this.supabase
        .from('records')
        .select('id, amount, date, description')
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .eq('amount', Math.abs(amount))
        .eq('type', classification.type)
        .gte('date', this.getStartOfDay(targetDate))
        .lte('date', this.getEndOfDay(targetDate));

      if (error) {
        console.warn('[RecordCreationService] Deduplication query error:', error);
        return { isDuplicate: false };
      }

      // Check for exact or near-exact matches
      if (data && data.length > 0) {
        // Check if description matches (advanced deduplication)
        const description = candidate.extractedData.description || '';
        const match = data.find((record: any) =>
          this.isSimilarDescription(record.description, description)
        );

        if (match) {
          return {
            isDuplicate: true,
            recordId: match.id,
          };
        }

        // If only one transaction today with same amount, likely duplicate
        if (data.length === 1) {
          return {
            isDuplicate: true,
            recordId: data[0].id,
          };
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('[RecordCreationService] Deduplication check error:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Build record data for database insertion
   */
  private buildRecordData(
    userId: string,
    accountId: string,
    candidate: TransactionCandidate,
    classification: TransactionClassification
  ) {
    const amount = candidate.extractedData.amount || 0;
    const date = this.getTargetDate(candidate);

    return {
      user_id: userId,
      account_id: accountId,
      amount: Math.abs(amount),
      type: classification.type,
      category_id: classification.suggestedCategoryId,
      category: classification.categoryName || 'Uncategorized',
      description: this.buildDescription(candidate),
      date: date.toISOString().split('T')[0], // Store as YYYY-MM-DD
      is_auto_generated: true,
      source: candidate.message.sourceType,
      bank_provider: candidate.extractedData.bankOrProvider,
      reference_number: candidate.extractedData.referenceNumber || null,
      metadata: {
        extractionDetails: candidate.extractionDetails,
        classification: classification,
        originalMessage: candidate.message.rawText,
        extractedData: candidate.extractedData,
        confidenceScore: candidate.confidenceScore,
        ingestionTimestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Build description from extracted data
   */
  private buildDescription(candidate: TransactionCandidate): string {
    const parts: string[] = [];

    // Add amount
    if (candidate.extractedData.amount) {
      parts.push(`${candidate.extractedData.currency || 'INR'} ${candidate.extractedData.amount}`);
    }

    // Add bank/provider
    if (candidate.extractedData.bankOrProvider) {
      parts.push(`via ${candidate.extractedData.bankOrProvider}`);
    }

    // Add intent
    parts.push(`[${candidate.intent}]`);

    // Add description
    if (candidate.extractedData.description) {
      parts.push(candidate.extractedData.description);
    }

    return parts.join(' - ');
  }

  /**
   * Get target date from candidate
   */
  private getTargetDate(candidate: TransactionCandidate): Date {
    // Use extracted date if available
    if (candidate.extractedData.date) {
      try {
        const parsed = new Date(candidate.extractedData.date);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch (e) {
        // Fall through to message timestamp
      }
    }

    // Use message timestamp
    return new Date(candidate.message.timestamp);
  }

  /**
   * Generate hash for deduplication
   */
  private generateTransactionHash(
    candidate: TransactionCandidate,
    classification: TransactionClassification
  ): string {
    const key = `${candidate.extractedData.amount}|${classification.type}|${
      candidate.message.timestamp.toDateString()
    }|${candidate.extractedData.description || ''}`;

    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Check if descriptions are similar
   */
  private isSimilarDescription(desc1: string, desc2: string): boolean {
    if (!desc1 || !desc2) return false;

    const norm1 = desc1.toLowerCase().trim();
    const norm2 = desc2.toLowerCase().trim();

    // Exact match
    if (norm1 === norm2) return true;

    // Partial match (at least 80% similar)
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    const minLen = Math.min(words1.length, words2.length);
    const maxLen = Math.max(words1.length, words2.length);

    if (minLen === 0) return false;

    let matches = 0;
    for (const word of words1) {
      if (words2.includes(word)) {
        matches++;
      }
    }

    return matches / maxLen > 0.8;
  }

  /**
   * Log ingestion history
   */
  private async logIngestionHistory(
    userId: string,
    accountId: string,
    candidate: TransactionCandidate,
    recordId: string,
    status: 'success' | 'failed' | 'pending'
  ): Promise<void> {
    try {
      await this.supabase.from('ingestion_history').insert({
        user_id: userId,
        account_id: accountId,
        record_id: recordId,
        status,
        original_message: candidate.message.rawText,
        source: candidate.message.sourceType,
        detected_amount: candidate.extractedData.amount,
        detected_intent: candidate.intent,
        confidence_score: candidate.confidenceScore,
        extracted_data: candidate.extractedData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('[RecordCreationService] Failed to log ingestion history:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get start of day timestamp
   */
  private getStartOfDay(date: Date): string {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }

  /**
   * Get end of day timestamp
   */
  private getEndOfDay(date: Date): string {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
  }

  /**
   * Cleanup old deduplication cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    for (const [hash, entry] of this.deduplicationCache.entries()) {
      if (now - entry.timestamp > this.config.deduplicationWindow * 2) {
        this.deduplicationCache.delete(hash);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RecordCreationConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): RecordCreationConfig {
    return { ...this.config };
  }
}

export default RecordCreationService;
