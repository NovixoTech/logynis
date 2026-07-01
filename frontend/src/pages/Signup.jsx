import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./Auth.module.css";

const EXAM_TYPES = ["JAMB", "WAEC", "SAT", "GCSE", "Other"];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [examType, setExamType] = useState("");
  const [courseName, setCourseName] = useState("");
  const [subjectBoxes, setSubjectBoxes] = useState(["", "", ""]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function nextFromStep1() {
    if (!name || !password) { setError("Please fill in all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(null);
    setStep(2);
  }

  function nextFromStep2() {
    if (!educationLevel) { setError("Please select your education level"); return; }
    setError(null);
    setStep(3);
  }

  function updateSubjectBox(index, value) {
    const updated = [...subjectBoxes];
    updated[index] = value;
    setSubjectBoxes(updated);
  }

  function addSubjectBox() {
    if (subjectBoxes.length >= 20) return;
    setSubjectBoxes([...subjectBoxes, ""]);
  }

  async function handleFinish() {
    if (educationLevel === "Entrance Exam" && !examType) { setError("Please select your exam type"); return; }
    if (educationLevel === "Tertiary Institution" && !courseName) { setError("Please enter your course name"); return; }

    const subjects = subjectBoxes.map(s => s.trim()).filter(Boolean);
    if (subjects.length === 0) { setError("Please enter at least one subject"); return; }

    setLoading(true); setError(null);
    try {
      await signup(name, password, {
        educationLevel,
        examType: educationLevel === "Entrance Exam" ? examType : undefined,
        courseName: educationLevel === "Tertiary Institution" ? courseName : undefined,
        subjects: subjects.join(", "),
      });
      navigate("/chat/study");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img src="/logo.png" alt="Logynis" className={styles.logoMark} />
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.sub}>Free forever. No credit card needed.</p>

        {error && <div className={styles.error}>{error}</div>}

        {step === 1 && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input className={styles.input} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input className={styles.input} type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && nextFromStep1()} />
            </div>
            <button className={styles.btn} onClick={nextFromStep1}>Next</button>
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Education Level</label>
              <select className={styles.input} value={educationLevel} onChange={e => setEducationLevel(e.target.value)}>
                <option value="">Select your level</option>
                <option value="Secondary School">Secondary School</option>
                <option value="Entrance Exam">Entrance Exam</option>
                <option value="Tertiary Institution">Tertiary Institution</option>
              </select>
            </div>
            <button className={styles.btn} onClick={nextFromStep2}>Next</button>
            <button className={styles.link} style={{ marginTop: "0.75rem", background: "none", border: "none", cursor: "pointer" }} onClick={() => setStep(1)}>Back</button>
          </>
        )}

        {step === 3 && (
          <>
            {educationLevel === "Entrance Exam" && (
              <div className={styles.field}>
                <label className={styles.label}>Exam Type</label>
                <select className={styles.input} value={examType} onChange={e => setExamType(e.target.value)}>
                  <option value="">Select exam type</option>
                  {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            {educationLevel === "Tertiary Institution" && (
              <div className={styles.field}>
                <label className={styles.label}>Course Name</label>
                <input className={styles.input} placeholder="e.g. Computer Science" value={courseName} onChange={e => setCourseName(e.target.value)} />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Your Subjects</label>
              <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.5rem" }}>
                Add each subject one at a time
              </p>
              {subjectBoxes.map((subj, i) => (
                <input
                  key={i}
                  className={styles.input}
                  style={{ marginBottom: "0.5rem" }}
                  placeholder={`Subject ${i + 1}`}
                  value={subj}
                  onChange={e => updateSubjectBox(i, e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleFinish()}
                />
              ))}
              {subjectBoxes.length < 20 && (
                <button
                  type="button"
                  onClick={addSubjectBox}
                  style={{
                    background: "none",
                    border: "1px dashed #999",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    width: "100%",
                    cursor: "pointer",
                    color: "#555",
                    fontSize: "0.85rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  + Add another subject
                </button>
              )}
            </div>

            <button className={styles.btn} onClick={handleFinish} disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
            <button className={styles.link} style={{ marginTop: "0.75rem", background: "none", border: "none", cursor: "pointer" }} onClick={() => setStep(2)}>Back</button>
          </>
        )}

        <p className={styles.switch}>Already have an account? <Link to="/login" className={styles.link}>Login</Link></p>
      </div>
    </div>
  );
}
