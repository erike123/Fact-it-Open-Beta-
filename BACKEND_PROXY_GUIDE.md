# Backend API Proxy - Complete Implementation Guide

## Overview

This guide shows you how to build a backend API that sits between your extension and AI providers, so users don't need their own API keys.

---

## 🏗️ Architecture

```
Extension → YOUR Backend API → AI Providers (OpenAI, Anthropic, etc.)
```

**Flow:**
1. User subscribes and gets a license key from you
2. Extension sends fact-check request + license key to YOUR API
3. YOUR API validates license, checks subscription tier
4. YOUR API calls AI providers using YOUR keys
5. YOUR API returns result to extension
6. You pay AI providers, user only pays you

---

## 📦 Tech Stack Options

### Option 1: Node.js + Express (RECOMMENDED - Easiest)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Hosting:** Vercel (free tier), Railway ($5/month), or DigitalOcean ($6/month)
- **Database:** Supabase (free tier) or PostgreSQL

### Option 2: Python + FastAPI
- **Runtime:** Python
- **Framework:** FastAPI
- **Hosting:** Railway, Render, or AWS Lambda
- **Database:** Supabase or PostgreSQL

### Option 3: Serverless (Most Scalable)
- **Platform:** Vercel Edge Functions or Cloudflare Workers
- **Database:** Supabase or Planetscale
- **Pros:** Auto-scales, pay per request, no server management

---

## 🚀 Quick Start: Node.js + Express Backend

### Step 1: Create Backend Project

```bash
mkdir fact-it-backend
cd fact-it-backend
npm init -y
npm install express cors dotenv stripe openai @anthropic-ai/sdk
npm install --save-dev typescript @types/node @types/express ts-node
```

### Step 2: Project Structure

```
fact-it-backend/
├── src/
│   ├── server.ts              # Main Express server
│   ├── routes/
│   │   ├── fact-check.ts      # Fact-checking endpoint
│   │   ├── subscription.ts    # Stripe webhooks
│   │   └── auth.ts            # License validation
│   ├── services/
│   │   ├── ai-providers.ts    # AI provider integrations
│   │   ├── license.ts         # License key validation
│   │   └── usage-tracking.ts  # Usage limits
│   ├── middleware/
│   │   └── auth.ts            # Verify license keys
│   └── db/
│       └── supabase.ts        # Database client
├── .env                        # API keys (NEVER commit!)
├── package.json
└── tsconfig.json
```

---

## 💻 Complete Backend Code

### File: `src/server.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { factCheckRouter } from './routes/fact-check';
import { subscriptionRouter } from './routes/subscription';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Routes
app.use('/api/fact-check', factCheckRouter);
app.use('/api/subscription', subscriptionRouter);

app.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
});
```

---

### File: `src/routes/fact-check.ts`

```typescript
import express from 'express';
import { verifyLicense } from '../middleware/auth';
import { checkUsageLimit } from '../services/usage-tracking';
import { factCheckWithAI } from '../services/ai-providers';

export const factCheckRouter = express.Router();

/**
 * POST /api/fact-check
 *
 * Request body:
 * {
 *   licenseKey: string,
 *   text: string,
 *   platform: 'twitter' | 'linkedin' | 'facebook'
 * }
 */
factCheckRouter.post('/', verifyLicense, async (req, res) => {
  try {
    const { text, platform } = req.body;
    const user = req.user; // Set by verifyLicense middleware

    // Check if user has exceeded usage limits
    const limitCheck = await checkUsageLimit(user.id, user.tier);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: 'Upgrade to Pro for unlimited fact-checks',
        checksRemaining: limitCheck.remaining,
        resetDate: limitCheck.resetDate,
      });
    }

    // Perform fact-check using YOUR API keys
    const result = await factCheckWithAI(text, user.tier);

    // Track usage
    await trackUsage(user.id);

    res.json({
      verdict: result.verdict,
      confidence: result.confidence,
      explanation: result.explanation,
      sources: result.sources,
      checksRemaining: limitCheck.remaining - 1,
    });
  } catch (error) {
    console.error('Fact-check error:', error);
    res.status(500).json({
      error: 'Fact-check failed',
      message: error.message,
    });
  }
});
```

---

### File: `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tier: 'free' | 'pro' | 'business' | 'enterprise';
        email: string;
      };
    }
  }
}

/**
 * Middleware to verify license key
 */
