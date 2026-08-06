import { Router } from "express";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// Each plan's Paystack Plan Code, amount (in kobo - Paystack's smallest
// unit, so ₦50 = 5000 kobo), and how many days of access a successful
// payment grants. Keep these three in sync with what's actually configured
// in the Paystack dashboard.
const PLANS = {
  daily: {
    planCode: process.env.PAYSTACK_PLAN_WEEKLY,
    amount: 35000, // ₦350
    days: 7,
  },
  monthly: {
    planCode: process.env.PAYSTACK_PLAN_MONTHLY,
    amount: 150000, // ₦1,500
    days: 30,
  },
  yearly: {
    planCode: process.env.PAYSTACK_PLAN_YEARLY,
    amount: 1900000, // ₦19,000
    days: 365,
  },
};

// Users in this app aren't required to have a real email (signup only
// collects name/password), but Paystack's API requires one. This builds a
// safe placeholder when the real email is missing - Paystack doesn't need
// it to be deliverable, just present.
function emailForPaystack(user) {
  if (user.email && user.email.trim()) return user.email.trim();
  return `${user.id}@logynis-user.com`;
}

// Works out which of our 3 plan keys ("weekly "/"monthly"/"yearly") a
// webhook event belongs to. On the FIRST charge, our own metadata.planType
// is reliable since we set it ourselves at initialize time. On RENEWAL
// charges (the subscription auto-charging again later), Paystack doesn't
// always carry that metadata forward - but it does reliably attach the
// plan's own Paystack plan_code to the event, so we fall back to matching
// that against our known plan codes.
function resolvePlanType(eventData) {
  const metaPlanType = eventData?.metadata?.planType;
  if (metaPlanType && PLANS[metaPlanType]) return metaPlanType;

  const planCode = eventData?.plan?.plan_code;
  if (planCode) {
    const match = Object.keys(PLANS).find((key) => PLANS[key].planCode === planCode);
    if (match) return match;
  }

  return null;
}

// POST /api/subscription/initialize
// Body: { plan: "weekly" | "monthly" | "yearly" }
// Starts a Paystack checkout for the logged-in user's chosen plan.
// Returns a hosted checkout URL for the frontend to redirect the browser to.
router.post("/initialize", authMiddleware, async (req, res, next) => {
  try {
    const { plan } = req.body;
    const planConfig = PLANS[plan];

    if (!planConfig) {
      return res.status(400).json({ error: "Invalid plan. Choose weekly, monthly, or yearly." });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: "User not found" });

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailForPaystack(user),
        amount: planConfig.amount,
        plan: planConfig.planCode,
        // Sends the browser back to the paywall page after checkout. This
        // is purely cosmetic - the webhook below is what actually grants
        // access, since the browser could close before this redirect fires.
        callback_url: "https://logynis.novixotech.workers.dev/subscribe",
        // planType travels with THIS charge's webhook event so we know
        // exactly how many days to grant on the first payment. Renewal
        // charges fall back to plan_code matching - see resolvePlanType.
        metadata: { userId: user.id, planType: plan },
      }),
    });

    const data = await paystackRes.json();

    if (!data.status) {
      console.error("[paystack-initialize-error]", data.message);
      return res.status(500).json({ error: "Failed to start checkout, please try again" });
    }

    res.json({ authorizationUrl: data.data.authorization_url });
  } catch (err) {
    console.error("[subscription-initialize-error]", err.message);
    next(err);
  }
});

// POST /api/subscription/webhook
// Called directly by Paystack's servers, not by the app's frontend - so
// there's no auth token here. Instead, every request is verified using
// Paystack's HMAC signature to confirm it genuinely came from Paystack and
// wasn't forged by someone who found this URL.
router.post("/webhook", async (req, res) => {
  console.log("Webhook hit:", new Date().toISOString());
  try {
    const signature = req.headers["x-paystack-signature"];

    const expectedHash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.rawBody)
      .digest("hex");

    if (expectedHash !== signature) {
      console.error("[paystack-webhook] signature mismatch - rejecting");
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const userId = event.data?.metadata?.userId;
      const planType = resolvePlanType(event.data);
      const planConfig = planType ? PLANS[planType] : null;

      if (!userId) {
        console.error("[paystack-webhook] charge.success with no userId in metadata", event.data?.reference);
      } else if (!planConfig) {
        console.error("[paystack-webhook] charge.success with unresolved plan, defaulting to 30 days", event.data?.reference);
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        await supabase
          .from("users")
          .update({ subscriptionstatus: "active", subscriptionexpiry: expiry.toISOString() })
          .eq("id", userId);
      } else {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + planConfig.days);

        await supabase
          .from("users")
          .update({
            subscriptionstatus: "active",
            subscriptionexpiry: expiry.toISOString(),
          })
          .eq("id", userId);
      }
    }

    if (event.event === "subscription.disable") {
      const userId = event.data?.metadata?.userId;
      if (userId) {
        await supabase
          .from("users")
          .update({ subscriptionstatus: "inactive" })
          .eq("id", userId);
      }
    }

    // Acknowledge receipt quickly regardless, so Paystack doesn't keep
    // retrying - errors above are logged for manual follow-up instead.
    res.sendStatus(200);
  } catch (err) {
    console.error("[paystack-webhook-error]", err.message);
    res.sendStatus(200);
  }
});

export default router;
