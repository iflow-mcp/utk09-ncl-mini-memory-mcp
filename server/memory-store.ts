import { randomUUID } from "crypto";
import { getDb } from "./db.js";

export type Memory = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type MemoryRow = Omit<Memory, "tags"> & {
  tags: string;
};

type ParsedFtsQuery = {
  fts5: string;
  negatives: string[];
};

function rowToMemory(row: MemoryRow): Memory {
  return { ...row, tags: JSON.parse(row.tags) };
}

function memoryToRow(memory: Memory): MemoryRow {
  return { ...memory, tags: JSON.stringify(memory.tags) };
}

function now(): string {
  return new Date().toISOString();
}

function parseFtsQuery(raw: string): ParsedFtsQuery {
  const parts: string[] = [];
  const negatives: string[] = [];

  const phraseRegex = /"([^"]+)"/g;
  let match: RegExpExecArray | null;

  while ((match = phraseRegex.exec(raw)) !== null) {
    parts.push(`"${match[1].replace(/"/g, '""')}"`);
  }

  const remaining = raw.replace(phraseRegex, "").trim();

  for (const part of remaining.split(/\s+/)) {
    if (part.startsWith("-") && part.length > 1) {
      negatives.push(part.slice(1).toLowerCase());
    } else {
      const clean = part.replace(/[^\w]/g, "").toLowerCase();
      if (clean) parts.push(clean + "*");
    }
  }

  return { fts5: parts.join(" "), negatives };
}

export function createMemory(title: string, content: string, tags: string[] = []): Memory {
  const db = getDb();
  const memory: Memory = { id: randomUUID(), title, content, tags, createdAt: now(), updatedAt: now() };
  const row = memoryToRow(memory);
  db.prepare(
    `INSERT INTO memories (id, title, content, tags, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(row.id, row.title, row.content, row.tags, row.createdAt, row.updatedAt);
  return memory;
}

export function getMemory(id: string): Memory | null {
  const row = getDb().prepare("SELECT * FROM memories WHERE id = ?").get(id) as MemoryRow | undefined;
  return row ? rowToMemory(row) : null;
}

export function updateMemory(
  id: string,
  updates: { title?: string; content?: string; tags?: string[] },
): Memory | null {
  const memory = getMemory(id);
  if (!memory) return null;

  const title = updates.title ?? memory.title;
  const content = updates.content ?? memory.content;
  const tags = updates.tags ?? memory.tags;
  const updatedAt = now();

  const updated: Memory = { ...memory, title, content, tags, updatedAt };
  const row = memoryToRow(updated);
  getDb()
    .prepare(
      `UPDATE memories SET title = ?, content = ?, tags = ?, updatedAt = ? WHERE id = ?`,
    )
    .run(row.title, row.content, row.tags, row.updatedAt, id);

  return updated;
}

export function deleteMemory(id: string): boolean {
  return getDb().prepare("DELETE FROM memories WHERE id = ?").run(id).changes > 0;
}

export function listMemories(tags?: string[]): Memory[] {
  const rows = getDb()
    .prepare("SELECT * FROM memories ORDER BY updatedAt DESC")
    .all() as MemoryRow[];
  let memories = rows.map(rowToMemory);

  if (tags && tags.length > 0) {
    memories = memories.filter((m) => tags.every((t) => m.tags.includes(t)));
  }
  return memories;
}

export function searchMemories(query: string): Memory[] {
  if (!query.trim()) return listMemories();

  const db = getDb();
  const { fts5, negatives } = parseFtsQuery(query);

  if (!fts5.trim()) {
    let all = listMemories();
    for (const neg of negatives) {
      all = all.filter(
        (m) => !m.title.toLowerCase().includes(neg) && !m.content.toLowerCase().includes(neg),
      );
    }
    return all;
  }

  const ftsRows = db
    .prepare("SELECT id FROM memories_fts WHERE memories_fts MATCH ? ORDER BY rank")
    .all(fts5) as { id: string }[];

  if (ftsRows.length === 0) return [];

  const ids = ftsRows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  let memories = (
    db
      .prepare(`SELECT * FROM memories WHERE id IN (${placeholders})`)
      .all(...ids) as MemoryRow[]
  ).map(rowToMemory);

  const rankMap = new Map(ids.map((id, i) => [id, i]));
  memories.sort((a, b) => (rankMap.get(a.id) ?? 0) - (rankMap.get(b.id) ?? 0));

  for (const neg of negatives) {
    memories = memories.filter(
      (m) => !m.title.toLowerCase().includes(neg) && !m.content.toLowerCase().includes(neg),
    );
  }

  return memories;
}