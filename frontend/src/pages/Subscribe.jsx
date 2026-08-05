import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./Subscribe.module.css";

export default function Subscribe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Figure out whether this is a first-time trial ending, or a paid
  // subscription that has lapsed. We check (in order):
  // 1. state passed via navigate("/subscribe", { state: { reason: "..." } })
  // 2. a ?reason=... query param
  // 3. default to trial_expired
  const searchParams = new URLSearchParams(location.search);
  const reason = location.state?.reason || searchParams.get("reason") || "trial_expired";
  const isSubscriptionExpired = reason === "subscription_expired";

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/subscription/initialize", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start checkout");
      const data = await res.json();
      // Send the browser to Paystack's hosted checkout page
      window.location.href = data.authorizationUrl;
    } catch (e) {
      setError("Something went wrong starting checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.badge}>
          {isSubscriptionExpired ? "Subscription ended" : "Trial ended"}
        </span>
        <h1 className={styles.title}>
          {isSubscriptionExpired ? "Your subscription has ended" : "Your free trial has ended"}
        </h1>
        <p className={styles.sub}>
          {isSubscriptionExpired ? (
            "Subscribe again to keep enjoying Logynis — monthly access to all study modes and features."
          ) : (
            <>
              Subscribe for <span className={styles.priceHighlight}>₦1,000/month</span> to keep using Study, Exam Prep, Homework, Revision, and Motivation mode.
            </>
          )}
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.subscribeBtn} onClick={handleSubscribe} disabled={loading}>
          {loading ? "Starting checkout..." : "Subscribe for ₦1,000/month"}
        </button>

        <div className={styles.linksRow}>
          <button className={styles.linkBtn} onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
          <button className={styles.linkBtn} onClick={() => navigate("/referrals")}>Invite friends for points</button>
        </div>
      </div>
    </div>
  );
  }
