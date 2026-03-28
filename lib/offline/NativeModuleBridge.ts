import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { BudgetZenNative } = NativeModules;

if (!BudgetZenNative) {
  console.warn('BudgetZenNative module not found. Ensure it is properly linked and registered.');
}

/**
 * Interface for SMS message from native module
 */
export interface NativeSMSMessage {
  id: string;
  phoneNumber: string;
  message: string;
  timestamp: number;
  source: 'sms';
  storedAt: number;
  processed: boolean;
}

/**
 * Interface for Notification from native module
 */
export interface NativeNotification {
  id: string;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  timestamp: number;
  source: 'notification';
  storedAt: number;
  processed: boolean;
}

/**
 * Native Module Bridge - TypeScript wrapper for BudgetZen native functionality
 * Provides access to SMS and notification capture from React Native
 */
export const NativeModuleBridge = {
  /**
   * Get all pending SMS messages
   */
  async getPendingSMS(): Promise<NativeSMSMessage[]> {
    if (!BudgetZenNative) {
      console.error('BudgetZenNative module not available');
      return [];
    }

    try {
      const messages = await BudgetZenNative.getPendingSMS();
      return messages || [];
    } catch (error) {
      console.error('Error getting pending SMS:', error);
      return [];
    }
  },

  /**
   * Get all pending notifications
   */
  async getPendingNotifications(): Promise<NativeNotification[]> {
    if (!BudgetZenNative) {
      console.error('BudgetZenNative module not available');
      return [];
    }

    try {
      const notifications = await BudgetZenNative.getPendingNotifications();
      return notifications || [];
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  },

  /**
   * Mark SMS as processed
   */
  async markSMSAsProcessed(smsId: string): Promise<boolean> {
    if (!BudgetZenNative) {
      console.error('BudgetZenNative module not available');
      return false;
    }

    try {
      return await BudgetZenNative.markSMSAsProcessed(smsId);
    } catch (error) {
      console.error('Error marking SMS as processed:', error);
      return false;
    }
  },

  /**
   * Mark notification as processed
   */
  async markNotificationAsProcessed(notifId: string): Promise<boolean> {
    if (!BudgetZenNative) {
      console.error('BudgetZenNative module not available');
      return false;
    }

    try {
      return await BudgetZenNative.markNotificationAsProcessed(notifId);
    } catch (error) {
      console.error('Error marking notification as processed:', error);
      return false;
    }
  },

  /**
   * Clear all processed SMS
   */
  async clearProcessedSMS(): Promise<boolean> {
    if (!BudgetZenNative) {
      console.error('BudgetZenNative module not available');
      return false;
    }

    try {
      return await BudgetZenNative.clearProcessedSMS();
    } catch (error) {
      console.error('Error clearing processed SMS:', error);
      return false;
    }
  },

  /**
   * Get listener status
   */
  async getListenerStatus(): Promise<{
    smsReceiverEnabled: boolean;
    notificationListenerEnabled: boolean;
    status: string;
  }> {
    if (!BudgetZenNative) {
      console.error('BudgetZenNative module not available');
      return {
        smsReceiverEnabled: false,
        notificationListenerEnabled: false,
        status: 'unavailable',
      };
    }

    try {
      return await BudgetZenNative.getListenerStatus();
    } catch (error) {
      console.error('Error getting listener status:', error);
      return {
        smsReceiverEnabled: false,
        notificationListenerEnabled: false,
        status: 'error',
      };
    }
  },

  /**
   * Clear all data (development only)
   */
  async clearAllData(): Promise<boolean> {
    if (!BudgetZenNative) {
      console.error('BudgetZenNative module not available');
      return false;
    }

    try {
      console.warn('Clearing all native module data - DEVELOPMENT ONLY');
      return await BudgetZenNative.clearAllData();
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },
};

/**
 * Subscribe to native SMS events
 * Called when app is running and new SMS arrives
 */
export const subscribeTNativeSMSEvents = (
  onSMSReceived: (message: NativeSMSMessage) => void
): (() => void) => {
  if (!BudgetZenNative || Platform.OS !== 'android') {
    return () => {};
  }

  try {
    const eventEmitter = new NativeEventEmitter(BudgetZenNative);
    const subscription = eventEmitter.addListener(
      'BudgetZenSMSReceived',
      (message: NativeSMSMessage) => {
        console.log('Native SMS event received:', message.phoneNumber);
        onSMSReceived(message);
      }
    );

    return () => subscription.remove();
  } catch (error) {
    console.error('Error subscribing to SMS events:', error);
    return () => {};
  }
};

/**
 * Subscribe to native notification events
 * Called when app is running and new notification arrives
 */
export const subscribeToNativeNotificationEvents = (
  onNotificationReceived: (notification: NativeNotification) => void
): (() => void) => {
  if (!BudgetZenNative || Platform.OS !== 'android') {
    return () => {};
  }

  try {
    const eventEmitter = new NativeEventEmitter(BudgetZenNative);
    const subscription = eventEmitter.addListener(
      'BudgetZenNotificationReceived',
      (notification: NativeNotification) => {
        console.log('Native notification event received:', notification.title);
        onNotificationReceived(notification);
      }
    );

    return () => subscription.remove();
  } catch (error) {
    console.error('Error subscribing to notification events:', error);
    return () => {};
  }
};

export default NativeModuleBridge;
