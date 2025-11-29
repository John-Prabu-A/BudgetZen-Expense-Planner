import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DeleteResetModal() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { isDark, colors } = useTheme();

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your records, accounts, categories, and budgets. This action cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Implement delete all data logic
              Alert.alert('Success', 'All data has been deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will reset all app settings to their default values. Your data will not be affected.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Reset',
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Implement reset app logic
              Alert.alert('Success', 'App settings have been reset');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and cache. This may improve app performance.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear',
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Implement clear cache logic
              Alert.alert('Success', 'Cache has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
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
          Delete & Reset
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View
          style={[
            styles.warningBanner,
            { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
          ]}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={24}
            color={colors.danger}
          />
          <Text style={[styles.warningText, { color: colors.danger }]}>
            These actions cannot be undone. Please proceed with caution.
          </Text>
        </View>

        {/* Delete Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.danger }]}>
            Danger Zone
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: colors.danger },
            ]}
            onPress={handleDeleteAllData}
            disabled={loading}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="delete-forever"
                size={24}
                color={colors.danger}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.danger }]}>
                  Delete All Data
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Permanently remove all records, accounts, and categories
                </Text>
              </View>
            </View>
            {loading && <ActivityIndicator color={colors.danger} />}
          </TouchableOpacity>
        </View>

        {/* Reset Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.warning }]}>
            Reset Options
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: colors.warning },
            ]}
            onPress={handleResetApp}
            disabled={loading}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="refresh"
                size={24}
                color={colors.warning}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.warning }]}>
                  Reset App Settings
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Restore all preferences to default values
                </Text>
              </View>
            </View>
            {loading && <ActivityIndicator color={colors.warning} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: colors.warning },
            ]}
            onPress={handleClearCache}
            disabled={loading}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={24}
                color={colors.warning}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.warning }]}>
                  Clear Cache
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Remove temporary files and improve performance
                </Text>
              </View>
            </View>
            {loading && <ActivityIndicator color={colors.warning} />}
          </TouchableOpacity>
        </View>

        {/* Info Section */}
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
            We recommend creating a backup before performing any delete or reset
            operations. You can create a backup from the Backup & Restore menu.
          </Text>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
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
