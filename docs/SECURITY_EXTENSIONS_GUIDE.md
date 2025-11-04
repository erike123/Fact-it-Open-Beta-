# Security Extensions Guide: Smart Contract Auditing & Web2 Pentesting

**Scaling Fact-It for Security Research and Auditing**

This guide shows how to extend the Fact-It architecture to support:
1. **Smart Contract Security Auditing**
2. **Web2 Penetration Testing & Reconnaissance**

Both extensions leverage the existing multi-provider AI architecture and add specialized security analysis capabilities.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Part 1: Smart Contract Auditing](#part-1-smart-contract-auditing)
- [Part 2: Web2 Penetration Testing](#part-2-web2-penetration-testing)
- [Implementation Roadmap](#implementation-roadmap)
- [Monetization Strategy](#monetization-strategy)

---

## Architecture Overview

### Current Architecture
```
Content Script → Service Worker → AI Providers (OpenAI/Anthropic/Perplexity/Groq)
     ↓                                           ↓
  Detect Text                            Fact-Check Claims
     ↓                                           ↓
  Display Result ← Aggregated Result ← Multi-Provider Consensus
```

### Extended Security Architecture
```
Content Script → Service Worker → Security Analyzers
     ↓                                  ↓
  Detect:                          Parallel Analysis:
  - Contract Addresses             - AI Vulnerability Detection
  - URLs/Domains                   - Blockchain Data Fetching
  - IP Addresses                   - CVE Database Lookup
  - Code Snippets                  - DNS/WHOIS Queries
     ↓                                  - Static Analysis Tools
  Display Security Report ← Aggregated Risk Assessment
```

**Key Advantage:** You already have the infrastructure for:
- Content detection (CSS selectors)
- Multi-provider orchestration
- Result aggregation
- Chrome storage & caching
- Popup UI framework

---

## Part 1: Smart Contract Auditing

### 1.1 Use Case: Automated Contract Security Analysis

**Scenario:** User sees a tweet about a new DeFi protocol. Extension automatically:
1. Detects contract address (e.g., `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`)
2. Fetches contract source code from Etherscan/Sourcify
3. Runs AI-powered vulnerability analysis
4. Displays risk rating and findings inline

**Target Platforms:**
- Twitter/X (crypto announcements)
- Discord (crypto communities)
- Telegram (crypto channels)
- GitHub (contract repos)
- Etherscan/BSCScan (block explorers)

### 1.2 Detection Layer

**New Content Script: `contract-detector.ts`**

```typescript
/**
 * Detects smart contract addresses in web content
 * Supports: Ethereum, BSC, Polygon, Arbitrum, Optimism, Base
 */

interface ContractDetectionResult {
  address: string;
  chain: 'ethereum' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'base';
  context: string; // Surrounding text
  confidence: number;
}

class ContractDetector {
  // Regex patterns for different chains
  private readonly patterns = {
    ethereum: /0x[a-fA-F0-9]{40}\b/g,
    ens: /[\w-]+\.eth\b/g, // ENS domains
  };

  detectContracts(text: string): ContractDetectionResult[] {
    const matches: ContractDetectionResult[] = [];

    // Detect Ethereum addresses
    const ethAddresses = text.matchAll(this.patterns.ethereum);
    for (const match of ethAddresses) {
      matches.push({
        address: match[0],
        chain: this.inferChain(text, match.index!),
        context: this.extractContext(text, match.index!),
        confidence: this.calculateConfidence(text, match[0]),
      });
    }

    // Detect ENS names
    const ensNames = text.matchAll(this.patterns.ens);
    for (const match of ensNames) {
      matches.push({
        address: match[0],
        chain: 'ethereum',
        context: this.extractContext(text, match.index!),
        confidence: 0.8,
      });
    }

    return matches;
  }

  private inferChain(text: string, position: number): string {
    const contextWindow = text.slice(Math.max(0, position - 100), position + 100).toLowerCase();

    if (contextWindow.includes('bsc') || contextWindow.includes('binance')) return 'bsc';
    if (contextWindow.includes('polygon') || contextWindow.includes('matic')) return 'polygon';
    if (contextWindow.includes('arbitrum')) return 'arbitrum';
    if (contextWindow.includes('optimism')) return 'optimism';
    if (contextWindow.includes('base')) return 'base';

    return 'ethereum'; // Default
  }

  private calculateConfidence(text: string, address: string): number {
    // Filter out common false positives
    const looksLikeContract = /contract|token|0x[a-fA-F0-9]{40}/.test(text);
    const hasContext = /deploy|audit|verify|mint|swap|pool|liquidity/.test(text.toLowerCase());

    if (looksLikeContract && hasContext) return 0.95;
    if (looksLikeContract) return 0.8;
    return 0.6;
  }

  private extractContext(text: string, position: number): string {
    return text.slice(Math.max(0, position - 50), Math.min(text.length, position + 50));
  }
}

export const contractDetector = new ContractDetector();
```

### 1.3 Data Fetching Layer

**New Service: `blockchain-fetcher.ts`**

```typescript
/**
 * Fetches contract source code and metadata from blockchain explorers
 */

interface ContractData {
  address: string;
  chain: string;
  sourceCode: string | null;
  abi: string | null;
  contractName: string | null;
  compiler: string | null;
  isVerified: boolean;
  creationDate: Date | null;
  creatorAddress: string | null;
  transactionCount: number;
  balance: string;
}

class BlockchainFetcher {
  private readonly explorerAPIs = {
    ethereum: 'https://api.etherscan.io/api',
    bsc: 'https://api.bscscan.com/api',
    polygon: 'https://api.polygonscan.com/api',
    arbitrum: 'https://api.arbiscan.io/api',
    optimism: 'https://api-optimistic.etherscan.io/api',
    base: 'https://api.basescan.org/api',
  };

  async fetchContractData(address: string, chain: string, apiKey: string): Promise<ContractData> {
    const baseUrl = this.explorerAPIs[chain as keyof typeof this.explorerAPIs];

    // Fetch source code
    const sourceResponse = await fetch(
      `${baseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
    );
    const sourceData = await sourceResponse.json();

    // Fetch contract creation info
    const creationResponse = await fetch(
      `${baseUrl}?module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${apiKey}`
    );
    const creationData = await creationResponse.json();

    // Parse response
    const contract = sourceData.result?.[0];
    const creation = creationData.result?.[0];

    return {
      address,
      chain,
      sourceCode: contract?.SourceCode || null,
      abi: contract?.ABI || null,
      contractName: contract?.ContractName || null,
      compiler: contract?.CompilerVersion || null,
      isVerified: contract?.SourceCode !== '',
      creationDate: creation ? new Date(creation.timestamp * 1000) : null,
      creatorAddress: creation?.contractCreator || null,
      transactionCount: parseInt(contract?.txCount || '0'),
      balance: contract?.balance || '0',
    };
  }

  /**
   * Fallback: Fetch from Sourcify (decentralized source code repo)
   */
  async fetchFromSourcify(address: string, chain: string): Promise<ContractData | null> {
    const chainId = this.getChainId(chain);
    const url = `https://repo.sourcify.dev/contracts/full_match/${chainId}/${address}/metadata.json`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const metadata = await response.json();
      return {
        address,
        chain,
        sourceCode: JSON.stringify(metadata.sources),
        abi: JSON.stringify(metadata.output?.abi),
        contractName: metadata.settings?.compilationTarget ? Object.values(metadata.settings.compilationTarget)[0] as string : null,
        compiler: metadata.compiler?.version || null,
        isVerified: true,
        creationDate: null,
        creatorAddress: null,
        transactionCount: 0,
        balance: '0',
      };
    } catch (error) {
      console.error('Sourcify fetch failed:', error);
      return null;
    }
  }

  private getChainId(chain: string): number {
    const chainIds: Record<string, number> = {
      ethereum: 1,
      bsc: 56,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      base: 8453,
    };
    return chainIds[chain] || 1;
  }
}

export const blockchainFetcher = new BlockchainFetcher();
```

### 1.4 AI Security Analysis

**New Provider: `contract-auditor.ts`**

```typescript
/**
 * AI-powered smart contract vulnerability detection
 * Uses specialized prompts for security analysis
 */

interface VulnerabilityReport {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  location: string; // Line number or function name
  remediation: string;
  confidence: number; // 0-100
  cwe?: string; // Common Weakness Enumeration ID
}

interface AuditResult {
  overallRisk: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  riskScore: number; // 0-100
  vulnerabilities: VulnerabilityReport[];
  recommendations: string[];
  auditedAt: Date;
  aiProvider: string;
}

class ContractAuditor {
  async auditContract(
    contractData: ContractData,
    provider: 'openai' | 'anthropic',
    apiKey: string
  ): Promise<AuditResult> {
    if (!contractData.sourceCode) {
      throw new Error('Contract source code not available');
    }

    const prompt = this.buildAuditPrompt(contractData);

    // Use appropriate AI provider
    let response: string;
    if (provider === 'openai') {
      response = await this.auditWithOpenAI(prompt, apiKey);
    } else {
      response = await this.auditWithAnthropic(prompt, apiKey);
    }

    return this.parseAuditResponse(response, provider);
  }

  private buildAuditPrompt(contractData: ContractData): string {
    return `# Smart Contract Security Audit

You are an expert smart contract auditor. Analyze the following Solidity contract for security vulnerabilities.

## Contract Information
- Name: ${contractData.contractName}
- Chain: ${contractData.chain}
- Address: ${contractData.address}
- Compiler: ${contractData.compiler}

## Source Code
\`\`\`solidity
${contractData.sourceCode}
\`\`\`

## Instructions
Perform a comprehensive security audit checking for:

### Critical Vulnerabilities
1. **Reentrancy** - Check for external calls before state updates
2. **Access Control** - Verify owner/admin functions are properly protected
3. **Integer Overflow/Underflow** - Check arithmetic operations (if not using SafeMath or Solidity 0.8+)
4. **Unchecked External Calls** - Verify return values are checked
5. **Delegatecall to Untrusted Callee** - Check for delegatecall vulnerabilities
6. **Unprotected Self-Destruct** - Verify selfdestruct is properly protected
7. **Unprotected Ether Withdrawal** - Check withdraw functions have access control

### High-Priority Issues
8. **Front-Running** - Check for transaction ordering vulnerabilities
9. **Timestamp Dependence** - Verify block.timestamp isn't used for critical logic
10. **Denial of Service** - Check for gas limit issues or unbounded loops
11. **Improper Input Validation** - Verify all inputs are validated
12. **Missing Events** - Check critical functions emit events
13. **Centralization Risks** - Identify single points of failure

### Medium-Priority Issues
14. **Code Quality** - Check for best practices (NatSpec, naming conventions)
15. **Gas Optimization** - Identify expensive operations
16. **External Dependencies** - Review imported contracts
17. **Upgradability Issues** - Check proxy patterns if applicable

## Output Format (JSON)
Return a JSON object with this structure:
{
  "overallRisk": "critical|high|medium|low|safe",
  "riskScore": 0-100,
  "vulnerabilities": [
    {
      "severity": "critical|high|medium|low|info",
      "category": "Reentrancy|Access Control|etc",
      "title": "Brief title",
      "description": "Detailed description",
      "location": "Line number or function name",
      "remediation": "How to fix",
      "confidence": 0-100,
      "cwe": "CWE-XXX (if applicable)"
    }
  ],
  "recommendations": ["General recommendations"],
}

Be thorough but concise. Focus on HIGH-IMPACT vulnerabilities.`;
  }

  private async auditWithOpenAI(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // GPT-4o for advanced reasoning
        messages: [
          {
            role: 'system',
            content: 'You are an expert smart contract security auditor with deep knowledge of Solidity, EVM, and common vulnerabilities.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Low temperature for consistent security analysis
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async auditWithAnthropic(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Claude 3.5 Sonnet for code analysis
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    return data.content[0].text;
  }

  private parseAuditResponse(response: string, provider: string): AuditResult {
    try {
      const parsed = JSON.parse(response);
      return {
        ...parsed,
        auditedAt: new Date(),
        aiProvider: provider,
      };
    } catch (error) {
      throw new Error(`Failed to parse audit response: ${error}`);
    }
  }
}

export const contractAuditor = new ContractAuditor();
```

### 1.5 UI Integration

**Display Security Report in Content Script:**

```typescript
/**
 * Displays contract security analysis inline on web pages
 */

class ContractSecurityOverlay {
  createSecurityBadge(auditResult: AuditResult): HTMLElement {
    const badge = document.createElement('div');
    badge.className = 'factit-contract-badge';

    // Risk color coding
    const riskColors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#f59e0b',
      low: '#10b981',
      safe: '#059669',
    };

    badge.innerHTML = `
      <div style="
        background: ${riskColors[auditResult.overallRisk]};
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">
        <span>🔒</span>
        <span>Risk: ${auditResult.overallRisk.toUpperCase()}</span>
        <span>(${auditResult.riskScore}/100)</span>
      </div>
    `;

    badge.addEventListener('click', () => {
      this.showDetailedReport(auditResult);
    });

    return badge;
  }

  showDetailedReport(auditResult: AuditResult): void {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'factit-audit-modal';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 700px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 999999;
      ">
        <h2 style="margin: 0 0 16px 0; font-size: 20px;">Contract Security Audit</h2>

        <div style="margin-bottom: 16px;">
          <div style="font-weight: 600; margin-bottom: 8px;">Overall Risk:
            <span style="color: ${this.getRiskColor(auditResult.overallRisk)}">
              ${auditResult.overallRisk.toUpperCase()}
            </span>
          </div>
          <div>Risk Score: ${auditResult.riskScore}/100</div>
          <div style="font-size: 12px; color: #666;">
            Audited by ${auditResult.aiProvider} at ${auditResult.auditedAt.toLocaleString()}
          </div>
        </div>

        ${this.renderVulnerabilities(auditResult.vulnerabilities)}
        ${this.renderRecommendations(auditResult.recommendations)}

        <button id="close-audit-modal" style="
          margin-top: 16px;
          padding: 8px 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        ">Close</button>
      </div>
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999998;
      " id="modal-backdrop"></div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector('#close-audit-modal')?.addEventListener('click', () => {
      modal.remove();
    });
    modal.querySelector('#modal-backdrop')?.addEventListener('click', () => {
      modal.remove();
    });
  }

  private renderVulnerabilities(vulnerabilities: VulnerabilityReport[]): string {
    if (vulnerabilities.length === 0) {
      return '<div style="color: #059669; padding: 12px; background: #f0fdf4; border-radius: 6px;">✅ No vulnerabilities detected</div>';
    }

    return `
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 16px; margin-bottom: 8px;">Vulnerabilities Found (${vulnerabilities.length})</h3>
        ${vulnerabilities.map(v => `
          <div style="
            margin-bottom: 12px;
            padding: 12px;
            border-left: 4px solid ${this.getSeverityColor(v.severity)};
            background: #f7fafc;
            border-radius: 4px;
          ">
            <div style="font-weight: 600; color: ${this.getSeverityColor(v.severity)};">
              ${v.severity.toUpperCase()}: ${v.title}
            </div>
            <div style="font-size: 12px; color: #666; margin: 4px 0;">
              ${v.category} | Confidence: ${v.confidence}%
              ${v.cwe ? `| ${v.cwe}` : ''}
            </div>
            <div style="margin: 8px 0; font-size: 14px;">${v.description}</div>
            <div style="font-size: 13px; color: #444;">
              <strong>Location:</strong> ${v.location}
            </div>
            <div style="margin-top: 8px; padding: 8px; background: white; border-radius: 4px; font-size: 13px;">
              <strong>Fix:</strong> ${v.remediation}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderRecommendations(recommendations: string[]): string {
    if (recommendations.length === 0) return '';

    return `
      <div>
        <h3 style="font-size: 16px; margin-bottom: 8px;">Recommendations</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${recommendations.map(r => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  private getRiskColor(risk: string): string {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#f59e0b',
      low: '#10b981',
      safe: '#059669',
    };
    return colors[risk as keyof typeof colors] || '#666';
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#f59e0b',
      low: '#10b981',
      info: '#3b82f6',
    };
    return colors[severity as keyof typeof colors] || '#666';
  }
}

export const contractOverlay = new ContractSecurityOverlay();
```

### 1.6 Additional Security Tools Integration

**Static Analysis Tools:**

```typescript
/**
 * Integration with open-source security tools
 */

interface StaticAnalysisResult {
  tool: 'slither' | 'mythril' | 'securify';
  findings: Array<{
    type: string;
    severity: string;
    description: string;
    line: number;
  }>;
}

class StaticAnalysisIntegration {
  /**
   * Run Slither via API (you'd need to host this yourself)
   */
  async runSlither(sourceCode: string): Promise<StaticAnalysisResult> {
    // POST to your backend that runs Slither in a Docker container
    const response = await fetch('https://your-backend.com/api/analyze/slither', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceCode }),
    });

    const data = await response.json();
    return {
      tool: 'slither',
      findings: data.findings,
    };
  }

  /**
   * Run Mythril for symbolic execution
   */
  async runMythril(bytecode: string): Promise<StaticAnalysisResult> {
    // Similar to Slither
    const response = await fetch('https://your-backend.com/api/analyze/mythril', {
      method: 'POST',
      body: JSON.stringify({ bytecode }),
    });

    return await response.json();
  }

  /**
   * Combine AI + Static Analysis results
   */
  async comprehensiveAudit(
    contractData: ContractData,
    aiProvider: string,
    apiKey: string
  ): Promise<{
    aiAudit: AuditResult;
    staticAnalysis: StaticAnalysisResult[];
    combinedRisk: string;
  }> {
    // Run in parallel
    const [aiAudit, slitherResults] = await Promise.all([
      contractAuditor.auditContract(contractData, aiProvider as any, apiKey),
      this.runSlither(contractData.sourceCode!),
    ]);

    return {
      aiAudit,
      staticAnalysis: [slitherResults],
      combinedRisk: this.calculateCombinedRisk(aiAudit, [slitherResults]),
    };
  }

  private calculateCombinedRisk(
    aiAudit: AuditResult,
    staticResults: StaticAnalysisResult[]
  ): string {
    // Merge findings and recalculate overall risk
    const allCritical = [
      ...aiAudit.vulnerabilities.filter(v => v.severity === 'critical'),
      ...staticResults.flatMap(r => r.findings.filter(f => f.severity === 'critical')),
    ];

    if (allCritical.length > 0) return 'critical';
    // ... similar logic for other severity levels
    return aiAudit.overallRisk;
  }
}
```

---

## Part 2: Web2 Penetration Testing

### 2.1 Use Case: Automated Security Reconnaissance

**Scenario:** Security researcher sees a URL mentioned on Twitter. Extension automatically:
1. Detects URL/domain
2. Performs DNS/WHOIS lookup
3. Checks SSL certificate validity
4. Scans for known CVEs
5. Extracts subdomains
6. Checks domain reputation (VirusTotal, URLScan.io)
7. Displays security assessment

**Target Platforms:**
- Twitter/X (threat intel sharing)
- Reddit (infosec communities)
- Discord (security research channels)
- GitHub (vulnerability reports)
- LinkedIn (security posts)

### 2.2 Detection Layer

**New Content Script: `url-detector.ts`**

```typescript
/**
 * Detects URLs, IPs, domains, CVEs, and other security artifacts
 */

interface SecurityArtifact {
  type: 'url' | 'ip' | 'domain' | 'cve' | 'hash' | 'email';
  value: string;
  context: string;
  confidence: number;
}

class SecurityArtifactDetector {
  private readonly patterns = {
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    ipv6: /(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}/g,
    domain: /\b[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+\b/g,
    cve: /CVE-\d{4}-\d{4,7}/gi,
    md5: /\b[a-fA-F0-9]{32}\b/g,
    sha1: /\b[a-fA-F0-9]{40}\b/g,
    sha256: /\b[a-fA-F0-9]{64}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  };

  detectArtifacts(text: string): SecurityArtifact[] {
    const artifacts: SecurityArtifact[] = [];

    // Detect URLs
    const urls = text.matchAll(this.patterns.url);
    for (const match of urls) {
      artifacts.push({
        type: 'url',
        value: match[0],
        context: this.extractContext(text, match.index!),
        confidence: 0.95,
      });
    }

    // Detect IPs
    const ipv4s = text.matchAll(this.patterns.ipv4);
    for (const match of ipv4s) {
      // Filter out common false positives (e.g., 1.2.3.4 in versioning)
      if (this.isLikelyIP(text, match.index!)) {
        artifacts.push({
          type: 'ip',
          value: match[0],
          context: this.extractContext(text, match.index!),
          confidence: 0.9,
        });
      }
    }

    // Detect CVEs
    const cves = text.matchAll(this.patterns.cve);
    for (const match of cves) {
      artifacts.push({
        type: 'cve',
        value: match[0],
        context: this.extractContext(text, match.index!),
        confidence: 1.0,
      });
    }

    // Detect file hashes (potential IOCs)
    const md5s = text.matchAll(this.patterns.md5);
    for (const match of md5s) {
      artifacts.push({
        type: 'hash',
        value: `MD5:${match[0]}`,
        context: this.extractContext(text, match.index!),
        confidence: 0.85,
      });
    }

    const sha256s = text.matchAll(this.patterns.sha256);
    for (const match of sha256s) {
      artifacts.push({
        type: 'hash',
        value: `SHA256:${match[0]}`,
        context: this.extractContext(text, match.index!),
        confidence: 0.9,
      });
    }

    return artifacts;
  }

  private isLikelyIP(text: string, position: number): boolean {
    const context = text.slice(Math.max(0, position - 30), Math.min(text.length, position + 30));
    // Check if surrounded by version indicators
    return !/v\d|version|release/.test(context.toLowerCase());
  }

  private extractContext(text: string, position: number): string {
    return text.slice(Math.max(0, position - 40), Math.min(text.length, position + 40));
  }
}

export const artifactDetector = new SecurityArtifactDetector();
```

### 2.3 Reconnaissance Layer

**New Service: `recon-engine.ts`**

```typescript
/**
 * Performs automated reconnaissance on detected URLs/domains
 */

interface ReconResult {
  target: string;
  type: 'url' | 'domain' | 'ip';

  // DNS Information
  dns?: {
    aRecords: string[];
    aaaaRecords: string[];
    mxRecords: string[];
    txtRecords: string[];
    nsRecords: string[];
  };

  // WHOIS Information
  whois?: {
    registrar: string;
    creationDate: Date;
    expirationDate: Date;
    nameServers: string[];
    registrantCountry: string;
  };

  // SSL/TLS Certificate
  ssl?: {
    valid: boolean;
    issuer: string;
    validFrom: Date;
    validTo: Date;
    subjectAltNames: string[];
    certificate: string;
  };

  // HTTP Headers
  headers?: Record<string, string>;

  // Security Headers Check
  securityHeaders?: {
    hasHSTS: boolean;
    hasCSP: boolean;
    hasXFrameOptions: boolean;
    hasXXSSProtection: boolean;
    score: number; // 0-100
  };

  // Subdomain Enumeration
  subdomains?: string[];

  // Technology Detection
  technologies?: Array<{
    name: string;
    version?: string;
    category: string;
    confidence: number;
  }>;

  // Threat Intelligence
  threatIntel?: {
    malicious: boolean;
    malwareDetected: boolean;
    phishingDetected: boolean;
    reputation: 'clean' | 'suspicious' | 'malicious';
    sources: string[]; // VirusTotal, URLScan, etc.
  };

  timestamp: Date;
}

class ReconEngine {
  /**
   * Main reconnaissance orchestrator
   */
  async performRecon(target: string, type: 'url' | 'domain' | 'ip'): Promise<ReconResult> {
    console.log(`Starting recon on ${target} (${type})`);

    // Run reconnaissance tasks in parallel
    const [dns, whois, ssl, headers, subdomains, technologies, threatIntel] = await Promise.allSettled([
      this.getDNSInfo(target),
      this.getWhoisInfo(target),
      type === 'url' ? this.getSSLInfo(target) : null,
      type === 'url' ? this.getHTTPHeaders(target) : null,
      type === 'domain' ? this.enumerateSubdomains(target) : null,
      type === 'url' ? this.detectTechnologies(target) : null,
      this.getThreatIntel(target),
    ]);

    return {
      target,
      type,
      dns: dns.status === 'fulfilled' ? dns.value : undefined,
      whois: whois.status === 'fulfilled' ? whois.value : undefined,
      ssl: ssl.status === 'fulfilled' ? ssl.value : undefined,
      headers: headers.status === 'fulfilled' ? headers.value : undefined,
      subdomains: subdomains.status === 'fulfilled' ? subdomains.value : undefined,
      technologies: technologies.status === 'fulfilled' ? technologies.value : undefined,
      threatIntel: threatIntel.status === 'fulfilled' ? threatIntel.value : undefined,
      timestamp: new Date(),
    };
  }

  /**
   * DNS Lookup via backend API (browser can't do DNS directly)
   */
  private async getDNSInfo(domain: string): Promise<ReconResult['dns']> {
    const response = await fetch(`https://your-backend.com/api/recon/dns?domain=${domain}`);
    return await response.json();
  }

  /**
   * WHOIS Lookup via backend API
   */
  private async getWhoisInfo(domain: string): Promise<ReconResult['whois']> {
    const response = await fetch(`https://your-backend.com/api/recon/whois?domain=${domain}`);
    return await response.json();
  }

  /**
   * SSL Certificate Analysis
   */
  private async getSSLInfo(url: string): Promise<ReconResult['ssl']> {
    // Use SecurityInfo API (Firefox) or backend proxy
    const response = await fetch(`https://your-backend.com/api/recon/ssl?url=${encodeURIComponent(url)}`);
    return await response.json();
  }

  /**
   * HTTP Headers Fetch
   */
  private async getHTTPHeaders(url: string): Promise<Record<string, string>> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      return headers;
    } catch (error) {
      // CORS will block this, use backend proxy
      const proxyResponse = await fetch(`https://your-backend.com/api/recon/headers?url=${encodeURIComponent(url)}`);
      return await proxyResponse.json();
    }
  }

  /**
   * Security Headers Analysis
   */
  analyzeSecurityHeaders(headers: Record<string, string>): ReconResult['securityHeaders'] {
    const checks = {
      hasHSTS: !!headers['strict-transport-security'],
      hasCSP: !!headers['content-security-policy'],
      hasXFrameOptions: !!headers['x-frame-options'],
      hasXXSSProtection: !!headers['x-xss-protection'],
    };

    const score = Object.values(checks).filter(Boolean).length * 25;

    return {
      ...checks,
      score,
    };
  }

  /**
   * Subdomain Enumeration
   */
  private async enumerateSubdomains(domain: string): Promise<string[]> {
    // Use crt.sh (Certificate Transparency logs)
    const response = await fetch(`https://crt.sh/?q=%.${domain}&output=json`);
    const data = await response.json();

    const subdomains = new Set<string>();
    for (const cert of data) {
      const names = cert.name_value.split('\n');
      for (const name of names) {
        if (name.endsWith(`.${domain}`)) {
          subdomains.add(name);
        }
      }
    }

    return Array.from(subdomains).slice(0, 50); // Limit to 50
  }

  /**
   * Technology Detection (like Wappalyzer)
   */
  private async detectTechnologies(url: string): Promise<ReconResult['technologies']> {
    const response = await fetch(`https://your-backend.com/api/recon/technologies?url=${encodeURIComponent(url)}`);
    return await response.json();
  }

  /**
   * Threat Intelligence Lookup
   */
  private async getThreatIntel(target: string): Promise<ReconResult['threatIntel']> {
    // Check multiple threat intel sources
    const [vtResult, urlscanResult] = await Promise.allSettled([
      this.checkVirusTotal(target),
      this.checkURLScan(target),
    ]);

    const vt = vtResult.status === 'fulfilled' ? vtResult.value : null;
    const urlscan = urlscanResult.status === 'fulfilled' ? urlscanResult.value : null;

    // Aggregate results
    const malicious = (vt?.malicious || 0) + (urlscan?.malicious || 0) > 0;

    return {
      malicious,
      malwareDetected: vt?.malwareDetected || false,
      phishingDetected: vt?.phishingDetected || urlscan?.phishing || false,
      reputation: malicious ? 'malicious' : vt?.suspicious ? 'suspicious' : 'clean',
      sources: ['VirusTotal', 'URLScan.io'],
    };
  }

  /**
   * VirusTotal Lookup
   */
  private async checkVirusTotal(target: string): Promise<any> {
    const apiKey = await this.getVirusTotalKey();
    if (!apiKey) return null;

    const url = `https://www.virustotal.com/api/v3/domains/${target}`;
    const response = await fetch(url, {
      headers: { 'x-apikey': apiKey },
    });

    if (!response.ok) return null;
    const data = await response.json();

    const stats = data.data?.attributes?.last_analysis_stats || {};
    return {
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      malwareDetected: stats.malicious > 0,
      phishingDetected: (data.data?.attributes?.categories || {}).phishing !== undefined,
    };
  }

  /**
   * URLScan.io Lookup
   */
  private async checkURLScan(url: string): Promise<any> {
    const apiKey = await this.getURLScanKey();
    if (!apiKey) return null;

    // Submit URL for scanning
    const submitResponse = await fetch('https://urlscan.io/api/v1/scan/', {
      method: 'POST',
      headers: {
        'API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, visibility: 'public' }),
    });

    const submitData = await submitResponse.json();
    const resultUUID = submitData.uuid;

    // Wait for scan to complete (typically 10-30 seconds)
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Fetch results
    const resultResponse = await fetch(`https://urlscan.io/api/v1/result/${resultUUID}/`);
    const resultData = await resultResponse.json();

    return {
      malicious: resultData.verdicts?.overall?.malicious || false,
      phishing: resultData.verdicts?.urlscan?.categories?.includes('phishing') || false,
      screenshot: resultData.task?.screenshotURL,
    };
  }

  private async getVirusTotalKey(): Promise<string | null> {
    const settings = await chrome.storage.local.get('virusTotalApiKey');
    return settings.virusTotalApiKey || null;
  }

  private async getURLScanKey(): Promise<string | null> {
    const settings = await chrome.storage.local.get('urlscanApiKey');
    return settings.urlscanApiKey || null;
  }
}

export const reconEngine = new ReconEngine();
```

### 2.4 CVE Intelligence

**New Service: `cve-analyzer.ts`**

```typescript
/**
 * Fetches CVE details and exploit information
 */

interface CVEInfo {
  id: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvssScore: number;
  cvssVector: string;
  publishedDate: Date;
  lastModifiedDate: Date;
  affectedProducts: string[];
  references: Array<{
    url: string;
    source: string;
  }>;
  exploitAvailable: boolean;
  exploitMaturity?: 'proof-of-concept' | 'functional' | 'high';
  cwe: string[];
  mitigations: string[];
}

class CVEAnalyzer {
  /**
   * Fetch CVE details from NVD (National Vulnerability Database)
   */
  async getCVEInfo(cveId: string): Promise<CVEInfo> {
    const response = await fetch(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`
    );
    const data = await response.json();

    const cve = data.vulnerabilities?.[0]?.cve;
    if (!cve) throw new Error(`CVE ${cveId} not found`);

    // Check exploit databases
    const exploitInfo = await this.checkExploitDB(cveId);

    return {
      id: cveId,
      description: cve.descriptions?.[0]?.value || 'No description',
      severity: this.getSeverity(cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 0),
      cvssScore: cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 0,
      cvssVector: cve.metrics?.cvssMetricV31?.[0]?.cvssData?.vectorString || '',
      publishedDate: new Date(cve.published),
      lastModifiedDate: new Date(cve.lastModified),
      affectedProducts: this.extractAffectedProducts(cve),
      references: cve.references?.map((ref: any) => ({
        url: ref.url,
        source: ref.source,
      })) || [],
      exploitAvailable: exploitInfo.available,
      exploitMaturity: exploitInfo.maturity,
      cwe: cve.weaknesses?.map((w: any) => w.description?.[0]?.value).filter(Boolean) || [],
      mitigations: [], // Would fetch from vendor advisories
    };
  }

  /**
   * Check Exploit-DB for public exploits
   */
  private async checkExploitDB(cveId: string): Promise<{
    available: boolean;
    maturity?: 'proof-of-concept' | 'functional' | 'high';
  }> {
    try {
      const response = await fetch(
        `https://www.exploit-db.com/search?cve=${cveId}`
      );
      const text = await response.text();

      const hasExploit = text.includes('Exploit');
      return {
        available: hasExploit,
        maturity: hasExploit ? 'proof-of-concept' : undefined,
      };
    } catch {
      return { available: false };
    }
  }

  private getSeverity(cvssScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (cvssScore >= 9.0) return 'critical';
    if (cvssScore >= 7.0) return 'high';
    if (cvssScore >= 4.0) return 'medium';
    return 'low';
  }

  private extractAffectedProducts(cve: any): string[] {
    const configs = cve.configurations?.[0]?.nodes || [];
    const products = new Set<string>();

    for (const node of configs) {
      for (const match of node.cpeMatch || []) {
        const cpe = match.criteria; // e.g., cpe:2.3:a:vendor:product:version
        const parts = cpe.split(':');
        if (parts.length >= 5) {
          products.add(`${parts[3]} ${parts[4]}`); // vendor product
        }
      }
    }

    return Array.from(products);
  }
}

