/**
 * Push Notification Service - Type Definitions
 * Comprehensive types for all notification operations
 */

export enum NotificationType {
  DAILY_REMINDER = 'daily_reminder',
  WEEKLY_REPORT = 'weekly_report',
  MONTHLY_REPORT = 'monthly_report',
  BUDGET_WARNING = 'budget_warning',
  BUDGET_EXCEEDED = 'budget_exceeded',
  DAILY_BUDGET = 'daily_budget',
  ACHIEVEMENT = 'achievement',
  SAVINGS_GOAL = 'savings_goal',
  UNUSUAL_SPENDING = 'unusual_spending',
  LOW_BALANCE = 'low_balance',
}

export enum NotificationPriority {
  PASSIVE = 'passive',        // Informational
  ACTIVE = 'active',          // Regular engagement
  TIME_SENSITIVE = 'time_sensitive', // Urgent attention
}

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
