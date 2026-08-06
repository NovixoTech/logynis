import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./Dashboard.module.css";

const MODES = [
  { id: "study", label: "Study", blurb: "Deep explanations, your pace" },
  { id: "exam", label: "Exam Prep", blurb: "Practice questions, real format" },
  { id: "homework", label: "Homework Help", blurb: "Step-by-step, together" },
  { id: "revision", label: "Revision", blurb: "Fast notes before the test" },
  { id: "motivation", label: "Motivation", blurb: "When it feels heavy" },
];

function firstName(fullName) {
  if (!fullName) return "there";
  return fullName.trim().split(/\s+/)[0];
}

export default function Dashboard() {
  const { user: cachedUser, updateUser, logout, authFetch } = useAuth();
  const navigate = useNavigate();

  // Start with the cached user so the page isn't empty while the fresh
  // fetch is in flight, then replace it with live data from the server.
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFreshProfile() {
      try {
        const res = await authFetch("/user/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const fresh = await res.json();
        if (!cancelled) {
          setUser(fresh);
          updateUser(fresh); // keeps the cached copy fresh everywhere else too
        }
      } catch (e) {
        // If this fails, we just keep showing the cached user - not worth
        // blocking the whole dashboard over a refresh failure.
        console.error("[Dashboard] profile refresh failed", e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFreshProfile();
    return () => { cancelled = true; };
  }, []);

  const subjects = (user?.subjects || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>Logynis</div>
        <nav className={styles.topnav}>
          <button className={styles.navLink} onClick={() => navigate("/settings")}>Settings</button>
          <button className={styles.navLink} onClick={() => navigate("/referrals")}>Referrals</button>
          <button className={styles.navLink} onClick={() => navigate("/offline-library")}>Library</button>
          <button className={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Welcome back</p>
          <h1 className={styles.heroName}>{firstName(user?.name)}</h1>
          <div className={styles.passport}>
            <div className={styles.passportRow}>
              <span className={styles.passportLabel}>Level</span>
              <span className={styles.passportValue}>{user?.educationlevel || "Not set"}</span>
            </div>
            {user?.examtype && (
              <div className={styles.passportRow}>
                <span className={styles.passportLabel}>Exam</span>
                <span className={styles.passportValue}>{user.examtype}</span>
              </div>
            )}
            {user?.coursename && (
              <div className={styles.passportRow}>
                <span className={styles.passportLabel}>Course</span>
                <span className={styles.passportValue}>{user.coursename}</span>
              </div>
            )}
            <div className={styles.passportRow}>
              <span className={styles.passportLabel}>Points</span>
              <span className={styles.passportValue}>
                {loading ? "…" : (user?.points ?? 0)}
              </span>
            </div>
          </div>
          {subjects.length > 0 && (
            <div className={styles.subjectRow}>
              {subjects.map(s => (
                <span key={s} className={styles.subjectChip}>{s}</span>
              ))}
            </div>
          )}
        </section>

        <section className={styles.modesSection}>
          <h2 className={styles.sectionTitle}>Pick up where you left off</h2>
          <div className={styles.modeGrid}>
            {MODES.map((m, i) => (
              <button
                key={m.id}
                className={styles.modeCard}
                onClick={() => navigate(`/mode/${m.id}`)}
              >
                <span className={styles.modeIndex}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.modeLabel}>{m.label}</span>
                <span className={styles.modeBlurb}>{m.blurb}</span>
              </button>
            ))}
          </div>
        </section>

        {user?.referralcode && (
          <section className={styles.referralStrip}>
            <div>
              <p className={styles.referralLabel}>Your referral code</p>
              <p className={styles.referralCode}>{user.referralcode}</p>
            </div>
            <button className={styles.referralBtn} onClick={() => navigate("/referrals")}>
              Invite friends, earn free days 
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
