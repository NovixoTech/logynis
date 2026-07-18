// Draft component for "Show Me the Concept First" toggle
// NOT wired into Homework chat yet - standalone for future integration
// Meant to sit above the homework input box as an optional pre-step

import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./ConceptFirstToggle.module.css";

export default function ConceptFirstToggle({ homeworkQuestion, onConceptReceived }) {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    if (!homeworkQuestion || !homeworkQuestion.trim()) {
      setError("Please type your homework question first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("/future/concept-first", {
        method: "POST",
        body: JSON.stringify({ homeworkQuestion }),
      });

      if (!res.ok) throw new Error("Failed to get concept refresher");

      const data = await res.json();
      onConceptReceived(data.text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.button} onClick={handleClick} disabled={loading}>
        {loading ? "Getting refresher..." : "📖 Show me the concept first"}
      </button>
    </div>
  );
        }
