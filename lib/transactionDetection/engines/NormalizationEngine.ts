/**
 * Message Normalization Engine
 * Cleans and prepares messages for transaction detection
 */

import { NormalizedMessage, UnifiedMessage } from '../types';

/**
 * Normalization Engine
 * Responsible for cleaning and standardizing messages
 */
export class MessageNormalizationEngine {
  private readonly urlPattern = /https?:\/\/[^\s]+/gi;
  private readonly otpPattern = /\b[0-9]{4,6}\b(?=.*(?:otp|verify|confirm|password))/gi;
  private readonly emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  private readonly hashtagPattern = /#[A-Za-z0-9]+/g;
  private readonly promotionalKeywords = [
    'offer', 'deal', 'discount', 'cashback', 'rewards', 'promotional',
    'limited', 'buy', 'shop', 'sale', 'click here', 'visit us'
  ];

  /**
   * Normalize a unified message
   */
  normalize(message: UnifiedMessage): NormalizedMessage {
    let cleanText = message.rawText;
    const noiseRemoved: string[] = [];
    const normalizations: string[] = [];

    // 1. Remove URLs
    const urlMatches = cleanText.match(this.urlPattern) || [];
    if (urlMatches.length > 0) {
      noiseRemoved.push(...urlMatches);
      cleanText = cleanText.replace(this.urlPattern, '').trim();
      normalizations.push('urls_removed');
    }

    // 2. Remove OTP patterns
    const otpMatches = cleanText.match(this.otpPattern) || [];
    if (otpMatches.length > 0) {
      noiseRemoved.push(...otpMatches);
      cleanText = cleanText.replace(this.otpPattern, '').trim();
      normalizations.push('otp_removed');
    }

    // 3. Remove emails (unless they're part of essential info)
    const emailMatches = cleanText.match(this.emailPattern) || [];
    if (emailMatches.length > 0) {
      // Only remove if not in critical context
      const beforeRemoval = cleanText;
      cleanText = cleanText.replace(this.emailPattern, '').trim();
      if (this.isEmailCritical(beforeRemoval, emailMatches)) {
        cleanText = beforeRemoval;
      } else {
        noiseRemoved.push(...emailMatches);
        normalizations.push('emails_removed');
      }
    }

    // 4. Remove hashtags
    const hashtagMatches = cleanText.match(this.hashtagPattern) || [];
    if (hashtagMatches.length > 0) {
      noiseRemoved.push(...hashtagMatches);
      cleanText = cleanText.replace(this.hashtagPattern, '').trim();
      normalizations.push('hashtags_removed');
    }

    // 5. Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    normalizations.push('whitespace_normalized');

    // 6. Normalize case for specific keywords
    cleanText = this.normalizeKeywordCase(cleanText);
    normalizations.push('keywords_normalized');

    // 7. Standardize currency symbols
    cleanText = this.normalizeCurrency(cleanText);
    normalizations.push('currency_standardized');

    // 8. Standardize date formats
    cleanText = this.normalizeDates(cleanText);
    normalizations.push('dates_standardized');

    // 9. Strip marketing text
    const marketingResult = this.stripMarketingText(cleanText);
    cleanText = marketingResult.text;
    if (marketingResult.removed.length > 0) {
      noiseRemoved.push(...marketingResult.removed);
      normalizations.push('marketing_text_removed');
    }

    return {
      ...message,
      cleanText,
      originalRawText: message.rawText,
      processingMetadata: {
        noiseRemoved,
        normalizations,
      },
    };
  }

  /**
   * Check if email is critical (part of account identifier or important info)
   */
  private isEmailCritical(text: string, emails: string[]): boolean {
    const criticalKeywords = ['account', 'registered', 'associated', 'linked'];
    return criticalKeywords.some(kw =>
      criticalKeywords.some(keyword =>
        text.toLowerCase().includes(keyword) &&
        emails.some(email => text.indexOf(email) > 0)
      )
    );
  }

  /**
   * Normalize keyword case
   */
  private normalizeKeywordCase(text: string): string {
    // Normalize transaction type keywords
    const replacements: [RegExp, string][] = [
      [/\bTXN\b/gi, 'transaction'],
      [/\bAMT\b/gi, 'amount'],
      [/\bDEBIT\b/gi, 'debit'],
      [/\bCREDIT\b/gi, 'credit'],
      [/\bTRANSFER\b/gi, 'transfer'],
      [/\bACCOUNT\b/gi, 'account'],
      [/\bA\/C\b/gi, 'account'],
      [/\bREF\b/gi, 'reference'],
      [/\bINV\b/gi, 'invoice'],
      [/\bDT\b/gi, 'date'],
    ];

    let result = text;
    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  /**
   * Normalize currency symbols
   */
  private normalizeCurrency(text: string): string {
    const currencyMappings: [RegExp, string][] = [
      [/₹/g, 'INR '],
      [/\$(?![\d])/g, 'USD '],
      [/€/g, 'EUR '],
      [/£/g, 'GBP '],
      [/¥/g, 'JPY '],
    ];

    let result = text;
    for (const [pattern, replacement] of currencyMappings) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  /**
   * Standardize date formats
   * Converts various date formats to ISO 8601
   */
  private normalizeDates(text: string): string {
    // This is a basic normalization - keeps dates as-is for pattern matching
    // Actual parsing happens in extraction engine
    return text;
  }

  /**
   * Strip marketing and promotional text
   */
  private stripMarketingText(text: string): { text: string; removed: string[] } {
    const sentences = text.split(/[.!?]/);
    const removed: string[] = [];
    const kept: string[] = [];

    for (const sentence of sentences) {
      if (this.isMarketingText(sentence)) {
        removed.push(sentence.trim());
      } else {
        kept.push(sentence.trim());
      }
    }

    return {
      text: kept.join('. ').trim(),
      removed,
    };
  }

  /**
   * Detect if sentence is marketing/promotional
   */
  private isMarketingText(sentence: string): boolean {
    const lower = sentence.toLowerCase();
    const keywordCount = this.promotionalKeywords.filter(kw =>
      lower.includes(kw)
    ).length;
    
    return keywordCount > 0;
  }

  /**
   * Extract all numbers from text (for pattern matching aid)
   */
  extractNumbers(text: string): number[] {
    const numberPattern = /\d+(?:\.\d+)?/g;
    const matches = text.match(numberPattern) || [];
    return matches.map(num => parseFloat(num));
  }

  /**
   * Extract date strings from text
   */
  extractDateStrings(text: string): string[] {
    const datePatterns = [
      /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/g, // DD/MM/YYYY
      /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/g, // YYYY/MM/DD
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b(?:today|tomorrow|yesterday)\b/gi,
    ];

    const results: string[] = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern) || [];
      results.push(...matches);
    }
    return [...new Set(results)];
  }
}

export const normalizationEngine = new MessageNormalizationEngine();
