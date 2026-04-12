# mini-memory-mcp

Mini Memory MCP is a simple memory management system for AI tools.

## Connect the MCP server via stdio with Claude

```bash
claude mcp add mini-memory-mcp -- npx tsx /absolute/path/to/mini-memory-mcp/server/index.ts --stdio
```

## Connect the MCP server via stdio with Copilot in VSCode

### Add the following configuration to your `.vscode/mcp.json`

```json
{
  "servers": {
    "mini-memory-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/mini-memory-mcp/server/index.ts",
        "--stdio"
      ],
    }
  }
}
```