export async function verifyLicense(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const licenseKey = req.headers['x-license-key'] as string;

    if (!licenseKey) {
      return res.status(401).json({
        error: 'No license key provided',
        message: 'Please subscribe to use this feature',
      });
    }

    // Validate license in database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('license_key', licenseKey)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      return res.status(401).json({
        error: 'Invalid license key',
        message: 'Your subscription may have expired',
      });
    }

    // Check if subscription expired
    if (new Date(subscription.expires_at) < new Date()) {
      return res.status(401).json({
        error: 'Subscription expired',
        message: 'Please renew your subscription',
      });
    }

    // Attach user info to request
    req.user = {
      id: subscription.user_id,
      tier: subscription.tier,
      email: subscription.email,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
}
```

---

### File: `src/services/ai-providers.ts`

```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize with YOUR API keys from .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function factCheckWithAI(
  text: string,
  tier: 'free' | 'pro' | 'business' | 'enterprise'
) {
  // Free tier: Use Groq (free)
  if (tier === 'free') {
    return await factCheckWithGroq(text);
  }

  // Pro/Business/Enterprise: Use premium AI
  // Run multiple providers in parallel
  const results = await Promise.allSettled([
    factCheckWithOpenAI(text),
    factCheckWithAnthropic(text),
  ]);

  // Aggregate results
  return aggregateResults(results);
}

async function factCheckWithOpenAI(text: string) {
  // Stage 1: Detect claims
  const claimDetection = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Detect factual claims in the following text. Return JSON.',
      },
      { role: 'user', content: text },
    ],
    response_format: { type: 'json_object' },
  });

  const claims = JSON.parse(claimDetection.choices[0].message.content);

  if (!claims.hasClaim) {
    return {
      verdict: 'no_claim',
      confidence: 100,
      explanation: 'No factual claims detected',
      sources: [],
    };
  }

  // Stage 2: Verify claim with web search
  const verification = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Verify the following claim using web search. Return JSON with verdict, confidence, explanation, sources.',
      },
      { role: 'user', content: claims.claim },
    ],
    tools: [
      {
        type: 'web_search',
      },
    ],
  });

  return JSON.parse(verification.choices[0].message.content);
}

async function factCheckWithAnthropic(text: string) {
  // Similar implementation for Anthropic
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Fact-check this text: ${text}`,
      },
    ],
  });

  return parseAnthropicResponse(response);
}

async function factCheckWithGroq(text: string) {
  // Call Groq API (free tier)
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'user', content: `Fact-check: ${text}` },
      ],
    }),
  });

  const data = await response.json();
  return parseGroqResponse(data);
}

function aggregateResults(results: any[]) {
  // Combine results from multiple providers
  // Calculate consensus, weighted confidence, etc.
  // Return aggregated verdict
}
```

---

### File: `src/services/usage-tracking.ts`

```typescript
import { supabase } from '../db/supabase';

const USAGE_LIMITS = {
  free: 100,      // 100 checks per day
  pro: Infinity,  // Unlimited
  business: Infinity,
  enterprise: Infinity,
};

export async function checkUsageLimit(
  userId: string,
  tier: 'free' | 'pro' | 'business' | 'enterprise'
) {
  const today = new Date().toISOString().split('T')[0];

  // Get today's usage
  const { data: usage } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today);

  const checksUsed = usage?.length || 0;
  const limit = USAGE_LIMITS[tier];
  const remaining = limit === Infinity ? Infinity : limit - checksUsed;

  return {
    allowed: remaining > 0,
    remaining: remaining,
    checksUsed: checksUsed,
    resetDate: new Date(today + 'T23:59:59Z'),
  };
}

export async function trackUsage(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  await supabase.from('usage_logs').insert({
    user_id: userId,
    date: today,
    timestamp: new Date().toISOString(),
  });
}
```

---

### File: `.env`

```bash
# AI Provider API Keys (YOUR keys, not user's)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GROQ_API_KEY=gsk-your-groq-key
PERPLEXITY_API_KEY=pplx-your-perplexity-key

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# Server
PORT=3000
NODE_ENV=production
```

---

## 🗄️ Database Schema (Supabase)

### Table: `subscriptions`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  license_key TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'business', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  INDEX (license_key),
  INDEX (email)
);
```

### Table: `usage_logs`

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX (user_id, date)
);
```

---

## 🔄 Update Extension to Use Backend

### Old Code (Direct API calls):
```typescript
// ❌ This exposes user's API keys and makes them pay providers
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${userApiKey}`,
  },
  // ...
});
```

### New Code (Backend proxy):
```typescript
// ✅ This calls YOUR backend, user only needs license key
const response = await fetch('https://your-backend.com/api/fact-check', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-License-Key': userLicenseKey, // From subscription
  },
  body: JSON.stringify({
    text: postText,
    platform: 'twitter',
  }),
});

