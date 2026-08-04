import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./Subscribe.module.css";

export default function Subscribe() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleSubscribe() {
    // Placeholder until Paystack checkout is wired in - this button will
    // POST to a backend route that starts a Paystack transaction and
    // redirects to their checkout page once that's built.
    alert("Subscription checkout is coming very soon!");
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.badge}>Trial ended</span>
        <h1 className={styles.title}>Your free trial has ended</h1>
        <p className={styles.sub}>
          Subscribe for <strong>₦3,000/month</strong> to keep using Study, Exam Prep, Homework, Revision, and Motivation mode.
        </p>

        <button className={styles.subscribeBtn} onClick={handleSubscribe}>
          Subscribe for ₦3,000/month
        </button>

        <div className={styles.linksRow}>
          <button className={styles.linkBtn} onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
          <button className={styles.linkBtn} onClick={() => navigate("/referrals")}>Invite friends for points</button>
        </div>
      </div>
    </div>
  );
        }
