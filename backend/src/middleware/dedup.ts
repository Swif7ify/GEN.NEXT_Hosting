/**
 * In-memory submission deduplication cache to protect against rapid accidental double-clicks.
 */
const recentSubmissions = new Map<string, number>();

// Clean up entries older than 30 seconds periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 30000) {
      recentSubmissions.delete(key);
    }
  }
}, 15000);

export function checkAndLockSubmission(service: string, name: string, cooldownMs = 2500): { isDuplicate: boolean; retryAfterMs?: number } {
  // Hash/key based on service and normalized name
  const key = `${service}:${name.toLowerCase()}`;
  const now = Date.now();
  const lastTime = recentSubmissions.get(key);

  if (lastTime && now - lastTime < cooldownMs) {
    return {
      isDuplicate: true,
      retryAfterMs: cooldownMs - (now - lastTime),
    };
  }

  recentSubmissions.set(key, now);
  return { isDuplicate: false };
}
