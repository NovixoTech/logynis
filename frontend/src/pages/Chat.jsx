import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconStudy, IconExam, IconHomework, IconRevision, IconMotivation, IconSettings, IconSend, IconPlus } from "../components/Icons.jsx";
import styles from "./Chat.module.css";

const MODES = [
  { id: "study",      label: "Study",      Icon: IconStudy,      color: "var(--mode-study)",      placeholder: "Ask anything to understand..." },
  { id: "exam",       label: "Exam Prep",  Icon: IconExam,       color: "var(--mode-exam)",       placeholder: "Enter a topic for practice questions..." },
  { id: "homework",   label: "Homework",   Icon: IconHomework,   color: "var(--mode-homework)",   placeholder: "Paste your homework question..." },
  { id: "revision",   label: "Revision",   Icon: IconRevision,   color: "var(--mode-revision)",   placeholder: "Enter a topic to revise..." },
  { id: "motivation", label: "Motivation", Icon: IconMotivation, color: "var(--mode-motivation)", placeholder: "How are you feeling today?" },
];

const API = "https://studysphere-api-production.up.railway.app";

function getKey(mode, userId) { return `ss_chat_${userId || "guest"}_${mode}`; }
function load(mode, userId) { try { return JSON.parse(localStorage.getItem(getKey(mode, userId)) || "[]"); } catch { return []; } }
function save(mode, userId, msgs) { try { localStorage.setItem(getKey(mode, userId), JSON.stringify(msgs.slice(-50))); } catch {} }

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
  const userId = user?.id;
  const active = MODES.find(m => m.id === mode) || MODES[0];

  const [messages, setMessages] = useState(() => load(mode, userId));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const taRef = useRef(null);
  const skipSaveRef = useRef(false);

  useEffect(() => {
    skipSaveRef.current = true;
    setMessages(load(mode, userId));
    setError(null);
  }, [mode, userId]);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (messages.length > 0) save(mode, userId, messages);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mode, userId]);

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
      <div className={styles.main}>

        {/* Topbar */}
        <div className={styles.topbar}>
          <div className={styles.topLeft}>
            <img src="/logo.png" alt="Logynis" className={styles.logoMark} onClick={() => navigate("/")} />
            <select
              className={styles.modeSelect}
              value={mode}
              onChange={e => navigate(`/chat/${e.target.value}`)}
              style={{ color: active.color }}
            >
              {MODES.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.topRight}>
            {user && <span className={styles.userChip}>{user.name?.split(" ")[0]}</span>}
            {user && (
              <button className={styles.navBtn} onClick={() => navigate("/settings")} title="Settings">
                <IconSettings size={18} />
              </button>
            )}
            {messages.length > 0 && (
              <button className={styles.newBtn} onClick={() => { setMessages([]); localStorage.removeItem(getKey(mode, userId)); }} title="New chat">
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
              <div className={styles.msgWrap}>
                <div
                  className={`${styles.bubble} ${msg.role === "assistant" ? `${styles.aiBubble} ai-response` : styles.userBubble}`}
                  dangerouslySetInnerHTML={msg.role === "assistant" ? { __html: formatResponse(msg.content) } : undefined}
                >{msg.role === "user" ? msg.content : undefined}</div>
               </div>
            </div>
          ))}

          {loading && (
            <div className={`${styles.msg} ${styles.ai}`}>
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
