import { ReminderTimePicker } from '@/components/ReminderTimePicker';
import { useAuth } from '@/context/Auth';
import { usePreferences } from '@/context/Preferences';
import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

type ModalType = 'theme' | 'uiMode' | 'currencySign' | 'currencyPosition' | 'decimalPlaces' | null;

export default function PreferencesScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const { user, deleteAccount } = useAuth();
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
    hasSecurity,
    remindDaily,
    setRemindDaily,
    reminderTime,
    setReminderTime,
    sendCrashStats,
    setSendCrashStats,
    appVersion,
  } = usePreferences();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
            label="Security Settings"
            value={hasSecurity ? 'Enabled' : 'Disabled'}
            onPress={() => router.push('/(modal)/security-modal')}
            isLast
          />
        </View>

        {/* NOTIFICATIONS SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Notifications" />
          <PreferenceRow
            icon="bell-outline"
            label="Notification Settings"
            value="Alerts, reminders, reports"
            onPress={() => router.push('/preferences/notifications')}
          />
          <ToggleRow
            icon="bell"
            label="Daily Reminder"
            description="Get reminded to log your expenses"
            value={remindDaily}
            onValueChange={setRemindDaily}
            isLast={!remindDaily}
          />
          
          {/* Time Picker Row (shown only when reminders enabled) */}
          {remindDaily && (
            <TouchableOpacity
              style={[
                styles.preferenceRow,
                {
                  backgroundColor: colors.accent + '08',
                  borderBottomColor: 'transparent',
                  borderTopColor: colors.border,
                  borderTopWidth: 1,
                },
              ]}
              onPress={() => setShowTimePickerModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.prefLeft}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={24}
                  color={colors.accent}
                />
                <View style={styles.prefLabel}>
                  <Text style={[styles.prefTitle, { color: colors.text }]}>
                    Set Reminder Time
                  </Text>
                  <Text
                    style={[
                      styles.prefValue,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {reminderTime}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.accent}
              />
            </TouchableOpacity>
          )}
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

        {/* DANGER ZONE SECTION */}
        <View style={[styles.section, { marginBottom: 60, backgroundColor: colors.danger + '08' }]}>
          <View style={[styles.sectionHeader, { paddingBottom: 4 }]}>
            <Text style={[styles.sectionTitle, { color: colors.danger }]}>Danger Zone</Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.preferenceRow,
              {
                backgroundColor: 'transparent',
                borderBottomColor: 'transparent',
              },
            ]}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.prefLeft}>
              <MaterialCommunityIcons name="account-remove-outline" size={24} color={colors.danger} />
              <View style={styles.prefLabel}>
                <Text style={[styles.prefTitle, { color: colors.danger, fontWeight: '700' }]}>Delete Account</Text>
                <Text style={[styles.prefDescription, { color: colors.textSecondary }]}>
                  Permanently wipe all your data
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="alert-outline" size={20} color={colors.danger} />
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

      {/* Time Picker Modal */}
      <ReminderTimePicker
        visible={showTimePickerModal}
        currentTime={reminderTime}
        onTimeChange={(newTime) => {
          console.log('[PreferencesScreen] Reminder time changed to:', newTime);
          setReminderTime(newTime);
        }}
        onClose={() => setShowTimePickerModal(false)}
        title="Set Reminder Time"
      />

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.deleteIconContainer, { backgroundColor: colors.danger + '15' }]}>
              <MaterialCommunityIcons name="alert-decagram" size={40} color={colors.danger} />
            </View>
            
            <Text style={[styles.deleteTitle, { color: colors.text }]}>Delete Account?</Text>
            <Text style={[styles.deleteDescription, { color: colors.textSecondary }]}>
              This action is <Text style={{ fontWeight: '700', color: colors.danger }}>permanent</Text>. 
              All your accounts, categories, and transactions will be wiped forever.
            </Text>

            <View style={styles.deleteConfirmInputWrapper}>
              <Text style={[styles.deleteConfirmLabel, { color: colors.textSecondary }]}>
                Type <Text style={{ color: colors.text, fontWeight: '700' }}>DELETE</Text> to confirm
              </Text>
              <TextInput
                style={[
                  styles.deleteInput,
                  { 
                    color: colors.text, 
                    backgroundColor: colors.background,
                    borderColor: deleteConfirmText === 'DELETE' ? colors.danger : colors.border
                  }
                ]}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Type here..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                editable={!isDeleting}
              />
            </View>

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={[styles.deleteButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeleting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteButton, 
                  styles.confirmDeleteButton, 
                  { 
                    backgroundColor: deleteConfirmText === 'DELETE' ? colors.danger : colors.border,
                    opacity: deleteConfirmText === 'DELETE' ? 1 : 0.5
                  }
                ]}
                onPress={async () => {
                  if (deleteConfirmText !== 'DELETE') return;
                  
                  try {
                    setIsDeleting(true);
                    await deleteAccount();
                    setShowDeleteModal(false);
                    // Auth state change will handle routing to login
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
                    setIsDeleting(false);
                  }
                }}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  deleteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  deleteDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteConfirmInputWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  deleteConfirmLabel: {
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteInput: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
