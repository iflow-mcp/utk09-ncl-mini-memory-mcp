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
const COMPRESS_RULE =
  "IMPORTANT - write content in compressed shorthand, skip articles and conjunctions, and use abbreviations where possible." +
  "use symbols -> leads to, = is, != is not, & and, | or, / per, > is greater than, < is less than, >> prefers, << less prefers." +
  "common abbreviations(e.g.w / for with, w / o for without)." +
  "use short forms for common words(e.g. info for information, num for number, usr for user, proj for project, cfg for configuration, fn for function, var for variable, etc.)." +
  "use camelCase for multi-word concepts(e.g. projectDeadline, userFeedback, etc.)." +
  "Keep under 100 words per memory.";

/**
 * Registers MCP tools related to memory management.
 * This is called from index.ts for both stdio and HTTP modes,
 */
export function registerMemoryTools(server: McpServer): void {
  // List all memories
  server.registerTool("memory_list", {
    description: "List all saved memories, newest first. Optionally filter by tags, e.g. tag1:abc,tag2:def. CALL THIS AT THE START OF EVERY SESSION BEFORE DOING ANY WORK.",
    inputSchema: {
      tags: z.array(z.string())
        .optional()
        .describe("Optional list of tags to filter memories, e.g. ['tag1:abc', 'tag2:def']. All provided tags must match. Omit to list all memories.")
    },
  },
    async ({ tags }) => {
      const memories = listMemories(tags);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(memories)
          }
        ]
      }
    });
}