/**
 * Dashboard UI Logic
 *
 * Features:
 * - AI provider selection with cost tracking
 * - Custom criteria management (Encorp.io, Nexo, Future)
 * - Real-time cost calculation
 * - Recent fact-checks comparison view
 * - Monthly spending breakdown
 */

import type { AIProviderID } from '@/shared/types';

interface ProviderCost {
  id: AIProviderID;
  costPerCheck: number;
  name: string;
  benefit: string;
}

interface FactCheckHistory {
  id: string;
  timestamp: number;
  claim: string;
  results: {
    provider: AIProviderID;
    verdict: 'true' | 'false' | 'unknown' | 'needs_web_search';
    confidence: number;
  }[];
  consensus: {
    verdict: 'true' | 'false' | 'unknown';
    confidence: number;
    agreement: string; // "2/3 providers agree"
  };
  cost: number;
  explanation: string;
}

// Provider cost mapping
const PROVIDER_COSTS: Record<AIProviderID, number> = {
  groq: 0.000,      // FREE
  perplexity: 0.005, // $0.005 per check
  anthropic: 0.020,  // $0.015 (model) + $0.005 (Brave Search avg)
  openai: 0.015,     // $0.015 per check (GPT-4o with web search)
};

class Dashboard {
  private selectedProviders: Set<AIProviderID> = new Set(['groq']); // Groq always included
  private customCriteria: Record<string, boolean> = {};
  private factCheckHistory: FactCheckHistory[] = [];

  constructor() {
    this.init();
  }

  async init() {
    // Load user settings
    await this.loadSettings();

    // Setup event listeners
    this.setupProviderSelection();
    this.setupQuickCombos();
    this.setupCriteriaTabs();
    this.setupCustomCriteria();

    // Load fact-check history
    await this.loadHistory();

    // Update UI
    this.updateCostEstimate();
    this.updateUsageStats();
    this.renderHistory();
  }

  /**
   * Load user settings from storage
   */
  async loadSettings() {
    const result = await chrome.storage.sync.get([
      'selectedProviders',
      'customCriteria',
      'subscriptionPlan',
    ]);

    if (result.selectedProviders) {
      this.selectedProviders = new Set(result.selectedProviders);
    }

    if (result.customCriteria) {
      this.customCriteria = result.customCriteria;
    }

    // Update subscription badge
    const badge = document.getElementById('subscriptionBadge');
    if (badge && result.subscriptionPlan) {
      badge.querySelector('.plan-name')!.textContent = result.subscriptionPlan.name;
      badge.querySelector('.plan-cost')!.textContent = result.subscriptionPlan.cost;
    }
  }