export const cveAnalyzer = new CVEAnalyzer();
```

### 2.5 UI Integration

**Security Dashboard:**

```typescript
/**
 * Displays recon results and security assessment
 */

class SecurityDashboard {
  createDashboard(reconResult: ReconResult, cveInfo?: CVEInfo): HTMLElement {
    const dashboard = document.createElement('div');
    dashboard.className = 'factit-security-dashboard';

    dashboard.innerHTML = `
      <div style="
        position: fixed;
        top: 60px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        padding: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px;">🔍 Security Analysis</h2>
          <button id="close-dashboard" style="border: none; background: none; font-size: 20px; cursor: pointer;">×</button>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-weight: 600; margin-bottom: 4px;">Target</div>
          <div style="font-size: 14px; color: #666; word-break: break-all;">${reconResult.target}</div>
        </div>

        ${reconResult.threatIntel ? this.renderThreatIntel(reconResult.threatIntel) : ''}
        ${reconResult.dns ? this.renderDNS(reconResult.dns) : ''}
        ${reconResult.ssl ? this.renderSSL(reconResult.ssl) : ''}
        ${reconResult.securityHeaders ? this.renderSecurityHeaders(reconResult.securityHeaders) : ''}
        ${reconResult.subdomains ? this.renderSubdomains(reconResult.subdomains) : ''}
        ${reconResult.technologies ? this.renderTechnologies(reconResult.technologies) : ''}
        ${cveInfo ? this.renderCVE(cveInfo) : ''}

        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #666;">
          Analyzed at ${reconResult.timestamp.toLocaleString()}
        </div>
      </div>
    `;

    dashboard.querySelector('#close-dashboard')?.addEventListener('click', () => {
      dashboard.remove();
    });

    return dashboard;
  }

