import { useTheme } from '@/context/Theme';
import { useToast } from '@/context/Toast';
import { ExportOptions, exportRecordsToCSV } from '@/lib/dataExport';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExportRecordsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { success, error, info, warning } = useToast();

  const [dateFrom, setDateFrom] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleDateChange = (event: any, selectedDate: Date | undefined, isFrom: boolean = true) => {
    setShowFromPicker(false);
    setShowToPicker(false);
    if (selectedDate) {
      if (isFrom) {
        setDateFrom(selectedDate);
      } else {
        setDateTo(selectedDate);
      }
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      if (dateFrom > dateTo) {
        warning('Start date must be before end date.', 3000);
        return;
      }

      const options: ExportOptions = { dateFrom, dateTo };
      const result = await exportRecordsToCSV(options);
      
      if (!result || result.summary.totalRecords === 0) {
        info('No records to export for the selected date range.', 3000);
        return;
      }

      setExportData(result);
      success(`Successfully generated export with ${result.summary.totalRecords} records.`, 3000);
      setShowPreview(true);

    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred.';
      if (errorMessage.includes('No records found')) {
        error('No records available to export. Please create some first.', 4000);
      } else if (errorMessage.includes('No records match')) {
        error('No records match the specified date range and filters.', 4000);
      } else {
        error(`Export failed: ${errorMessage}`, 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!exportData?.csv) {
      error('No export data available to share.', 3000);
      return;
    }
  
    setLoading(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        error('Sharing is not available on this device.', 4000);
        return;
      }
  
      // Create a file in the cache directory
      const { File, Paths } = FileSystem;
      const file = new File(Paths.cache, exportData.filename);
      
      // Write the CSV content to the file
      await file.write(exportData.csv);
      
      // Share the file
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Share CSV Export',
        UTI: 'public.comma-separated-values-text',
      });

    } catch (err: any) {
      error(`Share failed: ${err.message}`, 4000);
    } finally {
      setLoading(false);
    }
  };

  const PreviewModal = () => (
    <Modal visible={showPreview} animationType="slide" transparent={false} onRequestClose={() => setShowPreview(false)}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowPreview(false)}>
            <MaterialCommunityIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Export Preview</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.previewContent}>
          <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Export Summary</Text>
            <View style={styles.statGrid}>
              {/* Stat Items */}
              <StatItem icon="file-document" label="Records" value={exportData?.summary.totalRecords} color={colors.accent} />
              <StatItem icon="plus-circle" label="Income" value={`₹${exportData?.summary.totalIncome.toLocaleString()}`} color={colors.success} />
              <StatItem icon="minus-circle" label="Expense" value={`₹${exportData?.summary.totalExpense.toLocaleString()}`} color={colors.danger} />
              <StatItem icon="wallet" label="Balance" value={`₹${exportData?.summary.netBalance.toLocaleString()}`} color={colors.text} />
              <StatItem icon="tag-multiple" label="Categories" value={exportData?.summary.uniqueCategories} color={colors.accent} />
              <StatItem icon="account-multiple" label="Accounts" value={exportData?.summary.uniqueAccounts} color={colors.accent} />
            </View>
          </View>

          <View style={[styles.csvSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>CSV Preview</Text>
            <Text style={[styles.csvPreview, { color: colors.textSecondary }]}>
              {exportData?.csv?.substring(0, 500)}...
            </Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.textSecondary, flex: 1 }]}>
              Filename: {exportData?.filename}
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowPreview(false)}>
            <Text style={[styles.buttonText, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleShare} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <><MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" style={{ marginRight: 8 }} /><Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Share</Text></>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const StatItem = ({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) => (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Export Records</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.descriptionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="file-export-outline" size={24} color={colors.accent} />
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Export your transaction records to a CSV file for backup or analysis in other software.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Date Range</Text>
          <DateControl label="From" date={dateFrom} onPress={() => setShowFromPicker(true)} />
          <DateControl label="To" date={dateTo} onPress={() => setShowToPicker(true)} />
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Good to know</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Exports include date, type, amount, category, account, and notes.\n• These CSV files cannot be restored back into the app.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.back()} disabled={loading}>
          <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleExport} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <><MaterialCommunityIcons name="file-export" size={20} color="#FFFFFF" style={{ marginRight: 8 }} /><Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Generate Export</Text></>}
        </TouchableOpacity>
      </View>

      {showFromPicker && <DateTimePicker value={dateFrom} mode="date" display="spinner" onChange={(e, d) => handleDateChange(e, d, true)} />}
      {showToPicker && <DateTimePicker value={dateTo} mode="date" display="spinner" onChange={(e, d) => handleDateChange(e, d, false)} />}

      {exportData && <PreviewModal />}
    </SafeAreaView>
  );
}

const DateControl = ({ label, date, onPress }: { label: string, date: Date, onPress: () => void }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.dateControl}>
      <View style={styles.dateInfo}>
        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.dateValue, { color: colors.text }]}>{date.toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity style={[styles.dateButton, { backgroundColor: colors.accent }]} onPress={onPress}>
        <MaterialCommunityIcons name="calendar" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  section: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  descriptionBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16, gap: 12 },
  description: { fontSize: 14, flex: 1, lineHeight: 20 },
  dateControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  dateInfo: { flex: 1 },
  dateLabel: { fontSize: 12, marginBottom: 4, opacity: 0.8 },
  dateValue: { fontSize: 16, fontWeight: '600' },
  dateButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  infoTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  infoText: { fontSize: 13, lineHeight: 18 },
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 30, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  previewContent: { flex: 1, padding: 16 },
  summaryBox: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 10 },
  statItem: { alignItems: 'center', padding: 8, minWidth: '45%' },
  statLabel: { fontSize: 12, marginTop: 6, opacity: 0.8 },
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  csvSection: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  csvPreview: { fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
});
