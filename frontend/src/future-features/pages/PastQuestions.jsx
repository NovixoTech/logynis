// Draft page for Real Past Questions Database
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./PastQuestions.module.css";

export default function PastQuestions() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [available, setAvailable] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAvailable();
  }, []);

  async function loadAvailable() {
    setLoading(true);
    try {
      const res = await authFetch("/future/past-questions/subjects-available");
      if (!res.ok) throw new Error("Failed to load available questions");
      const data = await res.json();
      setAvailable(data.available || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions() {
    if (!selectedBoard || !selectedSubject) {
      setError("Please select an exam board and subject");
      return;
    }

    setLoadingQuestions(true);
    setError(null);
    setMessage(null);

    try {
      const params = new URLSearchParams({ examBoard: selectedBoard, subject: selectedSubject });
      if (selectedYear) params.append("year", selectedYear);

      const res = await authFetch(`/future/past-questions?${params}`);
      if (!res.ok) throw new Error("Failed to load questions");

      const data = await res.json();
      setQuestions(data.questions || []);
      if (data.message) setMessage(data.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingQuestions(false);
    }
  }

  const currentBoardData = available.find(a => a.examBoard === selectedBoard);
  const currentSubjectData = currentBoardData?.subjects.find(s => s.subject === selectedSubject);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Real Past Questions</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}
        {loading && <p className={styles.loading}>Loading available exam boards...</p>}

        {!loading && available.length === 0 && (
          <p className={styles.empty}>No verified past questions have been added yet. This section will grow over time as real exam questions are sourced and verified.</p>
        )}

        {!loading && available.length > 0 && (
          <>
            <div className={styles.filters}>
              <select className={styles.select} value={selectedBoard} onChange={e => { setSelectedBoard(e.target.value); setSelectedSubject(""); setSelectedYear(""); }}>
                <option value="">Select exam board</option>
                {available.map(a => <option key={a.examBoard} value={a.examBoard}>{a.examBoard}</option>)}
              </select>

              {currentBoardData && (
                <select className={styles.select} value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedYear(""); }}>
                  <option value="">Select subject</option>
                  {currentBoardData.subjects.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                </select>
              )}

              {currentSubjectData && (
                <select className={styles.select} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                  <option value="">All years</option>
                  {currentSubjectData.years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              )}

              <button className={styles.loadBtn} onClick={loadQuestions} disabled={loadingQuestions}>
                {loadingQuestions ? "Loading..." : "Load Questions"}
              </button>
            </div>

            {message && <p className={styles.infoMessage}>{message}</p>}

            {questions.length > 0 && (
              <div className={styles.questionsList}>
                {questions.map((q, i) => (
                  <div key={q.id || i} className={styles.questionCard}>
                    <span className={styles.questionMeta}>{q.examboard} {q.year} · {q.subject}</span>
                    <p className={styles.questionText}>{q.question}</p>
                    {q.options && (
                      <div className={styles.optionsList}>
                        {Object.entries(q.options).map(([key, text]) => (
                          <span key={key} className={styles.optionItem}>{key}. {text}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
    }
