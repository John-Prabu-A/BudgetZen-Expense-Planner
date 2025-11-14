import { useAppColorScheme } from '@/hooks/useAppColorScheme';
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

export default function FeedbackModal() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const isDark = colorScheme === 'dark';
  const colors = {
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    surface: isDark ? '#2A2A2A' : '#F9FAFB',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#A0A0A0' : '#6B7280',
    border: isDark ? '#404040' : '#E5E7EB',
    accent: '#3B82F6',
    input: isDark ? '#333333' : '#F3F4F6',
    success: '#10B981',
  };

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: 'bug-outline' },
    { id: 'feature', label: 'Feature Request', icon: 'lightbulb-outline' },
    { id: 'general', label: 'General Feedback', icon: 'comment-multiple-outline' },
  ];

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement feedback submission
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted. We appreciate your input!'
      );
      setFeedbackText('');
      setRating(0);
      setFeedbackType('general');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
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
          Send Feedback
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introSection}>
          <MaterialCommunityIcons
            name="heart-outline"
            size={40}
            color={colors.accent}
          />
          <Text style={[styles.introTitle, { color: colors.text }]}>
            Help Us Improve
          </Text>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Your feedback helps us create a better app experience for everyone
          </Text>
        </View>

        {/* Feedback Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Feedback Type
          </Text>

          <View style={styles.typeGrid}>
            {feedbackTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      feedbackType === type.id
                        ? 'rgba(59, 130, 246, 0.15)'
                        : colors.surface,
                    borderColor:
                      feedbackType === type.id ? colors.accent : colors.border,
                    borderWidth: feedbackType === type.id ? 2 : 1,
                  },
                ]}
                onPress={() => setFeedbackType(type.id as any)}>
                <MaterialCommunityIcons
                  name={type.icon as any}
                  size={24}
                  color={feedbackType === type.id ? colors.accent : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    {
                      color:
                        feedbackType === type.id ? colors.accent : colors.text,
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How would you rate the app?
          </Text>

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}>
                <MaterialCommunityIcons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= rating ? '#F59E0B' : colors.textSecondary}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Feedback
          </Text>

          <TextInput
            style={[
              styles.feedbackInput,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={
              feedbackType === 'bug'
                ? 'Describe the bug you encountered...'
                : feedbackType === 'feature'
                  ? 'Describe the feature you would like...'
                  : 'Share your feedback...'
            }
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={6}
            value={feedbackText}
            onChangeText={setFeedbackText}
            textAlignVertical="top"
          />

          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {feedbackText.length} / 1000
          </Text>
        </View>

        {/* Additional Info */}
        {feedbackType === 'bug' && (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#EF4444',
              },
            ]}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color="#EF4444"
            />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Please include specific steps to reproduce the bug if possible.
            </Text>
          </View>
        )}

        {feedbackType === 'feature' && (
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
              Describe how this feature would improve your experience.
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.accent }]}
          onPress={handleSubmitFeedback}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
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
  },
  introSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  introText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
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
    borderRadius: 8,
    gap: 8,
  },
  typeButtonText: {
    fontSize: 12,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  ratingText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  charCount: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
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
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
