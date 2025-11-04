/**
 * Pro Subscription Pricing Calculator
 * Calculates personalized pricing based on user's expected usage
 */

// Anthropic Claude Opus pricing per fact-check
const COST_PER_FACT_CHECK = 0.011; // $0.011 per check (Stage 1 + Stage 2)

// Base profit margin
const BASE_PROFIT_MARGIN = 5.0; // $5 base profit

/**
 * Calculate monthly Pro subscription price based on expected usage
 * Formula: (Expected checks/month × $0.011) + $5 = Monthly price
 *
 * @param expectedChecksPerMonth - User's expected monthly fact-checks
 * @returns Calculated monthly price rounded to nearest $0.99
 */
export function calculateProPrice(expectedChecksPerMonth: number): number {
  // Calculate cost
  const monthlyCost = expectedChecksPerMonth * COST_PER_FACT_CHECK;

  // Add profit margin
  const totalPrice = monthlyCost + BASE_PROFIT_MARGIN;

  // Round to nearest .99 (looks better: $9.99 instead of $10.05)
  const rounded = Math.ceil(totalPrice) - 0.01;

  // Minimum price: $4.99 (even for low usage)
  return Math.max(4.99, rounded);
}

/**
 * Get pricing tiers based on common usage patterns
 */
export function getPricingTiers(): Array<{
  name: string;
  checksPerMonth: number;
  price: number;
  savingsVsFree: string;
}> {
  return [
    {
      name: 'Light User',
      checksPerMonth: 30, // ~1/day
      price: calculateProPrice(30),
      savingsVsFree: 'Best for casual fact-checking',
    },
    {
      name: 'Regular User',
      checksPerMonth: 100, // ~3/day
      price: calculateProPrice(100),
      savingsVsFree: 'Most popular',
    },
    {
      name: 'Power User',
      checksPerMonth: 300, // ~10/day
      price: calculateProPrice(300),
      savingsVsFree: 'For heavy users',
    },
    {
      name: 'Unlimited',
      checksPerMonth: 1000, // ~33/day
      price: calculateProPrice(1000),
      savingsVsFree: 'No limits, premium quality',
    },
  ];
}

/**
 * Estimate user's expected monthly usage based on current behavior
 */
export async function estimateMonthlyUsage(): Promise<number> {
  // Get user's trial info to see historical usage
  const result = await chrome.storage.local.get('fact_it_trial');
  const trialInfo = result.fact_it_trial;

  if (!trialInfo || trialInfo.totalChecks === 0) {
    // No history, suggest middle tier
    return 100;
  }

  // Calculate average checks per day
  const daysUsed = Math.max(1, calculateDaysSinceStart(trialInfo.startDate));
  const averagePerDay = trialInfo.totalChecks / daysUsed;

  // Project to monthly (30 days)
  const projectedMonthly = Math.round(averagePerDay * 30);

  // Cap at reasonable maximum
  return Math.min(1000, Math.max(30, projectedMonthly));
}

/**
 * Calculate days since start date
 */
function calculateDaysSinceStart(startDate: number): number {
  const now = Date.now();
  const diffMs = now - startDate;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get recommended pricing tier for user
 */
export async function getRecommendedTier(): Promise<{
  checksPerMonth: number;
  price: number;
  description: string;
}> {
  const estimated = await estimateMonthlyUsage();
  const price = calculateProPrice(estimated);

  let description = '';
  if (estimated <= 30) {
    description = 'Perfect for casual fact-checking';
  } else if (estimated <= 100) {
    description = 'Great for regular users';
  } else if (estimated <= 300) {
    description = 'Ideal for power users';
  } else {
    description = 'Unlimited premium quality';
  }

  return {
    checksPerMonth: estimated,
    price,
    description,
  };
}
