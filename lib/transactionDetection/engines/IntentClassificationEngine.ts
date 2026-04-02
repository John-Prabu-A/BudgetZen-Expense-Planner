/**
 * Intent Classification Engine
 * Specialized engine for classifying transaction intent (Debit, Credit, Transfer, Ignore)
 * 
 * Key responsibilities:
 * - Distinguish between debit and credit transactions
 * - Identify transfers between accounts
 * - Filter out spam and alerts
 * - Provide confidence scores for each classification
 */

export interface IntentClassificationResult {
  intent: 'Debit' | 'Credit' | 'Transfer' | 'Ignore';
  confidence: number;
  keywords: string[];
  matchedPatterns: string[];
  reasoning: string;
  warnings: string[];
}

/**
 * Intent Classification Engine
 */
export class IntentClassificationEngine {
  private strongIgnoreKeywords = new Set([
    'fraud',
    'suspicious',
    'blocked',
    'declined',
    'failed',
    'otp',
    'password',
    'verification',
    'kyc',
    'unauthorized',
    'offer',
    'promotional',
    'update',
  ]);

  // Debit keywords and patterns
  private debitKeywords: string[] = [
    'debited',
    'debit',
    'charged',
    'spent',
    'paid',
    'payment',
    'transaction',
    'spent',
    'withdrawn',
    'deducted',
    'purchase',
    'bought',
    'transferred',
    'sent',
    'swiped',
    'txn',
    'txn:',
    'card used',
    'card swiped',
    'atm',
    'cash withdrawal',
    'emi paid',
    'bill paid',
    'fee deducted',
    'charge',
    'discount applied',
    'deduction',
    'amount due',
  ];

  // Credit keywords and patterns
  private creditKeywords: string[] = [
    'credited',
    'credit',
    'received',
    'income',
    'salary',
    'refund',
    'reimbursement',
    'cashback',
    'bonus',
    'interest',
    'dividend',
    'credited',
    'deposit',
    'amount received',
    'incoming',
    'recipient',
    'earning',
    'payment received',
    'recharge',
    'topup',
    'top up',
    'added',
    'reward',
    'reversal',
    'return',
  ];

  // Transfer keywords and patterns
  private transferKeywords: string[] = [
    'transferred',
    'transfer',
    'sent to',
    'received from',
    'remittance',
    'upi',
    'account transfer',
    'neft',
    'rtgs',
    'imps',
    'p2p',
    'peer to peer',
    'money transfer',
    'fund transfer',
  ];

  // Spam/Alert keywords (ignore patterns)
  private ignoreKeywords: string[] = [
    'alert',
    'fraud',
    'suspicious',
    'unauthorized',
    'blocked',
    'card blocked',
    'card declined',
    'declined',
    'failed',
    'unsuccessful',
    'otp',
    'password',
    'security',
    'verification',
    'limit',
    'exceeds',
    'expired',
    'expiry',
    'balance enquiry',
    'account statement',
    'mini statement',
    'update your details',
    'know your customer',
    'kyc',
    'upgrade',
    'promotion',
    'offer',
    'promotional',
    'marketing',
    'survey',
    'click here',
    'verify account',
    'confirm identity',
    'update account',
    'update your account details',
  ];

