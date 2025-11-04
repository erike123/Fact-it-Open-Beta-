# Firefox Mass Adoption Plan for Fact-It

## Executive Summary

Transform Fact-It from a developer-focused extension requiring API keys into a production-ready Firefox add-on with mass market appeal through a backend service and freemium model.

---

## Phase 1: Backend Infrastructure (Week 1-2)

### 1.1 Backend Architecture

**Tech Stack:**
- **Runtime:** Node.js (Express.js or Fastify)
- **Database:** PostgreSQL (users, subscriptions, usage tracking)
- **Cache:** Redis (fact-check results, rate limiting)
- **Authentication:** JWT tokens
- **Payment:** Stripe (subscription management)
- **Hosting:** Railway.app or Render.com ($20-50/month to start)

**API Endpoints:**

```
POST   /api/auth/register          - Create user account
POST   /api/auth/login             - Get JWT token
POST   /api/auth/verify            - Verify JWT token

POST   /api/fact-check/check       - Submit claim for checking
GET    /api/fact-check/result/:id  - Get fact-check result
GET    /api/fact-check/history     - User's check history

GET    /api/user/usage             - Current usage stats
GET    /api/user/subscription      - Subscription status
POST   /api/user/subscribe         - Create Stripe checkout session
POST   /api/webhook/stripe         - Handle Stripe webhooks
```

**Cost Optimization Strategy:**

1. **Aggressive Caching (24-48 hours)**
   - Cache identical claims across all users
   - Reduces API costs by 70-90%
   - Example: "Biden is president" asked 1000x → 1 API call

2. **Smart Provider Selection**
   - Free tier: Use cheapest provider (GPT-4o-mini only)
   - Pro tier: Multi-provider verification
   - Estimated costs:
     - Free user: $0.003 per check (GPT-4o-mini)
     - Pro user: $0.015 per check (multi-provider)

3. **Rate Limiting**
   - Free tier: 10 checks/day
   - Pro tier: Unlimited (with abuse protection: 500/day max)

### 1.2 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free' | 'pro'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255)
);

-- Fact checks table
CREATE TABLE fact_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 of normalized claim
  claim_text TEXT NOT NULL,
  verdict VARCHAR(20) NOT NULL, -- 'true' | 'false' | 'unknown' | 'no_claim'
  confidence INTEGER NOT NULL,
  explanation TEXT,
  sources JSONB,
  provider_results JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  cache_expires_at TIMESTAMP
);

-- Usage tracking
CREATE TABLE usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  fact_check_id UUID REFERENCES fact_checks(id),
  cached BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_fact_checks_hash ON fact_checks(claim_hash);
CREATE INDEX idx_fact_checks_expires ON fact_checks(cache_expires_at);
CREATE INDEX idx_usage_user_date ON usage_logs(user_id, created_at);
```

### 1.3 Backend Implementation Priorities

**Week 1:**
1. Set up Express.js project with TypeScript
2. Implement authentication (JWT-based)
3. Create fact-check endpoint (single provider: Anthropic)
4. Deploy to Railway/Render
5. Test with Postman/Insomnia

**Week 2:**
1. Add PostgreSQL with schema above
2. Implement caching logic (Redis + database)
3. Add rate limiting (free vs pro tiers)
4. Integrate Stripe for subscriptions
5. Add usage tracking

---

## Phase 2: Extension Backend Integration (Week 3)

### 2.1 Remove Direct AI Provider Calls

**Changes to extension:**

1. **Remove API key storage from extension**
   - Delete provider API key fields from popup UI
   - Remove API key storage in chrome.storage.local
   - Keep provider selection (for UI preference only)

2. **Add authentication to extension**
   - New popup UI: Login/Register screens
   - Store JWT token in chrome.storage.local
   - Auto-refresh token before expiry

3. **Modify orchestrator to call backend**

```typescript
// src/background/api/backend-client.ts
export class BackendClient {
  private baseUrl = 'https://api.fact-it.app'; // Your backend URL

