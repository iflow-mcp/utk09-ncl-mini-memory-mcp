import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  type Memory,
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
}