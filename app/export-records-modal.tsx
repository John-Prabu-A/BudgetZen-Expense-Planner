import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { ExportOptions, exportRecordsToCSV } from '@/lib/dataExport';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ExportRecordsScreen() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  const [dateFrom, setDateFrom] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#262626' : '#F5F5F5',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#666666',
    border: isDark ? '#404040' : '#E5E5E5',
    accent: '#0284c7',
    success: '#10B981',
    danger: '#EF4444',
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined, isFrom: boolean = true) => {
    if (isFrom) {
      setShowFromPicker(false);
      if (selectedDate) {
        setDateFrom(selectedDate);
      }
    } else {
      setShowToPicker(false);
      if (selectedDate) {
        setDateTo(selectedDate);
      }
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      // Validate dates
      if (dateFrom > dateTo) {
        Alert.alert('Invalid Date Range', 'Start date must be before end date');
        return;
      }

      const options: ExportOptions = {
        dateFrom,
        dateTo,
      };

      const result = await exportRecordsToCSV(options);
      setExportData(result);

      Alert.alert(
        'Export Successful',
        `Generated CSV file with ${result.summary.totalRecords} records. Total Income: ₹${result.summary.totalIncome.toLocaleString()}, Expense: ₹${result.summary.totalExpense.toLocaleString()}`,
        [
          { text: 'Preview', onPress: () => setShowPreview(true) },
          { text: 'OK' },
        ]
      );
    } catch (error: any) {
      Alert.alert('Export Error', error.message || 'Failed to export records');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (!exportData) return;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device');
        return;
      }

      // For now, we'll create a shareable string format
      // In a real app, you'd write to temp file first
      setLoading(true);

      // Create CSV content
      const csvContent = exportData.csv;

      // Show options to copy or save
      Alert.alert(
        'Export Options',
        'Choose how you want to use this export:',
        [
          {
            text: 'Copy to Clipboard',
            onPress: async () => {
              try {
                // This would require react-native-clipboard or similar
                Alert.alert('Info', 'Clipboard copy feature requires additional setup. CSV preview is shown below.');
              } catch (error) {
                Alert.alert('Error', 'Failed to copy to clipboard');
              }
            },
          },
          {
            text: 'Download as File',
            onPress: () => {
              // In a real app with file system access
              Alert.alert(
                'Download Ready',
                `File: ${exportData.filename}\n\nOn native devices, this would be saved to your Downloads folder.`
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Share Error', 'Failed to share export');
    } finally {
      setLoading(false);
    }
  };

  const PreviewModal = () => (
    <Modal visible={showPreview} animationType="slide" transparent={false} onRequestClose={() => setShowPreview(false)}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowPreview(false)}>
            <MaterialCommunityIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Preview</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.previewContent} showsVerticalScrollIndicator={false}>
          {/* Summary Stats */}
          <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Export Summary</Text>

            <View style={styles.statGrid}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="file-document" size={24} color={colors.accent} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Records</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{exportData?.summary.totalRecords}</Text>
              </View>

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="plus-circle" size={24} color={colors.success} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Income</Text>
                <Text style={[styles.statValue, { color: colors.success }]}>₹{exportData?.summary.totalIncome.toLocaleString()}</Text>
              </View>

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="minus-circle" size={24} color={colors.danger} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expense</Text>
                <Text style={[styles.statValue, { color: colors.danger }]}>₹{exportData?.summary.totalExpense.toLocaleString()}</Text>
              </View>

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="wallet" size={24} color={colors.accent} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Balance</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>₹{exportData?.summary.netBalance.toLocaleString()}</Text>
              </View>

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="tag-multiple" size={24} color={colors.accent} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Categories</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{exportData?.summary.uniqueCategories}</Text>
              </View>

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="account-multiple" size={24} color={colors.accent} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Accounts</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{exportData?.summary.uniqueAccounts}</Text>
              </View>
            </View>
          </View>

          {/* CSV Preview */}
          <View style={[styles.csvSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>CSV Preview</Text>
            <Text style={[styles.csvPreview, { color: colors.textSecondary }]}>
              {exportData?.csv?.substring(0, 500)}...
            </Text>
          </View>

          {/* File Info */}
          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="information" size={20} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Filename: {exportData?.filename}
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowPreview(false)}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={handleShare}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Share</Text>
              </>
            )}
          </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Export Records</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View style={[styles.descriptionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="file-export" size={24} color={colors.accent} />
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Export your records to CSV format for use in spreadsheet applications, data analysis tools, or archival purposes.
          </Text>
        </View>

        {/* Date Range Selection */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Date Range</Text>

          {/* From Date */}
          <View style={styles.dateControl}>
            <View style={styles.dateInfo}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>From</Text>
              <Text style={[styles.dateValue, { color: colors.text }]}>
                {dateFrom.toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowFromPicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* To Date */}
          <View style={styles.dateControl}>
            <View style={styles.dateInfo}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>To</Text>
              <Text style={[styles.dateValue, { color: colors.text }]}>
                {dateTo.toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowToPicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Information */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.accent} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Export Information</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Exports records to CSV format{'\n'}
              • Includes date, type, amount, category, account, and notes{'\n'}
              • CSV files are NOT restorable in the app{'\n'}
              • Use for external analysis, spreadsheets, or archival
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={handleExport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="file-export" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Generate Export</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={dateFrom}
          mode="date"
          display="spinner"
          onChange={(event, date) => handleDateChange(event, date, true)}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={dateTo}
          mode="date"
          display="spinner"
          onChange={(event, date) => handleDateChange(event, date, false)}
        />
      )}

      {/* Preview Modal */}
      <PreviewModal />
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
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
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
    marginBottom: 16,
    gap: 12,
  },
  description: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  dateControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  csvSection: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  csvPreview: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  previewContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
