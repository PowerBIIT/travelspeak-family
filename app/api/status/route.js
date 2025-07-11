import { NextResponse } from 'next/server';
import { getCostStats } from '../lib/costTracker.js';
import { getRateLimitStats } from '../lib/rateLimiter.js';

export async function GET(request) {
  try {
    const costStats = getCostStats();
    const rateLimitStats = getRateLimitStats();
    
    // Pobierz IP użytkownika
    const ip = request.headers.get('x-forwarded-for') || 'global';
    
    // Znajdź statystyki dla tego IP
    const userRateLimits = {};
    Object.entries(rateLimitStats).forEach(([endpoint, stats]) => {
      const userStat = stats.find(s => s.identifier === ip) || {
        count: 0,
        remaining: parseInt(process.env[`RATE_LIMIT_${endpoint.toUpperCase()}`] || '200'),
        resetIn: 0
      };
      userRateLimits[endpoint] = userStat;
    });
    
    return NextResponse.json({
      costs: {
        daily: {
          used: costStats.current.daily,
          limit: costStats.current.dailyLimit,
          remaining: costStats.remaining.daily,
          percentage: (costStats.current.daily / costStats.current.dailyLimit * 100).toFixed(1)
        },
        hourly: {
          used: costStats.current.hourly,
          limit: costStats.current.hourlyLimit,
          remaining: costStats.remaining.hourly,
          percentage: (costStats.current.hourly / costStats.current.hourlyLimit * 100).toFixed(1)
        }
      },
      rateLimits: userRateLimits,
      alerts: {
        costWarning: costStats.current.daily > costStats.current.alertThreshold,
        dailyLimitClose: costStats.remaining.daily < 1.0,
        hourlyLimitClose: costStats.remaining.hourly < 0.5
      }
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Błąd pobierania statusu' },
      { status: 500 }
    );
  }
}