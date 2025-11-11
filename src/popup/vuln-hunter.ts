/**
 * Vulnerability Hunter Popup UI
 */

import { MessageType } from '@/shared/types';

// Load saved config
async function loadConfig() {
  const result = await chrome.storage.local.get([
    'vuln_hunter_twitter_token',
    'vuln_hunter_github_token',
    'vuln_hunter_twitter_enabled',
    'vuln_hunter_github_enabled',
  ]);

  const twitterToken = document.getElementById('twitterToken') as HTMLInputElement;
  const githubToken = document.getElementById('githubToken') as HTMLInputElement;
  const twitterEnabled = document.getElementById('twitterEnabled') as HTMLInputElement;
  const githubEnabled = document.getElementById('githubEnabled') as HTMLInputElement;

  if (result.vuln_hunter_twitter_token) {
    twitterToken.value = result.vuln_hunter_twitter_token;
  }
  if (result.vuln_hunter_github_token) {
    githubToken.value = result.vuln_hunter_github_token;
  }

  twitterEnabled.checked = result.vuln_hunter_twitter_enabled || false;
  githubEnabled.checked = result.vuln_hunter_github_enabled !== false; // Default true
}

// Save config
async function saveConfig() {
  const twitterToken = (document.getElementById('twitterToken') as HTMLInputElement).value;
  const githubToken = (document.getElementById('githubToken') as HTMLInputElement).value;
  const twitterEnabled = (document.getElementById('twitterEnabled') as HTMLInputElement).checked;
  const githubEnabled = (document.getElementById('githubEnabled') as HTMLInputElement).checked;

  await chrome.storage.local.set({
    vuln_hunter_twitter_token: twitterToken,
    vuln_hunter_github_token: githubToken,
    vuln_hunter_twitter_enabled: twitterEnabled,
    vuln_hunter_github_enabled: githubEnabled,
  });
}

// Start hunting
async function startHunting() {
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  startBtn.disabled = true;
  startBtn.innerHTML = '<span class="loading"></span> Hunting...';

  try {
    await saveConfig();

    const twitterToken = (document.getElementById('twitterToken') as HTMLInputElement).value;
    const githubToken = (document.getElementById('githubToken') as HTMLInputElement).value;
    const twitterEnabled = (document.getElementById('twitterEnabled') as HTMLInputElement).checked;
    const githubEnabled = (document.getElementById('githubEnabled') as HTMLInputElement).checked;

    const response = await chrome.runtime.sendMessage({
      type: MessageType.VULN_HUNTER_START,
      payload: {
        twitter: {
          bearerToken: twitterToken,
          enabled: twitterEnabled,
        },
        github: {
          token: githubToken,
          enabled: githubEnabled,
        },
      },
    });

    if (response.error) {
      alert(`Error: ${response.error}`);
    } else {
      console.log('Hunting complete:', response.discoveries);
      await loadDiscoveries();
    }
  } catch (error) {
    console.error('Error starting hunt:', error);
    alert('Error starting vulnerability hunt. Check console for details.');
  } finally {
    startBtn.disabled = false;
    startBtn.innerHTML = '🚀 Start Hunting';
  }
}

// Load discoveries
async function loadDiscoveries() {
  const response = await chrome.runtime.sendMessage({
    type: MessageType.VULN_HUNTER_GET_DISCOVERIES,
  });

  const discoveries = response.discoveries || [];
  renderDiscoveries(discoveries);
  updateStats(discoveries);
}

