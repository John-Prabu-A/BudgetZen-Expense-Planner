/**
 * Manual Transaction Ingestion Screen
 * UI for manually entering transaction text for parsing
 */

import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useTheme } from '../../context/Theme';
import { useTransactionIngestion } from '../../context/TransactionIngestion';

/**
 * Manual Transaction Ingestion Screen
 */
export default function ManualTransactionIngestionScreen() {
  const { ingestManually, isInitialized } = useTransactionIngestion();
  const { colors } = useTheme();

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleIngest = async () => {
    if (!text.trim()) {
      Alert.alert('Empty Input', 'Please enter transaction text');
      return;
    }

    setLoading(true);
    try {
      const ingestionResult = await ingestManually(text);
      setResult(ingestionResult);

      if (ingestionResult.success) {
        Alert.alert(
          'Success',
          `Transaction created with ID: ${ingestionResult.recordId}`
        );
        setText('');
      } else {
        Alert.alert('Failed', ingestionResult.reason || ingestionResult.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setResult(null);
  };

  const handlePasteExample = (example: string) => {
    setText(example);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          ✋ Manual Transaction Entry
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Paste a transaction message to parse it automatically
        </ThemedText>
      </ThemedView>

      {/* Input Section */}
      <ThemedView style={[styles.section, { borderColor: colors.border }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Transaction Message
        </ThemedText>

        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          placeholder="Paste your bank message here..."
          placeholderTextColor={colors.inputPlaceholder}
          multiline
          numberOfLines={6}
          value={text}
          onChangeText={setText}
          editable={!loading}
        />

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              { backgroundColor: colors.accent },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleIngest}
            disabled={loading || !isInitialized}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={[styles.buttonText, { color: '#fff' }]}>
                Parse & Create
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
            onPress={handleClear}
            disabled={loading}
          >
            <ThemedText style={[styles.buttonText, { color: colors.text }]}>
              Clear
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Examples Section */}
      <ThemedView style={[styles.section, { borderColor: colors.border }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          📋 Example Messages
        </ThemedText>

        <ThemedText style={styles.exampleLabel}>Click to paste:</ThemedText>

        <TouchableOpacity
          style={[styles.example, { backgroundColor: colors.surface }]}
          onPress={() =>
            handlePasteExample(
              'HDFC Bank: Amount ₹5,000 debited from A/C XX1234. Ref: TXN123456. Date: 15 Dec 2025'
            )
          }
        >
          <ThemedText style={styles.exampleText} numberOfLines={2}>
            HDFC Bank: Amount ₹5,000 debited from A/C XX1234. Ref: TXN123456. Date: 15 Dec 2025
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.example, { backgroundColor: colors.surface }]}
          onPress={() =>
            handlePasteExample(
              'ICICI Bank: ₹2,500 credited to your account. Balance: ₹45,000'
            )
          }
        >
          <ThemedText style={styles.exampleText} numberOfLines={2}>
            ICICI Bank: ₹2,500 credited to your account. Balance: ₹45,000
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.example, { backgroundColor: colors.surface }]}
          onPress={() =>
            handlePasteExample(
              'Axis Bank: Debit card swiped for ₹1,200 at Restaurant XYZ on 14-12-2025'
            )
          }
        >
          <ThemedText style={styles.exampleText} numberOfLines={2}>
            Axis Bank: Debit card swiped for ₹1,200 at Restaurant XYZ on 14-12-2025
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.example, { backgroundColor: colors.surface }]}
          onPress={() =>
            handlePasteExample(
              'Google Pay: Sent ₹500 to John Doe. Ref: GOOGLEPAY789'
            )
          }
        >
          <ThemedText style={styles.exampleText} numberOfLines={2}>
            Google Pay: Sent ₹500 to John Doe. Ref: GOOGLEPAY789
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Result Section */}
      {result && (
        <ThemedView
          style={[
            styles.section,
            {
              borderColor: result.success ? colors.success : colors.danger,
              backgroundColor: result.success
                ? colors.success + '10'
                : colors.danger + '10',
            },
          ]}
        >
          <ThemedText
            type="subtitle"
            style={[
              styles.sectionTitle,
              {
                color: result.success ? colors.success : colors.danger,
              },
            ]}
          >
            {result.success ? '✅ Success' : '❌ Failed'}
          </ThemedText>

          <ThemedText style={styles.resultText}>
            {result.reason}
          </ThemedText>

          {result.recordId && (
            <ThemedText style={styles.resultMeta}>
              Record ID: {result.recordId}
            </ThemedText>
          )}

          {result.metadata && (
            <ThemedText style={styles.resultMeta}>
              Metadata: {JSON.stringify(result.metadata, null, 2)}
            </ThemedText>
          )}
        </ThemedView>
      )}

      {/* Info Section */}
      <ThemedView style={[styles.section, { borderColor: colors.border }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          ℹ️ How It Works
        </ThemedText>

        <ThemedText style={styles.infoItem}>
          1. Copy or paste any bank transaction message
        </ThemedText>
        <ThemedText style={styles.infoItem}>
          2. Click "Parse & Create" to extract transaction details
        </ThemedText>
        <ThemedText style={styles.infoItem}>
          3. The system will:
        </ThemedText>
        <ThemedText style={[styles.infoItem, styles.infoSubItem]}>
          • Identify the bank and sender
        </ThemedText>
        <ThemedText style={[styles.infoItem, styles.infoSubItem]}>
          • Extract amount, date, and reference
        </ThemedText>
        <ThemedText style={[styles.infoItem, styles.infoSubItem]}>
          • Classify as income/expense/transfer
        </ThemedText>
        <ThemedText style={[styles.infoItem, styles.infoSubItem]}>
          • Suggest a category
        </ThemedText>
        <ThemedText style={styles.infoItem}>
          4. Review and confirm the transaction
        </ThemedText>
      </ThemedView>

      {/* Supported Banks */}
      <ThemedView style={[styles.section, { borderColor: colors.border }]}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          🏦 Supported Banks
        </ThemedText>

        <ThemedText style={styles.bankItem}>• HDFC Bank</ThemedText>
        <ThemedText style={styles.bankItem}>• ICICI Bank</ThemedText>
        <ThemedText style={styles.bankItem}>• Axis Bank</ThemedText>
        <ThemedText style={styles.bankItem}>• SBI Bank</ThemedText>
        <ThemedText style={styles.bankItem}>• Kotak Bank</ThemedText>
        <ThemedText style={styles.bankItem}>• Payment apps (PayTM, PhonePe, Google Pay, etc)</ThemedText>

        <ThemedText style={[styles.bankItem, styles.warningText]}>
          More banks coming soon!
        </ThemedText>
      </ThemedView>

      {/* Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  exampleLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 12,
  },
  example: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 13,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  resultMeta: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  infoItem: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.8,
  },
  infoSubItem: {
    marginLeft: 16,
    marginBottom: 4,
  },
  bankItem: {
    fontSize: 13,
    lineHeight: 22,
    opacity: 0.8,
  },
  warningText: {
    marginTop: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
