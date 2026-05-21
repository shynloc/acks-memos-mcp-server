# ACKS Memos MCP Server — ROADMAP

> 本文档记录了产品的核心设计决策与开发路线图。
> 所有方向均来自真实的产品讨论与压力测试，不是头脑风暴，是已确认的结论。

---

## 已发布

### v1.0.0 — 初始版本
- Stdio / SSE 双传输通道
- 基础工具集：`create_memo` / `list_memos` / `get_memo` / `update_memo` / `delete_memo` / `search_memos` / `list_tags`
- 客户端侧标签提取（正则解析 `#tag`，兼容 Memos v0.22.0+ 移除原生 tags 接口）
- 资源共享：`memos://latest`

### v1.0.1 — Audit Fix + 搜索引擎 Tier 1
- 安全审计修复
- **搜索底层从 `String.includes()` 升级为分词 AND 匹配**
  - 旧逻辑：`content.includes("大理 酒店")` → 词间有空格即失败
  - 新逻辑：`tokens.every(token => lowerContent.includes(token))` → 无视词序与间断，零冷启动负担
  - 设计原则：MCP 是基础设施，语义补偿责任下沉到 MCP 层，不能假设上层模型是顶级大模型

---

## 近期规划

### v1.1 — 搜索引擎分级架构（Tier System）

**核心设计原则：** 默认零依赖，高级功能可选开启，覆盖从小白到极客的所有用户。

#### Tier 1（默认，已上线）
分词 AND 匹配，零依赖，即装即用，适配所有环境包括 Stdio 本地模式。

#### Tier 2（可选，环境变量开启）
本地向量语义搜索，基于 `@xenova/transformers`（纯 Node.js，无需额外环境，不消耗 API 费用）。

- 启动时拉取 Memos 全量笔记，本地 CPU 静默转换为向量并缓存
- 搜索时计算余弦相似度，实现真正的语义召回（"出行安排" → "去大理的机票酒店"）
- 解决 Tier 1 无法处理的同义词漂移问题

**为什么需要 Tier 2：** 即使上层 Agent 做了语义转换，底层仍是字面匹配，弱模型用户会陷入"猜词游戏"，每次未命中都消耗一次 Tool Call 和网络往返，最终 Agent 可能直接放弃并告知用户"未找到"。

**Stdio 模式冷启动问题的应对：**

Tier 2 绝不在 Stdio 模式下自动初始化（会触发 Claude Desktop 的 MCP 连接超时熔断）。Tier 2 仅在以下场景启动：
- 用户通过 Web 管理面板主动点击开启（有进度条反馈）
- 服务器 SSE 模式下通过环境变量 `ENABLE_VECTOR_SEARCH=true` 显式启用

**JIT 增量同步策略：**

MCP 内部维护上次全量加载时间戳。每次 `search_memos` 调用前，先向 Memos 接口查询增量更新（"上次同步后有没有新笔记"），将新笔记追加进内存索引，再执行搜索。无需后台轮询，用到即同步，永远返回最新数据。

若笔记是通过 MCP 工具 `create_memo` / `update_memo` 写入的，修改与索引更新同步发生，延迟为零。

---

### v1.2 — Web 管理面板

**设计目标：** 把这个项目从"极客脚本"变成"成熟产品"，解决小白用户的配置门槛与安全感问题。

#### 运行方式
- **本地 Stdio 模式：** 后台顺手起一个轻量 `localhost:3001` 服务，用户浏览器打开即可配置
- **服务器 SSE 模式：** 复用已有 express 服务，路由 `/admin` 输出单文件 HTML，零额外成本

#### 核心功能

**工具权限开关（解决用户安全感问题）**

小白用户把私人笔记交给 AI，最大顾虑是"AI 会不会删我的笔记"。面板提供可视化开关，用户亲眼勾选每个工具的暴露权限：

