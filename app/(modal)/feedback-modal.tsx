import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { sendContactMessage } from '@/lib/contact/contactService';
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

export default function FeedbackModal() {
  const router = useRouter();
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState<'bug_report' | 'feature_request' | 'general_feedback'>('general_feedback');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const { isDark, colors } = useTheme();

  const feedbackTypes = [
    { id: 'bug_report' as const, label: 'Bug Report', icon: 'bug-outline' },
    { id: 'feature_request' as const, label: 'Feature Request', icon: 'lightbulb-outline' },
    { id: 'general_feedback' as const, label: 'General Feedback', icon: 'comment-multiple-outline' },
  ];

  const handleSubmitFeedback = async () => {
    // Validation
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    if (feedbackText.trim().length < 5) {
      Alert.alert('Error', 'Feedback must be at least 5 characters');
      return;
    }

    if (feedbackText.trim().length > 5000) {
      Alert.alert('Error', 'Feedback must be less than 5000 characters');
      return;
    }

    if (!user?.email) {
      Alert.alert('Error', 'Please sign in to send feedback');
      return;
    }

    setLoading(true);
    try {
      // Map rating to feedback text
      const ratingText = rating > 0 ? `\n\n[Rating: ${rating}/5 - ${['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}]` : '';
      
      const result = await sendContactMessage(
        user.id,
        user.email,
        `[${feedbackType.replace(/_/g, ' ').toUpperCase()}] App Feedback`,
        feedbackText + ratingText,
        feedbackType
      );

      if (result.success) {
        Alert.alert(
          'Thank You! 🙏',
          'Your feedback has been submitted. We appreciate your input!'
        );
        setFeedbackText('');
        setRating(0);
        setFeedbackType('general_feedback');
        
        // Close modal after 1 second
        setTimeout(() => router.back(), 1000);
      } else {
        Alert.alert('Error', result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('[Feedback] Submission error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
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
          Send Feedback
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Intro */}
          <View style={styles.introSection}>
            <View style={[styles.introIconBox, { backgroundColor: `${colors.accent}15` }]}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={40}
                color={colors.accent}
              />
            </View>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              Help Us Improve
            </Text>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Your feedback helps us create a better app experience for everyone
            </Text>
          </View>

          {/* Feedback Type Selection */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons
                name="tag-multiple"
                size={18}
                color={colors.accent}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Feedback Type
              </Text>
            </View>

            <View style={styles.typeGrid}>
              {feedbackTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor:
                        feedbackType === type.id
                          ? colors.accent
                          : colors.surface,
                      borderColor:
                        feedbackType === type.id ? colors.accent : colors.border,
                      borderWidth: feedbackType === type.id ? 0 : 1.5,
                      shadowColor: colors.accent,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: feedbackType === type.id ? 0.3 : 0,
                      shadowRadius: 8,
                      elevation: feedbackType === type.id ? 4 : 0,
                    },
                  ]}
                  onPress={() => setFeedbackType(type.id as any)}>
                  <MaterialCommunityIcons
                    name={type.icon as any}
                    size={20}
                    color={feedbackType === type.id ? '#ffffff' : colors.accent}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      {
                        color:
                          feedbackType === type.id ? '#ffffff' : colors.text,
                        fontWeight: feedbackType === type.id ? '600' : '500',
                      },
                    ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons
                name="star-outline"
                size={18}
                color={colors.accent}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                How would you rate the app?
              </Text>
            </View>

            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={[
                    styles.starButton,
                    {
                      backgroundColor: star <= rating ? `${colors.accent}15` : 'transparent',
                      borderRadius: 12,
                    },
                  ]}>
                  <MaterialCommunityIcons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? colors.accent : colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {rating > 0 && (
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                {rating} / 5 - {
                  ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]
                }
              </Text>
            )}
          </View>

          {/* Feedback Text */}
          <View style={styles.section}>
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons
                name="pencil"
                size={18}
                color={colors.accent}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Feedback
              </Text>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.feedbackInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder={
                  feedbackType === 'bug_report'
                    ? 'Describe the bug you encountered...'
                    : feedbackType === 'feature_request'
                      ? 'Describe the feature you would like...'
                      : 'Share your feedback...'
                }
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                value={feedbackText}
                onChangeText={setFeedbackText}
                textAlignVertical="top"
                maxLength={5000}
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {feedbackText.length} / 5000
              </Text>
            </View>
          </View>

          {/* Additional Info */}
          {feedbackType === 'bug_report' && (
            <View
              style={[
                styles.premiumInfoBox,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                  borderColor: '#EF4444',
                  borderWidth: 1.5,
                  marginHorizontal: 16,
                  marginBottom: 16,
                },
              ]}>
              <View style={[styles.infoIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <MaterialCommunityIcons
                  name="bug-check-outline"
                  size={22}
                  color="#EF4444"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoBoxTitle, { color: '#EF4444', fontWeight: '700' }]}>
                  Bug Report Tip
                </Text>
                <Text style={[styles.infoBoxText, { color: colors.text, marginTop: 4 }]}>
                  Include specific steps to reproduce the bug for faster resolution.
                </Text>
              </View>
            </View>
          )}

          {feedbackType === 'feature_request' && (
            <View
              style={[
                styles.premiumInfoBox,
                {
                  backgroundColor: isDark ? `${colors.accent}12` : `${colors.accent}08`,
                  borderColor: colors.accent,
                  borderWidth: 1.5,
                  marginHorizontal: 16,
                  marginBottom: 16,
                },
              ]}>
              <View style={[styles.infoIconBox, { backgroundColor: `${colors.accent}20` }]}>
                <MaterialCommunityIcons
                  name="star-outline"
                  size={22}
                  color={colors.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoBoxTitle, { color: colors.accent, fontWeight: '700' }]}>
                  Feature Request Tip
                </Text>
                <Text style={[styles.infoBoxText, { color: colors.text, marginTop: 4 }]}>
                  Describe how this feature would improve your experience with the app.
                </Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.accent,
                opacity: loading ? 0.6 : 1,
                shadowColor: colors.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 5,
              },
            ]}
            onPress={handleSubmitFeedback}
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
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  introSection: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 14,
  },
  introIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  introText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  starButton: {
    padding: 10,
  },
  ratingText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  inputWrapper: {
    gap: 8,
  },
  feedbackInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '500',
  },
  premiumInfoBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBoxTitle: {
    fontSize: 14,
  },
  infoBoxText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
