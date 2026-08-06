import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./Subscribe.module.css";

const PLANS = [
  { id: "weekly", label: "Weekly", price: "₦350", sub: "per week" },
  { id: "monthly", label: "Monthly", price: "₦1,500", sub: "per month" },
  { id: "yearly", label: "Yearly", price: "₦19,000", sub: "per year" },
];

function isAccessActive(user) {
  if (!user) return false;
  if (user.subscriptionstatus !== "active") return false;
  if (!user.subscriptionexpiry) return false;
  return new Date(user.subscriptionexpiry) > new Date();
}

export default function Subscribe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authFetch, updateUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If we're returning from Paystack checkout, its callback adds
  // ?trxref=...&reference=... to the URL. The webhook that actually grants
  // access runs separately on Paystack's servers and might land a second
  // or two after the browser redirect - so instead of trusting stale
  // cached user data, we poll /user/profile a few times until access
  // shows up, then move on to the dashboard automatically.
  const searchParams = new URLSearchParams(location.search);
  const returningFromCheckout = searchParams.has("trxref") || searchParams.has("reference");
  const [confirming, setConfirming] = useState(returningFromCheckout);
  const [confirmFailed, setConfirmFailed] = useState(false);

  useEffect(() => {
    if (!returningFromCheckout) return;
    let cancelled = false;

    async function pollForAccess(attempt = 0) {
      try {
        const res = await authFetch("/user/profile");
        const fresh = await res.json();
        if (cancelled) return;

        if (isAccessActive(fresh)) {
          updateUser(fresh);
          navigate("/dashboard", { replace: true });
          return;
        }

        if (attempt >= 6) {
          setConfirming(false);
          setConfirmFailed(true);
          return;
        }

        setTimeout(() => pollForAccess(attempt + 1), 1500);
      } catch (e) {
        if (!cancelled) {
          setConfirming(false);
          setConfirmFailed(true);
        }
      }
    }

    pollForAccess();
    return () => { cancelled = true; };
  }, [returningFromCheckout]);

  // Reason the paywall showed up in the first place (only relevant if
  // we're not in the middle of confirming a just-completed payment)
  const reason = location.state?.reason || searchParams.get("reason") || "trial_expired";
  const isSubscriptionExpired = reason === "subscription_expired";

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/subscription/initialize", {
        method: "POST",
        body: JSON.stringify({ plan: selectedPlan }),
      });
      if (!res.ok) throw new Error("Failed to start checkout");
      const data = await res.json();
      window.location.href = data.authorizationUrl;
    } catch (e) {
      setError("Something went wrong starting checkout. Please try again.");
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Confirming your payment...</h1>
          <p className={styles.sub}>This usually takes just a few seconds. Please don't close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {confirmFailed && (
          <div className={styles.error}>
            We received your payment but it's taking longer than usual to confirm. If your access doesn't
            unlock in the next minute, please contact support with your payment reference.
          </div>
        )}

        <span className={styles.badge}>
          {isSubscriptionExpired ? "Subscription ended" : "Trial ended"}
        </span>
        <h1 className={styles.title}>
          {isSubscriptionExpired ? "Your subscription has ended" : "Your free trial has ended"}
        </h1>
        <p className={styles.sub}>
          {isSubscriptionExpired
            ? "Subscribe again to keep enjoying Logynis \u2014 access to all study modes and features."
            : "Choose a plan to keep using Study, Exam Prep, Homework, Revision, and Motivation mode."}
        </p>

        <div className={styles.planGrid}>
          {PLANS.map((p) => (
            <button
              key={p.id}
              className={`${styles.planCard} ${selectedPlan === p.id ? styles.planCardActive : ""}`}
              onClick={() => setSelectedPlan(p.id)}
            >
              <span className={styles.planLabel}>{p.label}</span>
              <span className={styles.planPrice}>{p.price}</span>
              <span className={styles.planSub}>{p.sub}</span>
            </button>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.subscribeBtn} onClick={handleSubscribe} disabled={loading}>
          {loading
            ? "Starting checkout..."
            : `Subscribe \u2014 ${PLANS.find((p) => p.id === selectedPlan).price}`}
        </button>

        <div className={styles.linksRow}>
          <button className={styles.linkBtn} onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
          <button className={styles.linkBtn} onClick={() => navigate("/referrals")}>Invite friends for points</button>
        </div>
      </div>
    </div>
  );
}
