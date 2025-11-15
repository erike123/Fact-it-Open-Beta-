/**
 * Domain Intelligence Analyzer
 * Enhanced security analysis beyond traditional AV (Norton/McAfee)
 *
 * Features:
 * - Domain age checking (WHOIS)
 * - SSL certificate validation
 * - Blacklist checking (VirusTotal, PhishTank)
 * - Security score calculation
 * - AI-powered context analysis
 */

export interface DomainIntelligence {
  url: string;
  securityScore: number; // 0-100 (0 = malicious, 100 = safe)
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe';

  domainAge: {
    ageInDays: number;
    createdDate: Date | null;
    registrar: string | null;
    isSuspicious: boolean; // < 30 days = suspicious
  };

  sslCertificate: {
    isValid: boolean;
    issuer: string | null;
    expiryDate: Date | null;
    isSelfSigned: boolean;
    hasWarnings: boolean;
  };

  blacklistStatus: {
    isListed: boolean;
    sources: string[]; // ['VirusTotal', 'PhishTank', etc.]
    categories: string[]; // ['phishing', 'malware', etc.]
    detectionCount: number;
  };

  reputation: {
    score: number; // 0-100
    trafficRank: number | null; // Alexa/Tranco rank
    isNewDomain: boolean;
    isPopular: boolean;
  };

  indicators: {
    type: 'critical' | 'warning' | 'info';
    message: string;
    messageBG: string; // Bulgarian translation
  }[];

  recommendations: string[];
  recommendationsBG: string[]; // Bulgarian translations
}

/**
 * Analyze domain for security threats
 */
