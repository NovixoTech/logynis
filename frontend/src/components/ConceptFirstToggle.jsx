import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
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
      const res = await authFetch("/api/concept-first/generate", {
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
