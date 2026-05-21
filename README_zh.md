# 🚀 Memos MCP Server: 终极 AI 桥梁

这是一个功能强大、安全且开箱即用的 Model Context Protocol (MCP) 服务器，专为 [Memos](https://usememos.com/)（开源、注重隐私的轻量级笔记服务）量身打造。

它可以作为一座通用桥梁，让任何现代 AI 客户端（Claude Desktop, Cursor, Windsurf, Grok 等）都能零摩擦地原生读取、写入、搜索和组织你的 Memos 笔记库。

![Memos MCP Server](https://img.shields.io/badge/Memos-MCP%20Server-emerald?style=for-the-badge&logo=code)
![Status](https://img.shields.io/badge/Status-Production_Ready-blue?style=for-the-badge)

[Read in English](./README.md)

## ✨ 为什么这个 MCP 服务器与众不同？

### 🔍 真正的语义搜索（零外部依赖）
与基础的文本匹配插件不同，本服务器内置了基于 `@xenova/transformers` 的**向量检索引擎**。
- 它会自动在后台下载轻量级 ONNX 模型（`Xenova/all-MiniLM-L6-v2`）并*完全在本地运行*。
- 自动将你的 Memos 笔记向量化并保持同步。
- 赋予大模型（LLM）**真正的语义搜索能力**（例如提问：“帮我找找关于 AI 架构的想法”），而不仅仅是关键词匹配。
- 纯离线、绝对隐私，**不需要**配置 OpenAI API 密钥即可生成 Embedding。

### 🎛️ 绝美 Web 管理面板
手写 JSON 配置文件太折磨人？本服务器自带一个极具现代感、毛玻璃风格的**控制面板（Admin Dashboard）** (`/mcp/admin`)。
- 可视化开关各项 MCP 工具的权限。
- 一键生成、复制安全的客户端连接 URL。
- 实时监控后台向量检索引擎的同步状态。

### 🛡️ 企业级、零信任安全架构
你的笔记是绝对的隐私。将 MCP 服务器暴露在公网极具风险，因此本服务器配备了极强硬的安全防护：
- **自动生成的 128 位安全令牌**：阻断任何未经授权的访问。
- **路径融合密钥（Path-Based Secrets）**：完美绕过某些死板客户端对 URL 参数的错误裁剪，且避免密钥记录在常规日志中。
- **内置 Mock OAuth 2.0 PKCE 引擎**：针对要求极为严苛的客户端（如 Grok），本系统自带了一个模拟的 OAuth2 授权流。无需配置任何外部身份提供商，即可完美握手。
- **一键作废防泄漏**：怀疑令牌泄露给大模型？在控制面板点击“Regenerate（重置）”，即可瞬间作废所有旧密钥。

## 🛠️ AI 可调用的工具列表

- `list_memos`: 获取最新笔记。
- `search_memos`: 高速关键词匹配搜索。
- `vector_search_memos`: 高级语义检索（懂你真正想搜的意思）。
- `get_memo`: 读取特定笔记的完整详情。
- `create_memo`: 让 AI 直接在聊天框里帮你记笔记。
- `update_memo`: 修改现有笔记。
- `delete_memo`: 删除笔记。
- `list_tags`: 查看所有标签体系。

## 🚀 部署与安装

### 环境要求
- Node.js v22+
- 拥有你自己的 Memos 服务实例，以及生成的 Access Token。

### 常规安装

```bash
git clone https://github.com/shynloc/acks-memos-mcp-server.git
cd acks-memos-mcp-server
npm install
npm run build
```

### 环境变量配置
在根目录创建一个 `.env` 文件：
```env
# 必填：你的 Memos 服务地址
MEMOS_API_URL=https://your-memos-domain.com

# 必填：在 Memos 设置 -> Access Tokens 中生成的个人访问令牌
MEMOS_ACCESS_TOKEN=eyJhb...

# 选填：MCP 服务器运行端口
PORT=3000
```

### 使用 PM2 持久化运行（推荐）
```bash
npm install -g pm2
pm2 start dist/index.js --name "memos-mcp"
pm2 save
```

## 🔌 连接 AI 客户端

服务器启动后，请在浏览器中访问 Web 管理面板：
👉 `http://localhost:3000/admin` (或者你的反向代理地址，如 `https://yourdomain.com/mcp/admin`)

面板会自动为你生成安全连接所需的配置参数。

### 面向现代客户端 (Claude Desktop, Cursor, Windsurf)
在 MCP 配置中，选择 **SSE (Server-Sent Events)** 协议，然后直接粘贴 Cheat Sheet 中提供的 **Base URL** (如 `https://yourdomain.com/mcp/sse/acks_xxxxxxxx`) 即可。

### 面向强规则客户端 (Grok)
如果遇到强制要求 OAuth 2.0 流程的客户端，请在面板中展开 **"Advanced Client Setup (Cheat Sheet)"**，并参照如下填写：
- **客户端 ID (Client ID)**: 你的 `acks_...` 令牌
- **授权端点 (Authorize Endpoint)**: `https://.../mcp/authorize`
- **令牌端点 (Token Endpoint)**: `https://.../mcp/token`
- **认证方法**: PKCE

内置的 Mock OAuth 引擎会无缝接管并完成授权。

## 🤝 参与贡献
由 Thom & Silvermoon (ACKS) 倾注心血打造。欢迎提交 Pull Requests！
