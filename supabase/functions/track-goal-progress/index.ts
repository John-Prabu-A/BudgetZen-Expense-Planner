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
    const { user_id, goal_id } = await req.json();

    if (!user_id || !goal_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("goal_progress_enabled")
      .eq("user_id", user_id)
      .single();

    if (!prefs?.goal_progress_enabled) {
      return new Response(
        JSON.stringify({ message: "Goal progress notifications disabled" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get goal
    const { data: goal } = await supabase
      .from("goals")
      .select("name, target_amount, current_amount")
      .eq("id", goal_id)
      .eq("user_id", user_id)
      .single();

    if (!goal) {
      return new Response(JSON.stringify({ error: "Goal not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const percentProgress = (goal.current_amount / goal.target_amount) * 100;
    const milestones = [25, 50, 75, 100];
    const notifiedMilestones = [];

    for (const milestone of milestones) {
      // Check if milestone already notified
      const { data: notified } = await supabase
        .from("goal_milestones_notified")
        .select("id")
        .eq("goal_id", goal_id)
        .eq("milestone_percent", milestone)
        .single();

      if (!notified && percentProgress >= milestone) {
        // Mark as notified
        await supabase.from("goal_milestones_notified").insert({
          goal_id,
          milestone_percent: milestone,
          notified_at: new Date().toISOString(),
        });

        // Queue notification
        const messages: Record<number, string> = {
          25: "🚀 25% of the way there!",
          50: "🎯 Halfway to your goal!",
          75: "💪 75% complete!",
          100: "🎉 Goal achieved!",
        };

        const { error: queueError } = await supabase.rpc(
          "queue_notification",
          {
            p_user_id: user_id,
            p_notification_type: "goal_progress",
            p_title: `🎯 Goal Progress: ${goal.name}`,
            p_body: messages[milestone],
            p_data: {
              screen: "goals",
              goal_id,
              milestone_percent: milestone,
              current: Math.round(goal.current_amount * 100) / 100,
              target: goal.target_amount,
            },
            p_idempotency_key: `goal_${goal_id}_${milestone}`,
          }
        );

        if (queueError) {
          console.error("Error queueing notification:", queueError);
        } else {
          notifiedMilestones.push(milestone);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${notifiedMilestones.length} new milestones`,
        percentage: Math.round(percentProgress),
        notifiedMilestones,
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