  /**
   * Setup provider checkbox listeners
   */
  setupProviderSelection() {
    const checkboxes = document.querySelectorAll('.provider-checkbox') as NodeListOf<HTMLInputElement>;

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const providerId = target.id.replace('provider-', '') as AIProviderID;

        if (target.checked) {
          this.selectedProviders.add(providerId);
        } else {
          this.selectedProviders.delete(providerId);
        }

        // Save to storage
        chrome.storage.sync.set({
          selectedProviders: Array.from(this.selectedProviders),
        });

        // Update cost estimate
        this.updateCostEstimate();
      });
    });
  }

  /**
   * Setup quick combination buttons
   */
  setupQuickCombos() {
    const comboButtons = document.querySelectorAll('.combo-btn') as NodeListOf<HTMLButtonElement>;

    comboButtons.forEach(button => {
      button.addEventListener('click', () => {
        const combo = button.dataset.combo;
        if (!combo) return;

        // Clear current selection (except Groq)
        this.selectedProviders.clear();
        this.selectedProviders.add('groq');

        // Add combo providers
        if (combo === 'all') {
          this.selectedProviders.add('perplexity');
          this.selectedProviders.add('anthropic');
          this.selectedProviders.add('openai');
        } else {
          const providers = combo.split(',') as AIProviderID[];
          providers.forEach(p => {
            if (p !== 'groq') {
              this.selectedProviders.add(p);
            }
          });
        }

        // Update checkboxes
        this.updateCheckboxes();

        // Save and update cost
        chrome.storage.sync.set({
          selectedProviders: Array.from(this.selectedProviders),
        });

        this.updateCostEstimate();
      });
    });
  }

  /**
   * Update checkbox states based on selected providers
   */
  updateCheckboxes() {
    const checkboxes = document.querySelectorAll('.provider-checkbox') as NodeListOf<HTMLInputElement>;

    checkboxes.forEach(checkbox => {
      const providerId = checkbox.id.replace('provider-', '') as AIProviderID;
      checkbox.checked = this.selectedProviders.has(providerId);
    });
  }

  /**
   * Calculate and display estimated cost per check
   */
  updateCostEstimate() {
    let totalCost = 0;

    this.selectedProviders.forEach(providerId => {
      totalCost += PROVIDER_COSTS[providerId];
    });

    const estimatedCostEl = document.getElementById('estimatedCost');
    if (estimatedCostEl) {
      estimatedCostEl.textContent = `$${totalCost.toFixed(3)}`;
    }
  }

  /**
   * Setup criteria tabs
   */
  setupCriteriaTabs() {
    const tabs = document.querySelectorAll('.criteria-tab') as NodeListOf<HTMLButtonElement>;
    const tabContents = document.querySelectorAll('.criteria-tab-content') as NodeListOf<HTMLElement>;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        // Add active class to clicked tab
        tab.classList.add('active');

        // Show corresponding content
        const tabName = tab.dataset.tab;
        const content = document.getElementById(`tab-${tabName}`);
        if (content) {
          content.classList.add('active');
        }
      });
    });
  }

  /**
   * Setup custom criteria inputs
   */
  setupCustomCriteria() {
    const saveButton = document.getElementById('saveCustomCriteria');

    if (saveButton) {
      saveButton.addEventListener('click', async () => {
        const contextInput = document.getElementById('custom-context') as HTMLTextAreaElement;
        const sourcesInput = document.getElementById('custom-sources') as HTMLInputElement;

        const customCriteria = {
          context: contextInput.value,
          sources: sourcesInput.value.split(',').map(s => s.trim()),
        };

        // Save to storage
        await chrome.storage.sync.set({ customCriteria });

        // Show success message
        alert('Custom criteria saved!');
      });
    }
  }

  /**
   * Load fact-check history from storage
   */
  async loadHistory() {
    const result = await chrome.storage.local.get('factCheckHistory');

    if (result.factCheckHistory) {
      this.factCheckHistory = result.factCheckHistory.slice(0, 10); // Last 10 checks
    }
  }

  /**
   * Render fact-check history cards
   */
  renderHistory() {
    const listContainer = document.getElementById('recentChecksList');
    if (!listContainer) return;

    // Clear existing content
    listContainer.innerHTML = '';

    if (this.factCheckHistory.length === 0) {
      listContainer.innerHTML = '<p class="no-history">No fact-checks yet. Start checking claims to see them here!</p>';
      return;
    }

    // Render each fact-check
    this.factCheckHistory.forEach(check => {
      const card = this.createCheckCard(check);
      listContainer.appendChild(card);
    });
  }

  /**
   * Create a fact-check history card
   */
  createCheckCard(check: FactCheckHistory): HTMLElement {
    const card = document.createElement('div');
    card.className = 'check-card';

    // Time ago helper
    const timeAgo = this.getTimeAgo(check.timestamp);

    card.innerHTML = `
      <div class="check-header">
        <span class="check-timestamp">${timeAgo}</span>
        <span class="check-cost">Cost: $${check.cost.toFixed(3)}</span>
      </div>

      <div class="check-claim">
        <p>"${this.escapeHtml(check.claim)}"</p>
      </div>

      <div class="check-verdicts">
        ${check.results.map(result => `
          <div class="verdict-row">
            <span class="provider-badge ${result.provider}">${this.getProviderName(result.provider)}</span>
            <span class="verdict ${result.verdict}">${result.verdict.toUpperCase().replace('_', ' ')}</span>
            <span class="confidence">${result.confidence}%</span>
          </div>
        `).join('')}
      </div>

      <div class="check-consensus">
        <div class="consensus-badge ${this.getConsensusClass(check.consensus.confidence)}">
          <span class="consensus-label">CONSENSUS:</span>
          <span class="consensus-verdict">${check.consensus.verdict.toUpperCase()}</span>
          <span class="consensus-agreement">${check.consensus.agreement} (${check.consensus.confidence}% confidence)</span>
        </div>
      </div>

      <div class="check-explanation">
        <p>${this.escapeHtml(check.explanation)}</p>
      </div>

      <button class="btn-expand" data-check-id="${check.id}">View Full Report</button>
    `;

    return card;
  }

  /**
   * Update usage statistics
   */
  async updateUsageStats() {
    const result = await chrome.storage.local.get('usageStats');

    if (result.usageStats) {
      const stats = result.usageStats;

      // Update monthly spending
      const spendingEl = document.getElementById('monthlySpending');
      if (spendingEl) {
        spendingEl.textContent = `$${stats.monthlySpending.toFixed(2)}`;
      }

      // Update checks today
      const checksEl = document.getElementById('checksToday');
      if (checksEl) {
        checksEl.textContent = stats.checksToday.toString();
      }

      // Update average cost
      const avgCostEl = document.getElementById('avgCost');
      if (avgCostEl) {
        avgCostEl.textContent = `$${stats.avgCost.toFixed(3)}`;
      }
    }
  }

  /**
   * Helper: Get time ago string
   */
  getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /**
   * Helper: Get provider display name
   */
  getProviderName(id: AIProviderID): string {
    const names: Record<AIProviderID, string> = {
      groq: 'Groq',
      perplexity: 'Perplexity',
      anthropic: 'Claude',
      openai: 'GPT-4',
    };
    return names[id];
  }

  /**
   * Helper: Get consensus CSS class based on confidence
   */
  getConsensusClass(confidence: number): string {
    if (confidence >= 85) return 'high';
    if (confidence >= 70) return 'medium';
    return 'low';
  }

  /**
   * Helper: Escape HTML
   */
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});
