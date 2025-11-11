/**
 * Brand Monitoring & Domain Squatting Detection
 * Detects brand impersonation, typosquatting, and trademark infringement
 */

import {
  BrandMonitoringResult,
  DomainSquattingResult,
} from '@/shared/threat-intelligence-types';

// ============================================================================
// Domain Squatting Techniques
// ============================================================================

/**
 * Generate typosquatting variations of a domain
 * Techniques: character omission, substitution, addition, duplication, transposition
 */
function generateTyposquattingDomains(domain: string): string[] {
  const variations: Set<string> = new Set();
  const baseDomain = domain.replace(/\..+$/, ''); // Remove TLD
  const tld = domain.match(/\..+$/)?.[0] || '.com';

  // Common TLD variations
  const commonTLDs = ['.com', '.net', '.org', '.co', '.io', '.app'];

  // 1. Character omission
  for (let i = 0; i < baseDomain.length; i++) {
    const variant = baseDomain.slice(0, i) + baseDomain.slice(i + 1);
    if (variant.length > 2) {
      commonTLDs.forEach((t) => variations.add(variant + t));
    }
  }

  // 2. Character substitution (common typos)
  const substitutions: Record<string, string[]> = {
    a: ['q', 's', 'z'],
    e: ['w', 'r'],
    i: ['o', 'u'],
    o: ['i', 'p'],
    m: ['n'],
    n: ['m'],
    l: ['i', '1'],
    0: ['o'],
  };

  for (let i = 0; i < baseDomain.length; i++) {
    const char = baseDomain[i];
    const subs = substitutions[char] || [];

    for (const sub of subs) {
      const variant = baseDomain.slice(0, i) + sub + baseDomain.slice(i + 1);
      commonTLDs.forEach((t) => variations.add(variant + t));
    }
  }

  // 3. Character duplication
  for (let i = 0; i < baseDomain.length; i++) {
    const variant = baseDomain.slice(0, i) + baseDomain[i] + baseDomain.slice(i);
    commonTLDs.forEach((t) => variations.add(variant + t));
  }

  // 4. Character transposition (swapping adjacent characters)
  for (let i = 0; i < baseDomain.length - 1; i++) {
    const variant =
      baseDomain.slice(0, i) +
      baseDomain[i + 1] +
      baseDomain[i] +
      baseDomain.slice(i + 2);
    commonTLDs.forEach((t) => variations.add(variant + t));
  }

  // 5. Homograph attacks (lookalike characters)
  const homographs: Record<string, string[]> = {
    a: ['à', 'á', 'â', 'ã', 'ä', 'å'],
    e: ['è', 'é', 'ê', 'ë'],
    i: ['ì', 'í', 'î', 'ï'],
    o: ['ò', 'ó', 'ô', 'õ', 'ö', '0'],
    u: ['ù', 'ú', 'û', 'ü'],
    c: ['ç'],
    n: ['ñ'],
    l: ['1', 'ı'],
  };

  for (let i = 0; i < baseDomain.length; i++) {
    const char = baseDomain[i];
    const homos = homographs[char] || [];

    for (const homo of homos) {
      const variant = baseDomain.slice(0, i) + homo + baseDomain.slice(i + 1);
      commonTLDs.forEach((t) => variations.add(variant + t));
    }
  }

  // 6. Combosquatting (adding common prefixes/suffixes)
  const combos = ['secure-', 'login-', 'my-', 'app-', '-login', '-secure', '-app', '-online'];
  for (const combo of combos) {
    if (combo.startsWith('-')) {
      commonTLDs.forEach((t) => variations.add(baseDomain + combo + t));
    } else {
      commonTLDs.forEach((t) => variations.add(combo + baseDomain + t));
    }
  }

  return Array.from(variations).slice(0, 100); // Limit to 100 variations
}

/**
 * Check if a domain is registered and active
 */
async function checkDomainActive(domain: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      mode: 'no-cors', // Avoid CORS issues
    });

    // If we get any response, domain is likely active
    return true;
  } catch (error) {
    // Domain not reachable or not registered
    return false;
  }
}

/**
 * Calculate domain similarity using Levenshtein distance
 */
function calculateDomainSimilarity(domain1: string, domain2: string): number {
  const s1 = domain1.toLowerCase().replace(/\..+$/, '');
  const s2 = domain2.toLowerCase().replace(/\..+$/, '');

  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);

  return ((maxLength - distance) / maxLength) * 100;
}

/**
 * Detect domain squatting attempts
 */
