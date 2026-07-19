// Draft component for Daily Challenge Question
// NOT wired into the app yet - standalone for future integration
// Meant to appear on the homepage/main dashboard

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./DailyChallengeCard.module.css";

export default function DailyChallengeCard() {
  const { authFetch } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [funFact, setFunFact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadChallenge();
  }, []);

  async function loadChallenge() {
    setLoading(true);
    try {
      const res = await authFetch("/future/daily-challenge");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChallenge(data.challenge);
      setAnswered(data.answered);
      if (data._funFact) setFunFact(data._funFact);
    } catch (e) {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(option) {
    setSubmitting(true);
    try {
      const res = await authFetch("/future/daily-challenge/answer", {
        method: "POST",
        body: JSON.stringify({ answer: option }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setChallenge(prev => ({ ...prev, correctAnswer: data.correctAnswer, userAnswer: option, isCorrect: data.isCorrect }));
      setAnswered(true);
    } catch (e) {
      // silent fail
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !challenge) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.badge}>Daily Challenge</span>
        <span className={styles.subject}>{challenge.subject}</span>
      </div>

      <p className={styles.question}>{challenge.question}</p>

      <div className={styles.options}>
        {Object.entries(challenge.options).map(([key, text]) => {
          let optionClass = styles.option;
          if (answered) {
            if (key === challenge.correctAnswer) optionClass = styles.optionCorrect;
            else if (key === challenge.userAnswer) optionClass = styles.optionWrong;
          }
          return (
            <button
              key={key}
              className={optionClass}
              onClick={() => !answered && submitAnswer(key)}
              disabled={answered || submitting}
            >
              <span className={styles.optionKey}>{key}</span> {text}
            </button>
          );
        })}
      </div>

      {answered && funFact && <p className={styles.funFact}>💡 {funFact}</p>}
    </div>
  );
}