| 工具 | 默认状态 | 说明 |
|------|----------|------|
| `search_memos` | ✅ 开启 | 只读，安全 |
| `list_memos` | ✅ 开启 | 只读，安全 |
| `get_memo` | ✅ 开启 | 只读，安全 |
| `create_memo` | ⬜ 关闭 | 写操作，用户按需开启 |
| `update_memo` | ⬜ 关闭 | 写操作，用户按需开启 |
| `delete_memo` | ⬜ 关闭 | 危险操作，强烈建议保持关闭 |

**搜索引擎升级入口**

面板里放置 Tier 2 开启开关，点击后显示实时进度：

```
📥 下载模型组件... (45%)
🧠 正在向量化过往笔记... (230 / 1000)
✅ 引擎启动完成！
```

进度条吸收用户等待焦虑，用户能切实看到"系统正在变聪明"的过程，耐心成倍增加。

**配置持久化**

所有面板配置写入 `acks-mcp-config.json`，MCP Server 启动时读取，决定工具注册与搜索引擎级别。

---

### v1.3 — AI 对话无感升级（Zero-Touch Hot Upgrade）

**设计目标：** 连面板都不用打开，在聊天窗口里就能完成引擎升级，适合懒人用户。

#### 新增工具：`upgrade_search_engine`

当 `search_memos` 返回 0 条结果时，MCP 在返回体中携带升级引导：

```json
{
  "memos": [],
  "totalMatches": 0,
  "upgrade_available": true,
  "upgrade_hint": "当前为基础搜索模式，未找到匹配笔记。如需语义联想搜索能力，可授权开启高级引擎。"
}
```

用户对 Agent 说"好"或"开启"，Agent 调用 `upgrade_search_engine()`。

#### 异步启动，立即返回

工具调用后 0.1 秒内返回，绝不挂起：

```json
{
  "status": "started_in_background",
  "estimated_minutes": 2,
  "user_message_hint": "引擎升级已在后台启动，预计2分钟完成，期间继续使用基础模式。",
  "developer_note": "CRITICAL: Do not block or wait. Relay 'user_message_hint' to the user immediately and gracefully end this turn."
}
```

**字段设计原则：** 数据（Data）、话术（Hint）、行为指令（Instruction）严格分离，防止弱模型把指令原文复读给用户。

#### Piggyback 完成通知

后台任务完成后，在内存设置标志位 `pending_notification = true`。下次用户发起任何工具调用时，一次性携带通知，随后清空标志位：

```json
{
  "engine_used": "vector_semantic_v1",
  "engine_just_upgraded": true,
  "upgrade_notification_hint": "高级搜索引擎已在后台完成初始化，现在搜索更智能了。",
  "memos": [...],
  "totalMatches": 1
}
```

`engine_just_upgraded` 为布尔标志（机器可读），`upgrade_notification_hint` 为话术（模型可用），分离干净，弱模型和强模型都能正确处理。

---

## 用户覆盖矩阵

| 用户类型 | 发现 Tier 2 的路径 | 完成升级的方式 |
|----------|-------------------|---------------|
| 极客用户 | README / `.env.example` 注释 | 手动设置环境变量 |
| 普通用户 | Web 管理面板 | 点击开关 + 进度条 |
| 懒人用户 | Agent 在搜索失败时主动提示 | 聊天窗口说"好" |
| 小白用户 | Agent 用大白话解释，不提"环境变量" | 聊天窗口说"好" |

---

## 设计原则总结

1. **基础设施对最弱消费者负责。** 不假设用户背后是顶级大模型，语义补偿下沉到 MCP 层。
2. **默认零依赖，高级功能可选。** Tier 1 即装即用，Tier 2 显式开启，不因高级功能拖累基础体验。
3. **结构化 API 防御弱模型。** JSON 返回体中数据、话术、指令严格分字段，不依赖模型理解自然语言指令。
4. **可视化解决安全感问题。** 权限开关让用户亲眼看到 AI 能做什么、不能做什么。
5. **双通道覆盖所有用户。** Web 面板给需要掌控感的用户，AI 对话给需要懒人体验的用户。

---

*ACKS Memos MCP Server — Developed by ACKS / shynloc*
*Last updated: 2026-05-22*
