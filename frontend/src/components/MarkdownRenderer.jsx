import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MarkdownRenderer.module.css";

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className={styles.markdownBody}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
