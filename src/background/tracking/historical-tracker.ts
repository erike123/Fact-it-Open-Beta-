/**
 * Historical Tracking System
 * Tracks fact-check history and generates analytics
 */

import type {
  HistoricalCheck,
  HistoricalStats,
  Verdict,
  Platform,
  STORAGE_KEYS,
} from '@/shared/types';
import { STORAGE_KEYS as KEYS } from '@/shared/types';

const MAX_STORED_CHECKS = 100; // Keep last 100 checks
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Add a new check to historical data
 */
export async function trackHistoricalCheck(
  text: string,
  verdict: Verdict,
  confidence: number,
  platform: Platform,
  disagreement: boolean = false
): Promise<void> {
  try {
    // Get existing checks
    const result = await chrome.storage.local.get(KEYS.HISTORICAL_CHECKS);
    let checks: HistoricalCheck[] = result[KEYS.HISTORICAL_CHECKS] || [];

    // Create new check entry
    const newCheck: HistoricalCheck = {
      timestamp: Date.now(),
      text: text.substring(0, 100), // Store first 100 chars only
      verdict,
      confidence,
      platform,
      category: categorizeContent(text), // Auto-categorize
      disagreement,
    };

    // Add to beginning of array
    checks.unshift(newCheck);

    // Keep only last MAX_STORED_CHECKS
    if (checks.length > MAX_STORED_CHECKS) {
      checks = checks.slice(0, MAX_STORED_CHECKS);
    }

    // Save back to storage
    await chrome.storage.local.set({ [KEYS.HISTORICAL_CHECKS]: checks });

    // Update stats
    await updateHistoricalStats(newCheck);
  } catch (error) {
    console.error('Error tracking historical check:', error);
  }
}

/**
 * Auto-categorize content based on keywords
 */
function categorizeContent(text: string): string {
  const textLower = text.toLowerCase();

  const categories = [
    {
      name: 'Politics',
      keywords: [
        'president',
        'election',
        'government',
        'congress',
        'senate',
        'politician',
        'vote',
        'campaign',
        'policy',
        'democrat',
        'republican',
      ],
    },
    {
      name: 'Health',
      keywords: [
        'health',
        'vaccine',
        'medical',
        'disease',
        'doctor',
        'hospital',
        'covid',
        'treatment',
        'drug',
        'symptom',
      ],
    },
    {
      name: 'Science',
      keywords: [
        'science',
        'research',
        'study',
        'scientist',
        'experiment',
        'climate',
        'space',
        'technology',
        'ai',
      ],
    },
    {
      name: 'Economy',
      keywords: [
        'economy',
        'market',
        'stock',
        'inflation',
        'gdp',
        'unemployment',
        'business',
        'finance',
        'bank',
      ],
    },
    {
      name: 'Security',
      keywords: [
        'security',
        'cyber',
        'hack',
        'breach',
        'malware',
        'attack',
        'threat',
        'vulnerability',
        'ransomware',
        'phishing',
      ],
    },
    {
      name: 'Social Media',
      keywords: ['twitter', 'facebook', 'instagram', 'tiktok', 'viral', 'trending', 'influencer'],
    },
  ];

  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (textLower.includes(keyword)) {
        return category.name;
      }
    }
  }

  return 'General';
}

/**
 * Update aggregated historical stats
 */
async function updateHistoricalStats(newCheck: HistoricalCheck): Promise<void> {
  try {
    // Get existing stats
    const result = await chrome.storage.local.get(KEYS.HISTORICAL_STATS);
    let stats: HistoricalStats = result[KEYS.HISTORICAL_STATS] || {
      totalChecks: 0,
      checksThisWeek: 0,
      verdictCounts: { true: 0, false: 0, unknown: 0, no_claim: 0 },
      topCategories: [],
      disagreementRate: 0,
      averageConfidence: 0,
      recentChecks: [],
    };

    // Update total checks
    stats.totalChecks++;

    // Update verdict counts
    stats.verdictCounts[newCheck.verdict]++;

    // Update checks this week (recalculate from recent checks)
    const weekAgo = Date.now() - WEEK_MS;
    const result2 = await chrome.storage.local.get(KEYS.HISTORICAL_CHECKS);
    const allChecks: HistoricalCheck[] = result2[KEYS.HISTORICAL_CHECKS] || [];
    stats.checksThisWeek = allChecks.filter((c) => c.timestamp >= weekAgo).length;

    // Update category counts
    const categoryMap = new Map<string, number>();
    for (const check of allChecks) {
      if (check.category) {
        categoryMap.set(check.category, (categoryMap.get(check.category) || 0) + 1);
      }
    }
    stats.topCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 categories

    // Update disagreement rate
    const disagreementCount = allChecks.filter((c) => c.disagreement).length;
    stats.disagreementRate =
      allChecks.length > 0 ? Math.round((disagreementCount / allChecks.length) * 100) : 0;

    // Update average confidence
    const totalConfidence = allChecks.reduce((sum, c) => sum + c.confidence, 0);
    stats.averageConfidence =
      allChecks.length > 0 ? Math.round(totalConfidence / allChecks.length) : 0;

    // Update recent checks (last 50)
    stats.recentChecks = allChecks.slice(0, 50);

    // Save updated stats
    await chrome.storage.local.set({ [KEYS.HISTORICAL_STATS]: stats });
  } catch (error) {
    console.error('Error updating historical stats:', error);
  }
}

/**
 * Get historical stats
 */
export async function getHistoricalStats(): Promise<HistoricalStats> {
  try {
    const result = await chrome.storage.local.get(KEYS.HISTORICAL_STATS);
    return (
      result[KEYS.HISTORICAL_STATS] || {
        totalChecks: 0,
        checksThisWeek: 0,
        verdictCounts: { true: 0, false: 0, unknown: 0, no_claim: 0 },
        topCategories: [],
        disagreementRate: 0,
        averageConfidence: 0,
        recentChecks: [],
      }
    );
  } catch (error) {
    console.error('Error getting historical stats:', error);
    return {
      totalChecks: 0,
      checksThisWeek: 0,
      verdictCounts: { true: 0, false: 0, unknown: 0, no_claim: 0 },
      topCategories: [],
      disagreementRate: 0,
      averageConfidence: 0,
      recentChecks: [],
    };
  }
}

/**
 * Clear historical data
 */
export async function clearHistoricalData(): Promise<void> {
  try {
    await chrome.storage.local.remove([KEYS.HISTORICAL_CHECKS, KEYS.HISTORICAL_STATS]);
  } catch (error) {
    console.error('Error clearing historical data:', error);
  }
}
