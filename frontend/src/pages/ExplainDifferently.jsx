import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ExplainDifferentlyButton from "../components/ExplainDifferentlyButton.jsx";
import styles from "./ExplainDifferently.module.css";

export default function ExplainDifferently() {
  const navigate = useNavigate();

  const [originalQuestion, setOriginalQuestion] = useState("");
  const [originalAnswer, setOriginalAnswer] = useState("");
  const [explanations, setExplanations] = useState([]);

  function handleNewExplanation(text) {
    setExplanations(prev => [...prev, text]);
  }

  const readyToAsk = originalQuestion.trim() && originalAnswer.trim();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Explain Differently</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.field}>
          <label className={styles.label}>What was the original question?</label>
          <textarea
            className={styles.textarea}
            value={originalQuestion}
            onChange={e => setOriginalQuestion(e.target.value)}
            placeholder="Paste or type the question you were asked..."
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>What explanation did you already get?</label>
          <textarea
            className={styles.textarea}
            value={originalAnswer}
            onChange={e => setOriginalAnswer(e.target.value)}
            placeholder="Paste the explanation you didn't fully understand..."
            rows={5}
          />
        </div>

        {readyToAsk && (
          <ExplainDifferentlyButton
            originalQuestion={originalQuestion}
            originalAnswer={originalAnswer}
            onNewExplanation={handleNewExplanation}
          />
        )}

        {explanations.map((text, i) => (
          <div key={i} className={styles.result}>
            <p className={styles.resultLabel}>Attempt {i + 2}</p>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
