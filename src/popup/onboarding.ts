/**
 * Onboarding Script for Fact-It Extension
 * Guides new users through setup and email collection
 */

import { MessageType } from '@/shared/types';
import { EXTENSION_NAME } from '@/shared/constants';

console.info(`${EXTENSION_NAME}: Onboarding loaded`);

// Current screen
let currentScreen = 1;

// DOM Elements - Screen 1
const screen1 = document.getElementById('screen-1') as HTMLDivElement;
const nextBtn1 = document.getElementById('next-btn-1') as HTMLButtonElement;

// DOM Elements - Screen 2
const screen2 = document.getElementById('screen-2') as HTMLDivElement;
const workEmailInput = document.getElementById('work-email') as HTMLInputElement;
const skipBtn = document.getElementById('skip-btn') as HTMLButtonElement;
const continueBtn = document.getElementById('continue-btn') as HTMLButtonElement;

// DOM Elements - Screen 3 (Company)
const screen3 = document.getElementById('screen-3') as HTMLDivElement;
const employeeCountText = document.getElementById('employee-count-text') as HTMLSpanElement;
const companyChecks = document.getElementById('company-checks') as HTMLDivElement;
const companyThreats = document.getElementById('company-threats') as HTMLDivElement;
const viewDashboardBtn = document.getElementById('view-dashboard-btn') as HTMLButtonElement;
const finishBtn = document.getElementById('finish-btn') as HTMLButtonElement;

// DOM Elements - Screen Personal
const screenPersonal = document.getElementById('screen-personal') as HTMLDivElement;
const finishPersonalBtn = document.getElementById('finish-personal-btn') as HTMLButtonElement;
const addEmailLaterBtn = document.getElementById('add-email-later-btn') as HTMLButtonElement;

// Initialize
init();

function init(): void {
  // Check if user has already completed onboarding
  checkOnboardingStatus();

  // Setup event listeners
  setupEventListeners();
}

async function checkOnboardingStatus(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('onboarding_completed');
    if (result.onboarding_completed) {
      // User has already completed onboarding, redirect to main popup
      window.location.href = 'popup.html';
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error);
  }
}

function setupEventListeners(): void {
  // Screen 1 - Get Started
  nextBtn1.addEventListener('click', () => {
    showScreen(2);
  });

  // Screen 2 - Email Input
  skipBtn.addEventListener('click', () => {
    showPersonalScreen();
  });

  continueBtn.addEventListener('click', async () => {
    const email = workEmailInput.value.trim();

    if (!email) {
      showPersonalScreen();
      return;
    }

    if (!isValidEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Set user email
    await setUserEmail(email);

    // Show company screen
    await showCompanyScreen();
  });

  // Screen 3 - Company Dashboard
  viewDashboardBtn.addEventListener('click', () => {
    // Switch to company dashboard
    chrome.action.setPopup({ popup: 'src/popup/company-dashboard.html' });
    window.close();
  });

  finishBtn.addEventListener('click', () => {
    completeOnboarding();
  });

  // Screen Personal
  finishPersonalBtn.addEventListener('click', () => {
    completeOnboarding();
  });

  addEmailLaterBtn.addEventListener('click', () => {
    showScreen(2);
  });

  // Allow Enter key on email input
  workEmailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      continueBtn.click();
    }
  });
}

function showScreen(screenNumber: number): void {
  // Hide all screens
  screen1.style.display = 'none';
  screen2.style.display = 'none';
  screen3.style.display = 'none';
  screenPersonal.style.display = 'none';

  // Show target screen
  if (screenNumber === 1) {
    screen1.style.display = 'flex';
  } else if (screenNumber === 2) {
    screen2.style.display = 'flex';
  } else if (screenNumber === 3) {
    screen3.style.display = 'flex';
  }

  currentScreen = screenNumber;
}

function showPersonalScreen(): void {
  screen1.style.display = 'none';
  screen2.style.display = 'none';
  screen3.style.display = 'none';
  screenPersonal.style.display = 'flex';
}

async function setUserEmail(email: string): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.SET_USER_EMAIL,
      payload: { email },
    });

    if (response.error) {
      console.error('Error setting user email:', response.error);
      alert('Failed to save email. Please try again.');
      throw new Error(response.error);
    }

    console.info(`${EXTENSION_NAME}: User email set successfully`);
  } catch (error) {
    console.error('Error setting user email:', error);
    throw error;
  }
}

async function showCompanyScreen(): Promise<void> {
  try {
    // Get company stats
    const response = await chrome.runtime.sendMessage({
      type: MessageType.GET_COMPANY_STATS,
    });

    if (response.error) {
      console.error('Error getting company stats:', response.error);
      showPersonalScreen();
      return;
    }

    const stats = response.stats;

    if (!stats) {
      showPersonalScreen();
      return;
    }

    // Update company screen with stats
    employeeCountText.textContent = String(stats.totalEmployees);
    companyChecks.textContent = String(stats.totalChecks);
    companyThreats.textContent = String(stats.totalThreatsBlocked);

    // Show screen 3
    showScreen(3);
  } catch (error) {
    console.error('Error showing company screen:', error);
    showPersonalScreen();
  }
}

async function completeOnboarding(): Promise<void> {
  try {
    // Mark onboarding as completed
    await chrome.storage.local.set({
      onboarding_completed: true,
      onboarding_date: Date.now(),
    });

    console.info(`${EXTENSION_NAME}: Onboarding completed`);

    // Redirect to main popup
    window.location.href = 'popup.html';
  } catch (error) {
    console.error('Error completing onboarding:', error);
    alert('Failed to complete onboarding. Please try again.');
  }
}

function isValidEmail(email: string): boolean {
  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
