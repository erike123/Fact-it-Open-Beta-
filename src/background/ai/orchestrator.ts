/**
 * Fact-check orchestrator
 * Coordinates parallel execution across multiple AI providers and aggregates results
 */

import { EXTENSION_NAME } from '@/shared/constants';
import { STORAGE_KEYS } from '@/shared/types';
import { providerRegistry, ProviderId } from './providers/registry';
import { AggregatedResult, ProviderResult } from './providers/types';
import { getCachedResult, setCachedResult } from '@/background/cache/fact-check-cache';
import { analyzeSourceDiversity } from './source-diversity';
import { trackHistoricalCheck } from '@/background/tracking/historical-tracker';
import {
  canMakeGlobalRequest,
  incrementGlobalRequestCount,
  getGlobalLimitErrorMessage,
} from '@/background/rate-limiting/global-rate-limiter';

export class FactCheckOrchestrator {
  /**
   * Get enabled providers from settings
   * @returns Array of enabled provider IDs
   */
  private async getEnabledProviders(): Promise<ProviderId[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings = result[STORAGE_KEYS.SETTINGS];

    if (!settings?.providers) {
      console.warn(`${EXTENSION_NAME}: No provider settings found`);
      return [];
    }

    const enabledProviders: ProviderId[] = [];
    for (const [providerId, config] of Object.entries(settings.providers)) {
      const providerConfig = config as { enabled: boolean; apiKey: string | null };
      if (providerConfig.enabled && providerConfig.apiKey) {
        enabledProviders.push(providerId as ProviderId);
      }
    }

    console.info(`${EXTENSION_NAME}: Enabled providers: ${enabledProviders.join(', ')}`);
    return enabledProviders;
  }

  /**
   * Get API key for a specific provider
   * @param providerId - Provider ID
   * @returns API key or null if not configured
   */
  private async getApiKey(providerId: ProviderId): Promise<string | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings = result[STORAGE_KEYS.SETTINGS];

