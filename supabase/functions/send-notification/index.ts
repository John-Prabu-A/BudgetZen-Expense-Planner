/**
 * Supabase Edge Function: send-notification
 * 
 * Sends a single push notification to a user via Expo Push API
 * Validates token, handles errors, and logs delivery
 * 
 * Endpoint: POST /functions/v1/send-notification
 * 
 * Request body:
 * {
 *   "user_id": "uuid",
 *   "title": "string",
 *   "body": "string",
 *   "data": { optional custom data },
 *   "notification_type": "string"
 * }
 */

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.35.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Types
interface SendNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  notification_type?: string;
  queue_id?: string;
  delay_seconds?: number;
}

interface ExpoTicketResponse {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

interface ExpoReceiptResponse {
  status: "ok" | "error";
  message?: string;
  details?: {
    error?: string;
  };
}

// Initialize Supabase client
const supabase = createClient(
// @ts-ignore
  Deno.env.get("SUPABASE_URL") || "",
// @ts-ignore
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Expo push constants
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100; // Max notifications per batch request

/**
 * Send notification via Expo Push API
 */
async function sendViaExpo(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<ExpoTicketResponse> {
  try {
    const message = {
      to: token,
      sound: "default",
      title: title,
      body: body,
      data: data || {},
      badge: 1,
      priority: "high",
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = (await response.json()) as ExpoTicketResponse;
    return result;
  } catch (error) {
    console.error("Error sending to Expo:", error);
    return {
      status: "error",
      message: `Failed to send: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Main handler
 */
// @ts-ignore
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData: SendNotificationRequest = await req.json();

    const {
      user_id,
      title,
      body,
      data,
      notification_type = "general",
      queue_id,
      delay_seconds = 0,
    } = requestData;

    // Validate input
    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: user_id, title, body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `📤 Sending notification to user ${user_id}: ${notification_type}`
    );

    if (delay_seconds && delay_seconds > 0) {
      const delayMs = Math.min(Math.floor(delay_seconds * 1000), 120000);
      console.log(`⏳ Delaying send by ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Get valid push tokens for user (new table)
    const { data: tokens, error: tokenError } = await supabase
      .from("notification_tokens")
      .select("id, expo_push_token, os_type")
      .eq("user_id", user_id)
      .eq("is_valid", true);

    // Fallback to legacy table if none found
    let normalizedTokens: Array<{ id: string; token: string; platform: string; source: "notification_tokens" | "push_tokens" }> = [];
    if (!tokenError && tokens && tokens.length > 0) {
      normalizedTokens = tokens.map((t: any) => ({
        id: t.id,
        token: t.expo_push_token,
        platform: t.os_type,
        source: "notification_tokens",
      }));
    } else {
      const { data: legacyTokens, error: legacyError } = await supabase
        .from("push_tokens")
        .select("id, token, platform")
        .eq("user_id", user_id)
        .eq("is_valid", true);

      if (legacyError) {
        console.warn(`⚠️ No valid push tokens found for user ${user_id}`);
      } else if (legacyTokens && legacyTokens.length > 0) {
        normalizedTokens = legacyTokens.map((t: any) => ({
          id: t.id,
          token: t.token,
          platform: t.platform,
          source: "push_tokens",
        }));
      }
    }

    if (normalizedTokens.length === 0) {
      console.warn(`⚠️ No valid push tokens found for user ${user_id}`);

      // Debug counts to help diagnose env/table mismatch
      const { count: notifCount } = await supabase
        .from("notification_tokens")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .eq("is_valid", true);

      const { count: legacyCount } = await supabase
        .from("push_tokens")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .eq("is_valid", true);
      
      // Update queue status
      if (queue_id) {
        await supabase
          .from("notification_queue")
          .update({
            status: "failed",
            error_message: "No valid push tokens found",
          })
          .eq("id", queue_id);
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: "No valid push tokens found",
          debug: {
            notification_tokens: notifCount || 0,
            push_tokens: legacyCount || 0,
            supabase_url: Deno.env.get("SUPABASE_URL") || "unknown",
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send to each valid token
    let successCount = 0;
    let failureCount = 0;
    const expoNotificationIds: string[] = [];

    for (const tokenRecord of normalizedTokens) {
      const expoResult = await sendViaExpo(
        tokenRecord.token,
        title,
        body,
        data
      );

      if (expoResult.status === "ok" && expoResult.id) {
        successCount++;
        expoNotificationIds.push(expoResult.id);

        // Log successful send
        await supabase.from("notification_log").insert({
          user_id,
          queue_id,
          notification_type,
          title,
          body,
          push_token: tokenRecord.token.substring(0, 50), // Store partial token
          platform: tokenRecord.platform,
          expo_notification_id: expoResult.id,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        console.log(
          `✅ Notification sent to ${tokenRecord.platform}: ${expoResult.id}`
        );
      } else {
        failureCount++;

        // Check if token is invalid
        const errorMessage = expoResult.message || String(expoResult.details?.error);
        if (
          errorMessage.includes("device not registered") ||
          errorMessage.includes("invalid token")
        ) {
          // Mark token as invalid
          await supabase
            .from(tokenRecord.source)
            .update({
              is_valid: false,
              invalid_reason: "Device unregistered",
              updated_at: new Date().toISOString(),
            })
            .eq("id", tokenRecord.id);

          console.warn(
            `🚫 Marked token as invalid: ${tokenRecord.platform}`
          );
        }

        // Log failed send
        await supabase.from("notification_log").insert({
          user_id,
          queue_id,
          notification_type,
          title,
          body,
          push_token: tokenRecord.token.substring(0, 50),
          platform: tokenRecord.platform,
          status: "failed",
          error_message: errorMessage,
          error_code: expoResult.message || "EXPO_ERROR",
          sent_at: new Date().toISOString(),
        });

        console.error(
          `❌ Failed to send to ${tokenRecord.platform}: ${errorMessage}`
        );
      }
    }

    // Update queue status if this was from queue
    if (queue_id) {
      if (successCount > 0) {
        await supabase
          .from("notification_queue")
          .update({
            status: "sent",
            updated_at: new Date().toISOString(),
          })
          .eq("id", queue_id);
      } else if (failureCount > 0) {
        const { data: queueItem } = await supabase
          .from("notification_queue")
          .select("attempts, max_attempts")
          .eq("id", queue_id)
          .single();

        if (queueItem && queueItem.attempts < queueItem.max_attempts) {
          // Retry later
          await supabase
            .from("notification_queue")
            .update({
              status: "pending",
              attempts: (queueItem.attempts || 0) + 1,
              last_attempt_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", queue_id);
        } else {
          // Max retries exceeded
          await supabase
            .from("notification_queue")
            .update({
              status: "failed",
              error_message: "Max retries exceeded",
            })
            .eq("id", queue_id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        successCount,
        failureCount,
        expoNotificationIds,
        message:
          successCount > 0
            ? `Sent to ${successCount} device(s)`
            : "Failed to send to any device",
      }),
      {
        status: successCount > 0 ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error in send-notification:", error);
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
