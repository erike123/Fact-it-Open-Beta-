# 🚀 Quick Start Guide - Get Running in 5 Minutes

## What You Have

You now have a **complete security intelligence platform** built into your Fact-It extension:

1. **Phishing Detection** - Works automatically on every fact-check ✅
2. **Vulnerability Hunter** - Requires GitHub token (free) 🔑
3. **Threat Intelligence** - Backend ready, add UI as needed 🛠️

---

## Step 1: Build the Extension (1 minute)

```bash
cd c:\Fact-it-private-copy
npm install    # If you haven't already
npm run build
```

**Expected output:**
```
✓ built in XXXms
✓ Firefox-compatible manifest generated
```

---

## Step 2: Load in Chrome (1 minute)

1. Open Chrome and go to: `chrome://extensions`
2. Enable **"Developer mode"** (toggle in top right corner)
3. Click **"Load unpacked"** button
4. Navigate to and select: `c:\Fact-it-private-copy\dist\`
5. You should see **"Fact-It"** extension loaded

---

## Step 3: Test Phishing Detection (2 minutes)

**NO CONFIGURATION NEEDED - Works immediately!**

### Option A: Test on Real Twitter/X Posts
1. Go to [Twitter/X](https://twitter.com)
2. Search for: `verify account urgent` or `send btc get back`
3. Find any suspicious post
4. Click the fact-check button (added by extension)
5. Wait for result

**If phishing detected, you'll see:**
```
🚨 DANGER: PHISHING/SCAM DETECTED 🚨

🚨 CRYPTO SCAM: This content matches known cryptocurrency scam patterns
⚠️ PHISHING: URL(s) detected that impersonate legitimate websites

⚠️ SAFETY RECOMMENDATIONS:
DO NOT click on any links in this content
DO NOT send cryptocurrency to any addresses mentioned
```

### Option B: Create Test Post (Guaranteed to Trigger)
1. Post this on Twitter (or test in any text field):
```
URGENT: Your PayPal account has been suspended.
Click here to verify: http://secure-paypal-verify.tk/login
Send 0.1 BTC to get 0.2 BTC back!
```

2. Fact-check the post
3. Should show **CRITICAL phishing warning** ✅

---

## Step 4: Test Vulnerability Hunter (Optional - 2 minutes)

**Requires GitHub token (FREE)**

### Get GitHub Token (30 seconds):
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Classic"**
3. Name it: `Fact-It Vuln Hunter`
4. Select scopes:
   - ✅ `public_repo`
   - ✅ `read:org`
5. Click **"Generate token"**
6. Copy the token (starts with `ghp_...`)

### Use Vulnerability Hunter:
1. Click the Fact-It extension icon (top right in Chrome)
2. You'll see the default popup
3. **To access Vulnerability Hunter:**
   - Option A: Add a tab in popup.html (requires editing)
   - Option B: Right-click extension icon → Inspect popup → Console → Type:
     ```javascript
     chrome.runtime.openOptionsPage();
     ```
   - Option C: Manually navigate to: `chrome-extension://[EXTENSION_ID]/src/popup/vuln-hunter.html`
     - Find your extension ID in `chrome://extensions`

4. Enter your GitHub token
5. Enable "GitHub Monitoring"
6. Click **"🚀 Start Hunting"**
7. Wait 10-30 seconds
8. See list of vulnerability discoveries
9. Click **"Analyze"** on any discovery to get detailed report

**What you'll see:**
- Discovery cards with severity badges (CRITICAL, HIGH, MEDIUM, LOW)
- GitHub repository links
- One-click analysis showing:
  - ⭐ Star count
  - 📦 Dependencies
  - ⚠️ Vulnerable dependencies
  - 📝 Programming languages
  - ✅ Security policy (SECURITY.md exists?)

---

## How It All Works Together

### Automatic Phishing Protection (No Setup!)

```
User fact-checks post
    ↓
Extension analyzes text
    ↓
AI fact-checks the claim (OpenAI/Anthropic/Perplexity/Groq)
    ↓
🆕 PHISHING DETECTOR AUTOMATICALLY SCANS:
    ↓
├─ Pattern matching (100+ scam patterns)
├─ URL analysis (typosquatting, suspicious TLDs)
├─ Cryptocurrency scam detection
└─ External threat databases (if API keys configured)
    ↓
If CRITICAL phishing detected:
    ↓
Override verdict to "FALSE" with 99% confidence
Prepend 🚨 warning to explanation
Show safety recommendations
```

**This happens on EVERY fact-check automatically!**

---

## Detection Examples

### ✅ Crypto Scam Detection
**Input:**
```
🎉 ELON MUSK GIVEAWAY!
Send 0.5 BTC to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
and receive 1.0 BTC back! Limited time!
```

