// Dummy rate limiter - does nothing
export function checkRateLimit() {
  return { allowed: true };
}

export function getRateLimitHeaders() {
  return {};
}

export function getRateLimitStats() {
  return {};
}