import fs from "fs/promises";
import path from "path";

export interface McpConfig {
  tools: {
    search_memos: boolean;
    list_memos: boolean;
    get_memo: boolean;
    list_tags: boolean;
    create_memo: boolean;
    update_memo: boolean;
    delete_memo: boolean;
    [key: string]: boolean; // Index signature for dynamic tool checking
  };
  search: {
    enable_vector_search: boolean;
  };
}

// ROADMAP v1.2: Default secure configuration. Write tools (create/update/delete) are disabled by default.
const DEFAULT_CONFIG: McpConfig = {
  tools: {
    search_memos: true,
    list_memos: true,
    get_memo: true,
    list_tags: true,
    create_memo: false,
    update_memo: false,
    delete_memo: false,
  },
  search: {
    enable_vector_search: false,
  },
};

export class ConfigManager {
  private configPath: string;
  private config: McpConfig;

  constructor(configDir: string = process.cwd()) {
    // Keep configuration file in the working directory
    this.configPath = path.join(configDir, "acks-mcp-config.json");
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // Deep copy defaults
  }

  /**
   * Loads the configuration from disk. If missing or corrupted, writes defaults.
   */
  async load(): Promise<McpConfig> {
    try {
      const data = await fs.readFile(this.configPath, "utf-8");
      const parsed = JSON.parse(data);
      
      // Deep merge with defaults to ensure schema consistency (prevents crashes on missing keys)
      this.config = {
        tools: { ...DEFAULT_CONFIG.tools, ...(parsed.tools || {}) },
        search: { ...DEFAULT_CONFIG.search, ...(parsed.search || {}) },
      };
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File doesn't exist, create it with safe defaults
        await this.save();
      } else {
        console.error(`[ConfigManager] Warning: Failed to parse config file, falling back to safe defaults. Error: ${error.message}`);
        this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      }
    }
    return this.config;
  }

  /**
   * Saves the current memory configuration to disk safely.
   */
  async save(): Promise<void> {
    try {
      // Write safely (could be enhanced with a temp file rename in high-concurrency, but sufficient here)
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), "utf-8");
    } catch (error: any) {
      console.error(`[ConfigManager] Error: Failed to write configuration to disk. ${error.message}`);
    }
  }

  /**
   * Updates partial configuration and persists it.
   */
  async update(newConfig: Partial<McpConfig>): Promise<McpConfig> {
    if (newConfig.tools) {
      this.config.tools = { ...this.config.tools, ...newConfig.tools };
    }
    if (newConfig.search) {
      this.config.search = { ...this.config.search, ...newConfig.search };
    }
    await this.save();
    return this.config;
  }

  /**
   * Gets a readonly snapshot of the current configuration.
   */
  getConfig(): Readonly<McpConfig> {
    return this.config;
  }
}
