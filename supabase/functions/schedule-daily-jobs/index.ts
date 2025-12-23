/**
 * Supabase Edge Function: schedule-daily-jobs
 * 
 * Processes daily scheduled notifications:
 * - Daily reminders (log expenses)
 * - Daily budget warnings (budget threshold alerts)
 * - Daily anomaly detection (unusual spending)
 * 
 * Triggered by CRON schedule (multiple times per day):
 * - Daily reminder: 7 PM
 * - Budget warnings: 7 AM
 * - Anomaly detection: 8 AM
 * 
 * Edge Function can't be triggered directly from CRON in free tier,
 * so this should be called from a client-side job scheduler or
 * a periodic cloud function.
 */

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.35.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabase = createClient(
// @ts-ignore
  Deno.env.get("SUPABASE_URL") || "",
// @ts-ignore
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Constants
const TIMEZONE_UTC = "UTC";
const BATCH_SIZE = 50; // Process users in batches

/**
 * Send daily reminder notifications
 * "Hey! Don't forget to log today's expenses"
 */
async function processDailyReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  console.log("🔔 Processing daily reminders...");

  const result = {
    processed: 0,
    sent: 0,
    failed: 0,
  };

  try {
    // Get all users with daily reminder enabled
    const { data: preferences, error } = await supabase
      .from("notification_preferences")
      .select("user_id, daily_reminder_time, timezone")
      .eq("daily_reminder_enabled", true);

    if (error || !preferences) {
      console.error("❌ Error fetching preferences:", error);
      return result;
    }

    const now = new Date();
    const currentTimeUTC = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;

    // Process each user
    for (const pref of preferences) {
      result.processed++;

      // Get user's timezone (default to UTC)
      const userTZ = pref.timezone || "UTC";
      const preferredTime = pref.daily_reminder_time || "19:00";

      // Convert to user's timezone and check if it's time
      const isTimeToSend = await isScheduledTime(userTZ, preferredTime);

      if (!isTimeToSend) {
        continue;
      }

      // Check DND hours
      const inDND = await isInDNDHours(pref.user_id);
      if (inDND) {
        console.log(
          `⏭️ Skipping reminder for user ${pref.user_id} (in DND hours)`
        );
        continue;
      }

      // Queue notification
      const idempotencyKey = `daily_reminder_${pref.user_id}_${now.toISOString().split("T")[0]}`;

      const { error: queueError } = await supabase.rpc("queue_notification", {
        p_user_id: pref.user_id,
        p_notification_type: "daily_reminder",
        p_title: "📝 Log today's expenses",
        p_body: "Ready to track your spending?",
        p_data: JSON.stringify({
          screen: "add-record",
          action: "create_expense",
        }),
        p_idempotency_key: idempotencyKey,
      });

      if (queueError) {
        console.error(
          `❌ Error queueing reminder for ${pref.user_id}:`,
          queueError
        );
        result.failed++;
      } else {
        console.log(
          `✅ Queued reminder for ${pref.user_id}`
        );
        result.sent++;
      }
    }

    return result;
  } catch (error) {
    console.error("❌ Error in processDailyReminders:", error);
    return result;
  }
}

/**
 * Send budget warning notifications
 * "You've reached 80% of your budget for [Category]"
 */
