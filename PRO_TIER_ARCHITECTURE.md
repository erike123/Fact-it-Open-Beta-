# 🏗️ Pro Tier Architecture: How API Keys Work Under the Hood

## 🎯 The Big Question: Who Owns the API Keys?

You're asking the RIGHT question! Here are the 3 possible architectures:

---

## ✅ Architecture 1: YOU Own All API Keys (RECOMMENDED - Simplest for Users)

### How It Works:

**User's perspective:**
1. User pays $6.99/month
2. Extension works with unlimited checks
3. **User never sees or touches API keys**
4. User never worries about costs
5. Cancel subscription anytime

**Behind the scenes:**
1. **You buy ONE Anthropic API key** (for all Pro users)
2. **You add $100 credit** to that key
3. All Pro users **share your API key** via your backend
4. You **track each user's usage** in your database
5. When credit runs low, **you top up** with subscription revenue

### Visual Flow:

```
User pays $6.99/month
    ↓
Subscription active in your database
    ↓
User clicks "Check Claim" in extension
    ↓
Extension sends request to YOUR backend:
    POST https://api.factit.app/check-claim
    Headers: { Authorization: "Bearer USER_LICENSE_KEY" }
    Body: { text: "Claim to check..." }
    ↓
Your backend:
    1. Verifies user's license key
    2. Checks if subscription active
    3. Uses YOUR Anthropic API key to call Claude
    4. Records usage in database
    5. Returns result to extension
    ↓
Extension shows result to user
```

### Backend Code Example:

```javascript
// api/check-claim.js (Your backend API)
import Anthropic from '@anthropic-ai/sdk';

// YOUR API key (ONE key for all Pro users)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // sk-ant-api03-xxx
});

export default async function handler(req, res) {
  const { licenseKey, text } = req.body;

  // 1. Verify user is Pro subscriber
  const user = await db.users.findOne({
    licenseKey,
    status: 'active'
  });

  if (!user) {
    return res.status(401).json({
      error: 'Invalid license or subscription expired'
    });
  }

  // 2. Call Anthropic API using YOUR key
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Fact-check this claim: "${text}"`
      }]
    });

    // 3. Track usage in database
    await db.users.updateOne(
      { licenseKey },
      {
        $inc: { checksThisMonth: 1 },
        $set: { lastCheckAt: new Date() }
      }
    );

    // 4. Return result to user
    return res.json({
      verdict: message.content[0].text,
      usage: {
        checksThisMonth: user.checksThisMonth + 1
      }
    });

  } catch (error) {
    console.error('Anthropic API error:', error);
    return res.status(500).json({
      error: 'Fact-check failed'
    });
  }
}
```

### Cost Management:

**Monthly costs for you:**

```
100 Pro subscribers × 300 checks/month average = 30,000 checks/month

Cost per check: $0.011
Total API cost: 30,000 × $0.011 = $330/month

Revenue: 100 × $6.99 = $699/month
API Cost: $330/month
Profit: $369/month ✅
```

**When to top up:**

```javascript
// Automatic credit monitoring
async function checkAnthropicCredits() {
  // Check your Anthropic account balance
  const balance = await anthropic.billing.getBalance();

  if (balance < 20) {
    // Send yourself email alert
    await sendEmail('you@email.com',
      'Low Anthropic credits',
      `Current balance: $${balance}. Please top up.`
    );
  }
}

