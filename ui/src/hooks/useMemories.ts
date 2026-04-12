import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMemory, deleteMemory, listMemories, updateMemory, type Memory } from "../api";

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const debouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const fetchMemories = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const data = await listMemories(query || undefined);
      setMemories(data);
    } catch (error) {
      console.error("Error fetching memories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      void fetchMemories("");
      return;
    }

    if (debouncedRef.current) {
      clearTimeout(debouncedRef.current);
    }

    debouncedRef.current = setTimeout(() => {
      void fetchMemories(search);
    }, 500);

    return () => {
      if (debouncedRef.current) {
        clearTimeout(debouncedRef.current);
      }
    };
  }, [search, fetchMemories]);

  const displayMemories = useMemo(() => {
    if (activeTags.length === 0) {
      return memories;
    }

    return memories.filter((memory) =>
      activeTags.every((tag) => memory.tags.includes(tag))
    );
  }, [memories, activeTags]);


  function handleTagClick(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function openCreateForm() {
    setEditingMemory(null);
    setFormOpen(true);
  }

  function openEditForm(memory: Memory) {
    setEditingMemory(memory);
    setFormOpen(true);
  }

  function closeForm() {
    setEditingMemory(null);
    setFormOpen(false);
  }

  async function handleSave(data: Omit<Memory, "id" | "createdAt" | "updatedAt">) {
    if (editingMemory) {
      await updateMemory(editingMemory.id, data);
    } else {
      await createMemory(data);
    }
    await fetchMemories(search);
    closeForm();
  }

  async function handleDelete(id: string) {
    await deleteMemory(id);
    setMemories((prev) => prev.filter((memory) => memory.id !== id));
  }

  const isFiltered = search.trim().length > 0 || activeTags.length > 0;

  const countLabel = useMemo(() => {
    return isFiltered && displayMemories.length !== memories.length
      ? `${displayMemories.length} of ${memories.length} memories`
      : `${displayMemories.length} ${displayMemories.length === 1 ? "memory" : "memories"}`;
  }, [displayMemories.length, memories.length, isFiltered]);

  return {
    displayMemories,
    loading,
    search,
    setSearch,
    activeTags,
    setActiveTags,
    formOpen,
    editingMemory,
    countLabel,
    isFiltered,
    handleTagClick,
    openCreateForm,
    openEditForm,
    closeForm,
    handleSave,
    handleDelete,
  };
}