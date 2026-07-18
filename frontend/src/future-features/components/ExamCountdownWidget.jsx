// Draft standalone countdown widget - can be placed anywhere (home screen, top of Exam Mode, etc.)
// NOT wired into the app yet - standalone for future integration
// This is separate from the full Study Plan page - just the countdown itself, reusable anywhere

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./ExamCountdownWidget.module.css";

export default function ExamCountdownWidget({ onClickSetup }) {
  const { authFetch } = useAuth();
  const [daysUntilExam, setDaysUntilExam] = useState(null);
  const [hasExamDate, setHasExamDate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExamDate();
  }, []);

  async function checkExamDate() {
    try {
      const res = await authFetch("/future/study-plan/latest");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.hasPlan) {
        setHasExamDate(true);
        setDaysUntilExam(data.daysUntilExam);
      }
    } catch (e) {
      setHasExamDate(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return null;

  if (!hasExamDate) {
    return (
      <button className={styles.setupPrompt} onClick={onClickSetup}>
        Set your exam date to start a countdown
      </button>
    );
  }

  return (
    <div className={styles.widget} onClick={onClickSetup}>
      <span className={styles.number}>{daysUntilExam}</span>
      <span className={styles.label}>{daysUntilExam === 1 ? "day left" : "days left"}</span>
    </div>
  );
}
