// Draft page for Common Mistakes Digest
// NOT wired into router yet - standalone for future integration

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./CommonMistakes.module.css";

export default function CommonMistakes() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [topic, setTopic] = useState("");
  const [mistakes, setMistakes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    if (!topic.trim()) {
      setError("Please enter a topic first");
      return;
    }

    setLoading(true);
    setError(null);
    setMistakes(null);

    try {
      const res = await authFetch("/future/common-mistakes", {
        method: "POST",
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) throw new Error("Failed to load common mistakes");

      const data = await res.json();
      setMistakes(data.mistakes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Common Mistakes Digest</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {!mistakes && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>What topic are you studying?</label>
              <textarea
                className={styles.textarea}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Balancing chemical equations, essay writing for Government..."
                rows={3}
              />
            </div>
            <button className={styles.generateBtn} onClick={generate} disabled={loading}>
              {loading ? "Consulting the examiner's notes..." : "Show Common Mistakes"}
            </button>
          </>
        )}

        {mistakes && (
          <div className={styles.resultArea}>
            {mistakes.map((m, i) => (
              <div key={i} className={styles.mistakeCard}>
                <div className={styles.mistakeHeader}>
                  <span className={styles.mistakeNumber}>{i + 1}</span>
                  <span className={styles.mistakeTitle}>{m.mistake}</span>
                </div>
                <p className={styles.mistakeWhy}><strong>Why it happens:</strong> {m.why}</p>
                <p className={styles.mistakeCorrection}><strong>Do this instead:</strong> {m.correction}</p>
              </div>
            ))}
            <button className={styles.newBtn} onClick={() => { setMistakes(null); setTopic(""); }}>
              Check Another Topic
            </button>
          </div>
        )}
      </div>
    </div>
  );
    }
