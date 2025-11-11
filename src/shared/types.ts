/**
 * Shared type definitions for Fact-It extension
 */

// Message types for communication between content scripts and service worker
export enum MessageType {
  CHECK_CLAIM = 'CHECK_CLAIM',
  CLAIM_RESULT = 'CLAIM_RESULT',
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  PING = 'PING',
  GET_DOMAIN_SELECTORS = 'GET_DOMAIN_SELECTORS',
  GET_ALL_SELECTORS = 'GET_ALL_SELECTORS',
  UPDATE_DOMAIN_SELECTOR = 'UPDATE_DOMAIN_SELECTOR',
  ADD_DOMAIN_SELECTOR = 'ADD_DOMAIN_SELECTOR',
  REMOVE_DOMAIN_SELECTOR = 'REMOVE_DOMAIN_SELECTOR',
  GET_SELECTOR_STATS = 'GET_SELECTOR_STATS',
  GET_CACHE_STATS = 'GET_CACHE_STATS',
  CLEAR_CACHE = 'CLEAR_CACHE',
  GET_TRIAL_INFO = 'GET_TRIAL_INFO',
  GET_DAILY_LIMIT = 'GET_DAILY_LIMIT',
  GET_HISTORICAL_STATS = 'GET_HISTORICAL_STATS',
  // Company tracking
  SET_USER_EMAIL = 'SET_USER_EMAIL',
  GET_COMPANY_STATS = 'GET_COMPANY_STATS',
  GET_COMPANY_DASHBOARD_DATA = 'GET_COMPANY_DASHBOARD_DATA',
  TRACK_THREAT_BLOCKED = 'TRACK_THREAT_BLOCKED',
  // Threat Intelligence
  CHECK_URL = 'THREAT_CHECK_URL',
  CHECK_EMAIL_BREACH = 'THREAT_CHECK_EMAIL_BREACH',
  CHECK_DOMAIN_SQUATTING = 'THREAT_CHECK_DOMAIN_SQUATTING',
  GENERATE_THREAT_REPORT = 'THREAT_GENERATE_REPORT',
  CHECK_DEEPFAKE = 'THREAT_CHECK_DEEPFAKE',
  MONITOR_BRAND = 'THREAT_MONITOR_BRAND',
  // Vulnerability Hunter
  VULN_HUNTER_START = 'VULN_HUNTER_START',
  VULN_HUNTER_GET_DISCOVERIES = 'VULN_HUNTER_GET_DISCOVERIES',
  VULN_HUNTER_ANALYZE = 'VULN_HUNTER_ANALYZE',
  VULN_HUNTER_CLEAR = 'VULN_HUNTER_CLEAR',
}

// Platform types
export type Platform = 'twitter' | 'linkedin' | 'facebook' | 'article';

// Verdict types
export type Verdict = 'true' | 'false' | 'unknown' | 'no_claim';

// Message interfaces
export interface CheckClaimMessage {
  type: MessageType.CHECK_CLAIM;
  payload: {
    text: string;
    elementId: string;
    platform: Platform;
  };
}

export interface ClaimResultMessage {
  type: MessageType.CLAIM_RESULT;
  payload: {
    elementId: string;
    verdict: Verdict;
    confidence: number; // 0-100
    explanation: string;
    sources: Array<{ title: string; url: string; provider?: string }>;
    providerResults?: Array<{
      providerId: string;
      providerName: string;
      verdict: 'true' | 'false' | 'unknown';
      confidence: number;
      explanation: string;
    }>;
    consensus?: {
      total: number;
      agreeing: number;
      percentageAgreement: number; // 0-100
    };
    disagreement?: {
      hasDisagreement: boolean;
      conflictingVerdicts: Array<{
        verdict: 'true' | 'false' | 'unknown';
        providers: string[];
        confidence: number;
      }>;
    };
    sourceDiversity?: SourceDiversity;
  };
}

export interface PingMessage {
  type: MessageType.PING;
}

export interface GetSettingsMessage {
  type: MessageType.GET_SETTINGS;
}

export interface UpdateSettingsMessage {
  type: MessageType.UPDATE_SETTINGS;
  payload: {
    providers?: {
      groq?: ProviderSettings;
      openai?: ProviderSettings;
      anthropic?: ProviderSettings;
      perplexity?: ProviderSettings;
    };
    autoCheckEnabled?: boolean;
    confidenceThreshold?: number;
  };
}

// Selector storage messages
export interface PlatformSelectors {
  postContainer: string;
  textContent: string;
  author?: string;
  timestamp?: string;
}

