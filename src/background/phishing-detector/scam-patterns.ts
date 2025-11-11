/**
 * Phishing & Scam Detection Patterns
 * Comprehensive database of scam indicators and malicious patterns
 */

export interface ScamPattern {
  type: 'phishing' | 'crypto_scam' | 'fake_giveaway' | 'impersonation' | 'malware' | 'romance_scam' | 'job_scam';
  severity: 'critical' | 'high' | 'medium' | 'low';
  patterns: string[];
  description: string;
}

/**
 * Comprehensive scam detection patterns
 */
export const SCAM_PATTERNS: ScamPattern[] = [
  {
    type: 'crypto_scam',
    severity: 'critical',
    patterns: [
      'send.*btc.*get.*back',
      'double.*bitcoin',
      'triple.*ethereum',
      'free.*crypto.*giveaway',
      'elon.*musk.*giveaway',
      'trust.*wallet.*verification',
      'wallet.*recovery.*phrase',
      'seed.*phrase.*required',
      'validate.*wallet',
      'connect.*wallet.*urgent',
      'claim.*airdrop.*immediately',
    ],
    description: 'Cryptocurrency scam (fake giveaways, wallet phishing)',
  },
  {
    type: 'phishing',
    severity: 'critical',
    patterns: [
      'verify.*account.*suspended',
      'urgent.*action.*required',
      'confirm.*identity.*immediately',
      'unusual.*activity.*detected',
      'click.*here.*avoid.*suspension',
      'update.*payment.*method',
      'account.*will.*be.*closed',
      'security.*alert.*verify',
      'reset.*password.*expire',
    ],
    description: 'Phishing attempt (fake security alerts, account verification)',
  },
  {
    type: 'fake_giveaway',
    severity: 'high',
    patterns: [
      '\\d+.*iphone.*giveaway',
      'congratulations.*winner',
      'free.*gift.*card',
      'claim.*prize.*now',
      '\\$\\d+.*paypal.*transfer',
      'selected.*random.*winner',
      'limited.*time.*offer.*free',
    ],
    description: 'Fake giveaway scam (iPhone, gift cards, cash prizes)',
  },
  {
    type: 'impersonation',
    severity: 'high',
    patterns: [
      'official.*support.*dm',
      'customer.*service.*here',
      'admin.*contact.*issue',
      'verified.*representative',
      'team.*member.*help',
    ],
    description: 'Impersonation scam (fake support, admin accounts)',
  },
  {
    type: 'job_scam',
    severity: 'medium',
    patterns: [
      'work.*from.*home.*\\$\\d+',
      'easy.*money.*no.*experience',
      'earn.*\\$\\d+.*per.*day',
      'investment.*guaranteed.*return',
      'pay.*upfront.*training',
    ],
    description: 'Job/investment scam (work-from-home, MLM, fake investments)',
  },
  {
    type: 'romance_scam',
    severity: 'medium',
    patterns: [
      'stranded.*need.*money',
      'emergency.*hospital.*transfer',
      'military.*deployment.*funds',
      'inheritance.*need.*help',
    ],
    description: 'Romance/advance-fee scam',
  },
];

/**
 * Suspicious URL patterns (domain squatting, typosquatting, etc.)
 */
export const SUSPICIOUS_URL_PATTERNS = [
  // Typosquatting (common brands)
  /paypa1|paypai|paypa11/i,
  /faceb00k|facebok|fecebook/i,
  /googIe|gogle|g00gle/i, // Note: capital i looks like l
  /amazom|amaz0n|arnazon/i,
  /app1e|appl3|appie/i,
  /micros0ft|rnicr0soft/i,
  /netfIix|netfl1x|netfiix/i,
  /twitter-|twltter|twiter/i,

  // Suspicious TLDs commonly used in scams
  /\.(tk|ml|ga|cf|gq|xyz|top|click|link|download)$/i,

  // URL shorteners (can hide phishing)
  /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|buff\.ly/i,

  // IP addresses in URLs (suspicious)
  /http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,

  // Suspicious keywords in domain
  /secure-|verify-|account-|login-|update-|confirm-/i,
  /-secure|-verify|-account|-login|-update|-confirm/i,

  // Suspicious subdomains
  /https?:\/\/[a-z]+-[a-z]+-[a-z]+\./i, // Example: update-your-account.evil.com
];

/**
 * Cryptocurrency scam address patterns
 */
export const CRYPTO_SCAM_INDICATORS = [
  // Bitcoin addresses in suspicious contexts
  /send.*btc.*to.*[13][a-km-zA-HJ-NP-Z1-9]{25,34}/,

  // Ethereum addresses in suspicious contexts
  /send.*eth.*to.*0x[a-fA-F0-9]{40}/,

  // "Double your crypto" scams
  /send.*[0-9.]+.*btc.*receive.*[0-9.]+/i,
];

