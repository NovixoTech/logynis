// Draft page for Referral Rewards Program
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Referrals.module.css";

export default function Referrals() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    setLoading(true);
    try {
      const res = await authFetch("/future/referral/summary");
      if (!res.ok) throw new Error("Failed to load referral info");
      const result = await res.json();
      setData(result);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareLink() {
    const shareText = `Join me on Logynis, your AI study companion! Use my code ${data.referralCode} when you sign up: https://logynis.com`;
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) return <div className={styles.page}><p className={styles.loading}>Loading...</p></div>;
  if (!data) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Invite Friends</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.explainer}>
          Invite friends to Logynis and earn <strong>{data.pointsPerReferral} points</strong> for each person who joins using your code.
        </div>

        <div className={styles.codeCard}>
          <span className={styles.codeLabel}>Your referral code</span>
          <span className={styles.code}>{data.referralCode}</span>
          <div className={styles.codeActions}>
            <button className={styles.copyBtn} onClick={copyCode}>{copied ? "Copied!" : "Copy Code"}</button>
            <button className={styles.shareBtn} onClick={shareLink}>Share</button>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{data.inviteCount}</span>
            <span className={styles.statLabel}>Friends Invited</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{data.points}</span>
            <span className={styles.statLabel}>Total Points</span>
          </div>
        </div>

        {data.referredUsers.length > 0 && (
          <div className={styles.invitedSection}>
            <h3 className={styles.invitedTitle}>People you've invited</h3>
            {data.referredUsers.map((u, i) => (
              <div key={i} className={styles.invitedItem}>
                <span>{u.name}</span>
                <span className={styles.invitedDate}>{new Date(u.joinedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
        } 
