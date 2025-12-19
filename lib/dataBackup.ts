import { readAccounts, readBudgets, readCategories, readRecords } from './finance';
import { supabase } from './supabase';

/**
 * DATA BACKUP & RESTORE SERVICE
 * 
 * Handles creating, uploading, and restoring complete data backups to/from Supabase Storage.
 * Backups (.mbak or .json) contain all app data and CAN be restored.
 */

export interface BackupData {
  version: string;
  createdAt: string;
  userId: string;
  records: any[];
  accounts: any[];
  categories: any[];
  budgets: any[];
  metadata: {
    recordCount: number;
    accountCount: number;
    categoryCount: number;
    budgetCount: number;
  };
}

export interface BackupFile {
  id: string;
  name: string;
  createdAt: string;
  size: number;
  url: string;
}

// Constants
const BACKUP_BUCKET = 'user-backups';
const BACKUP_FILE_EXTENSION = '.mbak';
const BACKUP_VERSION = '1.0.0';

/**
 * Create a complete backup of all user data
 * @param userId User ID to identify the backup
 * @returns Backup data object
 */
export const createBackup = async (userId: string): Promise<BackupData> => {
  try {
    // Fetch all data
    const [records, accounts, categories, budgets] = await Promise.all([
      readRecords(),
      readAccounts(),
      readCategories(),
      readBudgets(),
    ]);

    // Create backup object
    const backup: BackupData = {
      version: BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      userId,
      records: records || [],
      accounts: accounts || [],
      categories: categories || [],
      budgets: budgets || [],
      metadata: {
        recordCount: records?.length || 0,
        accountCount: accounts?.length || 0,
        categoryCount: categories?.length || 0,
        budgetCount: budgets?.length || 0,
      },
    };

    return backup;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error(`Failed to create backup: ${error}`);
  }
};

/**
 * Upload backup to Supabase Storage
 * @param backup Backup data to upload
 * @param userId User ID for folder organization
 * @returns File path in storage
 */
export const uploadBackupToStorage = async (backup: BackupData, userId: string): Promise<string> => {
  try {
    // Ensure bucket exists or create path
    const timestamp = new Date().getTime();
    const backupName = `backup-${timestamp}${BACKUP_FILE_EXTENSION}`;
    const filePath = `${userId}/${backupName}`;

    // Convert backup to JSON string
    const backupJson = JSON.stringify(backup, null, 2);

    // Convert string to Uint8Array for React Native compatibility
    const uint8Array = new TextEncoder().encode(backupJson);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(filePath, uint8Array, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/json',
      });

    if (error) {
      throw new Error(error.message);
    }

    console.log('Backup uploaded successfully:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error uploading backup:', error);
    throw new Error(`Failed to upload backup: ${error}`);
  }
};

/**
 * List all backup files for a user
 * @param userId User ID to fetch backups for
 * @returns Array of backup files
 */
export const listUserBackups = async (userId: string): Promise<BackupFile[]> => {
  try {
    // List files in user's backup folder
    const { data, error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .list(userId);

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Map files to BackupFile interface
    const backups: BackupFile[] = data
      .filter((file) => file.name.endsWith(BACKUP_FILE_EXTENSION))
      .map((file) => {
        const createdAt = file.updated_at || new Date().toISOString();
        return {
          id: file.id || `${userId}/${file.name}`,
          name: file.name.replace(BACKUP_FILE_EXTENSION, ''),
          createdAt,
          size: file.metadata?.size || 0,
          url: `${BACKUP_BUCKET}/${userId}/${file.name}`,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return backups;
  } catch (error) {
    console.error('Error listing backups:', error);
    throw new Error(`Failed to list backups: ${error}`);
  }
};

/**
 * Download a backup file from storage
 * @param userId User ID
 * @param backupName Backup file name (without extension)
 * @returns Parsed backup data
 */
export const downloadBackup = async (userId: string, backupName: string): Promise<BackupData> => {
  try {
    const filePath = `${userId}/${backupName}${BACKUP_FILE_EXTENSION}`;

    // Download file from storage
    const { data, error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .download(filePath);

    if (error) {
      throw new Error(error.message);
    }

    // Handle different data types from Supabase
    let text: string;
    
    if (!data) {
      throw new Error('No data returned from backup file');
    }

    // Check if it's a Blob (React Native/Expo)
    if (data instanceof Blob) {
      text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read backup file'));
        };
        reader.readAsText(data);
      });
    } else if (typeof data === 'string') {
      // Already a string
      text = data;
    } else if (typeof (data as any).text === 'function') {
      // Has text() method (standard Response)
      text = await (data as any).text();
    } else {
      // Fallback: convert to string
      text = JSON.stringify(data);
    }

    const backup: BackupData = JSON.parse(text);

    // Validate backup structure
    if (!backup.version || !backup.createdAt || !backup.records) {
      throw new Error('Invalid backup file format');
    }

    return backup;
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw new Error(`Failed to download backup: ${error}`);
  }
};

/**
 * Delete a backup file from storage
 * @param userId User ID
 * @param backupName Backup file name (without extension)
 */
export const deleteBackupFile = async (userId: string, backupName: string): Promise<void> => {
  try {
    const filePath = `${userId}/${backupName}${BACKUP_FILE_EXTENSION}`;

    const { error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new Error(error.message);
    }

    console.log('Backup deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting backup:', error);
    throw new Error(`Failed to delete backup: ${error}`);
  }
};

/**
 * Validate a backup file before restoration
 * @param backup Backup data to validate
 */
export const validateBackup = (backup: BackupData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!backup.version) {
    errors.push('Missing backup version');
  }

  if (!backup.createdAt) {
    errors.push('Missing creation timestamp');
  }

  if (!Array.isArray(backup.records)) {
    errors.push('Records must be an array');
  }

  if (!Array.isArray(backup.accounts)) {
    errors.push('Accounts must be an array');
  }

  if (!Array.isArray(backup.categories)) {
    errors.push('Categories must be an array');
  }

  if (!backup.metadata) {
    errors.push('Missing metadata');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Get backup file information including creation date and size
 * @param userId User ID
 * @param backupName Backup file name
 * @returns Backup metadata
 */
export const getBackupInfo = async (userId: string, backupName: string): Promise<any> => {
  try {
    const filePath = `${userId}/${backupName}${BACKUP_FILE_EXTENSION}`;

    // Get file metadata
    const { data, error } = await supabase.storage
      .from(BACKUP_BUCKET)
      .list(userId);

    if (error) {
      throw new Error(error.message);
    }

    const fileInfo = data?.find((f) => f.name === `${backupName}${BACKUP_FILE_EXTENSION}`);

    if (!fileInfo) {
      throw new Error('Backup file not found');
    }

    return {
      name: backupName,
      createdAt: fileInfo.updated_at || fileInfo.created_at,
      size: fileInfo.metadata?.size || 0,
      lastModified: fileInfo.updated_at,
    };
  } catch (error) {
    console.error('Error getting backup info:', error);
    throw new Error(`Failed to get backup info: ${error}`);
  }
};
