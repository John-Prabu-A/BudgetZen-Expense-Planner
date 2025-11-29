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
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DataStats>({
    recordCount: 156,
    accountCount: 3,
    categoryCount: 12,
    budgetCount: 5,
    totalSize: '2.4 MB',
  });

  const handleOptimizeDatabase = async () => {
    setLoading(true);
    try {
      // TODO: Implement database optimization
      Alert.alert('Database Optimized', 'Database has been optimized successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to optimize database');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeStorage = async () => {
    setLoading(true);
    try {
      // TODO: Implement storage analysis
      Alert.alert(
        'Storage Analysis',
        `Total size: ${stats.totalSize}\n\nRecords: ${stats.recordCount}\nAccounts: ${stats.accountCount}\nCategories: ${stats.categoryCount}`
      );
    } finally {
      setLoading(false);
    }
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
            disabled={loading}>
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
            {loading && <ActivityIndicator color={colors.accent} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}
            onPress={handleOptimizeDatabase}
            disabled={loading}>
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
            {loading && <ActivityIndicator color={colors.accent} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}>
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

        {/* Maintenance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Maintenance
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}>
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
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}>
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
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
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
            These tools help maintain your data's integrity and optimize
            storage. Regular maintenance improves app performance.
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
