/**
 * Compliance & Security Checker
 * Performs comprehensive security audits on domains:
 * - HTTPS/SSL validation
 * - Security headers
 * - Technology stack detection (Wappalyzer)
 * - DNS configuration (SPF, DMARC, DKIM)
 * - Breach history integration
 * - GDPR/Privacy compliance indicators
 */

import { ComplianceCheckResult, VulnerabilityCheckResult, CVEInfo } from '@/shared/threat-intelligence-types';
import { checkEmailBreach } from './breach-checker';

// ============================================================================
// HTTPS & SSL Certificate Check
// ============================================================================

interface SSLCertificateInfo {
  valid: boolean;
  issuer?: string;
  expiryDate?: number;
}

async function checkHTTPS(domain: string): Promise<{
  enabled: boolean;
  hsts: boolean;
  certificate: SSLCertificateInfo;
}> {
  try {
    const url = `https://${domain}`;
    const response = await fetch(url, { method: 'HEAD' });

    const hstsHeader = response.headers.get('strict-transport-security');

    return {
      enabled: true,
      hsts: !!hstsHeader,
      certificate: {
        valid: true, // If fetch succeeded, cert is valid
        issuer: 'Unknown', // Browser API doesn't expose cert details
        expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000, // Placeholder
      },
    };
  } catch (error) {
    return {
      enabled: false,
      hsts: false,
      certificate: { valid: false },
    };
  }
}

// ============================================================================
// Security Headers Check
// ============================================================================

interface SecurityHeaders {
  csp: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  strictTransportSecurity: boolean;
  referrerPolicy: boolean;
}

async function checkSecurityHeaders(domain: string): Promise<SecurityHeaders> {
  try {
    const url = `https://${domain}`;
    const response = await fetch(url, { method: 'HEAD' });

    return {
      csp: !!response.headers.get('content-security-policy'),
      xFrameOptions: !!response.headers.get('x-frame-options'),
      xContentTypeOptions: !!response.headers.get('x-content-type-options'),
      strictTransportSecurity: !!response.headers.get('strict-transport-security'),
      referrerPolicy: !!response.headers.get('referrer-policy'),
    };
  } catch (error) {
    return {
      csp: false,
      xFrameOptions: false,
      xContentTypeOptions: false,
      strictTransportSecurity: false,
      referrerPolicy: false,
    };
  }
}

// ============================================================================
// Privacy & GDPR Compliance
// ============================================================================

interface PrivacyCompliance {
  hasPrivacyPolicy: boolean;
  hasCookieConsent: boolean;
  gdprCompliant: boolean | 'unknown';
}

async function checkPrivacyCompliance(domain: string): Promise<PrivacyCompliance> {
  try {
    const url = `https://${domain}`;
    const response = await fetch(url);
    const html = await response.text();

    const htmlLower = html.toLowerCase();

    const hasPrivacyPolicy =
      htmlLower.includes('privacy policy') || htmlLower.includes('privacy-policy');
    const hasCookieConsent =
      htmlLower.includes('cookie consent') ||
      htmlLower.includes('cookie policy') ||
      htmlLower.includes('cookie-consent');
    const gdprMentioned =
      htmlLower.includes('gdpr') || htmlLower.includes('general data protection regulation');

    return {
      hasPrivacyPolicy,
      hasCookieConsent,
      gdprCompliant: gdprMentioned ? true : 'unknown',
    };
  } catch (error) {
    return {
      hasPrivacyPolicy: false,
      hasCookieConsent: false,
      gdprCompliant: 'unknown',
    };
  }
}

// ============================================================================
// Technology Stack Detection (Simple heuristics - full Wappalyzer requires API)
// ============================================================================

interface Technology {
  name: string;
  version?: string;
  category: string;
  outdated: boolean;
}

async function detectTechnologies(domain: string): Promise<Technology[]> {
  const technologies: Technology[] = [];

  try {
    const url = `https://${domain}`;
    const response = await fetch(url);
    const html = await response.text();
    const headers = response.headers;

    // Detect server
    const serverHeader = headers.get('server');
    if (serverHeader) {
      const serverMatch = serverHeader.match(/^([^\s\/]+)(?:\/([^\s]+))?/);
      if (serverMatch) {
        technologies.push({
          name: serverMatch[1],
          version: serverMatch[2],
          category: 'Server',
          outdated: false, // TODO: Compare with latest versions
        });
      }
    }

    // Detect WordPress
    if (html.includes('wp-content') || html.includes('wordpress')) {
      const versionMatch = html.match(/wordpress\s*([0-9.]+)/i);
      technologies.push({
        name: 'WordPress',
        version: versionMatch?.[1],
        category: 'CMS',
        outdated: false, // TODO: Check if version < latest
      });
    }

    // Detect React
    if (html.includes('react') || html.includes('_react')) {
      technologies.push({
        name: 'React',
        category: 'JavaScript Framework',
        outdated: false,
      });
    }

    // Detect jQuery
    const jqueryMatch = html.match(/jquery[.-]([0-9.]+)/i);
    if (jqueryMatch) {
      technologies.push({
        name: 'jQuery',
        version: jqueryMatch[1],
        category: 'JavaScript Library',
        outdated: false, // TODO: Check if version < 3.6
      });
    }

    // Detect powered-by header
    const poweredBy = headers.get('x-powered-by');
    if (poweredBy) {
      technologies.push({
        name: poweredBy,
        category: 'Framework',
        outdated: false,
      });
    }
  } catch (error) {
    console.error('[Compliance Checker] Error detecting technologies:', error);
  }

  return technologies;
}

