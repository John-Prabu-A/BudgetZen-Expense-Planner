import { AnimatedButton } from '@/components/AnimatedButton';
import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { notificationService } from '@/lib/notifications/NotificationService';
import { NotificationType } from '@/lib/notifications/types';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function NotificationTester() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<string>('Unknown');

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [logEntry, ...prev.slice(0, 19)]);
    console.log(logEntry);
  };

  // Check permissions on load
  useEffect(() => {
    checkPermissions();
    setupNotificationListeners();
  }, []);

  const checkPermissions = async () => {
    try {
      addLog('🔍 Checking notification permissions...');
      const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
      setPermissionStatus(`Granted: ${granted}, CanAsk: ${canAskAgain}`);
      addLog(`✅ Permission status: Granted=${granted}, CanAsk=${canAskAgain}`);
    } catch (error) {
      addLog(`❌ Error checking permissions: ${error}`);
    }
  };

  const requestPermissions = async () => {
    try {
      setLoading(true);
      addLog('📋 Requesting notification permissions...');
      const result = await Notifications.requestPermissionsAsync();
      setPermissionStatus(`Granted: ${result.granted}, CanAsk: ${result.canAskAgain}`);
      addLog(`✅ Permission result: ${JSON.stringify(result)}`);
      Alert.alert('Permissions', `Granted: ${result.granted}`);
    } catch (error) {
      addLog(`❌ Error requesting permissions: ${error}`);
      Alert.alert('Error', 'Failed to request permissions');
    } finally {
      setLoading(false);
    }
  };

  const getPushToken = async () => {
    try {
      setLoading(true);
      addLog('📱 Getting push token...');

      // Check permissions first
      const perms = await Notifications.getPermissionsAsync();
      if (!perms.granted) {
        addLog('⚠️ Permissions not granted, requesting...');
        const reqResult = await Notifications.requestPermissionsAsync();
        if (!reqResult.granted) {
          Alert.alert('Error', 'Notification permissions required');
          return;
        }
      }

      // Get the token
      const tokenResponse = await Notifications.getDevicePushTokenAsync();
      const token = tokenResponse.data.data;
      
      setPushToken(token);
      addLog(`✅ Push token obtained: ${token.substring(0, 40)}...`);
      Alert.alert('Push Token', `${token.substring(0, 60)}...\n\nFull token copied to logs`);
    } catch (error) {
      addLog(`❌ Error getting push token: ${error}`);
      Alert.alert('Error', `Failed to get push token: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testImmediateNotification = async () => {
    try {
      setLoading(true);
      addLog('🧪 Sending immediate notification...');

      const result = await notificationService.sendNotification({
        type: NotificationType.ACHIEVEMENT,
        title: '🎉 Test Notification',
        body: `Test from ${Platform.OS} at ${new Date().toLocaleTimeString()}`,
        data: { 
          test: 'true', 
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
        },
      });

      addLog(`✅ Notification sent successfully: ${result.notificationId}`);
      Alert.alert('Success', `Notification sent!\nID: ${result.notificationId}`);
    } catch (error) {
      addLog(`❌ Error sending notification: ${error}`);
      Alert.alert('Error', `Failed to send notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testScheduledNotification = async () => {
    try {
      setLoading(true);
      addLog('⏱️ Scheduling notification for 5 seconds from now...');

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Scheduled Test',
          body: `Scheduled notification test (${Platform.OS})`,
          data: { 
            test: 'true', 
            scheduled: 'true',
            platform: Platform.OS,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
        },
      });

      addLog(`✅ Notification scheduled: ${notificationId}`);
      Alert.alert('Scheduled', `Notification will appear in 5 seconds\nID: ${notificationId}`);
    } catch (error) {
      addLog(`❌ Error scheduling notification: ${error}`);
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testBudgetAlert = async () => {
    try {
      setLoading(true);
      addLog('💰 Sending budget alert test...');

      const result = await notificationService.sendNotification({
        type: NotificationType.BUDGET_WARNING,
        title: '⚠️ Budget Alert',
        body: 'You have spent 85% of your monthly budget!',
        data: {
          category: 'Food',
          spent: '4250',
          budget: '5000',
          percentage: '85',
        },
      });

      addLog(`✅ Budget alert sent: ${result.notificationId}`);
      Alert.alert('Success', `Budget alert sent!\nID: ${result.notificationId}`);
    } catch (error) {
      addLog(`❌ Error sending budget alert: ${error}`);
      Alert.alert('Error', `Failed to send budget alert: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const setupNotificationListeners = () => {
    addLog('🔔 Setting up notification listeners...');

    // Listener for notifications received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      addLog(`🔔 Notification received (foreground):`);
      addLog(`   Title: ${notification.request.content.title}`);
      addLog(`   Body: ${notification.request.content.body}`);
    });

    // Listener for when user taps on notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      addLog(`👆 Notification tapped:`);
      addLog(`   Action: ${response.actionIdentifier}`);
      addLog(`   Screen: ${response.notification.request.content.data?.screen || 'home'}`);
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🗑️ Logs cleared');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    section: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    infoText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
      fontFamily: 'monospace',
      lineHeight: 18,
    },
    infoLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      marginTop: 8,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    button: {
      marginBottom: 10,
    },
    logContainer: {
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 250,
      marginBottom: 10,
      overflow: 'hidden',
    },
    logContent: {
      padding: 12,
    },
    logEntry: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'monospace',
      lineHeight: 14,
      marginBottom: 4,
    },
    platformBadge: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginBottom: 10,
    },
    platformText: {
      color: colors.textInverse,
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: 0.3,
    },
    statusBad: {
      color: colors.danger,
      fontWeight: '600',
    },
    statusGood: {
      color: colors.income,
      fontWeight: '600',
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* Platform Info */}
      <View style={styles.section}>
        <View style={styles.platformBadge}>
          <Text style={styles.platformText}>
            {Platform.OS === 'ios' ? '🍎 iOS' : '🤖 Android'} • Expo Go
          </Text>
        </View>
        <Text style={styles.infoLabel}>User Info</Text>
        <Text style={styles.infoText}>ID: {user?.id?.substring(0, 16) || 'Not logged in'}...</Text>
      </View>

      {/* Permissions & Token */}
      <View style={styles.section}>
        <Text style={styles.title}>📱 Permissions & Push Token</Text>
        
        <Text style={styles.infoLabel}>Permission Status</Text>
        <Text style={[styles.infoText, permissionStatus.includes('true') ? styles.statusGood : styles.statusBad]}>
          {permissionStatus}
        </Text>

        <AnimatedButton
          onPress={checkPermissions}
          style={styles.button}
        >
          Check Permissions
        </AnimatedButton>

        <AnimatedButton
          onPress={requestPermissions}
          style={styles.button}
        >
          Request Permissions
        </AnimatedButton>

        <AnimatedButton
          onPress={getPushToken}
          style={styles.button}
        >
          Get Push Token
        </AnimatedButton>

        {pushToken && (
          <>
            <Text style={styles.infoLabel}>Current Push Token</Text>
            <Text style={styles.infoText}>{pushToken.substring(0, 50)}...</Text>
          </>
        )}
      </View>

      {/* Immediate Notifications */}
      <View style={styles.section}>
        <Text style={styles.title}>🧪 Immediate Notifications</Text>
        <Text style={styles.infoText}>
          Sends a test notification immediately. Should appear in foreground or notification center if app is in background.
        </Text>
        <AnimatedButton
          onPress={testImmediateNotification}
          style={styles.button}
        >
          Send Test Notification
        </AnimatedButton>
      </View>

      {/* Scheduled Notifications */}
      <View style={styles.section}>
        <Text style={styles.title}>⏱️ Scheduled Notifications</Text>
        <Text style={styles.infoText}>
          Schedules a notification to fire 5 seconds from now. Good for testing background behavior.
        </Text>
        <AnimatedButton
          onPress={testScheduledNotification}
          style={styles.button}
        >
          Schedule Test (5 seconds)
        </AnimatedButton>
      </View>

      {/* Budget Alert Test */}
      <View style={styles.section}>
        <Text style={styles.title}>💰 Test Budget Alert</Text>
        <Text style={styles.infoText}>
          Sends a budget warning notification with category and spending details.
        </Text>
        <AnimatedButton
          onPress={testBudgetAlert}
          style={styles.button}
        >
          Send Budget Alert
        </AnimatedButton>
      </View>

      {/* Logs */}
      <View style={styles.section}>
        <Text style={styles.title}>📋 Event Logs</Text>
        <Text style={styles.infoText}>
          Real-time logs of all notification events and errors
        </Text>
        <View style={styles.logContainer}>
          <ScrollView style={styles.logContent} scrollEnabled nestedScrollEnabled>
            {logs.length === 0 ? (
              <Text style={styles.logEntry}>Logs will appear here...</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logEntry}>
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
        <AnimatedButton
          onPress={clearLogs}
          style={styles.button}
        >
          Clear Logs
        </AnimatedButton>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.title}>📖 Instructions</Text>
        <Text style={styles.infoText}>
          1. Grant notification permissions when prompted{'\n'}
          2. Get your push token{'\n'}
          3. Test immediate notifications{'\n'}
          4. Test scheduled notifications{'\n'}
          5. Check logs for any errors{'\n'}
          6. Monitor console output (Cmd+D iOS, Shake Android)
        </Text>
      </View>
    </ScrollView>
  );
}
