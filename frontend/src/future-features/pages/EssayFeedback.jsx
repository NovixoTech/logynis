// Draft page for Essay/Answer Feedback Tool
// NOT wired into router yet - standalone for future integration

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./EssayFeedback.module.css";

export default function EssayFeedback() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [subject, setSubject] = useState("");
  const [questionContext, setQuestionContext] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getFeedback() {
    if (!subject.trim() || !studentAnswer.trim()) {
      setError("Please enter both a subject and your answer");
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await authFetch("/future/essay-feedback", {
        method: "POST",
        body: JSON.stringify({ subject, studentAnswer, questionContext }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed to get feedback");
      }

      const data = await res.json();
      setFeedback(data.feedback);
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
        <h1 className={styles.title}>Essay & Answer Feedback</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {!feedback && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Subject</label>
              <input
                className={styles.input}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Government, English, Economics"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Original question (optional)</label>
              <textarea
                className={styles.textarea}
                value={questionContext}
                onChange={e => setQuestionContext(e.target.value)}
                placeholder="Paste the essay question or prompt, if there was one..."
                rows={2}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Your answer</label>
              <textarea
                className={styles.textarea}
                value={studentAnswer}
                onChange={e => setStudentAnswer(e.target.value)}
                placeholder="Paste your written answer or essay here..."
                rows={8}
              />
              <span className={styles.charCount}>{studentAnswer.length} / 6000</span>
            </div>

            <button className={styles.generateBtn} onClick={getFeedback} disabled={loading}>
              {loading ? "Reviewing your answer..." : "Get Feedback"}
            </button>
          </>
        )}

        {feedback && (
          <div className={styles.resultArea}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>✓ What worked well</h3>
              <ul className={styles.strengthsList}>
                {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>To improve</h3>
              {feedback.improvements.map((imp, i) => (
                <div key={i} className={styles.improvementCard}>
                  <p className={styles.issue}>{imp.issue}</p>
                  <p className={styles.suggestion}>→ {imp.suggestion}</p>
                </div>
              ))}
            </div>

            <div className={styles.overallNote}>{feedback.overallNote}</div>

            <button className={styles.newBtn} onClick={() => { setFeedback(null); setStudentAnswer(""); }}>
              Submit Another Answer
            </button>
          </div>
        )}
      </div>
    </div>
  );
        }