// Run daily
setInterval(checkAnthropicCredits, 24 * 60 * 60 * 1000);
```

### Pros & Cons:

✅ **PROS:**
- Simplest for users (zero setup)
- You control quality (one API key = consistent performance)
- Predictable costs (you manage budget)
- Users never see API errors
- Easy to track usage per user

❌ **CONS:**
- You need to manage credits
- Initial $100 investment in Anthropic credits
- If you run out of credits, all Pro users affected

---

## Architecture 2: USERS Bring Their Own API Keys (Cheapest for You)

### How It Works:

**User's perspective:**
1. User pays $6.99/month (or FREE if they have API key)
2. User goes to Anthropic.com
3. User creates account and gets API key
4. User adds $20 credit to their account
5. User pastes API key into extension settings
6. Extension uses their key directly

**Behind the scenes:**
1. User's API key stored in extension (chrome.storage.local)
2. Extension calls Anthropic DIRECTLY (no backend needed)
3. Anthropic charges user's account (not yours)
4. You charge subscription for "Pro features" (unlimited checks, priority support)

### Visual Flow:

```
User subscribes to Pro ($6.99/mo)
    ↓
Extension shows: "Add your Anthropic API key for unlimited checks"
    ↓
User goes to console.anthropic.com
    ↓
User creates account → Gets API key (sk-ant-xxx)
    ↓
User adds $20 credit to their Anthropic account
    ↓
User pastes key in extension settings
    ↓
Extension stores key locally
    ↓
When checking claims:
    Extension calls Anthropic DIRECTLY using user's key
    ↓
