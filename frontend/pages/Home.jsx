import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";

const MODES = [
  { id: "study", label: "Study", icon: "📖", description: "Understand any concept with clear, step-by-step explanations tailored to your level.", color: "var(--mode-study)" },
  { id: "exam", label: "Exam Prep", icon: "🎯", description: "Practice questions, model answers, and examiner tips to ace your next test.", color: "var(--mode-exam)" },
  { id: "homework", label: "Homework", icon: "✏️", description: "Get step-by-step help on assignments without just being handed the answer.", color: "var(--mode-homework)" },
  { id: "revision", label: "Revision", icon: "🔁", description: "Summaries, flashcards, and revision notes to lock in what you've learned.", color: "var(--mode-revision)" },
  { id: "motivation", label: "Motivation", icon: "⚡", description: "Study tips, encouragement, and support when things feel overwhelming.", color: "var(--mode-motivation)" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>S</div>
          <span className={styles.logoText}>StudySphere</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.loginBtn} onClick={() => navigate("/login")}>Login</button>
          <button className={styles.signupBtn} onClick={() => navigate("/signup")}>Sign Up Free</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.headline}>
            Your AI tutor,<br />
            <span className={styles.accent}>always ready.</span>
          </h1>
          <p className={styles.subheadline}>
            Pick a mode and start learning. No sign-up needed to try.
          </p>
          <div className={styles.heroBtns}>
            <button className={styles.heroBtn} onClick={() => navigate("/signup")}>
              Get Started Free 🚀
            </button>
            <button className={styles.heroBtnSecondary} onClick={() => navigate("/login")}>
              Login
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {MODES.map((mode) => (
            <button
              key={mode.id}
              className={styles.card}
              onClick={() => navigate(`/signup`)}
              style={{ "--card-color": mode.color }}
            >
              <span className={styles.cardIcon}>{mode.icon}</span>
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>{mode.label}</h2>
                <p className={styles.cardDesc}>{mode.description}</p>
              </div>
              <span className={styles.cardArrow}>→</span>
            </button>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Powered by <a href="https://github.com/NovixoTech" target="_blank" rel="noreferrer">NovixoTech</a> open source</p>
      </footer>
    </div>
  );
              }
