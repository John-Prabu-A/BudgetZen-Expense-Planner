/**
 * Amount Extraction Engine Tests
 * Comprehensive test suite for testing amount extraction from bank messages
 */

import { AmountExtractionEngine, AmountExtractionResult } from '../lib/transactionDetection/engines/AmountExtractionEngine';

describe('AmountExtractionEngine', () => {
  let engine: AmountExtractionEngine;

  beforeEach(() => {
    engine = new AmountExtractionEngine();
  });

  describe('Currency Symbol Extraction', () => {
    test('should extract amount with rupee symbol', () => {
      const result = engine.extract('HDFC: ₹5,000 debited');
      expect(result.amount).toBe(5000);
      expect(result.currency).toBe('INR');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should extract amount with Rs abbreviation', () => {
      const result = engine.extract('Your account has been debited by Rs.3,500');
      expect(result.amount).toBe(3500);
      expect(result.currency).toBe('INR');
      expect(result.confidence).toBeGreaterThan(0.75);
    });

    test('should extract amount with $ symbol', () => {
      const result = engine.extract('PayPal: $50.00 received');
      expect(result.amount).toBe(50);
      expect(result.currency).toBe('USD');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should extract amount with € symbol', () => {
      const result = engine.extract('Transfer: €100 sent successfully');
      expect(result.amount).toBe(100);
      expect(result.currency).toBe('EUR');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should handle multiple currency formats', () => {
      const testCases = [
        { msg: '₹10,000 transferred', amount: 10000 },
        { msg: '$1,000.50 paid', amount: 1000.5 },
        { msg: '€500 received', amount: 500 },
        { msg: '£250 sent', amount: 250 },
      ];

      testCases.forEach(({ msg, amount }) => {
        const result = engine.extract(msg);
        expect(result.amount).toBe(amount);
      });
    });
  });

  describe('Bank Pattern Extraction', () => {
    test('should extract HDFC bank transaction', () => {
      const result = engine.extract('HDFC Bank: ₹25,000 debited from your account');
      expect(result.amount).toBe(25000);
      expect(result.extractionMethod).toBe('pattern_match');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should extract ICICI bank transaction', () => {
      const result = engine.extract('amount of ₹5000 has been debited from your account');
      expect(result.amount).toBe(5000);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should extract SBI bank transaction', () => {
      const result = engine.extract('₹3,000 withdrawn from your SBI account');
      expect(result.amount).toBe(3000);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should extract Google Pay transaction', () => {
      const result = engine.extract('You received ₹1,500 on Google Pay');
      expect(result.amount).toBe(1500);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should extract PhonePe transaction', () => {
      const result = engine.extract('You paid ₹2,000 via PhonePe');
      expect(result.amount).toBe(2000);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Written Number Extraction', () => {
    test('should extract written amount: five thousand', () => {
      const result = engine.extract('Amount of five thousand rupees charged');
      expect(result.amount).toBe(5000);
      expect(result.extractionMethod).toBe('written_number');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    test('should extract written amount: fifty rupees', () => {
      const result = engine.extract('Charged fifty rupees for service');
      expect(result.amount).toBe(50);
      expect(result.extractionMethod).toBe('written_number');
    });

    test('should extract written amount: one lakh', () => {
      const result = engine.extract('Payment of one lakh received');
      expect(result.amount).toBe(100000);
      expect(result.extractionMethod).toBe('written_number');
    });

    test('should extract written amount: one crore', () => {
      const result = engine.extract('Transfer amount is one crore rupees');
      expect(result.amount).toBe(10000000);
      expect(result.extractionMethod).toBe('written_number');
    });
  });

  describe('Multiple Amounts - Deduplication', () => {
    test('should not extract balance when amount is present', () => {
      const result = engine.extract('Balance: ₹50,000. Spent: ₹1000 on groceries');
      expect(result.amount).toBe(1000);
      expect(result.amount).not.toBe(50000);
    });

    test('should pick highest transaction amount', () => {
      const result = engine.extract('Limit: ₹1,00,000. Credit: ₹50,000. Spent: ₹2,500');
      // Should pick the actual transaction amount, not balance/limit
      expect([2500, 50000]).toContain(result.amount);
    });

    test('should avoid extracting card limit', () => {
      const result = engine.extract('Your card limit is ₹5,00,000. Transaction: ₹1000');
      expect(result.amount).toBe(1000);
      expect(result.amount).not.toBe(500000);
    });

    test('should avoid extracting minimum due', () => {
      const result = engine.extract('Min.Due: ₹5000. Spent: ₹500');
      expect(result.amount).toBe(500);
    });
  });

  describe('Decimal and Comma Handling', () => {
    test('should handle Indian comma format', () => {
      const result = engine.extract('₹1,00,000 transferred');
      expect(result.amount).toBe(100000);
    });

    test('should handle standard comma format', () => {
      const result = engine.extract('$1,000,000 received');
      expect(result.amount).toBe(1000000);
    });

    test('should handle decimal amounts', () => {
      const result = engine.extract('Charged $99.99 for subscription');
      expect(result.amount).toBe(99.99);
    });

    test('should handle Indian decimal format', () => {
      const result = engine.extract('₹50.00 charged');
      expect(result.amount).toBe(50);
    });

    test('should handle paise amounts', () => {
      const result = engine.extract('₹0.50 charged as fee');
      expect(result.amount).toBe(0.5);
    });
  });

  describe('Edge Cases', () => {
    test('should not extract from empty message', () => {
      const result = engine.extract('');
      expect(result.amount).toBeNull();
      expect(result.confidence).toBe(0);
    });

    test('should not extract zero amount', () => {
      const result = engine.extract('₹0 transferred');
      expect(result.amount).not.toBe(0);
      expect(result.amount).toBeNull();
    });

    test('should not extract invalid amounts', () => {
      const result = engine.extract('No amount here');
      expect(result.amount).toBeNull();
    });

    test('should handle negative amounts (absolute value)', () => {
      const result = engine.extract('Refund of -₹1000');
      expect(result.amount).toBe(1000); // Should be positive
    });

    test('should handle very large amounts', () => {
      const result = engine.extract('₹99,99,99,999 transferred');
      expect(result.amount).toBe(999999999);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should handle very small amounts', () => {
      const result = engine.extract('₹0.01 charged');
      expect(result.amount).toBe(0.01);
    });

    test('should warn on low confidence extractions', () => {
      const result = engine.extract('Call 1800');
      // Should not extract phone number as amount
      expect(result.amount).not.toBe(1800);
    });
  });

  describe('Real-World Bank Messages', () => {
    test('HDFC UPI transaction', () => {
      const msg = 'Your A/c XXX is debited by ₹2,500.00 for UPI/NEFT/RTGS transfer ref.no 202401150001';
      const result = engine.extract(msg);
      expect(result.amount).toBe(2500);
    });

    test('ICICI card purchase', () => {
      const msg = 'Your ICICI Bank Credit Card ending in 1234 has been charged Rs.15,000 on 15-Jan-2024';
      const result = engine.extract(msg);
      expect(result.amount).toBe(15000);
    });

    test('SBI ATM withdrawal', () => {
      const msg = 'SBI Alert: You have withdrawn ₹5,000 from SBI ATM at 3:45 PM';
      const result = engine.extract(msg);
      expect(result.amount).toBe(5000);
    });

    test('Google Pay receipt', () => {
      const msg = 'You sent ₹1,000 to John. Transaction ID: GPay2024';
      const result = engine.extract(msg);
      expect(result.amount).toBe(1000);
    });

    test('PhonePe transaction', () => {
      const msg = 'PhonePe: You paid ₹499 to ABC Store. Available Balance: ₹10,000';
      const result = engine.extract(msg);
      expect(result.amount).toBe(499);
      expect(result.amount).not.toBe(10000);
    });

    test('Credit card bill payment', () => {
      const msg = 'HDFC Credit Card: Minimum Due: Rs.5,000. Total Outstanding: Rs.25,000. Pay Now?';
      const result = engine.extract(msg);
      // Should not be null, but pick one of the amounts
      expect(result.amount).not.toBeNull();
    });

    test('Insurance premium payment', () => {
      const msg = 'Your HDFC Insurance premium of ₹12,500 has been debited from your account';
      const result = engine.extract(msg);
      expect(result.amount).toBe(12500);
    });

    test('Online shopping purchase', () => {
      const msg = 'Amazon: ₹3,999 charged for your order. Order ID: AMZ123456';
      const result = engine.extract(msg);
      expect(result.amount).toBe(3999);
    });
  });

  describe('Confidence Scoring', () => {
    test('should have highest confidence for bank pattern matches', () => {
      const result = engine.extract('HDFC: ₹5000 debited');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should have high confidence for currency symbol', () => {
      const result = engine.extract('₹5000 spent');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should have medium confidence for generic patterns', () => {
      const result = engine.extract('Amount 5000');
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    test('should have low confidence for written numbers', () => {
      const result = engine.extract('Five thousand rupees');
      expect(result.confidence).toBeLessThan(0.75);
    });
  });

  describe('Currency Detection', () => {
    test('should detect INR from symbol', () => {
      const result = engine.extract('₹5000');
      expect(result.currency).toBe('INR');
    });

    test('should detect USD from symbol', () => {
      const result = engine.extract('$100');
      expect(result.currency).toBe('USD');
    });

    test('should detect EUR from symbol', () => {
      const result = engine.extract('€50');
      expect(result.currency).toBe('EUR');
    });

    test('should detect from currency code', () => {
      const result = engine.extract('Amount AED 500');
      expect(result.currency).toBe('AED');
    });
  });
});