export async function detectDomainSquatting(
  originalDomain: string
): Promise<DomainSquattingResult> {
  console.info(`[Brand Monitor] Checking for domain squatting: ${originalDomain}`);

  const variations = generateTyposquattingDomains(originalDomain);
  const suspiciousDomains: DomainSquattingResult['suspiciousDomains'] = [];

  // Check top variations (limited to avoid rate limits)
  const checkPromises = variations.slice(0, 20).map(async (variant) => {
    const active = await checkDomainActive(variant);

    if (active) {
      const similarity = calculateDomainSimilarity(originalDomain, variant);

      // Determine technique used
      let technique: 'typosquatting' | 'homograph' | 'combosquatting' | 'levelsquatting' =
        'typosquatting';

      if (
        variant.includes('secure-') ||
        variant.includes('login-') ||
        variant.includes('-app')
      ) {
        technique = 'combosquatting';
      } else if (variant.match(/[à-ÿ]/)) {
        technique = 'homograph';
      }

      return {
        domain: variant,
        similarity,
        technique,
        active: true,
        registrationDate: undefined, // TODO: WHOIS lookup
        ssl: undefined, // TODO: SSL check
      };
    }

    return null;
  });

  const results = await Promise.allSettled(checkPromises);

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      suspiciousDomains.push(result.value);
    }
  }

  console.info(
    `[Brand Monitor] Found ${suspiciousDomains.length} suspicious domains similar to ${originalDomain}`
  );

  return {
    originalDomain,
    suspiciousDomains: suspiciousDomains.sort((a, b) => b.similarity - a.similarity), // Sort by similarity
  };
}

/**
 * Monitor brand mentions and impersonations
 */
export async function monitorBrand(
  brandName: string,
  officialDomains: string[]
): Promise<BrandMonitoringResult> {
  console.info(`[Brand Monitor] Monitoring brand: ${brandName}`);

  const impersonations: BrandMonitoringResult['impersonations'] = [];

  // Check for domain squatting on each official domain
  for (const domain of officialDomains) {
    const squattingResult = await detectDomainSquatting(domain);

    for (const suspicious of squattingResult.suspiciousDomains) {
      impersonations.push({
        domain: suspicious.domain,
        type: 'domain_squatting',
        similarity: suspicious.similarity,
        active: suspicious.active,
        screenshot: undefined, // TODO: Implement screenshot capture
        reportedAt: undefined,
      });
    }
  }

  // TODO: Check social media impersonations (requires APIs)
  const socialMediaImpersonations: BrandMonitoringResult['socialMediaImpersonations'] = [];

  const result: BrandMonitoringResult = {
    brandName,
    officialDomains,
    impersonations,
    socialMediaImpersonations,
  };

  console.info(
    `[Brand Monitor] Found ${impersonations.length} potential brand impersonations`
  );

  return result;
}

/**
 * Track monitored brands in storage
 */
export async function addMonitoredBrand(
  brandName: string,
  officialDomains: string[]
): Promise<void> {
  try {
    const result = await chrome.storage.local.get('fact_it_monitored_brands');
    const brands: Record<
      string,
      { brandName: string; officialDomains: string[]; addedAt: number }
    > = result.fact_it_monitored_brands || {};

    brands[brandName] = {
      brandName,
      officialDomains,
      addedAt: Date.now(),
    };

    await chrome.storage.local.set({ fact_it_monitored_brands: brands });

    console.info(`[Brand Monitor] Added brand monitoring for: ${brandName}`);
  } catch (error) {
    console.error('[Brand Monitor] Error adding monitored brand:', error);
    throw error;
  }
}

export async function getMonitoredBrands(): Promise<
  Array<{ brandName: string; officialDomains: string[]; addedAt: number }>
> {
  try {
    const result = await chrome.storage.local.get('fact_it_monitored_brands');
    const brands: Record<
      string,
      { brandName: string; officialDomains: string[]; addedAt: number }
    > = result.fact_it_monitored_brands || {};

    return Object.values(brands);
  } catch (error) {
    console.error('[Brand Monitor] Error getting monitored brands:', error);
    return [];
  }
}

/**
 * Automated brand monitoring scan (run periodically)
 */
export async function runBrandMonitoringScan(): Promise<BrandMonitoringResult[]> {
  const brands = await getMonitoredBrands();
  const results: BrandMonitoringResult[] = [];

  for (const brand of brands) {
    const result = await monitorBrand(brand.brandName, brand.officialDomains);
    results.push(result);

    // Rate limiting - wait 2 seconds between brands
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.info(
    `[Brand Monitor] Completed brand monitoring scan for ${brands.length} brands`
  );

  return results;
}
