/**
 * Transaction Processing Pipeline
 * Unified orchestration of amount extraction, intent classification, and record creation
 * 
 * Flow:
 * 1. Message comes in
 * 2. Amount is extracted
 * 3. Intent is classified
 * 4. Record is created (if confident enough)
 * 5. Result is stored and reported
 */

import { AmountExtractionEngine } from './engines/AmountExtractionEngine';
import { IntentClassificationEngine } from './engines/IntentClassificationEngine';
import { RecordCreationService } from './RecordCreationService';
import { TransactionCandidate, TransactionClassification, UnifiedMessage, NormalizedMessage } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface PipelineConfig {
  confidenceThreshold: number;
  enableAutoCreation: boolean;
  debugMode: boolean;
}

export interface PipelineResult {
  success: boolean;
  recordId?: string;
  amount?: number;
  intent?: 'Debit' | 'Credit' | 'Transfer' | 'Ignore';
  confidence?: number;
  message?: string;
  warnings?: string[];
}

/**
 * Transaction Processing Pipeline
 */
export class TransactionProcessingPipeline {
  private amountEngine: AmountExtractionEngine;
  private intentEngine: IntentClassificationEngine;
  private recordService: RecordCreationService;
  private config: PipelineConfig;

  constructor(
    recordService: RecordCreationService,
    config: Partial<PipelineConfig> = {}
  ) {
    this.amountEngine = new AmountExtractionEngine();
    this.intentEngine = new IntentClassificationEngine();
    this.recordService = recordService;
    this.config = {
      confidenceThreshold: 0.7,
      enableAutoCreation: true,
      debugMode: false,
      ...config,
    };
  }

  /**
   * Process a message through the full pipeline
   */
  async process(
    userId: string,
    accountId: string,
    message: NormalizedMessage | UnifiedMessage
  ): Promise<PipelineResult> {
    const startTime = Date.now();

    try {
      if (this.config.debugMode) {
        console.log('[Pipeline] Processing message:', message.rawText);
      }

      // STEP 1: Extract Amount
      const amountResult = this.amountEngine.extract(message.rawText);

      if (!amountResult.amount) {
        if (this.config.debugMode) {
          console.log('[Pipeline] No amount found - skipping');
        }
        return {
          success: false,
          message: 'No amount detected in message',
          warnings: ['Insufficient data for transaction detection'],
        };
      }

      if (this.config.debugMode) {
        console.log(`[Pipeline] Amount extracted: ${amountResult.amount} ${amountResult.currency}`);
      }

      // STEP 2: Classify Intent
      const intentResult = this.intentEngine.classify(
        message.rawText,
        message.senderIdentifier
      );

      if (intentResult.intent === 'Ignore') {
        if (this.config.debugMode) {
          console.log('[Pipeline] Intent classified as Ignore - skipping');
        }
        return {
          success: false,
          intent: 'Ignore',
          confidence: intentResult.confidence,
          message: 'Message appears to be spam or alert - not a transaction',
          warnings: intentResult.warnings,
        };
      }

      if (this.config.debugMode) {
        console.log(
          `[Pipeline] Intent: ${intentResult.intent} (confidence: ${intentResult.confidence})`
        );
      }

      // STEP 3: Calculate Combined Confidence
      const combinedConfidence = this.calculateCombinedConfidence(
        amountResult,
        intentResult
      );

      if (this.config.debugMode) {
        console.log(`[Pipeline] Combined confidence: ${combinedConfidence}`);
      }

      if (combinedConfidence < this.config.confidenceThreshold) {
        if (this.config.debugMode) {
          console.log(
            `[Pipeline] Confidence ${combinedConfidence} below threshold ${this.config.confidenceThreshold}`
          );
        }
        return {
          success: false,
          amount: amountResult.amount,
          intent: intentResult.intent as any,
          confidence: combinedConfidence,
          message: `Confidence ${combinedConfidence.toFixed(2)} below threshold`,
          warnings: [
            'Low confidence detection - manual review recommended',
            ...intentResult.warnings,
          ],
        };
      }

      // STEP 4: Build Transaction Candidate
      const candidate = this.buildTransactionCandidate(
        message,
        amountResult,
        intentResult,
        combinedConfidence
      );

      // STEP 5: Build Classification
      const classification = this.buildTransactionClassification(intentResult);

      // STEP 6: Create Record (if enabled)
      if (this.config.enableAutoCreation) {
        const recordResult = await this.recordService.createRecord(
          userId,
          accountId,
          candidate,
          classification,
          true
        );

        const duration = Date.now() - startTime;

        if (this.config.debugMode) {
          console.log(
            `[Pipeline] Record creation result: ${recordResult.success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`
          );
        }

        return {
          success: recordResult.success,
          recordId: recordResult.recordId,
          amount: amountResult.amount,
          intent: intentResult.intent as any,
          confidence: combinedConfidence,
          message: recordResult.message,
          warnings: [
            ...(recordResult.warnings || []),
            ...intentResult.warnings,
          ],
        };
      }

      // Just return the detection result without creating record
      return {
        success: true,
        amount: amountResult.amount,
        intent: intentResult.intent as any,
        confidence: combinedConfidence,
        message: 'Transaction detected successfully (not auto-created)',
        warnings: intentResult.warnings,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Pipeline] Processing error:', error);

      return {
        success: false,
        message: `Pipeline processing failed: ${errorMsg}`,
        warnings: ['Unexpected error during processing'],
      };
    }
  }

