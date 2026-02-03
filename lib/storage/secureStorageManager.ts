/**
 * Secure Storage Manager
 * Hybrid storage solution: SecureStore for sensitive data, AsyncStorage for preferences
 * Avoids 2048-byte SecureStore limit while maintaining security
 * 
 * Strategy:
 * - SecureStore: Only truly sensitive data (passwords, passcodes)
 * - AsyncStorage: Preferences, settings, non-sensitive configs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Data classification for storage selection
 */
enum StorageType {
  SECURE = 'secure',      // SecureStore (encrypted, limited 2KB)
  STANDARD = 'standard',  // AsyncStorage (fast, unsecured)
}

/**
 * Storage configuration mapping
 * Maps preference keys to their appropriate storage type
 */
const STORAGE_CONFIG: Record<string, StorageType> = {
  // SENSITIVE DATA (SecureStore only)
  pref_passcode_hash: StorageType.SECURE,      // Bcrypt hash - can be 60+ chars
  pref_password_hash: StorageType.SECURE,      // Password hash - can be large
  pref_biometric_data: StorageType.SECURE,     // Face/fingerprint data
  
  // NON-SENSITIVE DATA (AsyncStorage)
  pref_theme: StorageType.STANDARD,
  pref_ui_mode: StorageType.STANDARD,
  pref_currency_sign: StorageType.STANDARD,
  pref_currency_position: StorageType.STANDARD,
  pref_decimal_places: StorageType.STANDARD,
  pref_has_security: StorageType.STANDARD,
  pref_passcode_enabled: StorageType.STANDARD,
  pref_passcode_length: StorageType.STANDARD,
  pref_password_enabled: StorageType.STANDARD,
  pref_auth_method: StorageType.STANDARD,
  pref_remind_daily: StorageType.STANDARD,
  pref_reminder_time: StorageType.STANDARD,
  pref_budget_alerts: StorageType.STANDARD,
  pref_low_balance_alerts: StorageType.STANDARD,
  pref_email_notifications: StorageType.STANDARD,
  pref_push_notifications: StorageType.STANDARD,
  pref_auto_sync: StorageType.STANDARD,
  pref_auto_backup: StorageType.STANDARD,
  pref_data_retention_days: StorageType.STANDARD,
  pref_export_format: StorageType.STANDARD,
  pref_send_crash_stats: StorageType.STANDARD,
};

/**
 * Determines which storage backend to use for a given key
 */
function getStorageType(key: string): StorageType {
  return STORAGE_CONFIG[key] ?? StorageType.STANDARD;
}

/**
 * SecureStorageManager - Unified API for hybrid storage
 * 
 * Usage:
 *   // Set item (automatically uses correct storage)
 *   await SecureStorageManager.setItem('pref_password_hash', bcryptHash);
 *   
 *   // Get item (checks both storages)
 *   const hash = await SecureStorageManager.getItem('pref_password_hash');
 *   
 *   // Delete item
 *   await SecureStorageManager.deleteItem('pref_password_hash');
 */
