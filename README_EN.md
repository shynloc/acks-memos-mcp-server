# ACKS Memos MCP Server

> **ACKS (AI Company Kindled by Silvermoon / AI 飞驰，科学驾驶)**

An open-source, highly compatible Model Context Protocol (MCP) Server that exposes your self-hosted [Memos](https://github.com/usememos/memos) instance to AI models and Agents.

Supports both **Stdio** (local execution) and **SSE (Server-Sent Events)** (remote execution) transport layers.

---

## Features

- **Dual Transports**:
  - `Stdio`: Used by local clients like Claude Desktop or Cursor.
  - `SSE (Express)`: Used by remote Agents (e.g. OpenClaw, Hermes Agent) hosted on servers.
- **Client-side Tag Extraction**: Dynamically parses Markdown hashtags (`#tag/subtag`) from memos on the fly, working around the deprecation of `/api/v1/memos/-/tags` in Memos v0.22.0+.
- **Rich Tools**:
  - `create_memo`: Create a memo (supports private/protected/public visibility).
  - `list_memos`: Retrieve recent memos.
  - `get_memo`: Retrieve a memo by ID.
  - `update_memo`: Update memo content or visibility.
  - `delete_memo`: Delete a memo by ID.
  - `search_memos`: Search for memos containing query strings.
  - `list_tags`: Retrieve unique tags extracted from your memos.
- **Resources**:
  - `memos://latest`: Exposes the 10 most recent memos as a dynamic JSON resource.

---

## Installation & Setup

Ensure you have **Node.js (>= 18)** installed.

### 1. Build from Source
```bash
git clone https://github.com/your-username/acks-memos-mcp-server.git
cd acks-memos-mcp-server
npm install
npm run build
```

---

## Running the Server

Configure the server using the following environment variables:
- `MEMOS_API_URL`: The base URL of your Memos instance (e.g., `https://your-memos-instance.com`).
- `MEMOS_ACCESS_TOKEN`: A Personal Access Token generated under Memos -> Settings -> Members -> Personal Access Token.
- `PORT` (SSE mode only): The local port to listen on (defaults to `3000`).
- `HOST` (SSE mode only): The host to bind to (defaults to `0.0.0.0`).

### Option A: Local Stdio Mode (e.g. Claude Desktop)
Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "acks-memos": {
      "command": "node",
      "args": ["C:/absolute/path/to/acks-memos-mcp-server/dist/index.js"],
      "env": {
        "MEMOS_API_URL": "https://your-memos-instance.com",
        "MEMOS_ACCESS_TOKEN": "your_memos_pat_here"
      }
    }
  }
}
```

### Option B: Remote SSE Server Mode (e.g., your-server)
Run the server using a process manager like **pm2** to keep it active:

```bash
PORT=3000 TRANSPORT=sse MEMOS_API_URL=https://your-memos-instance.com MEMOS_ACCESS_TOKEN=your_memos_pat_here pm2 start dist/index.js --name "acks-memos-mcp"
```

#### Nginx Reverse Proxy Configuration
Expose the server through the same domain (e.g., `https://your-memos-instance.com/mcp/`) by adding this location block to your Nginx virtual host configuration:

```nginx
location /mcp/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # SSE connection stability settings
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 24h;
    proxy_send_timeout 24h;
    chunked_transfer_encoding on;
}
```

This reverse proxy setup allows remote agents (like OpenClaw or Hermes Agent) to connect directly using `https://your-memos-instance.com/mcp/sse`.

---

## License

MIT License. Developed by ACKS.
