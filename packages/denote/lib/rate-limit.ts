/**
 * Simple in-memory rate limiter.
 * Tracks request timestamps per IP and enforces a sliding window limit.
 */

const requests = new Map<string, number[]>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes

// Periodically clean up stale entries
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, timestamps] of requests) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      requests.delete(ip);
    } else {
      requests.set(ip, valid);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Check if a request from the given IP should be rate-limited.
 * Returns true if the request is allowed, false if it should be rejected.
 */
export function isAllowed(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const timestamps = (requests.get(ip) || []).filter((t) => t > cutoff);

  if (timestamps.length >= MAX_REQUESTS) {
    requests.set(ip, timestamps);
    return false;
  }

  timestamps.push(now);
  requests.set(ip, timestamps);
  return true;
}
