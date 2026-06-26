import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Dashboard.module.css";

const MODES = [
  { id: "study", label: "Study", icon: "📖", color: "var(--mode-study)" },
  { id: "exam", label: "Exam Prep", icon: "🎯", color: "var(--mode-exam)" },
  { id: "homework", label: "Homework", icon: "✏️", color: "var(--mode-homework)" },
  { id: "revision", label: "Revision", icon: "🔁", color: "var(--mode-revision)" },
  { id: "motivation", label: "Motivation", icon: "⚡", color: "var(--mode-motivation)" },
];

function getStreakMessage(streak) {
  if (!streak || streak === 0) return "Start your streak today!";
  if (streak >= 30) return "Unstoppable! 🚀";
  if (streak >= 7) return "One week strong! 🏆";
  if (streak >= 3) return "You're on a roll! 🔥";
  return "Keep it up!";
}

function getCountdownColor(daysLeft) {
  if (daysLeft < 0) return "#9ca3af";
  if (daysLeft === 0) return "var(--error)";
  if (daysLeft <= 3) return "var(--error)";
  if (daysLeft <= 7) return "#f59e0b";
  return "var(--success)";
}

function getCountdownText(daysLeft) {
  if (daysLeft < 0) return "Passed";
  if (daysLeft === 0) return "TODAY!";
  if (daysLeft === 1) return "Tomorrow!";
  return `${daysLeft} days left`;
}

export default function Dashboard() {
  const { user, logout, authFetch } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [quickInput, setQuickInput] = useState("");
  const [quickMode, setQuickMode] = useState("study");

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    try {
      const res = await authFetch("/exam/list");
      const data = await res.json();
      setExams(data.slice(0, 3));
    } catch {}
  }

  function handleQuickAsk() {
    if (!quickInput.trim()) return;
    localStorage.setItem("ss_quick_message", quickInput);
    localStorage.setItem("ss_quick_mode", quickMode);
    navigate(`/chat/${quickMode}`);
  }

  const firstName = user?.name?.split(" ")[0] || "Student";

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoMark}>S</div>
          <span className={styles.logoText}>StudySphere</span>
        </div>

        <nav className={styles.nav}>
          {[
            { icon: "🏠", label: "Dashboard", path: "/dashboard" },
            { icon: "🤖", label: "AI Chat", path: "/chat/study" },
            { icon: "📅", label: "Exam Timetable", path: "/timetable" },
            { icon: "📢", label: "Study Feed", path: "/feed" },
            { icon: "👤", label: "Profile", path: "/profile" },
          ].map((item) => (
            <button
              key={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.navActive : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={() => { logout(); navigate("/"); }}>
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Welcome */}
        <div className={styles.welcome}>
          <div>
            <h1 className={styles.welcomeTitle}>Welcome back, {firstName} 👋</h1>
            <div className={styles.badges}>
              {user?.educationLevel && <span className={styles.badge}>{user.educationLevel}</span>}
              {user?.country && <span className={styles.badge}>{user.country}</span>}
              {user?.goal && <span className={styles.badge}>{user.goal}</span>}
            </div>
          </div>
          <div className={styles.streakBox}>
            <span className={styles.streakFire}>🔥</span>
            <div>
              <div className={styles.streakNum}>{user?.streak || 0} day streak</div>
              <div className={styles.streakMsg}>{getStreakMessage(user?.streak)}</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={styles.statsRow}>
          {[
            { label: "Streak", value: `🔥 ${user?.streak || 0}`, sub: "days" },
            { label: "Points", value: `⭐ ${user?.points || 0}`, sub: "earned" },
            { label: "Exams", value: `📅 ${exams.length}`, sub: "upcoming" },
            { label: "Subjects", value: `📚 ${user?.subjects?.length || 0}`, sub: "subjects" },
          ].map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statSub}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* AI Quick Access */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Ask AI 🤖</h2>
          <div className={styles.quickAsk}>
            <select
              className={styles.modeSelect}
              value={quickMode}
              onChange={(e) => setQuickMode(e.target.value)}
            >
              {MODES.map((m) => (
                <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
              ))}
            </select>
            <input
              className={styles.quickInput}
              placeholder="What do you want to learn today?"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAsk()}
            />
            <button className={styles.quickBtn} onClick={handleQuickAsk}>Ask →</button>
          </div>
        </div>

        {/* Study Modes */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Study Modes</h2>
          <div className={styles.modesGrid}>
            {MODES.map((mode) => (
              <button
                key={mode.id}
                className={styles.modeCard}
                style={{ "--card-color": mode.color }}
                onClick={() => navigate(`/chat/${mode.id}`)}
              >
                <span className={styles.modeIcon}>{mode.icon}</span>
                <span className={styles.modeLabel}>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Exams */}
        {exams.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Upcoming Exams 📅</h2>
              <button className={styles.viewAll} onClick={() => navigate("/timetable")}>View all →</button>
            </div>
            <div className={styles.examsList}>
              {exams.map((exam) => {
                const daysLeft = Math.ceil((new Date(exam.examDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={exam.id} className={styles.examCard}>
                    <div>
                      <div className={styles.examSubject}>{exam.subject}</div>
                      <div className={styles.examDate}>{new Date(exam.examDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                    <span className={styles.countdown} style={{ color: getCountdownColor(daysLeft), borderColor: getCountdownColor(daysLeft) }}>
                      {getCountdownText(daysLeft)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* What's New */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>What's New ✨</h2>
          <div className={styles.whatsNew}>
            {[
              { emoji: "🌍", text: "AI now adapts to your country and exam system" },
              { emoji: "⚡", text: "Faster and clearer AI explanations" },
              { emoji: "📅", text: "Coming soon: Smart study reminders" },
              { emoji: "👥", text: "Coming soon: Friends and leaderboard" },
            ].map((item, i) => (
              <div key={i} className={styles.newItem}>
                <span>{item.emoji}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className={styles.bottomNav}>
        {[
          { icon: "🏠", path: "/dashboard" },
          { icon: "🤖", path: "/chat/study" },
          { icon: "📅", path: "/timetable" },
          { icon: "📢", path: "/feed" },
          { icon: "👤", path: "/profile" },
        ].map((item) => (
          <button key={item.path} className={styles.bottomNavItem} onClick={() => navigate(item.path)}>
            {item.icon}
          </button>
        ))}
      </nav>
    </div>
  );
}
