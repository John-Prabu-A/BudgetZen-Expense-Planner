import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AdvancedModal() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#2A2A2A' : '#F9FAFB',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#6B7280',
    border: isDark ? '#404040' : '#E5E7EB',
    accent: '#8B5CF6',
  };

  return (
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
          Advanced Settings
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* API & Integrations Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            API & Integrations
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="api"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  API Documentation
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  View available APIs for integration
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
                name="cloud-sync-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Connected Services
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Manage third-party integrations
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

        {/* Developer Options Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Developer Options
          </Text>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="bug-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Debug Mode
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Show debug information and logs
                </Text>
              </View>
            </View>
            <Switch
              value={false}
              onValueChange={() => Alert.alert('Debug Mode', 'Debug mode toggled')}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={false ? colors.accent : colors.textSecondary}
            />
          </View>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="server-network-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Show Network Activity
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Display network requests and responses
                </Text>
              </View>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={false ? colors.accent : colors.textSecondary}
            />
          </View>

          <View
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border },
            ]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons
                name="database-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Database Inspector
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Inspect local database contents
                </Text>
              </View>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={false ? colors.accent : colors.textSecondary}
            />
          </View>
        </View>

        {/* Performance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Performance
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: colors.border },
            ]}>
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="speedometer"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Performance Metrics
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  View app performance statistics
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
                name="memory"
                size={24}
                color={colors.accent}
              />
              <View style={styles.buttonText}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>
                  Memory Usage
                </Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>
                  Monitor memory consumption
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
            These advanced settings are for technical users and developers.
            Use with caution as they may affect app performance and stability.
          </Text>
        </View>
      </ScrollView>
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