  // Bank-specific intent patterns
  private bankIntentPatterns: Array<{
    bank: string;
    debitPattern: RegExp;
    creditPattern: RegExp;
    ignorePattern: RegExp;
  }> = [
    {
      bank: 'HDFC',
      debitPattern: /(?:debited|spent|charged)\s*(?:from|on|to)?\s*(?:your|your account)?/i,
      creditPattern: /(?:credited|received)\s*(?:to|in|your)?/i,
      ignorePattern: /(?:alert|blocked|fraud|declined|otp|password)/i,
    },
    {
      bank: 'ICICI',
      debitPattern: /(?:amount|spent|payment).*(?:debited|charged|deducted)/i,
      creditPattern: /(?:amount|credited).*(?:credited|received)/i,
      ignorePattern: /(?:fraud alert|suspicious|card blocked|transaction failed)/i,
    },
    {
      bank: 'SBI',
      debitPattern: /(?:withdrawn|debited)(?:\s+(?:from\s+)?(?:account)?)?/i,
      creditPattern: /(?:deposited|credited)\s+(?:to\s+)?(?:account)?/i,
      ignorePattern: /(?:alert|blocked|unauthorized|limit exceeded)/i,
    },
    {
      bank: 'PhonePe',
      debitPattern: /(?:you\s+)?(?:paid|sent)\s+[₹$€£¥]\s*\d+/i,
      creditPattern: /(?:you\s+)?(?:received|got)\s+[₹$€£¥]\s*\d+/i,
      ignorePattern: /(?:verification|otp|password|update profile)/i,
    },
    {
      bank: 'Google Pay',
      debitPattern: /(?:you\s+)?(?:sent|paid|transferred)\s+[₹$€£¥]\s*\d+/i,
      creditPattern: /(?:you\s+)?(?:received)\s+[₹$€£¥]\s*\d+/i,
      ignorePattern: /(?:otp|verify|security|update)/i,
    },
    {
      bank: 'Paytm',
      debitPattern: /(?:money sent|payment done|amount paid)\s+[₹$€£¥]\s*\d+/i,
      creditPattern: /(?:money received|amount credited)\s+[₹$€£¥]\s*\d+/i,
      ignorePattern: /(?:otp|verification|kyc|promotion)/i,
    },
  ];

  /**
   * Classify transaction intent from message
   */
  classify(message: string, senderIdentifier: string = ''): IntentClassificationResult {
    const cleanMessage = message.toLowerCase();

    // Try bank-specific patterns first
    const bankResult = this.classifyUsingBankPatterns(cleanMessage, senderIdentifier);
    if (bankResult.confidence > 0.8) {
      return bankResult;
    }

    // Try keyword matching
    const keywordResult = this.classifyUsingKeywords(cleanMessage);
    if (keywordResult.confidence > 0.7) {
      return keywordResult;
    }

    // Try combination of patterns
    const combinedResult = this.classifyUsingCombinedPatterns(cleanMessage);
    if (combinedResult.confidence > 0.6) {
      return combinedResult;
    }

    // Default: Unknown - should be ignored
    return {
      intent: 'Ignore',
      confidence: 0.3,
      keywords: [],
      matchedPatterns: [],
      reasoning: 'Unable to determine transaction intent with sufficient confidence',
      warnings: [
        'Could not classify intent',
        'Message may not contain transaction information',
      ],
    };
  }

  /**
   * Classify using bank-specific patterns
   */
  private classifyUsingBankPatterns(
    cleanMessage: string,
    senderIdentifier: string
  ): IntentClassificationResult {
    for (const bankPattern of this.bankIntentPatterns) {
      if (!senderIdentifier.toLowerCase().includes(bankPattern.bank.toLowerCase())) {
        continue;
      }

      // Check ignore pattern first
      if (bankPattern.ignorePattern.test(cleanMessage)) {
        return {
          intent: 'Ignore',
          confidence: 0.9,
          keywords: this.extractMatchingKeywords(cleanMessage, this.ignoreKeywords),
          matchedPatterns: [bankPattern.bank + '_ignore_pattern'],
          reasoning: `Matched ${bankPattern.bank} ignore pattern - likely spam/alert`,
          warnings: [],
        };
      }

      // Check debit pattern
      if (bankPattern.debitPattern.test(cleanMessage)) {
        return {
          intent: 'Debit',
          confidence: 0.85,
          keywords: this.extractMatchingKeywords(cleanMessage, this.debitKeywords),
          matchedPatterns: [bankPattern.bank + '_debit_pattern'],
          reasoning: `Matched ${bankPattern.bank} debit pattern`,
          warnings: [],
        };
      }

      // Check credit pattern
      if (bankPattern.creditPattern.test(cleanMessage)) {
        return {
          intent: 'Credit',
          confidence: 0.85,
          keywords: this.extractMatchingKeywords(cleanMessage, this.creditKeywords),
          matchedPatterns: [bankPattern.bank + '_credit_pattern'],
          reasoning: `Matched ${bankPattern.bank} credit pattern`,
          warnings: [],
        };
      }
    }

    return {
      intent: 'Ignore',
      confidence: 0,
      keywords: [],
      matchedPatterns: [],
      reasoning: 'No bank-specific patterns matched',
      warnings: [],
    };
  }

