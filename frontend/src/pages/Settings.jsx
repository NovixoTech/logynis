import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconLogout } from "../components/Icons.jsx";
import styles from "./Settings.module.css";

export default function Settings() {
  const { user, logout, authFetch, updateUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    if (!name.trim()) { setError("Name cannot be empty"); return; }
    setSaving(true); setError(null);
    try {
      const res = await authFetch("/user/update", { method: "PUT", body: JSON.stringify({ name }) });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      updateUser(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Settings</h1>
        <div />
      </div>
      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>Saved!</div>}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input className={styles.input} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <div className={styles.value}>{user?.email}</div>
          </div>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
        </div>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Session</h2>
          <button className={styles.logoutBtn} onClick={() => { logout(); navigate("/"); }}>
            <IconLogout size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
