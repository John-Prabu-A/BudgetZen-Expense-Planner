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

interface Achievement {
  key: string;
  title: string;
  description: string;
  check: (data: any) => Promise<boolean>;
}

// @ts-ignore
serve(async (req) => {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("achievements")
      .eq("user_id", user_id)
      .single();

    if (!prefs?.achievements?.enabled) {
      return new Response(
        JSON.stringify({ message: "Achievements disabled" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const achievements: Achievement[] = [
      {
        key: "first_transaction",
        title: "First Transaction",
        description: "You logged your first transaction!",
        check: async () => {
          const { count } = await supabase
            .from("records")
            .select("id", { count: "exact" })
            .eq("user_id", user_id);
          return count === 1;
        },
      },
      {
        key: "seven_day_streak",
        title: "7-Day Streak",
        description: "You logged expenses 7 days in a row!",
        check: async () => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data } = await supabase
            .from("records")
            .select("date")
            .eq("user_id", user_id)
            .gte("date", sevenDaysAgo.toISOString())
            .order("date");

          if (!data || data.length === 0) return false;

          // Check if we have at least one entry for each of last 7 days
          const dates = new Set(
            data.map((r: any) =>
              new Date(r.date).toISOString().split("T")[0]
            )
          );

          return dates.size >= 7;
        },
      },
      {
        key: "budget_champion",
        title: "Budget Champion",
        description: "You stayed under budget for a full month!",
        check: async () => {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          const { data: budgets } = await supabase
            .from("budgets")
            .select("id, limit_amount, category_id")
            .eq("user_id", user_id);

          if (!budgets || budgets.length === 0) return false;

          for (const budget of budgets) {
            const { data: records } = await supabase
              .from("records")
              .select("amount")
              .eq("user_id", user_id)
              .eq("category_id", budget.category_id)
              .gte("date", monthStart.toISOString());

            const total =
              records?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0;
            if (total >= budget.limit_amount) return false;
          }

          return true;
        },
      },
      {
        key: "thousand_saver",
        title: "Thousand Saver",
        description: "You've saved $1000 or more this month!",
        check: async () => {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          // Get all goals progress
          const { data: goals } = await supabase
            .from("goals")
            .select("current_amount")
            .eq("user_id", user_id);

          const totalSaved =
            goals?.reduce(
              (sum: number, g: any) =>
                sum + (g.current_amount || 0),
              0
            ) || 0;

          return totalSaved >= 1000;
        },
      },
    ];

    const awardedAchievements = [];

    for (const achievement of achievements) {
      // Check if already awarded
      const { data: existing } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", user_id)
        .eq("achievement_key", achievement.key)
        .single();

      if (!existing) {
        // Check if condition is met
        const isMet = await achievement.check({});

        if (isMet) {
          // Award achievement
          const { error: awardError } = await supabase
            .from("user_achievements")
            .insert({
              user_id,
              achievement_key: achievement.key,
              awarded_at: new Date().toISOString(),
            });

          if (!awardError) {
            // Queue notification
            await supabase.rpc("queue_notification", {
              p_user_id: user_id,
              p_notification_type: "achievement",
              p_title: `🏆 ${achievement.title}`,
              p_body: achievement.description,
              p_data: {
                screen: "achievements",
                achievement_key: achievement.key,
              },
              p_idempotency_key: `achievement_${user_id}_${achievement.key}`,
            });

            awardedAchievements.push(achievement.key);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        awarded: awardedAchievements,
        count: awardedAchievements.length,
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
