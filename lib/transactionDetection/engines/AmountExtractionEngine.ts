/**
 * Amount Extraction Engine
 * Specialized engine for extracting monetary amounts from transaction messages
 * 
 * Handles multiple formats:
 * - Currency symbols: ₹, Rs., $, €, £, ¥
 * - Number formats: 5000, 5,000, 50.00, 50,00
 * - Written amounts: "five thousand", "fifty rupees"
 * - Excludes balance/limit amounts
 */

import { ExtractedTransactionData } from '../types';

export interface AmountExtractionResult {
  amount: number | null;
  currency: string | null;
  originalText: string;
  confidence: number;
  extractionMethod: 'currency_symbol' | 'currency_code' | 'written_number' | 'pattern_match' | 'unknown';
  warnings: string[];
}

/**
 * Amount Extraction Engine
 */
export class AmountExtractionEngine {
  // Currency symbol mapping
  private currencySymbols: Record<string, string> = {
    '₹': 'INR',
    '₨': 'PKR',
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '¢': 'USD',
    'Rs': 'INR',
    'rs': 'INR',
    'Rs.': 'INR',
    'rs.': 'INR',
    'AED': 'AED',
    'SAR': 'SAR',
    'SGD': 'SGD',
    'MYR': 'MYR',
  };

  // Bank-specific amount patterns
  private bankPatterns: Array<{
    bankName: string;
    pattern: RegExp;
    amountGroup: number;
  }> = [
    {
      bankName: 'HDFC',
      pattern: /₹\s?([\d,]+(?:\.\d{2})?)\s*(?:debited|credited|spent|transferred)/gi,
      amountGroup: 1,
    },
    {
      bankName: 'ICICI',
      pattern: /amount\s*(?:of)?\s*₹?\s*([\d,]+(?:\.\d{2})?)\s*(?:has\s*)?(?:debited|credited)/gi,
      amountGroup: 1,
    },
    {
      bankName: 'SBI',
      pattern: /₹\s*([\d,]+(?:\.\d{2})?)\s*(?:withdrawn|deposited|deducted|received)/gi,
      amountGroup: 1,
    },
    {
      bankName: 'Axis',
      pattern: /(?:debited|credited|paid|received)\s*(?:from|to)?\s*(?:account|a\/c)?\s*₹\s*([\d,]+(?:\.\d{2})?)/gi,
      amountGroup: 1,
    },
    {
      bankName: 'PayPal',
      pattern: /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:sent|received|transferred)/gi,
      amountGroup: 1,
    },
    {
      bankName: 'Google Pay',
      pattern: /(?:sent|received)\s*₹\s*([\d,]+(?:\.\d{2})?)/gi,
      amountGroup: 1,
    },
    {
      bankName: 'PhonePe',
      pattern: /(?:paid|received)\s*₹\s*([\d,]+(?:\.\d{2})?)/gi,
      amountGroup: 1,
    },
  ];

  // Written number mappings
  private writtenNumbers: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    thousand: 1000,
    lakh: 100000,
    million: 1000000,
    crore: 10000000,
  };

  // Keywords to exclude (balance, limit, available, etc.)
  private excludeKeywords: string[] = [
    'balance',
    'available',
    'limit',
    'min.due',
    'minimum',
    'maximum',
    'deposit',
    'cash',
    'atm',
    'withdrawal',
    'opening',
    'closing',
    'offer',
    'cashback',
    'reward',
    'interest',
  ];

  /**
   * Extract amount from transaction message
   */
  extract(message: string): AmountExtractionResult {
    const cleanMessage = message.trim();

    // Try bank-specific patterns first
    const bankResult = this.extractFromBankPatterns(cleanMessage);
    if (bankResult.amount !== null && bankResult.confidence > 0.8) {
      return bankResult;
    }

    // Try currency symbol patterns
    const currencyResult = this.extractFromCurrencySymbols(cleanMessage);
    if (currencyResult.amount !== null && currencyResult.confidence > 0.75) {
      return currencyResult;
    }

    // Try written numbers
    const writtenResult = this.extractFromWrittenNumbers(cleanMessage);
    if (writtenResult.amount !== null && writtenResult.confidence > 0.7) {
      return writtenResult;
    }

    // Try generic number patterns
    const genericResult = this.extractFromGenericPatterns(cleanMessage);
    if (genericResult.amount !== null) {
      return genericResult;
    }

    return {
      amount: null,
      currency: null,
      originalText: cleanMessage,
      confidence: 0,
      extractionMethod: 'unknown',
      warnings: ['No amount found in message'],
    };
  }

  /**
   * Extract amount using bank-specific patterns
   */
  private extractFromBankPatterns(message: string): AmountExtractionResult {
    for (const bankPattern of this.bankPatterns) {
      const match = bankPattern.pattern.exec(message);
      if (match) {
        const amountStr = match[bankPattern.amountGroup];
        const amount = this.parseAmount(amountStr);

        if (amount > 0 && this.isValidAmount(amount, message)) {
          return {
            amount,
            currency: this.extractCurrency(message),
            originalText: match[0],
            confidence: 0.95,
            extractionMethod: 'pattern_match',
            warnings: [],
          };
        }
      }
    }

    return {
      amount: null,
      currency: null,
      originalText: message,
      confidence: 0,
      extractionMethod: 'unknown',
      warnings: [],
    };
  }

  /**
   * Extract amount using currency symbols
   */
  private extractFromCurrencySymbols(message: string): AmountExtractionResult {
    // Pattern: currency symbol followed by optional space and number
    const currencyPattern = /([₹₨$€£¥¢]|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/gi;
    const matches = [...message.matchAll(currencyPattern)];

    if (matches.length === 0) {
      return {
        amount: null,
        currency: null,
        originalText: message,
        confidence: 0,
        extractionMethod: 'currency_symbol',
        warnings: [],
      };
    }

    // Find the best match (largest amount, excluding obvious non-transaction amounts)
    let bestMatch = null;
    let bestAmount = 0;
    let bestConfidence = 0;

    for (const match of matches) {
      const symbol = match[1];
      const amountStr = match[2];
      const amount = this.parseAmount(amountStr);

      if (amount > 0 && this.isValidAmount(amount, message)) {
        const isExcluded = this.isExcludedContext(message, match.index || 0);
        if (!isExcluded && amount > bestAmount) {
          bestMatch = match;
          bestAmount = amount;
          bestConfidence = 0.85;
        }
      }
    }

    if (bestMatch) {
      const symbol = bestMatch[1];
      const currency = this.currencySymbols[symbol] || 'UNKNOWN';

      return {
        amount: bestAmount,
        currency,
        originalText: bestMatch[0],
        confidence: bestConfidence,
        extractionMethod: 'currency_symbol',
        warnings: [],
      };
    }

    return {
      amount: null,
      currency: null,
      originalText: message,
      confidence: 0,
      extractionMethod: 'currency_symbol',
      warnings: ['Currency symbol found but no valid amount'],
    };
  }

  /**
   * Extract amount from written numbers
   */
  private extractFromWrittenNumbers(message: string): AmountExtractionResult {
    const lowerMessage = message.toLowerCase();

    // Pattern: word numbers with possible modifiers (e.g., "five thousand", "fifty rupees")
    for (const [word, value] of Object.entries(this.writtenNumbers)) {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi');
      if (pattern.test(lowerMessage)) {
        // Check for multiplier keywords
        const multiplierPatterns = [
          { pattern: /(\w+)\s+thousand\b/gi, multiplier: 1000 },
          { pattern: /(\w+)\s+lakh\b/gi, multiplier: 100000 },
          { pattern: /(\w+)\s+million\b/gi, multiplier: 1000000 },
          { pattern: /(\w+)\s+crore\b/gi, multiplier: 10000000 },
        ];

        for (const { pattern, multiplier } of multiplierPatterns) {
          const match = pattern.exec(lowerMessage);
          if (match) {
            const baseWord = match[1];
            const baseValue = this.writtenNumbers[baseWord.toLowerCase()] || 0;
            if (baseValue > 0 && baseValue < 1000) {
              const amount = baseValue * multiplier;
              return {
                amount,
                currency: this.extractCurrency(message),
                originalText: match[0],
                confidence: 0.65,
                extractionMethod: 'written_number',
                warnings: ['Amount is written as words, verify accuracy'],
              };
            }
          }
        }
      }
    }

    return {
      amount: null,
      currency: null,
      originalText: message,
      confidence: 0,
      extractionMethod: 'written_number',
      warnings: [],
    };
  }

  /**
   * Extract amount from generic number patterns
   */
  private extractFromGenericPatterns(message: string): AmountExtractionResult {
    // Pattern: numbers with optional commas and decimals
    const numberPattern = /\b([\d,]+(?:\.\d{2})?)\b/g;
    const matches = [...message.matchAll(numberPattern)];

    if (matches.length === 0) {
      return {
        amount: null,
        currency: null,
        originalText: message,
        confidence: 0,
        extractionMethod: 'pattern_match',
        warnings: ['No numbers found'],
      };
    }

    // Filter out unlikely amounts (too small or too large)
    const validMatches = matches.filter((match) => {
      const amount = this.parseAmount(match[1]);
      return (
        amount >= 1 &&
        amount <= 10000000 &&
        this.isValidAmount(amount, message)
      );
    });

    if (validMatches.length === 0) {
      return {
        amount: null,
        currency: null,
        originalText: message,
        confidence: 0,
        extractionMethod: 'pattern_match',
        warnings: ['No valid transaction amounts found'],
      };
    }

    // Return the largest valid amount (most likely transaction amount)
    const bestMatch = validMatches.reduce((prev, current) => {
      const prevAmount = this.parseAmount(prev[1]);
      const currentAmount = this.parseAmount(current[1]);
      return currentAmount > prevAmount ? current : prev;
    });

    const amount = this.parseAmount(bestMatch[1]);

    return {
      amount,
      currency: this.extractCurrency(message),
      originalText: bestMatch[0],
      confidence: 0.5,
      extractionMethod: 'pattern_match',
      warnings: [
        'Generic number extraction - low confidence',
        'Recommend verification against bank details',
      ],
    };
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amountStr: string): number {
    // Remove commas
    const cleaned = amountStr.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.abs(parsed); // Return absolute value
  }

  /**
   * Check if amount is valid (not obviously wrong)
   */
  private isValidAmount(amount: number, message: string): boolean {
    // Reject obviously invalid amounts
    if (amount <= 0 || amount > 99999999) {
      return false;
    }

    // Reject if in excluded context (e.g., after "balance", "limit")
    if (this.isExcludedContext(message, 0)) {
      return false;
    }

    return true;
  }

  /**
   * Check if amount is in excluded context
   */
  private isExcludedContext(message: string, matchIndex: number): boolean {
    const beforeMatch = message.substring(Math.max(0, matchIndex - 100), matchIndex);

    for (const keyword of this.excludeKeywords) {
      if (beforeMatch.toLowerCase().includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract currency from message
   */
  private extractCurrency(message: string): string {
    for (const [symbol, currency] of Object.entries(this.currencySymbols)) {
      if (message.includes(symbol)) {
        return currency;
      }
    }

    // Check for currency codes
    const currencyCodePattern = /\b(USD|EUR|GBP|JPY|INR|AED|SAR|SGD|MYR)\b/i;
    const match = currencyCodePattern.exec(message);

    return match ? match[1].toUpperCase() : 'UNKNOWN';
  }

  /**
   * Extract transaction data (used by detection engine)
   */
  extractTransactionData(message: string): Partial<ExtractedTransactionData> {
    const result = this.extract(message);

    return {
      amount: result.amount,
      currency: result.currency,
    };
  }
}

export default AmountExtractionEngine;
