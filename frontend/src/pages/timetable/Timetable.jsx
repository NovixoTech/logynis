import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Timetable.module.css";

function getDaysLeft(examDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
}

function getCountdownStyle(daysLeft) {
  if (daysLeft < 0) return { color: "#9ca3af", border: "1px solid #9ca3af", label: "Passed" };
  if (daysLeft === 0) return { color: "#ef4444", border: "1px solid #ef4444", label: "TODAY! 🔴" };
  if (daysLeft <= 3) return { color: "#ef4444", border: "1px solid #ef4444", label: `${daysLeft} days left` };
  if (daysLeft <= 7) return { color: "#f59e0b", border: "1px solid #f59e0b", label: `${daysLeft} days left` };
  return { color: "#10b981", border: "1px solid #10b981", label: `${daysLeft} days left` };
}

export default function Timetable() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: "", examDate: "", examTime: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { loadExams(); }, []);

  async function loadExams() {
    try {
      const res = await authFetch("/exam/list");
      const data = await res.json();
      setExams(data);
    } catch (err) {
      setError("Failed to load exams");
    } finally {
      setLoading(false);
    }
  }

  async function addExam() {
    if (!form.subject || !form.examDate) {
      setError("Subject and date are required"); return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch("/exam/add", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add exam");
      setShowModal(false);
      setForm({ subject: "", examDate: "", examTime: "", notes: "" });
      loadExams();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteExam(id) {
    try {
      await authFetch(`/exam/${id}`, { method: "DELETE" });
      setExams(exams.filter((e) => e.id !== id));
    } catch {}
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate("/dashboard")}>← Dashboard</button>
        <h1 className={styles.title}>📅 Exam Timetable</h1>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>+ Add Exam</button>
      </header>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.empty}>Loading your exams...</div>
        ) : exams.length === 0 ? (
          <div className={styles.empty}>
            <span>📅</span>
            <p>No exams added yet</p>
            <button className={styles.addBtn} onClick={() => setShowModal(true)}>Add your first exam</button>
          </div>
        ) : (
          <div className={styles.list}>
            {exams.map((exam) => {
              const daysLeft = getDaysLeft(exam.examDate);
              const style = getCountdownStyle(daysLeft);
              return (
                <div key={exam.id} className={styles.card}>
                  <div className={styles.cardLeft}>
                    <div className={styles.subject}>📚 {exam.subject}</div>
                    <div className={styles.date}>
                      {new Date(exam.examDate).toLocaleDateString("en-GB", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric"
                      })}
                      {exam.examTime && ` at ${exam.examTime}`}
                    </div>
                    {exam.notes && <div className={styles.notes}>📝 {exam.notes}</div>}
                  </div>
                  <div className={styles.cardRight}>
                    <span className={styles.countdown} style={{ color: style.color, borderColor: style.color }}>
                      {style.label}
                    </span>
                    <button className={styles.deleteBtn} onClick={() => deleteExam(exam.id)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Add Exam</h2>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.field}>
              <label className={styles.label}>Subject *</label>
              <input className={styles.input} placeholder="e.g. Mathematics" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Exam Date *</label>
              <input className={styles.input} type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Exam Time</label>
              <input className={styles.input} type="time" value={form.examTime} onChange={(e) => setForm({ ...form, examTime: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Notes (optional)</label>
              <textarea className={styles.textarea} placeholder="Any notes about this exam..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={addExam} disabled={saving}>
                {saving ? "Saving..." : "Save Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
            }
