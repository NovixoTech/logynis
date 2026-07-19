// Draft component for Success Story Sharing
// NOT wired into Motivation chat yet - standalone for future integration
// Meant to sit near the Motivation chat input, letting students request a relatable story

import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./SuccessStoryButton.module.css";

export default function SuccessStoryButton({ currentStruggle, onStoryReceived }) {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!currentStruggle || !currentStruggle.trim()) return;

    setLoading(true);
    try {
      const res = await authFetch("/future/success-story", {
        method: "POST",
        body: JSON.stringify({ currentStruggle }),
      });

      if (!res.ok) throw new Error("Failed to get story");

      const data = await res.json();
      onStoryReceived(data.text);
    } catch (e) {
      console.error("[success-story-button-error]", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className={styles.button} onClick={handleClick} disabled={loading}>
      {loading ? "Finding a story..." : "💫 Share a story like mine"}
    </button>
  );
          }
