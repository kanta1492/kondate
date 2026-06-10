/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Config local environment variables
dotenv.config();

let redisClient: Redis | null = null;

/**
 * Lazy initializes Upstash Redis client.
 * Uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
export function getRedisClient(): Redis | null {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      console.warn("[Upstash Redis] Credentials missing in environment variables. Caching deactivated.");
      return null;
    }
    try {
      redisClient = new Redis({
        url,
        token,
      });
      console.log("[Upstash Redis] Connected to remote Redis cache successfully.");
    } catch (e) {
      console.error("[Upstash Redis] Failed to initialize connection:", e);
      return null;
    }
  }
  return redisClient;
}

/**
 * Creates a unique deterministic hash key depending on ingredients request payload
 */
export function generateCacheKey(data: Record<string, any>): string {
  // Sort the properties for consistent JSON stringification
  const sortedString = JSON.stringify(data, Object.keys(data).sort());
  const hash = crypto.createHash('sha256').update(sortedString).digest('hex');
  return `recipe:cache:${hash}`;
}

/**
 * Fetches cached recipes for the given key
 */
export async function getCachedRecipe(key: string): Promise<any | null> {
  const client = getRedisClient();
  if (!client) return null;
  try {
    const cached = await client.get(key);
    if (cached) {
      console.log(`[Upstash Redis] Cache hit for key: ${key}`);
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
  } catch (error) {
    console.warn(`[Upstash Redis] Error fetching cache for key ${key}:`, error);
  }
  return null;
}

/**
 * Saves generated recipes inside Upstash Redis cache (TTL defaults to 24 hours)
 */
export async function setCachedRecipe(key: string, value: any, ttlSeconds: number = 86400): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.set(key, typeof value === 'string' ? value : JSON.stringify(value), {
      ex: ttlSeconds
    });
    console.log(`[Upstash Redis] Successfully cached recipes under: ${key} (TTL: ${ttlSeconds} seconds)`);
  } catch (error) {
    console.warn(`[Upstash Redis] Error writing cache for key ${key}:`, error);
  }
}