Anthropic charges user's account (not yours!)
```

### Extension Code Example:

```typescript
// Extension calls Anthropic directly (no backend)
async function verifyClaimPro(text: string) {
  // Get user's own API key from storage
  const settings = await chrome.storage.local.get('proApiKey');

  if (!settings.proApiKey) {
    return {
      error: 'Please add your Anthropic API key in settings'
    };
  }

  // Call Anthropic using THEIR key
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': settings.proApiKey, // User's key
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Fact-check: "${text}"`
      }]
    })
  });

  const data = await response.json();
  return data;
}
```

### Pros & Cons:

✅ **PROS:**
- Zero API costs for you
- No backend needed
- Users pay for what they use
- Scales infinitely (no cost increase)

❌ **CONS:**
- Users must create Anthropic account
- Users must add credit ($20 minimum)
- Users must understand API keys
- Support burden (users have API issues)
- Bad UX (too complex for average user)

**Verdict:** ❌ Too complicated for most users. Only works for technical users.

---

## 🌟 Architecture 3: HYBRID (Best of Both Worlds)

### How It Works:

**You provide TWO options:**

**Option A: Simple Pro** ($6.99/month)
- Use YOUR shared API key
- Limited to 500 checks/month
- Perfect for 95% of users
- Zero setup required

**Option B: Unlimited Pro** ($4.99/month + BYOK)
- User brings their own API key
- Unlimited checks (they pay Anthropic directly)
- Cheaper subscription (just $4.99 for "Pro features")
- For power users

### Visual Comparison:

```
┌─────────────────────────────────────┐
│  Simple Pro ($6.99/mo)              │
├─────────────────────────────────────┤
│  ✓ No API key needed                │
│  ✓ Up to 500 checks/month           │
│  ✓ We handle everything             │
│  ✓ Cancel anytime                   │
│                                     │
│  [Subscribe] ← Most users pick this │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Unlimited Pro ($4.99/mo + BYOK)    │
├─────────────────────────────────────┤
│  ✓ Bring your own Anthropic key     │
│  ✓ Unlimited checks                 │
│  ✓ You pay Anthropic directly       │
│  ✓ Lower subscription cost          │
│                                     │
│  [Subscribe] ← Power users          │
└─────────────────────────────────────┘
```

### Backend Logic:

```javascript
export default async function handler(req, res) {
  const { licenseKey, text, userApiKey } = req.body;

  // Verify subscription
  const user = await db.users.findOne({ licenseKey });

  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid subscription' });
  }

  // Determine which API key to use
  let anthropicKey;
  let checkLimit;

  if (user.plan === 'simple_pro') {
    // Option A: Use YOUR shared key
    anthropicKey = process.env.ANTHROPIC_API_KEY;
    checkLimit = 500;

    // Check if user exceeded limit
    if (user.checksThisMonth >= checkLimit) {
      return res.status(429).json({
        error: `Monthly limit reached (${checkLimit} checks). Upgrade to Unlimited Pro or wait for reset.`
      });
    }

  } else if (user.plan === 'unlimited_pro') {
    // Option B: Use THEIR key
    if (!userApiKey) {
      return res.status(400).json({
        error: 'Please add your Anthropic API key in settings'
      });
    }
    anthropicKey = userApiKey;
    checkLimit = Infinity; // No limit
  }

  // Call Anthropic
  const anthropic = new Anthropic({ apiKey: anthropicKey });
  const result = await anthropic.messages.create({...});

  // Track usage
  await db.users.updateOne(
    { licenseKey },
    { $inc: { checksThisMonth: 1 } }
  );

  return res.json(result);
}
```

### Pros & Cons:

✅ **PROS:**
- Simple option for 95% of users
- Advanced option for power users
- You make money from both tiers
- Lower support burden (most pick simple)

❌ **CONS:**
- Two code paths to maintain
- Two pricing tiers to explain
- Still need backend for both

---

## 🏆 RECOMMENDED: Architecture 1 (You Own Keys)

### Why This is Best:

1. **Simplest for users** - Zero setup, works instantly
2. **Professional UX** - User never thinks about API keys
3. **Predictable revenue** - You know costs upfront
4. **Quality control** - One key = consistent performance
5. **Scalable** - Add $100 credit when needed

### Complete Implementation:

#### Step 1: Get Anthropic API Key

```bash
1. Go to: https://console.anthropic.com/
2. Sign up (free)
3. Go to "API Keys"
4. Create key: sk-ant-api03-xxxxxxxxxx
5. Copy to safe place
```

#### Step 2: Add Credits ($100 to start)

```bash
1. Go to "Billing" in Anthropic console
2. Click "Add Credits"
3. Add $100 (supports ~9,000 fact-checks)
4. Set up auto-reload at $20 (optional)
```

#### Step 3: Create Simple Backend

**Deploy on Vercel (FREE):**

```javascript
// api/check-claim.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // Your key
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { licenseKey, text } = req.body;

  // Verify license
  const user = await verifyLicense(licenseKey);
  if (!user) {
    return res.status(401).json({ error: 'Invalid license' });
  }

  // Check Anthropic
  const message = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Fact-check this claim: "${text}". Return JSON with verdict (true/false/unknown), confidence (0-100), explanation.`
    }]
  });

  // Parse response
  const result = JSON.parse(message.content[0].text);

  // Track usage
  await recordUsage(licenseKey);

  return res.json(result);
}
```

#### Step 4: Update Extension

```typescript
// service-worker.ts
async function handleCheckClaimPro(text: string, licenseKey: string) {
  // Call YOUR backend (which uses YOUR Anthropic key)
  const response = await fetch('https://api.factit.app/check-claim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      licenseKey,
      text
    })
  });

  const result = await response.json();
  return result;
}
```

#### Step 5: Monitor Costs

**Set up daily credit check:**

```javascript
// scripts/check-credits.js
import Anthropic from '@anthropic-ai/sdk';
import { sendEmail } from './email';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function checkCredits() {
  // Get account info
  const account = await fetch('https://api.anthropic.com/v1/account', {
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY
    }
  });

  const data = await account.json();
  const balance = data.balance;

  console.log(`Current Anthropic balance: $${balance}`);

  // Alert if low
  if (balance < 20) {
    await sendEmail({
      to: 'you@email.com',
      subject: '🚨 Low Anthropic Credits',
      body: `Balance: $${balance}. Please top up at console.anthropic.com`
    });
  }
}

