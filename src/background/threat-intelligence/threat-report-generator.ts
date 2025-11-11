/**
 * Threat Modeling Report Generator
 * Generates comprehensive security assessment reports for domains
 *
 * Pricing tiers:
 * - Free: Basic security scan (limited)
 * - Basic (€99): Full automated report
 * - Professional (€500/month): API access + monitoring
 * - Enterprise (€50K/year): Custom threat modeling + dedicated support
 */

import {
  ThreatModelReport,
  ThreatSeverity,
  URLAnalysisResult,
  VulnerabilityCheckResult,
} from '@/shared/threat-intelligence-types';
import { performComplianceCheck, checkVulnerabilities } from './compliance-checker';
import { checkEmailBreach } from './breach-checker';
import { analyzeURL } from './url-analyzer';
import { THREAT_STORAGE_KEYS } from '@/shared/threat-intelligence-types';

// ============================================================================
// Report Generation
// ============================================================================

export interface ReportGenerationOptions {
  domain: string;
  email?: string;
  tier: 'free' | 'basic' | 'professional' | 'enterprise';
  apiKeys?: {
    hibp?: string;
    googleSafeBrowsing?: string;
    phishTank?: string;
  };
  includeSubdomains?: boolean;
  includeBrandMonitoring?: boolean;
  includeEmployeeMonitoring?: boolean;
}

export async function generateThreatReport(
  options: ReportGenerationOptions
): Promise<ThreatModelReport> {
  console.info(`[Threat Report Generator] Generating ${options.tier} report for: ${options.domain}`);

  const startTime = Date.now();

  // Tier-based feature gates
  const features = {
    complianceCheck: options.tier !== 'free',
    vulnerabilityScan: options.tier !== 'free',
    breachCheck: options.tier !== 'free' && !!options.email,
    urlScanning: options.tier !== 'free',
    subdomainDiscovery: options.tier === 'professional' || options.tier === 'enterprise',
    brandMonitoring: options.tier === 'enterprise' && options.includeBrandMonitoring,
    employeeMonitoring: options.tier === 'enterprise' && options.includeEmployeeMonitoring,
  };

  // Run parallel checks
  const [complianceResult, breachResult, urlResult] = await Promise.allSettled([
    features.complianceCheck
      ? performComplianceCheck(options.domain, { hibp: options.apiKeys?.hibp })
      : Promise.resolve(null),
    features.breachCheck
      ? checkEmailBreach(options.email!, options.apiKeys?.hibp)
      : Promise.resolve(null),
    features.urlScanning
      ? analyzeURL(`https://${options.domain}`, {
          googleSafeBrowsing: options.apiKeys?.googleSafeBrowsing,
          phishTank: options.apiKeys?.phishTank,
        })
      : Promise.resolve(null),
  ]);

  const compliance =
    complianceResult.status === 'fulfilled' && complianceResult.value
      ? complianceResult.value
      : null;
  const breach = breachResult.status === 'fulfilled' ? breachResult.value : null;
  const urlAnalysis = urlResult.status === 'fulfilled' ? urlResult.value : null;

  // Check vulnerabilities for detected technologies
  const vulnerabilities: VulnerabilityCheckResult[] = [];
  if (features.vulnerabilityScan && compliance?.technologyStack.detected) {
    for (const tech of compliance.technologyStack.detected.slice(0, 5)) {
      // Limit to 5 to avoid rate limits
      const vulnCheck = await checkVulnerabilities(tech.name, tech.version);
      if (vulnCheck.vulnerabilities.length > 0) {
        vulnerabilities.push(vulnCheck);
      }
    }
  }

  // Generate findings summary
  const findings = {
    compliance: compliance!,
    vulnerabilities,
    breaches: breach,
    brandRisks: null, // TODO: Implement brand monitoring
    urlThreats: urlAnalysis ? [urlAnalysis] : [],
  };

  // Count findings by severity
  const criticalFindings = countFindingsBySeverity(findings, 'critical');
  const highFindings = countFindingsBySeverity(findings, 'high');
  const mediumFindings = countFindingsBySeverity(findings, 'medium');
  const lowFindings = countFindingsBySeverity(findings, 'low');

  // Calculate overall risk score
  const overallRiskScore = calculateOverallRisk(findings);

  // Generate recommendations
  const recommendations = generateRecommendations(findings);

  // Build attack surface profile
  const attackSurface = {
    exposedServices: compliance?.technologyStack.detected.map((t) => t.name) || [],
    openPorts: [], // TODO: Implement port scanning (requires backend)
    subdomains: compliance?.subdomains.exposed || [],
    technologies: compliance?.technologyStack.detected.map((t) => `${t.name} ${t.version || ''}`) || [],
  };

  const report: ThreatModelReport = {
    domain: options.domain,
    generatedAt: Date.now(),
    version: '1.0.0',
    summary: {
      overallRiskScore,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
    },
    findings,
    recommendations,
    attackSurface,
    pricing: {
      tier: options.tier,
      reportCost: getTierPrice(options.tier),
      suggestedUpgrade: getSuggestedUpgrade(options.tier, findings),
    },
  };

  // Cache the report
  await cacheReport(options.domain, report);

  const duration = Date.now() - startTime;
  console.info(
    `[Threat Report Generator] Report generated in ${duration}ms - Risk Score: ${overallRiskScore}/100`
  );

  return report;
}

