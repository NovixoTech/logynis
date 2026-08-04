// Draft page for student-side: generating a code to link a parent
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./ParentLinkSetup.module.css";

export default function ParentLinkSetup() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [parentEmail, setParentEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [linkCode, setLinkCode] = useState(null);
  const [existingLink, setExistingLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkExisting();
  }, []);

  async function checkExisting() {
    try {
      const res = await authFetch("/future/parent-link/status");
      if (res.ok) {
        const data = await res.json();
        if (data.link) setExistingLink(data.link);
      }
    } catch (e) {
      // silent
    }
  }

  async function generateCode() {
    if (!parentEmail.trim()) {
      setError("Please enter your parent/guardian's email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("/future/parent-link/generate", {
        method: "POST",
        body: JSON.stringify({ parentEmail, parentName }),
      });

      if (!res.ok) throw new Error("Failed to generate code");

      const data = await res.json();
      setLinkCode(data.linkCode);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Connect a Parent/Guardian</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        <p className={styles.explainer}>
          Your parent or guardian can see your streaks, points, and which subjects you've been studying —
          but never your actual conversations, which stay private to you.
        </p>

        {existingLink && (
          <div className={styles.statusCard}>
            <p>Status: <strong>{existingLink.status === "confirmed" ? "Connected" : "Waiting for confirmation"}</strong></p>
            {existingLink.status === "pending" && <p className={styles.code}>Code: {existingLink.linkcode}</p>}
          </div>
        )}

        {!existingLink && !linkCode && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Parent/guardian's name (optional)</label>
              <input className={styles.input} value={parentName} onChange={e => setParentName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Parent/guardian's email</label>
              <input className={styles.input} type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
            </div>
            <button className={styles.generateBtn} onClick={generateCode} disabled={loading}>
              {loading ? "Generating..." : "Generate Connection Code"}
            </button>
          </>
        )}

        {linkCode && (
          <div className={styles.codeResult}>
            <p>Share this code with your parent/guardian:</p>
            <div className={styles.codeBox}>{linkCode}</div>
          </div>
        )}
      </div>
    </div>
  );
}
