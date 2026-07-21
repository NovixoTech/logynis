// Draft page for Flashcards
// NOT wired into router yet - standalone for future integration

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./Flashcards.module.css";

export default function Flashcards() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [topic, setTopic] = useState("");
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    if (!topic.trim()) {
      setError("Please enter a topic first");
      return;
    }

    setLoading(true);
    setError(null);
    setCards([]);
    setCurrentIndex(0);
    setFlipped(false);

    try {
      const res = await authFetch("/future/flashcards", {
        method: "POST",
        body: JSON.stringify({ topic, count: 8 }),
      });

      if (!res.ok) throw new Error("Failed to generate flashcards");

      const data = await res.json();
      setCards(data.cards || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function nextCard() {
    setFlipped(false);
    setCurrentIndex(i => Math.min(i + 1, cards.length - 1));
  }

  function prevCard() {
    setFlipped(false);
    setCurrentIndex(i => Math.max(i - 1, 0));
  }

  const currentCard = cards[currentIndex];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Flashcards</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {cards.length === 0 && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>What topic do you want flashcards for?</label>
              <textarea
                className={styles.textarea}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, Nigerian civil war, algebra basics..."
                rows={3}
              />
            </div>
            <button className={styles.generateBtn} onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate Flashcards"}
            </button>
          </>
        )}

        {cards.length > 0 && currentCard && (
          <div className={styles.cardArea}>
            <p className={styles.progress}>{currentIndex + 1} / {cards.length}</p>

            <div
              className={`${styles.flashcard} ${flipped ? styles.flipped : ""}`}
              onClick={() => setFlipped(!flipped)}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>
                  <p>{currentCard.front}</p>
                  <span className={styles.tapHint}>Tap to reveal answer</span>
                </div>
                <div className={styles.cardBack}>
                  <p>{currentCard.back}</p>
                </div>
              </div>
            </div>

            <div className={styles.navButtons}>
              <button className={styles.navBtn} onClick={prevCard} disabled={currentIndex === 0}>← Previous</button>
              <button className={styles.navBtn} onClick={nextCard} disabled={currentIndex === cards.length - 1}>Next →</button>
            </div>

            <button className={styles.newSetBtn} onClick={() => { setCards([]); setTopic(""); }}>
              New Topic
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
