/**
 * Notifications Context
 * Global state management for notification preferences and settings
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import { notificationPreferencesManager } from '../lib/notifications/notificationPreferences';
import { pushTokenManager } from '../lib/notifications/pushTokens';
import { NotificationPreferences } from '../lib/notifications/types';

interface NotificationsContextType {
  // State
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  isPushEnabled: boolean;

  // Methods
  loadPreferences: (userId: string) => Promise<void>;
  savePreferences: (preferences: NotificationPreferences) => Promise<boolean>;
  updatePreference: (path: string[], value: any) => Promise<boolean>;
  resetToDefaults: (userId: string) => Promise<boolean>;
  registerPushToken: () => Promise<boolean>;
  syncTokenWithBackend: (userId: string) => Promise<boolean>;
  isNotificationAllowed: () => boolean;
  clearError: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  /**
   * Load preferences from database
   */
  const loadPreferences = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const prefs = await notificationPreferencesManager.getPreferences(userId);
      if (prefs) {
        setPreferences(prefs);
        console.log('✅ Preferences loaded');
      } else {
        console.warn('⚠️ Failed to load preferences');
        setError('Failed to load preferences');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading preferences';
      setError(errorMessage);
      console.error('❌ Error loading preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save preferences to database
   */
  const savePreferences = useCallback(async (prefs: NotificationPreferences) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await notificationPreferencesManager.savePreferences(prefs);
      if (success) {
        setPreferences(prefs);
        console.log('✅ Preferences saved');
        return true;
      } else {
        setError('Failed to save preferences');
        console.error('❌ Failed to save preferences');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error saving preferences';
      setError(errorMessage);
      console.error('❌ Error saving preferences:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update specific preference
   */
  const updatePreference = useCallback(
    async (path: string[], value: any) => {
      if (!preferences) {
        setError('Preferences not loaded');
        return false;
      }

      setIsLoading(true);
      setError(null);
      try {
        const success = await notificationPreferencesManager.updatePreference(
          preferences.userId,
          path,
          value
        );
        if (success) {
          // Reload preferences to ensure consistency
          await loadPreferences(preferences.userId);
          return true;
        } else {
          setError('Failed to update preference');
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error updating preference';
        setError(errorMessage);
        console.error('❌ Error updating preference:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [preferences, loadPreferences]
  );

  /**
   * Reset to default preferences
   */
  const resetToDefaults = useCallback(
    async (userId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const success = await notificationPreferencesManager.resetToDefaults(userId);
        if (success) {
          await loadPreferences(userId);
          return true;
        } else {
          setError('Failed to reset preferences');
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error resetting preferences';
        setError(errorMessage);
        console.error('❌ Error resetting preferences:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [loadPreferences]
  );

  /**
   * Register push token
   */
  const registerPushToken = useCallback(async () => {
    try {
      const response = await pushTokenManager.registerDevice();
      if (response.success) {
        setIsPushEnabled(true);
        console.log('✅ Push token registered');
        return true;
      } else {
        setError(response.error || 'Failed to register push token');
        console.error('❌ Failed to register push token:', response.error);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error registering push token';
      setError(errorMessage);
      console.error('❌ Error registering push token:', err);
      return false;
    }
  }, []);

  /**
   * Sync token with backend
   */
  const syncTokenWithBackend = useCallback(async (userId: string) => {
    try {
      const response = await pushTokenManager.syncTokenWithBackend(userId);
      if (response.success) {
        setIsPushEnabled(true);
        console.log('✅ Token synced with backend');
        return true;
      } else {
        setError(response.error || 'Failed to sync token');
        console.error('❌ Failed to sync token:', response.error);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error syncing token';
      setError(errorMessage);
      console.error('❌ Error syncing token:', err);
      return false;
    }
  }, []);

  /**
   * Check if notification is allowed based on preferences
   */
  const isNotificationAllowed = useCallback(() => {
    if (!preferences) return false;
    return notificationPreferencesManager.isNotificationAllowed(preferences);
  }, [preferences]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: NotificationsContextType = {
    preferences,
    isLoading,
    error,
    isPushEnabled,
    loadPreferences,
    savePreferences,
    updatePreference,
    resetToDefaults,
    registerPushToken,
    syncTokenWithBackend,
    isNotificationAllowed,
    clearError,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

/**
 * Hook to use Notifications context
 */
export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export default NotificationsContext;
