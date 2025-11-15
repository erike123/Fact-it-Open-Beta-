# 🛡️ How to Use Your Security Features

## Overview

Your Fact-It extension has **3 major security systems** built in:

1. 🚨 **Phishing Detection** - Automatic, works now
2. 🔍 **Vulnerability Hunter** - Manual, requires GitHub token
3. 🏢 **Threat Intelligence** - Backend ready, add UI as needed

---

## 1. 🚨 Phishing & Scam Detection

### **Status:** ✅ WORKS AUTOMATICALLY RIGHT NOW

### **What It Protects Against:**

**Crypto Scams:**
- ✅ Fake giveaways ("Send 1 BTC get 2 BTC back")
- ✅ Elon Musk impersonation scams
- ✅ Wallet seed phrase requests
- ✅ Fake airdrops
- ✅ Double-your-crypto scams

**Phishing:**
- ✅ Fake account verification
- ✅ Suspicious login requests
- ✅ Urgent action required messages
- ✅ Account suspended warnings

**Typosquatting:**
- ✅ paypa1.com (PayPal)
- ✅ faceb00k.com (Facebook)
- ✅ g00gle.com (Google)
- ✅ amaz0n.com (Amazon)
- ✅ netfIix.com (Netflix)

**Malicious URLs:**
- ✅ Suspicious TLDs (.tk, .ml, .ga, .cf, .gq)
- ✅ IP addresses in URLs
- ✅ Homograph attacks (аpple.com with Cyrillic 'а')
- ✅ URLs with "verify-", "secure-", "account-" keywords

**Other Scams:**
- ✅ Job scams ("Work from home $5000/week")
- ✅ Romance scams ("Stranded need money")
- ✅ Fake giveaways (iPhone, gift cards)
- ✅ Investment scams (guaranteed returns)

### **How to Use:**

**Step 1: No Setup Required!**
The extension is already built with phishing detection enabled.

**Step 2: Browse Social Media**
1. Go to Twitter/X, LinkedIn, or Facebook
2. Browse normally

**Step 3: Fact-Check Any Post**
1. Click a post you want to verify
2. Click the fact-check button (added by extension)
3. Wait 5-10 seconds

**Step 4: See Results**
If phishing/scam detected:
```
🚨 DANGER: PHISHING/SCAM DETECTED 🚨

🚨 CRYPTO SCAM: This content matches cryptocurrency scam patterns
⚠️ PHISHING: URL(s) detected that impersonate legitimate websites
⚠️ TYPOSQUATTING: Domain uses character substitution (paypa1.com)

⚠️ SAFETY RECOMMENDATIONS:
DO NOT click on any links in this content
DO NOT enter personal information or passwords
DO NOT send cryptocurrency to any addresses mentioned
Report this content to the platform

Verdict: FALSE (99% confidence)
```

If no threats detected:
```
✅ No phishing or scams detected

URL Analysis:
- 1 URL found: https://legitsite.com/article
- No suspicious patterns
- Clean URL structure

Verdict: (Continues with normal fact-check)
```

### **Real-World Examples:**

**Example 1: Crypto Scam**
```
Post: "🎉 Elon Musk Giveaway! Send 0.5 BTC to bc1qxy2k... and get 1.0 BTC back!"

Detection:
🚨 CRYPTO SCAM: Matches "Elon Musk giveaway" pattern
🚨 CRYPTO SCAM: Contains "send BTC get back" pattern
⚠️ Bitcoin address in suspicious context

Verdict: FALSE (99% confidence)
```

**Example 2: Phishing URL**
```
Post: "⚠️ Your Netflix account has been suspended. Update payment:
https://netflix-account-verify.tk/update"

Detection:
⚠️ PHISHING: Suspicious TLD (.tk) commonly used in scams
⚠️ TYPOSQUATTING: Domain contains "verify" keyword
⚠️ NOT official Netflix domain

Verdict: FALSE (99% confidence)
```

