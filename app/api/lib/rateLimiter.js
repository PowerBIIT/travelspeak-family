// Rate limiting utility for API endpoints
// This provides an additional layer of rate limiting beyond the middleware

const rateLimitStore = new Map();

// Configuration for different endpoints
const ENDPOINT_LIMITS = {
  translate: {
    requests: 50,
    window: 3600000, // 1 hour
    cost: 0.004 // estimated cost per request
  },
  whisper: {
    requests: 30,
    window: 3600000,
    cost: 0.006 // estimated cost per request
  },
  tts: {
    requests: 50,
    window: 3600000,
    cost: 0.001 // estimated cost per request
  },
  ocr: {
    requests: 20,
    window: 3600000,
    cost: 0.01 // cost per image
  }
};

// Clean up old entries every 10 minutes
if (typeof global !== 'undefined' && !global.rateLimiterCleanupInterval) {
  global.rateLimiterCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 600000);
}

export function checkRateLimit(endpoint, identifier = 'global') {
  const config = ENDPOINT_LIMITS[endpoint];
  if (!config) {
    throw new Error(`Unknown endpoint: ${endpoint}`);
  }

  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  
  let limitData = rateLimitStore.get(key);
  
  if (!limitData || now > limitData.resetTime) {
    limitData = {
      count: 0,
      resetTime: now + config.window,
      firstRequest: now
    };
  }
  
  if (limitData.count >= config.requests) {
    const remainingTime = limitData.resetTime - now;
    return {
      allowed: false,
      remaining: 0,
      resetTime: limitData.resetTime,
      retryAfter: Math.ceil(remainingTime / 1000),
      message: `Przekroczono limit ${config.requests} żądań na godzinę. Spróbuj ponownie za ${Math.ceil(remainingTime / 60000)} minut.`
    };
  }
  
  limitData.count++;
  rateLimitStore.set(key, limitData);
  
  return {
    allowed: true,
    remaining: config.requests - limitData.count,
    resetTime: limitData.resetTime,
    count: limitData.count
  };
}

export function getRateLimitHeaders(result) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetTime),
    ...(result.retryAfter && { 'Retry-After': String(result.retryAfter) })
  };
}

export function getRateLimitStats() {
  const stats = {};
  const now = Date.now();
  
  for (const [key, value] of rateLimitStore.entries()) {
    const [endpoint, identifier] = key.split(':');
    if (!stats[endpoint]) {
      stats[endpoint] = [];
    }
    
    stats[endpoint].push({
      identifier,
      count: value.count,
      remaining: ENDPOINT_LIMITS[endpoint].requests - value.count,
      resetIn: Math.max(0, value.resetTime - now),
      windowStart: value.firstRequest
    });
  }
  
  return stats;
}

// Helper to estimate if user is approaching daily cost limit
export function estimateCostImpact(endpoint, count = 1) {
  const config = ENDPOINT_LIMITS[endpoint];
  if (!config) return 0;
  
  return config.cost * count;
}

export default {
  checkRateLimit,
  getRateLimitHeaders,
  getRateLimitStats,
  estimateCostImpact
};