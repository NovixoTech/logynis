// Page showing everything saved for offline access

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCachedByType, deleteCachedContent } from "../utils/offlineCache.js";
import MarkdownRenderer from "../components/MarkdownRenderer";
import styles from "./OfflineLibrary.module.css";

const CONTENT_TYPES = ["flashcards", "memory-aid", "concept-map", "explain-differently", "note-summarizer", "cross-subject", "one-pager", "common-mistakes"];

const TYPE_LABELS = {
  "flashcards": "Flashcards",
  "memory-aid": "Memory Aid",
  "concept-map": "Concept Map",
  "explain-differently": "Explained Differently",
  "note-summarizer": "Summarized Notes",
  "cross-subject": "Cross-Subject Connection",
  "one-pager": "One-Pager",
  "common-mistakes": "Common Mistakes Digest",
};

export default function OfflineLibrary() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openItem, setOpenItem] = useState(null);

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

  async function handleDelete(key, e) {
    e.stopPropagation();
    await deleteCachedContent(key);
    if (openItem?.key === key) setOpenItem(null);
    loadAll();
  }

  function titleFor(item) {
    return item.data?.title || item.data?.topic || item.data?.subject || TYPE_LABELS[item.type] || item.type;
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
            <div key={item.key} className={styles.itemCard} onClick={() => setOpenItem(item)}>
              <div>
                <span className={styles.itemName}>{titleFor(item)}</span>
                <span className={styles.itemType}>{TYPE_LABELS[item.type] || item.type}</span>
                <span className={styles.itemDate}>Saved {new Date(item.cachedAt).toLocaleDateString()}</span>
              </div>
              <button className={styles.deleteBtn} onClick={(e) => handleDelete(item.key, e)}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      {openItem && (
        <>
          <div className={styles.overlay} onClick={() => setOpenItem(null)} />
          <div className={styles.viewer}>
            <div className={styles.viewerHeader}>
              <span className={styles.viewerType}>{TYPE_LABELS[openItem.type] || openItem.type}</span>
              <button className={styles.viewerClose} onClick={() => setOpenItem(null)}>×</button>
            </div>
            <div className={styles.viewerBody}>
              <ContentView item={openItem} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ContentView({ item }) {
  const { data, type } = item;

  if (type === "flashcards" && Array.isArray(data?.cards)) {
    return (
      <div className={styles.flashcardList}>
        {data.cards.map((c, i) => (
          <div key={i} className={styles.flashcardItem}>
            <p className={styles.flashcardQ}>{c.question || c.front}</p>
            <p className={styles.flashcardA}>{c.answer || c.back}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "concept-map" && data?.map) {
    const { central, nodes, insight } = data.map;
    return (
      <div className={styles.conceptMapView}>
        <p className={styles.centralNode}>{central}</p>
        {nodes?.map((n, i) => (
          <div key={i} className={styles.conceptNode}>
            <span className={styles.conceptLabel}>{n.label}</span>
            <span className={styles.conceptConnection}>{n.connection}</span>
          </div>
        ))}
        {insight && (
          <div className={styles.plainText}>
            <strong>Why this matters:</strong>
            <MarkdownRenderer content={insight} />
          </div>
        )}
      </div>
    );
  }

  if (type === "one-pager" && data?.page) {
    return (
      <div className={styles.onePagerView}>
        {data.page.sections?.map((s, i) => (
          <div key={i} className={styles.onePagerSection}>
            <p className={styles.onePagerHeading}>{s.heading}</p>
            <ul className={styles.onePagerPoints}>
              {s.points?.map((p, j) => <li key={j}>{p}</li>)}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (type === "common-mistakes" && Array.isArray(data?.mistakes)) {
    return (
      <div className={styles.mistakesView}>
        {data.mistakes.map((m, i) => (
          <div key={i} className={styles.mistakeItem}>
            <p className={styles.mistakeTitle}>{m.mistake}</p>
            <p className={styles.plainText}><strong>Why it happens:</strong> {m.why}</p>
            <p className={styles.plainText}><strong>Do this instead:</strong> {m.correction}</p>
          </div>
        ))}
      </div>
    );
  }

  if (typeof data?.content === "string") {
    return <MarkdownRenderer content={data.content} />;
  }

  if (typeof data === "string") {
    return <MarkdownRenderer content={data} />;
  }

  return <pre className={styles.rawFallback}>{JSON.stringify(data, null, 2)}</pre>;
  }
