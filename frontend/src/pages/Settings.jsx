import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconLogout } from "../components/Icons.jsx";
import styles from "./Settings.module.css";

export default function Settings() {
  const { user, logout, authFetch, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [educationLevel, setEducationLevel] = useState(user?.educationlevel || "");
  const [examType, setExamType] = useState(user?.examtype || "");
  const [courseName, setCourseName] = useState(user?.coursename || "");
  const [subjects, setSubjects] = useState(user?.subjects || "");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await authFetch("/user/update", {
        method: "PUT",
        body: JSON.stringify({
          name,
          educationLevel,
          examType,
          courseName,
          subjects,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const updated = await res.json();
      updateUser(updated);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          className={styles.back}
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h1 className={styles.title}>Settings</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>Saved!</div>}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>

          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Education Level</label>
            <select
              className={styles.input}
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
            >
              <option value="">Select your level</option>
              <option value="Secondary School">Secondary School</option>
              <option value="Entrance Exam">Entrance Exam</option>
              <option value="Tertiary Institution">Tertiary Institution</option>
            </select>
          </div>

          {educationLevel === "Entrance Exam" && (
            <div className={styles.field}>
              <label className={styles.label}>Exam Type</label>
              <select
                className={styles.input}
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
              >
                <option value="">Select exam type</option>
                <option value="JAMB">JAMB</option>
                <option value="WAEC">WAEC</option>
                <option value="SAT">SAT</option>
                <option value="GCSE">GCSE</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {educationLevel === "Tertiary Institution" && (
            <div className={styles.field}>
              <label className={styles.label}>Course Name</label>
              <input
                className={styles.input}
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Subjects</label>
            <input
              className={styles.input}
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              placeholder="e.g. Maths, Physics, English"
            />
          </div>

          <button
            className={styles.saveBtn}
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Session</h2>

          <button
            className={styles.logoutBtn}
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <IconLogout size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
