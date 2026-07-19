// Draft component showing connectivity status
// NOT wired into the app yet - standalone for future integration

import { useState, useEffect } from "react";
import styles from "./OnlineStatusBanner.module.css";

export default function OnlineStatusBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() { setOnline(true); }
    function handleOffline() { setOnline(false); }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className={styles.banner}>
      You're offline. You can review previously downloaded content, but new questions require a connection.
    </div>
  );
                            }
