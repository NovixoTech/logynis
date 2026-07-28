import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./ClassReminderBanner.module.css";

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;
const DISMISS_KEY_PREFIX = "ss_class_reminder_dismissed_";

function shouldShow(user) {
  if (!user) return false;
  if (!user.currentclass) return true;
  if (!user.classupdatedat) return true;
  const updatedAt = new Date(user.classupdatedat).getTime();
  return Date.now() - updatedAt > SIX_MONTHS_MS;
}

function wasDismissedToday(userId) {
  const key = DISMISS_KEY_PREFIX + userId;
  const dismissedAt = localStorage.getItem(key);
  if (!dismissedAt) return false;
  const dismissedDate = new Date(parseInt(dismissedAt, 10)).toDateString();
  return dismissedDate === new Date().toDateString();
}

export default function ClassReminderBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => wasDismissedToday(user?.id));

  if (!shouldShow(user) || dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY_PREFIX + user.id, Date.now().toString());
    setDismissed(true);
  }

  const isFirstTime = !user.currentclass;

  return (
    <div className={styles.banner}>
      <p className={styles.text}>
        {isFirstTime
          ? "Add your current class or level so Logynis can tailor answers to you."
          : "It's been a while — confirm your current class or level is still correct."}
      </p>
      <div className={styles.actions}>
        <button className={styles.updateBtn} onClick={() => navigate("/settings")}>
          Update now
        </button>
        <button className={styles.dismissBtn} onClick={handleDismiss}>
          Not now
        </button>
      </div>
    </div>
  );
    }
