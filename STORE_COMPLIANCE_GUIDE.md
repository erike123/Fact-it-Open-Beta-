# Chrome & Firefox Store Policy Compliance Guide

## 🎯 Overview

This guide ensures your extension complies with Chrome Web Store and Firefox Add-ons policies for monetization and backend APIs.

---

## 🚨 Critical: Chrome Payment Policy

### The Rule (Chrome Web Store Policy)

**From Chrome Web Store Developer Program Policies:**

> "Developers offering products or services within an extension must only use the Chrome Web Store Payments system, or offer the functionality in an external website."

**What This Means:**
- ❌ **CANNOT** integrate Stripe/PayPal directly in extension popup
- ❌ **CANNOT** use `<iframe>` to embed payment forms
- ✅ **CAN** redirect users to external website for payment
- ✅ **CAN** use license keys generated on external website

---

## ✅ Compliant Payment Flow

### Architecture

```
Extension → External Website → Stripe Checkout → License Key → Extension
```

### Step-by-Step Flow

#### 1. User Clicks "Upgrade" in Extension

**Extension Popup (popup.ts):**
```typescript
// ✅ COMPLIANT: Opens external website
document.getElementById('upgrade-btn').addEventListener('click', () => {
  chrome.tabs.create({
    url: 'https://factit.app/pricing' // YOUR external website
  });
});
```

#### 2. External Website (Landing Page)

**Website: factit.app/pricing**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Fact-It Pricing</title>
</head>
<body>
  <h1>Upgrade to Pro</h1>
  <div class="pricing-card">
    <h2>Pro - $9.99/month</h2>
    <ul>
      <li>Unlimited fact-checks</li>
      <li>Multi-AI verification</li>
      <li>Export reports</li>
    </ul>
    <button id="checkout-btn">Subscribe Now</button>
  </div>

  <script>
    // Stripe Checkout (on external website - COMPLIANT)
    document.getElementById('checkout-btn').addEventListener('click', async () => {
      const response = await fetch('https://your-backend.com/api/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ tier: 'pro' }),
      });

      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe
    });
  </script>
</body>
</html>
```

#### 3. Stripe Checkout → Success Page

**After payment:** `https://factit.app/success?session_id=xxx`

```html
<!DOCTYPE html>
<html>
<body>
  <h1>🎉 Welcome to Fact-It Pro!</h1>
  <div id="license-key-container">
    <p>Your License Key:</p>
    <code id="license-key">Loading...</code>
    <button onclick="copyKey()">Copy Key</button>
  </div>

  <div class="instructions">
    <h2>Activation Instructions:</h2>
    <ol>
      <li>Copy your license key above</li>
      <li>Click the Fact-It extension icon in your browser</li>
      <li>Click "Enter License Key"</li>
      <li>Paste your key and click "Activate"</li>
    </ol>
  </div>

  <script>
    // Fetch license key from backend
    async function loadLicenseKey() {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      const response = await fetch(`https://your-backend.com/api/get-license?session=${sessionId}`);
      const { licenseKey } = await response.json();

      document.getElementById('license-key').textContent = licenseKey;
    }

    loadLicenseKey();

    function copyKey() {
      const key = document.getElementById('license-key').textContent;
      navigator.clipboard.writeText(key);
      alert('License key copied! 📋');
    }
  </script>
</body>
</html>
```

#### 4. User Activates in Extension

**Extension Popup:**
```typescript
// ✅ COMPLIANT: User enters license key manually
document.getElementById('activate-btn').addEventListener('click', async () => {
  const licenseKey = document.getElementById('license-input').value;

  // Verify with backend
  const response = await fetch('https://your-backend.com/api/verify-license', {
    method: 'POST',
    headers: { 'X-License-Key': licenseKey },
  });

  if (response.ok) {
    await chrome.storage.local.set({ licenseKey });
    alert('✅ Pro subscription activated!');
    loadSettings(); // Reload UI to show Pro features
  } else {
    alert('❌ Invalid license key');
  }
});
```

---

## 📋 Required Policies & Disclosures

### 1. Privacy Policy (REQUIRED)

**Must include:**
- What data you collect (user ID, usage stats, etc.)
- How you use the data (provide service, improve product)
- Third parties (AI providers, analytics)
- User rights (access, deletion)
- Contact information

**Location:**
- Link in Chrome Web Store listing
- Link in Firefox Add-ons listing
- Link in extension (About page)

**Example Privacy Policy Template:**

```markdown
# Privacy Policy for Fact-It

