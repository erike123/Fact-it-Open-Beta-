/**
 * Background service worker for Fact-It extension
 * Handles API calls, message passing, and background tasks
 */

import {
  Message,
  MessageType,
  CheckClaimMessage,
  ClaimResultMessage,
  GetDomainSelectorsMessage,
  UpdateDomainSelectorMessage,
  AddDomainSelectorMessage,
  RemoveDomainSelectorMessage,
  STORAGE_KEYS,
  Verdict,
} from '@/shared/types';
import { EXTENSION_NAME } from '@/shared/constants';
import {
  initializeSelectorStorage,
  getAllSelectors,
  getSelectorsForDomain,
  updateDomainSelectors,
  addDomainSelector,
  removeDomainSelector as removeDomainSelectorStorage,
  getSelectorStorageStats,
} from '@/background/selectors/selector-storage';
import { getCacheStats, clearFactCheckCache } from '@/background/cache/fact-check-cache';
import { getTrialInfo } from '@/background/trial/trial-manager';
import { orchestrator } from '@/background/ai/orchestrator';
import {
  getDailyLimitInfo,
  recordDailyUsage,
} from '@/background/limits/daily-limit-manager';
import { getHistoricalStats } from '@/background/tracking/historical-tracker';
import { getGlobalRateLimitStatus } from '@/background/rate-limiting/global-rate-limiter';
import {
  analyzeURL,
  checkEmailBreach,
  generateThreatReport,
  detectDeepfake,
  monitorBrand,
  detectDomainSquatting,
  enhanceFactCheckWithCampaigns,
} from '@/background/threat-intelligence';
import { vulnHunter } from '@/background/vulnerability-hunter/orchestrator';
import { detectPhishingAndScams } from '@/background/phishing-detector';

console.info(`${EXTENSION_NAME}: Service worker loaded`);