async function processDailyBudgetWarnings(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  console.log("⚠️ Processing budget warnings...");

  const result = {
    processed: 0,
    sent: 0,
    failed: 0,
  };

  try {
    // Get all users with budget warnings enabled
    const { data: preferences, error } = await supabase
      .from("notification_preferences")
      .select("user_id, budget_warning_threshold, timezone")
      .eq("budget_warnings_enabled", true);

    if (error || !preferences) {
      console.error("❌ Error fetching preferences:", error);
      return result;
    }

    // For each user, check their budget status
    for (const pref of preferences) {
      result.processed++;

      const threshold = pref.budget_warning_threshold || 80;

      // Get user's budgets and spending for this month
      const { data: budgets, error: budgetError } = await supabase
        .from("budgets")
        .select("id, amount, category_id")
        .eq("user_id", pref.user_id);

      if (budgetError || !budgets) continue;

      // Check each budget
      for (const budget of budgets) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: records } = await supabase
          .from("records")
          .select("amount")
          .eq("user_id", pref.user_id)
          .eq("category_id", budget.category_id)
          .eq("type", "expense")
          .gte("transaction_date", monthStart.toISOString());

        const spent = (records || []).reduce(
          (sum: number, r: any) => sum + (r.amount || 0),
          0
        );
        const percentage = (spent / budget.amount) * 100;

        // If threshold exceeded, queue notification
        if (percentage >= threshold) {
          // Get category name
          const { data: category } = await supabase
            .from("categories")
            .select("name")
            .eq("id", budget.category_id)
            .single();

          const categoryName = category?.name || "Category";

          // Deduplicate: check if we already sent this warning today
          const today = new Date().toISOString().split("T")[0];
          const idempotencyKey = `budget_warning_${pref.user_id}_${budget.category_id}_${today}`;

          const { error: queueError } = await supabase.rpc("queue_notification", {
            p_user_id: pref.user_id,
            p_notification_type: "budget_warning",
            p_title: `💰 Budget Alert: ${categoryName}`,
            p_body: `You've spent ${percentage.toFixed(0)}% of your budget`,
            p_data: JSON.stringify({
              screen: "budget",
              category_id: budget.category_id,
              spent,
              budget: budget.amount,
              percentage: Math.round(percentage),
            }),
            p_idempotency_key: idempotencyKey,
          });

          if (!queueError) {
            result.sent++;
          } else {
            result.failed++;
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error("❌ Error in processDailyBudgetWarnings:", error);
    return result;
  }
}

/**
 * Process anomaly detection
 * "Your spending is higher than usual in [Category]"
 */
async function processDailyAnomalies(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  console.log("🔍 Processing daily anomalies...");

  const result = {
    processed: 0,
    sent: 0,
    failed: 0,
  };

  try {
    // Get all users with anomaly detection enabled
    const { data: preferences, error } = await supabase
      .from("notification_preferences")
      .select("user_id, timezone")
      .eq("daily_anomaly_enabled", true);

    if (error || !preferences) {
      console.error("❌ Error fetching preferences:", error);
      return result;
    }

    for (const pref of preferences) {
      result.processed++;

      // Get user's transactions for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: records } = await supabase
        .from("records")
        .select("amount, category_id, transaction_date")
        .eq("user_id", pref.user_id)
        .eq("type", "expense")
        .gte("transaction_date", thirtyDaysAgo.toISOString());

      if (!records || records.length === 0) continue;

      // Group by category and detect anomalies
      const categorySpending: Record<
        string,
        { amounts: number[]; count: number }
      > = {};

      for (const record of records) {
        const catId = record.category_id;
        if (!categorySpending[catId]) {
          categorySpending[catId] = { amounts: [], count: 0 };
        }
        categorySpending[catId].amounts.push(record.amount);
        categorySpending[catId].count++;
      }

      // Calculate anomalies
      for (const [catId, data] of Object.entries(categorySpending)) {
        const amounts = data.amounts;
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(
          amounts.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) /
            amounts.length
        );

        // Check today's spending
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: todayRecords } = await supabase
          .from("records")
          .select("amount")
          .eq("user_id", pref.user_id)
          .eq("category_id", catId)
          .eq("type", "expense")
          .gte("transaction_date", today.toISOString());

        const todayTotal = (todayRecords || []).reduce(
          (sum: number, r: any) => sum + (r.amount || 0),
          0
        );

        // If today's spending is > avg + 2*stdDev, it's anomalous
        if (todayTotal > avg + 2 * stdDev && todayTotal > 0) {
          // Get category name
          const { data: category } = await supabase
            .from("categories")
            .select("name")
            .eq("id", catId)
            .single();

          const categoryName = category?.name || "Category";

          const idempotencyKey = `anomaly_${pref.user_id}_${catId}_${today.toISOString().split("T")[0]}`;

          const { error: queueError } = await supabase.rpc("queue_notification", {
            p_user_id: pref.user_id,
            p_notification_type: "daily_anomaly",
            p_title: `🚨 Unusual spending detected`,
            p_body: `You've spent more in ${categoryName} than usual today`,
            p_data: JSON.stringify({
              screen: "analysis",
              category_id: catId,
              spent: todayTotal,
              average: Math.round(avg),
            }),
            p_idempotency_key: idempotencyKey,
          });

          if (!queueError) {
            result.sent++;
          } else {
            result.failed++;
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error("❌ Error in processDailyAnomalies:", error);
    return result;
  }
}

/**
 * Check if it's the scheduled time for a user
 */
async function isScheduledTime(
  userTZ: string,
  scheduledTime: string
): Promise<boolean> {
  try {
    // This is simplified - in production, convert UTC time to user's timezone
    // For now, just check if we're within 5-minute window of scheduled time

    const now = new Date();
    const currentUTC = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;

    // Parse times
    const [scheduledHour, scheduledMin] = scheduledTime.split(":").map(Number);
    const [currentHour, currentMin] = currentUTC.split(":").map(Number);

    const scheduledTotalMin = scheduledHour * 60 + scheduledMin;
    const currentTotalMin = currentHour * 60 + currentMin;

    // 5-minute window
    return Math.abs(scheduledTotalMin - currentTotalMin) <= 5;
  } catch (error) {
    return false;
  }
}

/**
 * Check if user is in DND hours
 */
async function isInDNDHours(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("notification_preferences")
      .select("dnd_enabled, dnd_start_time, dnd_end_time")
      .eq("user_id", userId)
      .single();

    if (!data?.dnd_enabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const [startHour, startMin] = (data.dnd_start_time || "22:00")
      .split(":")
      .map(Number);
    const [endHour, endMin] = (data.dnd_end_time || "08:00")
      .split(":")
      .map(Number);
    const [currentHour, currentMin] = currentTime.split(":").map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const currentTotalMin = currentHour * 60 + currentMin;

    if (startTotalMin > endTotalMin) {
      // Overnight DND (e.g., 22:00 - 08:00)
      return currentTotalMin >= startTotalMin || currentTotalMin <= endTotalMin;
    }

    return (
      currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin
    );
  } catch (error) {
    return false;
  }
}

/**
 * Main handler
 */
// @ts-ignore
Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🚀 Starting daily job scheduler...");

    // Process all jobs
    const reminderResult = await processDailyReminders();
    const warningResult = await processDailyBudgetWarnings();
    const anomalyResult = await processDailyAnomalies();

    // Log execution
    const now = new Date().toISOString();
    const totalProcessed =
      reminderResult.processed +
      warningResult.processed +
      anomalyResult.processed;
    const totalSent =
      reminderResult.sent + warningResult.sent + anomalyResult.sent;
    const totalFailed =
      reminderResult.failed + warningResult.failed + anomalyResult.failed;

    await supabase.from("job_execution_logs").insert({
      job_name: "daily_jobs",
      executed_at: now,
      success: totalFailed === 0,
      duration_ms: 0,
      total_users_processed: totalProcessed,
      notifications_sent: totalSent,
      notifications_failed: totalFailed,
    });

    console.log("✅ Daily jobs completed");
    console.log(`  Reminders: ${reminderResult.sent}/${reminderResult.processed}`);
    console.log(`  Warnings: ${warningResult.sent}/${warningResult.processed}`);
    console.log(`  Anomalies: ${anomalyResult.sent}/${anomalyResult.processed}`);

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          daily_reminders: reminderResult,
          budget_warnings: warningResult,
          daily_anomalies: anomalyResult,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);

    // Log failure
    const now = new Date().toISOString();
    await supabase.from("job_execution_logs").insert({
      job_name: "daily_jobs",
      executed_at: now,
      success: false,
      error_message: error instanceof Error ? error.message : String(error),
    });

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
