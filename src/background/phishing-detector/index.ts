/**
 * Phishing & Scam Detector
 * Integrates URL analysis, scam patterns, and threat intelligence
 */

import { analyzeURL } from '@/background/threat-intelligence/url-analyzer';
import type { URLAnalysisResult } from '@/shared/threat-intelligence-types';
import { analyzeDomain, type DomainIntelligence } from '@/background/security-intelligence/domain-analyzer';
import {
  detectScamPatterns,
  extractURLs,
  isSuspiciousURL,
  detectCryptoScam,
} from './scam-patterns';

export interface PhishingDetectionResult {
  isPhishing: boolean;
  isSuspicious: boolean;
  overallSeverity: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  securityScore?: number; // NEW: 0-100 security score
  scamDetection: {
    detected: boolean;
    patterns: Array<{
      type: string;
      description: string;
      severity: string;
      matchedText: string;
    }>;
  };
  urlAnalysis: {
    totalUrls: number;
    maliciousUrls: URLAnalysisResult[];
    suspiciousUrls: Array<{
      url: string;
      reasons: string[];
      severity: string;
    }>;
  };
  domainIntelligence?: DomainIntelligence[]; // NEW: Domain security analysis
  cryptoScam: {
    detected: boolean;
    indicators: string[];
  };
  warnings: string[];
  warningsBG?: string[]; // NEW: Bulgarian warnings
  recommendations: string[];
  recommendationsBG?: string[]; // NEW: Bulgarian recommendations
}

/**
 * Comprehensive phishing and scam detection for text content
 */
