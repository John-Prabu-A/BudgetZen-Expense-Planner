/**
 * Test Notification Button Component
 * Use this to test push notifications in development
 * Remove before production!
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/notifications/NotificationService';
import { NotificationType } from '@/lib/notifications/types';
import { useAuth } from '@/context/Auth';

export default function TestNotificationButton() {
  const { user } = useAuth();
  const userId = user?.id;
  
  const [testStatus, setTestStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setTestStatus((prev) => `${prev}${message}\n`);
  };

  const handleLargeTransactionTest = async () => {
    if (!userId) {
      addLog('❌ User not logged in - cannot send notification');
      return;
    }
    setLoading(true);
    setTestStatus('');
    addLog('🧪 Testing Large Transaction Alert...');
    try {
      console.log('🧪 [TEST] Sending large transaction alert (₹15,000)');
      const result = await notificationService.sendWithSmartFilters(userId, {
        type: NotificationType.LARGE_TRANSACTION,
        title: '💰 Large transaction: ₹15,000',
        body: '[Food] Consider reviewing this spending.',
        data: {
          screen: 'records',
          category: 'Food',
        },
      });
      if (result.success) {
        addLog('✅ Alert sent successfully!');
        addLog(`📊 Notification ID: ${result.notificationId}`);
        addLog('📊 Check notification_analytics table in Supabase');
      } else {
        addLog(`❌ Failed to send: ${result.message}`);
      }
      console.log('✅ [TEST] Large transaction alert test complete');
    } catch (error) {
      addLog(`❌ Error: ${error}`);
      console.error('❌ [TEST] Large transaction test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetExceededTest = async () => {
    if (!userId) {
      addLog('❌ User not logged in - cannot send notification');
      return;
    }
    setLoading(true);
    setTestStatus('');
    addLog('🧪 Testing Budget Exceeded Alert...');
    try {
      console.log('🧪 [TEST] Sending budget exceeded alert');
      const result = await notificationService.sendWithSmartFilters(userId, {
        type: NotificationType.BUDGET_EXCEEDED,
        title: '❌ Budget exceeded: Shopping',
        body: 'You have exceeded by ₹100 (102%)',
        data: {
          screen: 'analysis',
          category: 'Shopping',
        },
      });
      if (result.success) {
        addLog('✅ Alert sent successfully!');
        addLog('📊 Budget exceeded test passed');
      } else {
        addLog(`❌ Failed to send: ${result.message}`);
      }
      console.log('✅ [TEST] Budget exceeded alert test complete');
    } catch (error) {
      addLog(`❌ Error: ${error}`);
      console.error('❌ [TEST] Budget exceeded test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnusualSpendingTest = async () => {
    if (!userId) {
      addLog('❌ User not logged in - cannot send notification');
      return;
    }
    setLoading(true);
    setTestStatus('');
    addLog('🧪 Testing Unusual Spending Alert...');
    try {
      console.log('🧪 [TEST] Sending unusual spending alert');
      const result = await notificationService.sendWithSmartFilters(userId, {
        type: NotificationType.UNUSUAL_SPENDING,
        title: '📈 Unusual spending: Coffee',
        body: '₹750 is 250% above your average',
        data: {
          screen: 'records',
          category: 'Coffee',
        },
      });
      if (result.success) {
        addLog('✅ Alert sent successfully!');
        addLog('📊 Unusual spending test passed');
      } else {
        addLog(`❌ Failed to send: ${result.message}`);
      }
      console.log('✅ [TEST] Unusual spending alert test complete');
    } catch (error) {
      addLog(`❌ Error: ${error}`);
      console.error('❌ [TEST] Unusual spending test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThrottlingTest = async () => {
    if (!userId) {
      addLog('❌ User not logged in - cannot send notification');
      return;
    }
    setLoading(true);
    setTestStatus('');
    addLog('🧪 Testing Throttling (Spam Prevention)...');
    addLog('First alert should send, second should be throttled');
    try {
      console.log('🧪 [TEST] Sending first alert');
      await notificationService.sendWithSmartFilters(userId, {
        type: NotificationType.LARGE_TRANSACTION,
        title: '💰 First large transaction',
        body: 'First alert test',
      });
      addLog('✅ First alert sent');
      addLog('⏳ Waiting 2 seconds before second alert...');

      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('🧪 [TEST] Sending second alert (should be throttled)');
      await notificationService.sendWithSmartFilters(userId, {
        type: NotificationType.LARGE_TRANSACTION,
        title: '💰 Second large transaction',
        body: 'Second alert test (may be throttled)',
      });
      addLog('⏹️ Second alert sent (or throttled - check console)');
      addLog('💡 If throttled: "⏭️ Notification throttled: large_transaction"');
      console.log('✅ [TEST] Throttling test complete');
    } catch (error) {
      addLog(`❌ Error: ${error}`);
      console.error('❌ [TEST] Throttling test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseCheck = async () => {
    setTestStatus('');
    addLog('📊 Database Check Instructions:');
    addLog('1. Open Supabase Dashboard');
    addLog('2. Go to Table Editor');
    addLog('3. Select "notification_analytics"');
    addLog('4. You should see entries with:');
    addLog('   - notification_type: large_transaction');
    addLog('   - sent_at: (timestamp)');
    addLog('   - user_id: (your user ID)');
    addLog('');
    addLog('To verify in SQL:');
    addLog('SELECT * FROM notification_analytics');
    addLog('ORDER BY sent_at DESC LIMIT 5;');
  };

  const handleCheckDatabase = async () => {
    setLoading(true);
    setTestStatus('');
    addLog('📊 Checking Database...');
    try {
      // Check notification_analytics
      const { data: analytics, error: analyticsError } = await supabase
        .from('notification_analytics')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(3);

      if (analyticsError) {
        addLog(`❌ Error reading notification_analytics: ${analyticsError.message}`);
      } else {
        addLog(`✅ notification_analytics: ${analytics?.length || 0} entries found`);
        if (analytics && analytics.length > 0) {
          addLog(`  Latest: ${analytics[0].notification_type}`);
          addLog(`  Sent at: ${analytics[0].sent_at}`);
        }
      }

      // Check job_execution_logs
      const { data: jobs, error: jobsError } = await supabase
        .from('job_execution_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(1);

      if (jobsError) {
        addLog(`ℹ️ job_execution_logs not ready yet (no jobs run)`);
      } else {
        addLog(`✅ job_execution_logs: ${jobs?.length || 0} entries found`);
        if (jobs && jobs.length > 0) {
          addLog(`  Latest job: ${jobs[0].job_name}`);
          addLog(`  Success: ${jobs[0].success}`);
        }
      }

      // Check notification_throttle
      const { data: throttle, error: throttleError } = await supabase
        .from('notification_throttle')
        .select('*')
        .limit(3);

      if (throttleError) {
        addLog(`ℹ️ notification_throttle: No entries yet`);
      } else {
        addLog(`✅ notification_throttle: ${throttle?.length || 0} entries found`);
      }
    } catch (error) {
      addLog(`❌ Database check failed: ${error}`);
      console.error('❌ [TEST] Database check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Notification Testing Panel</Text>
        <Text style={styles.subtitle}>Test push notifications in development</Text>
      </View>

      <ScrollView style={styles.buttonContainer}>
        {/* Real-Time Alert Tests */}
        <Text style={styles.sectionTitle}>Real-Time Alerts</Text>

        <TouchableOpacity
          style={[styles.button, styles.largeButton]}
          onPress={handleLargeTransactionTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>💰 Test Large Transaction (₹15K)</Text>
          <Text style={styles.buttonSubtext}>Trigger: Amount {'>='} ₹10,000</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.budgetButton]}
          onPress={handleBudgetExceededTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>💸 Test Budget Exceeded</Text>
          <Text style={styles.buttonSubtext}>Trigger: Spend {'>='} 100% budget</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.anomalyButton]}
          onPress={handleUnusualSpendingTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📈 Test Unusual Spending</Text>
          <Text style={styles.buttonSubtext}>Trigger: 2.5x above average</Text>
        </TouchableOpacity>

        {/* Smart Filter Tests */}
        <Text style={styles.sectionTitle}>Smart Filters</Text>

        <TouchableOpacity
          style={[styles.button, styles.throttleButton]}
          onPress={handleThrottlingTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🚫 Test Throttling (Spam Prevention)</Text>
          <Text style={styles.buttonSubtext}>Second alert should be blocked</Text>
        </TouchableOpacity>

        {/* Database Check */}
        <Text style={styles.sectionTitle}>Database Verification</Text>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={handleDatabaseCheck}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📊 Show Database Check Instructions</Text>
          <Text style={styles.buttonSubtext}>View how to verify in Supabase</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Status/Logs Section */}
      {testStatus ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>📋 Test Output:</Text>
          <Text style={styles.statusText}>{testStatus}</Text>
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {loading ? '⏳ Test in progress...' : '✅ Ready to test'}
        </Text>
        <Text style={styles.warningText}>⚠️ Remove this component before production!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6C5CE7',
    padding: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#DDD',
  },
  buttonContainer: {
    flex: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
  },
  largeButton: {
    backgroundColor: '#FF6B6B',
  },
  budgetButton: {
    backgroundColor: '#FF9D3D',
  },
  anomalyButton: {
    backgroundColor: '#00B894',
  },
  throttleButton: {
    backgroundColor: '#A29BFE',
  },
  infoButton: {
    backgroundColor: '#0984E3',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  statusContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    padding: 12,
    maxHeight: 150,
  },
  statusTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 11,
    color: '#555',
    lineHeight: 16,
    fontFamily: 'Courier New',
  },
  footer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE082',
  },
  footerText: {
    color: '#856404',
    fontSize: 12,
    marginBottom: 4,
  },
  warningText: {
    color: '#D32F2F',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
