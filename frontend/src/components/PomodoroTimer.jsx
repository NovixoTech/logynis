// Study Session Timer (Pomodoro)
// No backend needed - pure frontend timer state

import { useState, useEffect, useRef } from "react";
import styles from "./PomodoroTimer.module.css";

const PRESETS = [
  { label: "25 / 5", focus: 25, break: 5 },
  { label: "50 / 10", focus: 50, break: 10 },
  { label: "60 / 15", focus: 60, break: 15 },
];

export default function PomodoroTimer() {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState("focus"); // focus | break
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            handleSessionEnd();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [isRunning]);

  function handleSessionEnd() {
    clearInterval(intervalRef.current);
    setIsRunning(false);

    if (mode === "focus") {
      setSessionsCompleted(c => c + 1);
      setMode("break");
      setSecondsLeft(breakMinutes * 60);
    } else {
      setMode("focus");
      setSecondsLeft(focusMinutes * 60);
    }

    try {
      if (Notification.permission === "granted") {
        new Notification(mode === "focus" ? "Break time!" : "Back to focus!");
      }
    } catch (e) {
      // silent fail - notifications not critical
    }
  }

  function toggleRunning() {
    setIsRunning(r => !r);
  }

  function reset() {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setMode("focus");
    setSecondsLeft(focusMinutes * 60);
  }

  function applyPreset(preset) {
    setFocusMinutes(preset.focus);
    setBreakMinutes(preset.break);
    setMode("focus");
    setIsRunning(false);
    setSecondsLeft(preset.focus * 60);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (!expanded) {
    return (
      <button className={styles.collapsedWidget} onClick={() => setExpanded(true)}>
        ⏱ {formatTime(secondsLeft)}
      </button>
    );
  }

  return (
    <div className={styles.widget}>
      <div className={styles.widgetHeader}>
        <span className={styles.modeLabel}>{mode === "focus" ? "Focus" : "Break"}</span>
        <button className={styles.collapseBtn} onClick={() => setExpanded(false)}>✕</button>
      </div>

      <div className={styles.timeDisplay}>{formatTime(secondsLeft)}</div>

      <div className={styles.controls}>
        <button className={styles.controlBtn} onClick={toggleRunning}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button className={styles.resetBtn} onClick={reset}>Reset</button>
      </div>

      {!isRunning && (
        <div className={styles.presets}>
          {PRESETS.map(p => (
            <button
              key={p.label}
              className={`${styles.presetBtn} ${focusMinutes === p.focus && breakMinutes === p.break ? styles.presetActive : ""}`}
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <p className={styles.sessionCount}>{sessionsCompleted} focus sessions completed today</p>
    </div>
  );
                                                 }
