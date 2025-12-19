/**
 * Android SMS Listener Source
 * Handles background SMS detection on Android
 */

import { Platform } from 'react-native';
import { UnifiedMessage } from '../types';

/**
 * Android SMS Event
 */
export interface AndroidSmsEvent {
  sender: string;
  body: string;
  timestamp: number;
  threadId?: string;
  messageId?: string;
}

/**
 * Android SMS Listener
 * Responsible for intercepting SMS messages on Android
 */
export class AndroidSmsListener {
  private isListening = false;
  private messageCallback: ((message: UnifiedMessage) => void) | null = null;
  private errorCallback: ((error: any) => void) | null = null;

  /**
   * Check if platform is Android
   */
  static isAvailable(): boolean {
    return Platform.OS === 'android';
  }

  /**
   * Start listening for SMS
   */
  async startListening(
    onMessage: (message: UnifiedMessage) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    if (this.isListening) {
      console.warn('[AndroidSmsListener] Already listening for SMS');
      return;
    }

    if (!AndroidSmsListener.isAvailable()) {
      const error = new Error('SMS listening not available on this platform');
      onError?.(error);
      throw error;
    }

    try {
      this.messageCallback = onMessage;
      this.errorCallback = onError || (() => {});

      // Check and request permissions
      await this.requestPermissions();

      // Register SMS receiver
      this.registerSmsReceiver();

      this.isListening = true;
      console.log('[AndroidSmsListener] Started listening for SMS');
    } catch (error) {
      this.errorCallback?.(error);
      throw error;
    }
  }

  /**
   * Stop listening for SMS
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    try {
      this.unregisterSmsReceiver();
      this.messageCallback = null;
      this.errorCallback = null;
      this.isListening = false;
      console.log('[AndroidSmsListener] Stopped listening for SMS');
    } catch (error) {
      console.error('[AndroidSmsListener] Error stopping listener:', error);
    }
  }

  /**
   * Request SMS permissions
   */
  private async requestPermissions(): Promise<void> {
    // In a real implementation, use @react-native-camera-roll or react-native-permissions
    // For now, this is a placeholder
    console.log('[AndroidSmsListener] Requesting SMS permissions');
    
    // Example of what would be done:
    // const permissions = [PERMISSIONS.ANDROID.READ_SMS, PERMISSIONS.ANDROID.RECEIVE_SMS];
    // const result = await requestMultiple(permissions);
    // if (Object.values(result).some(r => r !== RESULTS.GRANTED)) {
    //   throw new Error('SMS permissions not granted');
    // }
  }

  /**
   * Register SMS receiver (native bridge)
   */
  private registerSmsReceiver(): void {
    // This would require a native module to actually receive SMS
    // For now, we'll create a mock/stub
    console.log('[AndroidSmsListener] Registering SMS receiver with native module');

    // Example implementation would use:
    // NativeModules.SMSModule.registerReceiver(this.handleSmsEvent.bind(this));
  }

  /**
   * Unregister SMS receiver
   */
  private unregisterSmsReceiver(): void {
    console.log('[AndroidSmsListener] Unregistering SMS receiver');
    // NativeModules.SMSModule.unregisterReceiver();
  }

  /**
   * Handle SMS event from native layer
   */
  private handleSmsEvent(event: AndroidSmsEvent): void {
    if (!this.messageCallback) {
      return;
    }

    try {
      const unifiedMessage: UnifiedMessage = {
        rawText: event.body,
        sourceType: 'SMS',
        timestamp: new Date(event.timestamp),
        senderIdentifier: event.sender,
        platform: 'Android',
        confidenceHint: 0.9, // Direct SMS has high confidence
        metadata: {
          threadId: event.threadId,
          messageId: event.messageId,
          sender: event.sender,
        },
      };

      this.messageCallback(unifiedMessage);
    } catch (error) {
      this.errorCallback?.(error);
    }
  }

  /**
   * Get listening status
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Test SMS (for development/testing)
   */
  testSms(sender: string, body: string): void {
    const event: AndroidSmsEvent = {
      sender,
      body,
      timestamp: Date.now(),
      threadId: 'test-thread',
      messageId: 'test-message-' + Date.now(),
    };

    this.handleSmsEvent(event);
  }
}

export const androidSmsListener = new AndroidSmsListener();

export default AndroidSmsListener;
