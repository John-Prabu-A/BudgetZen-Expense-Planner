# 📊 Phase 6 - Monitoring & Analytics Implementation

**Status:** Ready for Implementation  
**Last Updated:** December 21, 2025  
**Objective:** Build monitoring dashboard and analytics for notification system

---

## 📋 Overview

Phase 6 creates internal monitoring tools to track:

- ✅ Notification delivery metrics
- ✅ Job execution health
- ✅ Error tracking and alerts
- ✅ User engagement metrics
- ✅ System performance

---

## 🎯 Monitoring Components

### 1️⃣ Notification Delivery Dashboard

**File:** `app/(tabs)/admin/notifications-monitor.tsx` (or internal screen)

```typescript
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/Theme';

export default function NotificationMonitor() {
  const { colors } = useTheme();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Get delivery statistics for last 7 days
      const { data } = await supabase.from('notification_log').select(
        'notification_type, status',
        { count: 'exact' }
      ).gte('sent_at', sevenDaysAgo);

      // Calculate metrics
      const totalSent = data?.length || 0;
      const delivered = data?.filter(n => n.status === 'delivered').length || 0;
      const failed = data?.filter(n => n.status === 'failed').length || 0;

      const typeBreakdown: any = {};
      data?.forEach(n => {
        if (!typeBreakdown[n.notification_type]) {
          typeBreakdown[n.notification_type] = { sent: 0, delivered: 0, failed: 0 };
        }
        typeBreakdown[n.notification_type].sent++;
        if (n.status === 'delivered') typeBreakdown[n.notification_type].delivered++;
        if (n.status === 'failed') typeBreakdown[n.notification_type].failed++;
      });

      setMetrics({
        totalSent,
        delivered,
        failed,
        deliveryRate: totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(1) : 0,
        typeBreakdown,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <ActivityIndicator />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMetrics} />}
    >
      {/* Header */}
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 }}>
        📊 Notification Monitor
      </Text>

      {/* KPI Cards */}
      <MetricCard
        title="Total Sent (7d)"
        value={metrics.totalSent.toString()}
        icon="📤"
        colors={colors}
      />
      <MetricCard
        title="Delivered"
        value={metrics.delivered.toString()}
        icon="✅"
        colors={colors}
      />
      <MetricCard
        title="Failed"
        value={metrics.failed.toString()}
        icon="❌"
        colors={colors}
      />
      <MetricCard
        title="Delivery Rate"
        value={`${metrics.deliveryRate}%`}
        icon="📈"
        colors={colors}
      />

      {/* By Type Breakdown */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 12 }}>
        📋 By Notification Type
      </Text>

      {Object.entries(metrics.typeBreakdown).map(([type, stats]: any) => (
        <View
          key={type}
          style={{
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
            {formatNotificationType(type)}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <StatItem label="Sent" value={stats.sent} />
            <StatItem label="Delivered" value={stats.delivered} />
            <StatItem label="Failed" value={stats.failed} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function MetricCard({ title, value, icon, colors }: any) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
        {icon} {title}
      </Text>
      <Text style={{ fontSize: 32, fontWeight: '700', color: colors.accent }}>
        {value}
      </Text>
    </View>
  );
}

function StatItem({ label, value }: any) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>
        {value}
      </Text>
    </View>
  );
}

function formatNotificationType(type: string): string {
  const typeMap: any = {
    daily_reminder: '📝 Daily Reminder',
    budget_exceeded: '💸 Budget Alert',
    unusual_spending: '⚠️ Anomaly',
    weekly_summary: '📊 Weekly Summary',
    goal_progress: '🎯 Goal Progress',
    achievement: '🏆 Achievement',
  };
  return typeMap[type] || type;
}
```

---

### 2️⃣ Job Execution Monitor

**SQL Query:** Job execution health

