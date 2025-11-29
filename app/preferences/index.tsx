import { useAuth } from '@/context/Auth';
import { usePreferences } from '@/context/Preferences';
import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type ModalType = 'theme' | 'uiMode' | 'currencySign' | 'currencyPosition' | 'decimalPlaces' | null;

export default function PreferencesScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const { user } = useAuth();
  const {
    theme,
    setTheme,
    uiMode,
    setUIMode,
    currencySign,
    setCurrencySign,
    currencyPosition,
    setCurrencyPosition,
    decimalPlaces,
    setDecimalPlaces,
    passcodeEnabled,
    remindDaily,
    setRemindDaily,
    sendCrashStats,
    setSendCrashStats,
    appVersion,
  } = usePreferences();

  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Theme modal options
  const themeOptions = [
    { label: 'Light', value: 'light' as const },
    { label: 'Dark', value: 'dark' as const },
    { label: 'System', value: 'system' as const },
  ];

  // UI Mode modal options
  const uiModeOptions = [
    { label: 'Compact', value: 'compact' as const, description: 'Minimal spacing' },
    { label: 'Standard', value: 'standard' as const, description: 'Default spacing' },
    { label: 'Spacious', value: 'spacious' as const, description: 'Extra spacing' },
  ];

  // Currency sign options
  const currencyOptions = [
    { label: 'Indian Rupee', value: '₹' as const },
    { label: 'US Dollar', value: '$' as const },
    { label: 'Euro', value: '€' as const },
    { label: 'British Pound', value: '£' as const },
    { label: 'Chinese Yuan', value: '¥' as const },
  ];

  // Currency position options
  const positionOptions = [
    { label: 'Before Amount', value: 'before' as const, example: '₹1,000' },
    { label: 'After Amount', value: 'after' as const, example: '1,000₹' },
  ];

  // Decimal places options
  const decimalOptions = [
    { label: '0 places', value: 0 as const, example: '1000' },
    { label: '1 place', value: 1 as const, example: '1000.0' },
    { label: '2 places', value: 2 as const, example: '1000.00' },
    { label: '3 places', value: 3 as const, example: '1000.000' },
  ];

  const getDisplayValue = (key: ModalType) => {
    switch (key) {
      case 'theme':
        return themeOptions.find((opt) => opt.value === theme)?.label || 'System';
      case 'uiMode':
        return uiModeOptions.find((opt) => opt.value === uiMode)?.label || 'Standard';
      case 'currencySign':
        return currencyOptions.find((opt) => opt.value === currencySign)?.label || '₹';
      case 'currencyPosition':
        return positionOptions.find((opt) => opt.value === currencyPosition)?.label || 'Before';
      case 'decimalPlaces':
        return `${decimalPlaces} decimal places`;
      default:
        return '';
    }
  };

  // Section Header Component
  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );

  // Preference Row Component
  const PreferenceRow = ({
    icon,
    label,
    value,
    onPress,
    isLast = false,
  }: {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    label: string;
    value?: string;
    onPress?: () => void;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.preferenceRow,
        {
          backgroundColor: colors.surface,
          borderBottomColor: isLast ? 'transparent' : colors.border,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.prefLeft}>
        <MaterialCommunityIcons name={icon} size={24} color={colors.accent} />
        <View style={styles.prefLabel}>
          <Text style={[styles.prefTitle, { color: colors.text }]}>{label}</Text>
          {value && (
            <Text style={[styles.prefValue, { color: colors.textSecondary }]}>{value}</Text>
          )}
        </View>
      </View>
      {onPress && (
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  // Toggle Row Component
  const ToggleRow = ({
    icon,
    label,
    description,
    value,
    onValueChange,
    isLast = false,
  }: {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    label: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => Promise<void>;
    isLast?: boolean;
  }) => (
    <View
      style={[
        styles.preferenceRow,
        {
          backgroundColor: colors.surface,
          borderBottomColor: isLast ? 'transparent' : colors.border,
        },
      ]}
    >
      <View style={styles.prefLeft}>
        <MaterialCommunityIcons name={icon} size={24} color={colors.accent} />
        <View style={styles.prefLabel}>
          <Text style={[styles.prefTitle, { color: colors.text }]}>{label}</Text>
          {description && (
            <Text style={[styles.prefDescription, { color: colors.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <Switch 
        value={value} 
        onValueChange={(newValue) => {
          onValueChange(newValue);
        }}
      />
    </View>
  );

  // Modal Component
  const OptionModal = ({
    visible,
    title,
    options,
    selectedValue,
    onSelect,
    onClose,
  }: {
    visible: boolean;
    title: string;
    options: Array<{ label: string; value: any; description?: string; example?: string }>;
    selectedValue: any;
    onSelect: (value: any) => Promise<void>;
    onClose: () => void;
  }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Modal Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Modal Content */}
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionRow,
                {
                  backgroundColor:
                    selectedValue === option.value ? colors.accent + '15' : colors.surface,
                  borderColor: selectedValue === option.value ? colors.accent : colors.border,
                },
              ]}
              onPress={async () => {
                // Update the preference
                await onSelect(option.value);
                // Close modal after state update completes
                setTimeout(() => {
                  onClose();
                }, 100);
              }}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: colors.text, fontWeight: selectedValue === option.value ? '600' : '500' },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                      {option.description}
                    </Text>
                  )}
                  {option.example && (
                    <Text style={[styles.optionExample, { color: colors.accent }]}>
                      Example: {option.example}
                    </Text>
                  )}
                </View>
                {selectedValue === option.value && (
                  <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
                )}
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Preferences</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Personalize your experience
          </Text>
        </View>

        {/* APPEARANCE SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Appearance" />
          <PreferenceRow
            icon="palette"
            label="Theme"
            value={getDisplayValue('theme')}
            onPress={() => setActiveModal('theme')}
          />
          <PreferenceRow
            icon="format-list-bulleted"
            label="UI Mode"
            value={getDisplayValue('uiMode')}
            onPress={() => setActiveModal('uiMode')}
          />
          <PreferenceRow
            icon="currency-inr"
            label="Currency Sign"
            value={getDisplayValue('currencySign')}
            onPress={() => setActiveModal('currencySign')}
          />
          <PreferenceRow
            icon="format-align-center"
            label="Currency Position"
            value={getDisplayValue('currencyPosition')}
            onPress={() => setActiveModal('currencyPosition')}
          />
          <PreferenceRow
            icon="decimal"
            label="Decimal Places"
            value={getDisplayValue('decimalPlaces')}
            onPress={() => setActiveModal('decimalPlaces')}
            isLast
          />
        </View>

        {/* SECURITY SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Security" />
          <PreferenceRow
            icon="lock"
            label="Passcode Protection"
            value={passcodeEnabled ? 'Enabled' : 'Disabled'}
            onPress={() => router.push('/passcode-setup')}
            isLast
          />
        </View>

        {/* NOTIFICATIONS SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Notifications" />
          <ToggleRow
            icon="bell"
            label="Daily Reminder"
            description="Get reminded to log your expenses"
            value={remindDaily}
            onValueChange={setRemindDaily}
            isLast
          />
        </View>

        {/* ABOUT SECTION */}
        <View style={styles.section}>
          <SectionHeader title="About" />
          <ToggleRow
            icon="bug"
            label="Send Crash & Usage Stats"
            description="Help us improve the app"
            value={sendCrashStats}
            onValueChange={setSendCrashStats}
          />
          <View
            style={[
              styles.preferenceRow,
              {
                backgroundColor: colors.surface,
                borderBottomColor: 'transparent',
              },
            ]}
          >
            <View style={styles.prefLeft}>
              <MaterialCommunityIcons name="information" size={24} color={colors.accent} />
              <View style={styles.prefLabel}>
                <Text style={[styles.prefTitle, { color: colors.text }]}>App Version</Text>
                <Text style={[styles.prefValue, { color: colors.textSecondary }]}>
                  {appVersion}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <SectionHeader title="Account" />
          <View
            style={[
              styles.preferenceRow,
              {
                backgroundColor: colors.surface,
                borderBottomColor: 'transparent',
              },
            ]}
          >
            <View style={styles.prefLeft}>
              <MaterialCommunityIcons name="email" size={24} color={colors.accent} />
              <View style={styles.prefLabel}>
                <Text style={[styles.prefTitle, { color: colors.text }]}>Email</Text>
                <Text style={[styles.prefValue, { color: colors.textSecondary }]}>
                  {user?.email || 'Not available'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <SectionHeader title="Data Management" />
          
          {/* Export Records */}
          <TouchableOpacity
            style={[
              styles.preferenceRow,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={() => router.push('/(modal)/export-records-modal' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.prefLeft}>
              <MaterialCommunityIcons name="file-export" size={24} color={colors.accent} />
              <View style={styles.prefLabel}>
                <Text style={[styles.prefTitle, { color: colors.text }]}>Export Records</Text>
                <Text style={[styles.prefDescription, { color: colors.textSecondary }]}>
                  CSV Format
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Backup & Restore */}
          <TouchableOpacity
            style={[
              styles.preferenceRow,
              {
                backgroundColor: colors.surface,
                borderBottomColor: 'transparent',
              },
            ]}
            onPress={() => router.push('/(modal)/backup-restore-modal' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.prefLeft}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={24} color={colors.accent} />
              <View style={styles.prefLabel}>
                <Text style={[styles.prefTitle, { color: colors.text }]}>Backup & Restore</Text>
                <Text style={[styles.prefDescription, { color: colors.textSecondary }]}>
                  Cloud Storage
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <OptionModal
        visible={activeModal === 'theme'}
        title="Choose Theme"
        options={themeOptions}
        selectedValue={theme}
        onSelect={setTheme}
        onClose={() => setActiveModal(null)}
      />

      <OptionModal
        visible={activeModal === 'uiMode'}
        title="UI Mode"
        options={uiModeOptions}
        selectedValue={uiMode}
        onSelect={setUIMode}
        onClose={() => setActiveModal(null)}
      />

      <OptionModal
        visible={activeModal === 'currencySign'}
        title="Select Currency"
        options={currencyOptions}
        selectedValue={currencySign}
        onSelect={setCurrencySign}
        onClose={() => setActiveModal(null)}
      />

      <OptionModal
        visible={activeModal === 'currencyPosition'}
        title="Currency Position"
        options={positionOptions}
        selectedValue={currencyPosition}
        onSelect={setCurrencyPosition}
        onClose={() => setActiveModal(null)}
      />

      <OptionModal
        visible={activeModal === 'decimalPlaces'}
        title="Decimal Places"
        options={decimalOptions}
        selectedValue={decimalPlaces}
        onSelect={setDecimalPlaces}
        onClose={() => setActiveModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  prefLabel: {
    flex: 1,
  },
  prefTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  prefValue: {
    fontSize: 13,
  },
  prefDescription: {
    fontSize: 13,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  optionRow: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  optionExample: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
