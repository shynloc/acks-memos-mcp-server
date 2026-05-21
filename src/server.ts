import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MemosClient } from "./memos.js";

export function createMemosMcpServer(): Server {
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
    return {
      tools: [
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
      ],
    };
  });

  // Call Tool Handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const client = getClient();

    try {
      switch (name) {
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

          // Filter client-side for substring matching
          const lowerQuery = query.toLowerCase();
          const filteredMemos = allMemos.filter((memo) =>
            memo.content.toLowerCase().includes(lowerQuery)
          );

          // Apply limit to the filtered results (default 50)
          const maxResults = limit || 50;
          const truncatedMemos = filteredMemos.slice(0, maxResults);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ memos: truncatedMemos, totalMatches: filteredMemos.length }, null, 2),
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
