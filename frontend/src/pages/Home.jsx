import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconSettings } from "../components/Icons.jsx";
import PomodoroTimer from "../components/PomodoroTimer.jsx";
import ClassReminderBanner from "../components/ClassReminderBanner.jsx";
import DailyChallengeCard from "../components/DailyChallengeCard.jsx";
import styles from "./Home.module.css";

const MODES = [
  { id: "study", label: "Study", desc: "Understand any concept clearly" },
  { id: "exam", label: "Exam Prep", desc: "Practice questions and model answers" },
  { id: "homework", label: "Homework", desc: "Step-by-step help without just giving answers" },
  { id: "revision", label: "Revision", desc: "Summaries and key points to remember" },
  { id: "motivation", label: "Motivation", desc: "Support and tips when things feel hard" },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function goTo(path) {
    setMenuOpen(false);
    navigate(path);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="Logynis" className={styles.logoMark} />
          <span className={styles.logoText}>Logynis</span>
        </div>
        <div className={styles.headerBtns}>
          {user ? (
            <div className={styles.userGroup}>
              <span className={styles.userNameSmall}>{user.name?.split(" ")[0] || "Account"}</span>
              <button className={styles.iconBtn} onClick={() => setMenuOpen(true)} title="Menu">
                ☰
              </button>
            </div>
          ) : (
            <>
              <button className={styles.loginBtn} onClick={() => navigate("/login")}>Login</button>
              <button className={styles.signupBtn} onClick={() => navigate("/signup")}>Sign up</button>
            </>
          )}
        </div>
      </header>

      {menuOpen && (
        <>
          <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
          <div className={styles.menuPanel}>
            <div className={styles.menuHeader}>
              <h3>Menu</h3>
              <button className={styles.menuClose} onClick={() => setMenuOpen(false)}>×</button>
            </div>
            <button className={styles.menuItem} onClick={() => goTo("/dashboard")}>
              Dashboard
            </button>
            <button className={styles.menuItem} onClick={() => goTo("/settings")}>
              Settings
            </button>
            <button className={styles.menuItem} onClick={() => goTo("/glossary")}>
              Glossary
            </button>
            <button className={styles.menuItem} onClick={() => goTo("/referrals")}>
              Refer a Friend
            </button>
            <button className={styles.menuItem} onClick={() => goTo("/offline-library")}>
              Offline Library
            </button>
          </div>
        </>
      )}

      <main className={styles.main}>
        <h1 className={styles.headline}>Your AI Study Companion,<br /><span className={styles.accent}> That Thinks With You.</span></h1>
        <p className={styles.sub}>Pick a mode and start learning.</p>

        <ClassReminderBanner />

        {user && <DailyChallengeCard />}

        <div className={styles.grid}>
          {MODES.map((m) => (
            <button key={m.id} className={styles.card} onClick={() => navigate(`/mode/${m.id}`)}>
              <div className={styles.cardLabel}>{m.label}</div>
              <div className={styles.cardDesc}>{m.desc}</div>
              <span className={styles.arrow}>→</span>
            </button>
          ))}
        </div>
      </main>

      {user && <PomodoroTimer />}

      <footer className={styles.footer}>Powered by <a href="https://github.com/NovixoTech" target="_blank" rel="noreferrer">NovixoTech</a></footer>
    </div>
  );
  }
