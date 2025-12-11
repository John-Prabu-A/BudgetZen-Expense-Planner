/**
 * Notification Categories & Interactive Actions
 * Defines interactive notification categories with custom buttons/actions
 * Used for iOS and Android 7.0+ to add action buttons to notifications
 */

import * as Notifications from 'expo-notifications';
import { NotificationCategory } from './types';

/**
 * Define all notification categories with their interactive actions
 */
export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    identifier: 'budget_alert',
    actions: [
      {
        identifier: 'view_budget',
        buttonTitle: 'View Budget',
        isAuthenticationRequired: false,
        isDestructive: false,
      },
      {
        identifier: 'dismiss_budget',
        buttonTitle: 'Dismiss',
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    ],
    customDismissAction: true,
  },
  {
    identifier: 'weekly_report',
    actions: [
      {
        identifier: 'view_report',
        buttonTitle: 'View Report',
        isAuthenticationRequired: false,
        isDestructive: false,
      },
      {
        identifier: 'dismiss_report',
        buttonTitle: 'Dismiss',
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    ],
  },
  {
    identifier: 'achievement',
    actions: [
      {
        identifier: 'view_achievement',
        buttonTitle: 'View Achievement',
        isAuthenticationRequired: false,
        isDestructive: false,
      },
      {
        identifier: 'share_achievement',
        buttonTitle: 'Share',
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    ],
  },
  {
    identifier: 'spending_alert',
    actions: [
      {
        identifier: 'view_analysis',
        buttonTitle: 'View Details',
        isAuthenticationRequired: false,
        isDestructive: false,
      },
      {
        identifier: 'ignore',
        buttonTitle: 'Ignore',
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    ],
  },
  {
    identifier: 'account_alert',
    actions: [
      {
        identifier: 'view_accounts',
        buttonTitle: 'View Accounts',
        isAuthenticationRequired: false,
        isDestructive: false,
      },
      {
        identifier: 'remind_later',
        buttonTitle: 'Remind Later',
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    ],
  },
];

/**
 * Map notification types to their categories
 */
const NOTIFICATION_TYPE_CATEGORY_MAP: Record<string, string> = {
  budget_warning: 'budget_alert',
  budget_exceeded: 'budget_alert',
  weekly_report: 'weekly_report',
  monthly_report: 'weekly_report',
  achievement: 'achievement',
  savings_goal: 'achievement',
  unusual_spending: 'spending_alert',
  low_balance: 'account_alert',
};

/**
 * Get category ID for a notification type
 */
export const getCategoryForNotificationType = (
  notificationType: string
): string | undefined => {
  return NOTIFICATION_TYPE_CATEGORY_MAP[notificationType];
};

/**
 * Setup all notification categories on app startup
 * This is primarily for iOS to define interactive notification actions
 */
export const setupNotificationCategories = async (): Promise<void> => {
  try {
    console.log('📱 Starting notification categories setup...');
    let successCount = 0;
    let errorCount = 0;

    for (const category of NOTIFICATION_CATEGORIES) {
      try {
        if (!category.identifier) {
          console.warn('⚠️ Skipping category with missing identifier:', category);
          continue;
        }

        const actions: Notifications.NotificationAction[] = (
          category.actions || []
        ).map((action) => ({
          identifier: String(action.identifier),
          buttonTitle: String(action.buttonTitle),
          isAuthenticationRequired: Boolean(
            action.isAuthenticationRequired || false
          ),
          isDestructive: Boolean(action.isDestructive || false),
        }));

        await Notifications.setNotificationCategoryAsync(
          category.identifier,
          actions,
          {
            customDismissAction: Boolean(category.customDismissAction || false),
            allowInCarPlay: false,
            previewPlaceholder: 'New notification',
          }
        );

        console.log(`✓ Notification category created: ${category.identifier}`);
        successCount++;
      } catch (categoryError) {
        console.error(
          `❌ Error creating category "${category?.identifier || 'unknown'}":`,
          categoryError instanceof Error ? categoryError.message : String(categoryError)
        );
        errorCount++;
      }
    }

    console.log(
      `✅ Notification categories setup completed (${successCount} success, ${errorCount} errors)`
    );
  } catch (error) {
    console.error(
      'Error setting up notification categories:',
      error instanceof Error ? error.message : String(error)
    );
    // Don't re-throw - allow app to continue even if categories fail
  }
};

/**
 * Get all configured categories
 */
export const getConfiguredCategories = (): NotificationCategory[] => {
  return NOTIFICATION_CATEGORIES;
};

/**
 * Handle notification action response
 */
export const handleNotificationAction = async (
  categoryId: string,
  actionId: string,
  notificationData: Record<string, string>
): Promise<void> => {
  console.log(
    `Notification action: Category=${categoryId}, Action=${actionId}`
  );

  switch (categoryId) {
    case 'budget_alert':
      if (actionId === 'view_budget') {
        // Navigate to budget screen
        console.log('Opening budget details...');
      }
      break;

    case 'weekly_report':
      if (actionId === 'view_report') {
        // Navigate to analysis screen
        console.log('Opening weekly report...');
      }
      break;

    case 'achievement':
      if (actionId === 'view_achievement') {
        // Navigate to achievements
        console.log('Opening achievements...');
      }
      break;

    case 'spending_alert':
      if (actionId === 'view_analysis') {
        // Navigate to analysis with details
        console.log('Opening spending analysis...');
      }
      break;

    case 'account_alert':
      if (actionId === 'view_accounts') {
        // Navigate to accounts screen
        console.log('Opening accounts...');
      }
      break;

    default:
      console.log('Unknown category action');
  }
};
