/**
 * Sliding-window rate limiter.
 * Tracks request timestamps per key and rejects requests that exceed
 * the allowed burst within the given window.
 */
export class RateLimiter {
  private readonly windows = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  /**
   * Returns true if the request is allowed, false if rate-limited.
   */
  check(key: string): boolean {
    const now = Date.now();
    const timestamps = this.windows.get(key) ?? [];

    // Evict entries outside the sliding window
    const cutoff = now - this.windowMs;
    const recent = timestamps.filter((t) => t > cutoff);

    if (recent.length >= this.maxRequests) {
      this.windows.set(key, recent);
      return false;
    }

    recent.push(now);
    this.windows.set(key, recent);
    return true;
  }
}

/** Default: 10 requests per minute per IP */
export const uploadRateLimiter = new RateLimiter(10, 60_000);