// ============================================================================
// Risk Calculation
// ============================================================================

function calculateOverallRisk(findings: {
  compliance: any;
  vulnerabilities: VulnerabilityCheckResult[];
  breaches: any;
  urlThreats: URLAnalysisResult[];
}): number {
  let riskScore = 0;

  // Compliance score (inverse - low score = high risk)
  if (findings.compliance) {
    riskScore += (100 - findings.compliance.overall.score) * 0.3; // 30% weight
  }

  // Vulnerabilities
  if (findings.vulnerabilities.length > 0) {
    const avgVulnRisk =
      findings.vulnerabilities.reduce((sum, v) => sum + v.riskScore, 0) /
      findings.vulnerabilities.length;
    riskScore += avgVulnRisk * 0.4; // 40% weight
  }

  // Breaches
  if (findings.breaches?.breached) {
    riskScore += findings.breaches.breachCount * 5; // 5 points per breach
  }

  // URL threats
  if (findings.urlThreats.length > 0 && findings.urlThreats[0].isMalicious) {
    riskScore += 30;
  }

  return Math.min(100, Math.round(riskScore));
}

function countFindingsBySeverity(
  findings: {
    compliance: any;
    vulnerabilities: VulnerabilityCheckResult[];
    breaches: any;
    urlThreats: URLAnalysisResult[];
  },
  severity: ThreatSeverity
): number {
  let count = 0;

  // Vulnerabilities
  for (const vulnCheck of findings.vulnerabilities) {
    count += vulnCheck.vulnerabilities.filter((v) => v.severity === severity).length;
  }

  // URL threats
  for (const urlThreat of findings.urlThreats) {
    count += urlThreat.threats.filter((t) => t.severity === severity).length;
  }

  // Compliance issues (map scores to severity)
  if (findings.compliance) {
    if (severity === 'critical' && findings.compliance.overall.score < 45) count++;
    if (severity === 'high' && findings.compliance.overall.score < 60) count++;
    if (severity === 'medium' && findings.compliance.overall.score < 75) count++;
  }

  return count;
}

// ============================================================================
// Recommendation Engine
// ============================================================================

