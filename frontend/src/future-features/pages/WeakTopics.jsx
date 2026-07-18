// Draft page for Weak Topic Tracker
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./WeakTopics.module.css";

export default function WeakTopics() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [weakTopics, setWeakTopics] = useState([]);
  const [strongTopics, setStrongTopics] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRec, setLoadingRec] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    setLoading(true);
    try {
      const res = await authFetch("/future/weak-topics");
      if (!res.ok) throw new Error("Failed to load performance data");
      const data = await res.json();
      setWeakTopics(data.weakTopics || []);
      setStrongTopics(data.strongTopics || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function getRecommendations() {
    setLoadingRec(true);
    try {
      const res = await authFetch("/future/weak-topics/recommendations", { method: "POST" });
      if (!res.ok) throw new Error("Failed to get recommendations");
      const data = await res.json();
      setRecommendation(data.text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingRec(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Weak Topic Tracker</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}
        {loading && <p className={styles.loading}>Loading your performance data...</p>}

        {!loading && weakTopics.length === 0 && strongTopics.length === 0 && (
          <p className={styles.empty}>No practice data yet. Complete some Timed Mock Exams or practice questions to see your topic breakdown here.</p>
        )}

        {weakTopics.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Needs Practice</h2>
            {weakTopics.map((t, i) => (
              <div key={i} className={styles.topicCardWeak}>
                <span className={styles.topicName}>{t.topic}</span>
                <span className={styles.topicSubject}>{t.subject}</span>
                <span className={styles.topicAccuracy}>{t.accuracy}% ({t.correctcount}/{t.totalcount})</span>
              </div>
            ))}
            <button className={styles.recBtn} onClick={getRecommendations} disabled={loadingRec}>
              {loadingRec ? "Thinking..." : "Get Personalized Recommendations"}
            </button>
          </div>
        )}

        {recommendation && (
          <div className={styles.recommendation}>{recommendation}</div>
        )}

        {strongTopics.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Strong Topics</h2>
            {strongTopics.map((t, i) => (
              <div key={i} className={styles.topicCardStrong}>
                <span className={styles.topicName}>{t.topic}</span>
                <span className={styles.topicSubject}>{t.subject}</span>
                <span className={styles.topicAccuracy}>{t.accuracy}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
    }
