export interface Memo {
    name: string;
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
export declare class MemosClient {
    private baseUrl;
    private token;
    constructor(baseUrl?: string, token?: string);
    private getHeaders;
    /**
     * Helper to parse the numerical ID from a memo name (e.g., "memos/123" -> "123")
     */
    parseId(name: string): string;
    /**
     * Create a new memo
     */
    createMemo(request: CreateMemoRequest): Promise<Memo>;
    /**
     * List memos with optional filtering and pagination
     */
    listMemos(pageSize?: number, pageToken?: string, filter?: string): Promise<ListMemosResponse>;
    /**
     * Get a memo by ID
     */
    getMemo(id: string): Promise<Memo>;
    /**
     * Update a memo by ID (using PATCH and updateMask)
     */
    updateMemo(id: string, request: UpdateMemoRequest): Promise<Memo>;
    /**
     * Delete a memo by ID
     */
    deleteMemo(id: string): Promise<void>;
    /**
     * Extract tags from recent memos on the client side
     */
    listTags(): Promise<string[]>;
}
