// Draft page for Cross-Subject Connections
// NOT wired into router yet - standalone for future integration

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./CrossSubject.module.css";

export default function CrossSubject() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [subjectA, setSubjectA] = useState("");
  const [subjectB, setSubjectB] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    if (!subjectA.trim() || !subjectB.trim()) {
      setError("Please enter both topics");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await authFetch("/future/cross-subject", {
        method: "POST",
        body: JSON.stringify({ subjectA, subjectB }),
      });

      if (!res.ok) throw new Error("Failed to find connections");

      const data = await res.json();
      setResult(data.text);
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
        <h1 className={styles.title}>Cross-Subject Connections</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {!result && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>First topic</label>
              <input
                className={styles.input}
                value={subjectA}
                onChange={e => setSubjectA(e.target.value)}
                placeholder="e.g. Chemistry"
              />
            </div>

            <div className={styles.connector}>connects to</div>

            <div className={styles.field}>
              <label className={styles.label}>Second topic</label>
              <input
                className={styles.input}
                value={subjectB}
                onChange={e => setSubjectB(e.target.value)}
                placeholder="e.g. Economics"
              />
            </div>

            <button className={styles.generateBtn} onClick={generate} disabled={loading}>
              {loading ? "Finding connections..." : "Show the Connection"}
            </button>
          </>
        )}

        {result && (
          <div className={styles.resultArea}>
            <div className={styles.resultHeader}>{subjectA} ↔ {subjectB}</div>
            <div className={styles.result}>{result}</div>
            <button className={styles.newBtn} onClick={() => { setResult(null); setSubjectA(""); setSubjectB(""); }}>
              Try Another Pair
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
