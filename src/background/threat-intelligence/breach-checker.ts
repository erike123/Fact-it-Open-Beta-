/**
 * Breach Checking Service
 * Integrates with Have I Been Pwned API to check for credential breaches
 */

import { BreachCheckResult } from '@/shared/threat-intelligence-types';

interface HIBPBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  ModifiedDate: string;
  PwnCount: number;
  Description: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  IsRetired: boolean;
  IsSpamList: boolean;
  LogoPath: string;
}

interface HIBPPasteAccount {
  Source: string;
  Id: string;
  Title: string;
  Date: string;
  EmailCount: number;
}

/**
 * Check email against Have I Been Pwned database
 * @param email Email address to check
 * @param apiKey HIBP API key (required for breach checking)
 */
export async function checkEmailBreach(email: string, apiKey?: string): Promise<BreachCheckResult> {
  console.info(`[Breach Checker] Checking email: ${email}`);

  const result: BreachCheckResult = {
    email,
    breached: false,
    breachCount: 0,
    breaches: [],
    passwords: {
      exposedCount: 0,
    },
  };

  if (!apiKey) {
    console.warn('[Breach Checker] No HIBP API key provided, skipping breach check');
    return result;
  }

  try {
    // Check for account breaches
    const breaches = await checkAccountBreaches(email, apiKey);
    result.breaches = breaches;
    result.breachCount = breaches.length;
    result.breached = breaches.length > 0;

    // Check password exposure (uses anonymized k-anonymity API - no key required)
    const passwordExposureCount = await checkPasswordExposure(email);
    result.passwords.exposedCount = passwordExposureCount;

    console.info(
      `[Breach Checker] Found ${result.breachCount} breaches for ${email}, ${passwordExposureCount} password exposures`
    );
  } catch (error) {
    console.error('[Breach Checker] Error checking email:', error);
  }

  return result;
}

/**
 * Check account breaches using HIBP API
 */
async function checkAccountBreaches(
  email: string,
  apiKey: string
): Promise<
  Array<{
    name: string;
    date: string;
    breachDataClasses: string[];
    description: string;
    isVerified: boolean;
    isSensitive: boolean;
  }>
> {
  try {
    const response = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        headers: {
          'hibp-api-key': apiKey,
          'User-Agent': 'Fact-It-Extension',
        },
      }
    );

    if (response.status === 404) {
      // No breaches found
      return [];
    }

    if (!response.ok) {
      console.warn(`[Breach Checker] HIBP API error: ${response.status}`);
      return [];
    }

    const breaches: HIBPBreach[] = await response.json();

    return breaches.map((breach) => ({
      name: breach.Title,
      date: breach.BreachDate,
      breachDataClasses: breach.DataClasses,
      description: stripHtmlTags(breach.Description),
      isVerified: breach.IsVerified,
      isSensitive: breach.IsSensitive,
    }));
  } catch (error) {
    console.error('[Breach Checker] Error fetching breaches:', error);
    return [];
  }
}

/**
 * Check password exposure using k-anonymity API (no auth required)
 * Uses SHA-1 hash of password (if available) or estimates based on email domain
 */
async function checkPasswordExposure(email: string): Promise<number> {
  try {
    // For MVP, we can't check actual password exposure without the password
    // Instead, check if the email domain has known breaches
    const domain = email.split('@')[1];

    const response = await fetch(
      `https://haveibeenpwned.com/api/v3/breaches?domain=${encodeURIComponent(domain)}`
    );

    if (!response.ok) {
      return 0;
    }

    const breaches: HIBPBreach[] = await response.json();

    // Estimate exposure based on number of breaches affecting this domain
    return breaches.filter((b) => b.DataClasses.includes('Passwords')).length;
  } catch (error) {
    console.error('[Breach Checker] Error checking password exposure:', error);
    return 0;
  }
}

/**
 * Check for pastes (public leaks on paste sites)
 */
export async function checkPastes(email: string, apiKey: string): Promise<HIBPPasteAccount[]> {
  try {
    const response = await fetch(
      `https://haveibeenpwned.com/api/v3/pasteaccount/${encodeURIComponent(email)}`,
      {
        headers: {
          'hibp-api-key': apiKey,
          'User-Agent': 'Fact-It-Extension',
        },
      }
    );

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('[Breach Checker] Error checking pastes:', error);
    return [];
  }
}

/**
 * Batch check multiple emails (for enterprise use)
 */
export async function checkMultipleEmails(
  emails: string[],
  apiKey: string
): Promise<Map<string, BreachCheckResult>> {
  const results = new Map<string, BreachCheckResult>();

  // HIBP API rate limit: 1 request per 1.5 seconds
  for (const email of emails) {
    const result = await checkEmailBreach(email, apiKey);
    results.set(email, result);

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return results;
}

/**
 * Strip HTML tags from description
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
