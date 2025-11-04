/**
 * Trial Management System
 * Handles free trial with 10 free fact-checks
 */

import { STORAGE_KEYS, TrialInfo } from '@/shared/types';

const FREE_SEARCHES_LIMIT = 10;

/**
 * Initialize trial on first use
 */
export async function initializeTrial(): Promise<TrialInfo> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TRIAL);

  if (result[STORAGE_KEYS.TRIAL]) {
    return result[STORAGE_KEYS.TRIAL] as TrialInfo;
  }

  // First time user - start trial with 10 free searches
  const now = Date.now();
  const trialInfo: TrialInfo = {
    startDate: now,
    endDate: 0, // No time limit, only search limit
    isActive: true,
    totalChecks: 0,
    checksToday: 0,
    lastCheckDate: new Date().toISOString().split('T')[0],
  };

  await chrome.storage.local.set({ [STORAGE_KEYS.TRIAL]: trialInfo });
  console.info('Trial started with 10 free searches:', trialInfo);

  return trialInfo;
}

/**
 * Get current trial information
 */
export async function getTrialInfo(): Promise<{
  trialInfo: TrialInfo;
  searchesRemaining: number;
  isExpired: boolean;
}> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TRIAL);
  let trialInfo = result[STORAGE_KEYS.TRIAL] as TrialInfo;

  // Initialize if not exists
  if (!trialInfo) {
    trialInfo = await initializeTrial();
  }

  // Check if user has exceeded free search limit
  const searchesRemaining = Math.max(0, FREE_SEARCHES_LIMIT - trialInfo.totalChecks);
  const isExpired = trialInfo.totalChecks >= FREE_SEARCHES_LIMIT;

  // Reset daily count if it's a new day
  const today = new Date().toISOString().split('T')[0];
  if (trialInfo.lastCheckDate !== today) {
    trialInfo.checksToday = 0;
    trialInfo.lastCheckDate = today;
    await chrome.storage.local.set({ [STORAGE_KEYS.TRIAL]: trialInfo });
  }

  return {
    trialInfo,
    searchesRemaining,
    isExpired,
  };
}

/**
 * Record a fact-check usage
 */
export async function recordUsage(): Promise<void> {
  const { trialInfo } = await getTrialInfo();

  trialInfo.totalChecks += 1;
  trialInfo.checksToday += 1;

  await chrome.storage.local.set({ [STORAGE_KEYS.TRIAL]: trialInfo });
}

/**
 * Check if trial is valid (not expired)
 */
export async function isTrialValid(): Promise<boolean> {
  const { isExpired } = await getTrialInfo();
  return !isExpired;
}

/**
 * Get trial status message for UI
 */
export async function getTrialStatusMessage(): Promise<string> {
  const { searchesRemaining, isExpired } = await getTrialInfo();

  if (isExpired) {
    return 'Free searches used - Upgrade to Pro or add your own API key';
  }

  if (searchesRemaining === 0) {
    return 'Last free search!';
  }

  if (searchesRemaining === 1) {
    return '1 free search remaining';
  }

  return `${searchesRemaining} free searches remaining`;
}
