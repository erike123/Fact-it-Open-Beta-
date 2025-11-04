# Transforming Fact-It into an OSINT/Threat Intelligence Tool

## Overview

This extension's current capabilities can be leveraged for Open Source Intelligence (OSINT) and Cyber Threat Intelligence (CTI) operations. The real-time monitoring, content extraction, and AI analysis infrastructure provides an excellent foundation.

---

## 🎯 Core OSINT/TI Capabilities to Add

### 1. **IOC (Indicator of Compromise) Extraction**

**What it does:** Automatically extract and validate security indicators from social media posts.

**Implementation:**
```typescript
// Add to content script
interface IOCData {
  ipAddresses: string[];
  domains: string[];
  fileHashes: string[];
  emails: string[];
  cves: string[];
  malwareNames: string[];
  urls: string[];
}

function extractIOCs(text: string): IOCData {
  return {
    ipAddresses: text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [],
    domains: text.match(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi) || [],
    fileHashes: text.match(/\b[a-f0-9]{32,64}\b/gi) || [],
    cves: text.match(/CVE-\d{4}-\d{4,7}/gi) || [],
    emails: text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
    malwareNames: detectMalwareNames(text),
    urls: text.match(/https?:\/\/[^\s]+/g) || [],
  };
}
```

**Use cases:**
- Monitor Twitter for leaked credentials
- Track malware campaign discussions
- Identify C2 (Command & Control) infrastructure
- Detect data breach announcements
- Track vulnerability discussions

---

### 2. **Threat Actor Monitoring**

**What it does:** Track specific accounts, keywords, and patterns associated with threat actors.

**Implementation:**
```typescript
interface ThreatActorProfile {
  accountId: string;
  aliases: string[];
  keywords: string[];
  associatedMalware: string[];
  lastActivity: Date;
  postHistory: Post[];
  networkGraph: Connection[];
}

// Add monitoring rules
const monitoringRules = {
  threatActors: [
    { name: 'APT28', keywords: ['fancy bear', 'sofacy'], accounts: [...] },
    { name: 'Lazarus Group', keywords: ['hidden cobra', 'whois hacking team'], accounts: [...] },
  ],
  malwareCampaigns: [
    { name: 'Emotet', keywords: ['emotet', 'heodo'], indicators: [...] },
    { name: 'Trickbot', keywords: ['trickbot', 'bazarloader'], indicators: [...] },
  ],
  vulnerabilities: [
    { cve: 'CVE-2024-*', severity: 'critical' },
  ]
};
```

**Use cases:**
- Track APT group activities
- Monitor ransomware gang Telegram/Twitter
- Follow security researchers
- Track exploit code sharing
- Monitor underground forum discussions

---

### 3. **Disinformation & Influence Operations Detection**

**What it does:** Detect coordinated inauthentic behavior, bot networks, and propaganda campaigns.

**Implementation:**
```typescript
interface CampaignDetection {
  suspiciousPatterns: {
    coordinatedPosting: boolean;      // Same content, multiple accounts
    botBehavior: boolean;              // High frequency, automated patterns
    astroturfing: boolean;             // Fake grassroots movement
    amplificationNetwork: boolean;     // Coordinated likes/retweets
  };
  metadata: {
    accountAge: number;
    postFrequency: number;
    contentSimilarity: number;         // % match with other posts
    networkSize: number;
  };
}

function detectCoordinatedBehavior(posts: Post[]): CampaignDetection {
  // Analyze posting patterns
  const timeDeltas = calculateTimeDeltas(posts);
  const contentSimilarity = calculateContentSimilarity(posts);
  const accountMetrics = analyzeAccounts(posts.map(p => p.author));

  return {
    suspiciousPatterns: {
      coordinatedPosting: contentSimilarity > 0.85 && timeDeltas.avg < 60,
      botBehavior: accountMetrics.postFrequency > 100, // posts/day
      astroturfing: accountMetrics.accountAge < 30 && accountMetrics.followers < 50,
      amplificationNetwork: detectAmplificationPatterns(posts),
    },
    metadata: accountMetrics,
  };
}
```

**Use cases:**
- Detect election interference campaigns
- Track state-sponsored propaganda
- Identify bot networks
- Monitor information warfare
- Track narrative manipulation

---

