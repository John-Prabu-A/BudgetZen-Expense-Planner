import React, { createContext, useContext, useEffect, useState } from 'react';
import SecureStorageManager from '../lib/storage/secureStorageManager';

export type Theme = 'light' | 'dark' | 'system';
export type UIMode = 'compact' | 'standard' | 'spacious';
export type CurrencySign = '₹' | '$' | '€' | '£' | '¥';
export type CurrencyPosition = 'before' | 'after';
export type DecimalPlaces = 0 | 1 | 2 | 3;

interface PreferencesContextType {
  // Appearance
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  uiMode: UIMode;
  setUIMode: (mode: UIMode) => Promise<void>;
  currencySign: CurrencySign;
  setCurrencySign: (sign: CurrencySign) => Promise<void>;
  currencyPosition: CurrencyPosition;
  setCurrencyPosition: (position: CurrencyPosition) => Promise<void>;
  decimalPlaces: DecimalPlaces;
  setDecimalPlaces: (places: DecimalPlaces) => Promise<void>;

  // Security
  hasSecurity: boolean;
  passcodeEnabled: boolean;
  setPasscodeEnabled: (enabled: boolean) => Promise<void>;
  passcodeHash: string | null;
  setPasscodeHash: (hash: string) => Promise<void>;
  clearPasscodeHash: () => Promise<void>;
  passcodeLength: 4 | 6;
  setPasscodeLength: (length: 4 | 6) => Promise<void>;
  passwordEnabled: boolean;
  setPasswordEnabled: (enabled: boolean) => Promise<void>;
  passwordHash: string | null;
  setPasswordHash: (hash: string) => Promise<void>;
  clearPasswordHash: () => Promise<void>;
  authMethod: 'password' | 'passcode' | 'both' | 'none';
  setAuthMethod: (method: 'password' | 'passcode' | 'both' | 'none') => Promise<void>;

  // Notifications
  remindDaily: boolean;
  setRemindDaily: (remind: boolean) => Promise<void>;
  reminderTime: string;
  setReminderTime: (time: string) => Promise<void>;
  budgetAlerts: boolean;
  setBudgetAlerts: (enabled: boolean) => Promise<void>;
  lowBalanceAlerts: boolean;
  setLowBalanceAlerts: (enabled: boolean) => Promise<void>;
  emailNotifications: boolean;
  setEmailNotifications: (enabled: boolean) => Promise<void>;
  pushNotifications: boolean;
  setPushNotifications: (enabled: boolean) => Promise<void>;

  // Data Management
  autoSync: boolean;
  setAutoSync: (enabled: boolean) => Promise<void>;
  autoBackup: boolean;
  setAutoBackup: (enabled: boolean) => Promise<void>;
  dataRetentionDays: number;
  setDataRetentionDays: (days: number) => Promise<void>;
  exportFormat: 'csv' | 'json';
  setExportFormat: (format: 'csv' | 'json') => Promise<void>;

  // About
  sendCrashStats: boolean;
  setSendCrashStats: (send: boolean) => Promise<void>;
  appVersion: string;

  // Loading state
  loading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'pref_theme',
  UI_MODE: 'pref_ui_mode',
  CURRENCY_SIGN: 'pref_currency_sign',
  CURRENCY_POSITION: 'pref_currency_position',
  DECIMAL_PLACES: 'pref_decimal_places',
  HAS_SECURITY: 'pref_has_security',
  PASSCODE_ENABLED: 'pref_passcode_enabled',
  PASSCODE_HASH: 'pref_passcode_hash',
  PASSCODE_LENGTH: 'pref_passcode_length',
  PASSWORD_ENABLED: 'pref_password_enabled',
  PASSWORD_HASH: 'pref_password_hash',
  AUTH_METHOD: 'pref_auth_method',
  REMIND_DAILY: 'pref_remind_daily',
  REMINDER_TIME: 'pref_reminder_time',
  BUDGET_ALERTS: 'pref_budget_alerts',
  LOW_BALANCE_ALERTS: 'pref_low_balance_alerts',
  EMAIL_NOTIFICATIONS: 'pref_email_notifications',
  PUSH_NOTIFICATIONS: 'pref_push_notifications',
  AUTO_SYNC: 'pref_auto_sync',
  AUTO_BACKUP: 'pref_auto_backup',
  DATA_RETENTION_DAYS: 'pref_data_retention_days',
  EXPORT_FORMAT: 'pref_export_format',
  SEND_CRASH_STATS: 'pref_send_crash_stats',
};

