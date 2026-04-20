/**
 * Rate limiter for API routes.
 *
 * - Uses Upstash Redis (REST API) when KV_REST_API_URL/KV_REST_API_TOKEN
 *   or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN are configured.
 *   This is the only mode that works correctly across multiple serverless
 *   instances (Vercel) and survives cold starts.
 *
 * - Falls back to an in-memory sliding window when no KV is configured
 *   (development / single-instance only). The in-memory mode is best-effort
 *   and is logged at startup so it is not silently relied upon in prod.
 *
 * The function is async — all callers MUST await it.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

function getKvCreds(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";
  if (!url || !token) return null;
  return { url, token };
}

let warnedNoKv = false;
function warnNoKvOnce() {
  if (warnedNoKv) return;
  warnedNoKv = true;
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      "[rateLimit] No KV credentials found (KV_REST_API_URL/UPSTASH_REDIS_REST_URL). " +
      "Falling back to in-memory rate limiting — this DOES NOT work correctly " +
      "across multiple serverless instances. Configure Vercel KV / Upstash for production."
    );
  }
}

/**
 * Upstash sliding window via INCR + EXPIRE on a fixed bucket key.
 * This is approximate (fixed window) but cheap (1-2 round trips, no Lua).
 */
async function checkUpstash(
  identifier: string,
  maxRequests: number,
  windowMs: number,
  creds: { url: string; token: string }
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const key = `rl:${identifier}:${bucket}`;
  const ttlSeconds = Math.ceil(windowMs / 1000) + 1;

  // Pipeline: INCR + EXPIRE, single HTTP round trip
  const body = JSON.stringify([
    ["INCR", key],
    ["EXPIRE", key, String(ttlSeconds), "NX"],
  ]);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const res = await fetch(`${creds.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error("[rateLimit] Upstash error:", res.status, await res.text());
      // Fail-open ONLY for read errors (don't lock users out on infra hiccup),
      // but the next request will retry.
      return { allowed: true, remaining: maxRequests - 1, resetAt: (bucket + 1) * windowMs };
    }

    const data = (await res.json()) as Array<{ result?: number; error?: string }>;
    const count = Number(data?.[0]?.result ?? 0);
    const resetAt = (bucket + 1) * windowMs;

    if (count > maxRequests) {
      return { allowed: false, remaining: 0, resetAt };
    }
    return { allowed: true, remaining: Math.max(0, maxRequests - count), resetAt };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("[rateLimit] Upstash fetch failed:", err);
    // Fail-open on network error to avoid breaking the app.
    return { allowed: true, remaining: maxRequests - 1, resetAt: (bucket + 1) * windowMs };
  }
}

function checkInMemory(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanup(windowMs);

  let entry = rateLimitStore.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(identifier, entry);
  }

  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + windowMs,
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetAt: now + windowMs,
  };
}

/**
 * Check if a request is within the rate limit.
 * @param identifier - Unique key (typically IP address or user ID, scoped by feature)
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs = 60_000 } = config;
  const creds = getKvCreds();
  if (creds) {
    return checkUpstash(identifier, maxRequests, windowMs, creds);
  }
  warnNoKvOnce();
  return checkInMemory(identifier, maxRequests, windowMs);
}

/**
 * Extract IP address from request headers.
 * Works with Vercel, Cloudflare, and standard proxy setups.
 */
export function getRequestIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}
