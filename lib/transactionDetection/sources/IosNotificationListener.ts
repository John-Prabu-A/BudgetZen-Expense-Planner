/**
 * iOS Notification Listener Source
 * Handles notification-based transaction detection on iOS
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { UnifiedMessage } from '../types';

/**
 * iOS Notification Event
 */
export interface IosNotificationEvent {
  title: string;
  body: string;
  data: Record<string, any>;
  sentTime: number;
  sourceApp?: string;
}

/**
 * iOS Notification Listener
 * Monitors notifications from banking apps for transaction info
 */
export class IosNotificationListener {
  private isListening = false;
  private messageCallback: ((message: UnifiedMessage) => void) | null = null;
  private errorCallback: ((error: any) => void) | null = null;
  private bankingAppWhitelist = [
    'com.hdfcbank.app',
    'com.icicibank.android',
    'com.axisbank.bm',
    'com.kotak.m.banking',
    'com.ibl.mobilebanking', // IDBI
    'in.co.barodampay', // BOB
  ];

  /**
   * Check if platform is iOS
   */
  static isAvailable(): boolean {
    return Platform.OS === 'ios';
  }

  /**
   * Start listening for notifications
   */
  async startListening(
    onMessage: (message: UnifiedMessage) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    if (this.isListening) {
      console.warn('[IosNotificationListener] Already listening for notifications');
      return;
    }

    if (!IosNotificationListener.isAvailable()) {
      const error = new Error('Notification listening not available on this platform');
      onError?.(error);
      throw error;
    }

    try {
      this.messageCallback = onMessage;
      this.errorCallback = onError || (() => {});

      // Check and request notification permissions
      await this.requestNotificationPermission();

      // Set up notification handlers
      this.setupNotificationHandlers();

      this.isListening = true;
      console.log('[IosNotificationListener] Started listening for notifications');
    } catch (error) {
      this.errorCallback?.(error);
      throw error;
    }
  }

  /**
   * Stop listening for notifications
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    try {
      this.removeNotificationHandlers();
      this.messageCallback = null;
      this.errorCallback = null;
      this.isListening = false;
      console.log('[IosNotificationListener] Stopped listening for notifications');
    } catch (error) {
      console.error('[IosNotificationListener] Error stopping listener:', error);
    }
  }

  /**
   * Request notification permissions
   */
  private async requestNotificationPermission(): Promise<void> {
    try {
      const { granted } = await Notifications.getPermissionsAsync();

      if (!granted) {
        const { granted: requestGranted } = await Notifications.requestPermissionsAsync();
        if (!requestGranted) {
          throw new Error('Notification permissions not granted');
        }
      }

      console.log('[IosNotificationListener] Notification permissions granted');
    } catch (error) {
      console.error('[IosNotificationListener] Permission request error:', error);
      throw error;
    }
  }

