import { useEffect, useRef, useState } from "react";
import type { Memory } from "../api";

type Props = {
  memory?: Memory | null;
  onSave: (data: { title: string; content: string; tags: string[] }) => Promise<void>;
  onClose: () => void;
};

export function MemoryForm({ memory, onSave, onClose }: Props) {
  const [title, setTitle] = useState(memory?.title ?? "");
  const [content, setContent] = useState(memory?.content ?? "");
  const [tagsInput, setTagsInput] = useState(memory?.tags.join(", ") ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setSaving(true);
    setError(null);
    try {
      await onSave({ title: title.trim(), content: content.trim(), tags });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const isEdit = Boolean(memory);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Memory" : "New Memory"}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <label className="form-label">
            Title
            <input
              ref={titleRef}
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short descriptive title"
              maxLength={120}
            />
          </label>

          <label className="form-label">
            Content
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write in compressed shorthand: skip articles, use symbols (→ & w/ +), abbreviate words"
              rows={6}
            />
          </label>

          <label className="form-label">
            Tags
            <input
              type="text"
              className="form-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. project:myapp, lang:typescript, pref:style"
            />
            <span className="form-hint">Comma-separated. Used for filtering and grouping.</span>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Memory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
