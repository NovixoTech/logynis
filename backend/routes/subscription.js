import { Router } from "express";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// Users in this app aren't required to have a real email (signup only
// collects name/password), but Paystack's API requires one. This builds a
// safe placeholder when the real email is missing - Paystack doesn't need
// it to be deliverable, just present.
function emailForPaystack(user) {
  if (user.email && user.email.trim()) return user.email.trim();
  return `${user.id}@logynis-user.com`;
}

// POST /api/subscription/initialize
// Starts a Paystack checkout for the logged-in user's subscription plan.
// Returns a hosted checkout URL for the frontend to redirect the browser to.
router.post("/initialize", authMiddleware, async (req, res, next) => {
  try {
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
        plan: process.env.PAYSTACK_PLAN_CODE,
        // Sends the browser back to the paywall page after checkout. This
        // is purely cosmetic - the webhook below is what actually grants
        // access, since the browser could close before this redirect fires.
        callback_url: "https://logynis.novixotech.workers.dev/subscribe",
        metadata: { userId: user.id },
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

      if (!userId) {
        console.error("[paystack-webhook] charge.success with no userId in metadata", event.data?.reference);
      } else {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);

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
