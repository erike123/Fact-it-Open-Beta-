/**
 * URL Analysis Service
 * Integrates with multiple threat databases to analyze URLs for malicious content
 * Free tier uses: Google Safe Browsing, URLhaus, PhishTank
 */

import {
  URLAnalysisResult,
  ThreatIndicator,
  ThreatSeverity,
} from '@/shared/threat-intelligence-types';

// ============================================================================
// Google Safe Browsing API (Free)
// ============================================================================

interface SafeBrowsingRequest {
  client: {
    clientId: string;
    clientVersion: string;
  };
  threatInfo: {
    threatTypes: string[];
    platformTypes: string[];
    threatEntryTypes: string[];
    threatEntries: Array<{ url: string }>;
  };
}

interface SafeBrowsingResponse {
  matches?: Array<{
    threatType: string;
    platformType: string;
    threat: { url: string };
    cacheDuration: string;
    threatEntryType: string;
  }>;
}

async function checkGoogleSafeBrowsing(url: string, apiKey: string): Promise<ThreatIndicator[]> {
  const threats: ThreatIndicator[] = [];

  try {
    const requestBody: SafeBrowsingRequest = {
      client: {
        clientId: 'fact-it',
        clientVersion: '1.0.0',
      },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      console.warn('Safe Browsing API error:', response.status);
      return threats;
    }

    const data: SafeBrowsingResponse = await response.json();

    if (data.matches && data.matches.length > 0) {
      for (const match of data.matches) {
        threats.push({
          type: match.threatType === 'SOCIAL_ENGINEERING' ? 'phishing' : 'malicious_url',
          severity: 'critical',
          confidence: 95,
          description: `Google Safe Browsing: ${match.threatType}`,
          source: 'Google Safe Browsing',
          timestamp: Date.now(),
          metadata: { threatType: match.threatType },
        });
      }
    }
  } catch (error) {
    console.error('Error checking Google Safe Browsing:', error);
  }

  return threats;
}

// ============================================================================
// URLhaus API (abuse.ch) - Free, no API key required
// ============================================================================

interface URLhausResponse {
  query_status: string;
  url: string;
  url_status: string;
  threat: string;
  blacklists: {
    surbl: string;
    spamhaus_dbl: string;
  };
  reporter: string;
  larted: string;
  tags: string[];
}

async function checkURLhaus(url: string): Promise<ThreatIndicator[]> {
  const threats: ThreatIndicator[] = [];

  try {
    const formData = new FormData();
    formData.append('url', url);

    const response = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return threats;
    }

    const data: URLhausResponse = await response.json();

    if (data.query_status === 'ok' && data.url_status !== 'offline') {
      threats.push({
        type: 'malicious_url',
        severity: 'critical',
        confidence: 90,
        description: `URLhaus: ${data.threat} malware distribution`,
        source: 'URLhaus (abuse.ch)',
        timestamp: Date.now(),
        metadata: {
          threat: data.threat,
          tags: data.tags,
          blacklists: data.blacklists,
        },
      });
    }
  } catch (error) {
    console.error('Error checking URLhaus:', error);
  }

  return threats;
}

// ============================================================================
// PhishTank API - Free, requires API key
// ============================================================================

interface PhishTankResponse {
  meta: {
    timestamp: string;
    status: string;
  };
  results: {
    in_database: boolean;
    phish_id?: number;
    phish_detail_url?: string;
    verified?: boolean;
    valid?: boolean;
  };
}

async function checkPhishTank(url: string, apiKey?: string): Promise<ThreatIndicator[]> {
  const threats: ThreatIndicator[] = [];

  try {
    const encodedUrl = encodeURIComponent(url);
    const apiUrl = apiKey
      ? `https://checkurl.phishtank.com/checkurl/?url=${encodedUrl}&format=json&app_key=${apiKey}`
      : `https://checkurl.phishtank.com/checkurl/?url=${encodedUrl}&format=json`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'User-Agent': 'Fact-It/1.0' },
    });

    if (!response.ok) {
      return threats;
    }

    const data: PhishTankResponse = await response.json();

    if (data.results.in_database && data.results.valid) {
      threats.push({
        type: 'phishing',
        severity: 'critical',
        confidence: data.results.verified ? 95 : 75,
        description: `PhishTank: Phishing site ${data.results.verified ? '(verified)' : '(unverified)'}`,
        source: 'PhishTank',
        timestamp: Date.now(),
        metadata: {
          phishId: data.results.phish_id,
          detailUrl: data.results.phish_detail_url,
        },
      });
    }
  } catch (error) {
    console.error('Error checking PhishTank:', error);
  }

  return threats;
}

// ============================================================================
// SSL/TLS Certificate Check
// ============================================================================

