import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Chat.css";

/* ── Mode config (no emojis) ───────────────────────── */
const MODES = {
  study: {
    label: "Study",
    placeholder: "Ask me anything to explain...",
    welcome: "What would you like to understand today?",
  },
  exam: {
    label: "Exam Prep",
    placeholder: "Enter a topic for practice questions...",
    welcome: "What topic or subject are you preparing for?",
  },
  homework: {
    label: "Homework",
    placeholder: "Paste your homework question...",
    welcome: "Share your homework question and I'll walk you through it.",
  },
  revision: {
    label: "Revision",
    placeholder: "Enter a topic to revise...",
    welcome: "What topic do you want to revise?",
  },
  motivation: {
    label: "Motivation",
    placeholder: "Tell me how you're feeling...",
    welcome: "How are you doing? Let's get you in the zone.",
  },
};

const MAX_STORED_MESSAGES = 50;
function getStorageKey(mode) { return `studysphere_chat_${mode}`; }
function loadMessages(mode) {
  try { return JSON.parse(localStorage.getItem(getStorageKey(mode)) || "[]"); }
  catch { return []; }
}
function saveMessages(mode, messages) {
  try { localStorage.setItem(getStorageKey(mode), JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))); }
  catch {}
}
function getFriendlyError(err) {
  const msg = err.message || "";
  if (msg.includes("rate limit") || msg.includes("429")) return "The AI is busy right now. Wait a moment and try again.";
  if (msg.includes("Failed to fetch") || msg.includes("network")) return "Can't reach the server. Check your connection.";
  if (msg.includes("All AI providers failed")) return "All AI services are busy. Please try again in a minute.";
  if (msg.includes("Unauthorized") || msg.includes("401")) return "Your session expired. Please sign in again.";
  return "Something went wrong. Please try again.";
}
function formatResponse(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
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

/* ── SVG Icons ─────────────────────────────────────── */
const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#ffffff" fillOpacity="0.12" />
    <path d="M10 22 L16 10 L22 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 18 H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconStudy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconExam = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IconHomework = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const IconRevision = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
  </svg>
);
const IconMotivation = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const SIDEBAR_MODES = [
  { id: "study",      Icon: IconStudy },
  { id: "exam",       Icon: IconExam },
  { id: "homework",   Icon: IconHomework },
  { id: "revision",   Icon: IconRevision },
  { id: "motivation", Icon: IconMotivation },
];

/* ── Main Component ─────────────────────────────────── */
export default function Chat() {
  const navigate = useNavigate();
  const { token, user, authFetch } = useAuth();

  const [activeMode, setActiveMode] = useState("study");
  const [messages, setMessages] = useState(() => loadMessages("study"));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const config = MODES[activeMode];

  // Switch mode — load that mode's saved messages
  function switchMode(mode) {
    setActiveMode(mode);
    setMessages(loadMessages(mode));
    setError(null);
    setInput("");
  }

  useEffect(() => {
    const onOnline  = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  useEffect(() => {
    if (messages.length > 0) saveMessages(activeMode, messages);
  }, [messages, activeMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
      let res;
      if (token && authFetch) {
        res = await authFetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({ mode: activeMode, messages: cleanMessages }),
        });
      } else {
        res = await fetch("https://studysphere-api-production.up.railway.app/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: activeMode, messages: cleanMessages }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.text, provider: data.provider }]);
    } catch (err) {
      setError(getFriendlyError(err));
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    localStorage.removeItem(getStorageKey(activeMode));
  }

  return (
    <div className="chat-layout">

      {/* ── Sidebar ──────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo"><Logo /></div>
          <nav className="sidebar-nav">
            {SIDEBAR_MODES.map(({ id, Icon }) => (
              <button
                key={id}
                className={`nav-btn${activeMode === id ? " active" : ""}`}
                onClick={() => switchMode(id)}
                title={MODES[id].label}
                aria-label={MODES[id].label}
              >
                <Icon />
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-btn" onClick={() => navigate("/settings")} title="Settings" aria-label="Settings">
            <IconSettings />
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────── */}
      <main className="chat-main">

        {/* Top bar */}
        <div className="chat-topbar">
          <span className="topbar-mode">{config.label}</span>
          <div className="topbar-right">
            {isOffline && <span className="badge badge-offline">Offline</span>}
            {messages.length > 0 && (
              <button className="clear-btn" onClick={clearChat}>Clear</button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p className="chat-empty-title">{config.welcome}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message message-${msg.role}`}>
              {msg.role === "assistant" && <div className="msg-avatar"><Logo /></div>}
              <div className="msg-content">
                <div
                  className="msg-bubble"
                  dangerouslySetInnerHTML={msg.role === "assistant"
                    ? { __html: formatResponse(msg.content) }
                    : undefined}
                >
                  {msg.role === "user" ? msg.content : undefined}
                </div>
                {msg.provider && <span className="msg-provider">via {msg.provider}</span>}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message message-assistant">
              <div className="msg-avatar"><Logo /></div>
              <div className="msg-content">
                <div className="msg-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="chat-error">
              {error}
              <button className="dismiss-btn" onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-box">
            <textarea
              ref={textareaRef}
              className="input-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isOffline ? "You're offline..." : config.placeholder}
              rows={1}
              disabled={loading || isOffline}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading || isOffline}
              aria-label="Send"
            >
              <IconSend />
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
    }