export async function detectPhishingAndScams(
  text: string,
  apiKeys?: {
    googleSafeBrowsing?: string;
    phishTank?: string;
  }
): Promise<PhishingDetectionResult> {
  console.info('[Phishing Detector] Analyzing content for scams and phishing...');

  // 1. Detect scam patterns in text
  const scamPatternResult = detectScamPatterns(text);

  // 2. Extract and analyze URLs
  const urls = extractURLs(text);
  const maliciousUrls: URLAnalysisResult[] = [];
  const suspiciousUrls: Array<{
    url: string;
    reasons: string[];
    severity: string;
  }> = [];
  const domainIntelligence: DomainIntelligence[] = [];

  // Check each URL
  for (const url of urls) {
    // First: Quick local check for suspicious patterns
    const suspiciousCheck = isSuspiciousURL(url);
    if (suspiciousCheck.suspicious) {
      suspiciousUrls.push({
        url,
        reasons: suspiciousCheck.reasons,
        severity: suspiciousCheck.severity,
      });
    }

    // Second: Domain Intelligence Analysis (Norton-like but smarter)
    try {
      const domainAnalysis = await analyzeDomain(url);
      domainIntelligence.push(domainAnalysis);

      // If domain is critical/high risk, add to malicious URLs
      if (domainAnalysis.riskLevel === 'critical' || domainAnalysis.securityScore < 30) {
        maliciousUrls.push({
          url: domainAnalysis.url,
          isMalicious: true,
          threats: domainAnalysis.indicators.map(indicator => ({
            type: 'phishing' as const,
            description: indicator.message,
            severity: indicator.type === 'critical' ? 'critical' : (indicator.type === 'warning' ? 'medium' : 'info'),
            confidence: indicator.type === 'critical' ? 95 : 70,
            source: 'Domain Intelligence',
            timestamp: Date.now(),
          })),
          reputation: {
            score: domainAnalysis.securityScore,
            sources: [{
              service: 'Domain Intelligence',
              score: domainAnalysis.securityScore,
              lastChecked: Date.now(),
            }],
          },
          phishing: {
            isPhishing: domainAnalysis.blacklistStatus.isListed,
            confidence: domainAnalysis.blacklistStatus.isListed ? 90 : 0,
          },
          ssl: {
            valid: domainAnalysis.sslCertificate.isValid,
            issuer: domainAnalysis.sslCertificate.issuer || 'Unknown',
            expiryDate: domainAnalysis.sslCertificate.expiryDate ? domainAnalysis.sslCertificate.expiryDate.getTime() : undefined,
          },
          domainInfo: {
            age: domainAnalysis.domainAge.ageInDays,
            registrar: domainAnalysis.domainAge.registrar || 'Unknown',
            isNewDomain: domainAnalysis.domainAge.ageInDays < 30,
          },
        });
      }
    } catch (error) {
      console.error('[Phishing Detector] Error analyzing domain:', url, error);
    }

    // Third: Deep analysis using threat intelligence (if API keys provided)
    if (apiKeys?.googleSafeBrowsing || apiKeys?.phishTank) {
      try {
        const analysis = await analyzeURL(url, apiKeys);
        if (analysis.isMalicious) {
          maliciousUrls.push(analysis);
        }
      } catch (error) {
        console.error('[Phishing Detector] Error analyzing URL:', url, error);
      }
    }
  }

  // 3. Detect cryptocurrency scams
  const cryptoScam = detectCryptoScam(text);

  // 4. Calculate overall severity (including Domain Intelligence)
  let overallSeverity: 'critical' | 'high' | 'medium' | 'low' | 'safe' = 'safe';

  // Calculate average security score from Domain Intelligence
  const avgSecurityScore = domainIntelligence.length > 0
    ? domainIntelligence.reduce((sum, d) => sum + d.securityScore, 0) / domainIntelligence.length
    : 100;

  if (
    maliciousUrls.length > 0 ||
    scamPatternResult.overallSeverity === 'critical' ||
    cryptoScam.isScam ||
    domainIntelligence.some((d) => d.riskLevel === 'critical')
  ) {
    overallSeverity = 'critical';
  } else if (
    suspiciousUrls.some((u) => u.severity === 'critical') ||
    scamPatternResult.overallSeverity === 'high' ||
    domainIntelligence.some((d) => d.riskLevel === 'high')
  ) {
    overallSeverity = 'high';
  } else if (
    suspiciousUrls.length > 0 ||
    scamPatternResult.overallSeverity === 'medium' ||
    domainIntelligence.some((d) => d.riskLevel === 'medium')
  ) {
    overallSeverity = 'medium';
  } else if (
    scamPatternResult.matches.length > 0 ||
    domainIntelligence.some((d) => d.riskLevel === 'low')
  ) {
    overallSeverity = 'low';
  }

  // 5. Generate warnings (English + Bulgarian)
  const warnings: string[] = [];
  const warningsBG: string[] = [];

  if (maliciousUrls.length > 0) {
    warnings.push(
      `🚨 DANGER: ${maliciousUrls.length} confirmed malicious URL(s) detected by security databases`
    );
    warningsBG.push(
      `🚨 ОПАСНОСТ: ${maliciousUrls.length} потвърдено злонамерени URL адреси открити от бази данни за сигурност`
    );
  }

  if (cryptoScam.isScam) {
    warnings.push(
      '🚨 CRYPTO SCAM: This content matches known cryptocurrency scam patterns'
    );
    warningsBG.push(
      '🚨 КРИПТО ИЗМАМА: Съдържанието съвпада с известни модели на криптовалутни измами'
    );
  }

  if (suspiciousUrls.some((u) => u.severity === 'critical')) {
    warnings.push(
      '⚠️ PHISHING: URL(s) detected that impersonate legitimate websites'
    );
    warningsBG.push(
      '⚠️ ФИШИНГ: Открити URL адреси, които имитират легитимни уебсайтове'
    );
  }

  if (scamPatternResult.overallSeverity === 'critical') {
    warnings.push(
      '⚠️ SCAM: Content matches known scam patterns (fake giveaways, phishing attempts)'
    );
    warningsBG.push(
      '⚠️ ИЗМАМА: Съдържанието съвпада с известни модели на измами (фалшиви подаръци, фишинг опити)'
    );
  }

  // Add Domain Intelligence warnings
  domainIntelligence.forEach((domain) => {
    if (domain.riskLevel === 'critical' || domain.riskLevel === 'high') {
      domain.indicators.forEach((indicator) => {
        if (indicator.type === 'critical') {
          warnings.push(`🔒 ${indicator.message}`);
          warningsBG.push(`🔒 ${indicator.messageBG}`);
        }
      });
    }
  });

  // 6. Generate recommendations (English + Bulgarian)
  const recommendations: string[] = [];
  const recommendationsBG: string[] = [];

  if (maliciousUrls.length > 0 || suspiciousUrls.length > 0) {
    recommendations.push('DO NOT click on any links in this content');
    recommendations.push('DO NOT enter personal information or passwords');
    recommendationsBG.push('НЕ кликвайте върху никакви линкове в това съдържание');
    recommendationsBG.push('НЕ въвеждайте лична информация или пароли');
  }

  if (cryptoScam.isScam) {
    recommendations.push('DO NOT send cryptocurrency to any addresses mentioned');
    recommendations.push('Legitimate giveaways never ask you to send crypto first');
    recommendationsBG.push('НЕ изпращайте криптовалута на посочените адреси');
    recommendationsBG.push('Легитимните подаръци никога не искат първо да изпратите крипто');
  }

  if (scamPatternResult.matches.some((m) => m.pattern.type === 'phishing')) {
    recommendations.push('Verify account issues directly through official app/website');
    recommendations.push('Never click "verify account" links from social media');
    recommendationsBG.push('Проверете проблемите с акаунта директно чрез официалното приложение/уебсайт');
    recommendationsBG.push('Никога не кликвайте на линкове за "потвърждаване на акаунт" от социални мрежи');
  }

  // Add Domain Intelligence recommendations
  domainIntelligence.forEach((domain) => {
    if (domain.riskLevel !== 'safe') {
      domain.recommendations.forEach((rec, index) => {
        if (!recommendations.includes(rec)) {
          recommendations.push(rec);
          if (domain.recommendationsBG && domain.recommendationsBG[index]) {
            recommendationsBG.push(domain.recommendationsBG[index]);
          }
        }
      });
    }
  });

  const result: PhishingDetectionResult = {
    isPhishing: maliciousUrls.length > 0 || suspiciousUrls.some((u) => u.severity === 'critical'),
    isSuspicious: suspiciousUrls.length > 0 || scamPatternResult.matches.length > 0,
    overallSeverity,
    securityScore: Math.round(avgSecurityScore),
    scamDetection: {
      detected: scamPatternResult.matches.length > 0,
      patterns: scamPatternResult.matches.map((m) => ({
        type: m.pattern.type,
        description: m.pattern.description,
        severity: m.pattern.severity,
        matchedText: m.matchedText,
      })),
    },
    urlAnalysis: {
      totalUrls: urls.length,
      maliciousUrls,
      suspiciousUrls,
    },
    domainIntelligence: domainIntelligence.length > 0 ? domainIntelligence : undefined,
    cryptoScam: {
      detected: cryptoScam.isScam,
      indicators: cryptoScam.indicators,
    },
    warnings,
    warningsBG,
    recommendations,
    recommendationsBG,
  };

  if (result.isPhishing || result.isSuspicious) {
    console.warn(
      `[Phishing Detector] THREAT DETECTED - Severity: ${overallSeverity}, Malicious URLs: ${maliciousUrls.length}, Suspicious URLs: ${suspiciousUrls.length}`
    );
  } else {
    console.info('[Phishing Detector] Content appears safe');
  }

  return result;
}

/**
 * Quick check (no API calls) - for real-time scanning
 */
export function quickPhishingCheck(text: string): {
  suspicious: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  warnings: string[];
} {
  const urls = extractURLs(text);
  const scamPatterns = detectScamPatterns(text);
  const cryptoScam = detectCryptoScam(text);

  const suspiciousUrls = urls.filter((url) => isSuspiciousURL(url).suspicious);

  let severity: 'critical' | 'high' | 'medium' | 'low' | 'safe' = 'safe';
  const warnings: string[] = [];

  if (cryptoScam.isScam || scamPatterns.overallSeverity === 'critical') {
    severity = 'critical';
    warnings.push('CRITICAL: Scam detected');
  } else if (
    suspiciousUrls.length > 0 ||
    scamPatterns.overallSeverity === 'high'
  ) {
    severity = 'high';
    warnings.push('WARNING: Suspicious content');
  } else if (scamPatterns.matches.length > 0) {
    severity = 'medium';
    warnings.push('CAUTION: Potentially suspicious');
  }

  return {
    suspicious: severity !== 'safe',
    severity,
    warnings,
  };
}
