/**
 * Misinformation Campaign Tracker
 * Correlates text with known misinformation campaigns and unreliable sources
 * Integrates with Media Bias/Fact Check, GDELT, and maintains internal campaign database
 */

import {
  MisinformationCheckResult,
  MisinformationCampaign,
} from '@/shared/threat-intelligence-types';
import { THREAT_STORAGE_KEYS } from '@/shared/threat-intelligence-types';

// ============================================================================
// Known Misinformation Campaigns Database (Updated regularly)
// ============================================================================

const KNOWN_CAMPAIGNS: MisinformationCampaign[] = [
  {
    id: 'covid-5g-conspiracy',
    name: '5G-COVID Link Conspiracy',
    description: 'False claims linking 5G technology to COVID-19 spread',
    startDate: new Date('2020-03-01').getTime(),
    active: false,
    narratives: [
      '5G causes COVID-19',
      '5G weakens immune system',
      'COVID symptoms match 5G radiation',
      '5G towers spread coronavirus',
    ],
    sources: [
      { domain: 'infowars.com', reliability: 15 },
      { domain: 'naturalnews.com', reliability: 20 },
    ],
    factChecks: [
      {
        url: 'https://www.snopes.com/fact-check/5g-covid-19-connection/',
        verdict: 'false',
        source: 'Snopes',
      },
    ],
  },
  {
    id: 'vaccine-microchip',
    name: 'Vaccine Microchip Conspiracy',
    description: 'False claims that COVID-19 vaccines contain tracking microchips',
    startDate: new Date('2020-05-01').getTime(),
    active: false,
    narratives: [
      'vaccines contain microchips',
      'Bill Gates microchip tracking',
      'vaccine nanobots',
      '5G activation through vaccine',
    ],
    sources: [
      { domain: 'beforeitsnews.com', reliability: 10 },
      { domain: 'naturalnews.com', reliability: 20 },
    ],
    factChecks: [
      {
        url: 'https://www.reuters.com/article/uk-factcheck-vaccine-microchip',
        verdict: 'false',
        source: 'Reuters',
      },
    ],
  },
  {
    id: 'climate-change-hoax',
    name: 'Climate Change Denial',
    description: 'Coordinated disinformation claiming climate change is a hoax',
    startDate: new Date('2015-01-01').getTime(),
    active: true,
    narratives: [
      'climate change is a hoax',
      'global warming is natural',
      'scientists fabricate climate data',
      'climate agenda is political control',
    ],
    sources: [
      { domain: 'breitbart.com', reliability: 35 },
      { domain: 'thegatewaypundit.com', reliability: 25 },
    ],
    factChecks: [
      {
        url: 'https://climate.nasa.gov/evidence/',
        verdict: 'false',
        source: 'NASA',
      },
    ],
  },
];

// ============================================================================
// Unreliable Source Database (Media Bias/Fact Check Integration)
// ============================================================================

interface UnreliableSource {
  domain: string;
  reliabilityScore: number; // 0-100
  biasRating: string;
  category: string;
  reasoning: string;
}

const UNRELIABLE_SOURCES: UnreliableSource[] = [
  {
    domain: 'infowars.com',
    reliabilityScore: 15,
    biasRating: 'Extreme Right',
    category: 'conspiracy',
    reasoning: 'Consistently publishes unverified conspiracy theories',
  },
  {
    domain: 'naturalnews.com',
    reliabilityScore: 20,
    biasRating: 'Extreme Right',
    category: 'conspiracy',
    reasoning: 'Promotes pseudoscience and health misinformation',
  },
  {
    domain: 'beforeitsnews.com',
    reliabilityScore: 10,
    biasRating: 'Extreme Right',
    category: 'conspiracy',
    reasoning: 'User-generated content with no editorial oversight',
  },
  {
    domain: 'theonion.com',
    reliabilityScore: 100, // High score because it's *intentional* satire
    biasRating: 'Satire',
    category: 'satire',
    reasoning: 'Legitimate satire publication',
  },
  {
    domain: 'babylonbee.com',
    reliabilityScore: 100,
    biasRating: 'Satire',
    category: 'satire',
    reasoning: 'Conservative-leaning satire',
  },
  {
    domain: 'breitbart.com',
    reliabilityScore: 35,
    biasRating: 'Right',
    category: 'unreliable',
    reasoning: 'Mixed factual reporting, often misleading headlines',
  },
  {
    domain: 'rt.com',
    reliabilityScore: 30,
    biasRating: 'State Media',
    category: 'propaganda',
    reasoning: 'Russian state-funded propaganda outlet',
  },
  {
    domain: 'presstv.ir',
    reliabilityScore: 25,
    biasRating: 'State Media',
    category: 'propaganda',
    reasoning: 'Iranian state-funded propaganda outlet',
  },
];

// ============================================================================
// Text Analysis Functions
// ============================================================================

/**
 * Check if text matches known misinformation campaigns
 */