interface SSLCheckResult {
  valid: boolean;
  issuer?: string;
  expiryDate?: number;
}

async function checkSSL(url: string): Promise<SSLCheckResult> {
  try {
    const urlObj = new URL(url);

    // Simple check: if it's HTTPS, assume valid for MVP
    // In production, use SSL Labs API or similar
    if (urlObj.protocol === 'https:') {
      return {
        valid: true,
        issuer: 'Unknown',
        expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000, // Placeholder
      };
    }

    return { valid: false };
  } catch (error) {
    return { valid: false };
  }
}

// ============================================================================
// Domain Age Check (using WHOIS-like heuristics)
// ============================================================================

interface DomainInfo {
  age: number;
  registrar?: string;
  isNewDomain: boolean;
}

async function checkDomainAge(url: string): Promise<DomainInfo> {
  // MVP: Basic heuristic
  // In production, integrate with WHOIS API or domain reputation services

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Placeholder: Return conservative estimate
    // In production, use WHOIS API or services like SecurityTrails
    return {
      age: 365, // Assume 1 year old
      registrar: 'Unknown',
      isNewDomain: false,
    };
  } catch (error) {
    return {
      age: 0,
      isNewDomain: true,
    };
  }
}

// ============================================================================
// Main URL Analysis Function
// ============================================================================

export async function analyzeURL(
  url: string,
  apiKeys?: {
    googleSafeBrowsing?: string;
    phishTank?: string;
  }
): Promise<URLAnalysisResult> {
  console.info(`[URL Analyzer] Analyzing URL: ${url}`);

  const threats: ThreatIndicator[] = [];

  // Run all checks in parallel
  const [safeBrowsingThreats, urlhausThreats, phishTankThreats, sslCheck, domainInfo] =
    await Promise.allSettled([
      apiKeys?.googleSafeBrowsing
        ? checkGoogleSafeBrowsing(url, apiKeys.googleSafeBrowsing)
        : Promise.resolve([]),
      checkURLhaus(url),
      checkPhishTank(url, apiKeys?.phishTank),
      checkSSL(url),
      checkDomainAge(url),
    ]);

  // Aggregate threats
  if (safeBrowsingThreats.status === 'fulfilled') {
    threats.push(...safeBrowsingThreats.value);
  }
  if (urlhausThreats.status === 'fulfilled') {
    threats.push(...urlhausThreats.value);
  }
  if (phishTankThreats.status === 'fulfilled') {
    threats.push(...phishTankThreats.value);
  }

  // Check for phishing indicators
  const phishingThreats = threats.filter((t) => t.type === 'phishing');
  const isPhishing = phishingThreats.length > 0;
  const phishingConfidence = isPhishing
    ? Math.max(...phishingThreats.map((t) => t.confidence))
    : 0;

  // Calculate reputation score
  const reputationScore = calculateReputationScore(threats);

  // Check if domain is new (potential red flag)
  const domain = domainInfo.status === 'fulfilled' ? domainInfo.value : { age: 0, isNewDomain: true };
  if (domain.isNewDomain && threats.length > 0) {
    threats.push({
      type: 'malicious_url',
      severity: 'medium',
      confidence: 60,
      description: 'Newly registered domain with threat indicators',
      source: 'Fact-It Heuristics',
      timestamp: Date.now(),
    });
  }

  const result: URLAnalysisResult = {
    url,
    isMalicious: threats.length > 0,
    threats,
    reputation: {
      score: reputationScore,
      sources: [
        { service: 'Google Safe Browsing', score: reputationScore, lastChecked: Date.now() },
        { service: 'URLhaus', score: reputationScore, lastChecked: Date.now() },
        { service: 'PhishTank', score: reputationScore, lastChecked: Date.now() },
      ],
    },
    phishing: {
      isPhishing,
      confidence: phishingConfidence,
      targetBrand: undefined, // TODO: Implement brand detection
    },
    ssl: sslCheck.status === 'fulfilled' ? sslCheck.value : { valid: false },
    domainInfo: domain,
  };

  console.info(
    `[URL Analyzer] Analysis complete: ${threats.length} threats found, reputation: ${reputationScore}/100`
  );

  return result;
}

/**
 * Calculate overall reputation score (0-100, higher is safer)
 */
function calculateReputationScore(threats: ThreatIndicator[]): number {
  if (threats.length === 0) return 100;

  // Deduct points based on severity
  let score = 100;
  for (const threat of threats) {
    switch (threat.severity) {
      case 'critical':
        score -= 50;
        break;
      case 'high':
        score -= 30;
        break;
      case 'medium':
        score -= 15;
        break;
      case 'low':
        score -= 5;
        break;
    }
  }

  return Math.max(0, score);
}
