import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  createMemory,
  getMemory,
  updateMemory,
  deleteMemory,
  listMemories,
  searchMemories
} from "./memory-store.js";

/** Instructions for compressing memory content */
const COMPRESS_RULES = [
  "WRITE COMPRESSED: ",
  // What to remove
  "Drop articles (a/an/the), filler (just/really/basically/actually/simply), ",
  "pleasantries (sure/certainly/of course), hedging (might be worth/could consider), ",
  "connective fluff (however/furthermore/additionally). ",
  // How to compress
  "Use fragments & short synonyms: 'fix' not 'implement a solution for', 'use' not 'utilize'. ",
  "State actions directly: 'run tests before push' not 'you should make sure to run tests'. ",
  // Symbols & abbreviations
  "Symbols: →=leads to, &=and, w/=with, +=also, >>=prefer, @=at, vs=versus. ",
  "Abbreviations: cfg=config, fn=function, impl=implementation, req=required, ",
  "opt=optional, env=environment, dep=dependency, repo=repository, dev=development, ",
  "auth=authentication, db=database, pkg=package, msg=message, err=error, usr=user. ",
  // Limits
  "Keep under 100 words. Preserve all technical terms, code, paths, URLs exactly.",
].join("");

/**
 * Registers MCP tools related to memory management.
 * This is called from index.ts for both stdio and HTTP modes,
 */
export function registerMemoryTools(server: McpServer): void {
  // List all memories
  server.registerTool(
    "memory_list",
    {
      description:
        `List all saved memories (newest first). MUST be called at the start of every session to load prior context before doing any work. Use tags parameter to filter by category when the list is large.`,
      inputSchema: {
        tags: z
          .array(z.string())
          .optional()
          .describe("Filter: return only memories matching ALL provided tags. Omit to list everything."),
      },
    },
    async ({ tags }) => {
      const memories = listMemories(tags);
      return { content: [{ type: "text" as const, text: JSON.stringify(memories) }] };
    },
  );

  // Create Memory
  server.registerTool(
    "memory_create",
    {
      description: `Create a new persistent memory. BEFORE calling: check memory_list to avoid duplicates - update existing memories instead of creating new ones. Content should be compressed using the following rules before saving: ${COMPRESS_RULES}`,
      inputSchema: {
        title: z.string().describe("Short descriptive title, 3-8 workds. Use as a scannable label."),
        content: z
          .string()
          .describe("Memory body in compressed shorthand (see tool description for rules). Max 100 words."),
        tags: z
          .array(z.string())
          .optional()
          .describe(`Categorization tags using namespace:value format, e.g. ['project:myapp', 'lang:typescript']. Used for filtering memories in memory_list.`),
      }
    },
    async ({ title, content, tags }) => {
      const memory = createMemory(title, content, tags);
      return { content: [{ type: "text" as const, text: JSON.stringify(memory) }] };
    },
  );

  // Read Memory
  server.registerTool(
    "memory_read",
    {
      description:
        `Retrieve the full content of a single memory by ID. Use when you need the complete text of a specific memory after seeing its summary in memory_list or memory_search.`,
      inputSchema: {
        id: z.string().describe("UUID of the memory to read"),
      },
    },
    async ({ id }) => {
      const memory = getMemory(id);
      if (!memory) {
        return { content: [{ type: "text" as const, text: `Not found: ${id}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(memory) }] };
    },
  );

  // Update Memory
  server.registerTool(
    "memory_update",
    {
      description: `Update an existing memory. Only provide fields that changed - omitted fields stay the same. Prefer this over delete+create when correcting or refining content. ${COMPRESS_RULES}`,
      inputSchema: {
        id: z.string().describe("UUID of the memory to update"),
        title: z.string().optional().describe("New title (omit to keep current)"),
        content: z.string().optional().describe("New compressed content (omit to keep current)"),
        tags: z.array(z.string()).optional().describe("New tags - replaces all existing tags. Omit to keep current tags."),
      },
    },
    async ({ id, ...updates }) => {
      const memory = updateMemory(id, updates);
      if (!memory) {
        return { content: [{ type: "text" as const, text: `Not found: ${id}` }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(memory) }] };
    },
  );

  // Delete Memory
  server.registerTool(
    "memory_delete",
    {
      description:
        `Permanently delete a memory by ID. Use only when a memory is irrelevant or fully superseded. For corrections or refinements, use memory_update instead.`,
      inputSchema: {
        id: z.string().describe("UUID of the memory to delete"),
      },
    },
    async ({ id }) => {
      const deleted = deleteMemory(id);
      return {
        content: [
          { type: "text" as const, text: deleted ? `Deleted: ${id}` : `Not found: ${id}` },
        ],
        isError: !deleted,
      };
    },
  );

  // Search Memories
  server.registerTool(
    "memory_search",
    {
      description:
        `Full-text search across all memory titles and content (SQLite FTS5). Use when looking for specific information and memory_list returns too many results. Supports quoted phrases ("exact match") and negation (-excluded). Results ranked by relevance.`,
      inputSchema: {
        query: z.string().describe('Search query. Examples: "auth flow", typescript -react, database setup'),
      },
    },
    async ({ query }) => {
      const memories = searchMemories(query);
      return { content: [{ type: "text" as const, text: JSON.stringify(memories) }] };
    },
  );
}