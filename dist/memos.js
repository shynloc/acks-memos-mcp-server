import dotenv from "dotenv";
dotenv.config();
export class MemosClient {
    baseUrl;
    token;
    constructor(baseUrl, token) {
        this.baseUrl = (baseUrl || process.env.MEMOS_API_URL || "").replace(/\/$/, "");
        this.token = token || process.env.MEMOS_ACCESS_TOKEN || "";
        if (!this.baseUrl) {
            throw new Error("Memos API URL is required. Please set MEMOS_API_URL or pass it to constructor.");
        }
        if (!this.token) {
            throw new Error("Memos access token is required. Please set MEMOS_ACCESS_TOKEN or pass it to constructor.");
        }
    }
    getHeaders() {
        return {
            "Authorization": `Bearer ${this.token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
        };
    }
    /**
     * Helper to parse the numerical ID from a memo name (e.g., "memos/123" -> "123")
     */
    parseId(name) {
        return name.split("/").pop() || name;
    }
    /**
     * Create a new memo
     */
    async createMemo(request) {
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
        return (await response.json());
    }
    /**
     * List memos with optional filtering and pagination
     */
    async listMemos(pageSize = 20, pageToken, filter) {
        const params = new URLSearchParams();
        params.append("pageSize", pageSize.toString());
        if (pageToken)
            params.append("pageToken", pageToken);
        if (filter)
            params.append("filter", filter);
        const url = `${this.baseUrl}/api/v1/memos?${params.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to list memos: ${response.statusText} (${response.status}) - ${errText}`);
        }
        return (await response.json());
    }
    /**
     * Get a memo by ID
     */
    async getMemo(id) {
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
        return (await response.json());
    }
    /**
     * Update a memo by ID (using PATCH and updateMask)
     */
    async updateMemo(id, request) {
        const cleanId = this.parseId(id);
        const updateMask = [];
        const payload = {};
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
        return (await response.json());
    }
    /**
     * Delete a memo by ID
     */
    async deleteMemo(id) {
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
     * Extract tags from recent memos on the client side
     */
    async listTags() {
        // Fetch a large page (e.g., 200 memos) to extract tags
        const response = await this.listMemos(200);
        const tags = new Set();
        // Regular expression for hashtags (e.g., #tag, #work/subwork)
        // Matches # followed by word chars, Han characters, or slashes (sub-tags)
        const tagRegex = /#([a-zA-Z0-9_\u4e00-\u9fa5]+(\/[a-zA-Z0-9_\u4e00-\u9fa5]+)*)/g;
        if (response.memos && Array.isArray(response.memos)) {
            for (const memo of response.memos) {
                let match;
                // Reset regex index
                tagRegex.lastIndex = 0;
                while ((match = tagRegex.exec(memo.content)) !== null) {
                    tags.add(match[1]); // match[1] contains the tag without '#'
                }
            }
        }
        return Array.from(tags).sort();
    }
}
