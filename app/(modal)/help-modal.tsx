import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import {
  isValidMessage,
  isValidSubject,
  sendContactMessage
} from '@/lib/contact/contactService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'bug_report' | 'feature_request' | 'general_feedback' | 'other'>('other');

  const { isDark, colors } = useTheme();
  const userEmail = session?.user?.email || '';
  const userId = session?.user?.id || '';

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
    try {
      // ===== VALIDATION =====
      if (!userEmail || !userId) {
        Alert.alert(
          'Not Logged In',
          'You must be logged in to send a message. Please log in and try again.'
        );
        return;
      }

      // Validate subject
      if (!isValidSubject(subject)) {
        Alert.alert(
          'Invalid Subject',
          'Subject must be between 3 and 100 characters.'
        );
        return;
      }

      // Validate message
      if (!isValidMessage(message)) {
        Alert.alert(
          'Invalid Message',
          'Message must be between 5 and 5000 characters.'
        );
        return;
      }

      console.log('[HelpModal] Sending message...');
      setLoading(true);

      // ===== SEND MESSAGE =====
      const result = await sendContactMessage(
        userId,
        userEmail,
        subject,
        message,
        messageType
      );

      if (result.success) {
        console.log('[HelpModal] Message sent successfully');
        
        // Show success alert
        Alert.alert(
          '✓ Message Sent',
          'Thank you for reaching out! We typically respond within 24 hours. Check your email for our response.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setSubject('');
                setMessage('');
                setMessageType('other');
              },
            },
          ]
        );
      } else {
        console.error('[HelpModal] Failed to send message:', result.error);
        
        // Show error alert with helpful message
        Alert.alert(
          '⚠️ Message Not Sent',
          result.error || 'Failed to send your message. Please check your internet connection and try again.',
          [
            { text: 'Cancel', onPress: () => {}, style: 'cancel' },
            {
              text: 'Retry',
              onPress: () => handleSendMessage(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('[HelpModal] Unexpected error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again later.'
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text
              style={[
                styles.contentHeader,
                { color: colors.text, paddingHorizontal: 16 },
              ]}>
              Get in Touch
            </Text>

            <View style={styles.contactForm}>
              {/* Message Type Selector */}
              <View style={styles.formSection}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons
                    name="tag-multiple"
                    size={18}
                    color={colors.accent}
                  />
                  <Text style={[styles.label, { color: colors.text }]}>
                    Message Category
                  </Text>
                </View>
                <View style={styles.typeSelector}>
                  {[
                    { label: 'Bug Report', value: 'bug_report' as const, icon: 'bug-outline' as any },
                    { label: 'Feature Request', value: 'feature_request' as const, icon: 'lightbulb-outline' as any },
                    { label: 'Feedback', value: 'general_feedback' as const, icon: 'chat-outline' as any },
                    { label: 'Other', value: 'other' as const, icon: 'dots-horizontal' as any },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor:
                            messageType === type.value
                              ? colors.accent
                              : colors.surface,
                          borderColor: messageType === type.value ? colors.accent : colors.border,
                          borderWidth: messageType === type.value ? 0 : 1.5,
                          shadowColor: messageType === type.value ? colors.accent : 'transparent',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: messageType === type.value ? 0.3 : 0,
                          shadowRadius: 8,
                          elevation: messageType === type.value ? 4 : 0,
                        },
                      ]}
                      onPress={() => setMessageType(type.value)}>
                      <MaterialCommunityIcons
                        name={type.icon}
                        size={16}
                        color={messageType === type.value ? '#ffffff' : colors.accent}
                      />
                      <Text
                        style={[
                          styles.typeButtonText,
                          {
                            color:
                              messageType === type.value
                                ? '#ffffff'
                                : colors.text,
                            fontWeight: messageType === type.value ? '600' : '500',
                          },
                        ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Subject Field */}
              <View style={styles.formSection}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons
                    name="format-text"
                    size={18}
                    color={colors.accent}
                  />
                  <Text style={[styles.label, { color: colors.text }]}>
                    Subject
                  </Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="What is this about?"
                    placeholderTextColor={colors.textSecondary}
                    value={subject}
                    onChangeText={setSubject}
                    maxLength={100}
                    editable={!loading}
                  />
                  <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                    {subject.length}/100
                  </Text>
                </View>
              </View>

              {/* Message Field */}
              <View style={styles.formSection}>
                <View style={styles.labelContainer}>
                  <MaterialCommunityIcons
                    name="pencil"
                    size={18}
                    color={colors.accent}
                  />
                  <Text style={[styles.label, { color: colors.text }]}>
                    Message
                  </Text>
                </View>
                <View style={styles.inputWrapper}>
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
                    placeholder="Please provide detailed information about your message..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={6}
                    value={message}
                    onChangeText={setMessage}
                    maxLength={5000}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                  <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                    {message.length}/5000
                  </Text>
                </View>
              </View>

              {/* User Email Display */}
              <View
                style={[
                  styles.premiumInfoBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.accent,
                  },
                ]}>
                <View style={[styles.emailIconBox, { backgroundColor: `${colors.accent}20` }]}>
                  <MaterialCommunityIcons
                    name="email-check-outline"
                    size={24}
                    color={colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Response will be sent to:
                  </Text>
                  <Text style={[styles.emailText, { color: colors.text }]}>
                    {userEmail || 'Not logged in'}
                  </Text>
                </View>
              </View>

              {/* Send Button */}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: colors.accent,
                    opacity: loading ? 0.6 : 1,
                  },
                ]}
                onPress={handleSendMessage}
                disabled={loading}
                activeOpacity={0.7}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="send-circle"
                      size={22}
                      color="#FFFFFF"
                    />
                    <Text style={styles.sendButtonText}>Send Message</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Message */}
              <View
                style={[
                  styles.premiumInfoBox,
                  {
                    backgroundColor: isDark ? `${colors.accent}15` : `${colors.accent}10`,
                    borderColor: colors.accent,
                    borderWidth: 1,
                  },
                ]}>
                <View style={[styles.infoIconBox, { backgroundColor: `${colors.accent}20` }]}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={24}
                    color={colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.infoBoxTitle,
                      { color: colors.text, fontWeight: '700' },
                    ]}>
                    We Read Every Message
                  </Text>
                  <Text
                    style={[
                      styles.infoBoxText,
                      { color: colors.textSecondary, marginTop: 6 },
                    ]}>
                    Our team typically responds within 24 hours. Your message is encrypted and stored securely on our servers.
                  </Text>
                </View>
              </View>

              <View style={{ height: 24 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexDirection: 'row',
  },
  typeButtonText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputWrapper: {
    gap: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  messageInput: {
    paddingVertical: 12,
    minHeight: 120,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  premiumInfoBox: {
    flexDirection: 'row',
    marginVertical: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emailIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  infoBoxTitle: {
    fontSize: 14,
  },
  infoBoxText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});
