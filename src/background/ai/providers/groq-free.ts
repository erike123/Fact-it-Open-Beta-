/**
 * Groq Free Provider with Google Search Integration
 * 100% FREE fact-checking using Groq AI + Google Custom Search
 */

import type { AIProvider, ClaimDetectionResult, VerificationVerdictResult } from './types';

export class GroqFreeProvider implements AIProvider {
  id = 'groq-free';
  displayName = 'Groq Free (with Google Search)';

  private groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
  private googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
  private googleSearchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || '';

  /**
   * Test if API keys are valid
   */
  async testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        return { valid: true };
      } else {
        const error = await response.json();
        return { valid: false, error: error.error?.message || 'Invalid API key' };
      }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  /**
   * Stage 1: Detect if text contains factual claims
   */
  async detectClaims(text: string, apiKey?: string): Promise<ClaimDetectionResult> {
    const key = apiKey || this.groqApiKey;

    const prompt = `You are a fact-checking assistant. Analyze the following text and determine if it contains factual claims that can be verified.

Text: "${text}"

Respond in JSON format:
{
  "hasClaim": true/false,
  "claims": ["main factual claim if exists"],
  "reasoning": "brief explanation"
}

Only return the JSON, nothing else.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';

      // Parse JSON response
      const result = JSON.parse(content);

      return {
        hasClaim: result.hasClaim || false,
        claims: result.claims || [],
        reasoning: result.reasoning || '',
      };
    } catch (error) {
      console.error('Groq claim detection error:', error);
      return {
        hasClaim: false,
        claims: [],
        reasoning: 'Error detecting claims',
      };
    }
  }

  /**
   * Stage 2: Verify claim using Google Search + Groq analysis
   * Falls back to Groq-only mode if Google API not configured
   */
  async verifyClaim(claim: string, apiKey?: string): Promise<VerificationVerdictResult> {
    const key = apiKey || this.groqApiKey;

    try {
      // Check if Google Search is available
      const hasGoogleSearch = this.googleApiKey && this.googleSearchEngineId;

      if (hasGoogleSearch) {
        // Mode 1: Google Search + Groq Analysis (Best quality)
        const searchResults = await this.googleSearch(claim);

        if (searchResults && searchResults.length > 0) {
          const verdict = await this.analyzeEvidence(claim, searchResults, key);
          return verdict;
        }
      }

      // Mode 2: Groq-only mode (fallback - still works without Google)
      console.info('Using Groq-only mode (no web search available)');
      const verdict = await this.verifyClaimWithGroqOnly(claim, key);
      return verdict;

    } catch (error) {
      console.error('Groq verification error:', error);
      return {
        verdict: 'unknown',
        confidence: 0,
        explanation: 'Error verifying claim: ' + (error instanceof Error ? error.message : 'Unknown error'),
        sources: [],
      };
    }
  }

  /**
   * Verify claim using only Groq AI (no web search)
   * Used when Google Search is not configured
   */
  private async verifyClaimWithGroqOnly(
    claim: string,
    apiKey: string
  ): Promise<VerificationVerdictResult> {
    const prompt = `You are a professional fact-checker. Analyze the following claim based on your knowledge.

CLAIM: "${claim}"

Provide a fact-check verdict in JSON format:
{
  "verdict": "true" | "false" | "unknown",
  "confidence": 0-100 (how confident are you in this verdict),
  "explanation": "1-2 sentence explanation of your verdict",
  "reasoning": "brief reasoning"
}

Verdict guidelines:
- "true": The claim is factually accurate based on well-established knowledge
- "false": The claim is factually incorrect
- "unknown": Insufficient knowledge or the claim requires current web data to verify

Confidence guidelines:
- 90-100: Extremely confident, well-documented facts (e.g., "Earth orbits the Sun")
- 70-89: Very confident, established knowledge (e.g., "Paris is the capital of France")
- 50-69: Moderately confident, but some uncertainty
- 30-49: Low confidence, limited knowledge
- 0-29: Very low confidence, mostly uncertain

IMPORTANT:
- Use high confidence (70-100) for well-established, verifiable facts
- If the claim involves recent events or current statistics, return "unknown" with explanation that web search is needed
- Only return the JSON, nothing else.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 800,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';

      // Parse JSON response
      const analysis = JSON.parse(content);

      return {
        verdict: analysis.verdict || 'unknown',
        confidence: Math.max(0, (analysis.confidence || 50) - 5), // Slight reduction since no web search
        explanation: analysis.explanation + ' (Note: This verdict is based on AI knowledge. For current events, web search may be needed.)',
        sources: [],
      };
    } catch (error) {
      console.error('Groq-only verification error:', error);
      return {
        verdict: 'unknown',
        confidence: 0,
        explanation: 'Unable to verify claim. Error during analysis.',
        sources: [],
      };
    }
  }

  /**
   * Search Google Custom Search API
   */
  private async googleSearch(query: string): Promise<any[]> {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleApiKey}&cx=${this.googleSearchEngineId}&q=${encodeURIComponent(query)}&num=10`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error('Google Search API error:', response.status);
        return [];
      }

      const data = await response.json();

      // Extract relevant information from search results
      const results = data.items?.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: new URL(item.link).hostname,
      })) || [];

      return results;
    } catch (error) {
      console.error('Google search error:', error);
      return [];
    }
  }

  /**
   * Analyze search results using Groq AI
   */
  private async analyzeEvidence(
    claim: string,
    searchResults: any[],
    apiKey: string
  ): Promise<VerificationVerdictResult> {
    // Format search results for Groq
    const evidenceText = searchResults
      .map((result, i) => `[${i + 1}] ${result.source}: "${result.snippet}"`)
      .join('\n\n');

    const prompt = `You are a professional fact-checker. Analyze the following claim against the evidence from web search results.

CLAIM: "${claim}"

EVIDENCE FROM WEB SEARCH:
${evidenceText}

Based on the evidence, provide a fact-check verdict in JSON format:
{
  "verdict": "true" | "false" | "unknown",
  "confidence": 0-100 (how confident are you in this verdict),
  "explanation": "1-2 sentence explanation of your verdict",
  "keyPoints": ["key point 1", "key point 2", "key point 3"]
}

Verdict guidelines:
- "true": Evidence strongly supports the claim
- "false": Evidence clearly contradicts the claim
- "unknown": Insufficient or conflicting evidence

Only return the JSON, nothing else.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';

      // Parse JSON response
      const analysis = JSON.parse(content);

      // Format sources from search results
      const sources = searchResults.slice(0, 5).map(result => ({
        title: result.title,
        url: result.url,
        provider: 'Google Search',
      }));

      return {
        verdict: analysis.verdict || 'unknown',
        confidence: analysis.confidence || 50,
        explanation: analysis.explanation || 'Unable to determine verdict.',
        sources,
      };
    } catch (error) {
      console.error('Groq analysis error:', error);

      // Fallback: return sources even if analysis fails
      return {
        verdict: 'unknown',
        confidence: 40,
        explanation: 'Found relevant sources but unable to complete analysis.',
        sources: searchResults.slice(0, 5).map(result => ({
          title: result.title,
          url: result.url,
          provider: 'Google Search',
        })),
      };
    }
  }
}
