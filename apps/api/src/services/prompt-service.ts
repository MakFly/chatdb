import { db } from "../db";
import { prompts } from "../db/schema";
import { eq } from "drizzle-orm";
import { redis } from "../lib/redis";
import { DEFAULT_PROMPTS } from "../db/seeders/prompt-seeder";

class PromptService {
  private static TTL_SEC = 300; // 5 minutes
  private static KEY_PREFIX = "prompt:";

  static async get(slug: string): Promise<string> {
    const key = `${this.KEY_PREFIX}${slug}`;

    // 1. Try Redis cache
    if (redis) {
      try {
        const cached = await redis.get(key);
        if (cached) return cached;
      } catch (e) {
        console.warn("PromptService: Redis read failed", e);
      }
    }

    // 2. Try database
    try {
      const result = await db
        .select({ content: prompts.content })
        .from(prompts)
        .where(eq(prompts.slug, slug))
        .limit(1);

      if (result[0]) {
        // Cache in Redis
        if (redis) {
          try {
            await redis.setex(key, this.TTL_SEC, result[0].content);
          } catch (e) {
            console.warn("PromptService: Redis write failed", e);
          }
        }
        return result[0].content;
      }
    } catch (e) {
      console.error("PromptService: DB error", e);
    }

    // 3. Fallback to hardcoded
    const fallback = DEFAULT_PROMPTS.find((p) => p.slug === slug);
    if (fallback) {
      console.warn(`PromptService: Using fallback for ${slug}`);
      return fallback.content;
    }

    throw new Error(`Unknown prompt: ${slug}`);
  }

  static async invalidate(slug: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(`${this.KEY_PREFIX}${slug}`);
      } catch (e) {
        console.warn("PromptService: Redis delete failed", e);
      }
    }
  }

  static async warmup(): Promise<void> {
    const slugs = DEFAULT_PROMPTS.map((p) => p.slug);
    await Promise.all(slugs.map((s) => this.get(s)));
    console.log(`PromptService: Warmed cache for ${slugs.length} prompts`);
  }
}

export { PromptService };