function generateRecommendations(findings: {
  compliance: any;
  vulnerabilities: VulnerabilityCheckResult[];
  breaches: any;
  urlThreats: URLAnalysisResult[];
}): Array<{
  priority: ThreatSeverity;
  category: string;
  description: string;
  remediation: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}> {
  const recommendations = [];

  // HTTPS recommendations
  if (findings.compliance && !findings.compliance.https.enabled) {
    recommendations.push({
      priority: 'critical' as ThreatSeverity,
      category: 'HTTPS',
      description: 'Domain does not use HTTPS encryption',
      remediation:
        'Enable HTTPS by obtaining an SSL/TLS certificate (free from Let\'s Encrypt) and configure your web server to redirect HTTP to HTTPS.',
      estimatedEffort: 'low' as const,
    });
  }

  // Security headers
  if (findings.compliance && !findings.compliance.headers.csp) {
    recommendations.push({
      priority: 'high' as ThreatSeverity,
      category: 'Security Headers',
      description: 'Missing Content Security Policy (CSP) header',
      remediation:
        'Implement CSP header to prevent XSS attacks. Example: Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'',
      estimatedEffort: 'medium' as const,
    });
  }

  // Vulnerabilities
  for (const vulnCheck of findings.vulnerabilities) {
    for (const vuln of vulnCheck.vulnerabilities.slice(0, 3)) {
      // Top 3 per technology
      recommendations.push({
        priority: vuln.severity,
        category: 'Vulnerability',
        description: `${vulnCheck.technology} has known vulnerability: ${vuln.id}`,
        remediation: `Update ${vulnCheck.technology} to the latest version. See: ${vuln.references[0] || 'vendor documentation'}`,
        estimatedEffort: 'medium' as const,
      });
    }
  }

  // Breaches
  if (findings.breaches?.breached) {
    recommendations.push({
      priority: 'high' as ThreatSeverity,
      category: 'Credential Breach',
      description: `${findings.breaches.breachCount} data breach(es) found affecting this domain`,
      remediation:
        'Force password reset for all affected users, enable multi-factor authentication (MFA), and monitor for credential stuffing attacks.',
      estimatedEffort: 'high' as const,
    });
  }

  // DNS security
  if (findings.compliance && !findings.compliance.dns.dmarc) {
    recommendations.push({
      priority: 'medium' as ThreatSeverity,
      category: 'Email Security',
      description: 'Missing DMARC record for email authentication',
      remediation:
        'Add DMARC DNS record to prevent email spoofing: _dmarc.yourdomain.com TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"',
      estimatedEffort: 'low' as const,
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 10); // Top 10 recommendations
}

// ============================================================================
// Pricing & Upgrade Logic
// ============================================================================

function getTierPrice(tier: 'free' | 'basic' | 'professional' | 'enterprise'): number {
  switch (tier) {
    case 'free':
      return 0;
    case 'basic':
      return 99;
    case 'professional':
      return 500;
    case 'enterprise':
      return 50000;
  }
}

function getSuggestedUpgrade(
  currentTier: 'free' | 'basic' | 'professional' | 'enterprise',
  findings: any
): string | undefined {
  if (currentTier === 'free') {
    return 'Upgrade to Basic (€99) for full vulnerability scanning and breach monitoring';
  }

  if (currentTier === 'basic' && findings.compliance?.subdomains.count > 10) {
    return 'Upgrade to Professional (€500/mo) for continuous monitoring and API access';
  }

  if (currentTier === 'professional' && findings.compliance?.technologyStack.detected.length > 5) {
    return 'Upgrade to Enterprise (€50K/year) for custom threat modeling and dedicated security team';
  }

  return undefined;
}

// ============================================================================
// Report Caching
// ============================================================================

async function cacheReport(domain: string, report: ThreatModelReport): Promise<void> {
  try {
    const result = await chrome.storage.local.get(THREAT_STORAGE_KEYS.THREAT_REPORTS);
    const reports: Record<string, ThreatModelReport> =
      result[THREAT_STORAGE_KEYS.THREAT_REPORTS] || {};

    reports[domain] = report;

    await chrome.storage.local.set({
      [THREAT_STORAGE_KEYS.THREAT_REPORTS]: reports,
    });

    console.info(`[Threat Report Generator] Report cached for: ${domain}`);
  } catch (error) {
    console.error('[Threat Report Generator] Error caching report:', error);
  }
}

export async function getCachedReport(domain: string): Promise<ThreatModelReport | null> {
  try {
    const result = await chrome.storage.local.get(THREAT_STORAGE_KEYS.THREAT_REPORTS);
    const reports: Record<string, ThreatModelReport> =
      result[THREAT_STORAGE_KEYS.THREAT_REPORTS] || {};

    const report = reports[domain];

    if (report) {
      // Check if report is less than 24 hours old
      const age = Date.now() - report.generatedAt;
      const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

      if (age < MAX_AGE) {
        console.info(`[Threat Report Generator] Using cached report for: ${domain}`);
        return report;
      }
    }

    return null;
  } catch (error) {
    console.error('[Threat Report Generator] Error getting cached report:', error);
    return null;
  }
}

// ============================================================================
// Report Export (HTML, PDF, JSON)
// ============================================================================

export function exportReportAsHTML(report: ThreatModelReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Threat Model Report - ${report.domain}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .risk-score { font-size: 48px; font-weight: bold; color: ${getRiskColor(report.summary.overallRiskScore)}; }
    .finding { border-left: 4px solid #dc3545; padding: 10px; margin: 10px 0; background: #fff3cd; }
    .recommendation { border-left: 4px solid #28a745; padding: 10px; margin: 10px 0; background: #d4edda; }
    .grade { font-size: 36px; font-weight: bold; display: inline-block; padding: 10px 20px; background: ${getGradeColor(report.findings.compliance?.overall.grade || 'F')}; color: white; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #007bff; color: white; }
  </style>
</head>
<body>
  <h1>Threat Model Report: ${report.domain}</h1>
  <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>

  <div class="summary">
    <h2>Executive Summary</h2>
    <div class="risk-score">${report.summary.overallRiskScore}/100 Risk Score</div>
    <p><strong>Overall Grade:</strong> <span class="grade">${report.findings.compliance?.overall.grade || 'N/A'}</span></p>
    <p><strong>Critical Findings:</strong> ${report.summary.criticalFindings}</p>
    <p><strong>High Findings:</strong> ${report.summary.highFindings}</p>
    <p><strong>Medium Findings:</strong> ${report.summary.mediumFindings}</p>
    <p><strong>Low Findings:</strong> ${report.summary.lowFindings}</p>
  </div>

  <h2>Top Recommendations</h2>
  ${report.recommendations.slice(0, 5).map((rec) => `
    <div class="recommendation">
      <h3>[${rec.priority.toUpperCase()}] ${rec.category}</h3>
      <p><strong>Issue:</strong> ${rec.description}</p>
      <p><strong>Solution:</strong> ${rec.remediation}</p>
      <p><strong>Effort:</strong> ${rec.estimatedEffort}</p>
    </div>
  `).join('')}

  <h2>Attack Surface</h2>
  <p><strong>Exposed Subdomains:</strong> ${report.attackSurface.subdomains.length}</p>
  <p><strong>Detected Technologies:</strong> ${report.attackSurface.technologies.join(', ')}</p>

  <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
    <p>Generated by Fact-It Threat Intelligence Platform (${report.pricing.tier} tier - €${report.pricing.reportCost})</p>
    <p>${report.pricing.suggestedUpgrade || ''}</p>
  </footer>
</body>
</html>
  `;
}

function getRiskColor(score: number): string {
  if (score >= 75) return '#dc3545'; // Red (high risk)
  if (score >= 50) return '#fd7e14'; // Orange (medium risk)
  if (score >= 25) return '#ffc107'; // Yellow (low risk)
  return '#28a745'; // Green (minimal risk)
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return '#28a745';
    case 'B':
      return '#5bc0de';
    case 'C':
      return '#ffc107';
    case 'D':
      return '#fd7e14';
    case 'F':
      return '#dc3545';
    default:
      return '#6c757d';
  }
}
