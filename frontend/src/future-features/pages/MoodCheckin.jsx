// Draft page for Mood Check-In Tracker
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./MoodCheckin.module.css";

const MOODS = [
  { id: "great", emoji: "😄", label: "Great" },
  { id: "good", emoji: "🙂", label: "Good" },
  { id: "okay", emoji: "😐", label: "Okay" },
  { id: "stressed", emoji: "😰", label: "Stressed" },
  { id: "overwhelmed", emoji: "😵", label: "Overwhelmed" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "tired", emoji: "😴", label: "Tired" },
];

export default function MoodCheckin() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const res = await authFetch("/future/mood-checkin/history?days=14");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(data.checkins || []);
    } catch (e) {
      // silent
    }
  }

  async function submitCheckin() {
    if (!selectedMood) {
      setError("Please select how you're feeling");
      return;
    }

    setError(null);

    try {
      const res = await authFetch("/future/mood-checkin", {
        method: "POST",
        body: JSON.stringify({ mood: selectedMood, note }),
      });

      if (!res.ok) throw new Error("Failed to save check-in");

      setSubmitted(true);
      loadHistory();
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadInsight() {
    setLoadingInsight(true);
    try {
      const res = await authFetch("/future/mood-checkin/insight");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.hasEnoughData) {
        setInsight(data.text);
      } else {
        setInsight(data.message);
      }
    } catch (e) {
      // silent
    } finally {
      setLoadingInsight(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>How Are You Feeling?</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {!submitted && (
          <>
            <div className={styles.moodGrid}>
              {MOODS.map(m => (
                <button
                  key={m.id}
                  className={`${styles.moodOption} ${selectedMood === m.id ? styles.moodSelected : ""}`}
                  onClick={() => setSelectedMood(m.id)}
                >
                  <span className={styles.emoji}>{m.emoji}</span>
                  <span className={styles.moodLabel}>{m.label}</span>
                </button>
              ))}
            </div>

            <textarea
              className={styles.noteInput}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Anything you want to add? (optional)"
              rows={2}
            />

            <button className={styles.submitBtn} onClick={submitCheckin}>Check In</button>
          </>
        )}

        {submitted && (
          <div className={styles.confirmedArea}>
            <p className={styles.confirmedText}>Thanks for checking in 💙</p>

            {!insight && (
              <button className={styles.insightBtn} onClick={loadInsight} disabled={loadingInsight}>
                {loadingInsight ? "Looking back..." : "See how I've been doing"}
              </button>
            )}

            {insight && <div className={styles.insightBox}>{insight}</div>}

            {history.length > 0 && (
              <div className={styles.historyStrip}>
                {history.slice(0, 7).reverse().map((h, i) => {
                  const moodData = MOODS.find(m => m.id === h.mood);
                  return <span key={i} className={styles.historyEmoji} title={h.mood}>{moodData?.emoji}</span>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
    }
