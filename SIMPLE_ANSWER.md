# 🎯 Simple Answer: How API Keys Work for Pro Users

## The Short Answer

**Users DON'T buy API keys. YOU buy ONE API key and all Pro users share it through your backend.**

---

## 👤 What Users See (Super Simple)

```
Step 1: User pays $6.99/month
    ↓
Step 2: Extension shows "✅ Pro Active"
    ↓
Step 3: User clicks "Check Claim"
    ↓
Step 4: Gets result (unlimited checks)
    ↓
Step 5: User is happy ✅
```

**User NEVER:**
- ❌ Sees API keys
- ❌ Creates Anthropic account
- ❌ Adds credits
- ❌ Manages anything technical

**User ONLY:**
- ✅ Pays $6.99/month
- ✅ Uses extension
- ✅ Gets unlimited checks

---

## 🔧 What Happens Behind the Scenes

### Your Setup (One Time):

**Step 1:** You go to console.anthropic.com
**Step 2:** You create ONE API key: `sk-ant-api03-xxxxx`
**Step 3:** You add $100 credit to your account
**Step 4:** You put that key in your backend server

### When User Checks a Claim:

```
User clicks "Check Claim"
    ↓
Extension sends to YOUR backend:
    "Hey backend, check this claim for license key ABC123"
    ↓
Your backend:
    1. Checks: Is license ABC123 valid? ✅
    2. Uses YOUR Anthropic key to call Claude API
    3. Gets result from Claude
    4. Sends result back to extension
    ↓
Extension shows result to user
```

### Visual Diagram:

```
┌──────────────┐
│   USER #1    │ Pays $6.99/mo
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼───────┐  ┌──────▼──────┐
│   USER #2    │  │   USER #3   │ All pay $6.99/mo
└──────┬───────┘  └──────┬──────┘
       │                 │
       └────────┬────────┘
                │
         All send requests to
                │
                ▼
        ┌───────────────┐
        │  YOUR BACKEND │
        │  (Vercel)     │
        └───────┬───────┘
                │
          Uses ONE key
                │
                ▼
        ┌───────────────┐
        │  ANTHROPIC    │
        │  Your Account │
        │  $100 credit  │
        └───────────────┘
```

---

## 💰 The Money Flow

### What Users Pay You:

```
User 1: $6.99/month → Your Stripe account
User 2: $6.99/month → Your Stripe account
User 3: $6.99/month → Your Stripe account

Total: $20.97/month revenue
```

### What You Pay Anthropic:

```
User 1: 200 checks/month × $0.011 = $2.20
User 2: 300 checks/month × $0.011 = $3.30
User 3: 250 checks/month × $0.011 = $2.75

Total: $8.25/month cost
```

### Your Profit:

```
Revenue: $20.97/month
Cost:    -$8.25/month
───────────────────────
PROFIT:  $12.72/month ✅
```

---

## 🔑 API Key Management (Your Side)

### Initial Setup:

**Day 1:**
```bash
1. Go to console.anthropic.com
2. Sign up (free)
3. Create API key
4. Add $100 credit (lasts ~2 months with 50 users)
5. Add key to your backend env variables
6. Done!
```

### Ongoing Management:

**Every 2 months:**
```bash
1. Check Anthropic dashboard
2. See: "Balance: $15 remaining"
3. Click "Add $100"
4. Done!
```

**Or set up auto-reload:**
```bash
1. Anthropic dashboard → Billing
2. Enable auto-reload
3. When balance < $20 → Auto add $100
4. Never think about it again ✅
```

---

## 🛡️ What If You Run Out of Credits?

### Manual Monitoring:

```javascript
// Daily email to yourself
Every morning at 9am:
    Check Anthropic balance
    If balance < $20:
        Email you: "⚠️ Add credits soon"
    If balance < $10:
        Email you: "🚨 ADD CREDITS NOW"
```

### Automatic Failover:

```javascript
// In your backend
try {
  // Try Anthropic (your paid key)
  result = await claude.check(claim);
} catch (error) {
  if (error.code === 'insufficient_credits') {
    // Fallback to Groq (free backup)
    result = await groq.check(claim);

    // Email yourself
    sendEmail('you@email.com',
      '🚨 Anthropic credits depleted - using Groq fallback');
  }
}
```

---

## 🎯 Simplest Possible Architecture

### Backend (Vercel - 1 file):

```javascript
// api/check.js
import Anthropic from '@anthropic-ai/sdk';

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_KEY // YOUR key, shared by all users
});

export default async function(req, res) {
  const { license, text } = req.body;

  // 1. Verify subscription
  const valid = await checkLicense(license);
  if (!valid) return res.status(401).json({ error: 'Invalid' });

  // 2. Call Anthropic with YOUR key
  const result = await claude.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: text }]
  });

  // 3. Return to user
  return res.json(result);
}
```

### Extension (1 function):

```typescript
// service-worker.ts
async function checkClaimPro(text: string) {
  const { licenseKey } = await chrome.storage.local.get('licenseKey');

  const response = await fetch('https://api.factit.app/check', {
    method: 'POST',
    body: JSON.stringify({ license: licenseKey, text })
  });

  return response.json();
}
```

**Total code:** ~30 lines
**Complexity:** Very low
**User setup:** Zero

---