### 4. **Real-time Threat Intelligence Feed**

**What it does:** Create a live feed of security-relevant posts with automatic categorization.

**Implementation:**
```typescript
interface ThreatIntelPost {
  id: string;
  timestamp: Date;
  platform: 'twitter' | 'linkedin' | 'telegram' | 'reddit';
  author: {
    handle: string;
    verified: boolean;
    followers: number;
  };
  content: {
    raw: string;
    iocs: IOCData;
    entities: string[];      // Organizations, people, malware
  };
  classification: {
    category: 'malware' | 'vulnerability' | 'breach' | 'apt' | 'general';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    tags: string[];
  };
  analysis: {
    sentiment: 'positive' | 'negative' | 'neutral';
    credibility: number;     // 0-100
    relevance: number;       // 0-100
  };
}

// Background worker sends to threat intel database
async function processThreatIntel(post: Post): Promise<void> {
  const iocs = extractIOCs(post.text);
  const classification = classifyThreat(post.text, iocs);
  const credibility = assessCredibility(post.author);

  // Send to SIEM/TIP
  await sendToSIEM({
    ...post,
    iocs,
    classification,
    credibility,
  });
}
```

**Use cases:**
- Feed data into SIEM (Splunk, ELK, QRadar)
- Integrate with Threat Intelligence Platforms (TIPs)
- Create custom dashboards
- Generate automated alerts
- Build threat intelligence reports

---

### 5. **Keyword & Pattern Monitoring**

**What it does:** Monitor for specific keywords, regex patterns, and semantic concepts.

**Implementation:**
```typescript
interface MonitoringRule {
  id: string;
  name: string;
  type: 'keyword' | 'regex' | 'semantic' | 'ioc';
  pattern: string | RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  alertChannels: ('email' | 'webhook' | 'sms' | 'desktop')[];
  actions: Action[];
}

const securityMonitoringRules: MonitoringRule[] = [
  {
    id: 'rule-001',
    name: 'Data Breach Announcement',
    type: 'semantic',
    pattern: 'database dump leaked credentials breach',
    severity: 'critical',
    alertChannels: ['email', 'webhook'],
    actions: ['archive', 'extract-iocs', 'notify-soc'],
  },
  {
    id: 'rule-002',
    name: 'Zero-day Exploit',
    type: 'keyword',
    pattern: /0day|zero-day|RCE|remote code execution/i,
    severity: 'critical',
    alertChannels: ['sms', 'desktop', 'webhook'],
    actions: ['immediate-alert', 'archive', 'escalate'],
  },
  {
    id: 'rule-003',
    name: 'Ransomware Activity',
    type: 'keyword',
    pattern: /lockbit|blackcat|alphv|ransomware payment|bitcoin wallet/i,
    severity: 'high',
    alertChannels: ['email', 'webhook'],
    actions: ['archive', 'extract-iocs'],
  },
];
```

**Use cases:**
- Monitor brand mentions
- Track competitor intelligence
- Detect early warning signs
- Monitor insider threats
- Track geopolitical events

---

### 6. **Network Mapping & Relationship Analysis**

**What it does:** Build graphs of relationships between accounts, domains, and entities.

**Implementation:**
```typescript
interface NetworkGraph {
  nodes: {
    id: string;
    type: 'account' | 'domain' | 'ip' | 'malware' | 'campaign';
    label: string;
    metadata: Record<string, any>;
  }[];
  edges: {
    source: string;
    target: string;
    type: 'mentions' | 'shares' | 'hosts' | 'uses' | 'associates';
    weight: number;
  }[];
}

function buildNetworkGraph(posts: Post[]): NetworkGraph {
  const graph: NetworkGraph = { nodes: [], edges: [] };

  for (const post of posts) {
    // Add account node
    graph.nodes.push({
      id: post.author.id,
      type: 'account',
      label: post.author.handle,
      metadata: { followers: post.author.followers },
    });

    // Extract and link IOCs
    const iocs = extractIOCs(post.text);
    for (const domain of iocs.domains) {
      graph.nodes.push({ id: domain, type: 'domain', label: domain, metadata: {} });
      graph.edges.push({
        source: post.author.id,
        target: domain,
        type: 'mentions',
        weight: 1,
      });
    }
  }

  return graph;
}
```

