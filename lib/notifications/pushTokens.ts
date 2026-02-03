/**
 * Push Token Management
 * Handles registration, renewal, and device token synchronization
 */

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import SecureStorageManager from '../storage/secureStorageManager';
import { supabase } from '../supabase';
import { NotificationToken, PushTokenResponse } from './types';

// Local storage keys for push token management
const PUSH_TOKEN_KEY = 'expo_push_token';
const LAST_TOKEN_REFRESH_KEY = 'last_token_refresh';

/**
 * Push Token Manager
 */
export class PushTokenManager {
  private static instance: PushTokenManager;
  private currentToken: string | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PushTokenManager {
    if (!PushTokenManager.instance) {
      PushTokenManager.instance = new PushTokenManager();
    }
    return PushTokenManager.instance;
  }

  /**
   * Register device and get push token
   */
  async registerDevice(): Promise<PushTokenResponse> {
    try {
      // If running inside Expo Go on Android, push token registration via FCM isn't supported
      if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
        console.warn(
          '⚠️ Skipping push token registration: running inside Expo Go on Android. Build a custom dev client or standalone app and configure FCM (see https://docs.expo.dev/push-notifications/fcm-credentials/).'
        );
        return {
          success: false,
          error: 'UNSUPPORTED_ENV_EXPO_GO_ANDROID',
          message:
            'Expo Go on Android does not support FCM push tokens. Use a custom dev client or standalone build with FCM configured.',
        };
      }

      // Request notification permission
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== 'granted') {
        console.log('⚠️ Notification permission denied');
        return {
          success: false,
          error: 'Permission denied',
          message: 'User denied notification permission',
        };
      }

