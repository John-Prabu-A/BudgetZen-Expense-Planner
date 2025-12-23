/**
 * Notification Queue Manager
 * 
 * Manages notification queue operations:
 * - Queuing notifications with deduplication
 * - Real-time listening for new notifications
 * - Sending notifications via backend
 * - Retry logic for failed sends
 */

import { supabase } from '@/lib/supabase';

export interface QueuedNotification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  created_at: string;
  scheduled_for: string;
}

export class NotificationQueueManager {
  private static instance: NotificationQueueManager;

  private constructor() {}

  static getInstance(): NotificationQueueManager {
    if (!NotificationQueueManager.instance) {
      NotificationQueueManager.instance = new NotificationQueueManager();
    }
    return NotificationQueueManager.instance;
  }

  /**
   * Queue a notification for delivery
   * Uses idempotency key to prevent duplicates
   */
  async queueNotification(
    userId: string,
    notificationType: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    scheduledFor?: Date,
    idempotencyKey?: string
  ): Promise<{ success: boolean; id?: string; message: string }> {
    try {
      const scheduledForTime = scheduledFor || new Date();

      // Generate idempotency key if not provided
      const finalIdempotencyKey =
        idempotencyKey ||
        `${userId}_${notificationType}_${Date.now()}`;

      // Call Supabase RPC to insert with deduplication
      const { data: queueId, error } = await supabase.rpc('queue_notification', {
        p_user_id: userId,
        p_notification_type: notificationType,
        p_title: title,
        p_body: body,
        p_data: data || null,
        p_scheduled_for: scheduledForTime.toISOString(),
        p_idempotency_key: finalIdempotencyKey,
      });

      if (error) {
        console.error('❌ Error queuing notification:', error);
        return {
          success: false,
          message: `Failed to queue notification: ${error.message}`,
        };
      }

      console.log(`✅ Queued notification: ${notificationType} (ID: ${queueId})`);

      return {
        success: true,
        id: queueId,
        message: 'Notification queued successfully',
      };
    } catch (error) {
      console.error('❌ Error in queueNotification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's notification queue
   */
  async getQueue(
    userId: string,
    limit = 50
  ): Promise<QueuedNotification[] | null> {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching queue:', error);
        return null;
      }

      return data as QueuedNotification[];
    } catch (error) {
      console.error('❌ Error in getQueue:', error);
      return null;
    }
  }

  /**
   * Get pending notifications
   */
  async getPending(userId: string): Promise<QueuedNotification[] | null> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('❌ Error fetching pending:', error);
        return null;
      }

      return data as QueuedNotification[];
    } catch (error) {
      console.error('❌ Error in getPending:', error);
      return null;
    }
  }

  /**
   * Send pending notifications from queue
   * Called when app opens or periodically
   */
  async sendPending(userId: string): Promise<{
    sent: number;
    failed: number;
  }> {
    try {
      const pending = await this.getPending(userId);

      if (!pending || pending.length === 0) {
        console.log('📊 No pending notifications');
        return { sent: 0, failed: 0 };
      }

      console.log(`📤 Sending ${pending.length} pending notifications`);

      let sent = 0;
      let failed = 0;

      for (const notification of pending) {
        const result = await this.sendNotification(notification);

        if (result) {
          sent++;
        } else {
          failed++;
        }
      }

      return { sent, failed };
    } catch (error) {
      console.error('❌ Error in sendPending:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Send individual notification from queue
   */
  private async sendNotification(notification: QueuedNotification): Promise<boolean> {
    try {
      // Call backend edge function to send
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
          },
          body: JSON.stringify({
            user_id: notification.user_id,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            notification_type: notification.notification_type,
            queue_id: notification.id,
          }),
        }
      );

      if (response.ok) {
        console.log(`✅ Sent: ${notification.notification_type}`);
        return true;
      } else {
        console.error(`❌ Failed to send: ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return false;
    }
  }

  /**
   * Listen for new notifications in real-time
   * Returns unsubscribe function
   */
  subscribeToQueue(
    userId: string,
    onNotification: (notification: QueuedNotification) => void
  ): (() => void) | null {
    try {
      const channel = supabase.channel(
        `notification_queue:${userId}`
      );

      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification_queue',
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            console.log('📨 New notification received:', payload);

            if (payload.new) {
              onNotification(payload.new as QueuedNotification);
            }
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('❌ Error subscribing to queue:', error);
      return null;
    }
  }

  /**
   * Clear old notifications from queue
   */
  async clearOld(userId: string, daysOld = 7): Promise<number> {
    try {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - daysOld);

      const { error } = await supabase
        .from('notification_queue')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', dateLimit.toISOString());

      if (error) {
        console.error('❌ Error clearing old notifications:', error);
        return 0;
      }

      console.log(`✅ Cleared old notifications`);
      return 1;
    } catch (error) {
      console.error('❌ Error in clearOld:', error);
      return 0;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(userId: string): Promise<{
    pending: number;
    sent: number;
    failed: number;
    total: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('status')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching stats:', error);
        return null;
      }

      if (!data) {
        return { pending: 0, sent: 0, failed: 0, total: 0 };
      }

      const stats = {
        pending: data.filter((n) => n.status === 'pending').length,
        sent: data.filter((n) => n.status === 'sent').length,
        failed: data.filter((n) => n.status === 'failed').length,
        total: data.length,
      };

      return stats;
    } catch (error) {
      console.error('❌ Error in getStats:', error);
      return null;
    }
  }
}

export const notificationQueueManager = NotificationQueueManager.getInstance();
