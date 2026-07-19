// Draft page for Rapid-Fire Recall Quiz
// NOT wired into router yet - standalone for future integration

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./RapidRecall.module.css";

export default function RapidRecall() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [stage, setStage] = useState("setup"); // setup | quiz | results
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [answered, setAnswered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    if (stage === "quiz") inputRef.current?.focus();
  }, [stage, currentQ]);

  async function startQuiz() {
    if (!topic.trim()) {
      setError("Please enter a topic first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("/future/rapid-recall", {
        method: "POST",
        body: JSON.stringify({ topic, questionCount: 15 }),
      });

      if (!res.ok) throw new Error("Failed to generate quiz");

      const data = await res.json();
      setQuestions(data.questions || []);
      setCurrentQ(0);
      setAnswered([]);
      setStage("quiz");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function answerTrueFalse(userAnswer) {
    const current = questions[currentQ];
    const isCorrect = userAnswer === current.answer;
    recordAndAdvance(String(userAnswer), isCorrect);
  }

  function answerShortAnswer() {
    const current = questions[currentQ];
    const isCorrect = shortAnswerInput.trim().toLowerCase() === current.answer.trim().toLowerCase();
    recordAndAdvance(shortAnswerInput, isCorrect);
    setShortAnswerInput("");
  }

  function recordAndAdvance(userAnswer, isCorrect) {
    setAnswered(prev => [...prev, { ...questions[currentQ], userAnswer, isCorrect }]);
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setStage("results");
    }
  }

  const correctCount = answered.filter(a => a.isCorrect).length;
  const current = questions[currentQ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Rapid Recall Quiz</h1>
      </div>

      {stage === "setup" && (
        <div className={styles.setup}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.field}>
            <label className={styles.label}>Topic to cram</label>
            <input
              className={styles.input}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Key dates in Nigerian history..."
            />
          </div>
          <button className={styles.startBtn} onClick={startQuiz} disabled={loading}>
            {loading ? "Preparing..." : "Start Quiz"}
          </button>
        </div>
      )}

      {stage === "quiz" && current && (
        <div className={styles.quizArea}>
          <p className={styles.progress}>{currentQ + 1} / {questions.length}</p>

          {current.type === "truefalse" && (
            <>
              <p className={styles.statement}>{current.statement}</p>
              <div className={styles.tfButtons}>
                <button className={styles.trueBtn} onClick={() => answerTrueFalse(true)}>TRUE</button>
                <button className={styles.falseBtn} onClick={() => answerTrueFalse(false)}>FALSE</button>
              </div>
            </>
          )}

          {current.type === "shortanswer" && (
            <>
              <p className={styles.statement}>{current.question}</p>
              <input
                ref={inputRef}
                className={styles.answerInput}
                value={shortAnswerInput}
                onChange={e => setShortAnswerInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && answerShortAnswer()}
                placeholder="Quick answer..."
              />
              <button className={styles.submitBtn} onClick={answerShortAnswer}>Submit</button>
            </>
          )}
        </div>
      )}

      {stage === "results" && (
        <div className={styles.resultsArea}>
          <div className={styles.scoreCircle}>{correctCount}/{questions.length}</div>
          <div className={styles.resultsList}>
            {answered.map((a, i) => (
              <div key={i} className={`${styles.resultItem} ${a.isCorrect ? styles.correct : styles.wrong}`}>
                {a.type === "truefalse" ? a.statement : a.question}
                {!a.isCorrect && <span className={styles.correctAnswer}> (Correct: {String(a.answer)})</span>}
              </div>
            ))}
          </div>
          <button className={styles.newBtn} onClick={() => setStage("setup")}>New Quiz</button>
        </div>
      )}
    </div>
  );
}