const DEFAULT_VALUES = {
  theme: 'system' as Theme,
  uiMode: 'standard' as UIMode,
  currencySign: '₹' as CurrencySign,
  currencyPosition: 'before' as CurrencyPosition,
  decimalPlaces: 2 as DecimalPlaces,
  hasSecurity: false,
  passcodeEnabled: false,
  passcodeHash: null as string | null,
  passcodeLength: 4 as 4 | 6,
  passwordEnabled: false,
  passwordHash: null as string | null,
  authMethod: 'none' as 'password' | 'passcode' | 'both' | 'none',
  remindDaily: true,
  reminderTime: '09:00 AM',
  budgetAlerts: true,
  lowBalanceAlerts: true,
  emailNotifications: true,
  pushNotifications: true,
  autoSync: true,
  autoBackup: true,
  dataRetentionDays: 365,
  exportFormat: 'csv' as 'csv' | 'json',
  sendCrashStats: true,
};

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_VALUES.theme);
  const [uiMode, setUIModeState] = useState<UIMode>(DEFAULT_VALUES.uiMode);
  const [currencySign, setCurrencySignState] = useState<CurrencySign>(DEFAULT_VALUES.currencySign);
  const [currencyPosition, setCurrencyPositionState] = useState<CurrencyPosition>(DEFAULT_VALUES.currencyPosition);
  const [decimalPlaces, setDecimalPlacesState] = useState<DecimalPlaces>(DEFAULT_VALUES.decimalPlaces);
  const [hasSecurity, setHasSecurityState] = useState<boolean>(DEFAULT_VALUES.hasSecurity);
  const [passcodeEnabled, setPasscodeEnabledState] = useState<boolean>(DEFAULT_VALUES.passcodeEnabled);
  const [passcodeHash, setPasscodeHashState] = useState<string | null>(DEFAULT_VALUES.passcodeHash);
  const [passcodeLength, setPasscodeLengthState] = useState<4 | 6>(DEFAULT_VALUES.passcodeLength);
  const [passwordEnabled, setPasswordEnabledState] = useState<boolean>(DEFAULT_VALUES.passwordEnabled);
  const [passwordHash, setPasswordHashState] = useState<string | null>(DEFAULT_VALUES.passwordHash);
  const [authMethod, setAuthMethodState] = useState<'password' | 'passcode' | 'both' | 'none'>(DEFAULT_VALUES.authMethod);
  const [remindDaily, setRemindDailyState] = useState<boolean>(DEFAULT_VALUES.remindDaily);
  const [reminderTime, setReminderTimeState] = useState<string>(DEFAULT_VALUES.reminderTime);
  const [budgetAlerts, setBudgetAlertsState] = useState<boolean>(DEFAULT_VALUES.budgetAlerts);
  const [lowBalanceAlerts, setLowBalanceAlertsState] = useState<boolean>(DEFAULT_VALUES.lowBalanceAlerts);
  const [emailNotifications, setEmailNotificationsState] = useState<boolean>(DEFAULT_VALUES.emailNotifications);
  const [pushNotifications, setPushNotificationsState] = useState<boolean>(DEFAULT_VALUES.pushNotifications);
  const [autoSync, setAutoSyncState] = useState<boolean>(DEFAULT_VALUES.autoSync);
  const [autoBackup, setAutoBackupState] = useState<boolean>(DEFAULT_VALUES.autoBackup);
  const [dataRetentionDays, setDataRetentionDaysState] = useState<number>(DEFAULT_VALUES.dataRetentionDays);
  const [exportFormat, setExportFormatState] = useState<'csv' | 'json'>(DEFAULT_VALUES.exportFormat);
  const [sendCrashStats, setSendCrashStatsState] = useState<boolean>(DEFAULT_VALUES.sendCrashStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const storedTheme = (await SecureStorageManager.getItem(STORAGE_KEYS.THEME)) as Theme;
      const storedUIMode = (await SecureStorageManager.getItem(STORAGE_KEYS.UI_MODE)) as UIMode;
      const storedCurrencySign = (await SecureStorageManager.getItem(STORAGE_KEYS.CURRENCY_SIGN)) as CurrencySign;
      const storedCurrencyPosition = (await SecureStorageManager.getItem(STORAGE_KEYS.CURRENCY_POSITION)) as CurrencyPosition;
      const storedDecimalPlaces = (await SecureStorageManager.getItem(STORAGE_KEYS.DECIMAL_PLACES)) as unknown as DecimalPlaces;
      const storedHasSecurity = (await SecureStorageManager.getItem(STORAGE_KEYS.HAS_SECURITY)) === 'true';
      const storedPasscodeEnabled = (await SecureStorageManager.getItem(STORAGE_KEYS.PASSCODE_ENABLED)) === 'true';
      const storedPasscodeHash = await SecureStorageManager.getItem(STORAGE_KEYS.PASSCODE_HASH);
      const storedPasscodeLength = (await SecureStorageManager.getItem(STORAGE_KEYS.PASSCODE_LENGTH)) as '4' | '6' | null;
      const storedPasswordEnabled = (await SecureStorageManager.getItem(STORAGE_KEYS.PASSWORD_ENABLED)) === 'true';
      const storedPasswordHash = await SecureStorageManager.getItem(STORAGE_KEYS.PASSWORD_HASH);
      const storedAuthMethod = (await SecureStorageManager.getItem(STORAGE_KEYS.AUTH_METHOD)) as 'password' | 'passcode' | 'both' | 'none' | null;
      const storedRemindDaily = (await SecureStorageManager.getItem(STORAGE_KEYS.REMIND_DAILY)) !== 'false';
      const storedReminderTime = (await SecureStorageManager.getItem(STORAGE_KEYS.REMINDER_TIME)) || DEFAULT_VALUES.reminderTime;
      const storedBudgetAlerts = (await SecureStorageManager.getItem(STORAGE_KEYS.BUDGET_ALERTS)) !== 'false';
      const storedLowBalanceAlerts = (await SecureStorageManager.getItem(STORAGE_KEYS.LOW_BALANCE_ALERTS)) !== 'false';
      const storedEmailNotifications = (await SecureStorageManager.getItem(STORAGE_KEYS.EMAIL_NOTIFICATIONS)) !== 'false';
      const storedPushNotifications = (await SecureStorageManager.getItem(STORAGE_KEYS.PUSH_NOTIFICATIONS)) !== 'false';
      const storedAutoSync = (await SecureStorageManager.getItem(STORAGE_KEYS.AUTO_SYNC)) !== 'false';
      const storedAutoBackup = (await SecureStorageManager.getItem(STORAGE_KEYS.AUTO_BACKUP)) !== 'false';
      const storedDataRetentionDays = parseInt((await SecureStorageManager.getItem(STORAGE_KEYS.DATA_RETENTION_DAYS)) || DEFAULT_VALUES.dataRetentionDays.toString());
      const storedExportFormat = (await SecureStorageManager.getItem(STORAGE_KEYS.EXPORT_FORMAT)) as 'csv' | 'json' | null;
      const storedSendCrashStats = (await SecureStorageManager.getItem(STORAGE_KEYS.SEND_CRASH_STATS)) !== 'false';

      if (storedTheme) setThemeState(storedTheme);
      if (storedUIMode) setUIModeState(storedUIMode);
      if (storedCurrencySign) setCurrencySignState(storedCurrencySign);
      if (storedCurrencyPosition) setCurrencyPositionState(storedCurrencyPosition);
      if (storedDecimalPlaces) setDecimalPlacesState(storedDecimalPlaces);
      setHasSecurityState(storedHasSecurity);
      setPasscodeEnabledState(storedPasscodeEnabled);
      if (storedPasscodeHash) setPasscodeHashState(storedPasscodeHash);
      if (storedPasscodeLength) setPasscodeLengthState(parseInt(storedPasscodeLength) as 4 | 6);
      setPasswordEnabledState(storedPasswordEnabled);
      if (storedPasswordHash) setPasswordHashState(storedPasswordHash);
      if (storedAuthMethod) setAuthMethodState(storedAuthMethod);
      setRemindDailyState(storedRemindDaily);
      setReminderTimeState(storedReminderTime);
      setBudgetAlertsState(storedBudgetAlerts);
      setLowBalanceAlertsState(storedLowBalanceAlerts);
      setEmailNotificationsState(storedEmailNotifications);
      setPushNotificationsState(storedPushNotifications);
      setAutoSyncState(storedAutoSync);
      setAutoBackupState(storedAutoBackup);
      setDataRetentionDaysState(storedDataRetentionDays);
      if (storedExportFormat) setExportFormatState(storedExportFormat);
      setSendCrashStatsState(storedSendCrashStats);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await SecureStorageManager.setItem(STORAGE_KEYS.THEME, newTheme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  const setUIMode = async (newMode: UIMode) => {
    try {
      setUIModeState(newMode);
      await SecureStorageManager.setItem(STORAGE_KEYS.UI_MODE, newMode);
    } catch (error) {
      console.error('Error setting UI mode:', error);
    }
  };

  const setCurrencySign = async (newSign: CurrencySign) => {
    try {
      setCurrencySignState(newSign);
      await SecureStorageManager.setItem(STORAGE_KEYS.CURRENCY_SIGN, newSign);
    } catch (error) {
      console.error('Error setting currency sign:', error);
    }
  };

  const setCurrencyPosition = async (newPosition: CurrencyPosition) => {
    try {
      setCurrencyPositionState(newPosition);
      await SecureStorageManager.setItem(STORAGE_KEYS.CURRENCY_POSITION, newPosition);
    } catch (error) {
      console.error('Error setting currency position:', error);
    }
  };

  const setDecimalPlaces = async (newPlaces: DecimalPlaces) => {
    try {
      setDecimalPlacesState(newPlaces);
      await SecureStorageManager.setItem(STORAGE_KEYS.DECIMAL_PLACES, newPlaces.toString());
    } catch (error) {
      console.error('Error setting decimal places:', error);
    }
  };

  const setPasscodeEnabled = async (enabled: boolean) => {
    try {
      setPasscodeEnabledState(enabled);
      await SecureStorageManager.setItem(STORAGE_KEYS.PASSCODE_ENABLED, enabled.toString());
    } catch (error) {
      console.error('Error setting passcode enabled:', error);
    }
  };

  const setPasswordEnabled = async (enabled: boolean) => {
    try {
      setPasswordEnabledState(enabled);
      await SecureStorageManager.setItem(STORAGE_KEYS.PASSWORD_ENABLED, enabled.toString());
    } catch (error) {
      console.error('Error setting password enabled:', error);
    }
  };

  const setPasswordHash = async (hash: string) => {
    try {
      setPasswordHashState(hash);
      setPasswordEnabledState(true);
      setHasSecurityState(true);
      await SecureStorageManager.setItem(STORAGE_KEYS.PASSWORD_HASH, hash);
      await SecureStorageManager.setItem(STORAGE_KEYS.PASSWORD_ENABLED, 'true');
      await SecureStorageManager.setItem(STORAGE_KEYS.HAS_SECURITY, 'true');
    } catch (error) {
      console.error('Error setting password hash:', error);
    }
  };

  const clearPasswordHash = async () => {
    try {
      setPasswordHashState(null);
      await SecureStorageManager.deleteItem(STORAGE_KEYS.PASSWORD_HASH);
      setPasswordEnabledState(false);
      await SecureStorageManager.setItem(STORAGE_KEYS.PASSWORD_ENABLED, 'false');
      
      // Update hasSecurity: false only if passcode is also disabled
      if (!passcodeEnabled) {
        setHasSecurityState(false);
        await SecureStorageManager.setItem(STORAGE_KEYS.HAS_SECURITY, 'false');
      }
    } catch (error) {
      console.error('Error clearing password hash:', error);
    }
  };

  const setPasscodeHash = async (hash: string) => {
    try {
      setPasscodeHashState(hash);
      setPasscodeEnabledState(true);
      setHasSecurityState(true);
      await SecureStorageManager.setItem(STORAGE_KEYS.PASSCODE_HASH, hash);
      await SecureStorageManager.setItem(STORAGE_KEYS.PASSCODE_ENABLED, 'true');
      await SecureStorageManager.setItem(STORAGE_KEYS.HAS_SECURITY, 'true');
    } catch (error) {
      console.error('Error setting passcode hash:', error);
    }
  };

  const clearPasscodeHash = async () => {
    try {
      setPasscodeHashState(null);
      await SecureStorageManager.deleteItem(STORAGE_KEYS.PASSCODE_HASH);
      setPasscodeEnabledState(false);
      await SecureStorageManager.setItem(STORAGE_KEYS.PASSCODE_ENABLED, 'false');
      
      // Update hasSecurity: false only if password is also disabled
      if (!passwordEnabled) {
        setHasSecurityState(false);
        await SecureStorageManager.setItem(STORAGE_KEYS.HAS_SECURITY, 'false');
      }
    } catch (error) {
      console.error('Error clearing passcode hash:', error);
    }
  };

  const setPasscodeLength = async (length: 4 | 6) => {
    try {
      setPasscodeLengthState(length);
      await SecureStorageManager.setItem(STORAGE_KEYS.PASSCODE_LENGTH, length.toString());
    } catch (error) {
      console.error('Error setting passcode length:', error);
    }
  };

  const setAuthMethod = async (method: 'password' | 'passcode' | 'both' | 'none') => {
    try {
      setAuthMethodState(method);
      await SecureStorageManager.setItem(STORAGE_KEYS.AUTH_METHOD, method);

      // Sync passcodeEnabled and passwordEnabled based on authMethod
      const isPasscodeActive = method === 'passcode' || method === 'both';
      const isPasswordActive = method === 'password' || method === 'both';

      if (isPasscodeActive !== passcodeEnabled) {
        setPasscodeEnabledState(isPasscodeActive);
        await SecureStorageManager.setItem(STORAGE_KEYS.PASSCODE_ENABLED, isPasscodeActive.toString());
      }

      if (isPasswordActive !== passwordEnabled) {
        setPasswordEnabledState(isPasswordActive);
        await SecureStorageManager.setItem(STORAGE_KEYS.PASSWORD_ENABLED, isPasswordActive.toString());
      }

      // Sync hasSecurity: true if any method is active, false if none
      const shouldHaveSecurity = method !== 'none';
      if (shouldHaveSecurity !== hasSecurity) {
        setHasSecurityState(shouldHaveSecurity);
        await SecureStorageManager.setItem(STORAGE_KEYS.HAS_SECURITY, shouldHaveSecurity.toString());
      }
    } catch (error) {
      console.error('Error setting auth method:', error);
    }
  };

  const setRemindDaily = async (remind: boolean) => {
    try {
      setRemindDailyState(remind);
      await SecureStorageManager.setItem(STORAGE_KEYS.REMIND_DAILY, remind.toString());
    } catch (error) {
      console.error('Error setting remind daily:', error);
    }
  };

  const setReminderTime = async (time: string) => {
    try {
      // Validate time format
      if (!time || typeof time !== 'string') {
        console.error('Invalid time format:', time);
        return;
      }

      // Parse time (format: "HH:MM AM/PM" or "HH:MM")
      let normalizedTime = time;
      
      // If format is "HH:MM AM/PM", keep as is
      // If format is "HH:MM" (24-hour), convert to 12-hour AM/PM format
      if (time.includes(':') && !time.includes(' ')) {
        const [hourStr, minuteStr] = time.split(':');
        const hour = parseInt(hourStr);
        const minute = minuteStr;
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        normalizedTime = `${hour12.toString().padStart(2, '0')}:${minute} ${period}`;
      }

      console.log('[Preferences] Setting reminder time:', normalizedTime);
      
      // Update local state
      setReminderTimeState(normalizedTime);
      
      // Persist to SecureStore
      await SecureStorageManager.setItem(STORAGE_KEYS.REMINDER_TIME, normalizedTime);
      
      // TODO: Sync with Supabase when user context is available
      // This will be handled by the NotificationsContext/dailyReminderJob
      console.log('[Preferences] Reminder time saved to SecureStore:', normalizedTime);
    } catch (error) {
      console.error('Error setting reminder time:', error);
    }
  };

  const setSendCrashStats = async (send: boolean) => {
    try {
      setSendCrashStatsState(send);
      await SecureStorageManager.setItem(STORAGE_KEYS.SEND_CRASH_STATS, send.toString());
    } catch (error) {
      console.error('Error setting send crash stats:', error);
    }
  };

  const setBudgetAlerts = async (enabled: boolean) => {
    try {
      setBudgetAlertsState(enabled);
      await SecureStorageManager.setItem(STORAGE_KEYS.BUDGET_ALERTS, enabled.toString());
      console.log('[Preferences] Budget alerts set to:', enabled);
    } catch (error) {
      console.error('Error setting budget alerts:', error);
    }
  };

  const setLowBalanceAlerts = async (enabled: boolean) => {
    try {
      setLowBalanceAlertsState(enabled);
      await SecureStorageManager.setItem(STORAGE_KEYS.LOW_BALANCE_ALERTS, enabled.toString());
      console.log('[Preferences] Low balance alerts set to:', enabled);
    } catch (error) {
      console.error('Error setting low balance alerts:', error);
    }
  };

  const setEmailNotifications = async (enabled: boolean) => {
    try {
      setEmailNotificationsState(enabled);
      await SecureStorageManager.setItem(STORAGE_KEYS.EMAIL_NOTIFICATIONS, enabled.toString());
      console.log('[Preferences] Email notifications set to:', enabled);
    } catch (error) {
      console.error('Error setting email notifications:', error);
    }
  };

  const setPushNotifications = async (enabled: boolean) => {
    try {
      setPushNotificationsState(enabled);
      await SecureStorageManager.setItem(STORAGE_KEYS.PUSH_NOTIFICATIONS, enabled.toString());
      console.log('[Preferences] Push notifications set to:', enabled);
    } catch (error) {
      console.error('Error setting push notifications:', error);
    }
  };

  const setAutoSync = async (enabled: boolean) => {
    try {
      setAutoSyncState(enabled);
      await SecureStorageManager.setItem(STORAGE_KEYS.AUTO_SYNC, enabled.toString());
      console.log('[Preferences] Auto sync set to:', enabled);
    } catch (error) {
      console.error('Error setting auto sync:', error);
    }
  };

  const setAutoBackup = async (enabled: boolean) => {
    try {
      setAutoBackupState(enabled);
      await SecureStorageManager.setItem(STORAGE_KEYS.AUTO_BACKUP, enabled.toString());
      console.log('[Preferences] Auto backup set to:', enabled);
    } catch (error) {
      console.error('Error setting auto backup:', error);
    }
  };

  const setDataRetentionDays = async (days: number) => {
    try {
      setDataRetentionDaysState(days);
      await SecureStorageManager.setItem(STORAGE_KEYS.DATA_RETENTION_DAYS, days.toString());
      console.log('[Preferences] Data retention days set to:', days);
    } catch (error) {
      console.error('Error setting data retention days:', error);
    }
  };

  const setExportFormat = async (format: 'csv' | 'json') => {
    try {
      setExportFormatState(format);
      await SecureStorageManager.setItem(STORAGE_KEYS.EXPORT_FORMAT, format);
      console.log('[Preferences] Export format set to:', format);
    } catch (error) {
      console.error('Error setting export format:', error);
    }
  };

  const value: PreferencesContextType = {
    theme,
    setTheme,
    uiMode,
    setUIMode,
    currencySign,
    setCurrencySign,
    currencyPosition,
    setCurrencyPosition,
    decimalPlaces,
    setDecimalPlaces,
    hasSecurity,
    passcodeEnabled,
    setPasscodeEnabled,
    passcodeHash,
    setPasscodeHash,
    clearPasscodeHash,
    passcodeLength,
    setPasscodeLength,
    passwordEnabled,
    setPasswordEnabled,
    passwordHash,
    setPasswordHash,
    clearPasswordHash,
    authMethod,
    setAuthMethod,
    remindDaily,
    setRemindDaily,
    reminderTime,
    setReminderTime,
    budgetAlerts,
    setBudgetAlerts,
    lowBalanceAlerts,
    setLowBalanceAlerts,
    emailNotifications,
    setEmailNotifications,
    pushNotifications,
    setPushNotifications,
    autoSync,
    setAutoSync,
    autoBackup,
    setAutoBackup,
    dataRetentionDays,
    setDataRetentionDays,
    exportFormat,
    setExportFormat,
    sendCrashStats,
    setSendCrashStats,
    appVersion: '1.0.0',
    loading,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
