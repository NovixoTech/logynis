// Draft page for Auto-Generated Revision Timetable
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./RevisionTimetable.module.css";

export default function RevisionTimetable() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [subjectsInput, setSubjectsInput] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(6);
  const [hoursPerSession, setHoursPerSession] = useState(1);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExisting();
  }, []);

  async function loadExisting() {
    setLoading(true);
    try {
      const res = await authFetch("/future/revision-timetable/latest");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.hasTimetable) setTimetable(data.timetable);
    } catch (e) {
      // silent - just show setup form
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    const subjects = subjectsInput.split(",").map(s => s.trim()).filter(Boolean);

    if (subjects.length === 0) {
      setError("Please enter at least one subject");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await authFetch("/future/revision-timetable/generate", {
        method: "POST",
        body: JSON.stringify({ subjects, daysPerWeek, hoursPerSession }),
      });

      if (!res.ok) throw new Error("Failed to generate timetable");

      const data = await res.json();
      setTimetable(data.timetable);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Revision Timetable</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}
        {loading && <p className={styles.loading}>Checking for existing timetable...</p>}

        {!loading && !timetable && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Subjects (comma-separated)</label>
              <input
                className={styles.input}
                value={subjectsInput}
                onChange={e => setSubjectsInput(e.target.value)}
                placeholder="e.g. Maths, Biology, English"
              />
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Days per week</label>
                <select className={styles.select} value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))}>
                  {[3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n} days</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Hours per session</label>
                <select className={styles.select} value={hoursPerSession} onChange={e => setHoursPerSession(Number(e.target.value))}>
                  {[0.5, 1, 1.5, 2].map(n => <option key={n} value={n}>{n} hr</option>)}
                </select>
              </div>
            </div>
            <button className={styles.generateBtn} onClick={generate} disabled={generating}>
              {generating ? "Building schedule..." : "Generate Timetable"}
            </button>
          </>
        )}

        {!loading && timetable && (
          <div className={styles.timetableArea}>
            {timetable.schedule?.map((day, i) => (
              <div key={i} className={styles.dayCard}>
                <span className={styles.dayLabel}>{day.day}</span>
                {day.sessions.length === 0 && <span className={styles.restDay}>Rest day</span>}
                {day.sessions.map((s, j) => (
                  <div key={j} className={styles.session}>
                    <span className={styles.sessionSubject}>{s.subject}</span>
                    <span className={styles.sessionDuration}>{s.duration}</span>
                  </div>
                ))}
              </div>
            ))}

            {timetable.tip && <p className={styles.tip}>💡 {timetable.tip}</p>}

            <button className={styles.newBtn} onClick={() => { setTimetable(null); setSubjectsInput(""); }}>
              Create New Timetable
            </button>
          </div>
        )}
      </div>
    </div>
  );
    }
