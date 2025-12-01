import * as Sharing from 'expo-sharing';
import Papa from 'papaparse';
import { readRecords } from './finance';

/**
 * DATA EXPORT SERVICE
 * 
 * Handles exporting records to CSV format for use in other applications.
 * Exports are NOT restorable and are intended for external use.
 */

export interface ExportOptions {
  dateFrom: Date;
  dateTo: Date;
  categories?: string[];
  accounts?: string[];
  recordTypes?: ('INCOME' | 'EXPENSE' | 'TRANSFER')[];
}

export interface CsvRecord {
  date: string;
  type: string;
  amount: number;
  category: string;
  account: string;
  notes: string;
}

export interface ExportResult {
  filename: string;
  csv: string;
  csvBase64: string;
  summary: {
    totalRecords: number;
    totalIncome: number;
    totalExpense: number;
    totalTransfer: number;
    netBalance: number;
    uniqueCategories: number;
    uniqueAccounts: number;
  };
}

/**
 * Export records to CSV format within a date range
 * @param options Export filters and date range
 * @returns CSV content and metadata
 */
export const exportRecordsToCSV = async (options: ExportOptions): Promise<ExportResult> => {
  try {
    // Fetch all records
    const records = await readRecords();
    
    if (!records || records.length === 0) {
      throw new Error('No records found to export. Please create some records first.');
    }

    // Filter records by date range
    let filtered = records.filter((record: any) => {
      const recordDate = new Date(record.transaction_date);
      return recordDate >= options.dateFrom && recordDate <= options.dateTo;
    });

    // Filter by categories if specified
    if (options.categories && options.categories.length > 0) {
      filtered = filtered.filter((record: any) =>
        options.categories!.includes(record.categories?.name)
      );
    }

    // Filter by accounts if specified
    if (options.accounts && options.accounts.length > 0) {
      filtered = filtered.filter((record: any) =>
        options.accounts!.includes(record.accounts?.name)
      );
    }

    // Filter by record types if specified
    if (options.recordTypes && options.recordTypes.length > 0) {
      filtered = filtered.filter((record: any) =>
        options.recordTypes!.includes(record.type.toUpperCase())
      );
    }

    if (filtered.length === 0) {
      throw new Error('No records match the specified date range and filters. Please adjust your selection.');
    }

    // Transform records to CSV format
    const csvRecords: CsvRecord[] = filtered.map((record: any) => ({
      date: new Date(record.transaction_date).toLocaleDateString(),
      type: record.type.toUpperCase(),
      amount: record.amount,
      category: record.categories?.name || 'Unknown',
      account: record.accounts?.name || 'Unknown',
      notes: record.notes || '',
    }));

    // Convert to CSV string
    const csv = Papa.unparse(csvRecords, {
      header: true,
      quotes: true,
    } as any);

    // Generate filename
    const fromDate = options.dateFrom.toISOString().split('T')[0];
    const toDate = options.dateTo.toISOString().split('T')[0];
    const filename = `BudgetZen-Export-${fromDate}-to-${toDate}.csv`;

    // Create CSV as base64 for sharing (React Native compatible)
    // Convert string to base64 without Buffer
    const csvBase64 = btoa(csv);
    
    return {
      filename,
      csv,
      csvBase64,
      summary: getExportSummary(csvRecords),
    };
  } catch (error) {
    console.error('Error exporting records to CSV:', error);
    throw error;
  }
};

/**
 * Share the exported CSV file
 * @param filename Name of the file to share
 * @param csvBase64 CSV content in base64 format
 */
export const shareCSVFile = async (filename: string, csvBase64: string): Promise<void> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    // Decode base64 back to CSV for sharing (React Native compatible)
    // Use atob to decode without Buffer
    const csvContent = atob(csvBase64);
    
    // For web/testing: log the CSV
    console.log('CSV Export:', csvContent);

    // Create a blob URI for sharing (Expo doesn't have direct file blob support)
    // We'll use the Sharing API with the CSV content
    // Note: On native, this would be written to temp file first
    // For now, we'll show a success alert with download instructions
    
  } catch (error) {
    console.error('Error sharing CSV file:', error);
    throw error;
  }
};

/**
 * Get summary statistics for exported records
 * @param records Array of records to analyze
 */
export const getExportSummary = (records: CsvRecord[]) => {
  const totalIncome = records
    .filter((r) => r.type === 'INCOME')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter((r) => r.type === 'EXPENSE')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalTransfer = records
    .filter((r) => r.type === 'TRANSFER')
    .reduce((sum, r) => sum + r.amount, 0);

  const categories = new Set(records.map((r) => r.category));
  const accounts = new Set(records.map((r) => r.account));

  return {
    totalRecords: records.length,
    totalIncome,
    totalExpense,
    totalTransfer,
    netBalance: totalIncome - totalExpense,
    uniqueCategories: categories.size,
    uniqueAccounts: accounts.size,
  };
};