export interface GetDomainSelectorsMessage {
  type: MessageType.GET_DOMAIN_SELECTORS;
  payload: {
    domain: string;
  };
}

export interface GetAllSelectorsMessage {
  type: MessageType.GET_ALL_SELECTORS;
}

export interface UpdateDomainSelectorMessage {
  type: MessageType.UPDATE_DOMAIN_SELECTOR;
  payload: {
    domain: string;
    selectors: PlatformSelectors;
  };
}

export interface AddDomainSelectorMessage {
  type: MessageType.ADD_DOMAIN_SELECTOR;
  payload: {
    domain: string;
    selectors: PlatformSelectors;
  };
}

export interface RemoveDomainSelectorMessage {
  type: MessageType.REMOVE_DOMAIN_SELECTOR;
  payload: {
    domain: string;
  };
}

export interface GetSelectorStatsMessage {
  type: MessageType.GET_SELECTOR_STATS;
}

export interface SelectorStatsMessage {
  totalDomains: number;
  storageEstimateMB: number;
}

// Cache management messages
export interface GetCacheStatsMessage {
  type: MessageType.GET_CACHE_STATS;
}

export interface CacheStatsMessage {
  totalEntries: number;
  oldestEntry: number;
  newestEntry: number;
  averageAge: number;
  storageEstimateMB: number;
}

export interface ClearCacheMessage {
  type: MessageType.CLEAR_CACHE;
}

export interface GetDailyLimitMessage {
  type: MessageType.GET_DAILY_LIMIT;
}

// Threat Intelligence message interfaces
export interface CheckURLMessage {
  type: MessageType.CHECK_URL;
  payload: { url: string };
}

export interface CheckEmailBreachMessage {
  type: MessageType.CHECK_EMAIL_BREACH;
  payload: { email: string };
}

export interface CheckDomainSquattingMessage {
  type: MessageType.CHECK_DOMAIN_SQUATTING;
  payload: { domain: string };
}

export interface GenerateThreatReportMessage {
  type: MessageType.GENERATE_THREAT_REPORT;
  payload: {
    domain: string;
    email?: string;
    tier: 'free' | 'basic' | 'professional' | 'enterprise';
  };
}

export interface CheckDeepfakeMessage {
  type: MessageType.CHECK_DEEPFAKE;
  payload: {
    mediaUrl: string;
    mediaType: 'image' | 'video' | 'audio';
  };
}

export interface MonitorBrandMessage {
  type: MessageType.MONITOR_BRAND;
  payload: {
    brandName: string;
    officialDomains: string[];
  };
}

// Vulnerability Hunter message interfaces
export interface VulnHunterStartMessage {
  type: MessageType.VULN_HUNTER_START;
  payload: {
    twitterBearerToken?: string;
    githubToken: string;
    keywords?: string[];
  };
}

export interface VulnHunterGetDiscoveriesMessage {
  type: MessageType.VULN_HUNTER_GET_DISCOVERIES;
}

export interface VulnHunterAnalyzeMessage {
  type: MessageType.VULN_HUNTER_ANALYZE;
  payload: {
    discoveryId: string;
    githubToken: string;
  };
}

export interface VulnHunterClearMessage {
  type: MessageType.VULN_HUNTER_CLEAR;
}

// Union type for all messages
export type Message =
  | CheckClaimMessage
  | ClaimResultMessage
  | PingMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | GetDomainSelectorsMessage
  | GetAllSelectorsMessage
  | UpdateDomainSelectorMessage
  | AddDomainSelectorMessage
  | RemoveDomainSelectorMessage
  | GetSelectorStatsMessage
  | GetCacheStatsMessage
  | ClearCacheMessage
  | GetTrialInfoMessage
  | GetDailyLimitMessage
  | GetHistoricalStatsMessage
  | SetUserEmailMessage
  | GetCompanyStatsMessage
  | GetCompanyDashboardDataMessage
  | TrackThreatBlockedMessage
  | CheckURLMessage
  | CheckEmailBreachMessage
  | CheckDomainSquattingMessage
  | GenerateThreatReportMessage
  | CheckDeepfakeMessage
  | MonitorBrandMessage
  | VulnHunterStartMessage
  | VulnHunterGetDiscoveriesMessage
  | VulnHunterAnalyzeMessage
  | VulnHunterClearMessage;

// Provider settings interface
export interface ProviderSettings {
  enabled: boolean;
  apiKey: string | null;
}