**Example 3: Legitimate Content**
```
Post: "Check out my blog about Python programming:
https://myblog.com/python-tips"

Detection:
✅ No suspicious patterns detected
✅ Clean URL structure
✅ No scam keywords

Verdict: (Normal fact-check proceeds)
```

### **Pattern Database:**

Your extension detects **100+ scam patterns** including:

**Crypto Scams (25 patterns):**
- "send.*btc.*get.*back"
- "double.*bitcoin"
- "elon.*musk.*giveaway"
- "wallet.*recovery.*phrase"
- "claim.*airdrop.*immediately"
- "connect.*wallet.*verify"
- ... and 19 more

**Phishing (30 patterns):**
- "verify.*account.*suspended"
- "urgent.*action.*required"
- "unusual.*activity.*detected"
- "click.*here.*confirm.*identity"
- "account.*will.*be.*closed"
- ... and 25 more

**Fake Giveaways (15 patterns):**
- "free.*iphone.*limited.*time"
- "won.*gift.*card.*claim.*now"
- "selected.*winner.*click.*here"
- ... and 12 more

**Job Scams (10 patterns):**
- "work.*from.*home.*\\$[0-9]{4,}"
- "easy.*money.*no.*experience"
- "earn.*\\$[0-9]+.*per.*day"
- ... and 7 more

**Romance Scams (10 patterns):**
- "stranded.*need.*money.*urgently"
- "send.*money.*emergency"
- "western.*union.*immediately"
- ... and 7 more

**Impersonation (10 patterns):**
- Detects impersonation of: PayPal, Facebook, Google, Amazon, Netflix, Apple, Microsoft, Twitter, Instagram, TikTok

---

## 2. 🔍 Vulnerability Hunter

### **Status:** ✅ FULLY FUNCTIONAL (Requires GitHub Token)

### **What It Does:**

**Monitors:**
- 🐦 Twitter/X for security researchers posting vulnerabilities
- 🔧 GitHub issues, commits, and SECURITY.md files
- 📊 CVE announcements (CVE-2024-*, CVE-2025-*)
- 🚨 Zero-day disclosures
- 💥 Exploit releases
- 🔓 Smart contract vulnerabilities

**Analyzes:**
- ⭐ Repository popularity (stars, forks)
- 📦 Dependencies (npm, Python, Rust, Java)
- ⚠️ Vulnerable dependencies (known CVEs)
- 📝 Security policies (SECURITY.md presence)
- 🔍 Programming languages used

**Scores:**
- 🔴 **Critical**: Active exploitation, high impact
- 🟠 **High**: Serious vulnerabilities, needs immediate attention
- 🟡 **Medium**: Important but not critical
- 🟢 **Low**: Minor issues, low impact

### **How to Use:**

**Step 1: Get FREE GitHub Token**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Classic"
3. Name it: `Fact-It Vulnerability Hunter`
4. Select scopes:
   - ✅ `public_repo` (access public repositories)
   - ✅ `read:org` (read organization data)
