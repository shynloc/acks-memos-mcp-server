# 🚀 Memos MCP Server: The Ultimate AI Bridge

A powerful, secure, and fully-featured Model Context Protocol (MCP) server designed specifically for [Memos](https://usememos.com/) – the open-source, privacy-first note-taking service.

This server acts as a universal bridge, allowing any modern AI client (Claude Desktop, Cursor, Windsurf, Grok, etc.) to natively read, write, search, and organize your Memos database with zero friction.

![Memos MCP Server](https://img.shields.io/badge/Memos-MCP%20Server-emerald?style=for-the-badge&logo=code)
![Status](https://img.shields.io/badge/Status-Production_Ready-blue?style=for-the-badge)

## ✨ Why This MCP Server is Next-Level

### 🔍 True Semantic Search (Zero External Dependencies)
Unlike basic text-matching plugins, this server features a **built-in Vector Engine** powered by `@xenova/transformers`.
- It automatically downloads a lightweight ONNX model (`Xenova/all-MiniLM-L6-v2`) and runs it *locally*.
- It vectorizes your Memos in the background.
- It enables your LLM to perform **true semantic searches** ("Find me thoughts about AI architecture") rather than just keyword matches.
- All offline, all private. No OpenAI API keys required for embeddings.

### 🎛️ Beautiful Web Admin Dashboard
Managing JSON configuration files is tedious. This server ships with a stunning, glassmorphism-styled **Control Panel** (`/mcp/admin`).
- Visually toggle tool permissions on/off.
- Generate and copy secure connection URLs.
- Monitor the Vector Search Engine's background syncing status in real-time.

### 🛡️ Enterprise-Grade, Zero-Trust Security
Your notes are private. Exposing an MCP server over the internet is risky, which is why this server implements military-grade protection:
- **Auto-generated 128-bit Secure Tokens**: Immediately invalidates unauthorized access.
- **Path-Based Secrets**: Bypasses rigid URL parsers while keeping the secret out of logs.
- **Mock OAuth 2.0 PKCE Engine**: For extremely strict enterprise clients (like Grok), this server features a built-in mock OAuth2 authorization flow. It speaks the industry standard perfectly without requiring you to set up external identity providers.
- **One-Click Token Revocation**: Suspect a leak? Click "Regenerate" in the admin panel to instantly invalidate all old tokens.

## 🛠️ Features / Tools Available to AI

- `list_memos`: Retrieve recent memos.
- `search_memos`: Fast keyword search across memos.
- `vector_search_memos`: Advanced semantic meaning search.
- `get_memo`: Read a specific memo in full detail.
- `create_memo`: Draft new ideas natively from the AI chat.
- `update_memo`: Edit existing notes.
- `delete_memo`: Remove notes.
- `list_tags`: See your organizational structure.

## 🚀 Installation & Deployment

### Prerequisites
- Node.js v22+
- A running instance of Memos with an Access Token.

### Standard Setup

```bash
git clone https://github.com/shynloc/acks-memos-mcp-server.git
cd acks-memos-mcp-server
npm install
npm run build
```

### Environment Variables
Create a `.env` file in the root directory:
```env
# Required: Your Memos instance URL
MEMOS_API_URL=https://your-memos-domain.com

# Required: Your personal access token from Memos Settings -> Access Tokens
MEMOS_ACCESS_TOKEN=eyJhb...

# Optional: The port to run this MCP server on
PORT=3000
```

### Running with PM2 (Recommended)
```bash
npm install -g pm2
pm2 start dist/index.js --name "memos-mcp"
pm2 save
```

## 🔌 Connecting to AI Clients

Once your server is running, navigate to the Web Admin Panel:
👉 `http://localhost:3000/admin` (or your reverse proxy URL, e.g., `https://yourdomain.com/mcp/admin`)

The panel will generate your connection settings automatically.

### For Standard Clients (Claude Desktop, Cursor, Windsurf)
In the MCP configuration file/UI, simply use the **SSE (Server-Sent Events)** protocol and paste the **Base URL** provided in your Cheat Sheet (e.g., `https://yourdomain.com/mcp/sse/acks_xxxxxxxx`).

### For Strict Clients (Grok)
If a client insists on a full OAuth 2.0 flow, expand the **"Advanced Client Setup (Cheat Sheet)"** in the Admin panel.
- **Client ID**: Your `acks_...` token.
- **Authorize Endpoint**: `https://.../mcp/authorize`
- **Token Endpoint**: `https://.../mcp/token`
- **Auth Method**: PKCE

The built-in mock OAuth engine will seamlessly authenticate the client.

## 🤝 Contributing
Built with passion by Thom & Silvermoon (ACKS). Pull requests are welcome!
