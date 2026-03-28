/**
 * Offline System Index
 * Central export point for all offline-first architecture modules
 */

// Types
export * from './types';

// Services
export { backgroundServiceManager } from './BackgroundServiceManager';
export { offlineDatabase } from './OfflineDatabase';
export { offlineTransactionProcessingService } from './OfflineTransactionProcessingService';
export { permissionManager } from './PermissionManager';
export { syncManager } from './SyncManager';

