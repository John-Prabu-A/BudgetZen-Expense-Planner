// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
// @ts-ignore
  Deno.env.get("SUPABASE_URL") || "",
// @ts-ignore
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// @ts-ignore
serve(async (req) => {
  try {
    const { user_id, category_id, amount, transaction_date } = await req.json();

    if (!user_id || !category_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("spending_anomalies")
      .eq("user_id", user_id)
      .single();

    if (!prefs?.spending_anomalies?.enabled) {
      return new Response(
        JSON.stringify({ message: "Anomaly detection disabled" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get transaction history (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: history } = await supabase
      .from("records")
      .select("amount")
      .eq("user_id", user_id)
      .eq("category_id", category_id)
      .gte("date", ninetyDaysAgo.toISOString());

    if (!history || history.length < 10) {
      return new Response(
        JSON.stringify({
          message: "Insufficient history for anomaly detection",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculate mean and standard deviation
    const amounts = history.map((r: any) => r.amount);
    const mean = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
    const variance =
      amounts.reduce((sum: number, x: number) => sum + Math.pow(x - mean, 2), 0) /
      amounts.length;
    const stdDev = Math.sqrt(variance);

    // Check if current transaction is anomaly (> 2 std dev from mean)
    const zScore = (amount - mean) / stdDev;

    if (zScore > 2) {
      // Get category name
      const { data: category } = await supabase
        .from("expense_categories")
        .select("name")
        .eq("id", category_id)
        .single();

      const idempotencyKey = `anomaly_${user_id}_${category_id}_${new Date(transaction_date || Date.now()).toISOString().split("T")[0]}`;

      // Queue notification
      const { error: queueError } = await supabase.rpc("queue_notification", {
        p_user_id: user_id,
        p_notification_type: "unusual_spending",
        p_title: "⚠️ Unusual Spending Detected",
        p_body: `Your $${amount.toFixed(2)} transaction is unusually high for ${category?.name || "this category"}`,
        p_data: {
          screen: "analytics",
          category_id,
          amount,
          average: Math.round(mean * 100) / 100,
          std_dev: Math.round(stdDev * 100) / 100,
          z_score: Math.round(zScore * 100) / 100,
        },
        p_idempotency_key: idempotencyKey,
      });

      if (queueError) {
        console.error("Error queueing notification:", queueError);
        return new Response(
          JSON.stringify({ error: "Failed to queue notification" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Anomaly detected and queued",
          zScore,
          mean,
          amount,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "No anomaly detected",
        zScore,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
