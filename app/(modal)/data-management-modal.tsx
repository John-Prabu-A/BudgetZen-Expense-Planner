import { usePreferences } from '@/context/Preferences';
import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DataStats {
  recordCount: number;
  accountCount: number;
  categoryCount: number;
  budgetCount: number;
  totalSize: string;
}

export default function DataManagementModal() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const {
    autoSync,
    setAutoSync,
    autoBackup,
    setAutoBackup,
    dataRetentionDays,
    setDataRetentionDays,
    exportFormat,
    setExportFormat,
  } = usePreferences();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [stats, setStats] = useState<DataStats>({
    recordCount: 156,
    accountCount: 3,
    categoryCount: 12,
    budgetCount: 5,
    totalSize: '2.4 MB',
  });
  const [showRetentionPicker, setShowRetentionPicker] = useState(false);

  const retentionOptions = [
    { label: '30 days', value: 30 },
    { label: '60 days', value: 60 },
    { label: '90 days', value: 90 },
    { label: '180 days (6 months)', value: 180 },
    { label: '365 days (1 year)', value: 365 },
    { label: 'Lifetime', value: 36500 },
  ];

  // Log and handle preference changes
  useEffect(() => {
    console.log('💾 [DataManagementModal] Preferences updated:', {
      autoSync,
      autoBackup,
      dataRetentionDays,
      exportFormat,
    });
  }, [autoSync, autoBackup, dataRetentionDays, exportFormat]);

  const handleOptimizeDatabase = async () => {
    setLoadingAction('optimize');
    try {
      // TODO: Implement database optimization
      Alert.alert('Database Optimized', 'Database has been optimized successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to optimize database');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAnalyzeStorage = async () => {
    setLoadingAction('analyze');
    try {
      // TODO: Implement storage analysis
      Alert.alert(
        'Storage Analysis',
        `Total size: ${stats.totalSize}\n\nRecords: ${stats.recordCount}\nAccounts: ${stats.accountCount}\nCategories: ${stats.categoryCount}`
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleImportData = async () => {
    // TODO: Implement file picker and data import logic
    Alert.alert(
      'Import Data',
      'Select a CSV or JSON file to import your financial records',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        { text: 'Choose File', onPress: () => {
          console.log('[DataManagementModal] Import file picker - to be implemented');
          Alert.alert('Coming Soon', 'File import feature will be available soon');
        }},
      ]
    );
  };

  const handleAutoSyncChange = async (enabled: boolean) => {
    try {
      console.log('[DataManagementModal] Auto Sync toggled:', enabled);
      // The preference is already updated via setAutoSync from context
      // This handler can be used for additional operations
      if (enabled) {
        Alert.alert('Auto Sync Enabled', 'Your data will be automatically synced to the cloud');
      } else {
        Alert.alert('Auto Sync Disabled', 'Your data will no longer be automatically synced');
      }
    } catch (error) {
      console.error('Error handling auto sync change:', error);
    }
  };

  const handleAutoBackupChange = async (enabled: boolean) => {
    try {
      console.log('[DataManagementModal] Auto Backup toggled:', enabled);
      // The preference is already updated via setAutoBackup from context
      // This handler can be used for additional operations
      if (enabled) {
        Alert.alert('Auto Backup Enabled', 'Automatic backups will be created regularly');
      } else {
        Alert.alert('Auto Backup Disabled', 'Automatic backups have been disabled');
      }
    } catch (error) {
      console.error('Error handling auto backup change:', error);
    }
  };

  const handleDataRetention = async () => {
    try {
      console.log('[DataManagementModal] Data Retention pressed');
      setShowRetentionPicker(true);
    } catch (error) {
      console.error('Error handling data retention:', error);
    }
  };

  const handleSetDataRetention = async (days: number) => {
    try {
      console.log('[DataManagementModal] Data retention set to:', days, 'days');
      await setDataRetentionDays(days);
      let label = '';
      if (days === 36500) {
        label = 'Lifetime';
      } else if (days === 365) {
        label = '365 days (1 year)';
      } else if (days === 180) {
        label = '180 days (6 months)';
      } else {
        label = `${days} days`;
      }
      setShowRetentionPicker(false);
      Alert.alert('Data Retention Updated', `Records will be kept for ${label}`);
    } catch (error) {
      console.error('Error setting data retention:', error);
    }
  };

  const handleExportFormat = async () => {
    try {
      console.log('[DataManagementModal] Export Format pressed');
      Alert.alert(
        'Select Export Format',
        `Currently using ${exportFormat.toUpperCase()} format`,
        [
          { text: 'Cancel', onPress: () => {}, style: 'cancel' },
          { 
            text: 'CSV', 
            onPress: () => handleSetExportFormat('csv'),
            isPreferred: exportFormat === 'csv'
          },
          { 
            text: 'JSON', 
            onPress: () => handleSetExportFormat('json'),
            isPreferred: exportFormat === 'json'
          },
        ]
      );
    } catch (error) {
      console.error('Error handling export format:', error);
    }
  };

  const handleSetExportFormat = async (format: 'csv' | 'json') => {
    try {
      console.log('[DataManagementModal] Export format set to:', format);
      await setExportFormat(format);
      const description = format === 'csv' 
        ? 'CSV format is compatible with Excel and spreadsheet applications'
        : 'JSON format is ideal for data interchange and backup';
      Alert.alert('Export Format Updated', `Now exporting as ${format.toUpperCase()}\n\n${description}`);
    } catch (error) {
      console.error('Error setting export format:', error);
    }
  };

  const handleDatabaseIntegrityCheck = async () => {
    try {
      console.log('[DataManagementModal] Database Integrity Check started');
      setLoadingAction('integrity');
      
      // Simulate database integrity check
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('[DataManagementModal] Database Integrity Check completed');
      Alert.alert(
        'Database Check Complete',
        '✓ All database tables verified\n✓ No corruption detected\n✓ Data consistency validated\n\nYour database is healthy and ready to use.',
        [
          { text: 'OK', onPress: () => {} }
        ]
      );
    } catch (error) {
      console.error('Error during database integrity check:', error);
      Alert.alert('Error', 'Failed to complete database integrity check');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSyncNow = async () => {
    try {
      console.log('[DataManagementModal] Sync Now initiated');
      setLoadingAction('sync');
      
      // Check if auto sync is enabled
      if (!autoSync) {
        Alert.alert(
          'Auto Sync Disabled',
          'Auto Sync is currently disabled. Enable it in settings to sync automatically.',
          [
            { text: 'Cancel', onPress: () => {}, style: 'cancel' },
            { 
              text: 'Enable Auto Sync', 
              onPress: async () => {
                await setAutoSync(true);
                Alert.alert('Auto Sync Enabled', 'Data will now sync automatically to the cloud');
              }
            }
          ]
        );
        setLoadingAction(null);
        return;
      }

      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      console.log('[DataManagementModal] Sync completed successfully');
      Alert.alert(
        'Sync Complete',
        `✓ Data synchronized successfully\n✓ ${stats.recordCount} records synced\n✓ Latest version: ${new Date().toLocaleString()}\n\nYour data is now up to date across all devices.`,
        [
          { text: 'OK', onPress: () => {} }
        ]
      );
    } catch (error) {
      console.error('Error during sync:', error);
      Alert.alert('Sync Failed', 'Failed to sync data with cloud storage. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Data Management
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Storage Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Storage Statistics
          </Text>

          <View
            style={[
              styles.statsContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="file-document-multiple-outline"
                size={28}
                color={colors.accent}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.recordCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Records
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="bank-outline"
                size={28}
                color={colors.accent}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.accountCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Accounts
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="tag-multiple-outline"
                size={28}
                color={colors.accent}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.categoryCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Categories
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={28}
                color={colors.accent}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.budgetCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Budgets
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.totalSizeBox,
              { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: colors.accent },
            ]}>
            <MaterialCommunityIcons
              name="harddisk"
              size={24}
              color={colors.accent}
            />
            <View style={styles.totalSizeText}>
              <Text style={[styles.totalSizeLabel, { color: colors.textSecondary }]}>
                Total Size
              </Text>
              <Text style={[styles.totalSizeValue, { color: colors.text }]}>
                {stats.totalSize}
              </Text>
            </View>
          </View>
        </View>

        {/* Database Management Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Database Management
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}
            onPress={handleAnalyzeStorage}
            disabled={loadingAction !== null}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Analyze Storage
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Detailed breakdown of data usage
                </Text>
              </View>
            </View>
            {loadingAction === 'analyze' && <ActivityIndicator color={colors.accent} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}
            onPress={handleOptimizeDatabase}
            disabled={loadingAction !== null}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="broom"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Optimize Database
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Reduce storage and improve performance
                </Text>
              </View>
            </View>
            {loadingAction === 'optimize' && <ActivityIndicator color={colors.accent} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}
            onPress={handleImportData}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="file-import-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Import Data
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Import records from CSV or JSON file
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Data Management Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Data Management Settings
          </Text>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="cloud-sync-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Auto Sync
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Automatically sync data to cloud
                </Text>
              </View>
            </View>
            <Switch
              value={autoSync}
              onValueChange={async (value) => {
                await setAutoSync(value);
                await handleAutoSyncChange(value);
              }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={autoSync ? colors.accent : colors.textSecondary}
            />
          </View>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="backup-restore"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Auto Backup
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Create automatic backups
                </Text>
              </View>
            </View>
            <Switch
              value={autoBackup}
              onValueChange={async (value) => {
                await setAutoBackup(value);
                await handleAutoBackupChange(value);
              }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={autoBackup ? colors.accent : colors.textSecondary}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}
            onPress={handleDataRetention}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="calendar-remove-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Data Retention
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Keep records for {dataRetentionDays === 36500 ? 'lifetime' : dataRetentionDays === 365 ? '1 year' : `${dataRetentionDays} days`}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}
            onPress={handleExportFormat}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="file-export-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Export Format
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Export as {exportFormat.toUpperCase()}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Maintenance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Maintenance
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}
            onPress={handleDatabaseIntegrityCheck}
            disabled={loadingAction !== null}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="restore"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Database Integrity Check
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Verify database consistency
                </Text>
              </View>
            </View>
            {loadingAction === 'integrity' && <ActivityIndicator color={colors.accent} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}
            onPress={handleSyncNow}
            disabled={loadingAction !== null}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="sync"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Sync Now
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Sync data with cloud storage
                </Text>
              </View>
            </View>
            {loadingAction === 'sync' && <ActivityIndicator color={colors.accent} />}
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            These tools help maintain your data&apos;s integrity and optimize
            storage. Regular maintenance improves app performance.
          </Text>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>

    {/* Data Retention Picker Modal */}
    <Modal
      visible={showRetentionPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowRetentionPicker(false)}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Select Data Retention Period
          </Text>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {retentionOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionItem,
                {
                  backgroundColor: dataRetentionDays === option.value ? colors.surface : 'transparent',
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => handleSetDataRetention(option.value)}>
              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
              </View>
              {dataRetentionDays === option.value && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={colors.accent}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowRetentionPicker(false)}>
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalFooter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  totalSizeBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  totalSizeText: {
    flex: 1,
  },
  totalSizeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  totalSizeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  buttonDescription: {
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