**Use cases:**
- Visualize threat actor networks
- Map infrastructure relationships
- Identify command & control servers
- Track malware distribution networks
- Analyze influence networks

---

### 7. **Historical Data Archive & Search**

**What it does:** Store all collected intelligence with full-text search and timeline analysis.

**Implementation:**
```typescript
// Use IndexedDB for local storage or send to external database
interface ArchivedPost {
  id: string;
  timestamp: Date;
  platform: string;
  author: AuthorInfo;
  content: string;
  iocs: IOCData;
  classification: Classification;
  screenshots?: string[];      // Base64 encoded
  metadata: {
    location?: string;
    language: string;
    engagement: { likes: number; shares: number; comments: number };
  };
}

class ThreatIntelArchive {
  async store(post: ArchivedPost): Promise<void> {
    // Store in IndexedDB
    await db.posts.add(post);

    // Optionally send to external archive
    await fetch('https://your-ti-platform.com/api/archive', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  async search(query: string, filters: any): Promise<ArchivedPost[]> {
    // Full-text search with filters
    return await db.posts
      .where('content')
      .startsWith(query)
      .and(post => matchesFilters(post, filters))
      .toArray();
  }

  async getTimeline(startDate: Date, endDate: Date): Promise<ArchivedPost[]> {
    return await db.posts
      .where('timestamp')
      .between(startDate, endDate)
      .sortBy('timestamp');
  }
}
```

**Use cases:**
- Build historical threat databases
- Analyze attack timelines
- Generate incident reports
- Track campaign evolution
- Preserve evidence

---

## 🛠️ Technical Implementation Roadmap

### Phase 1: IOC Extraction & Basic Monitoring (Week 1-2)
- [ ] Add IOC extraction regex patterns
- [ ] Create monitoring rules system
- [ ] Implement basic alerting (browser notifications)
- [ ] Add keyword filtering

### Phase 2: Data Storage & Archival (Week 3-4)
- [ ] Set up IndexedDB for local storage
- [ ] Implement data export (JSON/CSV)
- [ ] Add screenshot capture
- [ ] Create backup/restore functionality

### Phase 3: Advanced Analysis (Week 5-6)
- [ ] Integrate threat intelligence APIs (VirusTotal, AbuseIPDB, CIRCL)
- [ ] Add network graph visualization
- [ ] Implement sentiment analysis
- [ ] Add credibility scoring

### Phase 4: Integration & Automation (Week 7-8)
- [ ] SIEM integration (Splunk, ELK)
- [ ] Webhook alerts
- [ ] API for external tools
- [ ] Automated reporting

---

## 🔌 Integration with Security Tools

### SIEM Integration
```typescript
// Send to Splunk HEC
async function sendToSplunk(event: ThreatIntelPost): Promise<void> {
  await fetch('https://splunk.example.com:8088/services/collector', {
    method: 'POST',
    headers: {
      'Authorization': 'Splunk <your-hec-token>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: event,
      sourcetype: 'fact-it:threat-intel',
      index: 'security',
    }),
  });
}
```

### Threat Intelligence Platform (MISP)
```typescript
// Send to MISP
async function sendToMISP(iocs: IOCData, post: Post): Promise<void> {
  const mispEvent = {
    Event: {
      info: `Social Media IOCs - ${post.id}`,
      threat_level_id: '2', // Medium
      analysis: '1', // Initial
      Attribute: [
        ...iocs.ipAddresses.map(ip => ({ type: 'ip-dst', value: ip })),
        ...iocs.domains.map(domain => ({ type: 'domain', value: domain })),
        ...iocs.fileHashes.map(hash => ({ type: 'sha256', value: hash })),
      ],
    },
  };

  await fetch('https://misp.example.com/events/add', {
    method: 'POST',
    headers: {
      'Authorization': '<your-misp-key>',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mispEvent),
  });
}
```

### Webhook Alerts
```typescript
// Send to Slack/Discord/Teams
async function sendWebhookAlert(alert: Alert): Promise<void> {
  await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 *${alert.severity.toUpperCase()}* Threat Detected`,
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: alert.content },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Platform:*\n${alert.platform}` },
            { type: 'mrkdwn', text: `*Category:*\n${alert.category}` },
          ],
        },
      ],
    }),
  });
}
```

