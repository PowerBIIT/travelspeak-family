// Cost tracking utility to prevent API cost overruns
// Tracks daily spending and blocks requests when limit is reached

// In-memory storage for cost tracking
let dailyCost = 0;
let hourlyCost = 0;
let lastDayReset = new Date().toDateString();
let lastHourReset = new Date().getHours();
let requestLog = [];

// Cost limits from environment or defaults
const DAILY_LIMIT = parseFloat(process.env.DAILY_COST_LIMIT || '5.00');
const HOURLY_LIMIT = parseFloat(process.env.HOURLY_COST_LIMIT || '2.00');
const ALERT_THRESHOLD = parseFloat(process.env.COST_ALERT_THRESHOLD || '3.00');

// Cost estimates per service
const SERVICE_COSTS = {
  whisper: {
    base: 0.006, // $0.006 per minute
    unit: 'minute'
  },
  gpt4mini: {
    input: 0.00015, // $0.15 per 1M tokens
    output: 0.0006,  // $0.60 per 1M tokens
    unit: 'token'
  },
  tts: {
    base: 0.015, // $15 per 1M characters
    unit: 'character'
  },
  vision: {
    base: 0.01, // $0.01 per image (high detail)
    unit: 'image'
  }
};

// Reset costs if day/hour changed
function checkAndResetCounters() {
  const now = new Date();
  const currentDay = now.toDateString();
  const currentHour = now.getHours();
  
  // Reset daily counter at midnight
  if (currentDay !== lastDayReset) {
    console.log(`[CostTracker] Daily reset: $${dailyCost.toFixed(4)} spent yesterday`);
    dailyCost = 0;
    lastDayReset = currentDay;
    requestLog = requestLog.filter(log => 
      now.getTime() - log.timestamp < 24 * 60 * 60 * 1000
    );
  }
  
  // Reset hourly counter
  if (currentHour !== lastHourReset) {
    console.log(`[CostTracker] Hourly reset: $${hourlyCost.toFixed(4)} spent last hour`);
    hourlyCost = 0;
    lastHourReset = currentHour;
  }
}

// Check if adding cost would exceed limits
export function checkCostLimit(estimatedCost, service = 'unknown') {
  checkAndResetCounters();
  
  const totalDailyCost = dailyCost + estimatedCost;
  const totalHourlyCost = hourlyCost + estimatedCost;
  
  // Check daily limit
  if (totalDailyCost > DAILY_LIMIT) {
    return {
      allowed: false,
      reason: 'daily_limit',
      message: `Dzienny limit kosztów ($${DAILY_LIMIT}) zostanie przekroczony. Obecne wydatki: $${dailyCost.toFixed(2)}`,
      currentCost: dailyCost,
      limit: DAILY_LIMIT,
      estimatedCost
    };
  }
  
  // Check hourly limit
  if (totalHourlyCost > HOURLY_LIMIT) {
    return {
      allowed: false,
      reason: 'hourly_limit', 
      message: `Godzinowy limit kosztów ($${HOURLY_LIMIT}) zostanie przekroczony. Spróbuj ponownie za ${60 - new Date().getMinutes()} minut.`,
      currentCost: hourlyCost,
      limit: HOURLY_LIMIT,
      estimatedCost
    };
  }
  
  // Check if approaching daily limit (alert threshold)
  if (totalDailyCost > ALERT_THRESHOLD && dailyCost <= ALERT_THRESHOLD) {
    console.warn(`[CostTracker] ⚠️ Approaching daily limit: $${totalDailyCost.toFixed(2)} / $${DAILY_LIMIT}`);
  }
  
  return {
    allowed: true,
    currentDailyCost: dailyCost,
    currentHourlyCost: hourlyCost,
    remainingDaily: DAILY_LIMIT - dailyCost,
    remainingHourly: HOURLY_LIMIT - hourlyCost,
    estimatedCost
  };
}