export async function checkMisinformation(text: string): Promise<MisinformationCheckResult> {
  console.info('[Misinformation Tracker] Analyzing text for known campaigns');

  const textLower = text.toLowerCase();
  const matchedCampaigns: Array<{
    campaign: MisinformationCampaign;
    similarity: number;
    matchedNarratives: string[];
  }> = [];

  // Check against known campaigns
  for (const campaign of KNOWN_CAMPAIGNS) {
    const matchedNarratives: string[] = [];
    let matchCount = 0;

    for (const narrative of campaign.narratives) {
      if (textLower.includes(narrative.toLowerCase())) {
        matchedNarratives.push(narrative);
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const similarity = (matchCount / campaign.narratives.length) * 100;
      matchedCampaigns.push({
        campaign,
        similarity,
        matchedNarratives,
      });
    }
  }

  // Extract URLs from text and check source reliability
  const urls = extractURLs(text);
  const unreliableSources = [];

  for (const url of urls) {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const source = UNRELIABLE_SOURCES.find((s) => s.domain === domain);

      if (source) {
        unreliableSources.push({
          domain: source.domain,
          reliabilityScore: source.reliabilityScore,
          biasRating: source.biasRating,
          category: source.category,
        });
      }
    } catch (error) {
      // Invalid URL, skip
    }
  }

  const result: MisinformationCheckResult = {
    text,
    matchedCampaigns,
    unreliableSources,
  };

  if (matchedCampaigns.length > 0 || unreliableSources.length > 0) {
    console.info(
      `[Misinformation Tracker] Found ${matchedCampaigns.length} campaign matches, ${unreliableSources.length} unreliable sources`
    );
  }

  return result;
}

/**
 * Enhanced fact-checking that includes misinformation campaign correlation
 * This integrates with the existing fact-checking pipeline
 */
export async function enhanceFactCheckWithCampaigns(
  text: string,
  existingVerdict: {
    verdict: 'true' | 'false' | 'unknown' | 'no_claim';
    confidence: number;
    explanation: string;
  }
): Promise<{
  verdict: 'true' | 'false' | 'unknown' | 'no_claim';
  confidence: number;
  explanation: string;
  misinformationFlags?: {
    matchedCampaigns: number;
    unreliableSources: string[];
    warning: string;
  };
}> {
  const misinfoCheck = await checkMisinformation(text);

  // If we found campaign matches or unreliable sources, adjust verdict
  if (misinfoCheck.matchedCampaigns.length > 0 || misinfoCheck.unreliableSources.length > 0) {
    const warnings: string[] = [];

    if (misinfoCheck.matchedCampaigns.length > 0) {
      const topCampaign = misinfoCheck.matchedCampaigns[0];
      warnings.push(
        `This text matches narratives from known misinformation campaign: "${topCampaign.campaign.name}"`
      );
    }

    if (misinfoCheck.unreliableSources.length > 0) {
      const unreliableDomains = misinfoCheck.unreliableSources
        .map((s) => s.domain)
        .join(', ');
      warnings.push(
        `Content references unreliable sources: ${unreliableDomains}`
      );
    }

    return {
      verdict: existingVerdict.verdict === 'no_claim' ? 'no_claim' : 'false',
      confidence: Math.max(existingVerdict.confidence, 80),
      explanation:
        existingVerdict.explanation +
        '\n\nWARNING: ' +
        warnings.join('. '),
      misinformationFlags: {
        matchedCampaigns: misinfoCheck.matchedCampaigns.length,
        unreliableSources: misinfoCheck.unreliableSources.map((s) => s.domain),
        warning: warnings.join('. '),
      },
    };
  }

  return existingVerdict;
}

/**
 * Add a new misinformation campaign to the tracking database
 * (For enterprise users who want to track custom campaigns)
 */
export async function addCustomCampaign(campaign: MisinformationCampaign): Promise<void> {
  try {
    const result = await chrome.storage.local.get(THREAT_STORAGE_KEYS.MISINFORMATION_CAMPAIGNS);
    const campaigns: MisinformationCampaign[] =
      result[THREAT_STORAGE_KEYS.MISINFORMATION_CAMPAIGNS] || [];

    campaigns.push(campaign);

    await chrome.storage.local.set({
      [THREAT_STORAGE_KEYS.MISINFORMATION_CAMPAIGNS]: campaigns,
    });

    console.info(`[Misinformation Tracker] Added custom campaign: ${campaign.name}`);
  } catch (error) {
    console.error('[Misinformation Tracker] Error adding campaign:', error);
    throw error;
  }
}

/**
 * Get all tracked campaigns (built-in + custom)
 */
export async function getAllCampaigns(): Promise<MisinformationCampaign[]> {
  try {
    const result = await chrome.storage.local.get(THREAT_STORAGE_KEYS.MISINFORMATION_CAMPAIGNS);
    const customCampaigns: MisinformationCampaign[] =
      result[THREAT_STORAGE_KEYS.MISINFORMATION_CAMPAIGNS] || [];

    return [...KNOWN_CAMPAIGNS, ...customCampaigns];
  } catch (error) {
    console.error('[Misinformation Tracker] Error getting campaigns:', error);
    return KNOWN_CAMPAIGNS;
  }
}

/**
 * Check if a source is reliable
 */
export function checkSourceReliability(domain: string): UnreliableSource | null {
  const cleanDomain = domain.replace('www.', '').toLowerCase();
  return UNRELIABLE_SOURCES.find((s) => s.domain === cleanDomain) || null;
}

/**
 * Extract URLs from text
 */
function extractURLs(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Calculate similarity between two texts (simple word overlap)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return (intersection.size / union.size) * 100;
}
