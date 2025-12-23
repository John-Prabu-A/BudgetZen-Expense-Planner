import { useTheme } from '@/context/Theme';
import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';

interface NotificationMetrics {
  totalSent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  byType: Record<string, { sent: number; delivered: number; failed: number }>;
}

export default function NotificationsMonitor() {
  const { colors } = useTheme();
  const [metrics, setMetrics] = useState<NotificationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get overall stats
      const { data: logs, error } = await supabase
        .from('notification_log')
        .select('id, notification_type, status')
        .gte('sent_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      const totalSent = logs?.length || 0;
      const delivered = logs?.filter((n: any) => n.status === 'delivered').length || 0;
      const failed = logs?.filter((n: any) => n.status === 'failed').length || 0;

      // Calculate by type
      const byType: Record<string, any> = {};
      logs?.forEach((log: any) => {
        if (!byType[log.notification_type]) {
          byType[log.notification_type] = { sent: 0, delivered: 0, failed: 0 };
        }
        byType[log.notification_type].sent++;
        if (log.status === 'delivered') byType[log.notification_type].delivered++;
        if (log.status === 'failed') byType[log.notification_type].failed++;
      });

      setMetrics({
        totalSent,
        delivered,
        failed,
        deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
        byType,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadMetrics} />}
    >
      <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 24 }}>
        📊 Notification Monitor
      </Text>

      {/* KPI Cards */}
      <MetricCard
        title="Total Sent (7d)"
        value={metrics?.totalSent || 0}
        icon="📨"
        colors={colors}
      />
      <MetricCard
        title="Delivered"
        value={metrics?.delivered || 0}
        icon="✅"
        colors={colors}
      />
      <MetricCard
        title="Failed"
        value={metrics?.failed || 0}
        icon="❌"
        colors={colors}
      />
      <MetricCard
        title="Delivery Rate"
        value={`${(metrics?.deliveryRate || 0).toFixed(1)}%`}
        icon="📈"
        colors={colors}
      />

      {/* By Type Breakdown */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 12 }}>
        📋 By Notification Type
      </Text>

      {metrics && Object.entries(metrics.byType).map(([type, stats]: [string, any]) => (
        <View
          key={type}
          style={{
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: colors.accent,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
            {formatNotificationType(type)}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <StatItem label="Sent" value={stats.sent} />
            <StatItem label="Delivered" value={stats.delivered} />
            <StatItem label="Failed" value={stats.failed} />
            <StatItem
              label="Rate"
              value={`${stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(0) : 0}%`}
            />
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MetricCard({
  title,
  value,
  icon,
  colors,
}: {
  title: string;
  value: number | string;
  icon: string;
  colors: any;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
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

function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#000' }}>
        {value}
      </Text>
    </View>
  );
}

function formatNotificationType(type: string): string {
  const typeMap: Record<string, string> = {
    daily_reminder: '📝 Daily Reminder',
    budget_exceeded: '💸 Budget Alert',
    unusual_spending: '⚠️ Anomaly',
    weekly_summary: '📊 Weekly Summary',
    goal_progress: '🎯 Goal Progress',
    achievement: '🏆 Achievement',
    budget_warning: '💰 Budget Warning',
    daily_anomaly: '📊 Daily Anomaly',
    budget_compliance: '✅ Budget Compliance',
  };
  return typeMap[type] || type.replace(/_/g, ' ');
}