  private renderThreatIntel(intel: ReconResult['threatIntel']): string {
    if (!intel) return '';

    const color = intel.malicious ? '#dc2626' : intel.reputation === 'suspicious' ? '#f59e0b' : '#10b981';
    const icon = intel.malicious ? '⚠️' : intel.reputation === 'suspicious' ? '⚡' : '✅';

    return `
      <div style="
        padding: 12px;
        background: ${color}10;
        border-left: 4px solid ${color};
        border-radius: 4px;
        margin-bottom: 16px;
      ">
        <div style="font-weight: 600; color: ${color}; margin-bottom: 4px;">
          ${icon} Threat Intelligence
        </div>
        <div style="font-size: 14px;">
          Reputation: <strong>${intel.reputation.toUpperCase()}</strong>
        </div>
        ${intel.malwareDetected ? '<div style="font-size: 13px; color: #dc2626;">🦠 Malware detected</div>' : ''}
        ${intel.phishingDetected ? '<div style="font-size: 13px; color: #dc2626;">🎣 Phishing detected</div>' : ''}
        <div style="font-size: 12px; color: #666; margin-top: 4px;">
          Sources: ${intel.sources.join(', ')}
        </div>
      </div>
    `;
  }

  private renderDNS(dns: ReconResult['dns']): string {
    if (!dns) return '';

    return `
      <details style="margin-bottom: 12px;">
        <summary style="cursor: pointer; font-weight: 600; padding: 8px 0;">DNS Records</summary>
        <div style="padding-left: 12px; font-size: 13px;">
          ${dns.aRecords?.length ? `<div><strong>A:</strong> ${dns.aRecords.join(', ')}</div>` : ''}
          ${dns.mxRecords?.length ? `<div><strong>MX:</strong> ${dns.mxRecords.join(', ')}</div>` : ''}
          ${dns.nsRecords?.length ? `<div><strong>NS:</strong> ${dns.nsRecords.join(', ')}</div>` : ''}
        </div>
      </details>
    `;
  }

