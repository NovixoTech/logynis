// Draft page for Definition/Glossary Builder ("My Glossary" tab)
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Glossary.module.css";

export default function Glossary() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [terms, setTerms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTerms();
  }, []);

  async function loadTerms(search = "") {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await authFetch(`/future/glossary${params}`);
      if (!res.ok) throw new Error("Failed to load glossary");
      const data = await res.json();
      setTerms(data.terms || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addTerm() {
    if (!newTerm.trim()) {
      setError("Please enter a term");
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const res = await authFetch("/future/glossary/add", {
        method: "POST",
        body: JSON.stringify({ term: newTerm }),
      });

      if (!res.ok) throw new Error("Failed to add term");

      setNewTerm("");
      loadTerms(searchQuery);
    } catch (e) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function deleteTerm(id) {
    try {
      await authFetch(`/future/glossary/${id}`, { method: "DELETE" });
      loadTerms(searchQuery);
    } catch (e) {
      // silent
    }
  }

  function handleSearch(value) {
    setSearchQuery(value);
    loadTerms(value);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>My Glossary</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.addRow}>
          <input
            className={styles.input}
            value={newTerm}
            onChange={e => setNewTerm(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTerm()}
            placeholder="Add a new term..."
          />
          <button className={styles.addBtn} onClick={addTerm} disabled={adding}>
            {adding ? "..." : "Add"}
          </button>
        </div>

        <input
          className={styles.searchInput}
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search your glossary..."
        />

        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && terms.length === 0 && (
          <p className={styles.empty}>Your glossary is empty. Add terms manually, or they'll build up automatically as you study.</p>
        )}

        <div className={styles.termsList}>
          {terms.map(t => (
            <div key={t.id} className={styles.termCard}>
              <div className={styles.termHeader}>
                <span className={styles.termName}>{t.term}</span>
                <button className={styles.deleteBtn} onClick={() => deleteTerm(t.id)}>✕</button>
              </div>
              <p className={styles.termDefinition}>{t.definition}</p>
              {t.subject && <span className={styles.termSubject}>{t.subject}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
    }
