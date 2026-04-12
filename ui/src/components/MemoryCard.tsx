import { useState } from "react";
import type { Memory } from "../api";

type Props = {
  memory: Memory;
  activeTags: string[];
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MemoryCard({ memory, activeTags, onEdit, onDelete, onTagClick }: Props) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const preview =
    memory.content.length > 120 ? memory.content.slice(0, 120).trimEnd() + "…" : memory.content;

  function handleCopy() {
    void navigator.clipboard.writeText(memory.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="memory-card">
      <div className="card-header">
        <h3 className="card-title">{memory.title}</h3>
        <div className="card-actions">
          {confirming ? (
            <>
              <span className="card-confirm-label">Delete?</span>
              <button
                className="btn-icon btn-icon--danger"
                onClick={() => { onDelete(memory.id); setConfirming(false); }}
                title="Yes, delete"
              >
                ✓
              </button>
              <button className="btn-icon" onClick={() => setConfirming(false)} title="Cancel">
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                className={`btn-icon${copied ? " btn-icon--copied" : ""}`}
                onClick={handleCopy}
                title={copied ? "Copied!" : "Copy content"}
              >
                {copied ? "✓" : "⎘"}
              </button>
              <button className="btn-icon" onClick={() => onEdit(memory)} title="Edit">
                ✎
              </button>
              <button
                className="btn-icon btn-icon--danger"
                onClick={() => setConfirming(true)}
                title="Delete"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>
      <p className="card-content">{preview}</p>
      <div className="card-footer">
        <div className="card-tags">
          {memory.tags.map((tag) => (
            <button
              key={tag}
              className={`tag tag--clickable${activeTags.includes(tag) ? " tag--active" : ""}`}
              onClick={() => onTagClick(tag)}
              title={activeTags.includes(tag) ? `Remove filter: ${tag}` : `Filter by: ${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
        <span className="card-date" title={formatFull(memory.updatedAt)}>
          {formatRelative(memory.updatedAt)}
        </span>
      </div>
    </div>
  );
}