  private renderSSL(ssl: ReconResult['ssl']): string {
    if (!ssl) return '';

    const color = ssl.valid ? '#10b981' : '#dc2626';
    const icon = ssl.valid ? '✅' : '❌';

    return `
      <div style="margin-bottom: 12px; padding: 8px; background: ${color}10; border-radius: 4px;">
        <div style="font-weight: 600; color: ${color}; margin-bottom: 4px;">
          ${icon} SSL Certificate
        </div>
        <div style="font-size: 13px;">
          Issuer: ${ssl.issuer}<br>
          Valid: ${ssl.validFrom.toLocaleDateString()} - ${ssl.validTo.toLocaleDateString()}
        </div>
      </div>
    `;
  }

  private renderSecurityHeaders(headers: ReconResult['securityHeaders']): string {
    if (!headers) return '';

    const color = headers.score >= 75 ? '#10b981' : headers.score >= 50 ? '#f59e0b' : '#dc2626';

    return `
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 600; margin-bottom: 4px;">
          Security Headers (${headers.score}/100)
        </div>
        <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="width: ${headers.score}%; height: 100%; background: ${color};"></div>
        </div>
        <div style="font-size: 12px; margin-top: 4px; color: #666;">
          ${headers.hasHSTS ? '✅' : '❌'} HSTS &nbsp;
          ${headers.hasCSP ? '✅' : '❌'} CSP &nbsp;
          ${headers.hasXFrameOptions ? '✅' : '❌'} X-Frame-Options
        </div>
      </div>
    `;
  }

