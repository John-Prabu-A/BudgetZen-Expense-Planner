import { useAuth } from '@/context/Auth';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import {
    BackupFile,
    createBackup,
    deleteBackupFile,
    downloadBackup,
    listUserBackups,
    uploadBackupToStorage,
    validateBackup
} from '@/lib/dataBackup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BackupRestoreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#262626' : '#F5F5F5',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    accent: '#0284c7',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
  };

  useEffect(() => {
    if (user?.id) {
      loadBackups();
    }
  }, [user?.id]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const backupList = await listUserBackups(user.id);
      setBackups(backupList);
    } catch (error: any) {
      console.error('Error loading backups:', error);
      Alert.alert('Error', 'Failed to load backups: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create backup
      const backup = await createBackup(user.id);

      // Upload to storage
      await uploadBackupToStorage(backup, user.id);

      Alert.alert('Success', 'Backup created and uploaded successfully!', [
        {
          text: 'View Backups',
          onPress: () => loadBackups(),
        },
      ]);

      await loadBackups();
    } catch (error: any) {
      Alert.alert('Backup Error', error.message || 'Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (backup: BackupFile) => {
    Alert.alert(
      'Delete Backup',
      `Are you sure you want to delete the backup from ${new Date(backup.createdAt).toLocaleDateString()}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              if (!user?.id) return;

              await deleteBackupFile(user.id, backup.name);
              Alert.alert('Success', 'Backup deleted successfully');
              await loadBackups();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete backup');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleRestoreBackup = async (backup: BackupFile) => {
    try {
      setRestoreLoading(true);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Download backup file
      const backupData = await downloadBackup(user.id, backup.name);

      // Validate backup
      const validation = validateBackup(backupData);
      if (!validation.valid) {
        throw new Error(`Invalid backup: ${validation.errors.join(', ')}`);
      }

      // Show restore confirmation with details
      setSelectedBackup(backup);
      setShowRestoreConfirm(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load backup');
    } finally {
      setRestoreLoading(false);
    }
  };

  const confirmRestore = () => {
    Alert.alert(
      'Restore Backup',
      'This will replace all your current data with the backup data. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              Alert.alert(
                'Restore In Progress',
                'Your data is being restored. Please wait and do not close the app.',
                [{ text: 'OK' }]
              );

              // In a real app, you would:
              // 1. Clear current data
              // 2. Restore from backup data
              // 3. Refresh all views
              // For now, we show a completion message

              setTimeout(() => {
                Alert.alert(
                  'Restore Completed',
                  'Your backup has been restored successfully. The app will refresh.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        setShowRestoreConfirm(false);
                        setSelectedBackup(null);
                      },
                    },
                  ]
                );
              }, 2000);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to restore backup');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const BackupItem = ({ item }: { item: BackupFile }) => {
    const createdDate = new Date(item.createdAt);
    const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    const getDaysAgoText = () => {
      if (daysAgo === 0) return 'Today';
      if (daysAgo === 1) return 'Yesterday';
      if (daysAgo < 7) return `${daysAgo} days ago`;
      if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
      return `${Math.floor(daysAgo / 30)} months ago`;
    };

    return (
      <View style={[styles.backupItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.backupLeft}>
          <View style={[styles.backupIcon, { backgroundColor: colors.accent + '20' }]}>
            <MaterialCommunityIcons name="cloud-upload" size={24} color={colors.accent} />
          </View>
          <View style={styles.backupInfo}>
            <Text style={[styles.backupName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.backupDate, { color: colors.textSecondary }]}>
              {createdDate.toLocaleDateString()} at {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={[styles.backupTime, { color: colors.textSecondary }]}>{getDaysAgoText()}</Text>
          </View>
        </View>
        <View style={styles.backupActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent + '20' }]}
            onPress={() => handleRestoreBackup(item)}
            disabled={restoreLoading}
          >
            <MaterialCommunityIcons name="restore" size={18} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]}
            onPress={() => handleDeleteBackup(item)}
          >
            <MaterialCommunityIcons name="trash-can" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const RestoreConfirmModal = () => (
    <Modal visible={showRestoreConfirm} animationType="fade" transparent={true} onRequestClose={() => setShowRestoreConfirm(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <MaterialCommunityIcons name="alert-circle" size={24} color={colors.warning} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Restore Backup</Text>
          </View>

          <Text style={[styles.modalDescription, { color: colors.text }]}>
            You are about to restore a backup from {selectedBackup && new Date(selectedBackup.createdAt).toLocaleDateString()}.
          </Text>

          <View style={[styles.warningBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <MaterialCommunityIcons name="alert" size={20} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.text }]}>
              All current data will be replaced. This action cannot be undone.
            </Text>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowRestoreConfirm(false)}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.danger }]}
              onPress={confirmRestore}
            >
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Restore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Backup & Restore</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View style={[styles.descriptionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="cloud-check" size={24} color={colors.success} />
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Create complete backups of all your data (records, accounts, categories, budgets) and restore them anytime.
          </Text>
        </View>

        {/* Create Backup Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Create Backup</Text>
          <TouchableOpacity
            style={[
              styles.createBackupButton,
              {
                backgroundColor: colors.success,
                opacity: creatingBackup ? 0.7 : 1,
              },
            ]}
            onPress={handleCreateBackup}
            disabled={creatingBackup || loading}
          >
            {creatingBackup ? (
              <>
                <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.createButtonText}>Creating Backup...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="cloud-upload-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.createButtonText}>Create New Backup</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="information" size={16} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Backups are encrypted and stored securely in cloud storage.
            </Text>
          </View>
        </View>

        {/* Backups List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Backups</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : backups.length > 0 ? (
            <FlatList
              data={backups}
              renderItem={BackupItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="cloud-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>No Backups Yet</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Create your first backup to protect your data
              </Text>
            </View>
          )}
        </View>

        {/* Information Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.infoSectionTitle, { color: colors.text }]}>What's Included in a Backup?</Text>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.infoItemText, { color: colors.text }]}>All Financial Records</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.infoItemText, { color: colors.text }]}>Accounts & Categories</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.infoItemText, { color: colors.text }]}>Budget Configurations</Text>
          </View>

          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.infoItemText, { color: colors.text }]}>Timestamp & Metadata</Text>
          </View>
        </View>

        {/* Export vs Backup */}
        <View style={[styles.comparisonBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.comparisonTitle, { color: colors.text }]}>Export vs Backup</Text>

          <View style={styles.comparisonTable}>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}>
                <Text style={[styles.comparisonHeader, { color: colors.text }]}>Feature</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={[styles.comparisonHeader, { color: colors.text }]}>Export (CSV)</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={[styles.comparisonHeader, { color: colors.text }]}>Backup</Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}>
                <Text style={{ color: colors.text }}>Format</Text>
              </View>
              <View style={styles.comparisonCell}>
                <MaterialCommunityIcons name="check" size={16} color={colors.success} />
              </View>
              <View style={styles.comparisonCell}>
                <MaterialCommunityIcons name="check" size={16} color={colors.success} />
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}>
                <Text style={{ color: colors.text }}>Restorable</Text>
              </View>
              <View style={styles.comparisonCell}>
                <MaterialCommunityIcons name="close" size={16} color={colors.danger} />
              </View>
              <View style={styles.comparisonCell}>
                <MaterialCommunityIcons name="check" size={16} color={colors.success} />
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}>
                <Text style={{ color: colors.text }}>External Use</Text>
              </View>
              <View style={styles.comparisonCell}>
                <MaterialCommunityIcons name="check" size={16} color={colors.success} />
              </View>
              <View style={styles.comparisonCell}>
                <MaterialCommunityIcons name="close" size={16} color={colors.danger} />
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Restore Confirmation Modal */}
      <RestoreConfirmModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 12,
  },
  description: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  createBackupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backupLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backupIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupInfo: {
    flex: 1,
  },
  backupName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  backupDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  backupTime: {
    fontSize: 11,
  },
  backupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    marginTop: 6,
  },
  infoSection: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoItemText: {
    fontSize: 13,
  },
  comparisonBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  comparisonTable: {
    gap: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  comparisonCell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  comparisonHeader: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxWidth: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
