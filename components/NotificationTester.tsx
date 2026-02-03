/**
 * Notification Tester Component
 * Standalone component for testing all notification types in the app
 * Usage: Import and add to any screen for quick notification testing
 */

import { useTheme } from '@/context/Theme';
import useNotifications from '@/hooks/useNotifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TestNotification {
  id: string;
  label: string;
  emoji: string;
  category: string;
  testFunction: () => Promise<void>;
}

export default function NotificationTester() {
  const { colors } = useTheme();
  const notificationHook = useNotifications();
  const [testingNotification, setTestingNotification] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Define all test notifications
  const testNotifications: TestNotification[] = [
    // Real-time Alerts
    {
      id: 'large-transaction',
      label: 'Large Transaction Alert',
      emoji: '💰',
      category: 'Real-time Alerts',
      testFunction: async () => {
        await notificationHook.sendLargeTransactionAlert(25000, 'Electronics');
      },
    },
    {
      id: 'budget-exceeded',
      label: 'Budget Exceeded Alert',
      emoji: '❌',
      category: 'Real-time Alerts',
      testFunction: async () => {
        await notificationHook.sendBudgetExceededAlert('Groceries', 12000, 10000);
      },
    },
    {
      id: 'budget-warning',
      label: 'Budget Warning (80%)',
      emoji: '⚠️',
      category: 'Real-time Alerts',
      testFunction: async () => {
        await notificationHook.sendBudgetWarning('Dining Out', 8000, 10000);
      },
    },
    {
      id: 'unusual-spending',
      label: 'Unusual Spending Alert',
      emoji: '📈',
      category: 'Real-time Alerts',
      testFunction: async () => {
        await notificationHook.sendUnusualSpendingAlert('Shopping', 8000, 3000);
      },
    },
    {
      id: 'low-balance',
      label: 'Low Balance Alert',
      emoji: '⚠️',
      category: 'Real-time Alerts',
      testFunction: async () => {
        await notificationHook.sendLowBalance('Savings Account', 5000);
      },
    },

    // Scheduled Reports
    {
      id: 'daily-reminder',
      label: 'Daily Reminder',
      emoji: '📝',
      category: 'Scheduled Reports',
      testFunction: async () => {
        await notificationHook.scheduleDailyReminder();
      },
    },
    {
      id: 'weekly-report',
      label: 'Weekly Report',
      emoji: '📊',
      category: 'Scheduled Reports',
      testFunction: async () => {
        await notificationHook.scheduleWeeklyReport();
      },
    },
    {
      id: 'monthly-report',
      label: 'Monthly Report',
      emoji: '📅',
      category: 'Scheduled Reports',
      testFunction: async () => {
        await notificationHook.scheduleMonthlyReport();
      },
    },

    // Achievements & Goals
    {
      id: 'achievement',
      label: 'Achievement Notification',
      emoji: '🏆',
      category: 'Achievements & Goals',
      testFunction: async () => {
        await notificationHook.sendAchievement(
          '🏆 Milestone Reached!',
          'You\'ve saved ₹1,00,000! Amazing work!'
        );
      },
    },
    {
      id: 'savings-goal',
      label: 'Savings Goal Progress',
      emoji: '🎯',
      category: 'Achievements & Goals',
      testFunction: async () => {
        await notificationHook.sendSavingsGoalProgress('Vacation Fund', 60, 36000, 60000);
      },
    },
  ];

  // Group by category
  const groupedNotifications = testNotifications.reduce((acc, notif) => {
    const category = notif.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(notif);
    return acc;
  }, {} as Record<string, TestNotification[]>);

  const categories = Object.keys(groupedNotifications);

  const handleTestNotification = async (testNotif: TestNotification) => {
    setTestingNotification(testNotif.id);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await testNotif.testFunction();
      Alert.alert('✅ Sent', `${testNotif.emoji} ${testNotif.label} sent successfully!`);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('❌ Error', `Failed to send ${testNotif.label}`);
    } finally {
      setTestingNotification(null);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="bell-badge" size={32} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>
          Notification Tester
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Test all notification types
        </Text>
      </View>

      {categories.map((category) => (
        <View key={category} style={styles.categoryContainer}>
          {/* Category Header */}
          <TouchableOpacity
            onPress={() => toggleCategory(category)}
            style={[styles.categoryHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              {category}
            </Text>
            <MaterialCommunityIcons
              name={expandedCategory === category ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.accent}
            />
          </TouchableOpacity>

          {/* Category Items */}
          {expandedCategory === category && (
            <View style={[styles.itemsContainer, { backgroundColor: colors.surface }]}>
              {groupedNotifications[category].map((testNotif) => (
                <TouchableOpacity
                  key={testNotif.id}
                  onPress={() => handleTestNotification(testNotif)}
                  disabled={testingNotification === testNotif.id}
                  style={[
                    styles.testButton,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor:
                        testingNotification === testNotif.id
                          ? colors.accent
                          : colors.surface,
                    },
                  ]}
                >
                  <Text style={styles.emoji}>{testNotif.emoji}</Text>
                  <Text
                    style={[
                      styles.label,
                      {
                        color:
                          testingNotification === testNotif.id
                            ? '#fff'
                            : colors.text,
                      },
                    ]}
                  >
                    {testNotif.label}
                  </Text>
                  {testingNotification === testNotif.id ? (
                    <ActivityIndicator
                      size="small"
                      color={testingNotification === testNotif.id ? '#fff' : colors.accent}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

      {/* Info Box */}
      <View
        style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <MaterialCommunityIcons name="information" size={20} color={colors.accent} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          Each test sends a realistic notification with sample data. Check your notifications
          panel to see the results.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  categoryContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemsContainer: {
    paddingVertical: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  emoji: {
    fontSize: 20,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
