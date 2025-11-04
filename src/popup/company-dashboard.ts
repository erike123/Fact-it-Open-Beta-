/**
 * Company Dashboard Script for Fact-It Extension
 * Shows company-wide security metrics and team activity
 */

import { MessageType, CompanyDashboardData, EXTENSION_VERSION } from '@/shared/types';
import { EXTENSION_NAME } from '@/shared/constants';

console.info(`${EXTENSION_NAME}: Company Dashboard loaded`);

// DOM Elements
const companyNameEl = document.getElementById('company-name') as HTMLHeadingElement;
const employeeCountEl = document.getElementById('employee-count') as HTMLSpanElement;
const threatsBlockedEl = document.getElementById('threats-blocked') as HTMLSpanElement;

// Metrics
const criticalThreatsEl = document.getElementById('critical-threats') as HTMLDivElement;
const totalChecksEl = document.getElementById('total-checks') as HTMLDivElement;
const riskScoreEl = document.getElementById('risk-score') as HTMLDivElement;
const activeUsersEl = document.getElementById('active-users') as HTMLDivElement;

// Lists
const threatsListEl = document.getElementById('threats-list') as HTMLDivElement;
const employeeListEl = document.getElementById('employee-list') as HTMLDivElement;

// Sections
const upgradeSectionEl = document.getElementById('upgrade-section') as HTMLElement;
const msspSectionEl = document.getElementById('mssp-section') as HTMLElement;

// Buttons
const personalViewBtn = document.getElementById('personal-view-btn') as HTMLButtonElement;
const enterpriseUpgradeBtn = document.getElementById('enterprise-upgrade-btn') as HTMLButtonElement;
const msspContactBtn = document.getElementById('mssp-contact-btn') as HTMLButtonElement;
const grantHelpBtn = document.getElementById('grant-help-btn') as HTMLButtonElement;
const exportReportBtn = document.getElementById('export-report-btn') as HTMLButtonElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;

// Version
const versionInfoEl = document.getElementById('version-info') as HTMLSpanElement;

// Initialize
init();

async function init(): Promise<void> {
  // Set version
  versionInfoEl.textContent = `v${EXTENSION_VERSION}`;

  // Load dashboard data
  await loadDashboardData();

  // Setup event listeners
  setupEventListeners();
}

/**
 * Load company dashboard data from background worker
 */
async function loadDashboardData(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.GET_COMPANY_DASHBOARD_DATA,
    });

    if (response.error) {
      console.error('Error loading dashboard data:', response.error);
      showError('Unable to load company data');
      return;
    }

    const data = response.data as CompanyDashboardData;

    // Update UI
    renderDashboard(data);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showError('Failed to connect to extension service');
  }
}

/**
 * Render dashboard with company data
 */
function renderDashboard(data: CompanyDashboardData): void {
  const { company, recentThreats, employeeActivity, upgradeEligible, showEnterprisePromo } = data;

  // Update header
  companyNameEl.textContent = formatCompanyName(company.domain);
  employeeCountEl.textContent = String(company.totalEmployees);
  threatsBlockedEl.textContent = String(company.totalThreatsBlocked);

  // Update metrics
  const criticalCount = recentThreats.filter((t) => t.severity === 'critical').length;
  criticalThreatsEl.textContent = String(criticalCount);
  totalChecksEl.textContent = formatNumber(company.totalChecks);
  riskScoreEl.textContent = `${company.riskScore}/100`;
  activeUsersEl.textContent = String(company.activeEmployees);

  // Update risk score color
  const riskTrendEl = document.getElementById('risk-trend') as HTMLDivElement;
  if (company.riskScore >= 70) {
    riskTrendEl.textContent = 'High Risk';
    riskTrendEl.style.color = '#ef4444';
  } else if (company.riskScore >= 40) {
    riskTrendEl.textContent = 'Medium Risk';
    riskTrendEl.style.color = '#f59e0b';
  } else {
    riskTrendEl.textContent = 'Low Risk';
    riskTrendEl.style.color = '#10b981';
  }

  // Render threats list
  renderThreats(recentThreats);

  // Render employee activity
  renderEmployeeActivity(employeeActivity);

  // Show upgrade section if eligible (10+ employees)
  if (upgradeEligible) {
    upgradeSectionEl.style.display = 'block';

    // Calculate enterprise pricing based on employee count
    const basePrice = 99;
    const pricePerEmployee = 5;
    const totalPrice = basePrice + company.totalEmployees * pricePerEmployee;
    const enterprisePriceEl = document.getElementById('enterprise-price') as HTMLSpanElement;
    enterprisePriceEl.textContent = `€${totalPrice}/month`;
  }

  // Show MSSP section if 50+ employees
  if (showEnterprisePromo) {
    msspSectionEl.style.display = 'block';
  }
}

/**
 * Render recent threats list
 */
