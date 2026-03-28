/**
 * Permission Manager
 * Handles Android SMS and Notification permissions
 * Tracks permission status and requests
 * Note: SMS permission on Android requires native implementation
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { offlineDatabase } from './OfflineDatabase';
import { PermissionStatus } from './types';

class PermissionManager {
  private isRequesting = false;
  private permissionCache: PermissionStatus | null = null;

  /**
   * Initialize permission tracking
   */
  async initialize(): Promise<void> {
    try {
      const cached = await offlineDatabase.getMetadataKey('permissionStatus');
      if (cached) {
        this.permissionCache = cached;
      }

      console.log('[PermissionManager] Initialized');
    } catch (error) {
      console.error('[PermissionManager] Initialization failed:', error);
    }
  }

  /**
   * Get current permission status
   */
  async getPermissionStatus(): Promise<PermissionStatus> {
    try {
      // Return cached if available
      if (this.permissionCache) {
        return this.permissionCache;
      }

      const status: PermissionStatus = {
        sms: 'not_requested',
        notifications: 'not_requested',
        readContacts: 'not_requested',
      };

      // Check notification permission (platform-independent)
      try {
        const notificationSettings = await Notifications.getPermissionsAsync();
        status.notifications = notificationSettings.granted ? 'granted' : 'denied';
      } catch (error) {
        console.warn('[PermissionManager] Could not check notification permission:', error);
      }

      // SMS and Contacts permissions require native implementation
      // For now, mark as not requested
      status.sms = 'not_requested';
      status.readContacts = 'not_requested';

      this.permissionCache = status;
      await offlineDatabase.setMetadata('permissionStatus', status);
      return status;
    } catch (error) {
      console.error('[PermissionManager] Failed to get permission status:', error);
      return {
        sms: 'denied',
        notifications: 'denied',
        readContacts: 'denied',
      };
    }
  }

  /**
   * Request SMS permission (Android only - requires native implementation)
   */
  async requestSmsPermission(): Promise<boolean> {
    if (!this.canRequest()) {
      return false;
    }

    try {
      this.isRequesting = true;

      if (Platform.OS !== 'android') {
        console.log('[PermissionManager] SMS permission not applicable on this platform');
        return false;
      }

      // SMS permission on Android requires native module
      // This is a placeholder - actual implementation would use native code
      console.log('[PermissionManager] SMS permission requires native implementation');

      // Update cache to track request
      if (this.permissionCache) {
        this.permissionCache.lastRequestedAt = this.permissionCache.lastRequestedAt || {};
        this.permissionCache.lastRequestedAt.sms = Date.now();
      }

      await offlineDatabase.setMetadata('permissionStatus', this.permissionCache);
      return false;
    } catch (error) {
      console.error('[PermissionManager] Failed to request SMS permission:', error);
      return false;
    } finally {
      this.isRequesting = false;
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!this.canRequest()) {
      return false;
    }

    try {
      this.isRequesting = true;

      const result = await Notifications.requestPermissionsAsync();
      const granted = result.granted;

      if (granted) {
        console.log('[PermissionManager] Notification permission granted');
      } else {
        console.log('[PermissionManager] Notification permission denied');
      }

      // Update cache
      if (this.permissionCache) {
        this.permissionCache.notifications = granted ? 'granted' : 'denied';
        this.permissionCache.lastRequestedAt = this.permissionCache.lastRequestedAt || {};
        this.permissionCache.lastRequestedAt.notifications = Date.now();
      }

      await offlineDatabase.setMetadata('permissionStatus', this.permissionCache);
      return granted;
    } catch (error) {
      console.error('[PermissionManager] Failed to request notification permission:', error);
      return false;
    } finally {
      this.isRequesting = false;
    }
  }

  /**
   * Request contacts permission (Android only - requires native implementation)
   */
  async requestContactsPermission(): Promise<boolean> {
    if (!this.canRequest()) {
      return false;
    }

    try {
      this.isRequesting = true;

      if (Platform.OS !== 'android') {
        console.log('[PermissionManager] Contacts permission not applicable on this platform');
        return false;
      }

      // Contacts permission on Android requires native module
      // This is a placeholder - actual implementation would use native code
      console.log('[PermissionManager] Contacts permission requires native implementation');

      // Update cache to track request
      if (this.permissionCache) {
        this.permissionCache.lastRequestedAt = this.permissionCache.lastRequestedAt || {};
        this.permissionCache.lastRequestedAt.readContacts = Date.now();
      }

      await offlineDatabase.setMetadata('permissionStatus', this.permissionCache);
      return false;
    } catch (error) {
      console.error('[PermissionManager] Failed to request contacts permission:', error);
      return false;
    } finally {
      this.isRequesting = false;
    }
  }

  /**
   * Request all permissions at once
   */
  async requestAllPermissions(): Promise<{
    sms: boolean;
    notifications: boolean;
    contacts: boolean;
  }> {
    try {
      console.log('[PermissionManager] Requesting all permissions');

      const sms = await this.requestSmsPermission();
      const notifications = await this.requestNotificationPermission();
      const contacts = await this.requestContactsPermission();

      return { sms, notifications, contacts };
    } catch (error) {
      console.error('[PermissionManager] Failed to request all permissions:', error);
      return { sms: false, notifications: false, contacts: false };
    }
  }

  /**
   * Check if SMS permission is granted
   */
  async hasSmsPermission(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    return status.sms === 'granted';
  }

  /**
   * Check if notification permission is granted
   */
  async hasNotificationPermission(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    return status.notifications === 'granted';
  }

  /**
   * Check if contacts permission is granted
   */
  async hasContactsPermission(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    return status.readContacts === 'granted';
  }

  /**
   * Check if can request permissions
   */
  private canRequest(): boolean {
    if (this.isRequesting) {
      console.log('[PermissionManager] Permission request already in progress');
      return false;
    }

    return true;
  }

  /**
   * Should request permissions on app start
   */
  async shouldRequestPermissionsOnStart(): Promise<boolean> {
    try {
      const metadata = await offlineDatabase.getMetadataKey('permissionsRequestedOnStart');
      return !metadata;
    } catch {
      return true;
    }
  }

  /**
   * Mark permissions as requested on start
   */
  async markPermissionsRequestedOnStart(): Promise<void> {
    try {
      await offlineDatabase.setMetadata('permissionsRequestedOnStart', true);
    } catch (error) {
      console.error('[PermissionManager] Failed to mark permissions as requested:', error);
    }
  }

  /**
   * Reset permission request state
   */
  async resetPermissionState(): Promise<void> {
    try {
      this.permissionCache = null;
      await offlineDatabase.setMetadata('permissionStatus', null);
      await offlineDatabase.setMetadata('permissionsRequestedOnStart', null);
      console.log('[PermissionManager] Permission state reset');
    } catch (error) {
      console.error('[PermissionManager] Failed to reset permission state:', error);
    }
  }
}

export const permissionManager = new PermissionManager();