  /**
   * Calculate combined confidence from multiple sources
   */
  private calculateCombinedConfidence(amountResult: any, intentResult: any): number {
    // Amount extraction confidence: 40% weight
    // Intent classification confidence: 60% weight
    const combinedConfidence =
      amountResult.confidence * 0.4 + intentResult.confidence * 0.6;

    return Math.min(1, Math.max(0, combinedConfidence));
  }

  /**
   * Build transaction candidate from extraction results
   */
  private buildTransactionCandidate(
    message: any,
    amountResult: any,
    intentResult: any,
    confidence: number
  ): TransactionCandidate {
    return {
      id: uuidv4(),
      message: message as NormalizedMessage,
      intent: intentResult.intent as 'Credit' | 'Debit' | 'Transfer' | 'Ignore',
      confidenceScore: confidence,
      extractedData: {
        type: null,
        amount: amountResult.amount,
        currency: amountResult.currency,
        date: null,
        bankOrProvider: this.extractBankProvider(message.senderIdentifier),
        accountIdentifier: null,
        referenceNumber: null,
        description: message.rawText.substring(0, 100),
        counterparty: null,
      },
      extractionDetails: {
        matchedPatterns: [
          ...amountResult.extractionMethod ? [amountResult.extractionMethod] : [],
          ...intentResult.matchedPatterns || [],
        ],
        patternMatches: {
          amount: amountResult.extractionMethod,
          intent: intentResult.intent,
        },
        fieldScores: {
          type: 0,
          amount: amountResult.confidence,
          currency: amountResult.confidence,
          date: 0,
          bankOrProvider: 0.5,
          accountIdentifier: 0,
          referenceNumber: 0,
          description: 0.5,
          counterparty: 0,
        },
        overallConfidence: confidence,
        warnings: [
          ...amountResult.warnings || [],
          ...intentResult.warnings || [],
        ],
      },
      processedAt: new Date(),
    };
  }

  /**
   * Build transaction classification
   */
  private buildTransactionClassification(intentResult: any): TransactionClassification {
    const typeMap: Record<string, 'income' | 'expense' | 'transfer'> = {
      'Credit': 'income',
      'Debit': 'expense',
      'Transfer': 'transfer',
      'Ignore': 'expense',
    };

    return {
      type: typeMap[intentResult.intent] || 'expense',
      suggestedCategoryId: null,
      categoryName: null,
      confidence: intentResult.confidence,
      isAutoGenerated: true,
      metadata: {
        originalIntent: intentResult.intent,
        intentKeywords: intentResult.keywords,
        source: 'auto_detected',
      },
    };
  }

  /**
   * Extract bank provider from sender identifier
   */
  private extractBankProvider(senderIdentifier: string): string | null {
    const bankPatterns: Record<string, string[]> = {
      HDFC: ['HDFC', 'hdfc'],
      ICICI: ['ICICI', 'icici'],
      SBI: ['SBI', 'sbi', 'StateBank'],
      Axis: ['Axis', 'axis'],
      'IDBI': ['IDBI', 'idbi'],
      'Kotak': ['Kotak', 'kotak'],
      'IndusInd': ['IndusInd', 'indusind'],
      'PhonePe': ['PhonePe', 'phonepay'],
      'Google Pay': ['GooglePay', 'googlepay', 'Google Pay'],
      'Paytm': ['Paytm', 'paytm'],
      'Amazon Pay': ['AmazonPay', 'Amazon Pay'],
    };

    for (const [bank, patterns] of Object.entries(bankPatterns)) {
      for (const pattern of patterns) {
        if (senderIdentifier.includes(pattern)) {
          return bank;
        }
      }
    }

    return null;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PipelineConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  /**
   * Enable debug mode
   */
  enableDebugMode(): void {
    this.config.debugMode = true;
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.config.debugMode = false;
  }
}

export default TransactionProcessingPipeline;
