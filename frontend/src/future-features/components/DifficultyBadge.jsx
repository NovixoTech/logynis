// Draft component for Homework Difficulty Rating badge
// NOT wired into Homework chat yet - standalone for future integration
// Meant to appear as a small badge after a homework question is answered

import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./DifficultyBadge.module.css";

const RATING_COLORS = {
  "Below Level": "var(--success)",
  "At Level": "var(--accent)",
  "Above Level": "var(--mode-exam)",
  "Significantly Above Level": "var(--error)",
};

export default function DifficultyBadge({ homeworkQuestion, conversationId }) {
  const { authFetch } = useAuth();
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function checkDifficulty() {
    setLoading(true);
    try {
      const res = await authFetch("/future/difficulty-rating", {
        method: "POST",
        body: JSON.stringify({ homeworkQuestion, conversationId }),
      });

      if (!res.ok) throw new Error("Failed to check difficulty");

      const data = await res.json();
      setRating(data.rating);
    } catch (e) {
      console.error("[difficulty-badge-error]", e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!rating) {
    return (
      <button className={styles.checkButton} onClick={checkDifficulty} disabled={loading}>
        {loading ? "Checking..." : "📊 How hard was this?"}
      </button>
    );
  }

  return (
    <div className={styles.badgeWrapper} onClick={() => setExpanded(!expanded)}>
      <span
        className={styles.badge}
        style={{ backgroundColor: RATING_COLORS[rating.difficultyRating] || "var(--text-muted)" }}
      >
        {rating.difficultyRating} · {rating.score}/10
      </span>
      {expanded && <p className={styles.reasoning}>{rating.reasoning}</p>}
    </div>
  );
  }
