// Draft page for Note Summarizer
// NOT wired into router yet - standalone for future integration

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./NoteSummarizer.module.css";

export default function NoteSummarizer() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [rawNotes, setRawNotes] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function summarize() {
    if (!rawNotes.trim()) {
      setError("Please paste your notes first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await authFetch("/future/note-summarizer", {
        method: "POST",
        body: JSON.stringify({ rawNotes }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed to clean up notes");
      }

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
        <h1 className={styles.title}>Note Summarizer</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {!result && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Paste your raw notes below</label>
              <textarea
                className={styles.textarea}
                value={rawNotes}
                onChange={e => setRawNotes(e.target.value)}
                placeholder="Paste your messy or disorganized notes here, and I'll clean them up..."
                rows={10}
              />
              <span className={styles.charCount}>{rawNotes.length} / 8000</span>
            </div>
            <button className={styles.generateBtn} onClick={summarize} disabled={loading}>
              {loading ? "Organizing..." : "Clean Up My Notes"}
            </button>
          </>
        )}

        {result && (
          <div className={styles.resultArea}>
            <div className={styles.result}>{result}</div>
            <button className={styles.newBtn} onClick={() => { setResult(null); setRawNotes(""); }}>
              Summarize New Notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