// Render discoveries
function renderDiscoveries(discoveries: any[]) {
  const container = document.getElementById('discoveryList');

  if (!container) return;

  if (discoveries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No vulnerabilities discovered yet. Click "Start Hunting" to begin monitoring.
      </div>
    `;
    return;
  }

  container.innerHTML = discoveries
    .map(
      (d) => `
    <div class="discovery">
      <div class="discovery-header">
        <div>
          <span class="platform-badge platform-${d.source.platform}">${d.source.platform.toUpperCase()}</span>
          ${d.severity ? `<span class="severity severity-${d.severity}">${d.severity.toUpperCase()}</span>` : ''}
        </div>
        <span class="status ${d.status === 'analyzing' ? 'status-analyzing' : ''} ${d.status === 'analyzed' ? 'status-analyzed' : ''}">${d.status}</span>
      </div>

      <div class="discovery-content">
        ${truncateText(d.source.content, 150)}
      </div>

      <div class="discovery-footer">
        <a href="${d.source.url}" target="_blank" class="repo-link">View Source →</a>
        ${d.githubUrls.length > 0 ? `<a href="${d.githubUrls[0]}" target="_blank" class="repo-link">${extractRepoName(d.githubUrls[0])}</a>` : ''}
        ${d.status === 'discovered' && d.githubUrls.length > 0 ? `<button class="analyze-btn" onclick="analyzeDiscovery('${d.id}')">Analyze</button>` : ''}
      </div>

      ${d.analysis ? renderAnalysis(d.analysis) : ''}
    </div>
  `
    )
    .join('');
}

// Render analysis results
function renderAnalysis(analysis: any): string {
  return `
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 12px;">
      <strong>Analysis Results:</strong>
      <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
        <li>⭐ Stars: ${analysis.stars}</li>
        <li>📦 Dependencies: ${analysis.dependencies.length}</li>
        ${analysis.vulnerableDependencies.length > 0 ? `<li style="color: #dc3545;">⚠️ Vulnerable Dependencies: ${analysis.vulnerableDependencies.length}</li>` : ''}
        <li>📝 Languages: ${Object.keys(analysis.languages).join(', ')}</li>
        ${analysis.securityMd ? '<li style="color: #28a745;">✅ Has SECURITY.md</li>' : '<li style="color: #ffc107;">⚠️ No SECURITY.md</li>'}
      </ul>
    </div>
  `;
}

// Update stats
function updateStats(discoveries: any[]) {
  const statsDiv = document.getElementById('stats');
  if (!statsDiv) return;

  if (discoveries.length === 0) {
    statsDiv.style.display = 'none';
    return;
  }

  statsDiv.style.display = 'flex';

  const criticalCount = discoveries.filter((d) => d.severity === 'critical').length;
  const analyzedCount = discoveries.filter((d) => d.status === 'analyzed').length;

  document.getElementById('totalDiscoveries')!.textContent = String(discoveries.length);
  document.getElementById('criticalCount')!.textContent = String(criticalCount);
  document.getElementById('analyzedCount')!.textContent = String(analyzedCount);
}

// Analyze discovery
async function analyzeDiscovery(id: string) {
  const githubToken = (document.getElementById('githubToken') as HTMLInputElement).value;

  if (!githubToken) {
    alert('Please enter a GitHub token to analyze repositories');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.VULN_HUNTER_ANALYZE,
      payload: {
        discoveryId: id,
        githubToken,
      },
    });

    if (response.error) {
      alert(`Error: ${response.error}`);
    } else {
      await loadDiscoveries();
    }
  } catch (error) {
    console.error('Error analyzing discovery:', error);
    alert('Error analyzing discovery. Check console for details.');
  }
}

// Clear discoveries
async function clearDiscoveries() {
  if (!confirm('Clear all discoveries?')) {
    return;
  }

  await chrome.runtime.sendMessage({
    type: MessageType.VULN_HUNTER_CLEAR,
  });

  await loadDiscoveries();
}

// Utility functions
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function extractRepoName(url: string): string {
  const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
  return match ? match[1] : url;
}

// Make analyzeDiscovery global for onclick handlers
(window as any).analyzeDiscovery = analyzeDiscovery;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadDiscoveries();

  document.getElementById('startBtn')?.addEventListener('click', startHunting);
  document.getElementById('clearBtn')?.addEventListener('click', clearDiscoveries);

  // Auto-refresh every 30 seconds
  setInterval(() => {
    loadDiscoveries();
  }, 30000);
});
