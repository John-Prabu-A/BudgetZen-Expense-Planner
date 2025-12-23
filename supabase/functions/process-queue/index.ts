/**
 * Supabase Edge Function: process-queue
 * 
 * Processes pending notifications from notification_queue table
 * Sends them via send-notification function
 * Handles retries and error cases
 * 
 * Can be called periodically (every 5-10 minutes) or triggered by:
 * - Real-time database changes
 * - Scheduled CRON job
 * - Manual endpoint call
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

interface QueueItem {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string;
  data?: any;
  scheduled_for: string;
  attempts: number;
  max_attempts: number;
}

/**
 * Process notification queue
 */
async function processQueue(batchSize = 20): Promise<{
  processed: number;
  sent: number;
  failed: number;
  retried: number;
}> {
  const result = {
    processed: 0,
    sent: 0,
    failed: 0,
    retried: 0,
  };

  try {
    // Get pending notifications that are ready to send
    const now = new Date().toISOString();
    const { data: queueItems, error } = await supabase
      .from("notification_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(batchSize);

    if (error) {
      console.error("❌ Error fetching queue:", error);
      return result;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log("📊 No pending notifications in queue");
      return result;
    }

    console.log(`📤 Processing ${queueItems.length} notifications from queue`);

    // Process each item
    for (const item of queueItems) {
      result.processed++;

      // Send notification
      const sendResult = await sendNotification(item);

      if (sendResult.success) {
        result.sent++;

        // Mark as sent
        await supabase
          .from("notification_queue")
          .update({
            status: "sent",
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        console.log(`✅ Sent notification ${item.id}`);
      } else {
        // Check if we should retry
        if (item.attempts < item.max_attempts - 1) {
          // Retry with exponential backoff
          const delayMinutes = Math.pow(2, item.attempts);
          const nextAttempt = new Date(
            Date.now() + delayMinutes * 60 * 1000
          ).toISOString();

          await supabase
            .from("notification_queue")
            .update({
              status: "pending",
              attempts: item.attempts + 1,
              scheduled_for: nextAttempt,
              last_attempt_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          result.retried++;
          console.log(
            `🔄 Retrying notification ${item.id} (attempt ${item.attempts + 1}/${item.max_attempts})`
          );
        } else {
          // Max retries exceeded
          await supabase
            .from("notification_queue")
            .update({
              status: "failed",
              error_message: "Max retries exceeded",
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          result.failed++;
          console.error(
            `❌ Failed to send notification ${item.id} after ${item.attempts} attempts`
          );
        }
      }
    }

    return result;
  } catch (error) {
    console.error("❌ Error processing queue:", error);
    return result;
  }
}

/**
 * Call send-notification function
 */
async function sendNotification(item: QueueItem): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get the Supabase URL for making internal function calls
// @ts-ignore
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
// @ts-ignore
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          user_id: item.user_id,
          title: item.title,
          body: item.body,
          data: item.data,
          notification_type: item.notification_type,
          queue_id: item.id,
        }),
      }
    );

    const result = await response.json();

    if (result.success || response.status === 200) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.message || "Unknown error",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
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
    // Parse optional batch size from query params
    const url = new URL(req.url);
    const batchSize = Math.min(
      parseInt(url.searchParams.get("batch_size") || "20"),
      100
    );

    console.log("🚀 Starting queue processor...");

    // Process queue
    const result = await processQueue(batchSize);

    // Log execution
    await supabase.from("job_execution_logs").insert({
      job_name: "process_queue",
      executed_at: new Date().toISOString(),
      success: result.failed === 0,
      notifications_sent: result.sent,
      notifications_failed: result.failed,
    });

    console.log("✅ Queue processing completed");
    console.log(`  Processed: ${result.processed}`);
    console.log(`  Sent: ${result.sent}`);
    console.log(`  Retried: ${result.retried}`);
    console.log(`  Failed: ${result.failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);

    // Log failure
    await supabase.from("job_execution_logs").insert({
      job_name: "process_queue",
      executed_at: new Date().toISOString(),
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