  async checkClaim(text: string): Promise<AggregatedResult> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/api/fact-check/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ claim: text })
    });

    if (response.status === 401) {
      // Token expired, prompt re-login
      throw new Error('AUTHENTICATION_REQUIRED');
    }

    if (response.status === 429) {
      // Rate limit exceeded
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    return response.json();
  }

  private async getAuthToken(): Promise<string> {
    const result = await chrome.storage.local.get('auth_token');
    if (!result.auth_token) {
      throw new Error('AUTHENTICATION_REQUIRED');
    }
    return result.auth_token;
  }
}
```

4. **Update service worker**

```typescript
// Replace orchestrator calls with backend client
import { BackendClient } from '@/background/api/backend-client';

const backendClient = new BackendClient();

async function handleCheckClaim(
  message: CheckClaimMessage,
  sendResponse: (response: ClaimResultMessage) => void
): Promise<void> {
  try {
    const { text, elementId } = message.payload;

    // Call backend instead of AI providers directly
    const result = await backendClient.checkClaim(text);

    sendResponse({
      type: MessageType.CLAIM_RESULT,
      payload: {
        elementId,
        verdict: result.verdict,
        confidence: result.confidence,
        explanation: result.explanation,
        sources: result.sources,
        providerResults: result.providerResults,
      },
    });
  } catch (error) {
    if (error.message === 'AUTHENTICATION_REQUIRED') {
      sendResponse({
        type: MessageType.CLAIM_RESULT,
        payload: { elementId, error: 'Please log in to use Fact-It' }
      });
    } else if (error.message === 'RATE_LIMIT_EXCEEDED') {
      sendResponse({
        type: MessageType.CLAIM_RESULT,
        payload: {
          elementId,
          error: 'Daily limit reached. Upgrade to Pro for unlimited checks.'
        }
      });
    }
  }
}
```

### 2.2 New Popup UI Design

**Login Screen:**
```
┌─────────────────────────────────┐
│          🔍 Fact-It             │
│                                 │
│  Email: [________________]      │
│  Password: [____________]       │
│                                 │
│  [        Login        ]        │
│  [    Create Account   ]        │
│                                 │
│  Forgot password?               │
└─────────────────────────────────┘
```

**Main Screen (Logged In):**
```
┌─────────────────────────────────┐
│  👤 user@example.com            │
│  Plan: Free (10/10 checks left) │
│                                 │
│  [   ⭐ Upgrade to Pro   ]      │
│                                 │
│  Settings:                      │
│  ☑ Auto-check posts             │
│  ☑ Show confidence scores       │
│                                 │
│  [   View History   ]           │
│  [   Logout   ]                 │
└─────────────────────────────────┘
```

---

## Phase 3: Pricing & Business Model (Week 3)

### 3.1 Freemium Model

**Free Tier:**
- 10 fact-checks per day
- Single AI provider (Anthropic Claude)
- Standard confidence display
- Access to cached results (instant)
- Cost to you: ~$0.03/day per active user

**Pro Tier - $4.99/month:**
- Unlimited fact-checks
- Multi-provider verification (OpenAI + Anthropic + Perplexity)
- Priority processing (no queue)
- Fact-check history dashboard
- Export results to CSV
- Browser sync across devices
- Cost to you: ~$1.50/month per active user
- **Profit margin: $3.49/user/month (70%)**

**Enterprise Tier - $49/month (Future):**
- API access for custom integrations
- Team accounts (5 users)
- Custom fact-check sources
- Dedicated support

### 3.2 Revenue Projections

**Conservative Scenario (Year 1):**
- 10,000 total users
- 2% conversion to Pro = 200 paid users
- Monthly revenue: $998
- Monthly costs: $300 (API) + $50 (hosting) = $350
- **Monthly profit: $648**
- **Annual profit: ~$7,776**

**Moderate Scenario (Year 1):**
- 50,000 total users
- 3% conversion to Pro = 1,500 paid users
- Monthly revenue: $7,485
- Monthly costs: $2,250 (API) + $150 (hosting) = $2,400
- **Monthly profit: $5,085**
- **Annual profit: ~$61,020**

**Optimistic Scenario (Year 2):**
- 200,000 total users
- 5% conversion to Pro = 10,000 paid users
- Monthly revenue: $49,900
- Monthly costs: $15,000 (API) + $500 (hosting) = $15,500
- **Monthly profit: $34,400**
- **Annual profit: ~$412,800**

---

## Phase 4: Firefox Submission (Week 4)

### 4.1 Firefox Add-ons (AMO) Requirements

**Before Submission:**

1. **Update manifest.json:**
   - Change `id` from `fact-it@example.com` to real email
   - Add proper description (max 132 chars)
   - Version must follow semantic versioning

2. **Create required assets:**
   - Icon: 128x128 PNG (already have ✓)
   - Screenshots: 3-5 images (1280x800 or 640x400)
   - Promotional images: Optional but recommended

3. **Prepare listing content:**
   - **Name:** "Fact-It - AI Fact Checker"
   - **Summary:** "Real-time fact-checking for social media using AI. Verify claims on Twitter, Facebook, LinkedIn instantly."
   - **Description:** (See 4.2 below)
   - **Categories:** Privacy & Security, Social & Communication
   - **Tags:** fact-checking, misinformation, AI, social-media

4. **Privacy Policy (REQUIRED):**
   - Must host on your website
   - Must explain data collection:
     - What: User accounts, fact-check queries, usage stats
     - Why: Service provision, billing, improvement
     - How: Encrypted transmission, secure storage
     - Retention: User data deleted on account closure
     - Third parties: Stripe (payments), AI providers (processing)
     - User rights: Access, deletion, export

5. **Code Review Preparation:**
   - Remove all hardcoded API keys
   - Ensure no obfuscated code
   - Add comments for complex logic
   - Source code must be readable

### 4.2 Extension Listing Description

```markdown
# Fact-It - AI-Powered Fact Checker

