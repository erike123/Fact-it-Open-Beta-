# Threat Intelligence - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Build the Extension
```bash
npm install
npm run build
```

### Step 2: Load in Chrome
1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder

### Step 3: Test Threat Intelligence Features

#### Option A: Use the Demo Page
1. Open `THREAT_INTELLIGENCE_DEMO.html` in Chrome
2. Click buttons to test each feature
3. View results in styled UI

#### Option B: Use Browser Console
1. Open any webpage in Chrome
2. Press F12 (DevTools)
3. Go to Console tab
4. Run test commands:

```javascript
// Test 1: Check if a URL is malicious
chrome.runtime.sendMessage({
  type: 'THREAT_CHECK_URL',
  payload: { url: 'https://google.com' }
}, (response) => {
  console.log('URL Analysis:', response.result);
  console.log('Is Malicious?', response.result.isMalicious);
  console.log('Reputation Score:', response.result.reputation.score + '/100');
});

// Test 2: Check for data breaches
chrome.runtime.sendMessage({
  type: 'THREAT_CHECK_EMAIL_BREACH',
  payload: { email: 'test@example.com' }
}, (response) => {
  console.log('Breach Check:', response.result);
  console.log('Breached?', response.result.breached);
  console.log('Breach Count:', response.result.breachCount);
});

// Test 3: Detect domain squatting
chrome.runtime.sendMessage({
  type: 'THREAT_CHECK_DOMAIN_SQUATTING',
  payload: { domain: 'google.com' }
}, (response) => {
  console.log('Domain Squatting:', response.result);
  console.log('Suspicious Domains:', response.result.suspiciousDomains.length);
});

// Test 4: Generate comprehensive threat report
chrome.runtime.sendMessage({
  type: 'THREAT_GENERATE_REPORT',
  payload: {
    domain: 'example.com',
    tier: 'free' // or 'basic', 'professional', 'enterprise'
  }
}, (response) => {
  const report = response.report;
  console.log('=== THREAT REPORT ===');
  console.log('Domain:', report.domain);
  console.log('Risk Score:', report.summary.overallRiskScore + '/100');
  console.log('Security Grade:', report.findings.compliance?.overall.grade);
  console.log('Critical Findings:', report.summary.criticalFindings);
  console.log('High Findings:', report.summary.highFindings);
  console.log('Medium Findings:', report.summary.mediumFindings);
  console.log('\n=== TOP RECOMMENDATIONS ===');
  report.recommendations.slice(0, 5).forEach((rec, i) => {
    console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.category}`);
    console.log(`   Problem: ${rec.description}`);
    console.log(`   Solution: ${rec.remediation}`);
    console.log(`   Effort: ${rec.estimatedEffort}\n`);
  });
  console.log('Full Report:', report);
});

// Test 5: Check for misinformation campaigns
chrome.runtime.sendMessage({
  type: 'CHECK_CLAIM',
  payload: {
    text: '5G causes COVID-19 and weakens immune system',
    elementId: 'test',
    platform: 'article'
  }
}, (response) => {
  console.log('Fact Check Result:', response.payload);
  console.log('Verdict:', response.payload.verdict);
  console.log('Confidence:', response.payload.confidence + '%');
  console.log('Explanation:', response.payload.explanation);
});

// Test 6: Monitor brand for impersonations
chrome.runtime.sendMessage({
  type: 'THREAT_MONITOR_BRAND',
  payload: {
    brandName: 'Google',
    officialDomains: ['google.com', 'google.co.uk']
  }
}, (response) => {
  console.log('Brand Monitoring:', response.result);
  console.log('Impersonations Found:', response.result.impersonations.length);
});