/**
 * Legitimate domains that are often impersonated
 */
export const LEGITIMATE_DOMAINS = [
  'paypal.com',
  'facebook.com',
  'google.com',
  'amazon.com',
  'apple.com',
  'microsoft.com',
  'netflix.com',
  'twitter.com',
  'instagram.com',
  'linkedin.com',
  'coinbase.com',
  'binance.com',
  'metamask.io',
];

/**
 * Check if text matches scam patterns
 */
export function detectScamPatterns(text: string): {
  matches: Array<{ pattern: ScamPattern; matchedText: string }>;
  overallSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none';
} {
  const matches: Array<{ pattern: ScamPattern; matchedText: string }> = [];
  const lowerText = text.toLowerCase();

  for (const pattern of SCAM_PATTERNS) {
    for (const regex of pattern.patterns) {
      const re = new RegExp(regex, 'i');
      const match = lowerText.match(re);

      if (match) {
        matches.push({
          pattern,
          matchedText: match[0],
        });
      }
    }
  }

  // Determine overall severity
  let overallSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';

  if (matches.some((m) => m.pattern.severity === 'critical')) {
    overallSeverity = 'critical';
  } else if (matches.some((m) => m.pattern.severity === 'high')) {
    overallSeverity = 'high';
  } else if (matches.some((m) => m.pattern.severity === 'medium')) {
    overallSeverity = 'medium';
  } else if (matches.length > 0) {
    overallSeverity = 'low';
  }

  return { matches, overallSeverity };
}

/**
 * Check if URL is suspicious
 */
export function isSuspiciousURL(url: string): {
  suspicious: boolean;
  reasons: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
} {
  const reasons: string[] = [];
  let suspicious = false;

  try {
    const urlObj = new URL(url);

    // Check against typosquatting patterns
    for (const pattern of SUSPICIOUS_URL_PATTERNS) {
      if (pattern.test(url)) {
        suspicious = true;
        reasons.push('URL matches known phishing pattern');
        break;
      }
    }

    // Check for IP address
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlObj.hostname)) {
      suspicious = true;
      reasons.push('URL uses IP address instead of domain name');
    }

    // Check for suspicious TLD
    const suspiciousTLDs = ['tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'click'];
    const tld = urlObj.hostname.split('.').pop();
    if (tld && suspiciousTLDs.includes(tld)) {
      suspicious = true;
      reasons.push(`Suspicious TLD (.${tld}) commonly used in scams`);
    }

    // Check for suspicious keywords in domain
    if (
      /(secure|verify|account|login|update|confirm|validation|authenticate)/i.test(
        urlObj.hostname
      )
    ) {
      suspicious = true;
      reasons.push('Domain contains suspicious security keywords');
    }

    // Check for homograph attacks (Unicode lookalikes)
    if (/[а-я]/i.test(urlObj.hostname)) {
      // Cyrillic characters
      suspicious = true;
      reasons.push('Domain uses Cyrillic characters (homograph attack)');
    }

    // Check for very long subdomains (phishing tactic)
    const subdomains = urlObj.hostname.split('.');
    if (subdomains.length > 4) {
      suspicious = true;
      reasons.push('Domain has unusually many subdomains');
    }

    // Check for legitimate domain impersonation
    for (const legitDomain of LEGITIMATE_DOMAINS) {
      const legitBase = legitDomain.replace('.com', '').replace('.io', '');
      if (
        urlObj.hostname.includes(legitBase) &&
        !urlObj.hostname.endsWith(legitDomain)
      ) {
        suspicious = true;
        reasons.push(`Impersonating ${legitDomain}`);
      }
    }
  } catch (error) {
    // Invalid URL
    return { suspicious: false, reasons: [], severity: 'low' };
  }

  // Determine severity
  let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (reasons.some((r) => r.includes('Impersonating') || r.includes('phishing'))) {
    severity = 'critical';
  } else if (reasons.length >= 3) {
    severity = 'high';
  } else if (reasons.length >= 2) {
    severity = 'medium';
  }

  return { suspicious, reasons, severity };
}

/**
 * Extract all URLs from text
 */
export function extractURLs(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Check for cryptocurrency scam indicators
 */
export function detectCryptoScam(text: string): {
  isScam: boolean;
  indicators: string[];
} {
  const indicators: string[] = [];
  let isScam = false;

  for (const pattern of CRYPTO_SCAM_INDICATORS) {
    if (pattern.test(text)) {
      isScam = true;
      indicators.push('Cryptocurrency scam pattern detected');
    }
  }

  // Check for common crypto scam keywords
  if (/double.*bitcoin|triple.*ethereum|free.*crypto|guaranteed.*profit/i.test(text)) {
    isScam = true;
    indicators.push('Cryptocurrency Ponzi scheme indicators');
  }

  return { isScam, indicators };
}
