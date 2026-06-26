import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import educationConfig, { courseFields, goals, countries } from "../../config/education.js";
import styles from "./Auth.module.css";

const TOTAL_STEPS = 7;

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "", email: "", password: "",
    country: "", educationLevel: "", subLevel: "",
    examType: "", subjects: [], courseField: "", courseName: "", goal: "",
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function toggleSubject(subject) {
    setForm((prev) => {
      const has = prev.subjects.includes(subject);
      if (has) return { ...prev, subjects: prev.subjects.filter((s) => s !== subject) };
      // JAMB: English mandatory + 3 others
      if (prev.subLevel === "JAMB" && subject !== "English Language" && prev.subjects.filter((s) => s !== "English Language").length >= 3) return prev;
      return { ...prev, subjects: [...prev.subjects, subject] };
    });
  }

  function validate() {
    if (step === 1 && (!form.name || !form.email || !form.password)) {
      setError("Please fill in all fields"); return false;
    }
    if (step === 1 && form.password.length < 6) {
      setError("Password must be at least 6 characters"); return false;
    }
    if (step === 2 && !form.country) { setError("Please select your country"); return false; }
    if (step === 3 && !form.educationLevel) { setError("Please select your education level"); return false; }
    if (step === 4 && !form.subLevel) { setError("Please select your level"); return false; }
    if (step === 5 && form.subjects.length === 0) { setError("Please select at least one subject"); return false; }
    if (step === 7 && !form.goal) { setError("Please select your goal"); return false; }
    return true;
  }

  async function handleNext() {
    if (!validate()) return;
    const isTertiary = ["Tertiary", "University", "College", "Tertiary Institution"].some(
      (t) => form.educationLevel?.includes(t) || form.subLevel?.includes(t)
    );

    // Skip subject step for tertiary (go to course field instead)
    if (step === 4 && isTertiary) { setStep(6); return; }
    // Skip course field for non-tertiary
    if (step === 5 && !isTertiary) { setStep(7); return; }

    if (step < TOTAL_STEPS) { setStep(step + 1); return; }

    // Final step — submit
    setLoading(true);
    setError(null);
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      await signup({ ...form, referredBy: ref || null });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    const isTertiary = ["Tertiary", "University", "College", "Tertiary Institution"].some(
      (t) => form.educationLevel?.includes(t) || form.subLevel?.includes(t)
    );
    if (step === 6 && isTertiary) { setStep(4); return; }
    if (step === 7 && !isTertiary) { setStep(5); return; }
    setStep(step - 1);
  }

  const config = educationConfig[form.country] || {};
  const subLevels = config.subLevels?.[form.educationLevel] || [];
  const subjects = config.subjects || [];
  const isTertiary = ["Tertiary", "University", "College", "Tertiary Institution"].some(
    (t) => form.educationLevel?.includes(t) || form.subLevel?.includes(t)
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>S</div>
          <span className={styles.logoText}>StudySphere</span>
        </div>

        <p className={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <h1 className={styles.title}>Create your account</h1>
            <p className={styles.subtitle}>Free forever. No credit card needed.</p>
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input className={styles.input} placeholder="Your full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" placeholder="your@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input className={styles.input} type="password" placeholder="Min. 6 characters" value={form.password} onChange={(e) => update("password", e.target.value)} />
            </div>
          </>
        )}

        {/* Step 2: Country */}
        {step === 2 && (
          <>
            <h1 className={styles.title}>Where are you from? 🌍</h1>
            <p className={styles.subtitle}>We'll personalise your experience based on your country.</p>
            <div className={styles.field}>
              <label className={styles.label}>Country</label>
              <select className={styles.select} value={form.country} onChange={(e) => { update("country", e.target.value); update("educationLevel", ""); update("subLevel", ""); }}>
                <option value="">Select your country</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Step 3: Education Level */}
        {step === 3 && (
          <>
            <h1 className={styles.title}>Your education level</h1>
            <p className={styles.subtitle}>This helps us set the right difficulty for you.</p>
            <div className={styles.field}>
              <label className={styles.label}>Education Level</label>
              <select className={styles.select} value={form.educationLevel} onChange={(e) => { update("educationLevel", e.target.value); update("subLevel", ""); }}>
                <option value="">Select level</option>
                {(config.levels || []).map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Step 4: Sub Level */}
        {step === 4 && (
          <>
            <h1 className={styles.title}>Which class or exam?</h1>
            <p className={styles.subtitle}>We'll tailor the AI to match exactly.</p>
            <div className={styles.field}>
              <label className={styles.label}>Your Level</label>
              <select className={styles.select} value={form.subLevel} onChange={(e) => update("subLevel", e.target.value)}>
                <option value="">Select your level</option>
                {subLevels.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Step 5: Subjects */}
        {step === 5 && !isTertiary && (
          <>
            <h1 className={styles.title}>Your subjects 📚</h1>
            <p className={styles.subtitle}>
              {form.subLevel === "JAMB" ? "English is mandatory. Pick 3 more." : "Select all subjects you study."}
            </p>
            <div className={styles.subjectsGrid}>
              {subjects.map((s) => {
                const mandatory = form.subLevel === "JAMB" && s === "English Language";
                const selected = form.subjects.includes(s) || mandatory;
                return (
                  <div
                    key={s}
                    className={`${styles.subjectChip} ${selected ? styles.selected : ""}`}
                    onClick={() => !mandatory && toggleSubject(s)}
                  >
                    {s} {mandatory ? "✓" : ""}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Step 6: Course Field (Tertiary only) */}
        {step === 6 && (
          <>
            <h1 className={styles.title}>Your field of study</h1>
            <p className={styles.subtitle}>What are you studying at university?</p>
            <div className={styles.field}>
              <label className={styles.label}>Course Field</label>
              <select className={styles.select} value={form.courseField} onChange={(e) => update("courseField", e.target.value)}>
                <option value="">Select field</option>
                {courseFields.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Course Name (optional)</label>
              <input className={styles.input} placeholder="e.g. Computer Science, Medicine" value={form.courseName} onChange={(e) => update("courseName", e.target.value)} />
            </div>
          </>
        )}

        {/* Step 7: Goal */}
        {step === 7 && (
          <>
            <h1 className={styles.title}>What's your main goal? 🎯</h1>
            <p className={styles.subtitle}>We'll focus your AI tutor on what matters most.</p>
            <div className={styles.field}>
              {goals.map((g) => (
                <div
                  key={g}
                  className={`${styles.subjectChip} ${form.goal === g ? styles.selected : ""}`}
                  style={{ marginBottom: "0.5rem", display: "block", textAlign: "left", padding: "0.875rem 1rem" }}
                  onClick={() => update("goal", g)}
                >
                  {g === "Exams" && "🎯 "}{g === "Daily Study" && "📖 "}{g === "Homework Help" && "✏️ "}{g}
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.navBtns}>
          {step > 1 && (
            <button className={styles.btnSecondary} onClick={handleBack}>← Back</button>
          )}
          <button className={styles.btn} onClick={handleNext} disabled={loading}>
            {loading ? "Creating account..." : step === TOTAL_STEPS ? "Start Learning 🚀" : "Next →"}
          </button>
        </div>

        {step === 1 && (
          <p className={styles.switchText}>
            Already have an account?{" "}
            <Link to="/login" className={styles.link}>Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}
