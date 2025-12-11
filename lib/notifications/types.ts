/**
 * Push Notification Service - Type Definitions
 * Comprehensive types for all notification operations
 */

export enum NotificationType {
  // Tier 1: Real-time Critical Alerts
  LARGE_TRANSACTION = 'large_transaction',
  BUDGET_EXCEEDED = 'budget_exceeded',
  UNUSUAL_SPENDING = 'unusual_spending',

  // Tier 2: Daily Scheduled Batch
  DAILY_REMINDER = 'daily_reminder',
  BUDGET_WARNING = 'budget_warning',
  DAILY_ANOMALY = 'daily_anomaly',

  // Tier 3: Weekly Scheduled Batch
  WEEKLY_SUMMARY = 'weekly_summary',
  BUDGET_COMPLIANCE = 'budget_compliance',
  SPENDING_TRENDS = 'spending_trends',

  // Tier 4: User-Controlled Optional
  GOAL_PROGRESS = 'goal_progress',
  ACHIEVEMENT = 'achievement',

  // Legacy types (kept for backward compatibility)
  WEEKLY_REPORT = 'weekly_report',
  MONTHLY_REPORT = 'monthly_report',
  DAILY_BUDGET = 'daily_budget',
  SAVINGS_GOAL = 'savings_goal',
  LOW_BALANCE = 'low_balance',
}

export enum NotificationPriority {
  // Professional tier system
  CRITICAL = 'critical',      // Real-time, ignore DND, no throttling
  HIGH = 'high',              // Real-time, respect DND, light throttling
  MEDIUM = 'medium',          // Daily batch, respect DND
  LOW = 'low',                // Weekly batch, optional

  // Legacy priorities (for backward compatibility)
  PASSIVE = 'passive',        // Informational
  ACTIVE = 'active',          // Regular engagement
  TIME_SENSITIVE = 'time_sensitive', // Urgent attention
}

/**
 * Professional Notification Priority Mapping
 * Maps each notification type to its appropriate priority tier
 */
export const NOTIFICATION_PRIORITIES: Record<NotificationType, NotificationPriority> = {
  // Tier 1: Real-time Critical Alerts
  [NotificationType.LARGE_TRANSACTION]: NotificationPriority.HIGH,
  [NotificationType.BUDGET_EXCEEDED]: NotificationPriority.CRITICAL,
  [NotificationType.UNUSUAL_SPENDING]: NotificationPriority.HIGH,

  // Tier 2: Daily Scheduled Batch
  [NotificationType.DAILY_REMINDER]: NotificationPriority.MEDIUM,
  [NotificationType.BUDGET_WARNING]: NotificationPriority.MEDIUM,
  [NotificationType.DAILY_ANOMALY]: NotificationPriority.MEDIUM,

  // Tier 3: Weekly Scheduled Batch
  [NotificationType.WEEKLY_SUMMARY]: NotificationPriority.LOW,
  [NotificationType.BUDGET_COMPLIANCE]: NotificationPriority.LOW,
  [NotificationType.SPENDING_TRENDS]: NotificationPriority.LOW,

  // Tier 4: User-Controlled Optional
  [NotificationType.GOAL_PROGRESS]: NotificationPriority.LOW,
  [NotificationType.ACHIEVEMENT]: NotificationPriority.LOW,

  // Legacy types
  [NotificationType.WEEKLY_REPORT]: NotificationPriority.LOW,
  [NotificationType.MONTHLY_REPORT]: NotificationPriority.LOW,
  [NotificationType.DAILY_BUDGET]: NotificationPriority.MEDIUM,
  [NotificationType.SAVINGS_GOAL]: NotificationPriority.LOW,
  [NotificationType.LOW_BALANCE]: NotificationPriority.HIGH,
};

/**
 * Minimum Interval Between Notifications (in milliseconds)
 * Prevents spam by enforcing minimum time between same notification types
 */
