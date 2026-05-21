#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createMemosMcpServer } from "./server.js";
import { ConfigManager } from "./config.js";

dotenv.config();

const isSseMode = process.argv.includes("--sse") || process.env.TRANSPORT?.toLowerCase() === "sse";

// Load configurations at startup
const configManager = new ConfigManager();
await configManager.load();

if (isSseMode) {
  // SSE HTTP Server Mode
  const app = express();
  
  // Enable CORS for agent web clients
  app.use(cors());
  
  // Express raw/json body parsing
  app.use(express.json());

  // Active transports map (keyed by sessionId)
  const transports = new Map<string, SSEServerTransport>();

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "healthy", service: "acks-memos-mcp-server" });
  });

  // Handle SSE Connection
  // Supports wildcard paths so that it works with or without path prefixes (e.g. /sse, /mcp/sse)
  app.get("*/sse", async (req, res) => {
    const reqPath = req.path; // e.g. "/sse" or "/mcp/sse"
    const prefix = reqPath.substring(0, reqPath.lastIndexOf("/sse"));
    const messagesPath = `${prefix}/messages`;

    console.error(`New SSE connection request at path: ${reqPath}. Messaging endpoint set to: ${messagesPath}`);

    const transport = new SSEServerTransport(messagesPath, res);
    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);

    // Create a dedicated MCP Server instance for this session to avoid multi-client conflicts
    const server = await createMemosMcpServer(configManager);

    res.on("close", () => {
      console.error(`SSE connection closed for session: ${sessionId}`);
      transports.delete(sessionId);
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      console.error(`Connected MCP server to SSE transport session: ${sessionId}`);
    } catch (err: any) {
      console.error(`Failed to connect transport: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).send("Failed to establish MCP connection");
      }
    }
  });

  // Handle incoming messages
  app.post("*/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).send("Missing sessionId query parameter");
      return;
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      console.error(`Message post failed: no active session found for ID ${sessionId}`);
      res.status(404).send("Session not found or expired");
      return;
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (err: any) {
      console.error(`Error handling message: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).send("Error processing message");
      }
    }
  });

  // Admin API endpoints (SSE mode)
  app.get("/admin/api/config", (req, res) => {
    res.json(configManager.getConfig());
  });
  
  app.post("/admin/api/config", async (req, res) => {
    try {
      const updated = await configManager.update(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const port = parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "0.0.0.0";

  app.listen(port, host, () => {
    console.error(`ACKS Memos MCP Server running in SSE mode`);
    console.error(`Health check: http://${host === "0.0.0.0" ? "localhost" : host}:${port}/health`);
    console.error(`SSE endpoint: http://${host === "0.0.0.0" ? "localhost" : host}:${port}/sse (or /mcp/sse)`);
    console.error(`Admin Panel API: http://${host === "0.0.0.0" ? "localhost" : host}:${port}/admin/api/config`);
  });
} else {
  // Stdio Mode (Standard CLI)
  const server = await createMemosMcpServer(configManager);
  const transport = new StdioServerTransport();
  
  server.connect(transport).then(() => {
    console.error("ACKS Memos MCP Server running in Stdio mode");
  }).catch((err) => {
    console.error("Failed to run ACKS Memos MCP Server in Stdio mode:", err);
    process.exit(1);
  });

  // Launch background Admin Panel server for Stdio mode
  const adminApp = express();
  adminApp.use(cors());
  adminApp.use(express.json());
  
  adminApp.get("/admin/api/config", (req, res) => {
    res.json(configManager.getConfig());
  });
  
  adminApp.post("/admin/api/config", async (req, res) => {
    try {
      const updated = await configManager.update(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const adminPort = parseInt(process.env.ADMIN_PORT || "3001", 10);
  adminApp.listen(adminPort, "127.0.0.1", () => {
    console.error(`[Admin Panel] Web UI backend running at http://127.0.0.1:${adminPort}/admin (Stdio mode)`);
  });
}