Combat misinformation with AI-powered fact-checking directly in your browser.

## What is Fact-It?

Fact-It helps you verify claims and statements you encounter on social media and news sites in real-time. Using advanced AI technology, it analyzes text for factual claims and provides verification with sources.

## Features

✓ Real-time fact-checking on Twitter, Facebook, and LinkedIn
✓ AI-powered claim detection and verification
✓ Multiple trusted sources for each verification
✓ Confidence scores for transparency
✓ Works on articles and social media posts
✓ Privacy-focused: We don't sell your data

## How It Works

1. Browse social media or news sites as normal
2. Fact-It automatically detects factual claims
3. Click the indicator to see verification results
4. View sources and confidence scores
5. Make informed decisions about what to trust

## Free & Pro Tiers

**Free:** 10 fact-checks per day
**Pro ($4.99/mo):** Unlimited checks + multi-source verification

## Privacy Commitment

- Your browsing history is never tracked
- Only selected text is sent for fact-checking
- End-to-end encryption for all data
- No data sold to third parties
- Open source core technology

## Support

Questions? Contact support@fact-it.app
Report issues: github.com/yourusername/fact-it
```

### 4.3 Review Process Timeline

**Mozilla's review process:**
- **Automated review:** 1-2 hours (security scans)
- **Human review:** 1-10 days (code inspection)
- **Common rejection reasons:**
  - Hardcoded API keys (we're removing these ✓)
  - Privacy policy missing
  - Unclear permissions justification
  - Obfuscated code

**After Approval:**
- Listed on addons.mozilla.org (AMO)
- Firefox Recommended badge (if high quality, takes 3-6 months)
- Auto-updates enabled for users

---

## Phase 5: Marketing & Growth (Week 5+)

### 5.1 Launch Strategy

**Pre-launch (Week 1-4):**
1. Build landing page (fact-it.app)
2. Create demo video (2 minutes)
3. Set up social media (@FactItApp)
4. Reach out to tech journalists
5. Post on Product Hunt, Hacker News
6. Contact fact-checking organizations

**Launch Day:**
1. Submit to Firefox Add-ons (AMO)
2. Post on:
   - r/firefox, r/privacy, r/technology
   - Hacker News
   - Product Hunt
   - Twitter with demo GIF
3. Email tech blogs (TechCrunch, The Verge, Ars Technica)
4. Reach out to:
   - First Draft News
   - Poynter Institute
   - Full Fact
   - Snopes

**Post-launch:**
1. Monitor reviews and respond quickly
2. Fix bugs reported by users
3. A/B test pricing ($3.99 vs $4.99 vs $5.99)
4. Add Chrome version (Week 6-8)
5. Iterate based on user feedback

### 5.2 Growth Tactics

**Organic:**
- SEO: "firefox fact checker", "misinformation blocker"
- Content marketing: Blog about misinformation cases
- YouTube reviews: Reach out to tech YouTubers
- Partnerships: Fact-checking organizations

**Paid (if budget allows):**
- Facebook/Instagram ads: $5-10/day
- Google Ads: "fact checking extension"
- Reddit sponsored posts: r/firefox, r/privacy
- Twitter promoted tweets

**Viral potential:**
- Create viral detection: When major misinformation spreads
- Leaderboard: "Most fact-checked claims this week"
- Social proof: "Join 50,000 users fighting misinformation"

---

## Phase 6: Chrome Web Store (Week 8-10)

After Firefox success, port to Chrome:
- Larger user base (65% market share vs Firefox 3%)
- Same backend, minimal extension changes
- Chrome Web Store listing ($5 one-time fee)
- Combined user base for network effects

---

## Implementation Priorities

### Must-Have for Launch:
1. ✅ Backend with authentication
2. ✅ Free tier (10 checks/day)
3. ✅ Stripe integration (Pro tier)
4. ✅ Extension-backend integration
5. ✅ Basic popup UI (login/logout)
6. ✅ Privacy policy page
7. ✅ Landing page

### Nice-to-Have (Post-launch):
- Fact-check history dashboard
- Browser sync
- Export to CSV
- Mobile app
- API access
- Chrome version

### Can Wait:
- Enterprise tier
- Custom sources
- Team accounts
- White-label solution

---

## Risk Mitigation

**Technical Risks:**
1. **Backend downtime** → Use Railway/Render (99.9% uptime SLA)
2. **AI provider outages** → Fallback to secondary provider
3. **Abuse (spam checks)** → Rate limiting + CAPTCHA on registration

**Business Risks:**
1. **Low conversion rate** → A/B test pricing, add value (history, sync)
2. **High API costs** → Aggressive caching, cheaper models for free tier
3. **Legal challenges** → Disclaimer: "AI-assisted, not editorial judgment"

**Market Risks:**
1. **Competition** → Focus on superior UX, multi-provider accuracy
2. **Platform changes** → Monitor API changes, have backup scraping methods
3. **User trust** → Transparency about AI limitations, show sources

---

## Success Metrics (KPIs)

**Month 1:**
- 1,000 installations
- 100 daily active users
- 10 Pro subscribers ($50 MRR)
- 4.0+ star rating

**Month 3:**
- 5,000 installations
- 500 daily active users
- 100 Pro subscribers ($500 MRR)
- Featured on tech blog

**Month 6:**
- 20,000 installations
- 2,000 daily active users
- 500 Pro subscribers ($2,500 MRR)
- Chrome version launched

**Month 12:**
- 100,000 installations
- 10,000 daily active users
- 3,000 Pro subscribers ($15,000 MRR)
- Profitable, sustainable business

---

## Next Steps - What to Build First

**This Week:**
1. Set up backend project (Node.js + Express + TypeScript)
2. Implement authentication endpoints
3. Create fact-check endpoint (minimal viable product)
4. Deploy to Railway/Render
5. Test with Postman

**Next Week:**
1. Integrate backend with extension
2. Build login/register popup UI
3. Update service worker to call backend
4. Test end-to-end flow
5. Add Stripe integration

**Week 3:**
1. Create landing page (fact-it.app)
2. Write privacy policy
3. Prepare Firefox submission materials
4. Create demo video
5. Submit to Firefox Add-ons

**Let's start building! Want me to scaffold the backend project structure?**
