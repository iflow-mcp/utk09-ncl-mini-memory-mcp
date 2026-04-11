import { randomUUID } from "crypto";

export type Memory = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

type MemoryRow = Omit<Memory, "tags"> & {
  tags: string; // JSON-encoded array of strings
};

type ParsedFtsQuery = {
  fts5: string;
  negatives: string[];
};

/** Parse a MemoryRow from the database into a Memory object. */
function rowToMemory(row: MemoryRow): Memory {
  return {
    ...row,
    tags: JSON.parse(row.tags),
  };
}

/** Convert a Memory object into a MemoryRow for storage in the database. */
function memoryToRow(memory: Memory): MemoryRow {
  return {
    ...memory,
    tags: JSON.stringify(memory.tags),
  };
}

/** Generate the current timestamp in ISO format. */
function now(): string {
  return new Date().toISOString();
}

/** Parse a raw full-text search query into a format suitable for SQLite FTS5, extracting negative terms and handling phrases. */
function parseFtsQuery(raw: string): ParsedFtsQuery {
  const parts: string[] = [];
  const negatives: string[] = [];

  let remaining = raw;
  const phraseRegex = /"([^"]+)"/g;
  let match: RegExpExecArray | null;

  // Extract phrases enclosed in double quotes and add them to the parts array, while removing them from the remaining string
  while ((match = phraseRegex.exec(raw)) !== null) {
    parts.push(`"${match[1].replace(/"/g, '""')}"`);
  }

  remaining = remaining.replace(phraseRegex, "").trim();

  for (const part of remaining.split(/\s+/)) {
    if (part.startsWith("-") && part.length > 1) {
      // Clean the negative part by removing the leading '-' and non-word characters, then converting to lowercase
      negatives.push(part.slice(1).toLowerCase());
    } else {
      // Clean the part by removing non-word characters and converting to lowercase
      const clean = part.replace(/[^\w]/g, "").toLowerCase();
      if (clean) {
        parts.push(clean + "*"); // prefix match for partial words like "cod" matches with "code", "coding", "codebase", etc.
      }
    }
  }

  return {
    fts5: parts.join(" "),
    negatives,
  };
}