  /**
   * Setup notification handlers
   */
  private setupNotificationHandlers(): void {
    // Handle notifications received in foreground
    this.foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        this.handleNotification(notification);
      }
    );

    // Handle notification responses (user tapped notification)
    this.responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        this.handleNotification(response.notification);
      }
    );
  }

  /**
   * Remove notification handlers
   */
  private foregroundSubscription: Notifications.Subscription | null = null;
  private responseSubscription: Notifications.Subscription | null = null;

  private removeNotificationHandlers(): void {
    if (this.foregroundSubscription) {
      this.foregroundSubscription.remove();
      this.foregroundSubscription = null;
    }
    if (this.responseSubscription) {
      this.responseSubscription.remove();
      this.responseSubscription = null;
    }
  }

  /**
   * Handle notification event
   */
  private handleNotification(notification: Notifications.Notification): void {
    if (!this.messageCallback) {
      return;
    }

    try {
      // Filter by banking app source
      const sourceAppData = notification.request.content.data?.sourceApp;
      const sourceApp = typeof sourceAppData === 'string' 
        ? sourceAppData 
        : this.extractAppIdentifier(notification.request.content.title || '');

      if (!this.isBankingNotification(sourceApp)) {
        return; // Ignore non-banking notifications
      }

      const title = notification.request.content.title || '';
      const body = notification.request.content.body || '';
      const combinedText = `${title} ${body}`.trim();

      const notificationTime = typeof notification.date === 'number' 
        ? notification.date 
        : (notification.date as any)?.getTime?.() || Date.now();

      const unifiedMessage: UnifiedMessage = {
        rawText: combinedText,
        sourceType: 'Notification',
        timestamp: new Date(notificationTime),
        senderIdentifier: sourceApp || 'unknown_bank',
        platform: 'iOS',
        confidenceHint: 0.8, // Notifications have slightly lower confidence than SMS
        metadata: {
          title,
          body,
          sourceApp,
          notificationId: notification.request.identifier,
          data: notification.request.content.data,
        },
      };

      this.messageCallback(unifiedMessage);
    } catch (error) {
      this.errorCallback?.(error);
    }
  }

  /**
   * Check if notification is from banking app
   */
  private isBankingNotification(sourceApp: string): boolean {
    if (!sourceApp) return false;

    const appLower = sourceApp.toLowerCase();
    return (
      this.bankingAppWhitelist.some(whitelisted =>
        appLower.includes(whitelisted.toLowerCase())
      ) || this.isBankingKeywordPresent(appLower)
    );
  }

  /**
   * Check for banking keywords in app identifier
   */
  private isBankingKeywordPresent(text: string): boolean {
    const bankingKeywords = [
      'bank',
      'finance',
      'payment',
      'paypal',
      'stripe',
      'wallet',
      'google pay',
      'apple pay',
      'gpay',
      'phonepe',
      'paytm',
      'razorpay',
    ];

    return bankingKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract app identifier from title or data
   */
  private extractAppIdentifier(titleOrData: string): string {
    // Look for common bank identifiers in notification
    const bankMatches = [
      /HDFC|hdfc/,
      /ICICI|icici/,
      /Axis|axis/,
      /SBI|sbi/,
      /Kotak|kotak/,
      /IDBI|idbi/,
      /BOB|bob/,
      /PayPal|paypal/,
      /Stripe|stripe/,
      /GooglePay|google pay/,
      /ApplePay|apple pay/,
      /PhonePe|phonepe/,
      /PayTM|paytm/,
      /Razorpay|razorpay/,
    ];

    for (const regex of bankMatches) {
      const match = titleOrData.match(regex);
      if (match) {
        return match[0].toLowerCase();
      }
    }

    return 'unknown';
  }

  /**
   * Add banking app to whitelist
   */
  addBankingApp(appIdentifier: string): void {
    if (!this.bankingAppWhitelist.includes(appIdentifier)) {
      this.bankingAppWhitelist.push(appIdentifier);
    }
  }

  /**
   * Remove banking app from whitelist
   */
  removeBankingApp(appIdentifier: string): void {
    const index = this.bankingAppWhitelist.indexOf(appIdentifier);
    if (index > -1) {
      this.bankingAppWhitelist.splice(index, 1);
    }
  }

  /**
   * Get listening status
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Test notification (for development/testing)
   */
  testNotification(title: string, body: string, sourceApp?: string): void {
    // Create a mock notification for testing
    const mockNotification = {
      request: {
        identifier: 'test-' + Date.now(),
        content: {
          title: title || null,
          body: body || null,
          subtitle: null,
          categoryIdentifier: null,
          sound: 'default' as const,
          data: { sourceApp: sourceApp || 'HDFC' },
        },
        trigger: null,
      },
      date: Date.now(),
    } as unknown as Notifications.Notification;

    this.handleNotification(mockNotification);
  }
}

export const iosNotificationListener = new IosNotificationListener();

export default IosNotificationListener;