// ============================================================================
// DNS Configuration Check (SPF, DMARC, DKIM)
// ============================================================================

interface DNSConfig {
  spf: boolean;
  dmarc: boolean;
  dkim: boolean;
}

async function checkDNS(domain: string): Promise<DNSConfig> {
  // MVP: DNS checks require backend or DNS-over-HTTPS API
  // For now, return placeholder. In production, use Google DNS API or custom backend

  try {
    // Example: Check for DMARC record using DNS-over-HTTPS
    const dmarcDomain = `_dmarc.${domain}`;
    const response = await fetch(
      `https://dns.google/resolve?name=${dmarcDomain}&type=TXT`
    );

    if (response.ok) {
      const data = await response.json();
      const hasDmarc = data.Answer?.some((record: { data: string }) =>
        record.data.includes('v=DMARC1')
      );

      return {
        spf: false, // TODO: Check SPF
        dmarc: hasDmarc || false,
        dkim: false, // TODO: Check DKIM
      };
    }
  } catch (error) {
    console.error('[Compliance Checker] Error checking DNS:', error);
  }

  return {
    spf: false,
    dmarc: false,
    dkim: false,
  };
}

// ============================================================================
// Subdomain Discovery (Certificate Transparency Logs)
// ============================================================================

interface SubdomainInfo {
  count: number;
  exposed: string[];
}

async function discoverSubdomains(domain: string): Promise<SubdomainInfo> {
  // MVP: Use crt.sh (Certificate Transparency) for subdomain discovery
  try {
    const response = await fetch(`https://crt.sh/?q=%.${domain}&output=json`);

    if (!response.ok) {
      return { count: 0, exposed: [] };
    }

    const certificates: Array<{ name_value: string }> = await response.json();

    const subdomains = new Set<string>();
    for (const cert of certificates) {
      const names = cert.name_value.split('\n');
      for (const name of names) {
        if (name.endsWith(`.${domain}`) && !name.includes('*')) {
          subdomains.add(name);
        }
      }
    }

    return {
      count: subdomains.size,
      exposed: Array.from(subdomains).slice(0, 20), // Limit to 20 for display
    };
  } catch (error) {
    console.error('[Compliance Checker] Error discovering subdomains:', error);
    return { count: 0, exposed: [] };
  }
}

// ============================================================================
// Main Compliance Check Function
// ============================================================================

export async function performComplianceCheck(
  domain: string,
  apiKeys?: {
    hibp?: string;
  }
): Promise<ComplianceCheckResult> {
  console.info(`[Compliance Checker] Starting compliance check for: ${domain}`);

  // Run all checks in parallel
  const [https, headers, privacy, technologies, dns, subdomains] = await Promise.allSettled([
    checkHTTPS(domain),
    checkSecurityHeaders(domain),
    checkPrivacyCompliance(domain),
    detectTechnologies(domain),
    checkDNS(domain),
    discoverSubdomains(domain),
  ]);

  // Check breach history using domain
  let breachHistory = {
    hasBreaches: false,
    breachCount: 0,
    lastBreachDate: undefined as number | undefined,
  };

  if (apiKeys?.hibp) {
    try {
      const testEmail = `test@${domain}`;
      const breachCheck = await checkEmailBreach(testEmail, apiKeys.hibp);
      breachHistory = {
        hasBreaches: breachCheck.breached,
        breachCount: breachCheck.breachCount,
        lastBreachDate: breachCheck.breaches[0]
          ? new Date(breachCheck.breaches[0].date).getTime()
          : undefined,
      };
    } catch (error) {
      console.warn('[Compliance Checker] Could not check breach history');
    }
  }

  // Extract results
  const httpsResult = https.status === 'fulfilled' ? https.value : { enabled: false, hsts: false, certificate: { valid: false } };
  const headersResult = headers.status === 'fulfilled' ? headers.value : { csp: false, xFrameOptions: false, xContentTypeOptions: false, strictTransportSecurity: false, referrerPolicy: false };
  const privacyResult = privacy.status === 'fulfilled' ? privacy.value : { hasPrivacyPolicy: false, hasCookieConsent: false, gdprCompliant: 'unknown' as const };
  const technologiesResult = technologies.status === 'fulfilled' ? technologies.value : [];
  const dnsResult = dns.status === 'fulfilled' ? dns.value : { spf: false, dmarc: false, dkim: false };
  const subdomainsResult = subdomains.status === 'fulfilled' ? subdomains.value : { count: 0, exposed: [] };

  // Calculate overall score
  const score = calculateComplianceScore({
    https: httpsResult,
    headers: headersResult,
    privacy: privacyResult,
    dns: dnsResult,
    breachHistory,
  });

  const result: ComplianceCheckResult = {
    domain,
    checkedAt: Date.now(),
    overall: {
      score,
      grade: scoreToGrade(score),
    },
    https: httpsResult,
    headers: headersResult,
    privacy: privacyResult,
    certificates: {
      iso27001: false, // TODO: Implement certificate checking
      soc2: false,
    },
    breachHistory,
    technologyStack: {
      detected: technologiesResult,
    },
    dns: dnsResult,
    subdomains: subdomainsResult,
  };

  console.info(
    `[Compliance Checker] Compliance check complete: ${result.overall.grade} (${result.overall.score}/100)`
  );

  return result;
}

