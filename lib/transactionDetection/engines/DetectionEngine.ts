/**
 * Transaction Detection Engine
 * Determines if a message contains a financial transaction
 */

import { v4 as uuidv4 } from 'uuid';
import {
    BankConfiguration,
    ExtractedTransactionData,
    ExtractionDetails,
    NormalizedMessage,
    TransactionCandidate,
    TransactionIntent,
} from '../types';

/**
 * Transaction Detection Engine
 * Uses pattern matching and keyword analysis to detect transactions
 */
export class TransactionDetectionEngine {
  private bankConfigs: Map<string, BankConfiguration> = new Map();
  private defaultConfigs = this.initializeDefaultBankConfigs();

  constructor(bankConfigs: BankConfiguration[] = []) {
    this.defaultConfigs.forEach(config => {
      this.bankConfigs.set(config.id, config);
    });
    
    bankConfigs.forEach(config => {
      this.bankConfigs.set(config.id, config);
    });
  }

  /**
   * Detect if message contains a transaction
   */
  detectTransaction(message: NormalizedMessage, confidenceThreshold: number = 0.5): TransactionCandidate | null {
    const cleanText = message.cleanText.toLowerCase();
    
    // Try to match against known bank patterns
    const bankMatch = this.matchBankPatterns(cleanText, message.senderIdentifier);
    if (bankMatch) {
      return bankMatch;
    }

    // Fallback: Use generic transaction detection
    const genericMatch = this.detectGenericTransaction(message, cleanText);
    if (genericMatch && genericMatch.extractedData) {
      if (genericMatch.extractedData.amount && genericMatch.extractedData.amount > 0) {
        if (genericMatch.confidenceScore >= confidenceThreshold) {
          return genericMatch;
        }
      }
    }

    return null;
  }

  /**
   * Match against configured bank patterns
   */
  private matchBankPatterns(
    cleanText: string,
    senderIdentifier: string
  ): TransactionCandidate | null {
    for (const [, config] of this.bankConfigs) {
      if (!config.active) continue;

      // Check if sender matches
      const senderMatch = config.senderIdentifiers.some(sid =>
        this.matchesSender(senderIdentifier, sid)
      );

      if (!senderMatch) continue;

      // Try to match patterns
      for (const pattern of config.patterns) {
        if (!pattern.active) continue;

        const regex = new RegExp(pattern.pattern, 'gi');
        const match = regex.exec(cleanText);

        if (match) {
          return this.createTransactionCandidate(
            cleanText,
            match,
            pattern.intent,
            pattern,
            config
          );
        }
      }
    }

    return null;
  }

  /**
   * Generic transaction detection using keywords
   */
  private detectGenericTransaction(
    message: NormalizedMessage,
    cleanText: string
  ): TransactionCandidate | null {
    const intent = this.detectIntent(cleanText);
    
    if (intent === 'Ignore') {
      return null;
    }

    // Extract data generically
    const extractedData = this.extractDataGenerically(cleanText);
    const confidence = this.calculateConfidence(extractedData, intent, message.confidenceHint);

    if (confidence < 0.3 || !extractedData.amount) {
      return null;
    }

    const details: ExtractionDetails = {
      matchedPatterns: ['generic_detection'],
      patternMatches: {},
      fieldScores: {
        type: extractedData.type ? 0.8 : 0,
        amount: extractedData.amount ? 0.9 : 0,
        currency: extractedData.currency ? 0.7 : 0,
        date: extractedData.date ? 0.6 : 0,
        bankOrProvider: extractedData.bankOrProvider ? 0.5 : 0,
        accountIdentifier: extractedData.accountIdentifier ? 0.4 : 0,
        referenceNumber: extractedData.referenceNumber ? 0.5 : 0,
        description: extractedData.description ? 0.7 : 0,
        counterparty: extractedData.counterparty ? 0.3 : 0,
      },
      overallConfidence: confidence,
      warnings: confidence < 0.6 ? ['Low confidence - manual review recommended'] : [],
    };

    return {
      id: uuidv4(),
      message,
      intent,
      confidenceScore: confidence,
      extractedData,
      extractionDetails: details,
      processedAt: new Date(),
    };
  }