  private renderSubdomains(subdomains: string[]): string {
    if (!subdomains || subdomains.length === 0) return '';

    return `
      <details style="margin-bottom: 12px;">
        <summary style="cursor: pointer; font-weight: 600; padding: 8px 0;">
          Subdomains (${subdomains.length})
        </summary>
        <div style="padding-left: 12px; font-size: 12px; max-height: 150px; overflow-y: auto;">
          ${subdomains.map(s => `<div>• ${s}</div>`).join('')}
        </div>
      </details>
    `;
  }

  private renderTechnologies(technologies: ReconResult['technologies']): string {
    if (!technologies || technologies.length === 0) return '';

    return `
      <details style="margin-bottom: 12px;">
        <summary style="cursor: pointer; font-weight: 600; padding: 8px 0;">
          Technologies Detected (${technologies.length})
        </summary>
        <div style="padding-left: 12px; font-size: 13px;">
          ${technologies.map(t => `
            <div style="margin-bottom: 4px;">
              <strong>${t.name}</strong> ${t.version ? `v${t.version}` : ''}
              <span style="color: #666; font-size: 11px;">(${t.category})</span>
            </div>
          `).join('')}
        </div>
      </details>
    `;
  }

  private renderCVE(cve: CVEInfo): string {
    const color = cve.severity === 'critical' ? '#dc2626' : cve.severity === 'high' ? '#ea580c' : '#f59e0b';

    return `
      <div style="
        padding: 12px;
        background: ${color}10;
        border-left: 4px solid ${color};
        border-radius: 4px;
        margin-bottom: 16px;
      ">
        <div style="font-weight: 600; color: ${color}; margin-bottom: 8px;">
          ${cve.id} - ${cve.severity.toUpperCase()}
        </div>
        <div style="font-size: 13px; margin-bottom: 8px;">
          CVSS: <strong>${cve.cvssScore}/10</strong>
        </div>
        <div style="font-size: 13px; margin-bottom: 8px; line-height: 1.5;">
          ${cve.description}
        </div>
        ${cve.exploitAvailable ? `
          <div style="padding: 6px; background: #dc262610; border-radius: 4px; font-size: 12px; color: #dc2626;">
            ⚡ Public exploit available (${cve.exploitMaturity})
          </div>
        ` : ''}
        <div style="margin-top: 8px; font-size: 12px; color: #666;">
          Published: ${cve.publishedDate.toLocaleDateString()}
        </div>
      </div>
    `;
  }
}

