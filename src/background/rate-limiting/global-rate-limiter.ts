/**
 * Global Rate Limiter for Shared API Keys
 * Tracks usage across all extension users to prevent hitting provider limits
 */

import { STORAGE_KEYS } from '@/shared/types';

interface GlobalRateLimitInfo {
  date: string; // YYYY-MM-DD
  totalRequests: number;
  limit: number;
  resetTime: number; // timestamp when limit resets
}

interface ProviderLimits {
  groq: number; // 14,400 requests/day
  // Add other providers if you embed their keys
}

const PROVIDER_LIMITS: ProviderLimits = {
  groq: 14400, // Groq free tier daily limit
};

// Storage key for global rate limiting
const GLOBAL_LIMIT_KEY = 'fact_it_global_rate_limit';

/**
 * Check if we can make a request to the provider (global limit)
 */
export async function canMakeGlobalRequest(providerId: 'groq'): Promise<{
  allowed: boolean;
  remaining: number;
  total: number;
  resetTime: number;
  warningThreshold: boolean; // True if approaching limit (>80%)
}> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const result = await chrome.storage.local.get(GLOBAL_LIMIT_KEY);
    let limitInfo: GlobalRateLimitInfo = result[GLOBAL_LIMIT_KEY];

    // Initialize or reset if new day
    if (!limitInfo || limitInfo.date !== today) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      limitInfo = {
        date: today,
        totalRequests: 0,
        limit: PROVIDER_LIMITS[providerId],
        resetTime: tomorrow.getTime(),
      };
      await chrome.storage.local.set({ [GLOBAL_LIMIT_KEY]: limitInfo });
    }

    const remaining = limitInfo.limit - limitInfo.totalRequests;
    const allowed = remaining > 0;
    const warningThreshold = limitInfo.totalRequests / limitInfo.limit >= 0.8; // 80% used

    return {
      allowed,
      remaining,
      total: limitInfo.limit,
      resetTime: limitInfo.resetTime,
      warningThreshold,
    };
  } catch (error) {
    console.error('Error checking global rate limit:', error);
    // On error, allow request (fail open)
    return {
      allowed: true,
      remaining: 1000,
      total: PROVIDER_LIMITS[providerId],
      resetTime: Date.now() + 24 * 60 * 60 * 1000,
      warningThreshold: false,
    };
  }
}

/**
 * Increment global request counter after successful request
 */
export async function incrementGlobalRequestCount(providerId: 'groq'): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await chrome.storage.local.get(GLOBAL_LIMIT_KEY);
    let limitInfo: GlobalRateLimitInfo = result[GLOBAL_LIMIT_KEY];

    // Initialize if doesn't exist
    if (!limitInfo || limitInfo.date !== today) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      limitInfo = {
        date: today,
        totalRequests: 0,
        limit: PROVIDER_LIMITS[providerId],
        resetTime: tomorrow.getTime(),
      };
    }

    // Increment counter
    limitInfo.totalRequests++;

    // Save back
    await chrome.storage.local.set({ [GLOBAL_LIMIT_KEY]: limitInfo });

    // Log warning if approaching limit
    if (limitInfo.totalRequests / limitInfo.limit >= 0.9) {
      console.warn(
        `⚠️ Global rate limit warning: ${limitInfo.totalRequests}/${limitInfo.limit} requests used (${Math.round((limitInfo.totalRequests / limitInfo.limit) * 100)}%)`
      );
    }
  } catch (error) {
    console.error('Error incrementing global request count:', error);
  }
}

/**
 * Get global rate limit status for display to user
 */
export async function getGlobalRateLimitStatus(providerId: 'groq'): Promise<{
  used: number;
  total: number;
  remaining: number;
  percentUsed: number;
  resetTime: number;
  estimatedUsersToday: number;
}> {
  try {
    const result = await chrome.storage.local.get(GLOBAL_LIMIT_KEY);
    const limitInfo: GlobalRateLimitInfo = result[GLOBAL_LIMIT_KEY];

    if (!limitInfo) {
      return {
        used: 0,
        total: PROVIDER_LIMITS[providerId],
        remaining: PROVIDER_LIMITS[providerId],
        percentUsed: 0,
        resetTime: Date.now() + 24 * 60 * 60 * 1000,
        estimatedUsersToday: 0,
      };
    }

    const remaining = limitInfo.limit - limitInfo.totalRequests;
    const percentUsed = Math.round((limitInfo.totalRequests / limitInfo.limit) * 100);
    const estimatedUsersToday = Math.floor(limitInfo.totalRequests / 10); // Assume avg 10 checks per user

    return {
      used: limitInfo.totalRequests,
      total: limitInfo.limit,
      remaining: Math.max(0, remaining),
      percentUsed,
      resetTime: limitInfo.resetTime,
      estimatedUsersToday,
    };
  } catch (error) {
    console.error('Error getting global rate limit status:', error);
    return {
      used: 0,
      total: PROVIDER_LIMITS[providerId],
      remaining: PROVIDER_LIMITS[providerId],
      percentUsed: 0,
      resetTime: Date.now() + 24 * 60 * 60 * 1000,
      estimatedUsersToday: 0,
    };
  }
}

/**
 * Format time remaining until reset
 */
export function formatTimeUntilReset(resetTime: number): string {
  const now = Date.now();
  const diff = resetTime - now;

  if (diff <= 0) return 'Now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Generate user-friendly error message when global limit reached
 */
export function getGlobalLimitErrorMessage(resetTime: number): string {
  const timeRemaining = formatTimeUntilReset(resetTime);
  return `🌍 Free tier limit reached for today. The extension has been used by many users today and reached Groq's daily limit.

Options:
1. ⏰ Try again in ${timeRemaining} (resets at midnight UTC)
2. 🔑 Add your own Groq API key in settings (free at console.groq.com)
3. ⭐ Upgrade to Pro for unlimited checks with your own API keys

This helps us keep the extension free for everyone!`;
}
