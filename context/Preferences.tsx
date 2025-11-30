import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [sendCrashStats, setSendCrashStatsState] = useState<boolean>(DEFAULT_VALUES.sendCrashStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const storedTheme = (await SecureStore.getItemAsync(STORAGE_KEYS.THEME)) as Theme;
      const storedUIMode = (await SecureStore.getItemAsync(STORAGE_KEYS.UI_MODE)) as UIMode;
      const storedCurrencySign = (await SecureStore.getItemAsync(STORAGE_KEYS.CURRENCY_SIGN)) as CurrencySign;
      const storedCurrencyPosition = (await SecureStore.getItemAsync(STORAGE_KEYS.CURRENCY_POSITION)) as CurrencyPosition;
      const storedDecimalPlaces = (await SecureStore.getItemAsync(STORAGE_KEYS.DECIMAL_PLACES)) as unknown as DecimalPlaces;
      const storedHasSecurity = (await SecureStore.getItemAsync(STORAGE_KEYS.HAS_SECURITY)) === 'true';
      const storedPasscodeEnabled = (await SecureStore.getItemAsync(STORAGE_KEYS.PASSCODE_ENABLED)) === 'true';
      const storedPasscodeHash = await SecureStore.getItemAsync(STORAGE_KEYS.PASSCODE_HASH);
      const storedPasscodeLength = (await SecureStore.getItemAsync(STORAGE_KEYS.PASSCODE_LENGTH)) as '4' | '6' | null;
      const storedPasswordEnabled = (await SecureStore.getItemAsync(STORAGE_KEYS.PASSWORD_ENABLED)) === 'true';
      const storedPasswordHash = await SecureStore.getItemAsync(STORAGE_KEYS.PASSWORD_HASH);
      const storedAuthMethod = (await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_METHOD)) as 'password' | 'passcode' | 'both' | 'none' | null;
      const storedRemindDaily = (await SecureStore.getItemAsync(STORAGE_KEYS.REMIND_DAILY)) !== 'false';
      const storedReminderTime = (await SecureStore.getItemAsync(STORAGE_KEYS.REMINDER_TIME)) || DEFAULT_VALUES.reminderTime;
      const storedSendCrashStats = (await SecureStore.getItemAsync(STORAGE_KEYS.SEND_CRASH_STATS)) !== 'false';

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
      await SecureStore.setItemAsync(STORAGE_KEYS.THEME, newTheme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  const setUIMode = async (newMode: UIMode) => {
    try {
      setUIModeState(newMode);
      await SecureStore.setItemAsync(STORAGE_KEYS.UI_MODE, newMode);
    } catch (error) {
      console.error('Error setting UI mode:', error);
    }
  };

  const setCurrencySign = async (newSign: CurrencySign) => {
    try {
      setCurrencySignState(newSign);
      await SecureStore.setItemAsync(STORAGE_KEYS.CURRENCY_SIGN, newSign);
    } catch (error) {
      console.error('Error setting currency sign:', error);
    }
  };

  const setCurrencyPosition = async (newPosition: CurrencyPosition) => {
    try {
      setCurrencyPositionState(newPosition);
      await SecureStore.setItemAsync(STORAGE_KEYS.CURRENCY_POSITION, newPosition);
    } catch (error) {
      console.error('Error setting currency position:', error);
    }
  };

  const setDecimalPlaces = async (newPlaces: DecimalPlaces) => {
    try {
      setDecimalPlacesState(newPlaces);
      await SecureStore.setItemAsync(STORAGE_KEYS.DECIMAL_PLACES, newPlaces.toString());
    } catch (error) {
      console.error('Error setting decimal places:', error);
    }
  };

  const setPasscodeEnabled = async (enabled: boolean) => {
    try {
      setPasscodeEnabledState(enabled);
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSCODE_ENABLED, enabled.toString());
    } catch (error) {
      console.error('Error setting passcode enabled:', error);
    }
  };

  const setPasswordEnabled = async (enabled: boolean) => {
    try {
      setPasswordEnabledState(enabled);
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_ENABLED, enabled.toString());
    } catch (error) {
      console.error('Error setting password enabled:', error);
    }
  };

  const setPasswordHash = async (hash: string) => {
    try {
      setPasswordHashState(hash);
      setPasswordEnabledState(true);
      setHasSecurityState(true);
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_HASH, hash);
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_ENABLED, 'true');
      await SecureStore.setItemAsync(STORAGE_KEYS.HAS_SECURITY, 'true');
    } catch (error) {
      console.error('Error setting password hash:', error);
    }
  };

  const clearPasswordHash = async () => {
    try {
      setPasswordHashState(null);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD_HASH);
      setPasswordEnabledState(false);
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_ENABLED, 'false');
      
      // Update hasSecurity: false only if passcode is also disabled
      if (!passcodeEnabled) {
        setHasSecurityState(false);
        await SecureStore.setItemAsync(STORAGE_KEYS.HAS_SECURITY, 'false');
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
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSCODE_HASH, hash);
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSCODE_ENABLED, 'true');
      await SecureStore.setItemAsync(STORAGE_KEYS.HAS_SECURITY, 'true');
    } catch (error) {
      console.error('Error setting passcode hash:', error);
    }
  };

  const clearPasscodeHash = async () => {
    try {
      setPasscodeHashState(null);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSCODE_HASH);
      setPasscodeEnabledState(false);
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSCODE_ENABLED, 'false');
      
      // Update hasSecurity: false only if password is also disabled
      if (!passwordEnabled) {
        setHasSecurityState(false);
        await SecureStore.setItemAsync(STORAGE_KEYS.HAS_SECURITY, 'false');
      }
    } catch (error) {
      console.error('Error clearing passcode hash:', error);
    }
  };

  const setPasscodeLength = async (length: 4 | 6) => {
    try {
      setPasscodeLengthState(length);
      await SecureStore.setItemAsync(STORAGE_KEYS.PASSCODE_LENGTH, length.toString());
    } catch (error) {
      console.error('Error setting passcode length:', error);
    }
  };

  const setAuthMethod = async (method: 'password' | 'passcode' | 'both' | 'none') => {
    try {
      setAuthMethodState(method);
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_METHOD, method);

      // Sync passcodeEnabled and passwordEnabled based on authMethod
      const isPasscodeActive = method === 'passcode' || method === 'both';
      const isPasswordActive = method === 'password' || method === 'both';

      if (isPasscodeActive !== passcodeEnabled) {
        setPasscodeEnabledState(isPasscodeActive);
        await SecureStore.setItemAsync(STORAGE_KEYS.PASSCODE_ENABLED, isPasscodeActive.toString());
      }

      if (isPasswordActive !== passwordEnabled) {
        setPasswordEnabledState(isPasswordActive);
        await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD_ENABLED, isPasswordActive.toString());
      }

      // Sync hasSecurity: true if any method is active, false if none
      const shouldHaveSecurity = method !== 'none';
      if (shouldHaveSecurity !== hasSecurity) {
        setHasSecurityState(shouldHaveSecurity);
        await SecureStore.setItemAsync(STORAGE_KEYS.HAS_SECURITY, shouldHaveSecurity.toString());
      }
    } catch (error) {
      console.error('Error setting auth method:', error);
    }
  };

  const setRemindDaily = async (remind: boolean) => {
    try {
      setRemindDailyState(remind);
      await SecureStore.setItemAsync(STORAGE_KEYS.REMIND_DAILY, remind.toString());
    } catch (error) {
      console.error('Error setting remind daily:', error);
    }
  };

  const setReminderTime = async (time: string) => {
    try {
      setReminderTimeState(time);
      await SecureStore.setItemAsync(STORAGE_KEYS.REMINDER_TIME, time);
    } catch (error) {
      console.error('Error setting reminder time:', error);
    }
  };

  const setSendCrashStats = async (send: boolean) => {
    try {
      setSendCrashStatsState(send);
      await SecureStore.setItemAsync(STORAGE_KEYS.SEND_CRASH_STATS, send.toString());
    } catch (error) {
      console.error('Error setting send crash stats:', error);
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