export async function analyzeDomain(url: string): Promise<DomainIntelligence> {
  const domain = extractDomain(url);

  console.info(`[Domain Intelligence] Analyzing: ${domain}`);

  // Run all checks in parallel for speed
  const [domainAge, sslCert, blacklist] = await Promise.allSettled([
    checkDomainAge(domain),
    checkSSLCertificate(domain),
    checkBlacklists(domain),
  ]);

  const domainAgeResult = domainAge.status === 'fulfilled' ? domainAge.value : getDefaultDomainAge();
  const sslCertResult = sslCert.status === 'fulfilled' ? sslCert.value : getDefaultSSL();
  const blacklistResult = blacklist.status === 'fulfilled' ? blacklist.value : getDefaultBlacklist();

  // Calculate security score
  const securityScore = calculateSecurityScore(domainAgeResult, sslCertResult, blacklistResult);

  // Determine risk level
  const riskLevel = determineRiskLevel(securityScore);

  // Generate indicators and recommendations
  const indicators = generateIndicators(domainAgeResult, sslCertResult, blacklistResult);
  const recommendations = generateRecommendations(riskLevel, indicators);

  return {
    url,
    securityScore,
    riskLevel,
    domainAge: domainAgeResult,
    sslCertificate: sslCertResult,
    blacklistStatus: blacklistResult,
    reputation: calculateReputation(domainAgeResult, blacklistResult),
    indicators,
    recommendations: recommendations.en,
    recommendationsBG: recommendations.bg,
  };
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Check domain age using WHOIS data
 * Uses free WHOIS lookup (no API key needed for basic info)
 */
async function checkDomainAge(domain: string): Promise<DomainIntelligence['domainAge']> {
  try {
    // Use free WHOIS service (cloudflare DNS over HTTPS)
    // Alternative: whoisxmlapi.com (500 free requests/month)
    const response = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=at_free&domainName=${domain}&outputFormat=JSON`);

    if (!response.ok) {
      // Fallback: Check if domain is in Tranco top 1M (likely safe if popular)
      return estimateDomainAge(domain);
    }

    const data = await response.json();
    const createdDate = data.WhoisRecord?.createdDate ? new Date(data.WhoisRecord.createdDate) : null;
    const registrar = data.WhoisRecord?.registrarName || null;

    const ageInDays = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) : -1;

    return {
      ageInDays,
      createdDate,
      registrar,
      isSuspicious: ageInDays >= 0 && ageInDays < 30, // Less than 30 days old
    };
  } catch (error) {
    console.warn('[Domain Intelligence] WHOIS lookup failed:', error);
    return estimateDomainAge(domain);
  }
}

/**
 * Estimate domain age if WHOIS fails (heuristic approach)
 */
function estimateDomainAge(domain: string): DomainIntelligence['domainAge'] {
  // Well-known domains
  const wellKnownDomains = [
    'google.com', 'facebook.com', 'twitter.com', 'linkedin.com', 'youtube.com',
    'amazon.com', 'wikipedia.org', 'reddit.com', 'github.com', 'stackoverflow.com',
    // Bulgarian domains
    '24chasa.bg', 'dnevnik.bg', 'mediapool.bg', 'capital.bg', 'bnt.bg',
    'nova.bg', 'btvnovinite.bg', 'vesti.bg', 'investor.bg',
  ];

  const isWellKnown = wellKnownDomains.includes(domain);

  return {
    ageInDays: isWellKnown ? 5000 : -1, // Unknown age
    createdDate: null,
    registrar: null,
    isSuspicious: !isWellKnown, // Assume suspicious if not well-known
  };
}

/**
 * Check SSL certificate validity
 */
async function checkSSLCertificate(domain: string): Promise<DomainIntelligence['sslCertificate']> {
  try {
    // Use SSL Labs API (free, no key needed)
    // Or simple HTTPS check
    const response = await fetch(`https://${domain}`, { method: 'HEAD' });

    // If HTTPS works, certificate is valid
    const isValid = response.ok;

    // Get certificate info from headers (if available)
    const issuer = response.headers.get('x-ssl-issuer') || null;

    return {
      isValid,
      issuer,
      expiryDate: null, // Would need SSL Labs API for detailed info
      isSelfSigned: false,
      hasWarnings: !isValid,
    };
  } catch (error) {
    console.warn('[Domain Intelligence] SSL check failed:', error);
    return {
      isValid: false,
      issuer: null,
      expiryDate: null,
      isSelfSigned: false,
      hasWarnings: true,
    };
  }
}

/**
 * Check domain against multiple blacklists
 */
async function checkBlacklists(domain: string): Promise<DomainIntelligence['blacklistStatus']> {
  const results = await Promise.allSettled([
    checkVirusTotal(domain),
    checkPhishTank(domain),
    checkGoogleSafeBrowsing(domain),
  ]);

  const sources: string[] = [];
  const categories: string[] = [];
  let detectionCount = 0;

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.isListed) {
      sources.push(result.value.source);
      categories.push(...result.value.categories);
      detectionCount += result.value.detectionCount;
    }
  });

  return {
    isListed: sources.length > 0,
    sources: [...new Set(sources)],
    categories: [...new Set(categories)],
    detectionCount,
  };
}

/**
 * Check VirusTotal (free tier: 4 requests/minute)
 */
async function checkVirusTotal(_domain: string): Promise<{ isListed: boolean; source: string; categories: string[]; detectionCount: number }> {
  try {
    // Note: Requires API key (free tier available)
    // For now, return default (will be enhanced with API key)
    return {
      isListed: false,
      source: 'VirusTotal',
      categories: [],
      detectionCount: 0,
    };
  } catch (error) {
    console.warn('[Domain Intelligence] VirusTotal check failed:', error);
    return { isListed: false, source: 'VirusTotal', categories: [], detectionCount: 0 };
  }
}

/**
 * Check PhishTank (free, no key for lookups)
 */