// Initialize selector storage and settings on extension install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.info(`${EXTENSION_NAME}: Extension ${details.reason}`);

  if (details.reason === 'install' || details.reason === 'update') {
    try {
      await initializeSelectorStorage();
      console.info(`${EXTENSION_NAME}: Selector storage initialized`);
    } catch (error) {
      console.error(`${EXTENSION_NAME}: Failed to initialize selector storage:`, error);
    }

    // Initialize default settings with prebaked API keys
    try {
      // Get prebaked API keys from environment variables
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      const anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

      // Merge with default settings, preserving user's existing settings
      const defaultSettings = {
        providers: {
          groq: {
            enabled: groqApiKey ? true : false,
            apiKey: groqApiKey || null
          },
          openai: { enabled: false, apiKey: null },
          anthropic: {
            enabled: anthropicApiKey ? true : false,
            apiKey: anthropicApiKey || null
          },
          perplexity: { enabled: false, apiKey: null },
        },
        autoCheckEnabled: true,
        confidenceThreshold: 70,
      };

      // Only set default settings on fresh install
      if (details.reason === 'install') {
        await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: defaultSettings });
        console.info(`${EXTENSION_NAME}: Default settings initialized with Groq (free) enabled`);
      }
    } catch (error) {
      console.error(`${EXTENSION_NAME}: Failed to initialize default settings:`, error);
    }
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    console.info(`${EXTENSION_NAME}: Received message:`, message.type, sender.tab?.id);

    // Handle different message types
    switch (message.type) {
      case MessageType.PING:
        handlePing(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.CHECK_CLAIM:
        handleCheckClaim(message as CheckClaimMessage, sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_SETTINGS:
        handleGetSettings(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.UPDATE_SETTINGS:
        handleUpdateSettings(message, sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_DOMAIN_SELECTORS:
        handleGetDomainSelectors(message as GetDomainSelectorsMessage, sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_ALL_SELECTORS:
        handleGetAllSelectors(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.UPDATE_DOMAIN_SELECTOR:
        handleUpdateDomainSelector(message as UpdateDomainSelectorMessage, sendResponse);
        return true; // Keep channel open for async response

      case MessageType.ADD_DOMAIN_SELECTOR:
        handleAddDomainSelector(message as AddDomainSelectorMessage, sendResponse);
        return true; // Keep channel open for async response

      case MessageType.REMOVE_DOMAIN_SELECTOR:
        handleRemoveDomainSelector(message as RemoveDomainSelectorMessage, sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_SELECTOR_STATS:
        handleGetSelectorStats(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_CACHE_STATS:
        handleGetCacheStats(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.CLEAR_CACHE:
        handleClearCache(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_TRIAL_INFO:
        handleGetTrialInfo(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_DAILY_LIMIT:
        handleGetDailyLimit(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_HISTORICAL_STATS:
        handleGetHistoricalStats(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.SET_USER_EMAIL:
        handleSetUserEmail(message, sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_COMPANY_STATS:
        handleGetCompanyStats(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.GET_COMPANY_DASHBOARD_DATA:
        handleGetCompanyDashboardData(sendResponse);
        return true; // Keep channel open for async response

      case MessageType.TRACK_THREAT_BLOCKED:
        handleTrackThreatBlocked(message, sendResponse);
        return true; // Keep channel open for async response

      // Threat Intelligence
      case MessageType.CHECK_URL:
        handleCheckURL(message, sendResponse);
        return true;

      case MessageType.CHECK_EMAIL_BREACH:
        handleCheckEmailBreach(message, sendResponse);
        return true;

      case MessageType.CHECK_DOMAIN_SQUATTING:
        handleCheckDomainSquatting(message, sendResponse);
        return true;

      case MessageType.GENERATE_THREAT_REPORT:
        handleGenerateThreatReport(message, sendResponse);
        return true;

      case MessageType.CHECK_DEEPFAKE:
        handleCheckDeepfake(message, sendResponse);
        return true;

      case MessageType.MONITOR_BRAND:
        handleMonitorBrand(message, sendResponse);
        return true;

      // Vulnerability Hunter
      case MessageType.VULN_HUNTER_START:
        handleVulnHunterStart(message, sendResponse);
        return true;

      case MessageType.VULN_HUNTER_GET_DISCOVERIES:
        handleVulnHunterGetDiscoveries(sendResponse);
        return true;

      case MessageType.VULN_HUNTER_ANALYZE:
        handleVulnHunterAnalyze(message, sendResponse);
        return true;

      case MessageType.VULN_HUNTER_CLEAR:
        handleVulnHunterClear(sendResponse);
        return true;

      default:
        console.warn(`${EXTENSION_NAME}: Unknown message type:`, (message as Message).type);
        sendResponse({ error: 'Unknown message type' });
        return false;
    }
  }
);

/**
 * Handle ping messages (health check)
 */
function handlePing(sendResponse: (response: unknown) => void): void {
  sendResponse({ status: 'ok', timestamp: Date.now() });
}

/**
 * Handle claim checking requests
 * Multi-provider verification pipeline:
 * - Runs parallel claim detection across all enabled providers
 * - Verifies claims in parallel using provider-specific web search
 * - Aggregates results from multiple sources
 */
async function handleCheckClaim(
  message: CheckClaimMessage,
  sendResponse: (response: ClaimResultMessage) => void
): Promise<void> {
  try {
    const { text, elementId, platform } = message.payload;

    console.info(
      `${EXTENSION_NAME}: Processing claim check (${platform}):`,
      text.substring(0, 100) + '...'
    );

    // Use the orchestrator to run fact-checking with all enabled providers
    console.info(`${EXTENSION_NAME}: Starting fact-check using orchestrator`);

    // Run fact-check through orchestrator (handles multiple providers, caching, etc.)
    const result = await orchestrator.checkClaim(text, platform);

    // ENHANCED: Check for misinformation campaigns
    const enhancedResult = await enhanceFactCheckWithCampaigns(text, {
      verdict: result.verdict as 'true' | 'false' | 'unknown' | 'no_claim',
      confidence: result.confidence,
      explanation: result.explanation,
    });

    // NEW: Check for phishing and scams
    console.info(`${EXTENSION_NAME}: Checking for phishing/scams...`);
    const phishingResult = await detectPhishingAndScams(text);

    // Record usage (increment daily counter) - only if we got a result
    if (result.verdict !== 'unknown' || result.confidence > 0) {
      await recordDailyUsage();
    }

    console.info(
      `${EXTENSION_NAME}: Fact-check complete - Verdict: ${enhancedResult.verdict} (${enhancedResult.confidence}% confidence, consensus: ${result.consensus.agreeing}/${result.consensus.total})`
    );

    // If misinformation flags detected, log warning
    if (enhancedResult.misinformationFlags) {
      console.warn(
        `${EXTENSION_NAME}: MISINFORMATION DETECTED - ${enhancedResult.misinformationFlags.matchedCampaigns} campaigns, ${enhancedResult.misinformationFlags.unreliableSources.length} unreliable sources`
      );
    }

    // If phishing/scams detected, log critical warning
    if (phishingResult.isPhishing || phishingResult.isSuspicious) {
      console.error(
        `${EXTENSION_NAME}: 🚨 PHISHING/SCAM DETECTED - Severity: ${phishingResult.overallSeverity}, Malicious URLs: ${phishingResult.urlAnalysis.maliciousUrls.length}, Suspicious URLs: ${phishingResult.urlAnalysis.suspiciousUrls.length}`
      );
    }

    // Enhance explanation with phishing warnings
    let finalExplanation = enhancedResult.explanation;
    if (phishingResult.warnings.length > 0) {
      finalExplanation = phishingResult.warnings.join('\n') + '\n\n' + finalExplanation;
    }

    if (phishingResult.recommendations.length > 0) {
      finalExplanation += '\n\n⚠️ SAFETY RECOMMENDATIONS:\n' + phishingResult.recommendations.join('\n');
    }

    // Override verdict if critical phishing detected
    let finalVerdict = enhancedResult.verdict;
    let finalConfidence = enhancedResult.confidence;

    if (phishingResult.overallSeverity === 'critical') {
      finalVerdict = 'false';
      finalConfidence = 99;
      finalExplanation = '🚨 DANGER: PHISHING/SCAM DETECTED 🚨\n\n' + finalExplanation;
    }

    // Map aggregated result to ClaimResultMessage
    sendResponse({
      type: MessageType.CLAIM_RESULT,
      payload: {
        elementId,
        verdict: finalVerdict as Verdict,
        confidence: finalConfidence,
        explanation: finalExplanation,
        sources: result.sources,
        providerResults: result.providerResults?.map((pr) => ({
          providerId: pr.providerId,
          providerName: pr.providerName,
          verdict: pr.verdict,
          confidence: pr.confidence,
          explanation: pr.explanation,
        })) || [],
        consensus: result.consensus,
        disagreement: result.disagreement,
        sourceDiversity: result.sourceDiversity,
      },
    });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error in fact-checking pipeline:`, error);

    // Send error response
    sendResponse({
      type: MessageType.CLAIM_RESULT,
      payload: {
        elementId: message.payload.elementId,
        verdict: 'unknown',
        confidence: 0,
        explanation: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your provider API keys in settings.`,
        sources: [],
      },
    });
  }
}

/**
 * Get settings from storage
 */
async function handleGetSettings(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings = result[STORAGE_KEYS.SETTINGS] || {
      providers: {
        openai: { enabled: false, apiKey: null },
        anthropic: { enabled: false, apiKey: null },
        perplexity: { enabled: false, apiKey: null },
      },
      autoCheckEnabled: true,
      confidenceThreshold: 70,
    };

    sendResponse({ settings });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting settings:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Update settings in storage
 */
async function handleUpdateSettings(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as { payload: Record<string, unknown> };

    // Get current settings
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const currentSettings = result[STORAGE_KEYS.SETTINGS] || {};

    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...payload,
    };

    // Save to storage
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updatedSettings });

    console.info(`${EXTENSION_NAME}: Settings updated`);
    sendResponse({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error updating settings:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle get domain selectors request
 */
async function handleGetDomainSelectors(
  message: GetDomainSelectorsMessage,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    const { domain } = message.payload;
    const selectors = await getSelectorsForDomain(domain);
    sendResponse({ selectors });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting domain selectors:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle get all selectors request
 */
async function handleGetAllSelectors(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const selectors = await getAllSelectors();
    sendResponse({ selectors });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting all selectors:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle update domain selector request
 */
async function handleUpdateDomainSelector(
  message: UpdateDomainSelectorMessage,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    const { domain, selectors } = message.payload;
    await updateDomainSelectors(domain, selectors);
    sendResponse({ success: true });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error updating domain selector:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle add domain selector request
 */
async function handleAddDomainSelector(
  message: AddDomainSelectorMessage,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    const { domain, selectors } = message.payload;
    await addDomainSelector(domain, selectors);
    sendResponse({ success: true });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error adding domain selector:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle remove domain selector request
 */
async function handleRemoveDomainSelector(
  message: RemoveDomainSelectorMessage,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    const { domain } = message.payload;
    await removeDomainSelectorStorage(domain);
    sendResponse({ success: true });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error removing domain selector:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle get selector stats request
 */
async function handleGetSelectorStats(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const stats = await getSelectorStorageStats();
    sendResponse({ stats });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting selector stats:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle cache stats request
 */
async function handleGetCacheStats(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const stats = await getCacheStats();
    sendResponse({ stats });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting cache stats:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle clear cache request
 */
async function handleClearCache(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    await clearFactCheckCache();
    sendResponse({ success: true });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error clearing cache:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle get trial info request
 */
async function handleGetTrialInfo(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const trialInfo = await getTrialInfo();
    sendResponse(trialInfo);
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting trial info:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle get daily limit request
 */
async function handleGetDailyLimit(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const limitInfo = await getDailyLimitInfo();
    sendResponse(limitInfo);
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting daily limit:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle get historical stats request
 */
async function handleGetHistoricalStats(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const stats = await getHistoricalStats();
    const globalStatus = await getGlobalRateLimitStatus('groq');
    sendResponse({ stats, globalStatus });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting historical stats:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle set user email request (for company tracking)
 */
async function handleSetUserEmail(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as { payload: { email: string } };
    const { email } = payload;

    // Extract company domain from email
    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      sendResponse({ error: 'Invalid email format' });
      return;
    }

    const companyDomain = emailParts[1].toLowerCase();

    // Get or create user profile
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER_PROFILE);
    const existingProfile = result[STORAGE_KEYS.USER_PROFILE];

    const now = Date.now();
    const userProfile = {
      email,
      companyDomain,
      firstSeen: existingProfile?.firstSeen || now,
      lastActive: now,
      totalThreatsBlocked: existingProfile?.totalThreatsBlocked || 0,
      totalChecks: existingProfile?.totalChecks || 0,
    };

    await chrome.storage.local.set({ [STORAGE_KEYS.USER_PROFILE]: userProfile });

    // Update company employees list
    await updateCompanyEmployees(companyDomain, userProfile);

    // Update company stats
    await updateCompanyStats(companyDomain);

    console.info(`${EXTENSION_NAME}: User email set: ${email} (${companyDomain})`);
    sendResponse({ success: true, companyDomain });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error setting user email:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle get company stats request
 */
async function handleGetCompanyStats(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    // Get user profile first
    const profileResult = await chrome.storage.local.get(STORAGE_KEYS.USER_PROFILE);
    const userProfile = profileResult[STORAGE_KEYS.USER_PROFILE];

    if (!userProfile || !userProfile.companyDomain) {
      sendResponse({ error: 'No company domain set', stats: null });
      return;
    }

    // Get company stats
    const statsResult = await chrome.storage.local.get(STORAGE_KEYS.COMPANY_STATS);
    const companyStatsMap = statsResult[STORAGE_KEYS.COMPANY_STATS] || {};
    const companyStats = companyStatsMap[userProfile.companyDomain];

    sendResponse({ stats: companyStats || null });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting company stats:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle get company dashboard data request
 */
async function handleGetCompanyDashboardData(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    // Get user profile first
    const profileResult = await chrome.storage.local.get(STORAGE_KEYS.USER_PROFILE);
    const userProfile = profileResult[STORAGE_KEYS.USER_PROFILE];

    if (!userProfile || !userProfile.companyDomain) {
      sendResponse({ error: 'No company domain set' });
      return;
    }

    const companyDomain = userProfile.companyDomain;

    // Get company stats
    const statsResult = await chrome.storage.local.get(STORAGE_KEYS.COMPANY_STATS);
    const companyStatsMap = statsResult[STORAGE_KEYS.COMPANY_STATS] || {};
    const companyStats = companyStatsMap[companyDomain];

    if (!companyStats) {
      sendResponse({ error: 'No company data available' });
      return;
    }

    // Get employee activity
    const employeesResult = await chrome.storage.local.get(STORAGE_KEYS.COMPANY_EMPLOYEES);
    const companyEmployeesMap = employeesResult[STORAGE_KEYS.COMPANY_EMPLOYEES] || {};
    const employees = companyEmployeesMap[companyDomain] || [];

    // Build dashboard data
    const dashboardData = {
      company: companyStats,
      recentThreats: [], // TODO: Implement threat tracking
      employeeActivity: employees.map((emp: { email: string; totalChecks: number; totalThreatsBlocked: number; lastActive: number }) => ({
        email: anonymizeEmail(emp.email),
        checksToday: 0, // TODO: Track daily checks per user
        threatsBlocked: emp.totalThreatsBlocked,
        lastActive: emp.lastActive,
      })),
      upgradeEligible: companyStats.totalEmployees >= 10,
      showEnterprisePromo: companyStats.totalEmployees >= 50,
    };

    sendResponse({ data: dashboardData });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting company dashboard data:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle track threat blocked request
 */
async function handleTrackThreatBlocked(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as {
      payload: {
        threatType: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        description: string;
      };
    };

    // Get user profile
    const profileResult = await chrome.storage.local.get(STORAGE_KEYS.USER_PROFILE);
    const userProfile = profileResult[STORAGE_KEYS.USER_PROFILE];

    if (!userProfile) {
      sendResponse({ error: 'No user profile set' });
      return;
    }

    // Update user profile threat count
    userProfile.totalThreatsBlocked = (userProfile.totalThreatsBlocked || 0) + 1;
    await chrome.storage.local.set({ [STORAGE_KEYS.USER_PROFILE]: userProfile });

    // Update company stats
    if (userProfile.companyDomain) {
      await updateCompanyStats(userProfile.companyDomain);
    }

    console.info(`${EXTENSION_NAME}: Threat blocked tracked: ${payload.threatType} (${payload.severity})`);
    sendResponse({ success: true });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error tracking threat:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Update company employees list
 */
async function updateCompanyEmployees(companyDomain: string, userProfile: { email: string; companyDomain: string; firstSeen: number; lastActive: number; totalThreatsBlocked: number; totalChecks: number }): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.COMPANY_EMPLOYEES);
  const companyEmployeesMap = result[STORAGE_KEYS.COMPANY_EMPLOYEES] || {};

  const employees = companyEmployeesMap[companyDomain] || [];

  // Check if employee already exists
  const existingIndex = employees.findIndex((emp: { email: string }) => emp.email === userProfile.email);

  if (existingIndex >= 0) {
    // Update existing employee
    employees[existingIndex] = userProfile;
  } else {
    // Add new employee
    employees.push(userProfile);
  }

  companyEmployeesMap[companyDomain] = employees;

  await chrome.storage.local.set({ [STORAGE_KEYS.COMPANY_EMPLOYEES]: companyEmployeesMap });
}

/**
 * Update company stats
 */
async function updateCompanyStats(companyDomain: string): Promise<void> {
  const employeesResult = await chrome.storage.local.get(STORAGE_KEYS.COMPANY_EMPLOYEES);
  const companyEmployeesMap = employeesResult[STORAGE_KEYS.COMPANY_EMPLOYEES] || {};
  const employees = companyEmployeesMap[companyDomain] || [];

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Calculate aggregate stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((emp: { lastActive: number }) => emp.lastActive > thirtyDaysAgo).length;
  const totalThreatsBlocked = employees.reduce((sum: number, emp: { totalThreatsBlocked: number }) => sum + emp.totalThreatsBlocked, 0);
  const totalChecks = employees.reduce((sum: number, emp: { totalChecks: number }) => sum + emp.totalChecks, 0);
  const firstSeen = Math.min(...employees.map((emp: { firstSeen: number }) => emp.firstSeen));
  const lastActivity = Math.max(...employees.map((emp: { lastActive: number }) => emp.lastActive));

  // Calculate risk score (0-100, lower is better)
  // Risk factors: low checks per employee, high threat detection rate
  const checksPerEmployee = totalEmployees > 0 ? totalChecks / totalEmployees : 0;
  const threatRate = totalChecks > 0 ? totalThreatsBlocked / totalChecks : 0;
  const riskScore = Math.min(100, Math.round((threatRate * 100 + (checksPerEmployee < 10 ? 30 : 0))));

  const companyStats = {
    domain: companyDomain,
    totalEmployees,
    activeEmployees,
    totalThreatsBlocked,
    totalChecks,
    firstSeen,
    lastActivity,
    topThreats: [], // TODO: Implement threat type tracking
    riskScore,
  };

  // Save company stats
  const statsResult = await chrome.storage.local.get(STORAGE_KEYS.COMPANY_STATS);
  const companyStatsMap = statsResult[STORAGE_KEYS.COMPANY_STATS] || {};
  companyStatsMap[companyDomain] = companyStats;

  await chrome.storage.local.set({ [STORAGE_KEYS.COMPANY_STATS]: companyStatsMap });

  console.info(`${EXTENSION_NAME}: Company stats updated for ${companyDomain}: ${totalEmployees} employees, ${totalThreatsBlocked} threats blocked`);
}

/**
 * Anonymize email for privacy (e.g., "john.doe@acme.com" -> "j***@acme.com")
 */
function anonymizeEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;

  const firstChar = username.charAt(0);
  const stars = '***';
  return `${firstChar}${stars}@${domain}`;
}

// ============================================================================
// Threat Intelligence Handlers
// ============================================================================

/**
 * Handle URL threat analysis request
 */
async function handleCheckURL(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as { payload: { url: string } };
    const result = await analyzeURL(payload.url);
    sendResponse({ result });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error checking URL:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle email breach check request
 */
async function handleCheckEmailBreach(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as { payload: { email: string } };
    const result = await checkEmailBreach(payload.email);
    sendResponse({ result });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error checking email breach:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle domain squatting detection request
 */
async function handleCheckDomainSquatting(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as { payload: { domain: string } };
    const result = await detectDomainSquatting(payload.domain);
    sendResponse({ result });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error checking domain squatting:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle threat report generation request
 */
async function handleGenerateThreatReport(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as { payload: { domain: string; email?: string; tier: 'free' | 'basic' | 'professional' | 'enterprise' } };
    const report = await generateThreatReport({
      domain: payload.domain,
      email: payload.email,
      tier: payload.tier || 'free',
    });
    sendResponse({ report });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error generating threat report:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle deepfake detection request
 */
async function handleCheckDeepfake(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as { payload: { mediaUrl: string; mediaType: 'image' | 'video' | 'audio' } };
    const result = await detectDeepfake(payload.mediaUrl, payload.mediaType);
    sendResponse({ result });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error checking deepfake:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle brand monitoring request
 */
async function handleMonitorBrand(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as { payload: { brandName: string; officialDomains: string[] } };
    const result = await monitorBrand(payload.brandName, payload.officialDomains);
    sendResponse({ result });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error monitoring brand:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// ============================================================================
// Vulnerability Hunter Handlers
// ============================================================================

/**
 * Handle vulnerability hunter start request
 */
async function handleVulnHunterStart(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as { payload: { twitter?: { bearerToken: string; enabled: boolean }; github?: { token: string; enabled: boolean } } };

    console.info(`${EXTENSION_NAME}: Starting vulnerability hunter...`);
    const discoveries = await vulnHunter.startMonitoring(payload);

    sendResponse({ discoveries });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error starting vulnerability hunter:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle get discoveries request
 */
function handleVulnHunterGetDiscoveries(sendResponse: (response: unknown) => void): void {
  try {
    const discoveries = vulnHunter.getDiscoveries();
    sendResponse({ discoveries });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error getting discoveries:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle analyze discovery request
 */
async function handleVulnHunterAnalyze(message: Message, sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const { payload } = message as { payload: { discoveryId: string; githubToken: string } };

    console.info(`${EXTENSION_NAME}: Analyzing discovery ${payload.discoveryId}...`);
    const discovery = await vulnHunter.analyzeDiscovery(payload.discoveryId, payload.githubToken);

    sendResponse({ discovery });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error analyzing discovery:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Handle clear discoveries request
 */
function handleVulnHunterClear(sendResponse: (response: unknown) => void): void {
  try {
    vulnHunter.clearDiscoveries();
    sendResponse({ success: true });
  } catch (error) {
    console.error(`${EXTENSION_NAME}: Error clearing discoveries:`, error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