// Run daily
checkCredits();
```

**Run via GitHub Actions (free cron job):**

```yaml
# .github/workflows/check-credits.yml
name: Check API Credits
on:
  schedule:
    - cron: '0 12 * * *' # Daily at noon
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: node scripts/check-credits.js
```

---

## 💰 Cost Projections (Architecture 1)

### Realistic Scenario:

**Month 1:**
- 10 Pro subscribers
- 200 checks/month average per user = 2,000 total checks
- Cost: 2,000 × $0.011 = $22
- Revenue: 10 × $6.99 = $69.90
- **Profit: $47.90** ✅

**Month 3:**
- 50 Pro subscribers
- 250 checks/month average = 12,500 total
- Cost: $137.50
- Revenue: $349.50
- **Profit: $212** ✅

**Month 6:**
- 200 Pro subscribers
- 300 checks/month average = 60,000 total
- Cost: $660
- Revenue: $1,398
- **Profit: $738** ✅

**Year 1:**
- 1,000 Pro subscribers
- 350 checks/month average = 350,000 total
- Cost: $3,850/month
- Revenue: $6,990/month
- **Profit: $3,140/month** ($37,680/year) ✅

### When to Top Up Credits:

```
Initial: $100 credit
    ↓
Supports: ~9,000 fact-checks
    ↓
With 50 users @ 200 checks/month = 10,000 checks/month
    ↓
Credits last: ~3 weeks
    ↓
Top up: $150/month to stay ahead
```

**Pro tip:** Enable auto-reload in Anthropic console:
- Set threshold: $20 remaining
- Auto-add: $100
- You never run out of credits

---

## 🚀 Simplest Implementation Path

### Week 1: Launch Free Tier
- Use Groq (free)
- Get users
- No backend needed

### Week 2: Add Pro with Gumroad
- Use Gumroad for payments
- Still use Groq (free)
- "Coming Soon: Claude Opus upgrade"

### Week 3: Get Anthropic API Key
- Sign up at console.anthropic.com
- Add $100 credit
- Keep it safe

### Week 4: Build Simple Backend
- Deploy to Vercel (free)
- One endpoint: /check-claim
- Uses your Anthropic key
- Verifies license, calls Claude, returns result

### Week 5: Update Extension
- Pro users call your backend
- Free users still use Groq
- Test with 5 beta users

### Week 6: Launch Pro Publicly
- Enable Pro for everyone
- Monitor costs daily
- **Start making profit!** 💰

---

## 🎯 Final Recommendation

### Use Architecture 1: YOU Own All Keys

**Why:**
- ✅ Users pay $6.99/month → Extension works → Done
- ✅ No API key complexity for users
- ✅ You control costs (predictable)
- ✅ Professional user experience
- ✅ Scales easily (add credits when needed)

**Setup:**
- 1 Anthropic API key (yours)
- $100 initial credit
- Simple backend (Vercel free tier)
- Auto-reload credits (set & forget)

**User Experience:**
1. User pays $6.99/month
2. Extension activates Pro
3. Unlimited checks (up to 500/month)
4. User never sees or touches API keys
5. Cancel anytime

**Your Experience:**
1. Get Anthropic key once
2. Add $100 credit once
3. Set auto-reload
4. Forget about it
5. Profit scales with subscribers

---

## 📊 Quick Cost Calculator

```
Number of Pro subscribers: ____
Average checks per user/month: 300
Total checks: ____ × 300 = ____

API cost: Total checks × $0.011 = $____
Revenue: Subscribers × $6.99 = $____
PROFIT: Revenue - API cost = $____ ✅

Break-even: ~15 Pro subscribers
Good profit: 50+ Pro subscribers ($200+/mo profit)
Great profit: 200+ Pro subscribers ($1,000+/mo profit)
```

---

## 🎊 Summary: Keep It Simple

**For Users:**
- Pay $6.99/month
- Extension works
- No API key setup
- No credit management
- Cancel anytime

**For You:**
- Get ONE Anthropic API key
- Add $100 credit
- Deploy simple backend
- Set auto-reload
- Profit! 💰

**Next step:** Get your Anthropic API key and add $100 credit. You'll be ready to launch Pro tier! 🚀
