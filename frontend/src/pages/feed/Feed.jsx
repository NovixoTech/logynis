import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Feed.module.css";

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Feed() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());

  useEffect(() => { loadFeed(); }, []);

  async function loadFeed() {
    try {
      const res = await authFetch("/feed");
      const data = await res.json();
      setPosts(data);
    } catch {
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }

  async function submitPost() {
    if (!content.trim()) return;
    if (content.length > 500) { setError("Post cannot exceed 500 characters"); return; }
    setPosting(true);
    setError(null);
    try {
      const res = await authFetch("/feed/post", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to post");
      setContent("");
      loadFeed();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(postId) {
    try {
      await authFetch(`/feed/like/${postId}`, { method: "POST" });
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) next.delete(postId);
        else next.add(postId);
        return next;
      });
      setPosts((prev) => prev.map((p) => p.id === postId
        ? { ...p, likes: likedPosts.has(postId) ? p.likes - 1 : p.likes + 1 }
        : p
      ));
    } catch {}
  }

  const initial = (name) => name?.charAt(0)?.toUpperCase() || "S";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate("/dashboard")}>← Dashboard</button>
        <h1 className={styles.title}>📢 Study Feed</h1>
        <div />
      </header>

      <div className={styles.content}>
        {/* Post Input */}
        <div className={styles.postBox}>
          <div className={styles.avatar}>{initial(user?.name)}</div>
          <div className={styles.postInput}>
            <textarea
              className={styles.textarea}
              placeholder="What did you study today? Share with other students..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className={styles.postFooter}>
              <span className={styles.charCount}>{content.length}/500</span>
              <button
                className={styles.postBtn}
                onClick={submitPost}
                disabled={!content.trim() || posting}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Feed */}
        {loading ? (
          <div className={styles.empty}>Loading feed...</div>
        ) : posts.length === 0 ? (
          <div className={styles.empty}>
            <span>📢</span>
            <p>No posts yet. Be the first to share what you studied!</p>
          </div>
        ) : (
          <div className={styles.feed}>
            {posts.map((post) => (
              <div key={post.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.postAvatar}>{initial(post.userName)}</div>
                  <div>
                    <div className={styles.postName}>{post.userName}</div>
                    <div className={styles.postTime}>{timeAgo(post.createdAt)}</div>
                  </div>
                </div>
                <p className={styles.postContent}>{post.content}</p>
                <div className={styles.cardFooter}>
                  <button
                    className={`${styles.likeBtn} ${likedPosts.has(post.id) ? styles.liked : ""}`}
                    onClick={() => toggleLike(post.id)}
                  >
                    {likedPosts.has(post.id) ? "❤️" : "🤍"} {post.likes || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
