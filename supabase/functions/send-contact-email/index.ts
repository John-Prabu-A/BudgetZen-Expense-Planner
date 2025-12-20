// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Configuration & Types
// ============================================================================

interface ContactRequest {
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  messageType: "bug_report" | "feature_request" | "general_feedback" | "other";
  appVersion: string;
  platform: "ios" | "android" | "web";
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// Utilities
// ============================================================================

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function validateRequest(data: ContactRequest): string | null {
  if (!data.userId) return "Missing userId";
  if (!isValidEmail(data.userEmail)) return "Invalid email address";
  if (!data.subject || data.subject.length < 3) return "Invalid subject";
  if (!data.message || data.message.length < 5) return "Invalid message";
  if (!["bug_report", "feature_request", "general_feedback", "other"].includes(data.messageType)) {
    return "Invalid message type";
  }
  if (!["ios", "android", "web"].includes(data.platform)) {
    return "Invalid platform";
  }
  return null;
}

// ============================================================================
// Email Template
// ============================================================================

function buildEmailHTML(req: ContactRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f5; }
  .box { max-width:600px; margin:auto; background:#fff; padding:20px; border-radius:8px; }
  h1 { margin-top:0; }
  .row { margin-bottom:12px; }
  .label { font-size:12px; color:#666; font-weight:bold; }
  .value { margin-top:4px; }
</style>
</head>
<body>
  <div class="box">
    <h1>📬 New Contact Message</h1>

    <div class="row">
      <div class="label">From</div>
      <div class="value">${sanitize(req.userEmail)}</div>
    </div>

    <div class="row">
      <div class="label">Type</div>
      <div class="value">${sanitize(req.messageType.replace(/_/g, " ").toUpperCase())}</div>
    </div>

    <div class="row">
      <div class="label">Subject</div>
      <div class="value">${sanitize(req.subject)}</div>
    </div>

    <div class="row">
      <div class="label">Message</div>
      <div class="value">${sanitize(req.message).replace(/\n/g, "<br>")}</div>
    </div>

    <div class="row">
      <div class="label">Platform</div>
      <div class="value">${req.platform.toUpperCase()}</div>
    </div>

    <div class="row">
      <div class="label">App Version</div>
      <div class="value">${sanitize(req.appVersion)}</div>
    </div>

    <div class="row">
      <div class="label">User ID</div>
      <div class="value"><code>${sanitize(req.userId)}</code></div>
    </div>

    <hr />
    <small>Sent from BudgetZen Contact System</small>
  </div>
</body>
</html>
`;
}

// ============================================================================
// Email Sender (Resend)
// ============================================================================

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
// @ts-ignore
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { success: false, error: "Email service not configured" };

  const FROM_EMAIL =
// @ts-ignore
    Deno.env.get("CONTACT_EMAIL_FROM") || "BudgetZen <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { success: false, error: json?.message || "Resend error" };
    }

    return { success: true, messageId: json.id };
  } catch {
    return { success: false, error: "Failed to send email" };
  }
}

// ============================================================================
// Handler
// ============================================================================

// @ts-ignore
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body: ContactRequest = await req.json();
    const validationError = validateRequest(body);
    if (validationError) {
      return new Response(JSON.stringify({ success: false, error: validationError }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const supabase = createClient(
// @ts-ignore
      Deno.env.get("SUPABASE_URL")!,
// @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert message - bypass schema cache by using raw SQL
    let messageId: string | null = null;

    try {
      // Method 1: Try standard insert (works when schema cache is fresh)
      const { data: insertData, error: insertError } = await supabase
        .from("contact_messages")
        .insert({
          user_id: body.userId,
          user_email: body.userEmail,
          subject: body.subject,
          message: body.message,
          message_type: body.messageType,
          app_version: body.appVersion,
          platform: body.platform,
          status: "pending",
        })
        .select("id")
        .single();

      if (!insertError && insertData) {
        messageId = insertData.id;
        console.log("[Contact] Message stored via direct insert:", messageId);
      } else if (insertError) {
        console.warn("[Contact] Direct insert failed, trying raw SQL:", insertError.message);
        
        // Method 2: Use raw SQL to bypass schema cache issues
        const { data: sqlData, error: sqlError } = await supabase.rpc(
          'insert_contact_message_raw',
          {
            user_id_param: body.userId,
            user_email_param: body.userEmail,
            subject_param: body.subject,
            message_param: body.message,
            message_type_param: body.messageType,
            app_version_param: body.appVersion,
            platform_param: body.platform,
          }
        );

        if (!sqlError && sqlData) {
          messageId = sqlData.id;
          console.log("[Contact] Message stored via SQL RPC:", messageId);
        } else {
          console.warn("[Contact] SQL RPC also failed, continuing to send email:", sqlError?.message);
        }
      }
    } catch (err) {
      console.error("[Contact] Database insertion error:", err);
      console.warn("[Contact] Continuing to send email without DB persistence");
    }

    const emailHtml = buildEmailHTML(body);
// @ts-ignore
    const recipient = Deno.env.get("CONTACT_RECIPIENT_EMAIL") || "jpdevland@gmail.com";
    const emailSubject = `[${body.messageType.replace(/_/g, " ")}] ${body.subject}`;

    const emailResult = await sendEmail(recipient, emailSubject, emailHtml);

    // Update status only if we have a message ID
    if (messageId) {
      const updateResult = await supabase
        .from("contact_messages")
        .update({ status: emailResult.success ? "sent" : "failed" })
        .eq("id", messageId);

      if (updateResult.error) {
        console.warn("[Contact] Failed to update status:", updateResult.error);
      }
    } else {
      console.warn("[Contact] No message ID - skipping status update");
    }

    return new Response(
      JSON.stringify({
        success: emailResult.success,
        messageId: messageId,
        error: emailResult.error,
      }),
      {
        status: emailResult.success ? 200 : 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (e) {
    console.error("[Contact] Fatal error:", e);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
