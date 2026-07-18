// Draft page for Photo-to-Homework
// NOT wired into router yet - standalone for future integration

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./PhotoHomework.module.css";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoHomework() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const fileInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image");
      return;
    }

    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResponse(null);
  }

  async function analyze() {
    if (!imageFile) {
      setError("Please select a photo first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base64 = await fileToBase64(imageFile);

      const res = await authFetch("/future/photo-homework", {
        method: "POST",
        body: JSON.stringify({ imageBase64: base64, mimeType: imageFile.type }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed to analyze photo");
      }

      const data = await res.json();
      setResponse(data.text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setImageFile(null);
    setImagePreview(null);
    setResponse(null);
    setError(null);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Photo Homework Helper</h1>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}

        {!imagePreview && (
          <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
            <p className={styles.uploadText}>Tap to take a photo or upload an image of your homework question</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleFileSelect}
              className={styles.hiddenInput}
            />
          </div>
        )}

        {imagePreview && (
          <div className={styles.previewArea}>
            <img src={imagePreview} alt="Homework question" className={styles.previewImage} />

            {!response && (
              <div className={styles.actions}>
                <button className={styles.analyzeBtn} onClick={analyze} disabled={loading}>
                  {loading ? "Reading your question..." : "Analyze This Photo"}
                </button>
                <button className={styles.retakeBtn} onClick={reset}>Choose Different Photo</button>
              </div>
            )}
          </div>
        )}

        {response && (
          <div className={styles.responseArea}>
            <div className={styles.response}>{response}</div>
            <button className={styles.newBtn} onClick={reset}>Analyze Another Question</button>
          </div>
        )}
      </div>
    </div>
  );
                                        }
