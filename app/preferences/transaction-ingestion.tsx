/**
 * Transaction Ingestion Settings Screen
 * UI for configuring auto-transaction detection
 */

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useTheme } from '../../context/Theme';
import { useTransactionIngestion } from '../../context/TransactionIngestion';

/**
 * Transaction Ingestion Settings Screen
 */
export default function TransactionIngestionSettingsScreen() {
  const {
    settings,
    updateSettings,
    confidenceThreshold,
    setConfidenceThreshold,
    setSourceEnabled,
    isInitialized,
    debugMode,
    toggleDebugMode,
  } = useTransactionIngestion();

  const { colors } = useTheme();
  const [loading, setLoading] = useState(!isInitialized);

  useEffect(() => {
    setLoading(!isInitialized);
  }, [isInitialized]);

  if (loading || !settings) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
      </ThemedView>
    );
  }

  const handleToggleAutoDetection = (value: boolean) => {
    updateSettings({ autoDetectionEnabled: value });
  };

  const handleToggleSms = (value: boolean) => {
    setSourceEnabled('SMS', value);
  };

  const handleToggleNotifications = (value: boolean) => {
    setSourceEnabled('Notification', value);
  };

  const handleToggleEmail = (value: boolean) => {
    setSourceEnabled('Email', value);
  };

  const handleToggleManual = (value: boolean) => {
    setSourceEnabled('Manual', value);
  };

  const handleToggleAutoCategory = (value: boolean) => {
    updateSettings({ autoCategoryEnabled: value });
  };

  const handleConfidenceChange = (value: number) => {
    setConfidenceThreshold(value);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          📲 Transaction Auto-Detection
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Configure automatic transaction ingestion from your bank
        </ThemedText>
      </ThemedView>

      {/* Main Toggle Section */}
      <ThemedView style={[styles.section, { borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Enable Auto-Detection</ThemedText>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <ThemedText>Automatic Detection</ThemedText>
            <ThemedText style={styles.settingDescription}>
              {settings.autoDetectionEnabled
                ? 'Transactions will be automatically detected'
                : 'Manual ingestion only'}
            </ThemedText>
          </View>
          <Switch
            value={settings.autoDetectionEnabled}
            onValueChange={handleToggleAutoDetection}
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={settings.autoDetectionEnabled ? colors.success : '#f4f3f4'}
          />
        </View>
      </ThemedView>

      {/* Sources Configuration */}
      <ThemedView style={[styles.section, { borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Data Sources</ThemedText>
          <ThemedText style={styles.sectionDescription}>
            Choose which sources to monitor for transactions
          </ThemedText>
        </View>

        {/* Platform-specific sources */}
        {Platform.OS === 'android' && (
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <ThemedText>📨 SMS Messages</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Monitor bank SMS for transactions
              </ThemedText>
            </View>
            <Switch
              value={settings.androidSmsEnabled}
              onValueChange={handleToggleSms}
              trackColor={{ false: '#767577', true: colors.accent }}
              thumbColor={settings.androidSmsEnabled ? colors.success : '#f4f3f4'}
              disabled={!settings.autoDetectionEnabled}
            />
          </View>
        )}

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <ThemedText>🔔 Notifications</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Monitor bank app notifications
            </ThemedText>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={settings.notificationsEnabled ? colors.success : '#f4f3f4'}
            disabled={!settings.autoDetectionEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <ThemedText>✋ Manual Scan</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Allow manual transaction entry
            </ThemedText>
          </View>
          <Switch
            value={settings.manualScanEnabled}
            onValueChange={handleToggleManual}
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={settings.manualScanEnabled ? colors.success : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <ThemedText>📧 Email Parsing</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Parse bank emails (coming soon)
            </ThemedText>
          </View>
          <Switch
            value={settings.emailParsingEnabled}
            onValueChange={handleToggleEmail}
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={settings.emailParsingEnabled ? colors.success : '#f4f3f4'}
            disabled={true}
          />
        </View>
      </ThemedView>

      {/* Processing Settings */}
      <ThemedView style={[styles.section, { borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Processing Options</ThemedText>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <ThemedText>🤖 Auto-Categorize</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Automatically suggest transaction categories
            </ThemedText>
          </View>
          <Switch
            value={settings.autoCategoryEnabled}
            onValueChange={handleToggleAutoCategory}
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={settings.autoCategoryEnabled ? colors.success : '#f4f3f4'}
          />
        </View>

        {/* Confidence Threshold */}
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <ThemedText>🎯 Confidence Threshold</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Minimum confidence: {Math.round(confidenceThreshold * 100)}%
            </ThemedText>
            <ThemedText style={styles.settingHint}>
              Higher threshold = fewer false positives, may miss transactions
            </ThemedText>
          </View>
        </View>

        {/* Threshold Slider */}
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={[
              styles.thresholdButton,
              confidenceThreshold === 0.4 && {
                backgroundColor: colors.accent,
              },
            ]}
            onPress={() => handleConfidenceChange(0.4)}
          >
            <ThemedText style={[styles.thresholdButtonText]}>Low (40%)</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.thresholdButton,
              confidenceThreshold === 0.6 && {
                backgroundColor: colors.accent,
              },
            ]}
            onPress={() => handleConfidenceChange(0.6)}
          >
            <ThemedText style={[styles.thresholdButtonText]}>Medium (60%)</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.thresholdButton,
              confidenceThreshold === 0.8 && {
                backgroundColor: colors.accent,
              },
            ]}
            onPress={() => handleConfidenceChange(0.8)}
          >
            <ThemedText style={[styles.thresholdButtonText]}>High (80%)</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Debug Mode */}
      <ThemedView style={[styles.section, { borderColor: colors.border }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <ThemedText>🐛 Debug Mode</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Log detailed processing information
            </ThemedText>
          </View>
          <Switch
            value={debugMode}
            onValueChange={toggleDebugMode}
            trackColor={{ false: '#767577', true: colors.warning }}
            thumbColor={debugMode ? colors.warning : '#f4f3f4'}
          />
        </View>
      </ThemedView>

      {/* Info Section */}
      <ThemedView style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        <ThemedText type="subtitle" style={styles.infoTitle}>
          ℹ️ How It Works
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • Your bank sends transaction alerts via SMS or notifications
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • We automatically detect and extract transaction details
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • Transactions are added to your records with suggested categories
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • You can edit or delete auto-added transactions anytime
        </ThemedText>
      </ThemedView>

      {/* Privacy Section */}
      <ThemedView style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        <ThemedText type="subtitle" style={styles.infoTitle}>
          🔒 Privacy & Security
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • Your messages are processed locally on your device
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • We extract only transaction data, never store full messages
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • All data is encrypted and synced to your secure account
        </ThemedText>
      </ThemedView>

      {/* Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingLabel: {
    flex: 1,
    marginRight: 12,
  },
  settingDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  settingHint: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 4,
    fontStyle: 'italic',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  thresholdButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  thresholdButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    marginBottom: 12,
    fontSize: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.8,
  },
});
