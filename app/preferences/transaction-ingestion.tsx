/**
 * Transaction Ingestion Settings Screen
 * UI for configuring auto-transaction detection
 */

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
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
    ingestManually,
  } = useTransactionIngestion();

  const { colors } = useTheme();
  const [loading, setLoading] = useState(!isInitialized);
  const [testMessage, setTestMessage] = useState('HDFC Bank: ₹5,000 debited to AC XX0001 on 14-Feb-2026');
  const [testingInProgress, setTestingInProgress] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestResults, setShowTestResults] = useState(false);

  useEffect(() => {
    setLoading(!isInitialized);
  }, [isInitialized]);

  const handleTestMessage = async () => {
    if (!testMessage.trim()) {
      Alert.alert('Error', 'Please enter a test message');
      return;
    }

    setTestingInProgress(true);
    setTestResult(null);
    setShowTestResults(false);

    try {
      const result = await ingestManually(testMessage);
      setTestResult(result);
      setShowTestResults(true);
    } catch (error) {
      Alert.alert('Error', `Testing failed: ${error}`);
    } finally {
      setTestingInProgress(false);
    }
  };

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

  // Test message templates
  const testTemplates = [
    {
      name: 'HDFC Debit',
      text: 'HDFC Bank: ₹5,000 debited to AC XX0001 on 14-Feb-2026. Avl Bal: ₹50,000',
    },
    {
      name: 'ICICI Credit',
      text: 'ICICI: You have received ₹1,50,000 in your Salary account. Ref: SAL202602',
    },
    {
      name: 'PhonePe Transfer',
      text: 'PhonePe: ₹2,500 sent to Rahul Kumar. Ref: PHU123456',
    },
    {
      name: 'Google Pay Fraud',
      text: 'ALERT: Suspicious activity detected. Card blocked temporarily.',
    },
    {
      name: 'SBI Multiple',
      text: 'SBI: Payment ₹10,000 + tax ₹500 to Electricity Bill. Total: ₹10,500',
    },
  ];

  const loadTestTemplate = (template: { name: string; text: string }) => {
    setTestMessage(template.text);
  };

  const getStatusIndicator = () => {
    if (!settings) return null;

    const isEnabled = settings.autoDetectionEnabled;
    const activeSourceCount = [
      settings.androidSmsEnabled,
      settings.notificationsEnabled,
      settings.manualScanEnabled,
    ].filter(Boolean).length;

    return {
      enabled: isEnabled,
      activeSourceCount,
      status: isEnabled ? (activeSourceCount > 0 ? 'active' : 'misconfigured') : 'disabled',
      message: isEnabled
        ? activeSourceCount > 0
          ? `Monitoring ${activeSourceCount} source(s)`
          : 'No sources enabled'
        : 'Auto-detection disabled',
    };
  };

  const statusInfo = getStatusIndicator();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'misconfigured':
        return colors.warning;
      default:
        return colors.danger;
    }
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

      {/* Status Indicator */}
      {statusInfo && (
        <TouchableOpacity
          style={[
            styles.statusCard,
            {
              backgroundColor: getStatusColor(statusInfo.status),
              opacity: 0.1,
            },
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.statusContent}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(statusInfo.status) },
              ]}
            />
            <View style={styles.statusText}>
              <ThemedText
                type="subtitle"
                style={[
                  styles.statusTitle,
                  { color: getStatusColor(statusInfo.status) },
                ]}
              >
                {statusInfo.status === 'active'
                  ? '🟢 Active'
                  : statusInfo.status === 'misconfigured'
                  ? '🟡 Misconfigured'
                  : '🔴 Disabled'}
              </ThemedText>
              <ThemedText
                style={[
                  styles.statusDescription,
                  { color: getStatusColor(statusInfo.status) },
                ]}
              >
                {statusInfo.message}
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Manual Testing Interface */}
      <ThemedView style={[styles.section, { borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">🧪 Manual Testing</ThemedText>
          <ThemedText style={styles.sectionDescription}>
            Test the detection system with sample messages
          </ThemedText>
        </View>

        {/* Test Message Input */}
        <View style={styles.testInputContainer}>
          <TextInput
            style={[
              styles.testInput,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.surface,
              },
            ]}
            placeholder="Enter a test message..."
            placeholderTextColor={colors.text + '50'}
            value={testMessage}
            onChangeText={setTestMessage}
            editable={!testingInProgress}
            multiline
          />
        </View>

        {/* Test Templates */}
        <ThemedText style={styles.templatesLabel}>Quick Templates:</ThemedText>
        <View style={styles.templatesContainer}>
          {testTemplates.map((template) => (
            <TouchableOpacity
              key={template.name}
              style={[
                styles.templateButton,
                { borderColor: colors.accent },
              ]}
              onPress={() => loadTestTemplate(template)}
              disabled={testingInProgress}
            >
              <ThemedText style={styles.templateButtonText}>
                {template.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Test Button */}
        <TouchableOpacity
          style={[
            styles.testButton,
            {
              backgroundColor: colors.accent,
              opacity: testingInProgress ? 0.6 : 1,
            },
          ]}
          onPress={handleTestMessage}
          disabled={testingInProgress}
        >
          {testingInProgress ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.testButtonText}>
              ▶️ Test Message
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Test Results */}
        {showTestResults && testResult && (
          <View
            style={[
              styles.testResultsContainer,
              {
                backgroundColor: testResult.success
                  ? colors.success + '15'
                  : colors.danger + '15',
                borderColor: testResult.success
                  ? colors.success
                  : colors.danger,
              },
            ]}
          >
            <ThemedText
              type="subtitle"
              style={[
                styles.resultsTitle,
                {
                  color: testResult.success ? colors.success : colors.danger,
                },
              ]}
            >
              {testResult.success ? '✅ Success' : '❌ Failed'}
            </ThemedText>

            {testResult.extraction && (
              <View style={styles.resultItem}>
                <ThemedText style={styles.resultLabel}>Amount:</ThemedText>
                <ThemedText style={styles.resultValue}>
                  {testResult.extraction.amount || 'Not detected'}{' '}
                  {testResult.extraction.currency || ''}
                </ThemedText>
              </View>
            )}

            {testResult.classification && (
              <>
                <View style={styles.resultItem}>
                  <ThemedText style={styles.resultLabel}>Intent:</ThemedText>
                  <ThemedText style={styles.resultValue}>
                    {testResult.classification.intent || 'Unknown'}
                  </ThemedText>
                </View>

                <View style={styles.resultItem}>
                  <ThemedText style={styles.resultLabel}>
                    Confidence:
                  </ThemedText>
                  <ThemedText style={styles.resultValue}>
                    {Math.round(
                      (testResult.classification.confidence || 0) * 100
                    )}
                    %
                  </ThemedText>
                </View>
              </>
            )}

            {testResult.message && (
              <View style={styles.resultItem}>
                <ThemedText style={styles.resultLabel}>Message:</ThemedText>
                <ThemedText style={styles.resultValue}>
                  {testResult.message}
                </ThemedText>
              </View>
            )}
          </View>
        )}
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
  statusCard: {
    margin: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDescription: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
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
  testInputContainer: {
    marginBottom: 16,
  },
  testInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    maxHeight: 120,
    fontSize: 13,
    lineHeight: 18,
  },
  templatesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  templatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  templateButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  templateButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  testButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  testResultsContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  resultsTitle: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
  resultItem: {
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 2,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '500',
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
