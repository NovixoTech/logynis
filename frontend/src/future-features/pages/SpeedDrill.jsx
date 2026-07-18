// Draft page for Speed Drill Mode
// NOT wired into router yet - standalone for future integration

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./SpeedDrill.module.css";

const SECONDS_PER_QUESTION = 10;

export default function SpeedDrill() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [stage, setStage] = useState("setup"); // setup | drill | results
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answered, setAnswered] = useState([]);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (stage === "drill") {
      inputRef.current?.focus();
      setTimeLeft(SECONDS_PER_QUESTION);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            submitAnswer(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [stage, currentQ]);

  async function startDrill() {
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("/future/speed-drill", {
        method: "POST",
        body: JSON.stringify({ subject, questionCount: 15 }),
      });

      if (!res.ok) throw new Error("Failed to generate drill");

      const data = await res.json();
      setQuestions(data.questions || []);
      setCurrentQ(0);
      setAnswered([]);
      setStage("drill");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function submitAnswer(timedOut = false) {
    clearInterval(timerRef.current);
    const current = questions[currentQ];
    const isCorrect = !timedOut && userAnswer.trim().toLowerCase() === current.answer.trim().toLowerCase();

    setAnswered(prev => [...prev, { question: current.question, correctAnswer: current.answer, userAnswer: timedOut ? "(time out)" : userAnswer, isCorrect }]);
    setUserAnswer("");

    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setStage("results");
    }
  }

  const correctCount = answered.filter(a => a.isCorrect).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Speed Drill</h1>
      </div>

      {stage === "setup" && (
        <div className={styles.setup}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.field}>
            <label className={styles.label}>Subject</label>
            <input
              className={styles.input}
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Chemistry, History dates, Vocabulary..."
            />
          </div>
          <p className={styles.info}>15 quick-fire questions · {SECONDS_PER_QUESTION} seconds each</p>
          <button className={styles.startBtn} onClick={startDrill} disabled={loading}>
            {loading ? "Preparing..." : "Start Drill"}
          </button>
        </div>
      )}

      {stage === "drill" && questions[currentQ] && (
        <div className={styles.drillArea}>
          <div className={styles.timerBar}>
            <div className={styles.timerFill} style={{ width: `${(timeLeft / SECONDS_PER_QUESTION) * 100}%` }} />
          </div>
          <p className={styles.progress}>{currentQ + 1} / {questions.length}</p>
          <p className={styles.question}>{questions[currentQ].question}</p>
          <input
            ref={inputRef}
            className={styles.answerInput}
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submitAnswer(false)}
            placeholder="Type your answer..."
          />
          <button className={styles.submitBtn} onClick={() => submitAnswer(false)}>Submit</button>
        </div>
      )}

      {stage === "results" && (
        <div className={styles.resultsArea}>
          <div className={styles.scoreCircle}>{correctCount}/{questions.length}</div>
          <div className={styles.resultsList}>
            {answered.map((a, i) => (
              <div key={i} className={`${styles.resultItem} ${a.isCorrect ? styles.resultCorrect : styles.resultWrong}`}>
                <p className={styles.resultQuestion}>{a.question}</p>
                <p className={styles.resultAnswer}>You: {a.userAnswer} {a.isCorrect ? "✓" : `✗ (${a.correctAnswer})`}</p>
              </div>
            ))}
          </div>
          <button className={styles.newBtn} onClick={() => setStage("setup")}>Try Another Drill</button>
        </div>
      )}
    </div>
  );
        }
