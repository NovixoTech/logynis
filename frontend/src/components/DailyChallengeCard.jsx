// Component for Daily Challenge Question - shown on the homepage

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./DailyChallengeCard.module.css";

const API = "https://studysphere-api-production.up.railway.app";

export default function DailyChallengeCard() {
  const { token } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [funFact, setFunFact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) loadChallenge();
    else setLoading(false);
  }, [token]);

  // Uses a plain, isolated fetch (not the shared authFetch) so that if this
  // one endpoint has a hiccup, it can never trigger a global logout and take
  // down the rest of the homepage with it.
  async function loadChallenge() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/daily-challenge`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("daily-challenge fetch failed");
      const data = await res.json();
      setChallenge(data.challenge);
      setAnswered(data.answered);
      if (data._funFact) setFunFact(data._funFact);
    } catch (e) {
      console.error("[DailyChallengeCard]", e.message);
      setChallenge(null);
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(option) {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/daily-challenge/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answer: option }),
      });
      if (!res.ok) throw new Error("daily-challenge answer failed");
      const data = await res.json();
      setChallenge(prev => ({ ...prev, correctAnswer: data.correctAnswer, userAnswer: option, isCorrect: data.isCorrect }));
      setAnswered(true);
    } catch (e) {
      console.error("[DailyChallengeCard]", e.message);
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
