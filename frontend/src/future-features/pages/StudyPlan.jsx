// Draft page for Exam Countdown + Study Plan
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./StudyPlan.module.css";

export default function StudyPlan() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [examDate, setExamDate] = useState("");
  const [subjectsInput, setSubjectsInput] = useState("");
  const [plan, setPlan] = useState(null);
  const [daysUntilExam, setDaysUntilExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExistingPlan();
  }, []);

  async function loadExistingPlan() {
    setLoading(true);
    try {
      const res = await authFetch("/future/study-plan/latest");
      if (!res.ok) throw new Error("Failed to check for existing plan");
      const data = await res.json();
      if (data.hasPlan) {
        setPlan(data.plan);
        setDaysUntilExam(data.daysUntilExam);
      }
    } catch (e) {
      // Silent fail - just show the setup form
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan() {
    const subjects = subjectsInput.split(",").map(s => s.trim()).filter(Boolean);

    if (!examDate || subjects.length === 0) {
      setError("Please enter your exam date and at least one subject");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await authFetch("/future/study-plan/generate", {
        method: "POST",
        body: JSON.stringify({ examDate, subjects }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed to generate plan");
      }

      const data = await res.json();
      setPlan(data.plan);
      setDaysUntilExam(data.daysUntilExam);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Exam Countdown</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}
        {loading && <p className={styles.loading}>Checking for your study plan...</p>}

        {!loading && !plan && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Exam date</label>
              <input
                type="date"
                className={styles.input}
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Subjects (comma-separated)</label>
              <input
                className={styles.input}
                value={subjectsInput}
                onChange={e => setSubjectsInput(e.target.value)}
                placeholder="e.g. Biology, Chemistry, Physics"
              />
            </div>
            <button className={styles.generateBtn} onClick={generatePlan} disabled={generating}>
              {generating ? "Building your plan..." : "Generate Study Plan"}
            </button>
          </>
        )}

        {!loading && plan && (
          <div className={styles.planArea}>
            <div className={styles.countdown}>
              <span className={styles.countdownNumber}>{daysUntilExam}</span>
              <span className={styles.countdownLabel}>days until your exam</span>
            </div>

            <p className={styles.summary}>{plan.summary}</p>

            <div className={styles.daysList}>
              {plan.days?.map((d, i) => (
                <div key={i} className={styles.dayCard}>
                  <span className={styles.dayLabel}>{d.dayLabel}</span>
                  <ul className={styles.focusList}>
                    {d.focus?.map((f, j) => <li key={j}>{f}</li>)}
                  </ul>
                  {d.note && <p className={styles.dayNote}>{d.note}</p>}
                </div>
              ))}
            </div>

            <button className={styles.newBtn} onClick={() => { setPlan(null); setExamDate(""); setSubjectsInput(""); }}>
              Create New Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
                  }
