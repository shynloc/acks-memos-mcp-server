# ACKS Memos MCP Server

> **ACKS (AI Company Kindled by Silvermoon / AI 飞驰，科学驾驶)**

ACKS Memos MCP Server 是一个开源、高兼容性的 Model Context Protocol (MCP) 服务端，旨在将您的自托管 [Memos](https://github.com/usememos/memos) 实例连接至主流 AI 模型和 Agent。

本服务支持 **Stdio**（本地进程）与 **SSE (Server-Sent Events)**（网络服务）双通道传输协议，完美适配多种 AI 客户端。

---

## 🌟 特性

- **双传输通道支持**：
  - `Stdio 模式`：适用于本地 AI 客户端，如 Claude Desktop 或 Cursor。
  - `SSE 模式`：适用于部署在服务器端的远程 Agent（如 OpenClaw、Hermes Agent 等）。
- **客户端侧标签提取**：自动通过正则解析 Memo 文本中的 Markdown 标签（如 `#工作/周报`），完美规避了 Memos v0.22.0+ 版本中移除原生 `/api/v1/memos/-/tags` 接口的问题。
- **丰富的工具集 (Tools)**：
  - `create_memo`：创建备忘录（支持公开/保护/私有三种可见性）。
  - `list_memos`：分页查询最近的备忘录。
  - `get_memo`：根据唯一 ID 获取单条备忘录。
  - `update_memo`：更新备忘录内容、可见性或归档状态。
  - `delete_memo`：根据 ID 彻底删除备忘录。
  - `search_memos`：在备忘录内容中进行模糊搜索。
  - `list_tags`：获取最近所有 Memo 中使用的唯一标签列表。
- **资源共享 (Resources)**：
  - `memos://latest`：以 JSON 格式动态暴露最近的 10 条备忘录资源。

---

## 🚀 快速开始

确保您的系统已安装 **Node.js (>= 18)**。

### 1. 源码编译
```bash
git clone https://github.com/shynloc/acks-memos-mcp-server.git
cd acks-memos-mcp-server
npm install
npm run build
```

---

## ⚙️ 配置与运行

运行服务前，需要配置以下环境变量：
- `MEMOS_API_URL`：您的 Memos 实例访问地址（例如：`https://your-memos-instance.com`）。
- `MEMOS_ACCESS_TOKEN`：在 Memos 网页端 -> 设置 -> 成员中生成的**个人访问令牌 (PAT)**。
- `PORT`（仅限 SSE 模式）：服务监听的本地端口（默认 `3000`）。
- `HOST`（仅限 SSE 模式）：服务绑定的主机地址（默认 `0.0.0.0`）。

### 方法 A：本地 Stdio 模式（以 Claude Desktop 为例）
在您的 `claude_desktop_config.json` 配置文件中添加以下内容：

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

### 方法 B：远程 SSE 服务器模式（配合 pm2 与 Nginx 反代）
使用进程守护工具（如 **pm2**）在后台启动服务：

```bash
PORT=3000 TRANSPORT=sse MEMOS_API_URL=https://your-memos-instance.com MEMOS_ACCESS_TOKEN=your_memos_pat_here pm2 start dist/index.js --name "acks-memos-mcp"
```

#### Nginx 反向代理配置
如果您希望将 MCP 服务暴露在 Memos 相同域名的某个子路径下（如 `https://your-memos-instance.com/mcp/`），可在 Nginx 配置中加入以下规则：

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

    # 保持 SSE 持续连接的核心设置
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 24h;
    proxy_send_timeout 24h;
    chunked_transfer_encoding on;
}
```

配置完成后，其他 AI 客户端或 Agent 即可通过 `https://your-memos-instance.com/mcp/sse` 连接此 MCP 服务。

---

## 📄 开源协议

本项目采用 MIT 开源协议。Developed by ACKS.