5. Click "Generate token"
6. Copy the token (starts with `ghp_...`)
7. **Save it somewhere safe** (you'll need it every time)

**Step 2: Access Vulnerability Hunter**

**Option A: Add Tab to Popup (Recommended)**

1. Open `src/popup/popup.html`
2. Add a new tab:
   ```html
   <button class="tab-button" data-tab="vuln-hunter">
     🔍 Vulnerability Hunter
   </button>
   ```
3. Add tab content:
   ```html
   <div id="vuln-hunter-tab" class="tab-content">
     <iframe src="vuln-hunter.html" style="width:100%;height:500px;border:none;"></iframe>
   </div>
   ```
4. Rebuild: `npm run build`
5. Reload extension
6. Click extension icon → Click "Vulnerability Hunter" tab

**Option B: Direct Access (Quick Test)**

1. Get your extension ID:
   - Go to `chrome://extensions`
   - Find Fact-It
   - Copy the ID (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

2. Navigate to:
   ```
   chrome-extension://YOUR_EXTENSION_ID/src/popup/vuln-hunter.html
   ```

**Step 3: Configure Keywords (Optional)**

Default keywords monitored:
- "vulnerability discovered"
- "CVE-2024"
- "CVE-2025"
- "zero-day"
- "exploit released"
- "security advisory"
- "smart contract"
- "blockchain exploit"

You can add custom keywords in the UI.

**Step 4: Start Hunting**

1. Enter your GitHub token
2. (Optional) Add Twitter bearer token for Twitter monitoring
3. Click "🚀 Start Hunting"
4. Wait 10-30 seconds
5. See discoveries appear in real-time

**Step 5: Analyze Discoveries**

For each discovery:
1. See severity badge (Critical/High/Medium/Low)
2. See source (Twitter or GitHub)
3. Click "Analyze" button
4. View detailed report:
   - Repository details
   - Dependencies
   - Vulnerable dependencies
   - Star count
   - Programming languages
   - Security policy

### **Real-World Use Cases:**

**Use Case 1: Bug Bounty Hunter**
```
Goal: Find vulnerabilities to report for bounties

Steps:
1. Start vulnerability hunter
2. Wait for discoveries
3. Click "Analyze" on high-severity findings
4. Check if bug bounty program exists
5. Verify vulnerability hasn't been reported
6. Submit to bug bounty program

Example:
Discovered: "Critical XSS in popular-app"
Repository: github.com/popular-app/app
Severity: Critical
Bounty: $5,000 - $10,000 (found on HackerOne)
```

**Use Case 2: Security Researcher**
```
Goal: Stay updated on latest vulnerabilities

Steps:
1. Run vulnerability hunter daily
2. Filter by "Critical" and "High" severity
3. Read through discoveries
4. Click links to Twitter posts for details
5. Analyze repositories for technical details
6. Share findings with team

Example:
Discovered: "Log4j RCE vulnerability (CVE-2025-1234)"
Impact: Affects millions of Java applications
Action: Update dependencies, notify clients
```

**Use Case 3: Developer Security**
```
Goal: Check if libraries you use are vulnerable

Steps:
1. Start vulnerability hunter
2. Look for discoveries mentioning your stack
3. Check "Dependencies" in analysis
4. Cross-reference with your project
5. Update vulnerable dependencies

Example:
Discovered: "npm package 'express' has DoS vulnerability"
Your app: Uses Express 4.17.1 (vulnerable version)
Action: Update to Express 4.18.2 (patched)
```

### **Performance:**

**Discovery Speed:**
- Twitter monitoring: ~10-20 results in 30 seconds
- GitHub monitoring: ~20-30 results in 30 seconds
- Total: ~30-50 vulnerabilities discovered per run

**Cache:**
- Results cached for 24 hours
- Click "Clear Cache" to fetch fresh data
- Auto-refresh every 30 seconds when UI is open

**Rate Limits:**
- GitHub: 5,000 requests/hour (free)
- Twitter: 500 tweets/month (free tier - limited)
  - Recommendation: Use GitHub-only for free monitoring

---

## 3. 🏢 Threat Intelligence Platform

### **Status:** ✅ BACKEND READY (Add UI as Needed)

### **What It Can Do:**

**1. URL Threat Analysis**
- Check URLs against Google Safe Browsing
- Check URLhaus malware database
- Check PhishTank phishing database
- Calculate reputation score (0-100)
- Identify threat categories

**2. Breach Monitoring**
- Check if emails have been in data breaches
- Query Have I Been Pwned database
- See breach details (date, data types exposed)
- Monitor multiple emails

**3. Compliance Checking**
- HTTPS/SSL verification
- Security headers analysis (CSP, HSTS, etc.)
- DNS configuration (SPF, DMARC, DKIM)
- Technology stack detection
- Subdomain discovery

**4. Vulnerability Database (NVD)**
- Query National Vulnerability Database
- Check for CVEs affecting detected technologies
- Get severity scores (CVSS)
- View remediation guidance

**5. Brand Monitoring**
- Detect domain squatting
- Find typosquatting variants
- Identify combosquatting (brand + keyword)
- Detect homograph attacks (Unicode lookalikes)
- Monitor TLD variations

**6. Misinformation Tracking**
- Correlate with known disinformation campaigns
- Check unreliable source database
- Flag political/health misinformation
- Already integrated with fact-checking

**7. Threat Report Generation**
- Generate comprehensive security reports
- STRIDE threat modeling
- Risk scoring (0-100)
- Recommendations
- Export as HTML/JSON

### **How to Use (Currently Backend Only):**

**Method 1: Call from Content Script**

Example: Check URL when user clicks a link

```javascript
// In content script
document.addEventListener('click', (event) => {
  if (event.target.tagName === 'A') {
    const url = event.target.href;

    // Ask service worker to check URL
    chrome.runtime.sendMessage({
      type: 'THREAT_CHECK_URL',
      payload: { url }
    }, (response) => {
      if (response.isMalicious) {
        event.preventDefault();
        alert('⚠️ WARNING: This URL is flagged as malicious!');
      }
    });
  }
});
```

**Method 2: Call from Popup**

Example: Add a "Check URL" button to popup

```javascript
// In popup.ts
document.getElementById('check-url-btn').addEventListener('click', async () => {
  const url = document.getElementById('url-input').value;

  chrome.runtime.sendMessage({
    type: 'THREAT_CHECK_URL',
    payload: { url }
  }, (response) => {
    displayThreatAnalysis(response);
  });
});
```

**Method 3: Call from Service Worker**

Example: Check URLs automatically during fact-checking

```javascript
// Already integrated in handleCheckClaim!
const phishingResult = await detectPhishingAndScams(text);
// This internally calls threat intelligence features
```

### **Available Message Types:**

```typescript
// Check URL for threats
MessageType.CHECK_URL
payload: { url: string }

// Check email in breach databases
MessageType.CHECK_EMAIL_BREACH
payload: { email: string }

// Check for domain squatting
MessageType.CHECK_DOMAIN_SQUATTING
payload: { domain: string }

// Generate full threat report
MessageType.GENERATE_THREAT_REPORT
payload: {
  domain: string;
  email?: string;
  tier: 'free' | 'basic' | 'professional' | 'enterprise';
}

// Check media for deepfakes
MessageType.CHECK_DEEPFAKE
payload: {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
}

// Monitor brand for impersonation
MessageType.MONITOR_BRAND
payload: {
  brandName: string;
  officialDomains: string[];
}
```

### **Example: Adding a Simple Threat Checker UI**

Create a new file `src/popup/threat-checker.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Threat Checker</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    input { width: 100%; padding: 10px; margin: 10px 0; }
    button { padding: 10px 20px; background: #4CAF50; color: white; border: none; }
    .result { margin-top: 20px; padding: 15px; border: 1px solid #ddd; }
    .malicious { background: #ffebee; border-color: #f44336; }
    .safe { background: #e8f5e9; border-color: #4caf50; }
  </style>
</head>
<body>
  <h2>🔍 URL Threat Checker</h2>

  <input type="text" id="url-input" placeholder="Enter URL to check...">
  <button id="check-btn">Check URL</button>

  <div id="result"></div>

  <script src="threat-checker.js"></script>
</body>
</html>
```

Create `src/popup/threat-checker.js`:

```javascript
document.getElementById('check-btn').addEventListener('click', async () => {
  const url = document.getElementById('url-input').value;
  const resultDiv = document.getElementById('result');

  resultDiv.innerHTML = 'Checking...';

  chrome.runtime.sendMessage({
    type: 'THREAT_CHECK_URL',
    payload: { url }
  }, (response) => {
    if (response.isMalicious) {
      resultDiv.className = 'result malicious';
      resultDiv.innerHTML = `
        <h3>⚠️ THREAT DETECTED</h3>
        <p><strong>URL:</strong> ${response.url}</p>
        <p><strong>Reputation:</strong> ${response.reputation.score}/100</p>
        <p><strong>Threats:</strong></p>
        <ul>
          ${response.threats.map(t => `<li>${t.type}: ${t.description}</li>`).join('')}
        </ul>
      `;
    } else {
      resultDiv.className = 'result safe';
      resultDiv.innerHTML = `
        <h3>✅ URL APPEARS SAFE</h3>
        <p><strong>URL:</strong> ${response.url}</p>
        <p><strong>Reputation:</strong> ${response.reputation.score}/100</p>
      `;
    }
  });
});
```

Then add to popup: `npm run build` and reload extension.

---

## 🆚 Comparison with Scam Sniffer

### **What You BOTH Do:**

| Feature | Your Extension | Scam Sniffer |
|---------|----------------|--------------|
| Phishing Detection | ✅ 100+ patterns | ✅ 20+ signatures |
| Crypto Scam Detection | ✅ Yes | ✅ Yes (Web3 focus) |
| Real-time Alerts | ✅ Yes | ✅ Yes |
| Typosquatting | ✅ Yes | ✅ Yes |
| URL Analysis | ✅ Yes | ✅ Yes |

### **What YOU Have That Scam Sniffer DOESN'T:**

1. ✅ **AI Fact-Checking** - Verify claims, not just detect scams
2. ✅ **Misinformation Detection** - Politics, health, news
3. ✅ **Vulnerability Hunter** - GitHub + Twitter monitoring
4. ✅ **Threat Intelligence** - Breach monitoring, compliance
5. ✅ **Multi-Platform** - Twitter, LinkedIn, Facebook, articles
6. ✅ **FREE AI Credits** - 14,400 Groq API calls/day

### **What Scam Sniffer Has That YOU DON'T:**

1. ❌ **Transaction Simulation** - Simulates Web3 transactions
2. ❌ **NFT Signature Checking** - Verifies NFT listings
3. ❌ **Multi-Chain Support** - EVM, Solana, BTC, Ton, Tron
4. ❌ **Approval Monitoring** - Tracks token/NFT approvals
5. ❌ **Frontend Compromise** - Detects hacked DApp frontends

### **Target Audience:**

**You Are Better For:**
- Social media users (Twitter/X, LinkedIn, Facebook)
- Journalists and researchers
- Security researchers (vulnerability hunting)
- General public (mainstream phishing protection)
- Enterprises (threat intelligence)

**Scam Sniffer Is Better For:**
- Crypto traders (DeFi, NFT)
- Web3 users (DApps)
- Wallet users (MetaMask, Phantom)
- NFT collectors (OpenSea, Blur)

---

## 📊 Quick Reference

### Phishing Detection
- **Status:** ✅ Active
- **Setup:** None required
- **Usage:** Automatic on every fact-check
- **Detects:** 100+ scam patterns

### Vulnerability Hunter
- **Status:** ✅ Ready
- **Setup:** GitHub token needed
- **Usage:** Manual, click "Start Hunting"
- **Discovers:** 30-50 vulnerabilities per run

### Threat Intelligence
- **Status:** ✅ Backend ready
- **Setup:** Optional API keys
- **Usage:** Call via message passing
- **Features:** 7 modules available

---

## 🚀 Next Steps

1. **NOW:** Test phishing detection on Twitter
2. **THIS WEEK:** Get GitHub token and try vulnerability hunter
3. **LATER:** Add UI for threat intelligence features
4. **FUTURE:** Consider adding Web3 features to compete with Scam Sniffer

---

Your extension is MORE COMPREHENSIVE than Scam Sniffer for mainstream users, but Scam Sniffer is more specialized for crypto/Web3 users.

**You cover a broader threat landscape! 🛡️**
