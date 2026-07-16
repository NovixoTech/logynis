import { useParams, useNavigate } from "react-router-dom";
import styles from "./ModeFeatures.module.css";

const MODE_FEATURES = {
  study: [
    { id: "chat", label: "Concept Chat", desc: "Ask anything, get deep explanations", route: "chat" },
    { id: "memory-aid", label: "Memory Aid Generator", desc: "Turn topics into mnemonics, rhymes, or songs", route: "memory-aid" },
    { id: "flashcards", label: "Flashcards", desc: "Generate quick Q&A cards for active recall", route: "flashcards" },
    { id: "concept-map", label: "Concept Map", desc: "See how ideas connect to each other", route: "concept-map" },
  ],
  exam: [
    { id: "chat", label: "Practice Questions", desc: "AI-generated questions with model answers", route: "chat" },
    { id: "timed-mock", label: "Timed Mock Exam", desc: "Simulate real exam conditions", route: "timed-mock" },
    { id: "weak-topics", label: "Weak Topic Tracker", desc: "See which topics need more practice", route: "weak-topics" },
  ],
  homework: [
    { id: "chat", label: "Step-by-Step Help", desc: "Work through problems together", route: "chat" },
  ],
  revision: [
    { id: "chat", label: "Quick Revision", desc: "Concise summaries and notes", route: "chat" },
    { id: "onepager", label: "One-Pager Generator", desc: "Condense a topic into a single summary page", route: "onepager" },
  ],
  motivation: [
    { id: "chat", label: "Talk to Logynis", desc: "Get encouragement and support", route: "chat" },
  ],
};

export default function ModeFeatures() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const features = MODE_FEATURES[mode] || [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate("/")}>← Back</button>
        <h1 className={styles.title}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</h1>
      </div>

      <div className={styles.grid}>
        {features.map(f => (
          <button
            key={f.id}
            className={styles.card}
            onClick={() => navigate(`/mode/${mode}/${f.route}`)}
          >
            <span className={styles.cardLabel}>{f.label}</span>
            <span className={styles.cardDesc}>{f.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
     }