  /**
   * Detect transaction intent from keywords
   */
  private detectIntent(text: string): TransactionIntent {
    const creditKeywords = ['credited', 'deposited', 'received', 'added', 'income', 'salary', 'refund', 'received', 'inward'];
    const debitKeywords = ['debited', 'withdrawn', 'paid', 'sent', 'expense', 'deducted', 'charged', 'outward'];
    const transferKeywords = ['transfer', 'transferred', 'sent to', 'received from'];
    const ignoreKeywords = ['offer', 'promotion', 'campaign', 'advertisement', 'reminder', 'call us'];

    // Check ignore first
    if (ignoreKeywords.some(kw => text.includes(kw))) {
      return 'Ignore';
    }

    // Check transfer
    if (transferKeywords.some(kw => text.includes(kw))) {
      return 'Transfer';
    }

    // Check credit
    if (creditKeywords.some(kw => text.includes(kw))) {
      return 'Credit';
    }

    // Check debit
    if (debitKeywords.some(kw => text.includes(kw))) {
      return 'Debit';
    }

    // Default: assume debit (safer default)
    return 'Debit';
  }

  /**
   * Generic data extraction
   */
  private extractDataGenerically(text: string): ExtractedTransactionData {
    const data: ExtractedTransactionData = {
      type: null,
      amount: null,
      currency: null,
      date: null,
      bankOrProvider: null,
      accountIdentifier: null,
      referenceNumber: null,
      description: null,
      counterparty: null,
    };

    // Extract amount
    const amountPattern = /(?:(?:amt|amount|rs|inr|\$|₹|usd)\s*[:.]*\s*)([\d,]+(?:\.\d{2})?)/i;
    const amountMatch = text.match(amountPattern);
    if (amountMatch) {
      data.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Extract currency
    if (text.includes('inr') || text.includes('₹')) {
      data.currency = 'INR';
    } else if (text.includes('$') || text.includes('usd')) {
      data.currency = 'USD';
    } else if (text.includes('€') || text.includes('eur')) {
      data.currency = 'EUR';
    }

    // Extract date
    const datePatterns = [
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
      /(?:on\s+)?(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)/i,
    ];
    for (const pattern of datePatterns) {
      const dateMatch = text.match(pattern);
      if (dateMatch) {
        data.date = new Date(dateMatch[1]);
        break;
      }
    }

    // Extract reference number
    const refPattern = /(?:ref|reference|txn|transaction|id)[:.]*\s*([A-Z0-9]+)/i;
    const refMatch = text.match(refPattern);
    if (refMatch) {
      data.referenceNumber = refMatch[1];
    }

    // Extract account identifier
    const accPattern = /(?:account|a\/c|ac|acct)[:.]*\s*([X0-9*]+)/i;
    const accMatch = text.match(accPattern);
    if (accMatch) {
      data.accountIdentifier = accMatch[1];
    }

    // Extract type based on intent
    const intent = this.detectIntent(text);
    if (intent === 'Credit') {
      data.type = 'income';
    } else if (intent === 'Debit') {
      data.type = 'expense';
    } else if (intent === 'Transfer') {
      data.type = 'transfer';
    }

    // Use full text as description if nothing better available
    data.description = text.substring(0, 200);

    return data;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    data: ExtractedTransactionData,
    intent: TransactionIntent,
    messageConfidence: number
  ): number {
    let score = messageConfidence || 0.5;

    // Bonus for critical fields
    if (data.amount) score += 0.2;
    if (data.currency) score += 0.1;
    if (data.date) score += 0.1;
    if (data.type) score += 0.15;
    if (data.bankOrProvider) score += 0.1;

    // Reduce for warnings
    if (!data.date) score -= 0.05;
    if (!data.currency) score -= 0.05;

    return Math.min(1, score);
  }

  /**
   * Match sender identifier
   */
  private matchesSender(actual: string, expected: string): boolean {
    const actualLower = actual.toLowerCase();
    const expectedLower = expected.toLowerCase();
    
    return actualLower.includes(expectedLower) || expectedLower.includes(actualLower);
  }

  /**
   * Create transaction candidate from pattern match
   */
  private createTransactionCandidate(
    text: string,
    match: RegExpMatchArray,
    intent: TransactionIntent,
    pattern: any,
    bankConfig: BankConfiguration
  ): TransactionCandidate {
    const extractedData: ExtractedTransactionData = {
      type: intent === 'Credit' ? 'income' : intent === 'Debit' ? 'expense' : 'transfer',
      amount: null,
      currency: bankConfig.currency,
      date: new Date(),
      bankOrProvider: bankConfig.name,
      accountIdentifier: null,
      referenceNumber: null,
      description: text.substring(0, 200),
      counterparty: null,
    };

    // Extract fields using pattern rules
    for (const rule of pattern.fieldExtraction || []) {
      try {
        let value: any;
        
        if (typeof rule.extractor === 'string') {
          const groupIndex = parseInt(rule.extractor);
          value = match[groupIndex];
        } else if (typeof rule.extractor === 'function') {
          value = rule.extractor(match);
        }

        if (value && rule.transform) {
          value = rule.transform(value);
        }

        if (value) {
          (extractedData as any)[rule.field] = value;
        }
      } catch (e) {
        // Extraction error for this field
      }
    }

    const confidence = Math.min(1, pattern.minimumConfidence || 0.7);

    return {
      id: uuidv4(),
      message: {
        rawText: text,
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: bankConfig.id,
        platform: 'Android',
        confidenceHint: confidence,
        cleanText: text,
        originalRawText: text,
        processingMetadata: {
          noiseRemoved: [],
          normalizations: [],
        },
      },
      intent,
      confidenceScore: confidence,
      extractedData,
      extractionDetails: {
        matchedPatterns: [pattern.name],
        patternMatches: { [pattern.name]: match[0] },
        fieldScores: {
          type: 0.9,
          amount: extractedData.amount ? 0.95 : 0,
          currency: 0.9,
          date: 0.7,
          bankOrProvider: 0.95,
          accountIdentifier: extractedData.accountIdentifier ? 0.8 : 0,
          referenceNumber: extractedData.referenceNumber ? 0.85 : 0,
          description: 0.8,
          counterparty: 0,
        },
        overallConfidence: confidence,
        warnings: [],
      },
      processedAt: new Date(),
    };
  }

  /**
   * Initialize default bank configurations
   */
  private initializeDefaultBankConfigs(): BankConfiguration[] {
    return [
      {
        id: 'hdfc_bank',
        name: 'HDFC Bank',
        senderIdentifiers: ['1860', '9066', 'hdfc'],
        patterns: [
          {
            name: 'hdfc_debit',
            pattern: /(?:amount\s*)?₹?([\d,]+(?:\.\d{2})?)\s*(?:debited|withdrawn)/i,
            intent: 'Debit',
            fieldExtraction: [
              {
                field: 'amount',
                extractor: '1',
                transform: (val: string) => parseFloat(val.replace(/,/g, '')),
                required: true,
              },
            ],
            minimumConfidence: 0.85,
            active: true,
          },
          {
            name: 'hdfc_credit',
            pattern: /(?:amount\s*)?₹?([\d,]+(?:\.\d{2})?)\s*(?:credited|added)/i,
            intent: 'Credit',
            fieldExtraction: [
              {
                field: 'amount',
                extractor: '1',
                transform: (val: string) => parseFloat(val.replace(/,/g, '')),
                required: true,
              },
            ],
            minimumConfidence: 0.85,
            active: true,
          },
        ],
        currency: 'INR',
        active: true,
      },
      {
        id: 'icici_bank',
        name: 'ICICI Bank',
        senderIdentifiers: ['9267', '9241', 'icici'],
        patterns: [
          {
            name: 'icici_debit',
            pattern: /(?:amount\s*)?₹?([\d,]+(?:\.\d{2})?)\s*(?:debited|withdrawn)/i,
            intent: 'Debit',
            fieldExtraction: [
              {
                field: 'amount',
                extractor: '1',
                transform: (val: string) => parseFloat(val.replace(/,/g, '')),
                required: true,
              },
            ],
            minimumConfidence: 0.85,
            active: true,
          },
        ],
        currency: 'INR',
        active: true,
      },
      {
        id: 'axis_bank',
        name: 'Axis Bank',
        senderIdentifiers: ['9876', 'axis'],
        patterns: [
          {
            name: 'axis_transaction',
            pattern: /(?:amount\s*)?₹?([\d,]+(?:\.\d{2})?)/i,
            intent: 'Debit',
            fieldExtraction: [
              {
                field: 'amount',
                extractor: '1',
                transform: (val: string) => parseFloat(val.replace(/,/g, '')),
                required: true,
              },
            ],
            minimumConfidence: 0.75,
            active: true,
          },
        ],
        currency: 'INR',
        active: true,
      },
    ];
  }

  /**
   * Add or update bank configuration
   */
  addBankConfig(config: BankConfiguration): void {
    this.bankConfigs.set(config.id, config);
  }

  /**
   * Get all active bank configurations
   */
  getActiveBankConfigs(): BankConfiguration[] {
    return Array.from(this.bankConfigs.values()).filter(c => c.active);
  }
}

export const detectionEngine = new TransactionDetectionEngine();
