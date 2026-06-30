import { useNavigate } from "react-router-dom";
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
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="Logynis" className={styles.logoMark} />
          <span className={styles.logoText}>Logynis</span>
        </div>
        <div className={styles.headerBtns}>
          <button className={styles.loginBtn} onClick={() => navigate("/login")}>Login</button>
          <button className={styles.signupBtn} onClick={() => navigate("/signup")}>Sign up</button>
        </div>
      </header>
      <main className={styles.main}>
        <h1 className={styles.headline}>Your AI Study Companion,<br /><span className={styles.accent}> That Thinks With You.</span></h1>
        <p className={styles.sub}>Pick a mode and start learning.</p>
        <div className={styles.grid}>
          {MODES.map((m) => (
            <button key={m.id} className={styles.card} onClick={() => navigate(`/chat/${m.id}`)}>
              <div className={styles.cardLabel}>{m.label}</div>
              <div className={styles.cardDesc}>{m.desc}</div>
              <span className={styles.arrow}>→</span>
            </button>
          ))}
        </div>
      </main>
      <footer className={styles.footer}>Powered by <a href="https://github.com/NovixoTech" target="_blank" rel="noreferrer">NovixoTech</a></footer>
    </div>
  );
            }