export const MIN_INTERVAL_BETWEEN_NOTIFICATIONS: Record<NotificationType, number> = {
  // Tier 1: No throttling for real-time alerts
  [NotificationType.LARGE_TRANSACTION]: 0,        // No throttling
  [NotificationType.BUDGET_EXCEEDED]: 3600000,    // 1 hour per category
  [NotificationType.UNUSUAL_SPENDING]: 3600000,   // 1 hour per category

  // Tier 2: Daily batch
  [NotificationType.DAILY_REMINDER]: 86400000,    // 1 per day
  [NotificationType.BUDGET_WARNING]: 86400000,    // 1 per day per category
  [NotificationType.DAILY_ANOMALY]: 86400000,     // 1 per day

  // Tier 3: Weekly batch
  [NotificationType.WEEKLY_SUMMARY]: 604800000,   // 1 per week
  [NotificationType.BUDGET_COMPLIANCE]: 604800000,// 1 per week
  [NotificationType.SPENDING_TRENDS]: 604800000,  // 1 per week

  // Tier 4: Per milestone
  [NotificationType.GOAL_PROGRESS]: 0,            // Per milestone
  [NotificationType.ACHIEVEMENT]: 0,              // Per milestone

  // Legacy
  [NotificationType.WEEKLY_REPORT]: 604800000,
  [NotificationType.MONTHLY_REPORT]: 2592000000, // 30 days
  [NotificationType.DAILY_BUDGET]: 86400000,
  [NotificationType.SAVINGS_GOAL]: 0,
  [NotificationType.LOW_BALANCE]: 3600000,
};
  
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  priority?: NotificationPriority;
  categoryId?: string;
}

export interface NotificationTrigger {
  type: 'time_interval' | 'calendar' | 'daily' | 'weekly' | 'monthly';
  seconds?: number; // For time_interval
  repeats?: boolean;
  hour?: number; // For calendar-based triggers
  minute?: number;
  weekday?: number; // 0-6 for weekly
  day?: number; // Day of month for monthly
}

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  trigger: NotificationTrigger;
  payload?: NotificationPayload;
  enabled: boolean;
  createdAt: Date;
  nextFireTime?: Date;
}

export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  
  // Daily Record Reminder
  dailyReminder: {
    enabled: boolean;
    time: string; // "HH:MM" format (24-hour)
    timezone?: string;
  };
  
  // Weekly Report
  weeklyReport: {
    enabled: boolean;
    dayOfWeek: number; // 0=Sunday, 6=Saturday
    time: string; // "HH:MM" format
    timezone?: string;
  };
  
  // Monthly Report
  monthlyReport: {
    enabled: boolean;
    dayOfMonth: number;
    time: string; // "HH:MM" format
    timezone?: string;
  };
  
  // Budget Alerts
  budgetAlerts: {
    enabled: boolean;
    warningPercentage: number; // Default: 80
    alertSound: boolean;
    vibration: boolean;
  };
  
  // Spending Anomalies
  spendingAnomalies: {
    enabled: boolean;
    threshold: number; // Percentage above average (default: 150)
  };
  
  // Daily Budget Notification
  dailyBudgetNotif: {
    enabled: boolean;
    time: string; // "HH:MM" format (usually midnight)
  };
  
  // Achievements
  achievements: {
    enabled: boolean;
  };
  
  // Account Alerts
  accountAlerts: {
    enabled: boolean;
    lowBalanceThreshold: number; // Percentage of average
  };
  
  // Do Not Disturb
  doNotDisturb: {
    enabled: boolean;
    startTime: string; // "HH:MM" format
    endTime: string; // "HH:MM" format
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationToken {
  userId: string;
  expoPushToken: string;
  devicePushToken?: string;
  deviceId: string;
  osType: 'ios' | 'android';
  osVersion: string;
  appVersion: string;
  registeredAt: Date;
  lastRefreshedAt: Date;
  isValid: boolean;
}

export interface NotificationEvent {
  id: string;
  userId: string;
  notificationType: NotificationType;
  action: 'received' | 'interacted' | 'dropped';
  timestamp: Date;
  payload?: NotificationPayload;
  response?: {
    actionId: string;
    userText?: string;
  };
}

export interface NotificationCategory {
  identifier: string;
  actions: NotificationAction[];
  intentIdentifiers?: string[];
  hiddenPreviewsBodyPlaceholder?: string;
  customDismissAction?: boolean;
}

export interface NotificationAction {
  identifier: string;
  buttonTitle: string;
  isDestructive?: boolean;
  isAuthenticationRequired?: boolean;
  isUserInteractionRequired?: boolean;
  textInput?: {
    placeholder: string;
  };
}

export interface NotificationResponse {
  notification: {
    request: {
      identifier: string;
      content: {
        title: string;
        body: string;
        data: Record<string, string>;
        badge?: number;
        sound?: string;
      };
      trigger: NotificationTrigger;
    };
  };
  actionIdentifier: string;
  userText?: string;
}

export interface AndroidChannel {
  id: string;
  name: string;
  importance: 'min' | 'low' | 'default' | 'high' | 'max';
  bypassDnd?: boolean;
  description?: string;
  enableVibration?: boolean;
  vibrationPattern?: number[];
  enableLights?: boolean;
  lightColor?: string;
  sound?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  message: string;
}

export interface PushTokenResponse {
  success: boolean;
  token?: string;
  error?: string;
  message: string;
}

export interface NotificationDeepLink {
  screen: string;
  params?: Record<string, string>;
}
