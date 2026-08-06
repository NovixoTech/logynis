import supabase from "../services/supabase.js";

const TRIAL_DAYS = 7;

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
    // If subscriptionexpiry has ever been set, this user has subscribed
    // before at least once. This stays true even after we mark them
    // "inactive" below, so it's a reliable way to tell trial vs. lapsed
    // subscription apart across repeated requests.
    const hasSubscribedBefore = !!user.subscriptionexpiry;

    // Case 1: currently active and not yet expired — let them through
    if (
      user.subscriptionstatus === "active" &&
      user.subscriptionexpiry &&
      new Date(user.subscriptionexpiry) > now
    ) {
      return next();
    }

    // Case 2: never subscribed before, and still inside the trial window
    if (!hasSubscribedBefore) {
      const trialStart = user.trialstartdate ? new Date(user.trialstartdate) : now;
      const trialEnd = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      if (now < trialEnd) {
        return next();
      }
    }

    // Blocked. Make sure their status reflects that.
    if (user.subscriptionstatus !== "inactive") {
      await supabase
        .from("users")
        .update({ subscriptionstatus: "inactive" })
        .eq("id", req.user.id);
    }

    console.log("[SUB-DEBUG]", {
  subscriptionstatus: user.subscriptionstatus,
  subscriptionexpiry: user.subscriptionexpiry,
  hasSubscribedBefore,
  now: now.toISOString(),
});
    
    if (hasSubscribedBefore) {
      return res.status(402).json({
        error: "Your subscription has ended. Subscribe again to keep enjoying Logynis \u2014 monthly access to all study modes and features.",
        code: "SUBSCRIPTION_REQUIRED",
        reason: "subscription_expired",
      });
    }

    return res.status(402).json({
      error: "Your free trial has ended. Subscribe for \u20a61000/month to keep using this feature.",
      code: "SUBSCRIPTION_REQUIRED",
      reason: "trial_expired",
    });
  } catch (err) {
    console.error("[subscription-check-error]", err.message);
    return res.status(402).json({
      error: "Couldn't verify your subscription status. Please try again in a moment.",
      code: "SUBSCRIPTION_CHECK_FAILED",
    });
  }
  }
