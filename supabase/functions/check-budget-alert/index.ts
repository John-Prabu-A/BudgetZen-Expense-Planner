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

    // Get budget for category
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("limit_amount")
      .eq("user_id", user_id)
      .eq("category_id", category_id)
      .single();

    if (budgetError || !budget) {
      return new Response(JSON.stringify({ message: "No budget found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("budget_alerts")
      .eq("user_id", user_id)
      .single();

    if (!prefs?.budget_alerts?.enabled) {
      return new Response(
        JSON.stringify({ message: "Budget alerts disabled" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculate current month spending
    const now = new Date(transaction_date || new Date());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: records } = await supabase
      .from("records")
      .select("amount")
      .eq("user_id", user_id)
      .eq("category_id", category_id)
      .gte("date", monthStart.toISOString())
      .lte("date", monthEnd.toISOString());

    const totalSpent =
      (records?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0) +
      amount;
    const percentageOfBudget = (totalSpent / budget.limit_amount) * 100;
    const threshold = prefs.budget_alerts.warningPercentage || 80;

    if (percentageOfBudget >= threshold) {
      // Get category name
      const { data: category } = await supabase
        .from("expense_categories")
        .select("name")
        .eq("id", category_id)
        .single();

      const idempotencyKey = `budget_${user_id}_${category_id}_${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

      // Queue notification
      const { error: queueError } = await supabase.rpc("queue_notification", {
        p_user_id: user_id,
        p_notification_type: "budget_exceeded",
        p_title: `💸 Budget Alert: ${category?.name || "Category"}`,
        p_body: `You've spent ${percentageOfBudget.toFixed(0)}% of your ${category?.name || "category"} budget`,
        p_data: {
          screen: "budget",
          category_id,
          spent: Math.round(totalSpent * 100) / 100,
          budget: budget.limit_amount,
          percentage: Math.round(percentageOfBudget),
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
          message: "Budget alert queued",
          percentage: percentageOfBudget,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "No alert needed",
        percentage: percentageOfBudget,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
// @ts-ignore
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