## 🚦 Step-by-Step Launch Plan

### Week 1: Free Tier Only
- Extension uses Groq (your free key - already done!)
- Get 100+ users
- No backend needed yet

### Week 2: Prepare Pro Backend
```bash
✅ Create Anthropic account
✅ Get API key
✅ Add $100 credit
✅ Deploy simple backend to Vercel
✅ Test with your own extension
```

### Week 3: Add Payments
```bash
✅ Create Stripe/Gumroad account
✅ Create product: "Pro Subscription - $6.99/mo"
✅ Add "Upgrade to Pro" button in extension
✅ Test payment flow with friend
```

### Week 4: Launch Pro
```bash
✅ Enable Pro for all users
✅ Monitor Anthropic usage dashboard
✅ Get first paying customers 💰
```

---

## 💡 Real Example Walkthrough

### Scenario: User "John" Upgrades to Pro

**9:00 AM - John hits free tier limit**
```
Extension shows:
"Daily limit reached (100/100)

💎 Upgrade to Pro for unlimited checks
$6.99/month - Cancel anytime

[Upgrade Now]"
```

**9:01 AM - John clicks "Upgrade Now"**
```
Opens: factit.app/upgrade
Shows Stripe checkout
John enters card: •••• 4242
Clicks "Subscribe"
```

**9:02 AM - Payment processed**
```
Stripe webhook → Your backend:
{
  email: "john@email.com",
  subscriptionId: "sub_xyz",
  status: "active"
}

Your backend:
1. Generate license: "FACTIT-A1B2-C3D4-E5F6"
2. Save to database:
   {
     email: "john@email.com",
     license: "FACTIT-A1B2-C3D4-E5F6",
     plan: "pro",
     status: "active"
   }
3. Email John the license key
```

**9:03 AM - John activates Pro**
```
John gets email:
"Your Fact-It Pro license: FACTIT-A1B2-C3D4-E5F6"

John opens extension
Clicks "Activate Pro"
Pastes: FACTIT-A1B2-C3D4-E5F6
Extension saves to storage

Extension now shows:
"✅ PRO ACTIVE - Unlimited checks"
```

**9:04 AM - John checks first Pro claim**
```
Extension → Your backend:
POST /check
{
  license: "FACTIT-A1B2-C3D4-E5F6",
  text: "Earth is flat"
}

Your backend:
1. Verify license ✅
2. Call Anthropic using YOUR key:
   {
     apiKey: "sk-ant-api03-YOUR-KEY",
     model: "claude-opus",
     prompt: "Fact-check: Earth is flat"
   }
3. Anthropic charges YOUR account: $0.011
4. Returns result:
   {
     verdict: "false",
     confidence: 99,
     explanation: "The Earth is an oblate spheroid..."
   }

Your backend → Extension → John sees:
"❌ FALSE (99% confidence)
The Earth is an oblate spheroid, not flat.
This is proven by satellite imagery, physics..."
```

**Your Accounting:**
```
Revenue from John: $6.99/month
Cost for John's check: -$0.011
Net: $6.979 ✅

John does 300 checks this month:
Cost: 300 × $0.011 = $3.30
Net profit from John: $6.99 - $3.30 = $3.69 ✅
```

---

## ❓ Common Questions

### Q: What if 1000 users all upgrade at once?

**A:** No problem!
- Your ONE Anthropic key handles unlimited requests (rate limit: 10,000 req/min)
- You just need more credits
- 1000 users × 300 checks/mo = 300,000 checks
- Cost: $3,300/month
- Revenue: $6,990/month
- Profit: $3,690/month ✅

### Q: What if Anthropic raises prices?

**A:** Adjust your pricing:
- If cost goes from $0.011 → $0.02 per check
- Change Pro price from $6.99 → $10.99
- Grandfather existing users at old price (good will)
- New users pay new price

### Q: What if your API key gets leaked?

**A:** Revoke and create new one:
1. Anthropic console → Revoke old key
2. Create new key
3. Update backend env variable
4. Redeploy (30 seconds on Vercel)
5. Extension keeps working (uses backend, not direct key)

### Q: Can users see your API key?

**A:** No! Because:
- Extension calls YOUR backend (not Anthropic directly)
- Key is stored on YOUR server (Vercel env variables)
- Extension never sees the key
- Users only see their license key

---

## 🎊 Final Summary

### User's Experience:
1. Pay $6.99/month ✅
2. Extension works ✅
3. That's it ✅

### Your Setup:
1. Buy ONE Anthropic API key (one-time)
2. Add $100 credit (lasts 2 months)
3. Deploy simple backend (free on Vercel)
4. Collect $6.99/month per user
5. Pay ~$3/month per user to Anthropic
6. Keep ~$4/month profit per user
7. Scale! 🚀

### Bottom Line:

**Users pay YOU → You pay Anthropic → You keep the difference**

**It's that simple!** 🎉

---

## 🚀 Next Action

**Right now:**
1. Test extension locally (free tier)
2. Submit to Firefox/Chrome stores
3. Get 100+ users

**Next week:**
1. Create Anthropic account
2. Get API key
3. Add $100 credit
4. Deploy backend
5. Launch Pro tier
6. Start earning! 💰

**Check the full details in: `PRO_TIER_ARCHITECTURE.md`**
