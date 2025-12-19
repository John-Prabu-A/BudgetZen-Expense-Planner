/**
 * Transaction Ingestion Context
 * React context for managing transaction detection service state
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import CrossPlatformIngestionManager from '../lib/transactionDetection/CrossPlatformIngestionManager';
import { IngestionResult, IngestionSettings } from '../lib/transactionDetection/types';
import { useAuth } from './Auth';

/**
 * Ingestion Context Type
 */
interface IngestionContextType {
  // Settings
  settings: IngestionSettings | null;
  updateSettings: (settings: Partial<IngestionSettings>) => void;
  
  // Control
  isInitialized: boolean;
  isListening: boolean;
  enableAutoDetection: () => void;
  disableAutoDetection: () => void;
  
  // Threshold
  confidenceThreshold: number;
  setConfidenceThreshold: (threshold: number) => void;
  
  // Source control
  setSourceEnabled: (sourceType: string, enabled: boolean) => void;
  
  // Manual ingestion
  ingestManually: (text: string) => Promise<IngestionResult>;
  
  // Debug
  getManager: () => CrossPlatformIngestionManager | null;
  toggleDebugMode: () => void;
  debugMode: boolean;
}

const IngestionContext = createContext<IngestionContextType | undefined>(undefined);

/**
 * Ingestion Provider Component
 */
export const IngestionProvider = ({
  children,
  initialSettings,
  accountId: providedAccountId,
}: {
  children: React.ReactNode;
  initialSettings?: Partial<IngestionSettings>;
  accountId?: string;
}) => {
  const { user } = useAuth();
  const [manager, setManager] = useState<CrossPlatformIngestionManager | null>(null);
  const [settings, setSettings] = useState<IngestionSettings | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Initialize manager
  useEffect(() => {
    if (!user?.id) return;

    // Use provided accountId or default to user ID
    const accountId = providedAccountId || user.id;

    const newManager = new CrossPlatformIngestionManager({
      ...initialSettings,
      debugMode,
    });

    newManager
      .initialize(user.id, accountId)
      .then(() => {
        setManager(newManager);
        setSettings(newManager.getSettings());
        setIsInitialized(true);
        setIsListening(true);
        console.log('[IngestionProvider] Initialized successfully for user:', user.id);
      })
      .catch((error) => {
        console.error('[IngestionProvider] Initialization failed:', error);
      });

    return () => {
      newManager.cleanup();
    };
  }, [user?.id, providedAccountId, initialSettings, debugMode]);

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<IngestionSettings>) => {
      if (manager) {
        manager.updateSettings(newSettings);
        setSettings(manager.getSettings());
      }
    },
    [manager]
  );

  // Enable auto-detection
  const enableAutoDetection = useCallback(() => {
    updateSettings({ autoDetectionEnabled: true });
  }, [updateSettings]);

  // Disable auto-detection
  const disableAutoDetection = useCallback(() => {
    updateSettings({ autoDetectionEnabled: false });
  }, [updateSettings]);

  // Set confidence threshold
  const setConfidenceThreshold = useCallback(
    (threshold: number) => {
      if (manager) {
        manager.setConfidenceThreshold(threshold);
        setSettings(manager.getSettings());
      }
    },
    [manager]
  );

  // Set source enabled
  const setSourceEnabled = useCallback(
    (sourceType: string, enabled: boolean) => {
      if (manager) {
        manager.setSourceEnabled(sourceType, enabled);
        setSettings(manager.getSettings());
      }
    },
    [manager]
  );

  // Manual ingestion
  const ingestManually = useCallback(
    async (text: string): Promise<IngestionResult> => {
      if (!manager) {
        return {
          success: false,
          error: 'Not initialized',
          reason: 'Ingestion manager not initialized',
          messageId: text,
          metadata: {},
        };
      }

      return manager.manualIngest(text);
    },
    [manager]
  );

  // Toggle debug mode
  const toggleDebugMode = useCallback(() => {
    setDebugMode((prev) => !prev);
  }, []);

  const value: IngestionContextType = {
    settings,
    updateSettings,
    isInitialized,
    isListening,
    enableAutoDetection,
    disableAutoDetection,
    confidenceThreshold: settings?.confidenceThreshold || 0.6,
    setConfidenceThreshold,
    setSourceEnabled,
    ingestManually,
    getManager: () => manager,
    toggleDebugMode,
    debugMode,
  };

  return (
    <IngestionContext.Provider value={value}>
      {children}
    </IngestionContext.Provider>
  );
};

/**
 * Hook to use ingestion context
 */
export const useTransactionIngestion = (): IngestionContextType => {
  const context = useContext(IngestionContext);
  if (!context) {
    throw new Error('useTransactionIngestion must be used within IngestionProvider');
  }
  return context;
};

export default IngestionProvider;
