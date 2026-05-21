import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MemosClient } from "./memos.js";
import { ConfigManager } from "./config.js";
import { globalVectorEngine } from "./vectorEngine.js";

// Global state for Piggyback Notifications
let pendingUpgradeNotification = false;

export async function createMemosMcpServer(configManager: ConfigManager): Promise<Server> {
  const server = new Server(
    {
      name: "acks-memos-mcp-server",
      version: "1.0.1",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Lazy initialize client so environment variables are checked when starting the server
  let clientInstance: MemosClient | null = null;
  const getClient = (): MemosClient => {
    if (!clientInstance) {
      clientInstance = new MemosClient();
    }
    return clientInstance;
  };

  // Register Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "memos://latest",
          name: "Latest Memos",
          description: "A list of the 10 most recent memos",
          mimeType: "application/json",
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const client = getClient();

    if (uri === "memos://latest") {
      try {
        const response = await client.listMemos(10);
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(response.memos, null, 2),
            },
          ],
        };
      } catch (error: any) {
        throw new Error(`Failed to read resource memos://latest: ${error.message}`);
      }
    }

    throw new Error(`Resource not found: ${uri}`);
  });

  // Register Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const allTools = [
        {
          name: "create_memo",
          description: "Create a new memo note in your self-hosted Memos instance.",
          inputSchema: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "The body content of the memo. Supports markdown, including tags (e.g., #tag/subtag or #todo).",
              },
              visibility: {
                type: "string",
                enum: ["PUBLIC", "PROTECTED", "PRIVATE"],
                description: "Visibility level. Defaults to PRIVATE.",
              },
            },
            required: ["content"],
          },
        },
        {
          name: "list_memos",
          description: "List recent memos with optional page size and filter.",
          inputSchema: {
            type: "object",
            properties: {
              pageSize: {
                type: "number",
                description: "Max number of memos to return (default is 20).",
              },
              pageToken: {
                type: "string",
                description: "Pagination token for the next page of results.",
              },
              filter: {
                type: "string",
                description: "Google AIP-160 filter expression. E.g., to list public memos: visibility == 'PUBLIC'",
              },
            },
          },
        },
        {
          name: "get_memo",
          description: "Get a specific memo by its unique numerical ID.",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Numerical ID of the memo (e.g. '12' or 'memos/12').",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "update_memo",
          description: "Update content, visibility, or status of an existing memo.",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Numerical ID of the memo to update.",
              },
              content: {
                type: "string",
                description: "Updated body content of the memo.",
              },
              visibility: {
                type: "string",
                enum: ["PUBLIC", "PROTECTED", "PRIVATE"],
                description: "Updated visibility level.",
              },
              rowStatus: {
                type: "string",
                enum: ["ACTIVE", "ARCHIVED"],
                description: "Set to ARCHIVED to archive the memo, or ACTIVE to restore it.",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "delete_memo",
          description: "Permanently delete an existing memo by its ID.",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Numerical ID of the memo to delete.",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "search_memos",
          description: "Search for memos containing a query keyword or matching specific tags.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Substring query or hashtag to search in memo contents.",
              },
              limit: {
                type: "number",
                description: "Maximum number of matching memos to return (default 50).",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "list_tags",
          description: "List all unique tags extracted from your memos.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "upgrade_search_engine",
          description: "One-click tool to upgrade the AI's search engine to Tier 2 (Vector Semantic Search). Call this if you cannot find what the user needs with basic search.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        }
    ];

    const currentConfig = configManager.getConfig();
    const activeTools = allTools.filter(tool => {
      if (tool.name === "upgrade_search_engine") return true;
      return currentConfig.tools[tool.name] === true;
    });

    return {
      tools: activeTools,
    };
  });

  // Call Tool Handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    // Security Check: Ensure tool is enabled in configuration
    const currentConfig = configManager.getConfig();
    if (name !== "upgrade_search_engine" && !currentConfig.tools[name]) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Access Denied: The tool '${name}' is currently disabled in the ACKS Memos MCP Server configuration. Please enable it in the Web Admin Panel or config file to use it.`,
          },
        ],
      };
    }

    const client = getClient();

    try {
      switch (name) {
        case "upgrade_search_engine": {
          // 1. Enable it in config
          await configManager.update({ search: { enable_vector_search: true } });
          // 2. Set piggyback flag
          pendingUpgradeNotification = true;
          // 3. Trigger background load (Async fire-and-forget)
          globalVectorEngine.init().catch(e => console.error("[Background Init] Engine failed:", e));
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "started_in_background",
                  estimated_minutes: 1,
                  user_message_hint: "高级搜索引擎下载及初始化任务已在后台开启。预计耗时1-2分钟，进化完成后系统会自动切换引擎。",
                  developer_note: "CRITICAL: Do not block or wait. Relay 'user_message_hint' to the user immediately and gracefully end this turn."
                }),
              },
            ],
          };
        }

        case "create_memo": {
          const { content, visibility } = args as { content: string; visibility?: "PUBLIC" | "PROTECTED" | "PRIVATE" };
          const memo = await client.createMemo({ content, visibility });
          return {
            content: [
              {
                type: "text",
                text: `Successfully created memo ${memo.name}:\n\nID: ${client.parseId(memo.name)}\nContent: ${memo.content}\nVisibility: ${memo.visibility}`,
              },
            ],
          };
        }

        case "list_memos": {
          const { pageSize, pageToken, filter } = args as { pageSize?: number; pageToken?: string; filter?: string };
          const response = await client.listMemos(pageSize || 20, pageToken, filter);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        }

        case "get_memo": {
          const { id } = args as { id: string };
          const memo = await client.getMemo(id);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(memo, null, 2),
              },
            ],
          };
        }

        case "update_memo": {
          const { id, content, visibility, rowStatus } = args as {
            id: string;
            content?: string;
            visibility?: "PUBLIC" | "PROTECTED" | "PRIVATE";
            rowStatus?: "ACTIVE" | "ARCHIVED";
          };
          const memo = await client.updateMemo(id, { content, visibility, rowStatus });
          return {
            content: [
              {
                type: "text",
                text: `Successfully updated memo ${memo.name}:\n\nID: ${client.parseId(memo.name)}\nContent: ${memo.content}\nVisibility: ${memo.visibility}\nStatus: ${memo.rowStatus || "ACTIVE"}`,
              },
            ],
          };
        }

        case "delete_memo": {
          const { id } = args as { id: string };
          await client.deleteMemo(id);
          return {
            content: [
              {
                type: "text",
                text: `Successfully deleted memo with ID ${id}`,
              },
            ],
          };
        }

        case "search_memos": {
          const { query, limit } = args as { query: string; limit?: number };
          
          // Paginate through all memos (up to 1000) for thorough searching
          const allMemos: Array<{ name: string; content: string; visibility: string; createTime?: string; updateTime?: string }> = [];
          let searchPageToken: string | undefined;
          const maxSearchMemos = 1000;

          do {
            const page = await client.listMemos(200, searchPageToken);
            if (page.memos && Array.isArray(page.memos)) {
              allMemos.push(...page.memos);
            }
            searchPageToken = page.nextPageToken;
          } while (searchPageToken && allMemos.length < maxSearchMemos);

          let filteredMemos: any[] = [];
          let currentEngine = "tokenized_and_v1";

          if (currentConfig.search.enable_vector_search) {
            try {
              if (!globalVectorEngine.isReady()) {
                await globalVectorEngine.init();
              }
              // JIT Sync
              await globalVectorEngine.syncMemos(allMemos);
              const queryVector = await globalVectorEngine.getEmbedding(query);
              filteredMemos = globalVectorEngine.search(queryVector, allMemos, limit || 50);
              currentEngine = "vector_semantic_v1";
            } catch (err: any) {
              console.error("[VectorEngine] Error during search, falling back to basic:", err);
              // Fallback to basic search
              const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
              filteredMemos = allMemos.filter((memo) => {
                const lowerContent = memo.content.toLowerCase();
                return tokens.every(token => lowerContent.includes(token));
              });
            }
          } else {
            // Tier 1 logic
            const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
            filteredMemos = allMemos.filter((memo) => {
              const lowerContent = memo.content.toLowerCase();
              return tokens.every(token => lowerContent.includes(token));
            });
          }

          const maxResults = limit || 50;
          const truncatedMemos = filteredMemos.slice(0, maxResults);

          const responseJson: any = {
            memos: truncatedMemos,
            totalMatches: filteredMemos.length,
            engine_used: currentEngine,
          };

          // Append Piggyback Notification if upgrade just finished
          if (pendingUpgradeNotification && globalVectorEngine.isReady()) {
            responseJson.engine_just_upgraded = true;
            responseJson.upgrade_notification_hint = "高级搜索引擎已在后台完成初始化，现在的搜索能力变得更加智能了！";
            pendingUpgradeNotification = false; // Consume the notification
          }

          // Suggest upgrade if using basic engine and no results found
          if (currentEngine === "tokenized_and_v1" && filteredMemos.length === 0) {
            responseJson.upgrade_available = true;
            responseJson.upgrade_hint = "当前为基础字面匹配，未找到结果。如需语义联想搜索能力，请主动询问用户：'需要我一键为您开启高级语义引擎吗？' 如果用户同意，请立刻调用 upgrade_search_engine 工具。";
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(responseJson, null, 2),
              },
            ],
          };
        }

        case "list_tags": {
          const tags = await client.listTags();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ tags }, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Tool not found: ${name}`);
      }
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error executing tool ${name}: ${error.message}`,
          },
        ],
      };
    }
  });

  return server;
}
