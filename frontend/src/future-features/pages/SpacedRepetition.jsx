// Draft page for Spaced Repetition Reminders
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./SpacedRepetition.module.css";

export default function SpacedRepetition() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [dueItems, setDueItems] = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [newTopic, setNewTopic] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const [dueRes, upcomingRes] = await Promise.all([
        authFetch("/future/spaced-repetition/due"),
        authFetch("/future/spaced-repetition/upcoming"),
      ]);

      if (dueRes.ok) {
        const data = await dueRes.json();
        setDueItems(data.dueItems || []);
      }
      if (upcomingRes.ok) {
        const data = await upcomingRes.json();
        setUpcomingItems(data.upcomingItems || []);
      }
    } catch (e) {
      setError("Failed to load review items");
    } finally {
      setLoading(false);
    }
  }

  async function addTopic() {
    if (!newTopic.trim()) {
      setError("Please enter a topic");
      return;
    }

    try {
      const res = await authFetch("/future/spaced-repetition/add", {
        method: "POST",
        body: JSON.stringify({ topic: newTopic, subject: newSubject }),
      });

      if (!res.ok) throw new Error("Failed to add topic");

      setNewTopic("");
      setNewSubject("");
      setError(null);
      loadItems();
    } catch (e) {
      setError(e.message);
    }
  }

  async function markComplete(id) {
    try {
      const res = await authFetch(`/future/spaced-repetition/${id}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark as reviewed");
      loadItems();
    } catch (e) {
      setError(e.message);
    }
  }

  function daysUntil(dateStr) {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Spaced Repetition</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.addSection}>
          <input
            className={styles.input}
            value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            placeholder="Topic you just learned..."
          />
          <input
            className={styles.input}
            value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
            placeholder="Subject (optional)"
          />
          <button className={styles.addBtn} onClick={addTopic}>Track for Review</button>
        </div>

        {loading && <p className={styles.loading}>Loading your review schedule...</p>}

        {!loading && dueItems.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Due for Review Now</h2>
            {dueItems.map(item => (
              <div key={item.id} className={styles.dueCard}>
                <div>
                  <span className={styles.itemTopic}>{item.topic}</span>
                  {item.subject && <span className={styles.itemSubject}>{item.subject}</span>}
                </div>
                <button className={styles.completeBtn} onClick={() => markComplete(item.id)}>
                  Mark Reviewed
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && dueItems.length === 0 && (
          <p className={styles.allCaughtUp}>Nothing due for review right now — you're all caught up!</p>
        )}

        {!loading && upcomingItems.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Coming Up</h2>
            {upcomingItems.map(item => (
              <div key={item.id} className={styles.upcomingCard}>
                <span className={styles.itemTopic}>{item.topic}</span>
                <span className={styles.itemDays}>in {daysUntil(item.nextreviewat)} days</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
        }
