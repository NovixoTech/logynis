import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Chat.module.css";

const MODE_CONFIG = {
  study: {
    label: "Study",
    icon: "📖",
    color: "var(--mode-study)",
    placeholder: "Ask me anything to explain...",
    welcome: "What would you like to understand today?",
  },
  exam: {
    label: "Exam Prep",
    icon: "🎯",
    color: "var(--mode-exam)",
    placeholder: "Enter a topic for practice questions...",
    welcome: "What topic or subject are you preparing for?",
  },
  homework: {
    label: "Homework",
    icon: "✏️",
    color: "var(--mode-homework)",
    placeholder: "Paste your homework question...",
    welcome: "Share your homework question and I'll walk you through it.",
  },
  revision: {
    label: "Revision",
    icon: "🔁",
    color: "var(--mode-revision)",
    placeholder: "Enter a topic to revise...",
    welcome: "What topic do you want to revise?",
  },
  motivation: {
    label: "Motivation",
    icon: "⚡",
    color: "var(--mode-motivation)",
    placeholder: "Tell me how you're feeling...",
    welcome: "How are you doing? Let's get you in the zone.",
  },
};

const API_URL = "https://studysphere-api-production.up.railway.app";
const MAX_STORED_MESSAGES = 50;

function getStorageKey(mode) {
  return `studysphere_chat_${mode}`;
}

function loadMessages(mode) {
  try {
    const stored = localStorage.getItem(getStorageKey(mode));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMessages(mode, messages) {
  try {
    // Only keep last 50 messages to avoid storage limits
    const toSave = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(getStorageKey(mode), JSON.stringify(toSave));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

function getFriendlyError(err) {
  const msg = err.message || "";
  if (msg.includes("rate limit") || msg.includes("429")) {
    return "The AI is a bit busy right now. Wait a moment and try again.";
  }
  if (msg.includes("Failed to fetch") || msg.includes("network")) {
    return "Can't reach the server. Check your connection and try again.";
  }
  if (msg.includes("All AI providers failed")) {
    return "All AI services are busy right now. Please try again in a minute.";
  }
  if (msg.includes("API key")) {
    return "There's a configuration issue. Please contact support.";
  }
  return "Something went wrong. Please try again.";
}

export default function Chat() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const config = MODE_CONFIG[mode] || MODE_CONFIG.study;

  const [messages, setMessages] = useState(() => loadMessages(mode));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [saved, setSaved] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Track online/offline
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(mode, messages);
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 1500);
      return () => clearTimeout(t);
    }
  }, [messages, mode]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const cleanMessages = updatedMessages.map(({ role, content }) => ({ role, content }));

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: cleanMessages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage = {
        role: "assistant",
        content: data.text,
        provider: data.provider,
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (err) {
      setError(getFriendlyError(err));
      // Remove user message if it failed so they can try again
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    localStorage.removeItem(getStorageKey(mode));
  }

  return (
    <div className={styles.page} style={{ "--mode-color": config.color }}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate("/")}>
          ← Back
        </button>
        <div className={styles.modeInfo}>
          <span className={styles.modeIcon}>{config.icon}</span>
          <span className={styles.modeLabel}>{config.label}</span>
        </div>
        <div className={styles.headerRight}>
          {isOffline && <span className={styles.offlineBadge}>Offline</span>}
          {saved && <span className={styles.savedBadge}>Saved</span>}
          {messages.length > 0 && (
            <button className={styles.clearBtn} onClick={clearChat}>
              Clear
            </button>
          )}
        </div>
      </header>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.welcome}>
            <span className={styles.welcomeIcon}>{config.icon}</span>
            <p className={styles.welcomeText}>{config.welcome}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.message} ${msg.role === "user" ? styles.user : styles.assistant}`}
          >
            {msg.role === "assistant" && (
              <span className={styles.msgIcon}>{config.icon}</span>
            )}
            <div className={styles.msgContent}>
              <div
                className={`${styles.msgBubble} ${msg.role === "assistant" ? "ai-response" : ""}`}
                dangerouslySetInnerHTML={
                  msg.role === "assistant"
                    ? { __html: formatResponse(msg.content) }
                    : undefined
                }
              >
                {msg.role === "user" ? msg.content : undefined}
              </div>
              {msg.provider && (
                <span className={styles.provider}>via {msg.provider}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <span className={styles.msgIcon}>{config.icon}</span>
            <div className={styles.msgContent}>
              <div className={styles.msgBubble}>
                <div className={styles.typing}>
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            ⚠️ {error}
            <button className={styles.retryBtn} onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputBox}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isOffline ? "You're offline..." : config.placeholder}
            rows={1}
            disabled={loading || isOffline}
          />
          <button
            className={styles.sendBtn}
            onClick={sendMessage}
            disabled={!input.trim() || loading || isOffline}
          >
            {loading ? "..." : "→"}
          </button>
        </div>
        <p className={styles.hint}>Enter to send · Shift+Enter for new line · Chats saved automatically</p>
      </div>
    </div>
  );
}

function formatResponse(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^(?!<[hup])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
    }