    return settings?.providers?.[providerId]?.apiKey || null;
  }

  /**
   * Aggregate results from multiple providers
   * @param providerResults - Array of provider results
   * @returns Aggregated result
   */
  private aggregateResults(providerResults: ProviderResult[]): AggregatedResult {
    // Filter out failed providers
    const successfulResults = providerResults.filter((r) => !r.error);

    if (successfulResults.length === 0) {
      // All providers failed
      return {
        verdict: 'unknown',
        confidence: 0,
        explanation: 'All fact-checking providers failed. Please try again later.',
        sources: [],
        providerResults,
        consensus: {
          total: providerResults.length,
          agreeing: 0,
          percentageAgreement: 0,
        },
      };
    }

    // Calculate verdict by majority vote (weighted by confidence)
    const verdictWeights: Record<string, number> = {};
    for (const result of successfulResults) {
      verdictWeights[result.verdict] = (verdictWeights[result.verdict] || 0) + result.confidence;
    }

    // Determine final verdict (highest weighted vote)
    const finalVerdict = Object.entries(verdictWeights).reduce((a, b) =>
      b[1] > a[1] ? b : a
    )[0] as 'true' | 'false' | 'unknown';

    // Calculate weighted average confidence for final verdict
    const verdictResults = successfulResults.filter((r) => r.verdict === finalVerdict);
    const totalConfidence = verdictResults.reduce((sum, r) => sum + r.confidence, 0);
    const avgConfidence = Math.round(totalConfidence / verdictResults.length);

    // Count consensus (providers that agree with final verdict)
    const agreeing = verdictResults.length;
    const percentageAgreement = Math.round((agreeing / successfulResults.length) * 100);

    // Detect disagreements
    const disagreementInfo = this.detectDisagreement(successfulResults);

    // Combine explanations
    const explanation = this.combineExplanations(verdictResults, disagreementInfo);

    // Deduplicate and aggregate sources
    const sources = this.aggregateSources(successfulResults);

    // Analyze source diversity
    const sourceDiversity = analyzeSourceDiversity(sources);

    return {
      verdict: finalVerdict,
      confidence: avgConfidence,
      explanation,
      sources,
      providerResults,
      consensus: {
        total: successfulResults.length,
        agreeing,
        percentageAgreement,
      },
      disagreement: disagreementInfo,
      sourceDiversity,
    };
  }

  /**
   * Detect if providers disagree on verdict
   * @param results - Array of successful provider results
   * @returns Disagreement information
   */
  private detectDisagreement(results: ProviderResult[]): {
    hasDisagreement: boolean;
    conflictingVerdicts: Array<{
      verdict: 'true' | 'false' | 'unknown';
      providers: string[];
      confidence: number;
    }>;
  } {
    // Group providers by their verdict
    const verdictGroups = new Map<
      'true' | 'false' | 'unknown',
      { providers: string[]; totalConfidence: number; count: number }
    >();

    for (const result of results) {
      if (!verdictGroups.has(result.verdict)) {
        verdictGroups.set(result.verdict, { providers: [], totalConfidence: 0, count: 0 });
      }
      const group = verdictGroups.get(result.verdict)!;
      group.providers.push(result.providerName);
      group.totalConfidence += result.confidence;
      group.count++;
    }

    // Check if there's disagreement (more than one verdict)
    const hasDisagreement = verdictGroups.size > 1;

    // Create conflicting verdicts array
    const conflictingVerdicts = Array.from(verdictGroups.entries()).map(
      ([verdict, group]) => ({
        verdict,
        providers: group.providers,
        confidence: Math.round(group.totalConfidence / group.count),
      })
    );

    // Sort by number of providers (descending)
    conflictingVerdicts.sort((a, b) => b.providers.length - a.providers.length);

    return {
      hasDisagreement,
      conflictingVerdicts,
    };
  }

  /**
   * Combine explanations from multiple providers
   * @param results - Array of provider results with same verdict
   * @param disagreementInfo - Information about disagreements
   * @returns Combined explanation
   */
  private combineExplanations(
    results: ProviderResult[],
    disagreementInfo?: {
      hasDisagreement: boolean;
      conflictingVerdicts: Array<{
        verdict: 'true' | 'false' | 'unknown';
        providers: string[];
        confidence: number;
      }>;
    }
  ): string {
    if (results.length === 1) {
      // Single provider
      if (disagreementInfo?.hasDisagreement) {
        return `${results[0].explanation} ⚠️ Note: Other AI providers have conflicting assessments.`;
      }
      return results[0].explanation;
    }

    // Multiple providers agreeing
    const firstExplanation = results[0].explanation;
    const providerNames = results.map((r) => r.providerName).join(', ');

    let explanation = `${firstExplanation}`;

    // Add consensus note
    if (results.length >= 2) {
      explanation += ` ✓ Consensus: ${results.length} AI${results.length > 1 ? 's' : ''} agree (${providerNames}).`;
    }

    // Add disagreement warning if applicable
    if (disagreementInfo?.hasDisagreement && disagreementInfo.conflictingVerdicts.length > 1) {
      const otherVerdicts = disagreementInfo.conflictingVerdicts
        .slice(1)
        .map((v) => `${v.providers.join(', ')}: ${v.verdict.toUpperCase()}`)
        .join('; ');
      explanation += ` ⚠️ Disagreement detected: ${otherVerdicts}. Multiple perspectives exist.`;
    }

    return explanation;
  }

  /**
   * Aggregate and deduplicate sources from multiple providers
   * @param results - Array of provider results
   * @returns Deduplicated sources with provider attribution
   */
  private aggregateSources(
    results: ProviderResult[]
  ): Array<{ title: string; url: string; provider: string }> {
    const sourceMap = new Map<string, { title: string; url: string; providers: string[] }>();

    for (const result of results) {
      for (const source of result.sources) {
        const key = source.url.toLowerCase();
        if (sourceMap.has(key)) {
          // Source already exists, add provider to list
          sourceMap.get(key)!.providers.push(result.providerName);
        } else {
          // New source
          sourceMap.set(key, {
            title: source.title,
            url: source.url,
            providers: [result.providerName],
          });
        }
      }
    }

    // Convert to array and format
    return Array.from(sourceMap.values()).map(({ title, url, providers }) => ({
      title,
      url,
      provider: providers.join(', '),
    }));
  }

  /**
   * Check a claim across multiple AI providers in parallel
   * @param text - Text to fact-check
   * @param platform - Platform where the check was performed (for tracking)
   * @returns Aggregated result from all enabled providers
   */
  async checkClaim(text: string, platform: 'twitter' | 'linkedin' | 'facebook' | 'article' = 'article'): Promise<AggregatedResult> {
    // Check cache first
    const cachedResult = await getCachedResult(text);
    if (cachedResult) {
      console.info(
        `${EXTENSION_NAME}: Returning cached result (verdict: ${cachedResult.verdict}, confidence: ${cachedResult.confidence}%)`
      );
      return cachedResult;
    }

    const enabledProviders = await this.getEnabledProviders();

    if (enabledProviders.length === 0) {
      console.warn(`${EXTENSION_NAME}: No providers enabled`);
      return {
        verdict: 'unknown',
        confidence: 0,
        explanation: 'No AI providers configured. Please configure at least one provider in settings.',
        sources: [],
        providerResults: [],
        consensus: {
          total: 0,
          agreeing: 0,
          percentageAgreement: 0,
        },
      };
    }

    // Check global rate limit (for embedded API keys only)
    // Only check for providers using embedded keys (groq-free in this case)
    let usingEmbeddedKey = false;
    for (const providerId of enabledProviders) {
      if (providerId === 'groq') {
        const apiKey = await this.getApiKey(providerId);
        if (apiKey?.startsWith('gsk_')) {
          usingEmbeddedKey = true;
          break;
        }
      }
    }

    if (usingEmbeddedKey) {
      const globalLimit = await canMakeGlobalRequest('groq');
      if (!globalLimit.allowed) {
        console.warn(
          `${EXTENSION_NAME}: Global rate limit reached (${globalLimit.remaining}/${globalLimit.total})`
        );
        return {
          verdict: 'unknown',
          confidence: 0,
          explanation: getGlobalLimitErrorMessage(globalLimit.resetTime),
          sources: [],
          providerResults: [],
          consensus: {
            total: 0,
            agreeing: 0,
            percentageAgreement: 0,
          },
        };
      }

      // Warn user if approaching limit (>80%)
      if (globalLimit.warningThreshold) {
        console.warn(
          `${EXTENSION_NAME}: Global rate limit warning - ${globalLimit.remaining} requests remaining today`
        );
      }
    }

    console.info(
      `${EXTENSION_NAME}: Starting fact-check with ${enabledProviders.length} provider(s)`
    );

    // Stage 1: Parallel claim detection across all enabled providers
    console.info(`${EXTENSION_NAME}: Stage 1 - Running claim detection in parallel...`);

    const detectionResults = await Promise.allSettled(
      enabledProviders.map(async (providerId) => {
        const provider = providerRegistry[providerId];
        const apiKey = await this.getApiKey(providerId);

        if (!apiKey) {
          throw new Error(`No API key configured for ${provider.displayName}`);
        }

        return {
          providerId,
          result: await provider.detectClaims(text, apiKey),
        };
      })
    );

    // Check if any provider found claims
    const providersWithClaims = detectionResults
      .filter((r) => r.status === 'fulfilled' && r.value.result.hasClaim)
      .map((r) => (r as PromiseFulfilledResult<{ providerId: ProviderId; result: any }>).value);

    if (providersWithClaims.length === 0) {
      console.info(`${EXTENSION_NAME}: No claims detected by any provider`);
      const fulfilledCount = detectionResults.filter((r) => r.status === 'fulfilled').length;
      return {
        verdict: 'no_claim',
        confidence: 100,
        explanation: 'No verifiable factual claims detected in this text.',
        sources: [],
        providerResults: [],
        consensus: {
          total: fulfilledCount,
          agreeing: fulfilledCount,
          percentageAgreement: 100,
        },
      };
    }

    console.info(
      `${EXTENSION_NAME}: ${providersWithClaims.length} provider(s) found claims, proceeding to Stage 2...`
    );

    // Stage 2: Parallel verification for providers that found claims
    console.info(`${EXTENSION_NAME}: Stage 2 - Running verification in parallel...`);

    const verificationResults = await Promise.allSettled(
      providersWithClaims.map(async ({ providerId, result: detectionResult }) => {
        const provider = providerRegistry[providerId];
        const apiKey = await this.getApiKey(providerId);

        if (!apiKey) {
          throw new Error(`No API key configured for ${provider.displayName}`);
        }

        // Use the first claim for verification
        const claim = detectionResult.claims[0];
        const verificationResult = await provider.verifyClaim(claim, apiKey);

        return {
          providerId,
          providerName: provider.displayName,
          ...verificationResult,
        } as ProviderResult;
      })
    );

    // Convert PromiseSettledResult to ProviderResult
    const providerResults: ProviderResult[] = verificationResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Provider failed
        const providerId = providersWithClaims[index].providerId;
        const provider = providerRegistry[providerId];
        return {
          providerId,
          providerName: provider.displayName,
          verdict: 'unknown',
          confidence: 0,
          explanation: 'Verification failed',
          sources: [],
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        };
      }
    });

    console.info(`${EXTENSION_NAME}: All providers completed, aggregating results...`);

    // Aggregate results
    const aggregatedResult = this.aggregateResults(providerResults);

    console.info(
      `${EXTENSION_NAME}: Final verdict: ${aggregatedResult.verdict} (confidence: ${aggregatedResult.confidence}%, consensus: ${aggregatedResult.consensus.agreeing}/${aggregatedResult.consensus.total})`
    );

    // Track historical data (don't await to avoid slowing down response)
    if (aggregatedResult.verdict !== 'no_claim') {
      trackHistoricalCheck(
        text,
        aggregatedResult.verdict,
        aggregatedResult.confidence,
        platform,
        aggregatedResult.disagreement?.hasDisagreement || false
      ).catch((err) => console.error('Error tracking historical check:', err));
    }

    // Increment global rate limit counter for embedded keys
    if (usingEmbeddedKey) {
      incrementGlobalRequestCount('groq').catch((err) =>
        console.error('Error incrementing global request count:', err)
      );
    }

    // Cache the result for future lookups
    await setCachedResult(text, aggregatedResult);

    return aggregatedResult;
  }
}

// Singleton instance
export const orchestrator = new FactCheckOrchestrator();
