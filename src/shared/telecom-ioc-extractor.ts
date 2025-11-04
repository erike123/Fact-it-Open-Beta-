/**
 * Telecom-Specific IOC Extractor
 * Extracts threat indicators from social media posts
 */

export interface TelecomIOC {
  ipAddresses: string[];
  domains: string[];
  cves: string[];
  fileHashes: string[];
  phoneNumbers: string[];
  imsi: string[];
  telecomThreats: TelecomThreat[];
}

export interface TelecomThreat {
  type: 'sim_swap' | 'ss7_exploit' | '5g_vuln' | 'smishing' | 'imsi_catcher' | 'dos';
  confidence: number;
  keywords: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export class TelecomIOCExtractor {
  // Regex patterns for IOCs
  private static readonly PATTERNS = {
    ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    domain: /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi,
    cve: /CVE-\d{4}-\d{4,7}/gi,
    md5: /\b[a-f0-9]{32}\b/gi,
    sha1: /\b[a-f0-9]{40}\b/gi,
    sha256: /\b[a-f0-9]{64}\b/gi,
    phone: /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    imsi: /\b\d{15}\b/g, // 15-digit IMSI numbers
  };

  // Telecom-specific threat patterns
  private static readonly TELECOM_THREATS = {
    sim_swap: {
      keywords: [
        'sim swap', 'port out', 'unauthorized sim', 'sim jacking',
        'sim hijacking', 'carrier port', 'mobile number transfer'
      ],
      severity: 'critical' as const,
    },
    ss7_exploit: {
      keywords: [
        'ss7 exploit', 'ss7 vulnerability', 'signaling attack',
        'location tracking', 'sms interception', 'call interception'
      ],
      severity: 'critical' as const,
    },
    '5g_vuln': {
      keywords: [
        '5g vulnerability', '5g exploit', '5g rce', 'gnodeb',
        '5g core', 'standalone core', 'ngran vulnerability'
      ],
      severity: 'high' as const,
    },
    smishing: {
      keywords: [
        'smishing', 'sms phishing', 'fake sms', 'sms scam',
        'text message phishing', 'malicious sms'
      ],
      severity: 'medium' as const,
    },
    imsi_catcher: {
      keywords: [
        'imsi catcher', 'stingray', 'fake cell tower', 'rogue base station',
        'cell site simulator', 'dirtbox'
      ],
      severity: 'high' as const,
    },
    dos: {
      keywords: [
        'ddos telecom', 'dos attack carrier', 'network flooding',
        'telecom outage attack', 'service disruption'
      ],
      severity: 'high' as const,
    },
  };

  /**
   * Extract all IOCs from text
   */
  static extract(text: string): TelecomIOC {
    const lowercaseText = text.toLowerCase();

    return {
      ipAddresses: this.extractPattern(text, this.PATTERNS.ipv4),
      domains: this.extractPattern(text, this.PATTERNS.domain)
        .filter(d => this.isLikelyMalicious(d)),
      cves: this.extractPattern(text, this.PATTERNS.cve),
      fileHashes: [
        ...this.extractPattern(text, this.PATTERNS.md5),
        ...this.extractPattern(text, this.PATTERNS.sha1),
        ...this.extractPattern(text, this.PATTERNS.sha256),
      ],
      phoneNumbers: this.extractPattern(text, this.PATTERNS.phone),
      imsi: this.extractPattern(text, this.PATTERNS.imsi),
      telecomThreats: this.detectTelecomThreats(lowercaseText),
    };
  }

  /**
   * Detect telecom-specific threats
   */
  private static detectTelecomThreats(text: string): TelecomThreat[] {
    const threats: TelecomThreat[] = [];

    for (const [type, config] of Object.entries(this.TELECOM_THREATS)) {
      const matchedKeywords = config.keywords.filter(keyword =>
        text.includes(keyword)
      );

      if (matchedKeywords.length > 0) {
        threats.push({
          type: type as TelecomThreat['type'],
          confidence: Math.min(matchedKeywords.length * 30, 100),
          keywords: matchedKeywords,
          severity: config.severity,
        });
      }
    }

    return threats;
  }

  /**
   * Extract matches for a regex pattern
   */
  private static extractPattern(text: string, pattern: RegExp): string[] {
    const matches = text.match(pattern) || [];
    return [...new Set(matches)]; // Deduplicate
  }

  /**
   * Basic domain reputation check (simple heuristics)
   */
  private static isLikelyMalicious(domain: string): boolean {
    const suspiciousPatterns = [
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP in domain
      /\d{10,}/, // Long number sequences
      /[0-9]{5,}/, // Many digits
      /-{2,}/, // Multiple hyphens
      /\.(tk|ml|ga|cf|gq|xyz|top)$/i, // Known spam TLDs
    ];

    return suspiciousPatterns.some(pattern => pattern.test(domain));
  }

  /**
   * Calculate overall threat severity
   */
  static calculateSeverity(iocs: TelecomIOC): 'critical' | 'high' | 'medium' | 'low' {
    const criticalThreats = iocs.telecomThreats.filter(t => t.severity === 'critical');
    const highThreats = iocs.telecomThreats.filter(t => t.severity === 'high');

    if (criticalThreats.length > 0 || iocs.cves.length > 0) return 'critical';
    if (highThreats.length > 0 || iocs.ipAddresses.length > 2) return 'high';
    if (iocs.telecomThreats.length > 0 || iocs.domains.length > 0) return 'medium';
    return 'low';
  }
}