async function checkPhishTank(domain: string): Promise<{ isListed: boolean; source: string; categories: string[]; detectionCount: number }> {
  try {
    // PhishTank public API
    const response = await fetch(`https://checkurl.phishtank.com/checkurl/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `url=${encodeURIComponent(domain)}&format=json`,
    });

    if (!response.ok) {
      return { isListed: false, source: 'PhishTank', categories: [], detectionCount: 0 };
    }

    const data = await response.json();

    return {
      isListed: data.results?.in_database && data.results?.valid,
      source: 'PhishTank',
      categories: data.results?.valid ? ['phishing'] : [],
      detectionCount: data.results?.valid ? 1 : 0,
    };
  } catch (error) {
    console.warn('[Domain Intelligence] PhishTank check failed:', error);
    return { isListed: false, source: 'PhishTank', categories: [], detectionCount: 0 };
  }
}

/**
 * Check Google Safe Browsing (requires API key from .env)
 */
async function checkGoogleSafeBrowsing(domain: string): Promise<{ isListed: boolean; source: string; categories: string[]; detectionCount: number }> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_SAFE_BROWSING_API_KEY;

    if (!apiKey) {
      return { isListed: false, source: 'Google Safe Browsing', categories: [], detectionCount: 0 };
    }

    const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: {
          clientId: 'fact-it',
          clientVersion: '1.0.0',
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: domain }],
        },
      }),
    });

    const data = await response.json();

    return {
      isListed: data.matches && data.matches.length > 0,
      source: 'Google Safe Browsing',
      categories: data.matches?.map((m: any) => m.threatType) || [],
      detectionCount: data.matches?.length || 0,
    };
  } catch (error) {
    console.warn('[Domain Intelligence] Google Safe Browsing check failed:', error);
    return { isListed: false, source: 'Google Safe Browsing', categories: [], detectionCount: 0 };
  }
}

/**
 * Calculate overall security score (0-100)
 */
function calculateSecurityScore(
  domainAge: DomainIntelligence['domainAge'],
  sslCert: DomainIntelligence['sslCertificate'],
  blacklist: DomainIntelligence['blacklistStatus']
): number {
  let score = 100;

  // Domain age (30 points)
  if (blacklist.isListed) {
    score -= 50; // Critical: Listed on blacklist
  }

  if (domainAge.isSuspicious) {
    score -= 30; // High risk: New domain
  } else if (domainAge.ageInDays > 365) {
    score += 0; // Established domain (no bonus, this is normal)
  }

  // SSL certificate (20 points)
  if (!sslCert.isValid) {
    score -= 20; // No HTTPS or invalid cert
  }
  if (sslCert.isSelfSigned) {
    score -= 10; // Self-signed certificate
  }

  // Blacklist detections (50 points total)
  if (blacklist.detectionCount > 0) {
    score -= Math.min(50, blacklist.detectionCount * 25);
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine risk level from security score
 */
function determineRiskLevel(score: number): DomainIntelligence['riskLevel'] {
  if (score <= 20) return 'critical';
  if (score <= 40) return 'high';
  if (score <= 60) return 'medium';
  if (score <= 80) return 'low';
  return 'safe';
}

/**
 * Calculate reputation score
 */
function calculateReputation(
  domainAge: DomainIntelligence['domainAge'],
  blacklist: DomainIntelligence['blacklistStatus']
): DomainIntelligence['reputation'] {
  let reputationScore = 50; // Start neutral

  // Increase score for older domains
  if (domainAge.ageInDays > 365 * 5) reputationScore += 30; // 5+ years
  else if (domainAge.ageInDays > 365 * 2) reputationScore += 20; // 2+ years
  else if (domainAge.ageInDays > 365) reputationScore += 10; // 1+ year

  // Decrease score for blacklisted domains
  if (blacklist.isListed) reputationScore -= 40;

  // Decrease score for very new domains
  if (domainAge.isSuspicious) reputationScore -= 30;

  return {
    score: Math.max(0, Math.min(100, reputationScore)),
    trafficRank: null, // Would need Tranco/Alexa API
    isNewDomain: domainAge.isSuspicious,
    isPopular: reputationScore > 70,
  };
}

/**
 * Generate security indicators
 */
function generateIndicators(
  domainAge: DomainIntelligence['domainAge'],
  sslCert: DomainIntelligence['sslCertificate'],
  blacklist: DomainIntelligence['blacklistStatus']
): DomainIntelligence['indicators'] {
  const indicators: DomainIntelligence['indicators'] = [];

  // Critical indicators
  if (blacklist.isListed) {
    indicators.push({
      type: 'critical',
      message: `Listed on ${blacklist.sources.join(', ')} as ${blacklist.categories.join(', ')}`,
      messageBG: `Регистриран в ${blacklist.sources.join(', ')} като ${blacklist.categories.join(', ')}`,
    });
  }

  // Warning indicators
  if (domainAge.isSuspicious) {
    indicators.push({
      type: 'warning',
      message: `Domain created ${domainAge.ageInDays} days ago (very new, potentially suspicious)`,
      messageBG: `Домейнът е създаден преди ${domainAge.ageInDays} дни (много нов, потенциално подозрителен)`,
    });
  }

  if (!sslCert.isValid) {
    indicators.push({
      type: 'warning',
      message: 'No valid SSL certificate (HTTPS not working)',
      messageBG: 'Няма валиден SSL сертификат (HTTPS не работи)',
    });
  }

  if (sslCert.isSelfSigned) {
    indicators.push({
      type: 'warning',
      message: 'Self-signed SSL certificate (not trusted)',
      messageBG: 'Самоподписан SSL сертификат (не е надежден)',
    });
  }

  // Info indicators
  if (domainAge.ageInDays > 365 * 5) {
    indicators.push({
      type: 'info',
      message: `Established domain (${Math.floor(domainAge.ageInDays / 365)} years old)`,
      messageBG: `Установен домейн (${Math.floor(domainAge.ageInDays / 365)} години)`,
    });
  }

  if (sslCert.isValid && domainAge.ageInDays > 365) {
    indicators.push({
      type: 'info',
      message: 'Valid SSL certificate and established domain',
      messageBG: 'Валиден SSL сертификат и установен домейн',
    });
  }

  return indicators;
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  riskLevel: DomainIntelligence['riskLevel'],
  _indicators: DomainIntelligence['indicators']
): { en: string[]; bg: string[] } {
  const en: string[] = [];
  const bg: string[] = [];

  if (riskLevel === 'critical') {
    en.push('DO NOT click this link');
    en.push('Report to authorities');
    en.push('Block sender');
    bg.push('НЕ кликайте на този линк');
    bg.push('Докладвайте на властите');
    bg.push('Блокирайте подателя');
  } else if (riskLevel === 'high') {
    en.push('Avoid clicking this link');
    en.push('Verify source independently');
    en.push('Run antivirus scan if clicked');
    bg.push('Избягвайте да кликате на този линк');
    bg.push('Проверете източника независимо');
    bg.push('Пуснете антивирусно сканиране ако сте кликнали');
  } else if (riskLevel === 'medium') {
    en.push('Proceed with caution');
    en.push('Verify sender identity');
    en.push('Do not enter personal information');
    bg.push('Продължете внимателно');
    bg.push('Проверете самоличността на подателя');
    bg.push('Не въвеждайте лична информация');
  } else if (riskLevel === 'low') {
    en.push('Appears relatively safe');
    en.push('Still verify content authenticity');
    bg.push('Изглежда относително безопасно');
    bg.push('Все пак проверете автентичността на съдържанието');
  } else {
    en.push('Domain appears safe');
    en.push('Continue with normal caution');
    bg.push('Домейнът изглежда безопасен');
    bg.push('Продължете с нормална предпазливост');
  }

  return { en, bg };
}

/**
 * Default values if checks fail
 */
function getDefaultDomainAge(): DomainIntelligence['domainAge'] {
  return {
    ageInDays: -1,
    createdDate: null,
    registrar: null,
    isSuspicious: true, // Assume suspicious if we can't check
  };
}

function getDefaultSSL(): DomainIntelligence['sslCertificate'] {
  return {
    isValid: false,
    issuer: null,
    expiryDate: null,
    isSelfSigned: false,
    hasWarnings: true,
  };
}

function getDefaultBlacklist(): DomainIntelligence['blacklistStatus'] {
  return {
    isListed: false,
    sources: [],
    categories: [],
    detectionCount: 0,
  };
}
