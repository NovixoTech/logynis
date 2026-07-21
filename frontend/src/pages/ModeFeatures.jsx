import { useParams, useNavigate } from "react-router-dom";
import styles from "./ModeFeatures.module.css";

const MODE_FEATURES = {
  study: [
    { id: "chat", label: "Concept Chat", desc: "Ask anything, get deep explanations", route: "chat" },
    { id: "memory-aid", label: "Memory Aid Generator", desc: "Turn topics into mnemonics, rhymes, or songs", route: "memory-aid" },
    { id: "flashcards", label: "Flashcards", desc: "Generate quick Q&A cards for active recall", route: "flashcards" },
    { id: "concept-map", label: "Concept Map", desc: "See how ideas connect to each other", route: "concept-map" },
    { id: "note-summarizer", label: "Note Summarizer", desc: "Turn messy notes into clean, organized notes", route: "note-summarizer" },
    { id: "cross-subject", label: "Cross-Subject Connections", desc: "See how two topics genuinely connect", route: "cross-subject" },
    { id: "debate-practice", label: "Debate Practice", desc: "Practice arguing and critical thinking", route: "debate-practice" },
  ],
  exam: [
    { id: "chat", label: "Practice Questions", desc: "AI-generated questions with model answers", route: "chat" },
    { id: "timed-mock", label: "Timed Mock Exam", desc: "Simulate real exam conditions", route: "timed-mock" },
    { id: "weak-topics", label: "Weak Topic Tracker", desc: "See which topics need more practice", route: "weak-topics" },
    { id: "speed-drill", label: "Speed Drill", desc: "Rapid-fire quick recall questions", route: "speed-drill" },
    { id: "anxiety-simulator", label: "Exam Pressure Simulator", desc: "Practice staying calm under timed pressure", route: "anxiety-simulator" },
    { id: "common-mistakes", label: "Common Mistakes Digest", desc: "Learn what students usually get wrong", route: "common-mistakes" },
    { id: "readiness-score", label: "Subject Readiness Score", desc: "See how ready you are based on real practice", route: "readiness-score" },
    { id: "study-plan", label: "Exam Countdown & Study Plan", desc: "A day-by-day plan working backward from your exam", route: "study-plan" },
  ],
  homework: [
    { id: "chat", label: "Step-by-Step Help", desc: "Work through problems together", route: "chat" },
    { id: "photo-homework", label: "Photo Homework Helper", desc: "Upload a photo of your question", route: "photo-homework" },
    { id: "concept-first", label: "Show Me the Concept First", desc: "Quick refresher before solving", route: "concept-first" },
    { id: "essay-feedback", label: "Essay & Answer Feedback", desc: "Get feedback on your own written answers", route: "essay-feedback" },
  ],
  revision: [
    { id: "chat", label: "Quick Revision", desc: "Concise summaries and notes", route: "chat" },
    { id: "onepager", label: "One-Pager Generator", desc: "Condense a topic into a single summary page", route: "onepager" },
    { id: "rapid-recall", label: "Rapid Recall Quiz", desc: "Fast true/false and short-answer cramming", route: "rapid-recall" },
    { id: "revision-timetable", label: "Revision Timetable", desc: "A recurring weekly revision schedule", route: "revision-timetable" },
    { id: "spaced-repetition", label: "Spaced Repetition", desc: "Get reminded to review at the right time", route: "spaced-repetition" },
  ],
  motivation: [
    { id: "chat", label: "Talk to Logynis", desc: "Get encouragement and support", route: "chat" },
    { id: "success-story", label: "Success Story", desc: "Hear a relatable story like yours", route: "success-story" },
    { id: "reflection", label: "Reflection Moment", desc: "A gentle daily reflection prompt", route: "reflection" },
    { id: "mood-checkin", label: "Mood Check-In", desc: "Track how you've been feeling", route: "mood-checkin" },
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
