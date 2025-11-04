# Privacy Policy for Fact-It

**Last Updated:** October 20, 2025
**Effective Date:** October 20, 2025

## Introduction

Fact-It ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our browser extension.

**By using Fact-It, you agree to the collection and use of information in accordance with this policy.**

---

## Information We Collect

### 1. Information You Provide Directly

**API Keys (Optional):**
- If you choose to add your own API keys for AI providers (OpenAI, Anthropic, Perplexity), these are stored **locally in your browser only**
- We **never** transmit, store, or access your API keys on our servers
- API keys remain on your device and are only used to authenticate with AI providers on your behalf

**Settings and Preferences:**
- Your extension settings (auto-check enabled, confidence threshold, enabled providers)
- Stored locally in your browser using `chrome.storage.local` API
- Never transmitted to external servers

### 2. Usage Information

**Trial Information:**
- Trial start date, expiration date, and usage counts
- Stored **locally** in your browser
- Used only to track your 30-day free trial period
- Not shared with any third parties

**Fact-Check Requests:**
- Text content you select or posts you check for fact-verification
- Temporarily processed to perform fact-checking
- Not stored permanently by Fact-It
- May be processed by third-party AI providers (see "Third-Party Services" below)

**Extension Usage Statistics:**
- Number of fact-checks performed per day
- Total fact-checks during trial period
- Stored locally, not transmitted to external servers

### 3. Information We Do NOT Collect

We **DO NOT** collect, store, or transmit:
- ❌ Your browsing history
- ❌ Personal identification information (name, email, address)
- ❌ Social media credentials or passwords
- ❌ Payment information (handled by Stripe when Pro launches)
- ❌ Location data
- ❌ Device identifiers
- ❌ Cookies or tracking data

---

## How We Use Your Information

### During Free Trial Period:

1. **Fact-Checking Service:**
   - Text you submit for fact-checking is sent to AI providers (Anthropic Claude)
   - Used solely to analyze claims and return verification results
   - Not stored after processing is complete

2. **Trial Management:**
   - Track trial period expiration (30 days from first use)
   - Count daily and total fact-checks
   - All data stored locally in your browser

3. **Service Improvement:**
   - We may review aggregate, anonymized usage patterns (if/when analytics are added)
   - Individual user data is never analyzed or stored

### When Pro Version Launches (Future):

When we launch paid subscriptions, we will collect:
- Email address (for account creation)
- Payment information (processed by Stripe, never stored by us)
- Subscription status

**We will update this policy and notify users before collecting any new data.**

---

## Third-Party Services

Fact-It integrates with third-party AI services to provide fact-checking functionality:

### AI Providers:

**Anthropic (Claude):**
- **During Trial:** We use our API key to send your fact-check requests to Anthropic's Claude API
- **After Trial:** You may provide your own Anthropic API key
- **Data Shared:** Text content you submit for fact-checking
- **Privacy Policy:** https://www.anthropic.com/privacy
- **Data Retention:** Per Anthropic's policy (typically not stored for training)

**OpenAI (GPT) - Optional:**
- Used only if you enable and provide your own API key
- **Data Shared:** Text content you submit for fact-checking
- **Privacy Policy:** https://openai.com/policies/privacy-policy
- **Data Retention:** Per OpenAI's policy

**Perplexity AI - Optional:**
- Used only if you enable and provide your own API key
- **Data Shared:** Text content you submit for fact-checking
- **Privacy Policy:** https://www.perplexity.ai/privacy
- **Data Retention:** Per Perplexity's policy

### Future Payment Processing (Not Yet Active):

**Stripe:**
- When Pro subscriptions launch, payment processing will be handled by Stripe
- We will never see or store your credit card information
- **Privacy Policy:** https://stripe.com/privacy

---

## Data Storage and Security

### Local Storage:
- All user settings, API keys, and trial information are stored **locally** in your browser
- Uses browser's built-in `chrome.storage.local` API
- Data persists until you uninstall the extension or clear browser data
- Not accessible by other websites or extensions

