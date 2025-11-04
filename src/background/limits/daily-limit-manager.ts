/**
 * Daily Limit Manager
 * Tracks global fact-check usage across all users to protect against API costs
 */

// Global daily limits
const DAILY_FACT_CHECK_LIMIT = 100; // 100 fact-checks per day globally (Google Search limit)

interface DailyLimitInfo {
  date: string; // YYYY-MM-DD
  checksUsed: number;
  lastResetTime: number;
}

/**
 * Get current daily limit information
 */
export async function getDailyLimitInfo(): Promise<{
  checksUsed: number;
  checksRemaining: number;
  limitReached: boolean;
  resetsAt: Date;
}> {
  const result = await chrome.storage.local.get('daily_limit');
  let limitInfo = result.daily_limit as DailyLimitInfo;

  const today = new Date().toISOString().split('T')[0];

  // Initialize or reset if new day
  if (!limitInfo || limitInfo.date !== today) {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Next midnight

    limitInfo = {
      date: today,
      checksUsed: 0,
      lastResetTime: Date.now(),
    };

    await chrome.storage.local.set({ daily_limit: limitInfo });
  }

  const checksRemaining = Math.max(0, DAILY_FACT_CHECK_LIMIT - limitInfo.checksUsed);
  const limitReached = limitInfo.checksUsed >= DAILY_FACT_CHECK_LIMIT;

  // Calculate when limit resets (next midnight)
  const resetsAt = new Date();
  resetsAt.setHours(24, 0, 0, 0);

  return {
    checksUsed: limitInfo.checksUsed,
    checksRemaining,
    limitReached,
    resetsAt,
  };
}

/**
 * Record a fact-check usage (increment counter)
 */
export async function recordDailyUsage(): Promise<void> {
  const result = await chrome.storage.local.get('daily_limit');
  let limitInfo = result.daily_limit as DailyLimitInfo;

  const today = new Date().toISOString().split('T')[0];

  // Ensure we're counting for today
  if (!limitInfo || limitInfo.date !== today) {
    limitInfo = {
      date: today,
      checksUsed: 0,
      lastResetTime: Date.now(),
    };
  }

  limitInfo.checksUsed += 1;

  await chrome.storage.local.set({ daily_limit: limitInfo });

  console.info(`Daily usage: ${limitInfo.checksUsed}/${DAILY_FACT_CHECK_LIMIT}`);
}

/**
 * Check if daily limit has been reached
 */
export async function isDailyLimitReached(): Promise<boolean> {
  const { limitReached } = await getDailyLimitInfo();
  return limitReached;
}

/**
 * Get time until limit resets (in hours)
 */
export function getHoursUntilReset(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const diff = midnight.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60));
}

/**
 * Get formatted reset time
 */
export function getResetTimeFormatted(): string {
  const hours = getHoursUntilReset();

  if (hours === 1) {
    return 'in 1 hour';
  } else if (hours < 24) {
    return `in ${hours} hours`;
  } else {
    return 'at midnight';
  }
}