```sql
-- Create view for job monitoring
CREATE OR REPLACE VIEW job_execution_summary AS
SELECT
  job_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_runs,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 1) as success_rate,
  AVG(EXTRACT(EPOCH FROM (executed_at - created_at))) as avg_duration_seconds,
  MAX(executed_at) as last_execution,
  MAX(error_message) as last_error
FROM job_execution_logs
WHERE executed_at > NOW() - INTERVAL '7 days'
GROUP BY job_name
ORDER BY MAX(executed_at) DESC;

-- Query to show recent failures
SELECT
  job_name,
  executed_at,
  error_message,
  notifications_sent,
  notifications_failed
FROM job_execution_logs
WHERE success = false
AND executed_at > NOW() - INTERVAL '24 hours'
ORDER BY executed_at DESC;
```

**Dashboard Component:**
```typescript
function JobExecutionMonitor() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const loadJobs = async () => {
      const { data } = await supabase.from('job_execution_summary').select('*');
      setJobs(data || []);
    };

    loadJobs();
    const interval = setInterval(loadJobs, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
        ⚙️ Job Execution Health
      </Text>

      {jobs.map(job => (
        <View key={job.job_name} style={{ marginBottom: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>
            {formatJobName(job.job_name)}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>Success Rate: {job.success_rate}%</Text>
            <Text>Last Run: {new Date(job.last_execution).toLocaleTimeString()}</Text>
          </View>
          {job.last_error && (
            <Text style={{ color: 'red', marginTop: 8, fontSize: 12 }}>
              Error: {job.last_error}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
```

---

### 3️⃣ Error Tracking & Alerts

**File:** `lib/notifications/errorTracking.ts`

```typescript
import { supabase } from '@/lib/supabase';

export interface ErrorAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export class ErrorTracker {
  private static instance: ErrorTracker;

  static getInstance() {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Log an error
   */
  async logError(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    context?: Record<string, any>
  ) {
    try {
      const { error } = await supabase
        .from('notification_errors')
        .insert({
          type,
          severity,
          message,
          context,
          timestamp: new Date(),
          resolved: false,
        });

      if (error) {
        console.error('❌ Error logging error:', error);
      } else {
        console.log(`📌 Error logged: [${severity.toUpperCase()}] ${type}`);

        // Send alert if critical
        if (severity === 'critical') {
          await this.sendAlert(type, message);
        }
      }
    } catch (err) {
      console.error('❌ Exception in logError:', err);
    }
  }

  /**
   * Send alert to team
   */
  private async sendAlert(type: string, message: string) {
    // Could integrate with Slack, email, or push notification
    console.warn(`🚨 CRITICAL ALERT: ${type} - ${message}`);
    
    // Example: Send to Slack webhook
    // await fetch(process.env.SLACK_WEBHOOK_URL, {
    //   method: 'POST',
    //   body: JSON.stringify({ text: `🚨 CRITICAL: ${message}` }),
    // });
  }

  /**
   * Get recent errors
   */
  async getRecentErrors(limit = 50) {
    const { data, error } = await supabase
      .from('notification_errors')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching errors:', error);
      return [];
    }

    return data as ErrorAlert[];
  }

  /**
   * Get errors by severity
   */
  async getErrorsBySeverity(severity: string) {
    const { data, error } = await supabase
      .from('notification_errors')
      .select('*')
      .eq('severity', severity)
      .eq('resolved', false)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ Error fetching errors:', error);
      return [];
    }

    return data as ErrorAlert[];
  }

  /**
   * Mark error as resolved
   */
  async markErrorResolved(errorId: string) {
    const { error } = await supabase
      .from('notification_errors')
      .update({ resolved: true })
      .eq('id', errorId);

    if (error) {
      console.error('❌ Error marking resolved:', error);
      return false;
    }

    return true;
  }
}

export const errorTracker = ErrorTracker.getInstance();
```

---

### 4️⃣ User Engagement Metrics

**SQL Queries for Analytics:**