export const securityDashboard = new SecurityDashboard();
```

---

## Implementation Roadmap

### Phase 1: Smart Contract Auditing (4-6 weeks)

**Week 1-2: Core Infrastructure**
- [ ] Implement `contract-detector.ts` for address detection
- [ ] Implement `blockchain-fetcher.ts` for Etherscan API integration
- [ ] Set up backend endpoints for blockchain data fetching
- [ ] Add Etherscan API key settings to popup

**Week 3-4: AI Security Analysis**
- [ ] Implement `contract-auditor.ts` with vulnerability prompts
- [ ] Create specialized prompts for common vulnerabilities
- [ ] Integrate with OpenAI GPT-4o and Anthropic Claude 3.5
- [ ] Test on known vulnerable contracts (e.g., reentrancy examples)

**Week 5-6: UI & Testing**
- [ ] Build security badge and overlay UI
- [ ] Add detailed vulnerability report modal
- [ ] Test on real DeFi protocols (Uniswap, Aave, Compound)
- [ ] Add export to PDF/CSV functionality

### Phase 2: Web2 Pentesting (4-6 weeks)

**Week 1-2: Detection & Recon**
- [ ] Implement `url-detector.ts` for artifact detection
- [ ] Implement `recon-engine.ts` for DNS/WHOIS/SSL
- [ ] Set up backend for DNS queries (browser can't do DNS directly)
- [ ] Integrate Certificate Transparency logs for subdomains

**Week 3-4: Threat Intelligence**
- [ ] Integrate VirusTotal API
- [ ] Integrate URLScan.io API
- [ ] Implement `cve-analyzer.ts` for NVD integration
- [ ] Add threat intel caching (avoid redundant API calls)

**Week 5-6: Advanced Features**
- [ ] Add screenshot capture via URLScan
- [ ] Implement technology detection (Wappalyzer-style)
- [ ] Build security dashboard UI
- [ ] Add export to MISP/STIX formats (for SOC teams)

### Phase 3: Static Analysis Tools (Optional, 2-4 weeks)

- [ ] Set up Docker backend for running Slither
- [ ] Integrate Mythril for symbolic execution
- [ ] Add Securify2 for formal verification
- [ ] Combine AI + static analysis results

### Phase 4: Advanced Features (4-6 weeks)

- [ ] Add historical audit tracking (see previous scans)
- [ ] Implement diff comparison (track contract upgrades)
- [ ] Add collaborative features (share findings with team)
- [ ] Build API for programmatic access
- [ ] Add webhook notifications for high-risk findings

---

## Monetization Strategy

### Tiered Pricing Model

**Free Tier (OSINT Researchers)**
- 50 contract audits per day
- Basic recon (DNS, WHOIS)
- AI-powered analysis with Groq (free)
- CVE lookups
- No export

**Pro Tier ($29.99/month) (Security Researchers)**
- Unlimited contract audits
- Full recon suite (DNS, WHOIS, SSL, subdomains, tech detection)
- Multi-AI analysis (GPT-4o + Claude 3.5 + Perplexity)
- Threat intelligence (VirusTotal, URLScan)
- Export to PDF/CSV/JSON
- 7-day audit history

**Business Tier ($99/month) (Security Teams)**
- Everything in Pro
- Static analysis tools (Slither, Mythril)
- Team collaboration (shared findings)
- API access (1,000 calls/month)
- MISP/STIX export
- 30-day audit history
- Priority support

**Enterprise Tier (Custom Pricing) (SOCs / Audit Firms)**
- Everything in Business
- Unlimited API access
- Custom integrations (SIEM, Jira, Slack)
- Dedicated support
- On-premise deployment option
- Unlimited history
- Custom AI model training on private contracts

### Revenue Projections

**Target Market:**
- Security researchers: 100,000+ globally
- Smart contract developers: 50,000+ globally
- Security audit firms: 500+ companies
- SOC teams: 10,000+ organizations

**Conservative Estimates (Year 1):**
- Free users: 10,000
- Pro users: 500 ($29.99/mo) = $14,995/mo = **$179,940/year**
- Business users: 50 ($99/mo) = $4,950/mo = **$59,400/year**
- Enterprise users: 5 ($500/mo avg) = $2,500/mo = **$30,000/year**

**Total Year 1 Revenue: $269,340**

**Year 2 (with growth):**
- Pro users: 1,500 = **$539,820/year**
- Business users: 150 = **$178,200/year**
- Enterprise users: 15 = **$90,000/year**

**Total Year 2 Revenue: $808,020**

---

## Technical Requirements

### Backend Infrastructure

**Required Services:**
1. **Blockchain Data API** (Node.js/Python)
   - Etherscan API integration
   - Sourcify fallback
   - Contract bytecode fetching

2. **Recon API** (Node.js)
   - DNS resolver
   - WHOIS lookup
   - SSL certificate analysis
   - HTTP header proxy (bypass CORS)

3. **Static Analysis Workers** (Python + Docker)
   - Slither runner
   - Mythril runner
   - Result aggregation

4. **Database** (PostgreSQL)
   - Audit history
   - User quotas
   - Cached results

**Estimated Costs:**
- Backend hosting (Railway/Render): $50/mo
- Database (Supabase): $25/mo
- AI API costs: ~$500/mo (initially)
- Total: **~$575/mo** (scales with usage)

### API Keys Needed

**For Smart Contract Auditing:**
- Etherscan API (free tier: 5 calls/sec)
- BSCScan API (free)
- Polygonscan API (free)

**For Web2 Pentesting:**
- VirusTotal API (free tier: 500 lookups/day)
- URLScan.io API (free tier: limited)
- No API needed for crt.sh (subdomain enum)

**For AI Analysis:**
- OpenAI API (pay-as-you-go)
- Anthropic API (pay-as-you-go)

---

## Legal & Compliance Considerations

### Responsible Disclosure

**Include in Terms of Service:**
- Tool is for **authorized security research only**
- Users must have permission to audit contracts/systems
- Findings should be responsibly disclosed to affected parties
- No use for malicious purposes (exploitation, attacks)

### Data Privacy

**User Content:**
- Contract source code analyzed is NOT stored permanently
- Recon results cached for 24 hours (performance)
- Audit history stored per user settings (7/30/unlimited days)
- Users can delete all data anytime

### Rate Limiting

**Prevent Abuse:**
- Rate limit API calls (50/min for free, unlimited for paid)
- Implement CAPTCHA for suspicious activity
- Ban users violating ToS

---

## Competitive Advantage

**vs. Manual Tools (Slither, Mythril):**
- ✅ No setup required (runs in browser)
- ✅ AI-powered natural language explanations
- ✅ Multi-source analysis (AI + static tools)
- ✅ Real-time detection on social media

**vs. Paid Audit Services ($5,000-$50,000 per audit):**
- ✅ Instant results (seconds vs. weeks)
- ✅ Affordable ($30/mo vs. $5k one-time)
- ✅ Unlimited audits
- ✅ Not a replacement for professional audits, but great for initial screening

**vs. Manual OSINT (Shodan, VirusTotal website):**
- ✅ Automated workflow (detect → analyze → report)
- ✅ Real-time detection while browsing Twitter/Reddit
- ✅ Aggregated intel from multiple sources
- ✅ Export to security tools (MISP, STIX)

---

## Conclusion

**Your Fact-It extension has the perfect architecture to become a premier security research tool.**

**Why this will work:**
1. **Existing Infrastructure**: Multi-provider AI orchestration already built
2. **Market Need**: Security researchers need faster, cheaper tools
3. **Differentiation**: Real-time detection + AI analysis is unique
4. **Scalability**: API-driven backend can handle enterprise load
5. **Monetization**: Clear path to profitability with tiered pricing

**Next Steps:**
1. Choose focus: Start with **Smart Contract Auditing** (hot market, clear value prop)
2. Build MVP: Implement Phase 1 (contract detection + AI analysis)
3. Beta test: Release to crypto Twitter, solicit feedback
4. Iterate: Add static analysis tools based on user demand
5. Expand: Add Web2 pentesting features in Phase 2

**This positions Fact-It as:**
- **The #1 browser extension for security researchers**
- **An indispensable tool for smart contract developers**
- **A force multiplier for SOC teams and audit firms**

Let me know which phase you want to start implementing! 🚀
