// Draft page for Memory Aid Generator
// NOT wired into router yet - standalone for future integration

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./MemoryAid.module.css";

const FORMATS = [
  { id: "auto", label: "Let AI Choose" },
  { id: "mnemonic", label: "Acronym / Mnemonic" },
  { id: "rhyme", label: "Rhyme" },
  { id: "song", label: "Song / Jingle" },
  { id: "story", label: "Memory Story" },
];

export default function MemoryAid() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("auto");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    if (!topic.trim()) {
      setError("Please enter a topic first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await authFetch("/future/memory-aid", {
        method: "POST",
        body: JSON.stringify({ topic, format }),
      });

      if (!res.ok) throw new Error("Failed to generate memory aid");

      const data = await res.json();
      setResult(data.text);
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
        <h1 className={styles.title}>Memory Aid Generator</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label}>What do you want to remember?</label>
          <textarea
            className={styles.textarea}
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. The Krebs cycle steps, the planets in order, key dates in Nigerian independence..."
            rows={3}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Format</label>
          <div className={styles.formatOptions}>
            {FORMATS.map(f => (
              <button
                key={f.id}
                className={`${styles.formatBtn} ${format === f.id ? styles.formatBtnActive : ""}`}
                onClick={() => setFormat(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button className={styles.generateBtn} onClick={generate} disabled={loading}>
          {loading ? "Generating..." : "Generate Memory Aid"}
        </button>

        {result && (
          <div className={styles.result}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
        }
