/**
 * Phishing & Scam Detector
 * Integrates URL analysis, scam patterns, and threat intelligence
 */

import { analyzeURL } from '@/background/threat-intelligence/url-analyzer';
import type { URLAnalysisResult } from '@/shared/threat-intelligence-types';
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
  cryptoScam: {
    detected: boolean;
    indicators: string[];
  };
  warnings: string[];
  recommendations: string[];
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

    // Second: Deep analysis using threat intelligence (if API keys provided)
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

  // 4. Calculate overall severity
  let overallSeverity: 'critical' | 'high' | 'medium' | 'low' | 'safe' = 'safe';

  if (
    maliciousUrls.length > 0 ||
    scamPatternResult.overallSeverity === 'critical' ||
    cryptoScam.isScam
  ) {
    overallSeverity = 'critical';
  } else if (
    suspiciousUrls.some((u) => u.severity === 'critical') ||
    scamPatternResult.overallSeverity === 'high'
  ) {
    overallSeverity = 'high';
  } else if (
    suspiciousUrls.length > 0 ||
    scamPatternResult.overallSeverity === 'medium'
  ) {
    overallSeverity = 'medium';
  } else if (scamPatternResult.matches.length > 0) {
    overallSeverity = 'low';
  }

  // 5. Generate warnings
  const warnings: string[] = [];

  if (maliciousUrls.length > 0) {
    warnings.push(
      `🚨 DANGER: ${maliciousUrls.length} confirmed malicious URL(s) detected by security databases`
    );
  }

  if (cryptoScam.isScam) {
    warnings.push(
      '🚨 CRYPTO SCAM: This content matches known cryptocurrency scam patterns'
    );
  }

  if (suspiciousUrls.some((u) => u.severity === 'critical')) {
    warnings.push(
      '⚠️ PHISHING: URL(s) detected that impersonate legitimate websites'
    );
  }

  if (scamPatternResult.overallSeverity === 'critical') {
    warnings.push(
      '⚠️ SCAM: Content matches known scam patterns (fake giveaways, phishing attempts)'
    );
  }

  // 6. Generate recommendations
  const recommendations: string[] = [];

  if (maliciousUrls.length > 0 || suspiciousUrls.length > 0) {
    recommendations.push('DO NOT click on any links in this content');
    recommendations.push('DO NOT enter personal information or passwords');
  }

  if (cryptoScam.isScam) {
    recommendations.push('DO NOT send cryptocurrency to any addresses mentioned');
    recommendations.push('Legitimate giveaways never ask you to send crypto first');
  }

  if (scamPatternResult.matches.some((m) => m.pattern.type === 'phishing')) {
    recommendations.push('Verify account issues directly through official app/website');
    recommendations.push('Never click "verify account" links from social media');
  }

  const result: PhishingDetectionResult = {
    isPhishing: maliciousUrls.length > 0 || suspiciousUrls.some((u) => u.severity === 'critical'),
    isSuspicious: suspiciousUrls.length > 0 || scamPatternResult.matches.length > 0,
    overallSeverity,
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
    cryptoScam: {
      detected: cryptoScam.isScam,
      indicators: cryptoScam.indicators,
    },
    warnings,
    recommendations,
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
