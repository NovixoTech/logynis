// Draft page for One-Pager Generator
// NOT wired into router yet - standalone for future integration

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./OnePager.module.css";

export default function OnePager() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [topic, setTopic] = useState("");
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    if (!topic.trim()) {
      setError("Please enter a topic first");
      return;
    }

    setLoading(true);
    setError(null);
    setPage(null);

    try {
      const res = await authFetch("/future/one-pager", {
        method: "POST",
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) throw new Error("Failed to generate one-pager");

      const data = await res.json();
      setPage(data.page);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>One-Pager Generator</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {!page && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>What topic do you want condensed?</label>
              <textarea
                className={styles.textarea}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. World War 2 causes, Newton's laws of motion..."
                rows={3}
              />
            </div>
            <button className={styles.generateBtn} onClick={generate} disabled={loading}>
              {loading ? "Condensing..." : "Generate One-Pager"}
            </button>
          </>
        )}

        {page && (
          <div className={styles.pageWrapper}>
            <div className={styles.onePager}>
              <h2 className={styles.pageTitle}>{page.title}</h2>
              {page.sections?.map((s, i) => (
                <div key={i} className={styles.section}>
                  <h3 className={styles.sectionHeading}>{s.heading}</h3>
                  <ul className={styles.pointsList}>
                    {s.points.map((p, j) => <li key={j}>{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <button className={styles.printBtn} onClick={handlePrint}>Print / Save as PDF</button>
              <button className={styles.newBtn} onClick={() => { setPage(null); setTopic(""); }}>New Topic</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
