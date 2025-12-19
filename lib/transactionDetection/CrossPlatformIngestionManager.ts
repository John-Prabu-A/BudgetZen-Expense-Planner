/**
 * Cross-Platform Transaction Ingestion Manager
 * Orchestrates platform-specific listeners and unified service
 */

import { Platform } from 'react-native';
import { AndroidSmsListener } from './sources/AndroidSmsListener';
import { IosNotificationListener } from './sources/IosNotificationListener';
import { IngestionResult, IngestionSettings, UnifiedMessage } from './types';
import { UnifiedTransactionIngestionService } from './UnifiedTransactionIngestionService';

/**
 * Cross-Platform Ingestion Manager
 */
export class CrossPlatformIngestionManager {
  private ingestionService: UnifiedTransactionIngestionService;
  private androidSmsListener: AndroidSmsListener | null = null;
  private iosNotificationListener: IosNotificationListener | null = null;
  private currentUserId: string | null = null;
  private currentAccountId: string | null = null;

  constructor(settings: Partial<IngestionSettings> = {}) {
    this.ingestionService = new UnifiedTransactionIngestionService(settings);

    // Initialize platform-specific listeners
    if (Platform.OS === 'android') {
      this.androidSmsListener = new AndroidSmsListener();
    } else if (Platform.OS === 'ios') {
      this.iosNotificationListener = new IosNotificationListener();
    }
  }

  /**
   * Initialize the ingestion system for a user
   */
  async initialize(userId: string, accountId: string): Promise<void> {
    this.currentUserId = userId;
    this.currentAccountId = accountId;

    console.log(
      `[CrossPlatformManager] Initializing for user: ${userId}, account: ${accountId}`
    );

    try {
      await this.startListeners();
    } catch (error) {
      console.error('[CrossPlatformManager] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Start platform-specific listeners
   */
  private async startListeners(): Promise<void> {
    if (!this.currentUserId || !this.currentAccountId) {
      throw new Error('User ID and Account ID required for initialization');
    }

    if (Platform.OS === 'android' && this.androidSmsListener) {
      try {
        await this.androidSmsListener.startListening(
          (message) => this.handleMessage(message),
          (error) => this.handleListenerError(error, 'Android SMS')
        );
      } catch (error) {
        console.warn('[CrossPlatformManager] Failed to start Android SMS listener:', error);
      }
    } else if (Platform.OS === 'ios' && this.iosNotificationListener) {
      try {
        await this.iosNotificationListener.startListening(
          (message) => this.handleMessage(message),
          (error) => this.handleListenerError(error, 'iOS Notification')
        );
      } catch (error) {
        console.warn('[CrossPlatformManager] Failed to start iOS notification listener:', error);
      }
    }
  }

  /**
   * Stop all listeners
   */
  stopListeners(): void {
    if (this.androidSmsListener?.isActive()) {
      this.androidSmsListener.stopListening();
    }

    if (this.iosNotificationListener?.isActive()) {
      this.iosNotificationListener.stopListening();
    }

    console.log('[CrossPlatformManager] All listeners stopped');
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: UnifiedMessage): Promise<void> {
    if (!this.currentUserId || !this.currentAccountId) {
      console.warn('[CrossPlatformManager] No user context for message ingestion');
      return;
    }

    try {
      const result = await this.ingestionService.ingest(
        message,
        this.currentUserId,
        this.currentAccountId
      );

      if (result.success) {
        console.log('[CrossPlatformManager] Message ingested successfully:', result.recordId);
        this.onTransactionCreated(result);
      } else {
        console.log('[CrossPlatformManager] Message not processed:', result.reason);
      }
    } catch (error) {
      console.error('[CrossPlatformManager] Error ingesting message:', error);
    }
  }

  /**
   * Handle listener error
   */
  private handleListenerError(error: any, source: string): void {
    console.error(`[CrossPlatformManager] ${source} listener error:`, error);
    // Could emit event or update UI state here
  }

  /**
   * Called when transaction is successfully created
   */
  private onTransactionCreated(result: IngestionResult): void {
    // This can be extended to:
    // - Trigger UI updates
    // - Send notifications
    // - Refresh dashboards
    // - Log analytics
    console.log('[CrossPlatformManager] Transaction created event:', result);
  }

  /**
   * Manually ingest a message
   */
  async manualIngest(messageText: string): Promise<IngestionResult> {
    if (!this.currentUserId || !this.currentAccountId) {
      throw new Error('User ID and Account ID required');
    }

    const message: UnifiedMessage = {
      rawText: messageText,
      sourceType: 'Manual',
      timestamp: new Date(),
      senderIdentifier: 'manual_input',
      platform: Platform.OS as any,
      confidenceHint: 0.5,
    };

    return this.ingestionService.ingest(message, this.currentUserId, this.currentAccountId);
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<IngestionSettings>): void {
    this.ingestionService.updateSettings(settings);

    // Re-enable/disable listeners based on settings
    if (Platform.OS === 'android') {
      if (settings.androidSmsEnabled && !this.androidSmsListener?.isActive()) {
        this.androidSmsListener?.startListening(
          (message) => this.handleMessage(message)
        );
      } else if (settings.androidSmsEnabled === false && this.androidSmsListener?.isActive()) {
        this.androidSmsListener?.stopListening();
      }
    }
  }

  /**
   * Get current settings
   */
  getSettings(): IngestionSettings {
    return this.ingestionService.getSettings();
  }

  /**
   * Set confidence threshold
   */
  setConfidenceThreshold(threshold: number): void {
    this.ingestionService.setConfidenceThreshold(threshold);
  }

  /**
   * Get current confidence threshold
   */
  getConfidenceThreshold(): number {
    return this.ingestionService.getSettings().confidenceThreshold;
  }

  /**
   * Enable/disable source
   */
  setSourceEnabled(sourceType: string, enabled: boolean): void {
    this.ingestionService.setSourceEnabled(sourceType, enabled);
  }

  /**
   * Get ingestion service
   */
  getIngestionService(): UnifiedTransactionIngestionService {
    return this.ingestionService;
  }

  /**
   * Get Android SMS listener (Android only)
   */
  getAndroidSmsListener(): AndroidSmsListener | null {
    return this.androidSmsListener;
  }

  /**
   * Get iOS notification listener (iOS only)
   */
  getIosNotificationListener(): IosNotificationListener | null {
    return this.iosNotificationListener;
  }

  /**
   * Get current platform
   */
  static getPlatform(): 'ios' | 'android' | 'web' {
    return Platform.OS as any;
  }

  /**
   * Check if platform supports automatic ingestion
   */
  static supportsAutomaticIngestion(): boolean {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopListeners();
    this.currentUserId = null;
    this.currentAccountId = null;
  }
}

// Export singleton
export const crossPlatformManager = new CrossPlatformIngestionManager();

export default CrossPlatformIngestionManager;
