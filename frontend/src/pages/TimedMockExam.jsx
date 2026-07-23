// Draft page for Timed Mock Exam
// NOT wired into router yet - standalone for future integration

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./TimedMockExam.module.css";

export default function TimedMockExam() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [stage, setStage] = useState("setup"); // setup | exam | results
  const [subject, setSubject] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    if (stage === "exam" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [stage]);

  async function startExam() {
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("/api/timed-mock-exam/generate", {
        method: "POST",
        body: JSON.stringify({ subject, questionCount: 10, durationMinutes: 20 }),
      });

      if (!res.ok) throw new Error("Failed to generate exam");

      const data = await res.json();
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setTimeLeft(data.durationMinutes * 60);
      setStage("exam");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qIndex, option) {
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  }

  async function handleSubmit() {
    clearInterval(timerRef.current);
    setLoading(true);

    try {
      const res = await authFetch("/future/timed-mock-exam/submit", {
        method: "POST",
        body: JSON.stringify({ sessionId, answers }),
      });

      if (!res.ok) throw new Error("Failed to submit exam");

      const data = await res.json();
      setResults(data);
      setStage("results");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
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
        <h1 className={styles.title}>Timed Mock Exam</h1>
        {stage === "exam" && <span className={styles.timer}>{formatTime(timeLeft)}</span>}
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
              placeholder="e.g. Biology, Mathematics, Government..."
            />
          </div>
          <p className={styles.info}>10 questions · 20 minutes</p>
          <button className={styles.startBtn} onClick={startExam} disabled={loading}>
            {loading ? "Preparing exam..." : "Start Mock Exam"}
          </button>
        </div>
      )}

      {stage === "exam" && questions[currentQ] && (
        <div className={styles.examArea}>
          <p className={styles.progress}>Question {currentQ + 1} of {questions.length}</p>
          <p className={styles.question}>{questions[currentQ].question}</p>

          <div className={styles.options}>
            {Object.entries(questions[currentQ].options).map(([key, text]) => (
              <button
                key={key}
                className={`${styles.option} ${answers[currentQ] === key ? styles.optionSelected : ""}`}
                onClick={() => selectAnswer(currentQ, key)}
              >
                <span className={styles.optionKey}>{key}</span> {text}
              </button>
            ))}
          </div>

          <div className={styles.navRow}>
            <button className={styles.navBtn} onClick={() => setCurrentQ(q => Math.max(q - 1, 0))} disabled={currentQ === 0}>
              ← Previous
            </button>
            {currentQ < questions.length - 1 ? (
              <button className={styles.navBtn} onClick={() => setCurrentQ(q => q + 1)}>Next →</button>
            ) : (
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting..." : "Submit Exam"}
              </button>
            )}
          </div>
        </div>
      )}

      {stage === "results" && results && (
        <div className={styles.resultsArea}>
          <div className={styles.scoreCircle}>{results.score}%</div>
          <p className={styles.scoreText}>{results.correctCount} out of {results.total} correct</p>

          <div className={styles.resultsList}>
            {results.results.map((r, i) => (
              <div key={i} className={`${styles.resultItem} ${r.isCorrect ? styles.resultCorrect : styles.resultWrong}`}>
                <p className={styles.resultQuestion}>{i + 1}. {r.question}</p>
                <p className={styles.resultAnswer}>
                  Your answer: {r.studentAnswer || "Not answered"} {r.isCorrect ? "✓" : `✗ (Correct: ${r.correctAnswer})`}
                </p>
              </div>
            ))}
          </div>

          <button className={styles.newBtn} onClick={() => navigate(-1)}>Back to Exam Mode</button>
        </div>
      )}
    </div>
  );
}