      // Get project ID
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.error('❌ EAS Project ID not found in app.json');
        return {
          success: false,
          error: 'Missing EAS Project ID',
          message: 'Cannot get push token without EAS Project ID',
        };
      }

      // Get push token
      let token;
      try {
        token = await Notifications.getExpoPushTokenAsync({ projectId });
      } catch (err: any) {
        // Detect common Firebase initialization error and return a helpful message
        const msg = err?.message || String(err);
        if (
          msg.includes('Default FirebaseApp is not initialized') ||
          msg.includes('Make sure to complete the guide')
        ) {
          console.error(
            '❌ Firebase not initialized for FCM. Ensure google-services.json / FCM credentials are configured (see https://docs.expo.dev/push-notifications/fcm-credentials/)'
          );
          return {
            success: false,
            error: 'FCM_NOT_INITIALIZED',
            message: 'Default FirebaseApp not initialized. Configure FCM credentials for Android per Expo docs.',
          };
        }
        throw err;
      }

      this.currentToken = token.data;

      // Save token locally
      await this.saveTokenLocally(token.data);

      console.log(`✅ Push token registered: ${token.data}`);

      return {
        success: true,
        token: token.data,
        message: 'Device registered successfully',
      };
    } catch (error) {
      console.error('❌ Error registering device:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to register device',
      };
    }
  }

  /**
   * Get current push token
   */
  async getToken(): Promise<string | null> {
    try {
      if (this.currentToken) {
        return this.currentToken;
      }

      // Try to get from secure storage
      const storedToken = await SecureStorageManager.getItem(PUSH_TOKEN_KEY);

      if (storedToken) {
        this.currentToken = storedToken;
        return storedToken;
      }

      // Get new token
      const response = await this.registerDevice();
      return response.token || null;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  }

  /**
   * Save token locally in secure storage
   */
  private async saveTokenLocally(token: string): Promise<void> {
    try {
      await SecureStorageManager.setItem(PUSH_TOKEN_KEY, token);
      await SecureStorageManager.setItem(
        LAST_TOKEN_REFRESH_KEY,
        new Date().toISOString()
      );
      console.log('💾 Token saved locally');
    } catch (error) {
      console.error('❌ Error saving token locally:', error);
    }
  }

  /**
   * Sync token with backend
   * Uses UPSERT to handle duplicate key constraints gracefully
   */
  async syncTokenWithBackend(userId: string): Promise<PushTokenResponse> {
    try {
      const token = await this.getToken();

      if (!token) {
        return {
          success: false,
          error: 'No token available',
          message: 'Cannot sync without valid push token',
        };
      }

      // Use UPSERT (insert with conflict update) to handle existing tokens
      // This avoids duplicate key constraint violations
      const { data, error } = await supabase
        .from('notification_tokens')
        .upsert(
          {
            user_id: userId,
            device_id: Constants.sessionId, // This is the unique key
            expo_push_token: token,
            os_type: Constants.platform?.os === 'ios' ? 'ios' : 'android',
            os_version: Constants.osVersion || 'unknown',
            app_version: Constants.expoConfig?.version || '1.0.0',
            registered_at: new Date().toISOString(),
            last_refreshed_at: new Date().toISOString(),
            is_valid: true,
          },
          {
            onConflict: 'user_id,device_id', // Match the unique constraint
          }
        )
        .select()
        .single();

      if (error) {
        // Handle the specific duplicate key error with graceful fallback
        if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
          console.warn('⚠️ Token already synced for this device, updating instead...');
          
          // Fallback: Update existing token
          const { data: updateData, error: updateError } = await supabase
            .from('notification_tokens')
            .update({
              expo_push_token: token,
              last_refreshed_at: new Date().toISOString(),
              is_valid: true,
            })
            .eq('user_id', userId)
            .eq('device_id', Constants.sessionId)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Error updating token:', updateError);
            return {
              success: false,
              error: updateError.message,
              message: 'Failed to update token in backend',
            };
          }

          console.log('✅ Token updated successfully');
          return {
            success: true,
            token,
            message: 'Token updated successfully',
          };
        }

        console.error('❌ Error syncing token to backend:', error);
        // Best-effort fallback to legacy table (push_tokens)
        try {
          const { error: legacyError } = await supabase
            .from('push_tokens')
            .upsert(
              {
                user_id: userId,
                token,
                platform: Constants.platform?.os === 'ios' ? 'ios' : 'android',
                is_valid: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,token' }
            );

          if (!legacyError) {
            console.log('✅ Token synced to legacy push_tokens table');
            return {
              success: true,
              token,
              message: 'Token synced successfully (legacy table)',
            };
          }
        } catch (legacyErr) {
          console.warn('⚠️ Legacy token sync failed:', legacyErr);
        }

        return {
          success: false,
          error: error.message,
          message: 'Failed to sync token with backend',
        };
      }

      console.log('✅ Token synced with backend');

      return {
        success: true,
        token,
        message: 'Token synced successfully',
      };
    } catch (error) {
      console.error('❌ Error syncing token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to sync token',
      };
    }
  }

  /**
   * Refresh token if expired
   */
  async refreshTokenIfNeeded(userId: string): Promise<PushTokenResponse> {
    try {
      const lastRefresh = await SecureStorageManager.getItem(
        LAST_TOKEN_REFRESH_KEY
      );

      if (lastRefresh) {
        const lastRefreshDate = new Date(lastRefresh);
        const daysSinceRefresh = Math.floor(
          (new Date().getTime() - lastRefreshDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Refresh every 7 days
        if (daysSinceRefresh < 7) {
          console.log(
            `⏭️ Token is fresh (${daysSinceRefresh} days old), skipping refresh`
          );
          return {
            success: true,
            token: this.currentToken || undefined,
            message: 'Token is still fresh',
          };
        }
      }

      console.log('🔄 Refreshing push token...');
      const registerResponse = await this.registerDevice();

      if (!registerResponse.success) {
        return registerResponse;
      }

      return this.syncTokenWithBackend(userId);
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to refresh token',
      };
    }
  }

  /**
   * Remove token from backend
   */
  async removeTokenFromBackend(userId: string): Promise<PushTokenResponse> {
    try {
      const { error } = await supabase
        .from('notification_tokens')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error removing token from backend:', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to remove token from backend',
        };
      }

      // Clear local token
      await SecureStorageManager.deleteItem(PUSH_TOKEN_KEY);
      await SecureStorageManager.deleteItem(LAST_TOKEN_REFRESH_KEY);
      this.currentToken = null;

      console.log('✅ Token removed from backend and local storage');

      return {
        success: true,
        message: 'Token removed successfully',
      };
    } catch (error) {
      console.error('❌ Error removing token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to remove token',
      };
    }
  }

  /**
   * Get token info from backend
   */
  async getTokenInfo(userId: string): Promise<NotificationToken | null> {
    try {
      const { data, error } = await supabase
        .from('notification_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching token info:', error);
        return null;
      }

      return data as NotificationToken;
    } catch (error) {
      console.error('❌ Error getting token info:', error);
      return null;
    }
  }

  /**
   * Validate token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // Token validation - basic check
      const isValid: boolean = token && token.length > 10 ? true : false;
      console.log(
        `${isValid ? '✅' : '❌'} Token validation: ${isValid ? 'valid' : 'invalid'}`
      );
      return isValid;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      return false;
    }
  }

  /**
   * Clear all stored tokens
   */
  async clearAllTokens(): Promise<void> {
    try {
      await SecureStorageManager.deleteItem(PUSH_TOKEN_KEY);
      await SecureStorageManager.deleteItem(LAST_TOKEN_REFRESH_KEY);
      this.currentToken = null;
      console.log('🗑️ All stored tokens cleared');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }
}

/**
 * Convenience export - default instance
 */
export const pushTokenManager = PushTokenManager.getInstance();