  /**
   * Classify using keyword matching
   */
  private classifyUsingKeywords(cleanMessage: string): IntentClassificationResult {
    // Check ignore keywords first (highest priority)
    const ignoreMatches = this.extractMatchingKeywords(cleanMessage, this.ignoreKeywords);
    if (
      ignoreMatches.length > 0 &&
      ignoreMatches.some((keyword) => this.strongIgnoreKeywords.has(keyword))
    ) {
      return {
        intent: 'Ignore',
        confidence: Math.min(0.95, 0.78 + ignoreMatches.length * 0.05),
        keywords: ignoreMatches,
        matchedPatterns: ['ignore_keywords'],
        reasoning: `Found strong ignore keywords (${ignoreMatches.join(', ')})`,
        warnings: [],
      };
    }

    if (ignoreMatches.length > 0 && !this.hasPositiveTransactionSignal(cleanMessage)) {
      return {
        intent: 'Ignore',
        confidence: Math.min(0.9, 0.7 + ignoreMatches.length * 0.04),
        keywords: ignoreMatches,
        matchedPatterns: ['ignore_keywords'],
        reasoning: `Found ${ignoreMatches.length} ignore keywords`,
        warnings: [],
      };
    }

    // Check transfer keywords
    const transferMatches = this.extractMatchingKeywords(cleanMessage, this.transferKeywords);
    if (transferMatches.length > 0 && !cleanMessage.includes('received from')) {
      return {
        intent: 'Transfer',
        confidence: Math.min(0.85, 0.7 + transferMatches.length * 0.05),
        keywords: transferMatches,
        matchedPatterns: ['transfer_keywords'],
        reasoning: `Found ${transferMatches.length} transfer keywords`,
        warnings: [],
      };
    }

    // Check debit keywords
    const debitMatches = this.extractMatchingKeywords(cleanMessage, this.debitKeywords);
    const creditMatches = this.extractMatchingKeywords(cleanMessage, this.creditKeywords);

    if (debitMatches.length > 0 && creditMatches.length > 0) {
      return {
        intent: 'Debit',
        confidence: 0.74,
        keywords: [...debitMatches, ...creditMatches],
        matchedPatterns: ['debit_credit_keywords_conflict'],
        reasoning: 'Found debit and credit keywords; defaulting to debit',
        warnings: ['Conflicting credit indicators found - manual review recommended'],
      };
    }

    if (debitMatches.length > 0) {
      return {
        intent: 'Debit',
        confidence: Math.min(0.79, 0.66 + debitMatches.length * 0.05),
        keywords: debitMatches,
        matchedPatterns: ['debit_keywords'],
        reasoning: `Found ${debitMatches.length} debit keywords`,
        warnings: [],
      };
    }

    if (creditMatches.length > 0) {
      return {
        intent: 'Credit',
        confidence: Math.min(0.79, 0.66 + creditMatches.length * 0.05),
        keywords: creditMatches,
        matchedPatterns: ['credit_keywords'],
        reasoning: `Found ${creditMatches.length} credit keywords`,
        warnings: [],
      };
    }

    return {
      intent: 'Ignore',
      confidence: 0,
      keywords: [],
      matchedPatterns: [],
      reasoning: 'No transaction keywords found',
      warnings: [],
    };
  }

