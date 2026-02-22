/**
 * Simple in-memory rate limiter.
 * Tracks request timestamps per IP and enforces a sliding window limit.
 *
 * Stale entries are cleaned up lazily during isAllowed() checks rather than
 * via setInterval, avoiding resource leaks and compatibility issues with
 * serverless environments (Deno Deploy isolates).
 */

const requests = new Map<string, number[]>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;
const CLEANUP_THRESHOLD = 100; // Clean up when map exceeds this many entries

/**
 * Check if a request from the given IP should be rate-limited.
 * Returns true if the request is allowed, false if it should be rejected.
 */
export function isAllowed(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  // Lazy cleanup: prune stale IPs when the map gets large
  if (requests.size > CLEANUP_THRESHOLD) {
    for (const [key, timestamps] of requests) {
      const valid = timestamps.filter((t) => t > cutoff);
      if (valid.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, valid);
      }
    }
  }

  const timestamps = (requests.get(ip) || []).filter((t) => t > cutoff);

  if (timestamps.length >= MAX_REQUESTS) {
    requests.set(ip, timestamps);
    return false;
  }

  timestamps.push(now);
  requests.set(ip, timestamps);
  return true;
}