### Data Transmission:
- Fact-check requests are transmitted securely via HTTPS to AI providers
- API keys (yours or ours) are transmitted securely to authenticate requests
- No data is sent to Fact-It servers (we don't have servers yet!)

### Security Measures:
- All API communications use TLS/SSL encryption
- API keys are never logged or exposed in developer tools
- We follow browser extension security best practices
- Regular security audits of our codebase

---

## Your Data Rights

You have the right to:

### Access:
- All your data is stored locally in your browser
- Access it via browser's extension storage viewer

### Deletion:
- Uninstall the extension to delete all local data
- Clear browser extension data in browser settings
- Your data is immediately and permanently deleted

### Portability:
- Export your settings via extension backup feature (if implemented)
- API keys can be copied from settings panel

### Control:
- Enable/disable AI providers at any time
- Remove API keys from settings
- Reset trial (by clearing extension data)

---

## Children's Privacy

Fact-It is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.

---

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by:
- Posting the new Privacy Policy on this page
- Updating the "Last Updated" date
- Notifying users via extension popup (for material changes)

**Your continued use of Fact-It after changes constitutes acceptance of the updated policy.**

---

## International Data Transfers

If you are using Fact-It outside the United States:
- Your fact-check requests may be processed by AI providers with servers in various locations
- We rely on AI providers' compliance with data protection regulations (GDPR, CCPA, etc.)
- Your locally-stored data remains in your jurisdiction

---

## California Privacy Rights (CCPA)

If you are a California resident, you have the right to:
- Know what personal information is collected
- Know if personal information is sold or disclosed (we don't sell data)
- Request deletion of personal information
- Opt-out of sale of personal information (not applicable - we don't sell data)

**Contact us to exercise these rights.**

---

## European Privacy Rights (GDPR)

If you are in the European Economic Area (EEA), you have rights under GDPR:

### Legal Basis for Processing:
- **Consent:** You consent by using the extension and submitting fact-check requests
- **Legitimate Interest:** Providing fact-checking service
- **Contract:** When Pro version launches, to fulfill subscription services

### Your GDPR Rights:
- Right to access your data
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to restrict processing
- Right to data portability
- Right to object to processing
- Right to withdraw consent

**Contact us to exercise these rights.**

---

## Data Retention

### During Trial:
- Trial information stored until expiration or extension uninstall
- Fact-check requests not retained after processing
- Settings stored until you change or delete them

### After Extension Uninstall:
- All locally-stored data is immediately deleted
- No residual data remains in our systems (we have none!)

### When Pro Launches:
- Account information retained while subscription is active
- 30 days after account closure, all data deleted
- Fact-check history (if stored) deleted per user preference

---

## Third-Party Links

Fact-check results may include links to external sources. We are not responsible for the privacy practices of these third-party websites. We encourage you to review their privacy policies.

---

## Open Source

Fact-It's core technology is open source. You can review our code at:
**https://github.com/yourorg/fact-it** (update with your actual repo)

This transparency allows security researchers and users to verify our privacy claims.

---

## Contact Us

If you have questions about this Privacy Policy or our data practices:

**Email:** privacy@fact-it.app
**Support:** support@fact-it.app
**Website:** https://fact-it.app
**GitHub Issues:** https://github.com/yourorg/fact-it/issues

**Mailing Address:** (Add your address when you have one)

---

## Consent

By using Fact-It, you consent to this Privacy Policy and agree to its terms.

If you do not agree with this policy, please do not use Fact-It.

---

## Summary (TL;DR)

✅ **We respect your privacy:**
- Your data stays on YOUR device
- We don't track your browsing
- We don't sell your data
- API keys never leave your browser (except to authenticate with AI services)

✅ **What we do:**
- Send your fact-check requests to AI providers (Anthropic, OpenAI, Perplexity)
- Store trial info and settings locally
- Use HTTPS for all communications

✅ **Your control:**
- Uninstall = instant data deletion
- Open source = verifiable privacy claims
- No accounts, no tracking, no nonsense

---

**Thank you for trusting Fact-It with your fact-checking needs!**
