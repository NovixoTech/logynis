// Draft component for saving specific content (flashcards, one-pagers, etc.) for offline access
// NOT wired into the app yet - standalone for future integration
// This is meant to attach to already-generated content, like a "Save for offline" button
// on a completed Flashcards set or One-Pager

import { useState } from "react";
import { cacheContent } from "../utils/offlineCache.js";
import styles from "./SaveOfflineButton.module.css";

export default function SaveOfflineButton({ contentKey, contentData, contentType, label = "Save for offline" }) {
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    const success = await cacheContent(contentKey, contentData, contentType);
    if (success) setSaved(true);
  }

  return (
    <button className={styles.button} onClick={handleSave} disabled={saved}>
      {saved ? "✓ Saved offline" : `📥 ${label}`}
    </button>
  );
}