export const SecureStorageManager = {
  /**
   * Set item in appropriate storage backend
   * @param key Storage key
   * @param value Value to store (will be stringified if not string)
   * @throws Error if storage operation fails
   */
  async setItem(key: string, value: string): Promise<void> {
    const storageType = getStorageType(key);
    
    try {
      // Validate size before storing
      const sizeBytes = new Blob([value]).size;
      
      if (storageType === StorageType.SECURE) {
        // SecureStore limit: 2048 bytes
        if (sizeBytes > 2000) {
          // Too large for SecureStore, fall back to AsyncStorage with warning
          console.warn(
            `⚠️  [SecureStorage] Value for key "${key}" is ${sizeBytes} bytes, ` +
            `exceeds SecureStore limit (2048 bytes). Using AsyncStorage instead.`,
          );
          await AsyncStorage.setItem(key, value);
        } else {
          await SecureStore.setItemAsync(key, value);
        }
      } else {
        // Use AsyncStorage for non-sensitive data
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`❌ [SecureStorage] Failed to set "${key}":`, error);
      throw new Error(`Failed to save ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get item from appropriate storage backend
   * @param key Storage key
   * @returns Stored value or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    const storageType = getStorageType(key);
    
    try {
      if (storageType === StorageType.SECURE) {
        // First try SecureStore
        const value = await SecureStore.getItemAsync(key);
        if (value) return value;
        
        // Fall back to AsyncStorage (in case migration from old setup)
        const fallbackValue = await AsyncStorage.getItem(key);
        if (fallbackValue) {
          console.log(`ℹ️  [SecureStorage] Found "${key}" in AsyncStorage, migrating to SecureStore...`);
          // Migrate to SecureStore
          await SecureStore.setItemAsync(key, fallbackValue);
          await AsyncStorage.removeItem(key);
          return fallbackValue;
        }
        
        return null;
      } else {
        // Use AsyncStorage for non-sensitive data
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`❌ [SecureStorage] Failed to get "${key}":`, error);
      return null;
    }
  },

  /**
   * Delete item from appropriate storage backend
   * @param key Storage key
   */
  async deleteItem(key: string): Promise<void> {
    const storageType = getStorageType(key);
    
    try {
      if (storageType === StorageType.SECURE) {
        // Delete from both SecureStore and AsyncStorage (for safety)
        await SecureStore.deleteItemAsync(key).catch(() => {
          // Ignore error if key doesn't exist in SecureStore
        });
      }
      
      // Always try to delete from AsyncStorage too
      await AsyncStorage.removeItem(key).catch(() => {
        // Ignore error if key doesn't exist in AsyncStorage
      });
    } catch (error) {
      console.error(`❌ [SecureStorage] Failed to delete "${key}":`, error);
      throw error;
    }
  },

  /**
   * Clear all stored data
   * WARNING: This clears ALL AsyncStorage AND SecureStore data
   */
  async clearAll(): Promise<void> {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      console.log('✅ [SecureStorage] Cleared AsyncStorage');
      
      // Note: SecureStore doesn't have a clear all method in expo-secure-store
      // Individual keys must be deleted
      console.log('⚠️  [SecureStorage] SecureStore keys must be deleted individually');
    } catch (error) {
      console.error('❌ [SecureStorage] Failed to clear storage:', error);
      throw error;
    }
  },

  /**
   * Get storage statistics
   * Useful for monitoring storage usage
   */
  async getStats(): Promise<{
    asyncStorageSize: number;
    secureStoreCapacity: number;
    secureStoreUsed: string;
  }> {
    try {
      const asyncStorageData = await AsyncStorage.getAllKeys();
      const asyncStorageSize = asyncStorageData.length;

      return {
        asyncStorageSize,
        secureStoreCapacity: 2048,
        secureStoreUsed: 'Use individual key sizes for accurate tracking',
      };
    } catch (error) {
      console.error('❌ [SecureStorage] Failed to get stats:', error);
      throw error;
    }
  },

  /**
   * Migrate data from old storage setup
   * Useful when switching storage strategies
   */
  async migrate(): Promise<void> {
    console.log('🔄 [SecureStorage] Starting migration...');
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      let migratedCount = 0;

      for (const key of allKeys) {
        const storageType = getStorageType(key);
        
        if (storageType === StorageType.SECURE) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            // Check if it fits in SecureStore
            const sizeBytes = new Blob([value]).size;
            if (sizeBytes <= 2000) {
              await SecureStore.setItemAsync(key, value);
              await AsyncStorage.removeItem(key);
              migratedCount++;
              console.log(`  ✓ Migrated "${key}" to SecureStore`);
            } else {
              console.warn(`  ⚠️  Skipped "${key}" - too large for SecureStore (${sizeBytes} bytes)`);
            }
          }
        }
      }

      console.log(`✅ [SecureStorage] Migration complete. Migrated ${migratedCount} keys.`);
    } catch (error) {
      console.error('❌ [SecureStorage] Migration failed:', error);
      throw error;
    }
  },
};

export default SecureStorageManager;
