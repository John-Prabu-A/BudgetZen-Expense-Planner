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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpModal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { isDark, colors } = useTheme();

  const FAQItems = [
    {
      question: 'How do I add a new expense?',
      answer:
        'Navigate to the Records tab and tap the "+" button to add a new record. Fill in the amount, category, date, and optional notes.',
    },
    {
      question: 'Can I edit or delete an expense?',
      answer:
        'Yes, long-press on any record to see options for editing or deleting it. Be careful as deletion cannot be undone.',
    },
    {
      question: 'How do I create a budget?',
      answer:
        'Go to the Budgets tab and tap "+" to create a new budget. Set your budget limit and category, and track your spending against it.',
    },
    {
      question: 'How do I backup my data?',
      answer:
        'Open the sidebar menu, go to Management > Backup & Restore, and tap "Create New Backup". Your data will be securely stored in the cloud.',
    },
    {
      question: 'How do I export my records?',
      answer:
        'Open the sidebar menu, go to Management > Export Records. Select your date range and tap "Generate Export" to get a CSV file.',
    },
    {
      question: 'Is my data secure?',
      answer:
        'Yes, all data is encrypted and securely stored in Supabase. We use industry-standard security practices to protect your information.',
    },
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement send message logic
      Alert.alert('Success', 'Your message has been sent. We will contact you soon.');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
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
          Help & Support
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            {
              borderBottomColor: activeTab === 'faq' ? colors.accent : 'transparent',
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('faq')}>
          <MaterialCommunityIcons
            name="help-circle"
            size={20}
            color={activeTab === 'faq' ? colors.accent : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'faq' ? colors.accent : colors.textSecondary,
                fontWeight: activeTab === 'faq' ? '600' : '500',
              },
            ]}>
            FAQ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            {
              borderBottomColor:
                activeTab === 'contact' ? colors.accent : 'transparent',
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('contact')}>
          <MaterialCommunityIcons
            name="email-outline"
            size={20}
            color={activeTab === 'contact' ? colors.accent : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'contact' ? colors.accent : colors.textSecondary,
                fontWeight: activeTab === 'contact' ? '600' : '500',
              },
            ]}>
            Contact
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'faq' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text
            style={[
              styles.contentHeader,
              { color: colors.text, paddingHorizontal: 16 },
            ]}>
            Frequently Asked Questions
          </Text>

          {FAQItems.map((item, idx) => (
            <View key={idx} style={styles.faqItem}>
              <View
                style={[
                  styles.questionBox,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <MaterialCommunityIcons
                  name="help-box-outline"
                  size={20}
                  color={colors.accent}
                />
                <Text style={[styles.question, { color: colors.text }]}>
                  {item.question}
                </Text>
              </View>
              <View style={[styles.answerBox, { borderColor: colors.border }]}>
                <Text style={[styles.answer, { color: colors.textSecondary }]}>
                  {item.answer}
                </Text>
              </View>
            </View>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text
            style={[
              styles.contentHeader,
              { color: colors.text, paddingHorizontal: 16 },
            ]}>
            Get in Touch
          </Text>

          <View style={styles.contactForm}>
            <View style={styles.formSection}>
              <Text style={[styles.label, { color: colors.text }]}>
                Subject
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g., Bug report, Feature request"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={[styles.label, { color: colors.text }]}>
                Message
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.messageInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Describe your issue or suggestion..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={5}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: colors.accent },
              ]}
              onPress={handleSendMessage}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="send"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>

            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderColor: colors.accent,
                },
              ]}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.infoText, { color: colors.text }]}>
                We typically respond within 24 hours. Check your email for our response.
              </Text>
            </View>

            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      )}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentHeader: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 16,
  },
  faqItem: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  questionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  question: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  answerBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderRadius: 4,
  },
  answer: {
    fontSize: 13,
    lineHeight: 20,
  },
  contactForm: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  messageInput: {
    paddingVertical: 12,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    marginTop: 16,
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
