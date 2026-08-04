import supabase from "../services/supabase.js";

const TRIAL_DAYS = 7;

// Attach this after authMiddleware on any route that should be gated behind
// an active trial or paid subscription - mainly the AI-generating routes
// (chat, flashcards, memory aid, exam features, etc.), not the whole app.
export async function requireActiveSubscription(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("subscriptionstatus, trialstartdate, subscriptionexpiry")
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();

    if (user.subscriptionstatus === "active") {
      const expiry = user.subscriptionexpiry ? new Date(user.subscriptionexpiry) : null;
      if (expiry && expiry > now) {
        return next(); // paid and still within their billing period
      }
      // Subscription lapsed - flip status now so future checks are a plain
      // lookup instead of recomputing this every single request.
      await supabase
        .from("users")
        .update({ subscriptionstatus: "inactive" })
        .eq("id", req.user.id);
    } else if (user.subscriptionstatus === "trial") {
      const trialStart = user.trialstartdate ? new Date(user.trialstartdate) : now;
      const trialEnd = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      if (now < trialEnd) {
        return next(); // still inside the free trial window
      }
      // Trial just expired - same idea, flip status for next time.
      await supabase
        .from("users")
        .update({ subscriptionstatus: "inactive" })
        .eq("id", req.user.id);
    }

    // subscriptionstatus is "inactive", or fell through from an expired
    // trial/subscription just above - block access to this feature.
    return res.status(402).json({
      error: "Your free trial has ended. Subscribe for \u20a63000/month to keep using this feature.",
      code: "SUBSCRIPTION_REQUIRED",
    });
  } catch (err) {
    console.error("[subscription-check-error]", err.message);
    // Fail CLOSED on unexpected errors - see note in chat for why.
    return res.status(402).json({
      error: "Couldn't verify your subscription status. Please try again in a moment.",
      code: "SUBSCRIPTION_CHECK_FAILED",
    });
  }
        }
