/**
 * Source Diversity Analyzer
 * Categorizes sources and provides diversity metrics
 */

import type { SourceCategory, SourceDiversity, CategorizedSource } from '@/shared/types';

// Domain patterns for categorization
const SOURCE_PATTERNS: Record<SourceCategory, RegExp[]> = {
  news_outlet: [
    /\b(news|times|post|herald|tribune|journal|gazette|telegraph|guardian|bbc|cnn|reuters|ap|bloomberg|wsj)\b/i,
    /\.(news|press|media)\./i,
  ],
  academic: [
    /\.(edu|ac\.uk|ac\.\w+)\//i,
    /\b(journal|scholar|research|university|college|academia|pubmed|arxiv|doi)\b/i,
    /\bpmc\d+\b/i, // PubMed Central IDs
  ],
  government: [
    /\.(gov|mil|gc\.ca)\//i,
    /\b(senate|congress|parliament|whitehouse|state\.gov|legislation)\b/i,
  ],
  fact_checker: [
    /\b(factcheck|snopes|politifact|truthorfiction|leadstories|fullfact)\b/i,
  ],
  social_media: [
    /\b(twitter|facebook|instagram|linkedin|reddit|youtube|tiktok|x\.com)\b/i,
  ],
  encyclopedia: [
    /\b(wikipedia|britannica|encyclopedia|wikimedia)\b/i,
  ],
  other: [], // Catch-all
};

// Known high-quality domains per category
const TRUSTED_DOMAINS: Record<SourceCategory, Set<string>> = {
  news_outlet: new Set([
    'nytimes.com',
    'washingtonpost.com',
    'theguardian.com',
    'bbc.com',
    'reuters.com',
    'apnews.com',
    'bloomberg.com',
    'wsj.com',
    'npr.org',
    'economist.com',
  ]),
  academic: new Set([
    'scholar.google.com',
    'pubmed.ncbi.nlm.nih.gov',
    'arxiv.org',
    'researchgate.net',
    'sciencedirect.com',
    'nature.com',
    'science.org',
  ]),
  government: new Set([
    'whitehouse.gov',
    'congress.gov',
    'state.gov',
    'cdc.gov',
    'fda.gov',
    'nih.gov',
    'nasa.gov',
  ]),
  fact_checker: new Set([
    'factcheck.org',
    'snopes.com',
    'politifact.com',
    'fullfact.org',
    'factcheckni.org',
  ]),
  social_media: new Set(['twitter.com', 'x.com', 'facebook.com', 'linkedin.com', 'reddit.com']),
  encyclopedia: new Set(['wikipedia.org', 'britannica.com']),
  other: new Set([]),
};

/**
 * Categorize a source based on its URL and title
 */
export function categorizeSource(url: string, title: string): SourceCategory {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  const combined = `${urlLower} ${titleLower}`;

  // Check trusted domains first for faster categorization
  for (const [category, domains] of Object.entries(TRUSTED_DOMAINS)) {
    for (const domain of domains) {
      if (urlLower.includes(domain)) {
        return category as SourceCategory;
      }
    }
  }

  // Check patterns
  for (const [category, patterns] of Object.entries(SOURCE_PATTERNS)) {
    if (category === 'other') continue; // Skip catch-all

    for (const pattern of patterns) {
      if (pattern.test(combined)) {
        return category as SourceCategory;
      }
    }
  }

  return 'other';
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Analyze source diversity from a list of sources
 */
export function analyzeSourceDiversity(
  sources: Array<{ title: string; url: string; provider: string }>
): SourceDiversity {
  const categorizedSources: CategorizedSource[] = sources.map((source) => {
    const category = categorizeSource(source.url, source.title);
    const domain = extractDomain(source.url);

    return {
      ...source,
      category,
      domain,
    };
  });

  // Count categories
  const categories: Record<SourceCategory, number> = {
    news_outlet: 0,
    academic: 0,
    government: 0,
    fact_checker: 0,
    social_media: 0,
    encyclopedia: 0,
    other: 0,
  };

  const uniqueDomains = new Set<string>();

  for (const source of categorizedSources) {
    categories[source.category]++;
    uniqueDomains.add(source.domain);
  }

  return {
    categories,
    uniqueDomains: uniqueDomains.size,
    totalSources: sources.length,
    categorizedSources,
  };
}

/**
 * Generate human-readable diversity summary
 */
export function generateDiversitySummary(diversity: SourceDiversity): string {
  const parts: string[] = [];
  const { categories } = diversity;

  if (categories.news_outlet > 0) {
    parts.push(`${categories.news_outlet} news outlet${categories.news_outlet > 1 ? 's' : ''}`);
  }
  if (categories.academic > 0) {
    parts.push(
      `${categories.academic} academic source${categories.academic > 1 ? 's' : ''}`
    );
  }
  if (categories.government > 0) {
    parts.push(
      `${categories.government} government source${categories.government > 1 ? 's' : ''}`
    );
  }
  if (categories.fact_checker > 0) {
    parts.push(
      `${categories.fact_checker} fact-checker${categories.fact_checker > 1 ? 's' : ''}`
    );
  }

  if (parts.length === 0) {
    return `${diversity.totalSources} source${diversity.totalSources > 1 ? 's' : ''}`;
  }

  return parts.join(', ');
}
