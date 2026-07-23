// Draft page for Debate/Argument Practice
// NOT wired into router yet - standalone for future integration

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./DebatePractice.module.css";

export default function DebatePractice() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [setupDone, setSetupDone] = useState(false);
  const [topic, setTopic] = useState("");
  const [position, setPosition] = useState("");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startDebate() {
    if (!topic.trim() || !position.trim()) {
      setError("Please fill in both fields");
      return;
    }
    setError(null);
    setSetupDone(true);
    send("Let's begin the debate.");
  }

  async function send(overrideText) {
    const text = overrideText || input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch("/api/debate-practice", {
        method: "POST",
        body: JSON.stringify({ topic, studentPosition: position, messages: updated }),
      });

      if (!res.ok) throw new Error("Failed to get a response");

      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.text }]);
    } catch (e) {
      setError(e.message);
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Debate Practice</h1>
      </div>

      {!setupDone && (
        <div className={styles.setup}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>Debate topic</label>
            <input
              className={styles.input}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Should social media be regulated by the government?"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Your position (what you're arguing FOR)</label>
            <textarea
              className={styles.textarea}
              value={position}
              onChange={e => setPosition(e.target.value)}
              placeholder="e.g. I believe government regulation is necessary to protect users..."
              rows={3}
            />
          </div>

          <button className={styles.startBtn} onClick={startDebate}>
            Start Debate
          </button>
        </div>
      )}

      {setupDone && (
        <div className={styles.debateArea}>
          <div className={styles.debateHeader}>
            <span className={styles.topicLabel}>{topic}</span>
            <span className={styles.positionLabel}>You argue: {position}</span>
          </div>

          <div className={styles.messages}>
            {messages.filter(m => m.content !== "Let's begin the debate.").map((msg, i) => (
              <div key={i} className={`${styles.msg} ${msg.role === "user" ? styles.userMsg : styles.aiMsg}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className={styles.aiMsg}>Thinking of a counter-argument...</div>}
            {error && <div className={styles.error}>{error}</div>}
            <div ref={bottomRef} />
          </div>

          <div className={styles.inputBar}>
            <textarea
              className={styles.chatInput}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Make your argument..."
              rows={2}
              disabled={loading}
            />
            <button className={styles.sendBtn} onClick={() => send()} disabled={!input.trim() || loading}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
