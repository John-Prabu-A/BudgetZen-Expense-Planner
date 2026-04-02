// @ts-nocheck
/**
 * Amount Extraction Engine
 * Specialized engine for extracting monetary amounts from transaction messages.
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

export class AmountExtractionEngine {
  private currencySymbols: Record<string, string> = {
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    '₹': 'INR',
    'â‚¹': 'INR',
    'â‚¨': 'PKR',
    '$': 'USD',
    'â‚¬': 'EUR',
    'Â£': 'GBP',
    'Â¥': 'JPY',
    'Â¢': 'USD',
    'Rs': 'INR',
    'rs': 'INR',
    'Rs.': 'INR',
    'rs.': 'INR',
    'AED': 'AED',
    'SAR': 'SAR',
    'SGD': 'SGD',
    'MYR': 'MYR',
  };

  private bankPatterns: Array<{
    bankName: string;
    pattern: RegExp;
    amountGroup: number;
  }> = [
    { bankName: 'HDFC', pattern: /(?:₹|â‚¹)\s?([\d,]+(?:\.\d{1,2})?)\s*(?:debited|credited|spent|transferred)/i, amountGroup: 1 },
    { bankName: 'ICICI', pattern: /(?:amount|spent|payment)[^₹â‚¹\d]*(?:₹|â‚¹)?\s*([\d,]+(?:\.\d{1,2})?).*(?:debited|credited|charged|deducted)/i, amountGroup: 1 },
    { bankName: 'SBI', pattern: /(?:₹|â‚¹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:withdrawn|deposited|deducted|received)/i, amountGroup: 1 },
    { bankName: 'Axis', pattern: /(?:debited|credited|paid|received)\s*(?:from|to)?\s*(?:account|a\/c)?\s*(?:₹|â‚¹)\s*([\d,]+(?:\.\d{1,2})?)/i, amountGroup: 1 },
    { bankName: 'PayPal', pattern: /\$\s*([\d,]+(?:\.\d{1,2})?)\s*(?:sent|received|transferred)/i, amountGroup: 1 },
    { bankName: 'Google Pay', pattern: /(?:sent|received)\s*(?:₹|â‚¹)\s*([\d,]+(?:\.\d{1,2})?)/i, amountGroup: 1 },
    { bankName: 'PhonePe', pattern: /(?:paid|received)\s*(?:₹|â‚¹)\s*([\d,]+(?:\.\d{1,2})?)/i, amountGroup: 1 },
  ];

  private writtenNumbers: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
    hundred: 100, thousand: 1000, lakh: 100000, million: 1000000, crore: 10000000,
  };

  private excludeKeywords: string[] = [
    'balance',
    'available',
    'limit',
    'min.due',
    'minimum',
    'maximum',
    'opening',
    'closing',
    'offer',
    'reward',
  ];

  extract(message: string): AmountExtractionResult {
    const cleanMessage = (message || '').trim();
    if (!cleanMessage) {
      return {
        amount: null,
        currency: null,
        originalText: cleanMessage,
        confidence: 0,
        extractionMethod: 'unknown',
        warnings: ['No amount found in message'],
      };
    }

    const bankResult = this.extractFromBankPatterns(cleanMessage);
    if (bankResult.amount !== null && bankResult.confidence > 0.8) return bankResult;

    const currencyResult = this.extractFromCurrencySymbols(cleanMessage);
    if (currencyResult.amount !== null && currencyResult.confidence > 0.75) return currencyResult;

    const writtenResult = this.extractFromWrittenNumbers(cleanMessage);
    if (writtenResult.amount !== null && writtenResult.confidence > 0.6) return writtenResult;

    const genericResult = this.extractFromGenericPatterns(cleanMessage);
    if (genericResult.amount !== null) return genericResult;

    return {
      amount: null,
      currency: null,
      originalText: cleanMessage,
      confidence: 0,
      extractionMethod: 'unknown',
      warnings: ['No amount found in message'],
    };
  }

  private extractFromBankPatterns(message: string): AmountExtractionResult {
    for (const bankPattern of this.bankPatterns) {
      bankPattern.pattern.lastIndex = 0;
      const match = bankPattern.pattern.exec(message);
      if (!match) continue;

      const amount = this.parseAmount(match[bankPattern.amountGroup]);
      const index = match.index ?? 0;
      if (amount > 0 && this.isValidAmount(amount, message, index)) {
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

    return {
      amount: null,
      currency: null,
      originalText: message,
      confidence: 0,
      extractionMethod: 'unknown',
      warnings: [],
    };
  }

  private extractFromCurrencySymbols(message: string): AmountExtractionResult {
    const currencyPatternNormalized = /([₹â‚¹$€£¥]|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/gi;
    const normalizedMatches = [...message.matchAll(currencyPatternNormalized)];

    if (normalizedMatches.length > 0) {
      let bestMatch: RegExpMatchArray | null = null;
      let bestAmount = 0;
      let bestScore = Number.NEGATIVE_INFINITY;

      for (const match of normalizedMatches) {
        const amount = this.parseAmount(match[2]);
        const index = match.index ?? 0;
        if (!this.isValidAmount(amount, message, index) || this.isLikelyPhoneContext(message, index, amount)) {
          continue;
        }

        const score =
          0.55 +
          (this.isTransactionContext(message, index) ? 0.45 : 0) -
          (this.isExcludedContext(message, index) ? 1.0 : 0) +
          Math.min(amount / 1_000_000, 0.05);

        if (score > bestScore) {
          bestScore = score;
          bestAmount = amount;
          bestMatch = match;
        }
      }

      if (bestMatch && bestScore > 0.2) {
        return {
          amount: bestAmount,
          currency: this.extractCurrency(message),
          originalText: bestMatch[0],
          confidence: Math.min(0.9, Math.max(0.65, bestScore)),
          extractionMethod: 'currency_symbol',
          warnings: [],
        };
      }

      const fallback = normalizedMatches
        .map((match) => ({
          amount: this.parseAmount(match[2]),
          text: match[0],
        }))
        .filter((candidate) => candidate.amount > 0)
        .sort((a, b) => b.amount - a.amount)[0];

      if (fallback) {
        return {
          amount: fallback.amount,
          currency: this.extractCurrency(message),
          originalText: fallback.text,
          confidence: 0.45,
          extractionMethod: 'currency_symbol',
          warnings: ['Fallback extraction used from currency candidates'],
        };
      }
    }

    const currencyPattern = /([₹â‚¹â‚¨$â‚¬Â£Â¥Â¢]|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/gi;
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

    let bestMatch: RegExpMatchArray | null = null;
    let bestAmount = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const match of matches) {
      const amount = this.parseAmount(match[2]);
      const index = match.index ?? 0;
      if (!this.isValidAmount(amount, message, index)) continue;

      const score =
        0.6 +
        (this.isTransactionContext(message, index) ? 0.35 : 0) -
        (this.isExcludedContext(message, index) ? 0.6 : 0) +
        Math.min(amount / 1_000_000, 0.05);

      if (score > bestScore) {
        bestScore = score;
        bestAmount = amount;
        bestMatch = match;
      }
    }

    if (bestMatch && bestScore > 0.35) {
      const currency = this.currencySymbols[bestMatch[1]] || 'UNKNOWN';
      return {
        amount: bestAmount,
        currency,
        originalText: bestMatch[0],
        confidence: Math.min(0.9, Math.max(0.65, bestScore)),
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

  private extractFromWrittenNumbers(message: string): AmountExtractionResult {
    const lowerMessage = message.toLowerCase();
    const phrasePattern = /\b((?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|million|crore|and|-|\s)+)\b(?:rupees?|inr|rs)?/gi;
    const matches = [...lowerMessage.matchAll(phrasePattern)];

    for (const match of matches) {
      const phrase = match[1].replace(/-/g, ' ').trim();
      const amount = this.parseWrittenPhrase(phrase);
      const index = match.index ?? 0;
      if (amount > 0 && this.isValidAmount(amount, message, index)) {
        return {
          amount,
          currency: this.extractCurrency(message),
          originalText: match[0],
          confidence: 0.68,
          extractionMethod: 'written_number',
          warnings: ['Amount is written as words, verify accuracy'],
        };
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

  private extractFromGenericPatterns(message: string): AmountExtractionResult {
    const numberPattern = /\b([\d,]+(?:\.\d{1,2})?)\b/g;
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

    const candidates = matches.filter((match) => {
      const amount = this.parseAmount(match[1]);
      const index = match.index ?? 0;
      return (
        amount >= 0.01 &&
        amount <= 999999999 &&
        this.isValidAmount(amount, message, index) &&
        !this.isLikelyPhoneContext(message, index, amount)
      );
    });

    if (candidates.length === 0) {
      return {
        amount: null,
        currency: null,
        originalText: message,
        confidence: 0,
        extractionMethod: 'pattern_match',
        warnings: ['No valid transaction amounts found'],
      };
    }

    const best = candidates.reduce((prev, current) => {
      const prevIndex = prev.index ?? 0;
      const currentIndex = current.index ?? 0;
      const prevAmount = this.parseAmount(prev[1]);
      const currentAmount = this.parseAmount(current[1]);

      const prevScore =
        (this.isTransactionContext(message, prevIndex) ? 2 : 0) -
        (this.isExcludedContext(message, prevIndex) ? 1 : 0) +
        prevAmount / 1_000_000;

      const currentScore =
        (this.isTransactionContext(message, currentIndex) ? 2 : 0) -
        (this.isExcludedContext(message, currentIndex) ? 1 : 0) +
        currentAmount / 1_000_000;

      return currentScore > prevScore ? current : prev;
    });

    return {
      amount: this.parseAmount(best[1]),
      currency: this.extractCurrency(message),
      originalText: best[0],
      confidence: 0.5,
      extractionMethod: 'pattern_match',
      warnings: ['Generic number extraction - low confidence', 'Recommend verification against bank details'],
    };
  }

  private parseAmount(amountStr: string): number {
    if (typeof amountStr !== 'string' || amountStr.length === 0) {
      return 0;
    }
    const cleaned = amountStr.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : Math.abs(parsed);
  }

  private isValidAmount(amount: number, message: string, matchIndex: number = 0): boolean {
    if (amount <= 0 || amount > 999999999) return false;
    if (this.isHardExcludedContext(message, matchIndex)) return false;
    if (this.isExcludedContext(message, matchIndex) && !this.isTransactionContext(message, matchIndex)) return false;
    return true;
  }

  private isExcludedContext(message: string, matchIndex: number): boolean {
    const beforeMatch = message.substring(Math.max(0, matchIndex - 25), matchIndex).toLowerCase();
    return this.excludeKeywords.some((keyword) => beforeMatch.includes(keyword));
  }

  private isHardExcludedContext(message: string, matchIndex: number): boolean {
    const beforeMatch = message.substring(Math.max(0, matchIndex - 12), matchIndex).toLowerCase();
    return ['balance', 'limit', 'min.due', 'minimum', 'maximum'].some((keyword) => beforeMatch.includes(keyword));
  }

  private extractCurrency(message: string): string {
    if (message.includes('€')) return 'EUR';
    if (message.includes('£')) return 'GBP';
    if (message.includes('¥')) return 'JPY';
    if (message.includes('₹')) return 'INR';

    for (const [symbol, currency] of Object.entries(this.currencySymbols)) {
      if (message.includes(symbol)) return currency;
    }
    const currencyCodePattern = /\b(USD|EUR|GBP|JPY|INR|AED|SAR|SGD|MYR)\b/i;
    const match = currencyCodePattern.exec(message);
    return match ? match[1].toUpperCase() : 'UNKNOWN';
  }

  private isTransactionContext(message: string, matchIndex: number): boolean {
    const window = message
      .substring(Math.max(0, matchIndex - 40), Math.min(message.length, matchIndex + 40))
      .toLowerCase();
    const transactionKeywords = [
      'debited', 'credited', 'spent', 'paid', 'payment', 'charged', 'withdrawn', 'received',
      'transfer', 'transferred', 'purchased', 'purchase', 'refund', 'salary', 'premium', 'emi',
    ];
    return transactionKeywords.some((keyword) => window.includes(keyword));
  }

  private parseWrittenPhrase(phrase: string): number {
    const tokens = phrase
      .split(/\s+/)
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length > 0 && token !== 'and');

    if (tokens.length === 0) return 0;

    let total = 0;
    let current = 0;

    for (const token of tokens) {
      const value = this.writtenNumbers[token];
      if (value === undefined) continue;

      if (value === 100) {
        current = (current || 1) * value;
      } else if (value >= 1000) {
        total += (current || 1) * value;
        current = 0;
      } else {
        current += value;
      }
    }

    return total + current;
  }

  private isLikelyPhoneContext(message: string, matchIndex: number, amount: number): boolean {
    const beforeMatch = message.substring(Math.max(0, matchIndex - 15), matchIndex).toLowerCase();
    if (beforeMatch.includes('call') || beforeMatch.includes('phone') || beforeMatch.includes('contact')) {
      return true;
    }
    return false;
  }

  extractTransactionData(message: string): Partial<ExtractedTransactionData> {
    const result = this.extract(message);
    return {
      amount: result.amount,
      currency: result.currency,
    };
  }
}

export default AmountExtractionEngine;
