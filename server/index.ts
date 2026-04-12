import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import express from "express";
import process from "process";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { memoryRouter } from "./routes.js";
import { getDb } from "./db.js";
import { registerMemoryTools } from "./mcp-tools.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isStdio = process.argv.includes("--stdio");
const PORT = parseInt(process.env.PORT ?? "5172", 10);

getDb(); // Ensure database is initialized before handling any requests

if (isStdio) {
  // In MCP mode the process speaks over stdio instead of starting an HTTP server.
  const server = new McpServer({ name: "mini-memory-mcp", version: "1.0.0" });
  registerMemoryTools(server);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("mini-memory MCP server is running in stdio mode.\n");

  process.on("SIGINT", async () => {
    // Close the MCP server first so clients do not see an abrupt disconnect.
    process.stderr.write("Shutting down mini-memory MCP server...\n");
    await server.close();
    process.exit(0);
  });
} else {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    // Lightweight health endpoint for browser checks and local debugging.
    res.status(200).json({
      status: "ok",
      message: "mini-memory MCP server is running."
    });
  });

  app.use("/api/memories", memoryRouter);

  const transports: Record<string, StreamableHTTPServerTransport> = {}

  app.post("/mcp", async (req, res) => {

    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && transports[sessionId]) {
      await transports[sessionId].handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          console.log(`MCP session initialized with ID: ${sid}`);
          transports[sid] = transport;
        }
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          console.log(`MCP session closed with ID: ${transport.sessionId}`);
          delete transports[transport.sessionId];
        }
      };

      const mcpServer = new McpServer({ name: "mini-memory-mcp", version: "1.0.0" });
      registerMemoryTools(mcpServer);
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Invalid MCP request: missing or unknown session ID."
      },
      id: req.body.id ?? null
    });
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid MCP request: missing or unknown session ID."
        },
        id: null
      });
      return;
    }

    await transports[sessionId].handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Invalid MCP request: missing or unknown session ID."
        },
        id: null
      });
      return;
    }

    await transports[sessionId].handleRequest(req, res);
  });


  app.listen(PORT, () => {
    console.log(`mini-memory MCP server is running on port ${PORT}`);
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("Shutting down mini-memory MCP server...");
    process.exit(0);
  });
}