// Draft page for Concept Map
// NOT wired into router yet - standalone for future integration

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./ConceptMap.module.css";

export default function ConceptMap() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [topic, setTopic] = useState("");
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    if (!topic.trim()) {
      setError("Please enter a topic first");
      return;
    }

    setLoading(true);
    setError(null);
    setMap(null);

    try {
      const res = await authFetch("/api/concept-map", {
        method: "POST",
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) throw new Error("Failed to generate concept map");

      const data = await res.json();
      setMap(data.map);
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
        <h1 className={styles.title}>Concept Map</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {!map && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>What topic do you want to explore?</label>
              <textarea
                className={styles.textarea}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Cellular respiration, supply and demand, the French Revolution..."
                rows={3}
              />
            </div>
            <button className={styles.generateBtn} onClick={generate} disabled={loading}>
              {loading ? "Building map..." : "Build Concept Map"}
            </button>
          </>
        )}

        {map && (
          <div className={styles.mapArea}>
            <div className={styles.centralNode}>{map.central}</div>

            <div className={styles.connector} />

            <div className={styles.nodesList}>
              {map.nodes?.map((node, i) => (
                <div key={i} className={styles.node}>
                  <span className={styles.nodeLabel}>{node.label}</span>
                  <span className={styles.nodeConnection}>{node.connection}</span>
                </div>
              ))}
            </div>

            {map.insight && (
              <div className={styles.insight}>
                <strong>Why this matters:</strong> {map.insight}
              </div>
            )}

            <button className={styles.newBtn} onClick={() => { setMap(null); setTopic(""); }}>
              New Topic
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