// Settings interface
export interface ExtensionSettings {
  providers: {
    groq: ProviderSettings;
    openai: ProviderSettings;
    anthropic: ProviderSettings;
    perplexity: ProviderSettings;
  };
  autoCheckEnabled: boolean;
  confidenceThreshold: number; // 0-100, only show results above this confidence
}

// Trial system interface
export interface TrialInfo {
  startDate: number; // timestamp
  endDate: number; // timestamp
  isActive: boolean;
  totalChecks: number;
  checksToday: number;
  lastCheckDate: string; // YYYY-MM-DD
}

// Message types for trial
export interface GetTrialInfoMessage {
  type: MessageType.GET_TRIAL_INFO;
}

export interface TrialInfoMessage {
  trialInfo: TrialInfo;
  daysRemaining: number;
  isExpired: boolean;
}

// Company tracking interfaces
export interface UserProfile {
  email: string;
  companyDomain: string; // Extracted from email (e.g., "acme.com")
  firstSeen: number; // timestamp
  lastActive: number; // timestamp
  totalThreatsBlocked: number;
  totalChecks: number;
}

export interface CompanyStats {
  domain: string;
  totalEmployees: number; // Number of users from this domain
  activeEmployees: number; // Active in last 30 days
  totalThreatsBlocked: number;
  totalChecks: number;
  firstSeen: number; // timestamp of first employee
  lastActivity: number; // timestamp of most recent activity
  topThreats: Array<{
    type: string;
    count: number;
  }>;
  riskScore: number; // 0-100, higher = more at risk
}

export interface CompanyDashboardData {
  company: CompanyStats;
  recentThreats: Array<{
    timestamp: number;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    blockedBy: string; // employee email (anonymized)
  }>;
  employeeActivity: Array<{
    email: string; // anonymized (e.g., "j***@acme.com")
    checksToday: number;
    threatsBlocked: number;
    lastActive: number;
  }>;
  upgradeEligible: boolean; // True if 10+ employees
  showEnterprisePromo: boolean; // True if 50+ employees
}

// Company tracking messages
export interface SetUserEmailMessage {
  type: MessageType.SET_USER_EMAIL;
  payload: {
    email: string;
  };
}

export interface GetCompanyStatsMessage {
  type: MessageType.GET_COMPANY_STATS;
}

export interface GetCompanyDashboardDataMessage {
  type: MessageType.GET_COMPANY_DASHBOARD_DATA;
}

export interface TrackThreatBlockedMessage {
  type: MessageType.TRACK_THREAT_BLOCKED;
  payload: {
    threatType: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
  };
}

// Historical tracking interfaces
export interface HistoricalCheck {
  timestamp: number;
  text: string; // First 100 chars
  verdict: Verdict;
  confidence: number;
  platform: Platform;
  category?: string; // e.g., "Politics", "Health", "Science"
  disagreement?: boolean; // True if AIs disagreed
}

export interface HistoricalStats {
  totalChecks: number;
  checksThisWeek: number;
  verdictCounts: {
    true: number;
    false: number;
    unknown: number;
    no_claim: number;
  };
  topCategories: Array<{ category: string; count: number }>;
  disagreementRate: number; // Percentage of checks where AIs disagreed
  averageConfidence: number;
  recentChecks: HistoricalCheck[]; // Last 50 checks
}

// Source diversity interfaces
export type SourceCategory =
  | 'news_outlet'
  | 'academic'
  | 'government'
  | 'fact_checker'
  | 'social_media'
  | 'encyclopedia'
  | 'other';

export interface CategorizedSource {
  title: string;
  url: string;
  provider: string;
  category: SourceCategory;
  domain: string;
}

export interface SourceDiversity {
  categories: Record<SourceCategory, number>;
  uniqueDomains: number;
  totalSources: number;
  categorizedSources: CategorizedSource[];
}

// Message types for historical tracking
export interface GetHistoricalStatsMessage {
  type: MessageType.GET_HISTORICAL_STATS;
}

// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'fact_it_settings',
  CACHE: 'fact_it_cache',
  SELECTORS: 'fact_it_selectors',
  TRIAL: 'fact_it_trial',
  USER_PROFILE: 'fact_it_user_profile',
  COMPANY_STATS: 'fact_it_company_stats', // Map of domain -> CompanyStats
  COMPANY_EMPLOYEES: 'fact_it_company_employees', // Map of domain -> UserProfile[]
  HISTORICAL_STATS: 'fact_it_historical_stats',
  HISTORICAL_CHECKS: 'fact_it_historical_checks',
} as const;