// ============================================================================
// Scoring Functions
// ============================================================================

function calculateComplianceScore(data: {
  https: { enabled: boolean; hsts: boolean };
  headers: SecurityHeaders;
  privacy: PrivacyCompliance;
  dns: DNSConfig;
  breachHistory: { hasBreaches: boolean };
}): number {
  let score = 0;

  // HTTPS (20 points)
  if (data.https.enabled) score += 15;
  if (data.https.hsts) score += 5;

  // Security Headers (30 points)
  if (data.headers.csp) score += 10;
  if (data.headers.xFrameOptions) score += 5;
  if (data.headers.xContentTypeOptions) score += 5;
  if (data.headers.strictTransportSecurity) score += 5;
  if (data.headers.referrerPolicy) score += 5;

  // Privacy (20 points)
  if (data.privacy.hasPrivacyPolicy) score += 10;
  if (data.privacy.hasCookieConsent) score += 5;
  if (data.privacy.gdprCompliant === true) score += 5;

  // DNS Security (20 points)
  if (data.dns.spf) score += 7;
  if (data.dns.dmarc) score += 7;
  if (data.dns.dkim) score += 6;

  // Breach History (10 points)
  if (!data.breachHistory.hasBreaches) score += 10;

  return Math.min(100, score);
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

// ============================================================================
// NVD (National Vulnerability Database) Integration
// ============================================================================

export async function checkVulnerabilities(
  technology: string,
  version?: string
): Promise<VulnerabilityCheckResult> {
  console.info(`[Compliance Checker] Checking vulnerabilities for: ${technology} ${version || ''}`);

  const vulnerabilities: CVEInfo[] = [];

  try {
    // NVD API v2.0 (Free, no API key required for basic usage)
    const searchQuery = version ? `${technology} ${version}` : technology;
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(searchQuery)}&resultsPerPage=20`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[Compliance Checker] NVD API error: ${response.status}`);
      return {
        technology,
        version,
        vulnerabilities: [],
        riskScore: 0,
      };
    }

    const data = await response.json();

    if (data.vulnerabilities) {
      for (const vuln of data.vulnerabilities) {
        const cve = vuln.cve;

        const cvssData = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV2?.[0];
        const cvssScore = cvssData?.cvssData?.baseScore || 0;

        vulnerabilities.push({
          id: cve.id,
          description: cve.descriptions?.[0]?.value || 'No description available',
          severity: cvssScoreToSeverity(cvssScore),
          cvssScore,
          publishedDate: new Date(cve.published).getTime(),
          lastModifiedDate: new Date(cve.lastModified).getTime(),
          affectedProducts: [], // TODO: Parse affected products
          references: cve.references?.map((ref: { url: string }) => ref.url) || [],
          exploitAvailable: false, // TODO: Check exploit databases
        });
      }
    }
  } catch (error) {
    console.error('[Compliance Checker] Error checking NVD:', error);
  }

  // Calculate risk score
  const riskScore = calculateVulnerabilityRisk(vulnerabilities);

  return {
    technology,
    version,
    vulnerabilities,
    riskScore,
  };
}

function cvssScoreToSeverity(score: number): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score > 0) return 'low';
  return 'info';
}

function calculateVulnerabilityRisk(vulnerabilities: CVEInfo[]): number {
  if (vulnerabilities.length === 0) return 0;

  let totalRisk = 0;
  for (const vuln of vulnerabilities) {
    totalRisk += vuln.cvssScore * 10; // Scale to 0-100
  }

  return Math.min(100, totalRisk / vulnerabilities.length);
}
