// Draft page showing everything saved for offline access
// NOT wired into router yet - standalone for future integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCachedByType, deleteCachedContent } from "../utils/offlineCache.js";
import styles from "./OfflineLibrary.module.css";

const CONTENT_TYPES = ["flashcards", "one-pager", "conversation"];

export default function OfflineLibrary() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const allItems = [];
    for (const type of CONTENT_TYPES) {
      const results = await getAllCachedByType(type);
      allItems.push(...results);
    }
    allItems.sort((a, b) => b.cachedAt - a.cachedAt);
    setItems(allItems);
    setLoading(false);
  }

  async function handleDelete(key) {
    await deleteCachedContent(key);
    loadAll();
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Offline Library</h1>
      </div>

      <div className={styles.content}>
        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && items.length === 0 && (
          <p className={styles.empty}>Nothing saved offline yet. Look for "Save for offline" buttons on flashcards, one-pagers, and other content while you're online.</p>
        )}

        <div className={styles.itemsList}>
          {items.map(item => (
            <div key={item.key} className={styles.itemCard}>
              <div>
                <span className={styles.itemType}>{item.type}</span>
                <span className={styles.itemDate}>Saved {new Date(item.cachedAt).toLocaleDateString()}</span>
              </div>
              <button className={styles.deleteBtn} onClick={() => handleDelete(item.key)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
      }
