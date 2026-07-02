import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconStudy, IconExam, IconHomework, IconRevision, IconMotivation, IconSettings, IconSend, IconPlus, IconClock } from "../components/Icons.jsx";
import styles from "./Chat.module.css";

const MODES = [
  { id: "study",      label: "Study",      Icon: IconStudy,      color: "var(--mode-study)",      placeholder: "Ask anything to understand..." },
  { id: "exam",       label: "Exam Prep",  Icon: IconExam,       color: "var(--mode-exam)",       placeholder: "Enter a topic for practice questions..." },
  { id: "homework",   label: "Homework",   Icon: IconHomework,   color: "var(--mode-homework)",   placeholder: "Paste your homework question..." },
  { id: "revision",   label: "Revision",   Icon: IconRevision,   color: "var(--mode-revision)",   placeholder: "Enter a topic to revise..." },
  { id: "motivation", label: "Motivation", Icon: IconMotivation, color: "var(--mode-motivation)", placeholder: "How are you feeling today?" },
];

const API = "https://studysphere-api-production.up.railway.app";

function formatTable(tableBlock) {
  const lines = tableBlock.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return tableBlock;

  const headerCells = lines[0].split("|").map(c => c.trim()).filter(Boolean);
  const bodyLines = lines.slice(2);

  let html = '<div class="table-wrap"><table><thead><tr>';
  headerCells.forEach(cell => { html += `<th>${cell}</th>`; });
  html += "</tr></thead><tbody>";

  bodyLines.forEach(line => {
    const cells = line.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length === 0) return;
    html += "<tr>";
    cells.forEach(cell => { html += `<td>${cell}</td>`; });
    html += "</tr>";
  });

  html += "</tbody></table></div>";
  return html;
}

function formatResponse(text) {
  let escaped = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  escaped = escaped.replace(/((?:^\|.*\|$\n?)+)/gm, (match) => formatTable(match));

  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^(?!<[hutd])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "")
    .replace(/<p>(<div class="table-wrap">.*?<\/div>)<\/p>/gs, "$1");
}

export default function Chat() {
  const { mode = "study" } = useParams();
  const navigate = useNavigate();
  const { token, user, authFetch } = useAuth();
  const userId = user?.id;
  const active = MODES.find(m => m.id === mode) || MODES[0];

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const bottomRef = useRef(null);
  const taRef = useRef(null);

  // Reset to a fresh chat whenever the mode changes
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setHistoryOpen(false);
  }, [mode, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [input]);

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await authFetch(`/conversations?mode=${mode}`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadConversation(id) {
    setHistoryLoading(true);
    try {
      const res = await authFetch(`/conversations/${id}/messages`);
      const data = await res.json();
      const loadedMessages = (data.messages || []).flatMap(row => ([
        { role: "user", content: row.message },
        { role: "assistant", content: row.response },
      ]));
      setMessages(loadedMessages);
      setConversationId(id);
      setHistoryOpen(false);
    } catch (e) {
      setError("Failed to load conversation");
    } finally {
      setHistoryLoading(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setHistoryOpen(false);
  }

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
        body: JSON.stringify({ mode, messages: clean, conversationId }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Error"); }
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.text, provider: data.provider }]);
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
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
              <button className={styles.navBtn} onClick={openHistory} title="Recent chats">
                <IconClock size={18} />
              </button>
            )}
            {user && (
              <button className={styles.navBtn} onClick={() => navigate("/settings")} title="Settings">
                <IconSettings size={18} />
              </button>
            )}
            {messages.length > 0 && (
              <button className={styles.newBtn} onClick={startNewChat} title="New chat">
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

      {/* Recent Chats Sidebar */}
      {historyOpen && (
        <>
          <div className={styles.overlay} onClick={() => setHistoryOpen(false)} />
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h3>Recent — {active.label}</h3>
              <button className={styles.sidebarClose} onClick={() => setHistoryOpen(false)}>×</button>
            </div>
            <button className={styles.sidebarNewBtn} onClick={startNewChat}>
              <IconPlus size={14} /> New chat
            </button>
            <div className={styles.sidebarList}>
              {historyLoading && <p className={styles.sidebarEmpty}>Loading...</p>}
              {!historyLoading && history.length === 0 && (
                <p className={styles.sidebarEmpty}>No past conversations yet.</p>
              )}
              {!historyLoading && history.map(convo => (
                <button
                  key={convo.id}
                  className={`${styles.sidebarItem} ${convo.id === conversationId ? styles.sidebarItemActive : ""}`}
                  onClick={() => loadConversation(convo.id)}
                >
                  <span className={styles.sidebarItemTitle}>{convo.title || "Untitled"}</span>
                  <span className={styles.sidebarItemDate}>
                    {new Date(convo.updatedat).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
      }
