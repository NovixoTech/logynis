// Draft page for Gratitude/Reflection Prompt
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Reflection.module.css";

export default function Reflection() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuestion();
  }, []);

  async function loadQuestion() {
    setLoading(true);
    try {
      const res = await authFetch("/future/reflection/prompt");
      if (!res.ok) throw new Error("Failed to load reflection prompt");
      const data = await res.json();
      setQuestion(data.question);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitReflection() {
    if (!answer.trim()) {
      setError("Please share a thought first");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await authFetch("/future/reflection/respond", {
        method: "POST",
        body: JSON.stringify({ reflection: answer }),
      });

      if (!res.ok) throw new Error("Failed to submit reflection");

      const data = await res.json();
      setResponse(data.text);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>A Moment to Reflect</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}
        {loading && <p className={styles.loading}>...</p>}

        {!loading && question && !response && (
          <>
            <div className={styles.questionCard}>{question}</div>
            <textarea
              className={styles.textarea}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Take a moment..."
              rows={4}
            />
            <button className={styles.submitBtn} onClick={submitReflection} disabled={submitting}>
              {submitting ? "..." : "Share"}
            </button>
          </>
        )}

        {response && (
          <div className={styles.responseArea}>
            <div className={styles.response}>{response}</div>
            <button className={styles.newBtn} onClick={() => { setResponse(null); setAnswer(""); loadQuestion(); }}>
              Reflect Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
        }
