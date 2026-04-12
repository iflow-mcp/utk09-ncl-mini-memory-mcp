import type { Memory } from "../api";
import { MemoryCard } from "./MemoryCard";

type Props = {
  memories: Memory[];
  loading: boolean;
  isFiltered: boolean;
  activeTags: string[];
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
};

export function MemoryList({ memories, loading, isFiltered, activeTags, onEdit, onDelete, onTagClick }: Props) {
  if (loading) {
    return <div className="state-message">Loading…</div>;
  }

  if (memories.length === 0) {
    return (
      <div className="state-message state-message--empty">
        <span className="state-icon">🧠</span>
        {isFiltered ? (
          <p>No memories match your current filters.</p>
        ) : (
          <p>No memories yet. Click <strong>New Memory</strong> to save one.</p>
        )}
      </div>
    );
  }

  return (
    <div className="memory-grid">
      {memories.map((m) => (
        <MemoryCard
          key={m.id}
          memory={m}
          activeTags={activeTags}
          onEdit={onEdit}
          onDelete={onDelete}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
}