// Add cost after successful API call
export function addCost(actualCost, service = 'unknown', details = {}) {
  checkAndResetCounters();
  
  dailyCost += actualCost;
  hourlyCost += actualCost;
  
  // Log the request
  requestLog.push({
    timestamp: Date.now(),
    service,
    cost: actualCost,
    details,
    dailyTotal: dailyCost,
    hourlyTotal: hourlyCost
  });
  
  // Keep only last 24 hours of logs
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  requestLog = requestLog.filter(log => log.timestamp > oneDayAgo);
  
  console.log(`[CostTracker] Added $${actualCost.toFixed(4)} for ${service}. Daily: $${dailyCost.toFixed(2)}/${DAILY_LIMIT}`);
  
  return {
    dailyCost,
    hourlyCost,
    remainingDaily: Math.max(0, DAILY_LIMIT - dailyCost),
    remainingHourly: Math.max(0, HOURLY_LIMIT - hourlyCost)
  };
}

// Get current cost statistics
export function getCostStats() {
  checkAndResetCounters();
  
  const stats = {
    current: {
      daily: dailyCost,
      hourly: hourlyCost,
      dailyLimit: DAILY_LIMIT,
      hourlyLimit: HOURLY_LIMIT,
      alertThreshold: ALERT_THRESHOLD
    },
    remaining: {
      daily: Math.max(0, DAILY_LIMIT - dailyCost),
      hourly: Math.max(0, HOURLY_LIMIT - hourlyCost),
      dailyPercentage: ((DAILY_LIMIT - dailyCost) / DAILY_LIMIT * 100).toFixed(1),
      hourlyPercentage: ((HOURLY_LIMIT - hourlyCost) / HOURLY_LIMIT * 100).toFixed(1)
    },
    recentRequests: requestLog.slice(-10).reverse(),
    summary: {
      totalRequests: requestLog.length,
      averageCost: requestLog.length > 0 
        ? (requestLog.reduce((sum, log) => sum + log.cost, 0) / requestLog.length).toFixed(4)
        : 0,
      topServices: getTopServices()
    }
  };
  
  return stats;
}

// Helper to get top services by cost
function getTopServices() {
  const serviceTotals = {};
  
  requestLog.forEach(log => {
    if (!serviceTotals[log.service]) {
      serviceTotals[log.service] = { count: 0, totalCost: 0 };
    }
    serviceTotals[log.service].count++;
    serviceTotals[log.service].totalCost += log.cost;
  });
  
  return Object.entries(serviceTotals)
    .map(([service, data]) => ({
      service,
      count: data.count,
      totalCost: data.totalCost.toFixed(4),
      averageCost: (data.totalCost / data.count).toFixed(4)
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5);
}

// Estimate costs for different services
export function estimateCost(service, units) {
  const costs = SERVICE_COSTS[service];
  if (!costs) return 0;
  
  switch (service) {
    case 'whisper':
      return costs.base * units; // units = minutes
    case 'gpt4mini':
      return (costs.input * units.input + costs.output * units.output) / 1000; // units = {input, output} tokens
    case 'tts':
      return (costs.base * units) / 1000000; // units = characters
    case 'vision':
      return costs.base; // fixed cost per image
    default:
      return 0;
  }
}

// Headers to include in responses
export function getCostHeaders(costInfo) {
  return {
    'X-Daily-Cost': dailyCost.toFixed(4),
    'X-Daily-Remaining': Math.max(0, DAILY_LIMIT - dailyCost).toFixed(4),
    'X-Hourly-Cost': hourlyCost.toFixed(4),
    'X-Hourly-Remaining': Math.max(0, HOURLY_LIMIT - hourlyCost).toFixed(4),
    'X-Cost-Limit-Daily': DAILY_LIMIT.toFixed(2),
    'X-Cost-Limit-Hourly': HOURLY_LIMIT.toFixed(2)
  };
}

export default {
  checkCostLimit,
  addCost,
  getCostStats,
  estimateCost,
  getCostHeaders,
  DAILY_LIMIT,
  HOURLY_LIMIT
};