```sql
-- Notifications per user (past 7 days)
SELECT
  user_id,
  COUNT(*) as notifications_received,
  COUNT(DISTINCT DATE(sent_at)) as days_with_notifications,
  COUNT(CASE WHEN status = 'opened' THEN 1 END) as notifications_opened,
  ROUND(100.0 * COUNT(CASE WHEN status = 'opened' THEN 1 END) / COUNT(*), 1) as open_rate
FROM notification_log
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY notifications_received DESC;

-- Most engaging notification types
SELECT
  notification_type,
  COUNT(*) as sent,
  COUNT(CASE WHEN status = 'opened' THEN 1 END) as opened,
  ROUND(100.0 * COUNT(CASE WHEN status = 'opened' THEN 1 END) / COUNT(*), 1) as open_rate,
  AVG(EXTRACT(EPOCH FROM (opened_at - delivered_at))) as avg_time_to_open_seconds
FROM notification_log
WHERE sent_at > NOW() - INTERVAL '7 days'
AND status = 'opened'
GROUP BY notification_type
ORDER BY open_rate DESC;

-- Push token health
SELECT
  platform,
  COUNT(*) as total_tokens,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as valid_tokens,
  SUM(CASE WHEN is_valid THEN 0 ELSE 1 END) as invalid_tokens,
  ROUND(100.0 * SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) / COUNT(*), 1) as validity_rate,
  MAX(last_verified_at) as last_verified
FROM push_tokens
GROUP BY platform;
```

---

### 5️⃣ System Health Dashboard

**File:** `app/(tabs)/admin/system-health.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function SystemHealthDashboard() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const checkHealth = async () => {
      // Check database connectivity
      const dbOk = await checkDatabase();
      
      // Check Edge Functions
      const functionsOk = await checkEdgeFunctions();
      
      // Check push service
      const pushOk = await checkPushService();
      
      // Check recent errors
      const criticalErrors = await checkCriticalErrors();

      setHealth({
        database: dbOk,
        functions: functionsOk,
        push: pushOk,
        criticalErrors,
        lastCheck: new Date(),
      });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (!health) return <ActivityIndicator />;

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 24 }}>
        🏥 System Health
      </Text>

      <HealthIndicator
        label="Database"
        status={health.database}
        lastCheck={health.lastCheck}
      />
      <HealthIndicator
        label="Edge Functions"
        status={health.functions}
        lastCheck={health.lastCheck}
      />
      <HealthIndicator
        label="Push Service"
        status={health.push}
        lastCheck={health.lastCheck}
      />

      {health.criticalErrors > 0 && (
        <View style={{ backgroundColor: '#ffebee', padding: 12, borderRadius: 8, marginTop: 16 }}>
          <Text style={{ color: '#c62828', fontWeight: '700' }}>
            🚨 {health.criticalErrors} Critical Errors
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function HealthIndicator({ label, status, lastCheck }: any) {
  const statusColor = status ? '#4caf50' : '#f44336';
  const statusText = status ? 'Healthy' : 'Down';

  return (
    <View style={{
      backgroundColor: '#f5f5f5',
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <View>
        <Text style={{ fontWeight: '700', marginBottom: 4 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: '#666' }}>
          Checked: {lastCheck?.toLocaleTimeString()}
        </Text>
      </View>
      <View style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: statusColor,
      }} />
    </View>
  );
}

async function checkDatabase() {
  try {
    const { error } = await supabase.from('notification_queue').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function checkEdgeFunctions() {
  try {
    const response = await supabase.functions.invoke('process-queue');
    return response.status === 200;
  } catch {
    return false;
  }
}

async function checkPushService() {
  // Basic check - can be enhanced
  return true;
}

async function checkCriticalErrors() {
  const { count } = await supabase
    .from('notification_errors')
    .select('*', { count: 'exact' })
    .eq('severity', 'critical')
    .eq('resolved', false);

  return count || 0;
}
```

---

## ✅ Phase 6 Completion Checklist

**Database:**
- [ ] `notification_errors` table created (if using)
- [ ] `job_execution_summary` view created
- [ ] Indexes added for monitoring queries

**Monitoring Dashboard:**
- [ ] Notification delivery monitor component created
- [ ] Job execution monitor implemented
- [ ] Error tracking system integrated
- [ ] Engagement metrics queries verified
- [ ] System health dashboard created

**Integration:**
- [ ] Monitor accessible from admin panel
- [ ] Real-time metrics updating
- [ ] Error alerts configured
- [ ] Critical errors trigger notifications to team

**Testing:**
- [ ] Dashboard loads without errors
- [ ] Metrics calculate correctly
- [ ] Refresh functionality works
- [ ] Can identify failed jobs/notifications

---

**Phase 6 Status:** Ready to implement! 🚀

Monitor your notification system's health in real-time!
