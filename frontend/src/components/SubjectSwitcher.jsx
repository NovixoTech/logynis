// Draft component for Multi-Subject Session subject switcher
// NOT wired into Homework chat yet - standalone for future integration
// Meant to sit in the Homework chat header, letting students tag/switch subjects mid-conversation

import { useState } from "react";
import styles from "./SubjectSwitcher.module.css";

export default function SubjectSwitcher({ activeSubject, subjectHistory, onSubjectChange }) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  function handleSwitch() {
    if (!inputValue.trim()) return;
    onSubjectChange(inputValue.trim());
    setInputValue("");
    setEditing(false);
  }

  return (
    <div className={styles.wrapper}>
      {!editing && (
        <button className={styles.currentSubject} onClick={() => setEditing(true)}>
          {activeSubject ? `📚 ${activeSubject}` : "📚 Set subject"}
          {subjectHistory.length > 0 && <span className={styles.count}>+{subjectHistory.length} earlier</span>}
        </button>
      )}

      {editing && (
        <div className={styles.editRow}>
          <input
            className={styles.input}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSwitch()}
            placeholder="Switch to subject..."
            autoFocus
          />
          <button className={styles.confirmBtn} onClick={handleSwitch}>Set</button>
          <button className={styles.cancelBtn} onClick={() => setEditing(false)}>✕</button>
        </div>
      )}
    </div>
  );
          }
