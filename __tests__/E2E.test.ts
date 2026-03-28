/**
 * End-to-End Integration Tests
 * Test the complete pipeline from message to record creation
 */

import { TransactionProcessingPipeline } from '../lib/transactionDetection/TransactionProcessingPipeline';
import { RecordCreationService } from '../lib/transactionDetection/RecordCreationService';
import { UnifiedMessage } from '../lib/transactionDetection/types';

describe('Transaction Processing Pipeline - E2E Tests', () => {
  let pipeline: TransactionProcessingPipeline;
  let mockSupabase: any;
  let recordService: RecordCreationService;

  beforeEach(() => {
    // Mock Supabase
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'mock-record-id', amount: 5000, type: 'expense' },
        error: null,
      }),
    };

    recordService = new RecordCreationService(mockSupabase, {
      confidenceThreshold: 0.7,
      enableAutoCreation: true,
      deduplicationWindow: 5 * 60 * 1000,
    });

    pipeline = new TransactionProcessingPipeline(recordService, {
      confidenceThreshold: 0.7,
      enableAutoCreation: true,
      debugMode: false,
    });
  });

  describe('HDFC Bank Transactions', () => {
    test('should process HDFC debit transaction', async () => {
      const message: UnifiedMessage = {
        rawText: 'HDFC: ₹5,000 debited from your account. Ref#202401150001',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.9,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(5000);
      expect(result.intent).toBe('Debit');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should detect HDFC fraud alert as spam', async () => {
      const message: UnifiedMessage = {
        rawText: 'HDFC Alert: Fraud detected on your account. Card blocked immediately.',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.9,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(false);
      expect(result.intent).toBe('Ignore');
    });

    test('should extract HDFC credit transaction', async () => {
      const message: UnifiedMessage = {
        rawText: 'HDFC: ₹50,000 credited to your account. Statement ID: 12345',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.9,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(50000);
      expect(result.intent).toBe('Credit');
    });
  });

  describe('ICICI Bank Transactions', () => {
    test('should process ICICI debit transaction', async () => {
      const message: UnifiedMessage = {
        rawText: 'Amount of ₹3,500 has been debited from your ICICI account',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'ICICI',
        platform: 'Android',
        confidenceHint: 0.85,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(3500);
      expect(result.intent).toBe('Debit');
    });
  });

  describe('Payment App Transactions', () => {
    test('should process Google Pay payment', async () => {
      const message: UnifiedMessage = {
        rawText: 'You sent ₹1,500 to Rajesh. Balance: ₹5,000',
        sourceType: 'Notification',
        timestamp: new Date(),
        senderIdentifier: 'GooglePay',
        platform: 'Android',
        confidenceHint: 0.9,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(1500);
      expect(result.intent).toBe('Debit');
    });

    test('should process PhonePe payment', async () => {
      const message: UnifiedMessage = {
        rawText: 'You paid ₹499 to ABC Store. Available Balance: ₹10,000',
        sourceType: 'Notification',
        timestamp: new Date(),
        senderIdentifier: 'PhonePe',
        platform: 'Android',
        confidenceHint: 0.9,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(499);
      expect(result.intent).toBe('Debit');
      expect(result.amount).not.toBe(10000); // Should not extract balance
    });

    test('should process Google Pay receipt', async () => {
      const message: UnifiedMessage = {
        rawText: 'You received ₹2,000 from Sarah via Google Pay',
        sourceType: 'Notification',
        timestamp: new Date(),
        senderIdentifier: 'GooglePay',
        platform: 'Android',
        confidenceHint: 0.9,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(2000);
      expect(result.intent).toBe('Credit');
    });
  });

  describe('Multiple Amounts Handling', () => {
    test('should extract transaction amount, not balance', async () => {
      const message: UnifiedMessage = {
        rawText: 'Balance: ₹50,000. Transaction: ₹1,000 debited. Available: ₹49,000',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.8,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(1000);
      expect(result.amount).not.toBe(50000);
      expect(result.amount).not.toBe(49000);
    });

    test('should not process messages with only balance info', async () => {
      const message: UnifiedMessage = {
        rawText: 'Your current balance is ₹50,000. Limit: ₹5,00,000',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.7,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      // Should either fail or extract transaction amount if it exists
      // Since this is only balance info, it should fail
      expect(result.success).toBe(false);
    });
  });

  describe('Spam and Alert Filtering', () => {
    test('should filter out OTP messages', async () => {
      const message: UnifiedMessage = {
        rawText: 'Your OTP is 123456. Do not share with anyone',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.9,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(false);
      expect(result.intent).toBe('Ignore');
    });

    test('should filter out KYC update messages', async () => {
      const message: UnifiedMessage = {
        rawText: 'Complete your KYC verification to continue using your account',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.8,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(false);
      expect(result.intent).toBe('Ignore');
    });

    test('should filter out promotional messages', async () => {
      const message: UnifiedMessage = {
        rawText: 'Exclusive offer: Get ₹500 cashback on your next purchase!',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.7,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(false);
      expect(result.intent).toBe('Ignore');
    });

    test('should filter out card declined messages', async () => {
      const message: UnifiedMessage = {
        rawText: 'Your card transaction of ₹5000 was declined',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.8,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(false);
      expect(result.intent).toBe('Ignore');
    });
  });

  describe('Confidence Threshold', () => {
    test('should reject low confidence messages', async () => {
      const message: UnifiedMessage = {
        rawText: 'Something happened with 1000',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'Unknown',
        platform: 'Android',
        confidenceHint: 0.5,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(false);
      expect(result.confidence).toBeLessThan(0.7);
    });

    test('should accept high confidence messages', async () => {
      const message: UnifiedMessage = {
        rawText: 'HDFC: ₹5,000 debited from your account',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.95,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Debug Mode', () => {
    test('should log messages in debug mode', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      pipeline.enableDebugMode();

      const message: UnifiedMessage = {
        rawText: 'HDFC: ₹5,000 debited',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.9,
      };

      await pipeline.process('user-123', 'account-456', message as any);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Pipeline]'),
        expect.any(String)
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    test('should allow confidence threshold configuration', async () => {
      pipeline.updateConfig({ confidenceThreshold: 0.9 });

      const message: UnifiedMessage = {
        rawText: 'Something 1000',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'Unknown',
        platform: 'Android',
        confidenceHint: 0.8,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      // Should be rejected due to high threshold
      expect(result.success).toBe(false);
    });

    test('should disable auto-creation when configured', async () => {
      pipeline.updateConfig({ enableAutoCreation: false });

      const message: UnifiedMessage = {
        rawText: 'HDFC: ₹5,000 debited',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.9,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.recordId).toBeUndefined(); // No record created
      expect(result.message).toContain('not auto-created');
    });
  });

  describe('Error Handling', () => {
    test('should handle empty messages', async () => {
      const message: UnifiedMessage = {
        rawText: '',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No amount detected');
    });

    test('should handle malformed messages gracefully', async () => {
      const message: UnifiedMessage = {
        rawText: null as any,
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.5,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
    });
  });

  describe('Real-World Scenarios', () => {
    test('Online shopping transaction', async () => {
      const message: UnifiedMessage = {
        rawText: 'Amazon: Your order for ₹3,999 has been confirmed. Payment debited from your card.',
        sourceType: 'Email',
        timestamp: new Date(),
        senderIdentifier: 'amazon@amazon.in',
        platform: 'Android',
        confidenceHint: 0.8,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(3999);
      expect(result.intent).toBe('Debit');
    });

    test('Salary credit transaction', async () => {
      const message: UnifiedMessage = {
        rawText: 'Your salary of ₹50,000 has been credited to your HDFC account. Statement ref: SALARY2024JAN',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.95,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(50000);
      expect(result.intent).toBe('Credit');
    });

    test('Insurance premium payment', async () => {
      const message: UnifiedMessage = {
        rawText: 'Your HDFC Insurance premium of ₹12,500 has been debited from your account. Policy#INS123456',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.9,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(12500);
      expect(result.intent).toBe('Debit');
    });

    test('EMI payment transaction', async () => {
      const message: UnifiedMessage = {
        rawText: 'EMI of ₹15,000 has been debited from your account for Loan#LOAN123',
        sourceType: 'SMS',
        timestamp: new Date(),
        senderIdentifier: 'HDFC',
        platform: 'Android',
        confidenceHint: 0.85,
      };

      const result = await pipeline.process('user-123', 'account-456', message as any);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(15000);
      expect(result.intent).toBe('Debit');
    });
  });
});