  /**
   * Classify using combined patterns
   */
  private classifyUsingCombinedPatterns(cleanMessage: string): IntentClassificationResult {
    const debitMatches = this.extractMatchingKeywords(cleanMessage, this.debitKeywords);
    const creditMatches = this.extractMatchingKeywords(cleanMessage, this.creditKeywords);
    const transferMatches = this.extractMatchingKeywords(cleanMessage, this.transferKeywords);
    const ignoreMatches = this.extractMatchingKeywords(cleanMessage, this.ignoreKeywords);

    // Ignore takes priority
    if (
      ignoreMatches.length > 0 &&
      ignoreMatches.some((keyword) => this.strongIgnoreKeywords.has(keyword))
    ) {
      return {
        intent: 'Ignore',
        confidence: 0.82,
        keywords: ignoreMatches,
        matchedPatterns: ['combined_ignore'],
        reasoning: 'Strong ignore indicators found',
        warnings: [],
      };
    }

    // Check for conflicting signals
    const totalMatches = debitMatches.length + creditMatches.length + transferMatches.length;
    if (totalMatches === 0) {
      return {
        intent: 'Ignore',
        confidence: 0,
        keywords: [],
        matchedPatterns: [],
        reasoning: 'No transaction indicators found',
        warnings: [],
      };
    }

    // Determine dominant intent
    const debitScore = debitMatches.length;
    const creditScore = creditMatches.length;
    const transferScore = transferMatches.length;

    if (transferScore > debitScore && transferScore > creditScore) {
      return {
        intent: 'Transfer',
        confidence: 0.74,
        keywords: transferMatches,
        matchedPatterns: ['combined_transfer'],
        reasoning: 'Transfer indicators dominant',
        warnings: [],
      };
    }

    if (debitScore > creditScore) {
      return {
        intent: 'Debit',
        confidence: 0.74,
        keywords: debitMatches,
        matchedPatterns: ['combined_debit'],
        reasoning: 'Debit indicators dominant',
        warnings:
          creditScore > 0 ? ['Conflicting credit indicators found - manual review recommended'] : [],
      };
    }

    if (creditScore > debitScore) {
      return {
        intent: 'Credit',
        confidence: 0.74,
        keywords: creditMatches,
        matchedPatterns: ['combined_credit'],
        reasoning: 'Credit indicators dominant',
        warnings:
          debitScore > 0 ? ['Conflicting debit indicators found - manual review recommended'] : [],
      };
    }

    if (debitScore > 0 && creditScore > 0) {
      return {
        intent: 'Debit',
        confidence: 0.66,
        keywords: [...debitMatches, ...creditMatches],
        matchedPatterns: ['combined_conflict_debit'],
        reasoning: 'Both debit and credit indicators found; defaulting to debit',
        warnings: ['Conflicting credit indicators found - manual review recommended'],
      };
    }

    return {
      intent: 'Ignore',
      confidence: 0.4,
      keywords: [...debitMatches, ...creditMatches, ...transferMatches],
      matchedPatterns: ['combined_ambiguous'],
      reasoning: 'Ambiguous intent - equal indicators for multiple types',
      warnings: ['Unable to determine intent with confidence - manual verification recommended'],
    };
  }

  /**
   * Extract matching keywords from message
   */
  private extractMatchingKeywords(message: string, keywords: string[]): string[] {
    const matched: string[] = [];

    for (const keyword of keywords) {
      const escapedKeyword = this.escapeRegex(keyword);
      const hasWordCharsOnly = /^[a-z0-9]+$/i.test(keyword);
      const pattern = hasWordCharsOnly
        ? new RegExp(`\\b${escapedKeyword}\\b`, 'i')
        : new RegExp(escapedKeyword, 'i');
      if (pattern.test(message)) {
        matched.push(keyword);
      }
    }

    return matched;
  }

  private hasPositiveTransactionSignal(message: string): boolean {
    const positiveKeywords = [
      ...this.debitKeywords,
      ...this.creditKeywords,
      ...this.transferKeywords,
    ].filter((keyword) => !this.strongIgnoreKeywords.has(keyword));

    return this.extractMatchingKeywords(message, positiveKeywords).length > 0;
  }

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Helper: Check if message contains spam indicators
   */
  isSpamOrAlert(message: string): boolean {
    const result = this.classify(message);
    return result.intent === 'Ignore' && result.confidence > 0.7;
  }

  /**
   * Helper: Check if message is a debit transaction
   */
  isDebit(message: string): boolean {
    const result = this.classify(message);
    return result.intent === 'Debit' && result.confidence > 0.6;
  }

  /**
   * Helper: Check if message is a credit transaction
   */
  isCredit(message: string): boolean {
    const result = this.classify(message);
    return result.intent === 'Credit' && result.confidence > 0.6;
  }

  /**
   * Helper: Check if message is a transfer
   */
  isTransfer(message: string): boolean {
    const result = this.classify(message);
    return result.intent === 'Transfer' && result.confidence > 0.6;
  }
}

export default IntentClassificationEngine;
