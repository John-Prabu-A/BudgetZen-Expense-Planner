/**
 * Deduplication Engine
 * Detects and prevents duplicate transaction creation
 */

import CryptoJS from 'crypto-js';
import {
    DeduplicationRule,
    DuplicateCheckResult,
    FinalTransactionRecord,
    TransactionCandidate,
} from '../types';

/**
 * Deduplication Engine
 * Uses hashing and similarity matching to detect duplicates
 */
export class DeduplicationEngine {
  private deduplicationRules: DeduplicationRule = {
    amountTolerance: 0.01, // Allow ±1%
    timeWindow: 60000, // 1 minute
    requireAccountMatch: true,
    requireProviderMatch: true,
  };

  constructor(rules: Partial<DeduplicationRule> = {}) {
    this.deduplicationRules = {
      ...this.deduplicationRules,
      ...rules,
    };
  }

  /**
   * Generate deduplication hash for a transaction
   */
  generateHash(candidate: TransactionCandidate): string {
    const data = {
      amount: candidate.extractedData.amount,
      currency: candidate.extractedData.currency,
      date: candidate.extractedData.date?.toISOString().split('T')[0], // Date only
      provider: candidate.extractedData.bankOrProvider,
      account: candidate.extractedData.accountIdentifier,
      refNumber: candidate.extractedData.referenceNumber,
    };

    const hashInput = JSON.stringify(data);
    return CryptoJS.SHA256(hashInput).toString();
  }

  /**
   * Generate deduplication hash for final record
   */
  generateRecordHash(record: Partial<FinalTransactionRecord>): string {
    const data = {
      amount: record.amount,
      account: record.accountId,
      date: record.transactionDate?.toISOString().split('T')[0],
      type: record.type,
    };

    const hashInput = JSON.stringify(data);
    return CryptoJS.SHA256(hashInput).toString();
  }

  /**
   * Calculate similarity between two transactions
   */
  calculateSimilarity(
    candidate: TransactionCandidate,
    existingRecord: any
  ): number {
    let similarity = 0;
    let factors = 0;

    // Check amount
    if (
      candidate.extractedData.amount &&
      existingRecord.amount
    ) {
      const amountDiff = Math.abs(
        candidate.extractedData.amount - existingRecord.amount
      );
      const amountPercent = amountDiff / existingRecord.amount;
      
      if (amountPercent <= this.deduplicationRules.amountTolerance) {
        similarity += 0.35;
      }
      factors += 0.35;
    }

    // Check date
    if (
      candidate.extractedData.date &&
      existingRecord.transaction_date
    ) {
      const candidateDate = new Date(candidate.extractedData.date);
      const existingDate = new Date(existingRecord.transaction_date);
      const timeDiff = Math.abs(candidateDate.getTime() - existingDate.getTime());

      if (timeDiff <= this.deduplicationRules.timeWindow) {
        similarity += 0.3;
      }
      factors += 0.3;
    }

    // Check account match
    if (this.deduplicationRules.requireAccountMatch) {
      if (
        candidate.extractedData.accountIdentifier &&
        existingRecord.account_id
      ) {
        if (
          candidate.extractedData.accountIdentifier
            .toLowerCase()
            .includes(existingRecord.account_id.toString().toLowerCase()) ||
          existingRecord.account_id
            .toString()
            .toLowerCase()
            .includes(candidate.extractedData.accountIdentifier.toLowerCase())
        ) {
          similarity += 0.2;
        }
        factors += 0.2;
      }
    }

    // Check provider match
    if (this.deduplicationRules.requireProviderMatch) {
      if (
        candidate.extractedData.bankOrProvider &&
        existingRecord.source_metadata?.source
      ) {
        if (
          candidate.extractedData.bankOrProvider
            .toLowerCase()
            .includes(
              existingRecord.source_metadata.source.toLowerCase()
            ) ||
          existingRecord.source_metadata.source
            .toLowerCase()
            .includes(candidate.extractedData.bankOrProvider.toLowerCase())
        ) {
          similarity += 0.15;
        }
        factors += 0.15;
      }
    }

    // Check reference number
    if (
      candidate.extractedData.referenceNumber &&
      existingRecord.notes
    ) {
      if (existingRecord.notes.includes(candidate.extractedData.referenceNumber)) {
        similarity += 1; // Perfect match on reference
      }
      factors += 0.5;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Check if candidate is a duplicate
   */
  isDuplicate(
    candidate: TransactionCandidate,
    existingRecords: any[],
    similarityThreshold: number = 0.85
  ): DuplicateCheckResult {
    if (existingRecords.length === 0) {
      return {
        isDuplicate: false,
        duplicateIds: [],
        similarityScore: 0,
        reason: 'No existing records to compare',
      };
    }

    const potentialDuplicates: { id: string; score: number }[] = [];

    for (const record of existingRecords) {
      const similarity = this.calculateSimilarity(candidate, record);

      if (similarity >= similarityThreshold) {
        potentialDuplicates.push({
          id: record.id,
          score: similarity,
        });
      }
    }

    if (potentialDuplicates.length > 0) {
      // Sort by highest similarity
      potentialDuplicates.sort((a, b) => b.score - a.score);

      return {
        isDuplicate: true,
        duplicateIds: potentialDuplicates.map(d => d.id),
        similarityScore: potentialDuplicates[0].score,
        reason: `Matched ${potentialDuplicates.length} existing transaction(s) with similarity >= ${similarityThreshold}`,
      };
    }

    return {
      isDuplicate: false,
      duplicateIds: [],
      similarityScore: 0,
      reason: 'No similar transactions found',
    };
  }

  /**
   * Idempotent write - check by hash
   */
  checkByHash(
    hash: string,
    existingHashes: string[]
  ): boolean {
    return existingHashes.includes(hash);
  }

  /**
   * Update deduplication rules
   */
  setRules(rules: Partial<DeduplicationRule>): void {
    this.deduplicationRules = {
      ...this.deduplicationRules,
      ...rules,
    };
  }

  /**
   * Get current rules
   */
  getRules(): DeduplicationRule {
    return { ...this.deduplicationRules };
  }
}

export const deduplicationEngine = new DeduplicationEngine();
