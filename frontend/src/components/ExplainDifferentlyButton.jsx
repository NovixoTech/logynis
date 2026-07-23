import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./ExplainDifferentlyButton.module.css";

export default function ExplainDifferentlyButton({ originalQuestion, originalAnswer, onNewExplanation }) {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(1);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await authFetch("/explain-differently", {
        method: "POST",
        body: JSON.stringify({
          originalQuestion,
          originalAnswer,
          attemptNumber: attemptCount,
        }),
      });

      if (!res.ok) throw new Error("Failed to get a new explanation");

      const data = await res.json();
      onNewExplanation(data.text);
      setAttemptCount(c => c + 1);
    } catch (e) {
      console.error("[explain-differently-error]", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className={styles.button} onClick={handleClick} disabled={loading}>
      {loading ? "Rethinking..." : "🔄 Explain this differently"}
    </button>
  );
                      }
