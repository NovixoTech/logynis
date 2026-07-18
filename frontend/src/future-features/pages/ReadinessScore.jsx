// Draft page for Subject Readiness Score
// NOT wired into router yet - standalone for future integration

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./ReadinessScore.module.css";

export default function ReadinessScore() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [subject, setSubject] = useState("");
  const [scoreData, setScoreData] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [error, setError] = useState(null);

  async function checkReadiness() {
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    setLoading(true);
    setError(null);
    setScoreData(null);
    setInsight(null);

    try {
      const res = await authFetch(`/future/readiness-score?subject=${encodeURIComponent(subject)}`);
      if (!res.ok) throw new Error("Failed to check readiness");

      const data = await res.json();
      setScoreData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function getInsight() {
    setLoadingInsight(true);
    try {
      const res = await authFetch("/future/readiness-score/insight", {
        method: "POST",
        body: JSON.stringify({
          subject: scoreData.subject,
          readinessScore: scoreData.readinessScore,
          readinessLabel: scoreData.readinessLabel,
          topicBreakdown: scoreData.topicBreakdown,
        }),
      });
      if (!res.ok) throw new Error("Failed to get insight");
      const data = await res.json();
      setInsight(data.text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingInsight(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Subject Readiness</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label}>Which subject?</label>
          <input
            className={styles.input}
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Biology"
          />
        </div>
        <button className={styles.checkBtn} onClick={checkReadiness} disabled={loading}>
          {loading ? "Calculating..." : "Check Readiness"}
        </button>

        {scoreData && !scoreData.hasEnoughData && (
          <p className={styles.notEnoughData}>{scoreData.message}</p>
        )}

        {scoreData && scoreData.hasEnoughData && (
          <div className={styles.resultArea}>
            <div className={styles.scoreCircle}>{scoreData.readinessScore}%</div>
            <p className={styles.readinessLabel}>{scoreData.readinessLabel}</p>
            <p className={styles.stats}>{scoreData.totalQuestionsAttempted} questions attempted · {scoreData.overallAccuracy}% overall accuracy</p>

            <div className={styles.breakdown}>
              {scoreData.topicBreakdown.map((t, i) => (
                <div key={i} className={styles.topicRow}>
                  <span className={styles.topicName}>{t.topic}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${t.accuracy}%` }} />
                  </div>
                  <span className={styles.topicPercent}>{t.accuracy}%</span>
                </div>
              ))}
            </div>

            {!insight && (
              <button className={styles.insightBtn} onClick={getInsight} disabled={loadingInsight}>
                {loadingInsight ? "Thinking..." : "Get Personal Insight"}
              </button>
            )}

            {insight && <div className={styles.insightBox}>{insight}</div>}
          </div>
        )}
      </div>
    </div>
  );
  } 
