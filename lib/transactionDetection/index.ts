/**
 * Transaction Detection Service - Main Export
 * Unified entry point for all transaction detection functionality
 */

// Types
export * from './types';

// Core Engines
export { classificationEngine, TransactionClassificationEngine } from './engines/ClassificationEngine';
export { DeduplicationEngine, deduplicationEngine } from './engines/DeduplicationEngine';
export { detectionEngine, TransactionDetectionEngine } from './engines/DetectionEngine';
export { MessageNormalizationEngine, normalizationEngine } from './engines/NormalizationEngine';
export { PersistenceLayer, persistenceLayer } from './engines/PersistenceLayer';

// Main Service
export {
  transactionIngestionService, UnifiedTransactionIngestionService
} from './UnifiedTransactionIngestionService';

// Platform Sources
export { AndroidSmsListener, androidSmsListener } from './sources/AndroidSmsListener';
export { IosNotificationListener, iosNotificationListener } from './sources/IosNotificationListener';

// Cross-Platform Manager
export { CrossPlatformIngestionManager, crossPlatformManager } from './CrossPlatformIngestionManager';

