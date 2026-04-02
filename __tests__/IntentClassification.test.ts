/**
 * Intent Classification Engine Tests
 * Comprehensive test suite for testing intent classification
 */

import { IntentClassificationEngine, IntentClassificationResult } from '../lib/transactionDetection/engines/IntentClassificationEngine';

describe('IntentClassificationEngine', () => {
  let engine: IntentClassificationEngine;

  beforeEach(() => {
    engine = new IntentClassificationEngine();
  });

  describe('Debit Detection', () => {
    test('should detect simple debit', () => {
      const result = engine.classify('₹5000 debited from your account');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect payment', () => {
      const result = engine.classify('Payment of ₹1000 processed');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect card charge', () => {
      const result = engine.classify('Your card has been charged ₹500');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect ATM withdrawal', () => {
      const result = engine.classify('₹2000 withdrawn from ATM');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect bill payment', () => {
      const result = engine.classify('Bill payment of ₹3000 successful');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect EMI payment', () => {
      const result = engine.classify('EMI of ₹5000 debited');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('should detect purchase', () => {
      const result = engine.classify('Purchase of ₹999 at Amazon');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Credit Detection', () => {
    test('should detect simple credit', () => {
      const result = engine.classify('₹10000 credited to your account');
      expect(result.intent).toBe('Credit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect salary', () => {
      const result = engine.classify('Your salary of ₹50000 has been credited');
      expect(result.intent).toBe('Credit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect refund', () => {
      const result = engine.classify('Refund of ₹2000 received');
      expect(result.intent).toBe('Credit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect cashback', () => {
      const result = engine.classify('₹500 cashback credited');
      expect(result.intent).toBe('Credit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect interest', () => {
      const result = engine.classify('Interest of ₹100 credited to account');
      expect(result.intent).toBe('Credit');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('should detect recharge', () => {
      const result = engine.classify('Recharge of ₹499 successful');
      expect(result.intent).toBe('Credit');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('should detect incoming transfer', () => {
      const result = engine.classify('₹5000 received from John');
      expect(result.intent).toBe('Credit');
      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Transfer Detection', () => {
    test('should detect fund transfer', () => {
      const result = engine.classify('Fund transfer of ₹5000 sent');
      expect(result.intent).toBe('Transfer');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect UPI transfer', () => {
      const result = engine.classify('UPI transfer ₹1000 sent to John');
      expect(result.intent).toBe('Transfer');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect NEFT transfer', () => {
      const result = engine.classify('NEFT transfer of ₹25000 processed');
      expect(result.intent).toBe('Transfer');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect RTGS transfer', () => {
      const result = engine.classify('RTGS transfer of ₹100000 sent');
      expect(result.intent).toBe('Transfer');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect IMPS transfer', () => {
      const result = engine.classify('IMPS transfer ₹5000 completed');
      expect(result.intent).toBe('Transfer');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('should detect peer-to-peer transfer', () => {
      const result = engine.classify('P2P transfer of ₹2000 to friend');
      expect(result.intent).toBe('Transfer');
      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Ignore/Spam Detection', () => {
    test('should ignore fraud alert', () => {
      const result = engine.classify('FRAUD ALERT: Unauthorized transaction detected');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should ignore card blocked', () => {
      const result = engine.classify('Your card has been blocked');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should ignore OTP request', () => {
      const result = engine.classify('Your OTP is 123456. Do not share');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should ignore KYC request', () => {
      const result = engine.classify('Complete your KYC verification now');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should ignore promotional message', () => {
      const result = engine.classify('Exclusive offer: Get cashback on next purchase');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('should ignore account update request', () => {
      const result = engine.classify('Update your account details to continue');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should ignore suspicious activity alert', () => {
      const result = engine.classify('Suspicious activity detected. Verify now');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should ignore transaction failed', () => {
      const result = engine.classify('Your transaction of ₹1000 failed');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('should ignore card declined', () => {
      const result = engine.classify('Your card was declined. Try another payment method');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Sender Identifier Detection', () => {
    test('should use bank-specific patterns for HDFC', () => {
      const result = engine.classify('₹5000 debited', 'HDFC');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should use bank-specific patterns for ICICI', () => {
      const result = engine.classify('Amount ₹3000 has been debited', 'ICICI');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should use bank-specific patterns for SBI', () => {
      const result = engine.classify('₹2000 withdrawn', 'SBI');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should use patterns for Google Pay', () => {
      const result = engine.classify('You sent ₹1000', 'GooglePay');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should use patterns for PhonePe', () => {
      const result = engine.classify('You paid ₹500', 'PhonePe');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Helper Methods', () => {
    test('isSpamOrAlert should return true for fraud alert', () => {
      const result = engine.isSpamOrAlert('FRAUD ALERT: Unauthorized transaction');
      expect(result).toBe(true);
    });

    test('isSpamOrAlert should return false for normal transaction', () => {
      const result = engine.isSpamOrAlert('₹5000 debited');
      expect(result).toBe(false);
    });

    test('isDebit should return true for debit transaction', () => {
      const result = engine.isDebit('₹1000 charged to your card');
      expect(result).toBe(true);
    });

    test('isDebit should return false for credit transaction', () => {
      const result = engine.isDebit('₹1000 credited to your account');
      expect(result).toBe(false);
    });

    test('isCredit should return true for credit transaction', () => {
      const result = engine.isCredit('₹5000 received in your account');
      expect(result).toBe(true);
    });

    test('isCredit should return false for debit transaction', () => {
      const result = engine.isCredit('₹2000 debited');
      expect(result).toBe(false);
    });

    test('isTransfer should return true for transfer', () => {
      const result = engine.isTransfer('UPI transfer ₹3000 sent');
      expect(result).toBe(true);
    });

    test('isTransfer should return false for non-transfer', () => {
      const result = engine.isTransfer('₹1000 spent');
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases and Ambiguous Messages', () => {
    test('should handle conflicting keywords - debit dominant', () => {
      const result = engine.classify('Debit of ₹1000 and credit of ₹500');
      expect(result.intent).toBe('Debit');
      expect(result.warnings).toContainEqual(expect.stringMatching(/conflicting/i));
    });

    test('should handle empty message', () => {
      const result = engine.classify('');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('should handle message with no transaction indicators', () => {
      const result = engine.classify('Hello there');
      expect(result.intent).toBe('Ignore');
    });

    test('should handle multiple debit keywords', () => {
      const result = engine.classify('Payment debited charged from your account');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should handle multiple credit keywords', () => {
      const result = engine.classify('Amount credited received in your account');
      expect(result.intent).toBe('Credit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should handle case-insensitivity', () => {
      const result1 = engine.classify('₹5000 DEBITED');
      const result2 = engine.classify('₹5000 debited');
      expect(result1.intent).toBe(result2.intent);
      expect(result1.confidence).toBeCloseTo(result2.confidence, 1);
    });
  });

  describe('Real-World Bank Messages', () => {
    test('HDFC debit message', () => {
      const msg = 'Your A/c is debited by ₹2,500 for UPI transfer to John. Ref#202401150001';
      const result = engine.classify(msg, 'HDFC');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('ICICI credit message', () => {
      const msg = 'Amount of ₹50,000 has been credited to your ICICI account. Statement ID: 12345';
      const result = engine.classify(msg, 'ICICI');
      expect(result.intent).toBe('Credit');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('SBI fraud alert', () => {
      const msg = 'SBI Alert: Fraud detected on your account. Card blocked. Contact support';
      const result = engine.classify(msg, 'SBI');
      expect(result.intent).toBe('Ignore');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('PhonePe payment', () => {
      const msg = 'You paid ₹999 to ABC Store. Transaction successful';
      const result = engine.classify(msg, 'PhonePe');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('Google Pay transfer', () => {
      const msg = 'You sent ₹1,500 to Rajesh. Balance: ₹5,000';
      const result = engine.classify(msg, 'GooglePay');
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('Paytm refund', () => {
      const msg = 'Refund of ₹599 credited for order #P123456';
      const result = engine.classify(msg, 'Paytm');
      expect(result.intent).toBe('Credit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Confidence Scoring', () => {
    test('bank-specific patterns should have highest confidence', () => {
      const result = engine.classify('₹5000 debited', 'HDFC');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('keyword matching should have high confidence', () => {
      const result = engine.classify('₹5000 debited from your account');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('combined patterns should have medium confidence', () => {
      const result = engine.classify('Debit payment');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.confidence).toBeLessThan(0.8);
    });

    test('ambiguous messages should have low confidence', () => {
      const result = engine.classify('Something happened');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('Keyword Extraction', () => {
    test('should extract matched keywords', () => {
      const result = engine.classify('Payment debited charged');
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords).toContainEqual(expect.stringMatching(/debit|payment|charged/i));
    });

    test('should return empty keywords for ignore', () => {
      const result = engine.classify('Hello world');
      expect(result.keywords.length).toBe(0);
    });
  });
});