const result = await response.json();
// { verdict, confidence, explanation, sources, checksRemaining }
```

---

## 💳 Stripe Integration (Subscriptions)

### Step 1: Create Stripe Products

```bash
# In Stripe Dashboard:
1. Create Product: "Fact-It Pro"
2. Price: $9.99/month recurring
3. Copy Product ID & Price ID
```

### Step 2: Checkout Flow

```typescript
// In your backend: src/routes/subscription.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/api/subscription/create-checkout', async (req, res) => {
  const { email, tier } = req.body;

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    mode: 'subscription',
    line_items: [
      {
        price: 'price_1234567890', // Your Stripe Price ID
        quantity: 1,
      },
    ],
    success_url: 'https://your-site.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://your-site.com/cancel',
  });

  res.json({ url: session.url });
});
```

### Step 3: Webhook Handler (Create License Key)

```typescript
// Stripe webhook: Creates license key when user subscribes
app.post('/api/subscription/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Generate license key
    const licenseKey = generateLicenseKey();

    // Save to database
    await supabase.from('subscriptions').insert({
      email: session.customer_email,
      license_key: licenseKey,
      tier: 'pro',
      status: 'active',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Email license key to user
    await sendLicenseKeyEmail(session.customer_email, licenseKey);
  }

  res.json({ received: true });
});

function generateLicenseKey(): string {
  // Generate unique license key
  return `FACTIT-${crypto.randomUUID().toUpperCase()}`;
}
```

---

## 📱 User Experience Flow

### 1. User Subscribes

**Extension Popup → "Upgrade to Pro" button:**
```typescript
async function handleUpgrade() {
  // Open checkout page
  const response = await fetch('https://your-backend.com/api/subscription/create-checkout', {
    method: 'POST',
    body: JSON.stringify({
      email: userEmail,
      tier: 'pro',
    }),
  });

  const { url } = await response.json();
  window.open(url); // Opens Stripe checkout
}
```

### 2. User Completes Payment

Stripe → Your Webhook → Database:
- License key generated
- Subscription created
- Email sent to user with license key

### 3. User Activates License

**Extension Popup → "Enter License Key":**
```typescript
async function activateLicense(licenseKey: string) {
  // Save license key locally
  await chrome.storage.local.set({ licenseKey });

  // Verify with backend
  const response = await fetch('https://your-backend.com/api/subscription/verify', {
    headers: { 'X-License-Key': licenseKey },
  });

  if (response.ok) {
    alert('Pro subscription activated! 🎉');
  }
}
```

### 4. User Uses Extension

**Every fact-check request:**
```typescript
const licenseKey = await chrome.storage.local.get('licenseKey');

const response = await fetch('https://your-backend.com/api/fact-check', {
  headers: { 'X-License-Key': licenseKey },
  body: JSON.stringify({ text }),
});

// Backend validates license, checks usage limits, calls AI
```

---

## 🚀 Deployment

### Option 1: Vercel (Easiest, Free)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd fact-it-backend
vercel deploy --prod
```

**Vercel gives you:** `https://your-backend.vercel.app`

### Option 2: Railway ($5/month)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Option 3: DigitalOcean App Platform ($6/month)

1. Push code to GitHub
2. Connect repo in DigitalOcean
3. Auto-deploys on push

---

## 💰 Cost Breakdown

### Your Monthly Costs (100 users, 50 Pro subscribers):

| Item | Cost |
|------|------|
| Vercel/Railway hosting | $0-10 |
| Supabase database | $0 (free tier) |
| Stripe fees (2.9% + $0.30) | ~$18 |
| OpenAI API (Pro users) | ~$250 |
| Anthropic API (Pro users) | ~$150 |
| **TOTAL** | **$418-428** |

### Your Revenue:
- 50 Pro users × $9.99 = **$499.50/month**

### Your Profit:
- **$71-81/month** (~15% margin)

**To improve margins:**
- Use Groq for Stage 1 (free)
- Only use paid AI for Stage 2
- Reduce to ~$150 API costs → **$350/month profit (70% margin)**

---

## 🎯 Summary

**What User Experiences:**
1. ✅ Pays you $9.99/month
2. ✅ Gets license key instantly
3. ✅ Enters key in extension
4. ✅ Fact-checking works immediately
5. ✅ Never touches AI provider websites

**What You Do:**
1. ✅ User pays you via Stripe
2. ✅ You generate license key
3. ✅ Extension calls your backend with key
4. ✅ You call AI providers with your keys
5. ✅ You pay AI providers monthly
6. ✅ You keep the profit

---

## ❓ FAQ

**Q: Do I need to register company to use Stripe?**
A: No, you can start as an individual. Stripe supports sole proprietors.

**Q: How much does backend hosting cost?**
A: $0-10/month (Vercel free tier or Railway $5/month)

**Q: What if AI costs exceed revenue?**
A: Implement smart limits:
- Free tier: 100/day (Groq only)
- Pro tier: 500/day (reasonable limit)
- If user exceeds, show upgrade prompt

**Q: Can I start without backend?**
A: No, backend is ESSENTIAL for proper monetization. Users shouldn't manage their own AI keys.

---

## 🆘 Need Help?

**Say:** "Implement backend proxy" and I'll:
1. Generate complete backend code
2. Set up database schema
3. Update extension to call backend
4. Help with deployment

Ready to build this properly?
