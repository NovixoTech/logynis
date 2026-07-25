// Draft page for Exam Anxiety Simulator
// NOT wired into router yet - standalone for future integration
// Key difference from Timed Mock Exam: no going back to previous questions,
// stricter framing, and a post-exam reflection step focused on the experience itself

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./AnxietySimulator.module.css";

export default function AnxietySimulator() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [stage, setStage] = useState("intro"); // intro | exam | reflection
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    if (stage === "exam" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setStage("reflection");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [stage]);

  async function startSimulation() {
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("/future/anxiety-simulator/generate", {
        method: "POST",
        body: JSON.stringify({ subject, questionCount: 10, durationMinutes: 15 }),
      });

      if (!res.ok) throw new Error("Failed to prepare simulation");

      const data = await res.json();
      setQuestions(data.questions);
      setTimeLeft(data.durationMinutes * 60);
      setStage("exam");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function selectAndAdvance(option) {
    setAnswers(prev => ({ ...prev, [currentQ]: option }));
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      clearInterval(timerRef.current);
      setStage("reflection");
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Exam Pressure Simulator</h1>
      </div>

      {stage === "intro" && (
        <div className={styles.intro}>
          {error && <div className={styles.error}>{error}</div>}
          <p className={styles.introText}>
            This simulates real exam pressure: once you answer a question and move forward, you cannot go back.
            The goal is to practice staying calm and focused under time pressure, not just testing knowledge.
          </p>
          <div className={styles.field}>
            <label className={styles.label}>Subject</label>
            <input
              className={styles.input}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Physics, Government..."
            />
          </div>
          <button className={styles.startBtn} onClick={startSimulation} disabled={loading}>
            {loading ? "Preparing..." : "I'm Ready - Begin"}
          </button>
        </div>
      )}

      {stage === "exam" && questions[currentQ] && (
        <div className={styles.examArea}>
          <div className={styles.topRow}>
            <span className={styles.progress}>{currentQ + 1} / {questions.length}</span>
            <span className={styles.timer}>{formatTime(timeLeft)}</span>
          </div>
          <p className={styles.warning}>No going back once you answer</p>
          <p className={styles.question}>{questions[currentQ].question}</p>

          <div className={styles.options}>
            {Object.entries(questions[currentQ].options).map(([key, text]) => (
              <button key={key} className={styles.option} onClick={() => selectAndAdvance(key)}>
                <span className={styles.optionKey}>{key}</span> {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "reflection" && (
        <div className={styles.reflection}>
          <p className={styles.reflectionTitle}>Simulation Complete</p>
          <p className={styles.reflectionText}>
            You answered {Object.keys(answers).length} of {questions.length} questions under pressure.
            How did that feel? Take a moment to notice: did you rush, freeze, or stay steady?
            Practicing this feeling regularly - not just the content - is how real exam calm is built.
          </p>
          <button className={styles.newBtn} onClick={() => { setStage("intro"); setAnswers({}); setCurrentQ(0); setSubject(""); }}>
            Try Another Simulation
          </button>
        </div>
      )}
    </div>
  );
                  } 