---

## 📊 OSINT Use Case Examples

### 1. **Cybersecurity Company: Monitoring Threat Landscape**
- Track APT groups on Twitter
- Monitor security researcher feeds
- Extract CVEs and exploit code
- Alert on zero-days
- Build threat actor profiles

### 2. **Corporate Security: Brand Protection**
- Monitor brand mentions for phishing
- Detect impersonation accounts
- Track credential leaks
- Monitor employee accounts for compromise
- Detect insider threat indicators

### 3. **Law Enforcement: Criminal Investigation**
- Monitor suspect accounts
- Track dark web market discussions
- Extract evidence
- Build relationship graphs
- Timeline analysis

### 4. **Journalism: Investigative Reporting**
- Track misinformation campaigns
- Monitor influence operations
- Verify claims with sources
- Build narrative timelines
- Identify coordinated behavior

### 5. **Government: National Security**
- Monitor foreign influence operations
- Track state-sponsored propaganda
- Detect coordinated campaigns
- Analyze geopolitical narratives
- Early warning system

---

## 🎓 Training Data & ML Enhancement

### Enhance AI Detection with Security Context
```typescript
// Add security-focused prompts
const threatIntelPrompt = `You are a cybersecurity threat analyst. Analyze this social media post for:

1. Security-relevant information (vulnerabilities, exploits, breaches)
2. Indicators of Compromise (IPs, domains, hashes, malware names)
3. Threat actor attribution hints
4. Campaign patterns
5. Credibility assessment

Post: "${text}"

Return JSON with security analysis.`;
```

### Custom Training for Your Domain
- Fine-tune on security datasets
- Train on your organization's threat intel
- Customize for specific industries
- Adapt to regional threat actors

---

## ⚖️ Legal & Ethical Considerations

### ⚠️ Important Legal Notes:

1. **Data Privacy Laws**
   - GDPR compliance for EU users
   - CCPA compliance for California
   - Local data protection laws

2. **Terms of Service**
   - Respect platform ToS (Twitter, LinkedIn, etc.)
   - Don't violate rate limits
   - Avoid automated scraping violations

3. **Ethical Use**
   - Use only for legitimate security purposes
   - Respect user privacy
   - Don't enable stalking/harassment
   - Follow responsible disclosure for vulnerabilities

4. **Authorization**
   - Ensure you have legal authority for monitoring
   - Document legitimate security purposes
   - Follow organizational policies

---

## 🚀 Getting Started

### Quick Start for OSINT/TI:

1. **Add IOC extraction** to `universal-content.ts`
2. **Create monitoring rules** in background worker
3. **Set up alerts** via browser notifications or webhooks
4. **Store data** in IndexedDB
5. **Export** to your TIP/SIEM

### Recommended Tools to Integrate:
- **VirusTotal API** - IOC reputation
- **AbuseIPDB** - IP reputation
- **CIRCL** - Threat intelligence feeds
- **MISP** - Threat sharing platform
- **TheHive** - Incident response
- **OpenCTI** - Threat intelligence platform

---

## 📚 Resources

### Threat Intelligence Standards:
- STIX/TAXII - Threat intelligence exchange
- MITRE ATT&CK - Adversary tactics framework
- OpenIOC - IOC format standard

### OSINT Frameworks:
- Maltego - Relationship mapping
- Shodan - IoT/infrastructure search
- OSINT Framework - Tool directory

### Training:
- SANS SEC487 - OSINT
- SANS FOR578 - Cyber Threat Intelligence
- OSINT Curious - Free webinars

---

## 💡 Future Enhancements

1. **Machine Learning**
   - Anomaly detection
   - Predictive threat modeling
   - Automated classification

2. **Advanced Analytics**
   - Natural Language Processing
   - Entity extraction
   - Relationship inference

3. **Automation**
   - Auto-response to threats
   - Playbook execution
   - Ticket creation in ITSM

4. **Collaboration**
   - Team sharing
   - Annotations
   - Case management

---

## 🤝 Contributing

If you build OSINT/TI features, consider:
- Open-sourcing (with proper security review)
- Sharing anonymized threat intelligence
- Contributing to MISP communities
- Publishing research findings

---

**Questions? Need help implementing?** Let me know which features you want to prioritize!