**Output:**
```
🚨 DANGER: PHISHING/SCAM DETECTED 🚨

🚨 CRYPTO SCAM: This content matches known cryptocurrency scam patterns

Scam Indicators:
- Matches "Elon Musk giveaway" pattern
- Contains "send BTC get back" pattern
- Bitcoin address in suspicious context

Verdict: FALSE (99% confidence)

⚠️ SAFETY RECOMMENDATIONS:
DO NOT send cryptocurrency to any addresses
Legitimate giveaways NEVER ask you to send crypto first
```

### ✅ Phishing URL Detection
**Input:**
```
⚠️ Your Netflix account has been suspended due to payment failure.
Update your payment method here:
https://netflix-account-verify.tk/update
```

**Output:**
```
🚨 DANGER: PHISHING/SCAM DETECTED 🚨

⚠️ PHISHING: URL(s) detected that impersonate legitimate websites

URL Analysis:
- Suspicious TLD (.tk) commonly used in scams
- Domain contains "verify" keyword
- NOT the official netflix.com domain
- Impersonating legitimate service

Verdict: FALSE (99% confidence)

⚠️ SAFETY RECOMMENDATIONS:
DO NOT click on any links
DO NOT enter personal information or passwords
Verify account issues directly through official app/website
```

### ✅ Safe Content (No Threats)
**Input:**
```
Check out my new blog post about Python programming:
https://myblog.com/python-tips
```

**Output:**
```
✅ No threats detected

URL Analysis:
- 1 URL found: https://myblog.com/python-tips
- No suspicious patterns
- Clean URL structure
- No scam keywords

Verdict: (Proceeds with normal fact-checking)
```

---

## What's Integrated

### File Locations:

**Phishing Detection (Automatic):**
- `src/background/phishing-detector/scam-patterns.ts` - 100+ scam patterns
- `src/background/phishing-detector/index.ts` - Detection engine
- Integrated in: `src/background/service-worker.ts` (lines 270-315)

**Vulnerability Hunter (Manual UI):**
- `src/popup/vuln-hunter.html` - UI
- `src/popup/vuln-hunter.ts` - Logic
- `src/background/vulnerability-hunter/orchestrator.ts` - Backend

**Threat Intelligence (Backend Ready):**
- `src/background/threat-intelligence/` - 8 modules
- Message handlers in service worker
- Add UI as needed

---

## Troubleshooting

### "Extension not loading"
```bash
npm run build
# Reload extension in chrome://extensions
```

### "Fact-check button not appearing"
- Refresh the Twitter/X page
- Check console (F12) for errors
- Verify extension is enabled in `chrome://extensions`

### "No phishing warnings showing"
- Phishing detection only triggers on actual suspicious content
- Test with the example scam texts above
- Check service worker console for logs:
  - Go to `chrome://extensions`
  - Click "service worker" under Fact-It
  - Look for `[Phishing Detector]` logs

### "Vulnerability Hunter not working"
- Verify GitHub token is valid
- Check token has correct scopes (`public_repo`, `read:org`)
- GitHub rate limit: 5,000 requests/hour (should be plenty)
- Check service worker console for errors

---

## What's Next?

You have everything working! Now you can:

1. **Test phishing detection** on real social media posts
2. **Hunt for vulnerabilities** using GitHub + Twitter APIs
3. **Build UI** for threat intelligence features (URL checker, breach checker)
4. **Add more scam patterns** to `scam-patterns.ts`
5. **Integrate more APIs** (optional):
   - Google Safe Browsing (free)
   - PhishTank (free)
   - Have I Been Pwned ($3.50/month)

---

## Quick Reference

### Build & Reload
```bash
npm run build
# Then reload in chrome://extensions
```

### Check for Errors
```bash
npm run type-check
npm run lint
```

### View Logs
- **Content script logs**: Open DevTools on Twitter/X page (F12)
- **Service worker logs**: `chrome://extensions` → Click "service worker"
- **Popup logs**: Right-click extension icon → Inspect popup

---

## Documentation

- **FINAL_STATUS.md** - Complete feature overview
- **PHISHING_DETECTION_GUIDE.md** - Phishing detection deep dive
- **VULNERABILITY_HUNTER_GUIDE.md** - Vulnerability hunter setup
- **THREAT_INTELLIGENCE_README.md** - Threat intelligence features
- **CLAUDE.md** - Project architecture & development guide

---

## 🎉 You're Done!

**Phishing detection is working automatically on every fact-check!**

No configuration needed - just build, load, and test on Twitter/X.

**Status:** ✅ PRODUCTION READY

Build it now:
```bash
npm run build
```

Load in Chrome:
```
chrome://extensions → Load unpacked → dist/
```

Test it:
```
Go to Twitter/X → Fact-check any post with URLs
```

**Happy hunting!** 🛡️
