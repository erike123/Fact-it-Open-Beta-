/**
 * Threat Intelligence types for Fact-It extension
 * Multi-layered security analysis combining OSINT, NVD, misinformation tracking,
 * and compliance checking
 */

// ============================================================================
// Core Threat Types
// ============================================================================

export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ThreatCategory =
  | 'malicious_url'
  | 'phishing'
  | 'domain_squatting'
  | 'credential_breach'
  | 'misinformation_campaign'
  | 'vulnerability'
  | 'deepfake'
  | 'synthetic_media'
  | 'compliance_violation'
  | 'brand_impersonation'
  | 'supply_chain_risk';

export interface ThreatIndicator {
  type: ThreatCategory;
  severity: ThreatSeverity;
  confidence: number; // 0-100
  description: string;
  source: string; // Which service detected it (e.g., 'VirusTotal', 'PhishTank', 'NVD')
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// URL Analysis Types
// ============================================================================

export interface URLAnalysisResult {
  url: string;
  isMalicious: boolean;
  threats: ThreatIndicator[];
  reputation: {
    score: number; // 0-100, higher is safer
    sources: Array<{
      service: string;
      score: number;
      lastChecked: number;
    }>;
  };
  phishing: {
    isPhishing: boolean;
    targetBrand?: string;
    confidence: number;
  };
  ssl: {
    valid: boolean;
    issuer?: string;
    expiryDate?: number;
  };
  domainInfo: {
    age: number; // days since registration
    registrar?: string;
    isNewDomain: boolean; // < 30 days old
  };
}

// ============================================================================
// Domain Squatting Detection
// ============================================================================

export interface DomainSquattingResult {
  originalDomain: string;
  suspiciousDomains: Array<{
    domain: string;
    similarity: number; // 0-100
    technique: 'typosquatting' | 'homograph' | 'combosquatting' | 'levelsquatting';
    active: boolean;
    registrationDate?: number;
    ssl?: boolean;
  }>;
}

// ============================================================================
// Credential Breach Monitoring
// ============================================================================

export interface BreachCheckResult {
  email: string;
  breached: boolean;
  breachCount: number;
  breaches: Array<{
    name: string; // e.g., "LinkedIn"
    date: string; // ISO date
    breachDataClasses: string[]; // e.g., ["Passwords", "Email addresses"]
    description: string;
    isVerified: boolean;
    isSensitive: boolean;
  }>;
  passwords: {
    exposedCount: number; // How many times password hashes have been seen
  };
}

// ============================================================================
// Misinformation Campaign Tracking
// ============================================================================

export interface MisinformationCampaign {
  id: string;
  name: string;
  description: string;
  startDate: number;
  endDate?: number;
  active: boolean;
  targetCountries?: string[];
  narratives: string[]; // Key claims/narratives being spread
  sources: Array<{
    domain: string;
    reliability: number; // 0-100
  }>;
  factChecks: Array<{
    url: string;
    verdict: 'false' | 'misleading' | 'mixed' | 'true';
    source: string; // e.g., "Snopes", "FactCheck.org"
  }>;
}

export interface MisinformationCheckResult {
  text: string;
  matchedCampaigns: Array<{
    campaign: MisinformationCampaign;
    similarity: number; // 0-100
    matchedNarratives: string[];
  }>;
  unreliableSources: Array<{
    domain: string;
    reliabilityScore: number; // 0-100
    biasRating?: string;
    category?: string; // e.g., "conspiracy", "satire", "unreliable"
  }>;
}

// ============================================================================
// Vulnerability Database (NVD) Integration
// ============================================================================

export interface CVEInfo {
  id: string; // e.g., "CVE-2024-1234"
  description: string;
  severity: ThreatSeverity;
  cvssScore: number; // 0-10
  publishedDate: number;
  lastModifiedDate: number;
  affectedProducts: Array<{
    vendor: string;
    product: string;
    versions: string[];
  }>;
  references: string[];
  exploitAvailable: boolean;
}

export interface VulnerabilityCheckResult {
  technology: string; // e.g., "WordPress 5.8"
  version?: string;
  vulnerabilities: CVEInfo[];
  riskScore: number; // 0-100, aggregate risk
}

// ============================================================================
// Compliance Checking
// ============================================================================

export interface ComplianceCheckResult {
  domain: string;
  checkedAt: number;
  overall: {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  https: {
    enabled: boolean;
    hsts: boolean;
    certificate: {
      valid: boolean;
      issuer?: string;
      expiryDate?: number;
    };
  };
  headers: {
    csp: boolean; // Content Security Policy
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
    strictTransportSecurity: boolean;
    referrerPolicy: boolean;
  };
  privacy: {
    hasPrivacyPolicy: boolean;
    hasCookieConsent: boolean;
    gdprCompliant: boolean | 'unknown';
  };
  certificates: {
    iso27001: boolean;
    soc2: boolean;
  };
  breachHistory: {
    hasBreaches: boolean;
    breachCount: number;
    lastBreachDate?: number;
  };
  technologyStack: {
    detected: Array<{
      name: string;
      version?: string;
      category: string; // e.g., "CMS", "Framework", "Server"
      outdated: boolean;
    }>;
  };
  dns: {
    spf: boolean;
    dmarc: boolean;
    dkim: boolean;
  };
  subdomains: {
    count: number;
    exposed: string[]; // Publicly accessible subdomains
  };
}

// ============================================================================
// Deepfake / Synthetic Media Detection
// ============================================================================

export interface DeepfakeDetectionResult {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  isSynthetic: boolean;
  confidence: number; // 0-100
  indicators: Array<{
    type: string; // e.g., "facial_artifacts", "audio_glitches", "metadata_inconsistency"
    severity: ThreatSeverity;
    description: string;
  }>;
  forensicAnalysis: {
    metadataConsistent: boolean;
    compressionAnomalies: boolean;
    aiArtifactsDetected: boolean;
  };
}

// ============================================================================
// Brand Monitoring
// ============================================================================

export interface BrandMonitoringResult {
  brandName: string;
  officialDomains: string[];
  impersonations: Array<{
    domain: string;
    type: 'domain_squatting' | 'phishing' | 'trademark_infringement';
    similarity: number; // 0-100
    active: boolean;
    screenshot?: string; // Base64 or URL
    reportedAt?: number;
  }>;
  socialMediaImpersonations: Array<{
    platform: string;
    handle: string;
    followers: number;
    verified: boolean;
    suspicious: boolean;
  }>;
}

// ============================================================================
// Threat Modeling Report
// ============================================================================

export interface ThreatModelReport {
  domain: string;
  generatedAt: number;
  version: string;
  summary: {
    overallRiskScore: number; // 0-100
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
  };
  findings: {
    compliance: ComplianceCheckResult;
    vulnerabilities: VulnerabilityCheckResult[];
    breaches: BreachCheckResult | null;
    brandRisks: BrandMonitoringResult | null;
    urlThreats: URLAnalysisResult[];
  };
  recommendations: Array<{
    priority: ThreatSeverity;
    category: string;
    description: string;
    remediation: string;
    estimatedEffort: 'low' | 'medium' | 'high';
  }>;
  attackSurface: {
    exposedServices: string[];
    openPorts: number[];
    subdomains: string[];
    technologies: string[];
  };
  pricing: {
    tier: 'free' | 'basic' | 'professional' | 'enterprise';
    reportCost: number; // €
    suggestedUpgrade?: string;
  };
}

// ============================================================================
// Message Types for Threat Intelligence
// ============================================================================

export enum ThreatMessageType {
  CHECK_URL = 'THREAT_CHECK_URL',
  CHECK_EMAIL_BREACH = 'THREAT_CHECK_EMAIL_BREACH',
  CHECK_DOMAIN_SQUATTING = 'THREAT_CHECK_DOMAIN_SQUATTING',
  CHECK_MISINFORMATION = 'THREAT_CHECK_MISINFORMATION',
  GENERATE_THREAT_REPORT = 'THREAT_GENERATE_REPORT',
  CHECK_DEEPFAKE = 'THREAT_CHECK_DEEPFAKE',
  MONITOR_BRAND = 'THREAT_MONITOR_BRAND',
  GET_VULNERABILITY_INFO = 'THREAT_GET_VULNERABILITY_INFO',
}

export interface CheckURLMessage {
  type: ThreatMessageType.CHECK_URL;
  payload: {
    url: string;
  };
}

export interface CheckEmailBreachMessage {
  type: ThreatMessageType.CHECK_EMAIL_BREACH;
  payload: {
    email: string;
  };
}

export interface CheckDomainSquattingMessage {
  type: ThreatMessageType.CHECK_DOMAIN_SQUATTING;
  payload: {
    domain: string;
  };
}

export interface CheckMisinformationMessage {
  type: ThreatMessageType.CHECK_MISINFORMATION;
  payload: {
    text: string;
  };
}

export interface GenerateThreatReportMessage {
  type: ThreatMessageType.GENERATE_THREAT_REPORT;
  payload: {
    domain: string;
    email?: string;
  };
}

export interface CheckDeepfakeMessage {
  type: ThreatMessageType.CHECK_DEEPFAKE;
  payload: {
    mediaUrl: string;
    mediaType: 'image' | 'video' | 'audio';
  };
}

export interface MonitorBrandMessage {
  type: ThreatMessageType.MONITOR_BRAND;
  payload: {
    brandName: string;
    officialDomains: string[];
  };
}

export interface GetVulnerabilityInfoMessage {
  type: ThreatMessageType.GET_VULNERABILITY_INFO;
  payload: {
    technology: string;
    version?: string;
  };
}

export type ThreatMessage =
  | CheckURLMessage
  | CheckEmailBreachMessage
  | CheckDomainSquattingMessage
  | CheckMisinformationMessage
  | GenerateThreatReportMessage
  | CheckDeepfakeMessage
  | MonitorBrandMessage
  | GetVulnerabilityInfoMessage;

// ============================================================================
// Storage Keys
// ============================================================================

export const THREAT_STORAGE_KEYS = {
  THREAT_CACHE: 'fact_it_threat_cache',
  MONITORED_BRANDS: 'fact_it_monitored_brands',
  THREAT_REPORTS: 'fact_it_threat_reports',
  MISINFORMATION_CAMPAIGNS: 'fact_it_misinformation_campaigns',
} as const;
