export interface Memo {
  name: string; // e.g., "memos/123"
  content: string;
  visibility: "PUBLIC" | "PROTECTED" | "PRIVATE";
  createTime?: string;
  updateTime?: string;
  creator?: string;
  rowStatus?: "ACTIVE" | "ARCHIVED";
}

export interface ListMemosResponse {
  memos: Memo[];
  nextPageToken?: string;
}

export interface CreateMemoRequest {
  content: string;
  visibility?: "PUBLIC" | "PROTECTED" | "PRIVATE";
}

export interface UpdateMemoRequest {
  content?: string;
  visibility?: "PUBLIC" | "PROTECTED" | "PRIVATE";
  rowStatus?: "ACTIVE" | "ARCHIVED";
}

export class MemosClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl?: string, token?: string) {
    this.baseUrl = (baseUrl || process.env.MEMOS_API_URL || "").replace(/\/$/, "");
    this.token = token || process.env.MEMOS_ACCESS_TOKEN || "";

    if (!this.baseUrl) {
      throw new Error("Memos API URL is required. Please set MEMOS_API_URL or pass it to constructor.");
    }
    if (!this.token) {
      throw new Error("Memos access token is required. Please set MEMOS_ACCESS_TOKEN or pass it to constructor.");
    }
  }

  private getHeaders() {
    return {
      "Authorization": `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }

  /**
   * Helper to parse the numerical ID from a memo name (e.g., "memos/123" -> "123")
   */
  public parseId(name: string): string {
    return name.split("/").pop() || name;
  }

  /**
   * Create a new memo
   */
  async createMemo(request: CreateMemoRequest): Promise<Memo> {
    const url = `${this.baseUrl}/api/v1/memos`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        content: request.content,
        visibility: request.visibility || "PRIVATE",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create memo: ${response.statusText} (${response.status}) - ${errText}`);
    }

    return (await response.json()) as Memo;
  }

  /**
   * List memos with optional filtering and pagination
   */
  async listMemos(pageSize = 20, pageToken?: string, filter?: string): Promise<ListMemosResponse> {
    const params = new URLSearchParams();
    params.append("pageSize", pageSize.toString());
    if (pageToken) params.append("pageToken", pageToken);
    if (filter) params.append("filter", filter);

    const url = `${this.baseUrl}/api/v1/memos?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to list memos: ${response.statusText} (${response.status}) - ${errText}`);
    }

    return (await response.json()) as ListMemosResponse;
  }

  /**
   * Get a memo by ID
   */
  async getMemo(id: string): Promise<Memo> {
    const cleanId = this.parseId(id);
    const url = `${this.baseUrl}/api/v1/memos/${cleanId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to get memo ${cleanId}: ${response.statusText} (${response.status}) - ${errText}`);
    }

    return (await response.json()) as Memo;
  }

  /**
   * Update a memo by ID (using PATCH and updateMask)
   */
  async updateMemo(id: string, request: UpdateMemoRequest): Promise<Memo> {
    const cleanId = this.parseId(id);
    const updateMask: string[] = [];
    const payload: Record<string, any> = {};

    if (request.content !== undefined) {
      updateMask.push("content");
      payload.content = request.content;
    }
    if (request.visibility !== undefined) {
      updateMask.push("visibility");
      payload.visibility = request.visibility;
    }
    if (request.rowStatus !== undefined) {
      updateMask.push("row_status");
      payload.rowStatus = request.rowStatus;
    }

    if (updateMask.length === 0) {
      throw new Error("No fields provided for update.");
    }

    const url = `${this.baseUrl}/api/v1/memos/${cleanId}?updateMask=${updateMask.join(",")}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to update memo ${cleanId}: ${response.statusText} (${response.status}) - ${errText}`);
    }

    return (await response.json()) as Memo;
  }

  /**
   * Delete a memo by ID
   */
  async deleteMemo(id: string): Promise<void> {
    const cleanId = this.parseId(id);
    const url = `${this.baseUrl}/api/v1/memos/${cleanId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to delete memo ${cleanId}: ${response.statusText} (${response.status}) - ${errText}`);
    }
  }

  /**
   * Extract tags from all memos on the client side (paginated)
   */
  async listTags(): Promise<string[]> {
    const tags = new Set<string>();
    
    // Regular expression for hashtags (e.g., #tag, #work/subwork)
    // Matches # followed by word chars, Han characters, or slashes (sub-tags)
    const tagRegex = /#([a-zA-Z0-9_\u4e00-\u9fa5]+(\/[a-zA-Z0-9_\u4e00-\u9fa5]+)*)/g;

    let pageToken: string | undefined;
    let totalFetched = 0;
    const maxMemos = 1000; // Safety cap

    do {
      const response = await this.listMemos(200, pageToken);
      if (response.memos && Array.isArray(response.memos)) {
        for (const memo of response.memos) {
          tagRegex.lastIndex = 0;
          let match;
          while ((match = tagRegex.exec(memo.content)) !== null) {
            tags.add(match[1]);
          }
        }
        totalFetched += response.memos.length;
      }
      pageToken = response.nextPageToken;
    } while (pageToken && totalFetched < maxMemos);

    return Array.from(tags).sort();
  }
}
