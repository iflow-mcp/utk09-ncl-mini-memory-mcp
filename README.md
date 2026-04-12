# Mini Memory MCP

A lightweight, local-first persistent memory server for AI tools. Stores structured memory entries in SQLite and exposes them over both the **Model Context Protocol (MCP)** and a plain **REST HTTP API**. Comes with a React UI for browsing and managing memories in the browser.

---

## What it does

- Persists named memory entries (title + content + tags) in a local SQLite database
- Full-text search via SQLite FTS5 (prefix queries, quoted phrases, negative filters)
- Tag-based filtering with `namespace:value` convention (e.g. `project:myapp`, `lang:typescript`)
- Exposes memories to AI clients over **MCP stdio** or **MCP Streamable HTTP**
- Also serves a plain REST API for direct HTTP access
- Includes a React 19 browser UI for visual management

---

## Project structure

```text
mini-memory-mcp/
├── server/
│   ├── index.ts          # Entry point — stdio or HTTP mode
│   ├── db.ts             # SQLite init, WAL, FTS5 schema & triggers
│   ├── memory-store.ts   # CRUD + FTS search logic
│   ├── routes.ts         # Express REST router (/api/memories)
│   └── mcp-tools.ts      # MCP tool definitions (memory_list/create/read/update/delete/search)
├── ui/
│   └── src/
│       ├── api.ts                    # Typed fetch helpers
│       ├── hooks/useMemories.ts      # State, debounced search, CRUD
│       └── components/               # MemoryList, MemoryCard, MemoryForm, SearchBar
├── data/
│   └── mini-memory.sqlite            # Auto-created on first run
└── package.json
```

---

## Prerequisites

- Node.js >= 20

---

## Installation

```bash
# Install server dependencies
npm install

# Install UI dependencies
cd ui && npm install
```

---

## Running the server

### HTTP mode (REST API + MCP Streamable HTTP)

```bash
npm start
```

Server starts on **port 5172**.

- Health check: `GET http://localhost:5172/`
- REST API: `http://localhost:5172/api/memories`
- MCP Streamable HTTP: `http://localhost:5172/mcp`

### stdio mode (MCP stdio — for Claude Desktop / Claude CLI)

```bash
npm run start:mcp
```

The process speaks the MCP protocol over stdin/stdout. No HTTP server is started.

---

## Running the UI

With the HTTP server already running:

```bash
cd ui
npm run dev
```

UI starts on **port 5173** and proxies `/api` requests to the server on port 5172.

Open `http://localhost:5173` in your browser.

---

## Connecting via MCP

### stdio (Claude Desktop)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mini-memory-mcp": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mini-memory-mcp/server/index.ts", "--stdio"]
    }
  }
}
```

Or with `npm run start:mcp`:

```json
{
  "mcpServers": {
    "mini-memory-mcp": {
      "command": "npm",
      "args": ["run", "start:mcp"],
      "cwd": "/absolute/path/to/mini-memory-mcp"
    }
  }
}
```

### stdio (Claude Code CLI)

```bash
claude mcp add mini-memory-mcp -- npx tsx /absolute/path/to/mini-memory-mcp/server/index.ts --stdio
```

### stdio (GitHub Copilot in VS Code)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "mini-memory-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mini-memory-mcp/server/index.ts", "--stdio"]
    }
  }
}
```

### HTTP (MCP Streamable HTTP)

First start the server in HTTP mode (`npm start`), then point your MCP client at:

```bash
http://localhost:5172/mcp
```

The server follows the MCP Streamable HTTP spec: send a `POST` with no `mcp-session-id` header to initialize a session, then include the returned session ID in all subsequent `POST`/`GET`/`DELETE` requests.

---

## Available MCP tools

| Tool | Description |
|---|---|
| `memory_list` | List all memories, newest first. Filter by tags. **Call at session start.** |
| `memory_create` | Create a new memory (title, content, optional tags) |
| `memory_read` | Read full content of a single memory by ID |
| `memory_update` | Partially update a memory — only changed fields needed |
| `memory_delete` | Permanently delete a memory by ID |
| `memory_search` | Full-text search across titles and content |

> Memory content is stored in compressed shorthand (≤100 words). The tools guide the AI to drop filler words and use symbols/abbreviations so more context fits in less space.

---

## REST API

Base path: `http://localhost:5172/api/memories`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/memories` | List all memories. Query params: `search=<text>`, `tags=<tag1,tag2>` |
| `GET` | `/api/memories/:id` | Get a single memory by UUID |
| `POST` | `/api/memories` | Create a memory. Body: `{ title, content, tags? }` |
| `PUT` | `/api/memories/:id` | Update a memory. Body: `{ title?, content?, tags? }` |
| `DELETE` | `/api/memories/:id` | Delete a memory |

### Example: create a memory

```bash
curl -X POST http://localhost:5172/api/memories \
  -H "Content-Type: application/json" \
  -d '{"title": "My note", "content": "important context here", "tags": ["project:myapp"]}'
```

### Example: search

```bash
curl "http://localhost:5172/api/memories?search=typescript"
```

### Example: filter by tag

```bash
curl "http://localhost:5172/api/memories?tags=project:myapp,lang:typescript"
```

---

## Search syntax

The `search` query parameter and the `memory_search` MCP tool support:

| Syntax | Example | Meaning |
|---|---|---|
| Bare term | `typescript` | Prefix match — finds `typescript`, `typescripts`, etc. |
| Quoted phrase | `"exact phrase"` | Exact phrase match |
| Negation | `-react` | Exclude results containing `react` |
| Combined | `"auth flow" typescript -react` | All conditions applied |

---

## Memory schema

```json
{
  "id": "uuid-v4",
  "title": "Short descriptive title",
  "content": "Memory body text",
  "tags": ["namespace:value"],
  "createdAt": "2026-04-12T10:00:00.000Z",
  "updatedAt": "2026-04-12T10:00:00.000Z"
}
```

Tags follow a `namespace:value` convention to make filtering meaningful, e.g. `project:myapp`, `lang:typescript`, `pref:style`.
