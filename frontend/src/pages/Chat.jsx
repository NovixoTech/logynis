import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconStudy, IconExam, IconHomework, IconRevision, IconMotivation, IconSettings, IconUser, IconSend, IconPlus } from "../components/Icons.jsx";
import styles from "./Chat.module.css";

const MODES = [
  { id: "study",      label: "Study",      Icon: IconStudy,      color: "var(--mode-study)",      placeholder: "Ask anything to understand..." },
  { id: "exam",       label: "Exam Prep",  Icon: IconExam,       color: "var(--mode-exam)",       placeholder: "Enter a topic for practice questions..." },
  { id: "homework",   label: "Homework",   Icon: IconHomework,   color: "var(--mode-homework)",   placeholder: "Paste your homework question..." },
  { id: "revision",   label: "Revision",   Icon: IconRevision,   color: "var(--mode-revision)",   placeholder: "Enter a topic to revise..." },
  { id: "motivation", label: "Motivation", Icon: IconMotivation, color: "var(--mode-motivation)", placeholder: "How are you feeling today?" },
];

const API = "https://studysphere-api-production.up.railway.app";

function getKey(mode) { return `ss_chat_${mode}`; }
function load(mode) { try { return JSON.parse(localStorage.getItem(getKey(mode)) || "[]"); } catch { return []; } }
function save(mode, msgs) { try { localStorage.setItem(getKey(mode), JSON.stringify(msgs.slice(-50))); } catch {} }

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

export default function Chat() {
  const { mode = "study" } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const active = MODES.find(m => m.id === mode) || MODES[0];

  const [messages, setMessages] = useState(() => load(mode));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const bottomRef = useRef(null);
  const taRef = useRef(null);
  const skipSaveRef = useRef(false);

  useEffect(() => {
    skipSaveRef.current = true;
    setMessages(load(mode));
    setError(null);
  }, [mode]);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (messages.length > 0) save(mode, messages);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mode]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [input]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const clean = updated.map(({ role, content }) => ({ role, content }));
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/api/chat`, {
        method: "POST", headers,
        body: JSON.stringify({ mode, messages: clean }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Error"); }
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.text, provider: data.provider }]);
    } catch (e) {
      setError(e.message.includes("fetch") ? "Connection error. Check your network." : e.message || "Something went wrong.");
      setMessages(messages);
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoWrap} onClick={() => navigate("/")}>
          <div className={styles.logoMark}>S</div>
        </div>
        <nav className={styles.nav}>
          {MODES.map(({ id, label, Icon, color }) => (
            <button
              key={id}
              className={`${styles.navBtn} ${mode === id ? styles.navActive : ""}`}
              style={mode === id ? { color, background: `${color}18` } : {}}
              onClick={() => navigate(`/chat/${id}`)}
              onMouseEnter={() => setTooltip(label)}
              onMouseLeave={() => setTooltip(null)}
              title={label}
            >
              <Icon size={20} />
              {tooltip === label && <span className={styles.tip}>{label}</span>}
            </button>
          ))}
        </nav>
        <div className={styles.navBottom}>
          {user ? (
            <button
              className={styles.navBtn}
              onClick={() => navigate("/settings")}
              onMouseEnter={() => setTooltip("Settings")}
              onMouseLeave={() => setTooltip(null)}
              title="Settings"
            >
              <IconSettings size={20} />
              {tooltip === "Settings" && <span className={styles.tip}>Settings</span>}
            </button>
          ) : (
            <button
              className={styles.navBtn}
              onClick={() => navigate("/login")}
              onMouseEnter={() => setTooltip("Login")}
              onMouseLeave={() => setTooltip(null)}
              title="Login"
            >
              <IconUser size={20} />
              {tooltip === "Login" && <span className={styles.tip}>Login</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <span className={styles.modeLabel} style={{ color: active.color }}>{active.label}</span>
          <div className={styles.topRight}>
            {user && <span className={styles.userChip}>{user.name?.split(" ")[0]}</span>}
            {messages.length > 0 && (
              <button className={styles.newBtn} onClick={() => { setMessages([]); localStorage.removeItem(getKey(mode)); }} title="New chat">
                <IconPlus size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon} style={{ color: active.color }}><active.Icon size={36} /></div>
              <h2 className={styles.emptyTitle}>{active.label}</h2>
              <p className={styles.emptyText}>
                {mode === "study" && "Ask me anything to understand clearly."}
                {mode === "exam" && "Tell me what exam or topic you're preparing for."}
                {mode === "homework" && "Share your question and I'll guide you step by step."}
                {mode === "revision" && "Tell me what topic you want to revise."}
                {mode === "motivation" && "Tell me how you're feeling about your studies."}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`${styles.msg} ${msg.role === "user" ? styles.user : styles.ai}`}>
              {msg.role === "assistant" && (
                <div className={styles.aiIcon} style={{ color: active.color }}><active.Icon size={15} /></div>
              )}
              <div className={styles.msgWrap}>
                <div
                  className={`${styles.bubble} ${msg.role === "assistant" ? `${styles.aiBubble} ai-response` : styles.userBubble}`}
                  dangerouslySetInnerHTML={msg.role === "assistant" ? { __html: formatResponse(msg.content) } : undefined}
                >{msg.role === "user" ? msg.content : undefined}</div>
                {msg.provider && <span className={styles.via}>via {msg.provider}</span>}
              </div>
            </div>
          ))}

          {loading && (
            <div className={`${styles.msg} ${styles.ai}`}>
              <div className={styles.aiIcon} style={{ color: active.color }}><active.Icon size={15} /></div>
              <div className={styles.msgWrap}>
                <div className={`${styles.bubble} ${styles.aiBubble}`}>
                  <div className={styles.dots}><span/><span/><span/></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errBox}>
              {error}
              <button className={styles.errDismiss} onClick={() => setError(null)}>×</button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={styles.inputWrap}>
          <div className={styles.inputBox}>
            <textarea
              ref={taRef}
              className={styles.textarea}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={active.placeholder}
              rows={1}
              disabled={loading}
            />
            <button
              className={styles.sendBtn}
              onClick={send}
              disabled={!input.trim() || loading}
              style={{ background: input.trim() && !loading ? active.color : undefined }}
            >
              <IconSend size={15} color="#fff" />
            </button>
          </div>
          <p className={styles.hint}>Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
         }