**Last Updated:** [Date]

## Data We Collect

- **Usage Data:** Number of fact-checks performed, timestamps
- **Subscription Data:** License key, subscription tier, expiration date
- **Technical Data:** Browser version, extension version

## How We Use Data

- Provide fact-checking service
- Track usage limits (free tier: 100/day)
- Improve service quality

## Third-Party Services

- **AI Providers:** OpenAI, Anthropic (process fact-check requests)
- **Payment Processor:** Stripe (handles payments, we don't store credit cards)
- **Hosting:** Vercel/Railway (hosts backend API)

## Data Retention

- Usage logs: 90 days
- Subscription data: Duration of subscription + 1 year

## Your Rights

- Access your data: email support@factit.app
- Delete your account: email support@factit.app
- Export your data: available in extension settings

## Contact

Email: privacy@factit.app
```

### 2. Terms of Service (REQUIRED)

**Must include:**
- Service description
- User obligations (no abuse, legal use only)
- Subscription terms (refund policy, cancellation)
- Disclaimers (accuracy of fact-checks)
- Limitation of liability

### 3. Store Listing Description (REQUIRED)

**Chrome Web Store & Firefox Add-ons:**

```markdown
# Fact-It: AI-Powered Fact-Checking Extension

Real-time fact-checking for social media posts using advanced AI.

## Features

**Free Tier (No Credit Card Required):**
- 100 fact-checks per day
- Basic claim detection
- Groq AI-powered analysis

**Pro Tier ($9.99/month):**
- Unlimited fact-checks
- Multi-AI cross-verification (OpenAI + Anthropic)
- Export reports to PDF/CSV
- Priority processing
- Browser sync

## How It Works

1. Browse Twitter, LinkedIn, or Facebook
2. Extension detects posts with factual claims
3. Click "Check Claim" to verify
4. Get instant verdict with sources

## Pricing

Free tier is 100% free forever. Pro tier requires subscription purchased on our website (not in-app).

## Privacy

We collect minimal data (usage stats, license key). See our Privacy Policy for details.

## Support

Email: support@factit.app
Website: https://factit.app
```

---

## 🔒 Data Collection & Permissions

### Permissions Declaration

**In manifest.json:**
```json
{
  "permissions": [
    "storage",       // Store license key and settings
    "scripting"      // Inject content scripts
  ],
  "host_permissions": [
    "<all_urls>"     // Access social media sites
  ]
}
```

**In Store Listing (both Chrome & Firefox):**

**Why we need these permissions:**

- **Storage:** Store your license key and extension settings locally
- **Scripting:** Inject fact-checking UI into social media pages
- **Host Permissions:** Read post content on Twitter, LinkedIn, Facebook for fact-checking

**What we DON'T do:**
- ❌ Track your browsing history
- ❌ Collect personal information
- ❌ Sell your data
- ❌ Inject ads

---

## 🚫 Common Violations to AVOID

### ❌ BANNED: In-Extension Payments

```typescript
// ❌ VIOLATION: Stripe checkout in popup
function showPayment() {
  stripe.checkout.create({ ... }); // WILL BE REJECTED
}
```

### ❌ BANNED: Obfuscated Code

```typescript
// ❌ VIOLATION: Minified/obfuscated code
eval(atob('ZnVuY3Rpb24gY2hlY2soKXt9')); // WILL BE REJECTED
```

### ❌ BANNED: Undeclared Remote Code

```typescript
// ❌ VIOLATION: Loading external scripts
const script = document.createElement('script');
script.src = 'https://external-site.com/code.js'; // BANNED
```

### ❌ BANNED: Cryptocurrency Mining

```typescript
// ❌ VIOLATION: Any crypto mining
coinhive.start(); // INSTANT BAN
```

### ❌ BANNED: Misleading Functionality

```
// ❌ VIOLATION: Claiming free but requiring payment immediately
"100% Free Extension!" → Immediately shows "Pay $10 to use"
```

---

## ✅ Best Practices

### 1. Free Tier Must Work

**Chrome Policy:** Free version must provide genuine value

```typescript
// ✅ GOOD: Free tier is functional
- 100 fact-checks/day (useful for casual users)
- Basic features work fully
- No arbitrary limitations

// ❌ BAD: Free tier is crippled
- Only 1 fact-check/day (not useful)
- Shows results but blurs them
- Forces upgrade immediately
```

### 2. Transparent Pricing

**In Store Listing:**
- ✅ Clearly state "Free tier: 100 checks/day"
- ✅ Clearly state "Pro tier: $9.99/month (purchased on website)"
- ✅ Link to pricing page

### 3. Privacy-Friendly Defaults

```typescript
// ✅ GOOD: Opt-in analytics
if (userConsentedToAnalytics) {
  trackUsage();
}

// ❌ BAD: Automatic tracking without consent
trackUsage(); // No consent check
```

### 4. Accurate Descriptions

**Store Listing:**
- ✅ Accurate feature list
- ✅ Clear limitations
- ✅ Honest about AI accuracy ("AI-powered, may have errors")
- ❌ No exaggerated claims ("100% accurate", "Never wrong")

---

## 📊 Review Process & Timeline

### Chrome Web Store

**Timeline:**
- Initial review: 1-7 days
- Updates: Usually 24-48 hours (if no policy changes)

**Common Rejection Reasons:**
1. In-app payments (use external website)
2. Missing privacy policy
3. Misleading description
4. Excessive permissions
5. Broken functionality

**Review Checklist:**
- [ ] Privacy policy linked
- [ ] Accurate description
- [ ] Minimal permissions
- [ ] Free tier works
- [ ] External payment flow
- [ ] No obfuscated code

### Firefox Add-ons

**Timeline:**
- Manual review: 1-14 days (all extensions reviewed by humans)
- Auto-approved updates: 24 hours (if code hasn't changed significantly)

**Common Rejection Reasons:**
1. Missing privacy policy
2. Obfuscated code
3. Requesting excessive permissions
4. Undeclared remote code

**Review Checklist:**
- [ ] Source code readable
- [ ] Privacy policy linked
- [ ] Permissions justified
- [ ] No minification (or provide source maps)
- [ ] No remote code execution

---

## 🛡️ Security Best Practices

### 1. Secure API Communication

```typescript
// ✅ GOOD: HTTPS only
const API_URL = 'https://your-backend.com/api';

// ✅ GOOD: Validate responses
const response = await fetch(API_URL);
if (!response.ok) {
  throw new Error('API error');
}
const data = await response.json();
validateResponseSchema(data); // Validate before use
```

### 2. Secure License Key Storage

```typescript
// ✅ GOOD: Use chrome.storage.local (encrypted by browser)
await chrome.storage.local.set({ licenseKey });

// ❌ BAD: LocalStorage (not secure)
localStorage.setItem('licenseKey', key);
```

### 3. Content Security Policy

**manifest.json:**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

---

## 📈 Approval Success Checklist

Before submitting to stores:

### Technical
- [ ] Extension loads without errors
- [ ] Free tier works fully (100 checks/day)
- [ ] External payment flow tested
- [ ] License activation works
- [ ] All features tested in Chrome AND Firefox
- [ ] No console errors

### Legal/Policy
- [ ] Privacy policy written and published
- [ ] Terms of service written and published
- [ ] Store description accurate
- [ ] Permissions justified in description
- [ ] External website ready (landing page, pricing, checkout)

### Documentation
- [ ] README.md updated
- [ ] Screenshots for store (1280x800 or 640x400)
- [ ] Promotional images (if applicable)
- [ ] Video demo (optional but helpful)

### Support
- [ ] Support email set up (support@factit.app)
- [ ] Contact page on website
- [ ] FAQ page

---

## 🚀 Deployment Checklist

### 1. Create External Website

**Required Pages:**
- `/` - Homepage (explain product)
- `/pricing` - Pricing tiers
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/support` - Contact/FAQ
- `/success` - Post-payment (shows license key)

**Tech Stack Options:**
- Simple: GitHub Pages + HTML/CSS
- Better: Next.js + Vercel (free hosting)
- Best: WordPress + WooCommerce (easier management)

### 2. Set Up Backend

**Deploy to:**
- Vercel (free tier, recommended)
- Railway ($5/month)
- DigitalOcean ($6/month)

**Endpoints Required:**
- `/api/create-checkout` - Create Stripe session
- `/api/verify-license` - Verify license key
- `/api/fact-check` - Process fact-check request
- `/api/webhook` - Stripe webhook (create license)

### 3. Configure Stripe

**Setup:**
1. Create Stripe account
2. Create products (Pro, Business, Enterprise)
3. Set up webhook (listens to payment events)
4. Get API keys (test & live)

### 4. Submit to Stores

**Chrome Web Store:**
1. Pay $5 one-time registration fee
2. Fill in listing details
3. Upload extension ZIP
4. Link privacy policy
5. Submit for review

**Firefox Add-ons:**
1. Create Mozilla account (free)
2. Upload XPI file
3. Fill in listing details
4. Link privacy policy
5. Submit for review

---

## ⚠️ Common Pitfalls

### Pitfall 1: Forgetting Privacy Policy
**Result:** Immediate rejection
**Fix:** Write privacy policy BEFORE submission

### Pitfall 2: In-App Payments
**Result:** Chrome rejection
**Fix:** Use external website for payments

### Pitfall 3: Excessive Permissions
**Result:** User distrust, potential rejection
**Fix:** Only request minimum needed permissions

### Pitfall 4: Broken Free Tier
**Result:** Rejection for "lack of functionality"
**Fix:** Ensure free tier provides real value

### Pitfall 5: No Testing
**Result:** Buggy extension, bad reviews
**Fix:** Test EVERYTHING before submission

---

## 📞 Support Contacts

**Chrome Web Store Support:**
- Developer Forum: https://groups.google.com/a/chromium.org/g/chromium-extensions
- Policy Email: chrome-webstore-policy@google.com

**Firefox Add-ons Support:**
- Developer Hub: https://addons.mozilla.org/developers/
- Email: amo-admins@mozilla.org

---

## ✅ Final Compliance Check

Before clicking "Submit":

**Legal:**
- [ ] Privacy policy published and linked
- [ ] Terms of service published
- [ ] Refund policy clear (if applicable)

**Technical:**
- [ ] Extension tested in Chrome
- [ ] Extension tested in Firefox
- [ ] Free tier works without payment
- [ ] External payment flow works
- [ ] License activation works
- [ ] No console errors

**Policy:**
- [ ] No in-app payments
- [ ] No obfuscated code
- [ ] Permissions justified
- [ ] Description accurate
- [ ] Screenshots current

**Business:**
- [ ] External website live
- [ ] Backend API deployed
- [ ] Stripe configured
- [ ] Support email active

---

## 🎯 Estimated Timeline

| Phase | Duration |
|-------|----------|
| Build external website | 1-3 days |
| Set up backend API | 2-5 days |
| Configure Stripe | 1 day |
| Write policies | 1-2 days |
| Test thoroughly | 2-3 days |
| Create store assets | 1-2 days |
| **Total** | **1-2 weeks** |

After submission:
- Chrome review: 1-7 days
- Firefox review: 1-14 days

---

## 💡 Pro Tips

1. **Submit to Firefox First**
   - Firefox provides detailed feedback
   - Helps catch issues before Chrome submission

2. **Offer Refunds**
   - Builds trust
   - Reduces chargebacks
   - Recommended: 30-day money-back guarantee

3. **Beta Test**
   - Use Chrome's "Trusted Testers" feature
   - Get feedback before public launch

4. **Monitor Reviews**
   - Respond to negative reviews quickly
   - Fix reported bugs immediately

5. **Update Regularly**
   - Shows active development
   - Builds user trust
   - Improves store rankings

---

**Ready to submit? Make sure all checkboxes above are checked!**
