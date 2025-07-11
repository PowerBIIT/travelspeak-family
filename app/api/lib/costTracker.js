// Dummy cost tracker - does nothing
export function checkCostLimit() {
  return { allowed: true };
}

export function addCost() {
  // Do nothing
}

export function estimateCost() {
  return 0;
}

export function getCostHeaders() {
  return {};
}

export function getCostStats() {
  return {
    current: { daily: 0, hourly: 0 },
    remaining: { daily: 999, hourly: 999 }
  };
}