function renderThreats(threats: CompanyDashboardData['recentThreats']): void {
  if (threats.length === 0) {
    threatsListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛡️</div>
        <p>No threats detected yet</p>
        <small>Your team is protected by Fact-It</small>
      </div>
    `;
    return;
  }

  // Update badge
  const threatsBadgeEl = document.getElementById('threats-badge') as HTMLSpanElement;
  threatsBadgeEl.textContent = String(threats.length);

  // Render threat items (limit to 5 most recent)
  const recentThreats = threats.slice(0, 5);
  threatsListEl.innerHTML = recentThreats
    .map(
      (threat) => `
    <div class="threat-item severity-${threat.severity}">
      <div class="threat-severity">${getSeverityIcon(threat.severity)}</div>
      <div class="threat-content">
        <div class="threat-header">
          <div class="threat-type">${escapeHtml(threat.type)}</div>
          <div class="threat-time">${formatRelativeTime(threat.timestamp)}</div>
        </div>
        <div class="threat-description">${escapeHtml(threat.description)}</div>
        <div class="threat-footer">Blocked by ${escapeHtml(threat.blockedBy)}</div>
      </div>
    </div>
  `
    )
    .join('');
}

/**
 * Render employee activity list
 */
function renderEmployeeActivity(employees: CompanyDashboardData['employeeActivity']): void {
  if (employees.length === 0) {
    employeeListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👤</div>
        <p>No activity yet</p>
        <small>Employees will appear here once they start using Fact-It</small>
      </div>
    `;
    return;
  }

  // Update badge
  const activityBadgeEl = document.getElementById('activity-badge') as HTMLSpanElement;
  activityBadgeEl.textContent = String(employees.length);

  // Render employee items (limit to 10 most active)
  const topEmployees = employees.slice(0, 10);
  employeeListEl.innerHTML = topEmployees
    .map(
      (emp) => `
    <div class="employee-item">
      <div class="employee-avatar">${getInitials(emp.email)}</div>
      <div class="employee-info">
        <div class="employee-email">${escapeHtml(emp.email)}</div>
        <div class="employee-stats">
          ${emp.checksToday} checks today • ${emp.threatsBlocked} threats blocked
        </div>
      </div>
      <div class="employee-activity">
        <span class="activity-count">${emp.checksToday}</span>
        <span class="activity-label">Today</span>
      </div>
    </div>
  `
    )
    .join('');
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  // Switch to personal view
  personalViewBtn.addEventListener('click', () => {
    // Open regular popup
    chrome.action.setPopup({ popup: 'src/popup/popup.html' });
    window.close();
  });

  // Enterprise upgrade
  enterpriseUpgradeBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://factit.app/enterprise', // TODO: Replace with actual URL
    });
  });

  // MSSP contact
  msspContactBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://factit.app/mssp', // TODO: Replace with actual URL
    });
  });

  // Grant help
  grantHelpBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://factit.app/grants', // TODO: Replace with actual URL
    });
  });

  // Export report
  exportReportBtn.addEventListener('click', async () => {
    await exportCompanyReport();
  });

  // Settings
  settingsBtn.addEventListener('click', () => {
    chrome.action.setPopup({ popup: 'src/popup/popup.html' });
    window.close();
  });
}

/**
 * Export company security report
 */
async function exportCompanyReport(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.GET_COMPANY_DASHBOARD_DATA,
    });

    if (response.error) {
      alert('Failed to generate report');
      return;
    }

    const data = response.data as CompanyDashboardData;

    // Generate report
    const report = generateReport(data);

    // Download as JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `factit-report-${data.company.domain}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting report:', error);
    alert('Failed to export report');
  }
}

/**
 * Generate security report
 */
function generateReport(data: CompanyDashboardData): unknown {
  return {
    reportDate: new Date().toISOString(),
    company: {
      domain: data.company.domain,
      employees: data.company.totalEmployees,
      activeEmployees: data.company.activeEmployees,
      riskScore: data.company.riskScore,
    },
    summary: {
      totalThreatsBlocked: data.company.totalThreatsBlocked,
      totalChecks: data.company.totalChecks,
      criticalThreats: data.recentThreats.filter((t) => t.severity === 'critical').length,
      highThreats: data.recentThreats.filter((t) => t.severity === 'high').length,
    },
    topThreats: data.company.topThreats,
    recentIncidents: data.recentThreats.map((t) => ({
      date: new Date(t.timestamp).toISOString(),
      type: t.type,
      severity: t.severity,
      description: t.description,
    })),
    compliance: {
      nis2Ready: data.company.riskScore < 40,
      iso27001Compliant: data.company.totalChecks > 100,
      gdrpCompliant: true,
    },
  };
}

// Helper Functions

function formatCompanyName(domain: string): string {
  // Extract company name from domain (e.g., "acme.com" -> "ACME Ltd")
  const name = domain.split('.')[0];
  return name.charAt(0).toUpperCase() + name.slice(1) + ' Ltd';
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return String(num);
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getSeverityIcon(severity: 'critical' | 'high' | 'medium' | 'low'): string {
  const icons = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };
  return icons[severity];
}

function getInitials(email: string): string {
  // Get first letter of email (before @)
  const username = email.split('@')[0];
  return username.charAt(0).toUpperCase();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message: string): void {
  companyNameEl.textContent = 'Error';
  employeeCountEl.textContent = '-';
  threatsBlockedEl.textContent = '-';

  threatsListEl.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p>${escapeHtml(message)}</p>
      <small>Please try refreshing the dashboard</small>
    </div>
  `;
}