// Test 7: Detect deepfakes/synthetic media
chrome.runtime.sendMessage({
  type: 'THREAT_CHECK_DEEPFAKE',
  payload: {
    mediaUrl: 'https://example.com/image.jpg',
    mediaType: 'image' // or 'video', 'audio'
  }
}, (response) => {
  console.log('Deepfake Detection:', response.result);
  console.log('Is Synthetic?', response.result.isSynthetic);
  console.log('Confidence:', response.result.confidence + '%');
});
```

---

## 🔑 API Keys (Optional for Full Features)

Most features work without API keys, but for full functionality:

### 1. Google Safe Browsing API (Free)
- Get key: https://developers.google.com/safe-browsing/v4/get-started
- Free tier: 10,000 requests/day
- **Used for:** URL malware/phishing detection

### 2. Have I Been Pwned API ($3.50/month)
- Get key: https://haveibeenpwned.com/API/Key
- Cost: $3.50/month
- **Used for:** Email breach checking

### 3. PhishTank API (Free, optional)
- Get key: https://www.phishtank.com/api_register.php
- Free tier: 500 requests/day
- **Used for:** Phishing URL detection

**Note:** Without API keys, you'll still get:
- URLhaus malware detection (free, no key)
- NVD vulnerability checking (free, no key)
- Domain squatting detection (free, no key)
- Subdomain discovery (free, no key)
- Compliance checking (free, no key)
- Misinformation campaign matching (free, no key)

---

## 📊 Example Output

### Threat Report (Free Tier)
```json
{
  "domain": "example.com",
  "summary": {
    "overallRiskScore": 45,
    "criticalFindings": 0,
    "highFindings": 2,
    "mediumFindings": 5,
    "lowFindings": 3
  },
  "findings": {
    "compliance": {
      "overall": { "score": 65, "grade": "C" },
      "https": { "enabled": true, "hsts": false },
      "headers": {
        "csp": false,
        "xFrameOptions": true,
        "strictTransportSecurity": false
      }
    }
  },
  "recommendations": [
    {
      "priority": "high",
      "category": "Security Headers",
      "description": "Missing Content Security Policy (CSP)",
      "remediation": "Add CSP header to prevent XSS attacks",
      "estimatedEffort": "medium"
    }
  ]
}
```

---

## 🎯 Real-World Use Cases

### Use Case 1: Security Consultant
Generate instant threat reports for clients:
```javascript
async function generateClientReport(domain) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'THREAT_GENERATE_REPORT',
      payload: { domain, tier: 'basic' }
    }, (response) => {
      const html = exportReportAsHTML(response.report);
      // Email HTML report to client
      // Bill €99
      resolve(html);
    });
  });
}
```

### Use Case 2: Brand Protection Team
Monitor for domain squatting daily:
```javascript
const brandsToMonitor = [
  { name: 'Acme Corp', domains: ['acme.com', 'acme.io'] },
  { name: 'WidgetCo', domains: ['widgetco.com'] }
];

brandsToMonitor.forEach(brand => {
  chrome.runtime.sendMessage({
    type: 'THREAT_MONITOR_BRAND',
    payload: brand
  }, (response) => {
    if (response.result.impersonations.length > 0) {
      // Alert legal team
      console.warn(`⚠️ ${response.result.impersonations.length} impersonations found for ${brand.name}`);
    }
  });
});
```

### Use Case 3: HR/Security Team
Check new hire emails for breaches:
```javascript
async function checkNewHire(email) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'THREAT_CHECK_EMAIL_BREACH',
      payload: { email }
    }, (response) => {
      if (response.result.breached) {
        console.warn(`⚠️ ${email} found in ${response.result.breachCount} breaches`);
        console.warn('Recommend: Force password reset and enable MFA');
      }
      resolve(response.result);
    });
  });
}
```

---

## 🐛 Troubleshooting

### Error: "chrome.runtime is undefined"
**Solution:** Make sure the extension is loaded in Chrome (`chrome://extensions`)

### Error: "Unknown message type"
**Solution:** Rebuild the extension (`npm run build`) and reload in Chrome

### No results from API calls
**Solution:** Check browser console (F12) for error messages. Most likely:
- API key missing or invalid
- Rate limit exceeded
- Network/CORS issues

### Build fails with TypeScript errors
**Solution:** Run `npm install` to ensure all dependencies are installed

---

## 📖 Documentation

- **Full Feature Documentation**: See [THREAT_INTELLIGENCE_README.md](THREAT_INTELLIGENCE_README.md)
- **Implementation Summary**: See [THREAT_INTELLIGENCE_SUMMARY.md](THREAT_INTELLIGENCE_SUMMARY.md)
- **Interactive Demo**: Open [THREAT_INTELLIGENCE_DEMO.html](THREAT_INTELLIGENCE_DEMO.html)

---

## 💡 Pro Tips

1. **Cache results**: Reports are cached for 24 hours automatically
2. **Batch operations**: Use `Promise.all()` to check multiple domains in parallel
3. **Export reports**: Use `exportReportAsHTML()` for styled HTML output
4. **Monitor continuously**: Set up weekly cron jobs for brand monitoring
5. **Combine features**: Generate report + check breaches + monitor brand = comprehensive assessment

---

## 🚀 Next Steps

1. **Test all features** using the commands above
2. **Generate your first report** for a real domain
3. **Build a UI** for the popup (optional)
4. **Add API keys** for full functionality
5. **Start selling** threat reports (€99 per report!)

---

## 💰 Business Opportunity

**Minimum Viable Business:**
1. Generate 10 threat reports/month at €99 each = **€990/month**
2. Scale to 100 reports/month = **€9,900/month** (€118K/year)
3. Add 1 enterprise client at €50K/year = **€168K/year total**

**Time to first revenue:** As soon as you complete your first report!

---

**Ready to start? Run the test commands above!** 🎉

Need help? Check the full documentation or open an issue.
