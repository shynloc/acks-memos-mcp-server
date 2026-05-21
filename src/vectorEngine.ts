let pipeline: any = null;

export class VectorEngine {
  private extractor: any = null;
  private isInitializing: boolean = false;
  private ready: boolean = false;
  
  // Memo ID -> { vector, updatedTs }
  private cache: Map<string, { vector: number[]; updatedTs: number }> = new Map();

  async init() {
    if (this.ready) return;
    if (this.isInitializing) {
      // Wait for initialization to finish
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isInitializing = true;
    try {
      // Dynamic import to avoid loading heavy ML libraries if Tier 2 is disabled
      const transformers = await import("@xenova/transformers");
      // Use a lightweight embedding model
      this.extractor = await transformers.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
        // Quantized version is smaller and faster
        quantized: true,
      });
      this.ready = true;
    } catch (error) {
      console.error("[VectorEngine] Failed to initialize:", error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  isReady() {
    return this.ready;
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!this.ready) await this.init();
    
    // Generate embedding
    const output = await this.extractor(text, { pooling: "mean", normalize: true });
    // Convert Float32Array to standard array
    return Array.from(output.data);
  }

  async syncMemos(memos: any[]) {
    if (!this.ready) await this.init();
    
    let newlyEmbedded = 0;
    
    for (const memo of memos) {
      const cached = this.cache.get(memo.name);
      const memoTs = memo.updateTime ? new Date(memo.updateTime).getTime() : 0;
      
      // Check if cache needs update (doesn't exist, or memo is newer)
      if (!cached || cached.updatedTs < memoTs) {
        try {
          // Clean the content slightly for better embedding
          const cleanContent = memo.content.replace(/#\w+/g, '').trim() || memo.content;
          const vector = await this.getEmbedding(cleanContent);
          
          this.cache.set(memo.name, {
            vector,
            updatedTs: memoTs
          });
          newlyEmbedded++;
        } catch (e) {
          console.error(`[VectorEngine] Error embedding memo ${memo.name}:`, e);
        }
      }
    }
    
    if (newlyEmbedded > 0) {
      console.log(`[VectorEngine] Synced and embedded ${newlyEmbedded} new/updated memos.`);
    }
  }

  search(queryVector: number[], memos: any[], topK: number = 50): any[] {
    const scoredMemos = memos.map((memo) => {
      const cached = this.cache.get(memo.name);
      if (!cached) return { memo, score: -1 }; // Should not happen if syncMemos ran
      
      const score = this.cosineSimilarity(queryVector, cached.vector);
      return { memo, score };
    });

    // Sort descending by score
    scoredMemos.sort((a, b) => b.score - a.score);
    
    // A reasonable similarity threshold for all-MiniLM-L6-v2
    const threshold = 0.3;
    
    return scoredMemos
      .filter((item) => item.score > threshold)
      .slice(0, topK)
      .map((item) => item.memo);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const globalVectorEngine = new VectorEngine();
