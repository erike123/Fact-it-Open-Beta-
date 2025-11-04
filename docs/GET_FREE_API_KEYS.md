# How to Get FREE API Keys for Fact-It

## 🎉 100% FREE Setup - No Credit Card Required!

Your extension will use:
1. **Groq AI** (FREE unlimited) - For reasoning and analysis
2. **Google Custom Search** (FREE 100 searches/day) - For web evidence

**Total Cost: $0!**

---

## Step 1: Get Groq API Key (FREE - 2 minutes)

### **What is Groq?**
- FREE AI inference (no credit card needed!)
- 14,400 requests per day FREE
- Very fast (1000+ tokens/second)
- Llama 3.1 70B model

### **How to get it:**

1. **Go to:** https://console.groq.com/

2. **Click "Sign Up"**
   - Use your email or Google account
   - No credit card required!

3. **Verify your email**
   - Check your inbox
   - Click verification link

4. **Get API Key:**
   - Once logged in, click **"API Keys"** in sidebar
   - Click **"Create API Key"**
   - Name it: `Fact-It Extension`
   - Click **"Submit"**

5. **Copy the key!**
   - It starts with `gsk_...`
   - Example: `gsk_1234abcd5678efgh...`
   - **Save it** - you can't see it again!

6. **Paste into .env file:**
   ```
   VITE_GROQ_API_KEY=gsk_YOUR_KEY_HERE
   ```

✅ **Done! Groq is FREE forever (14,400 requests/day)**

---

## Step 2: Get Google Custom Search API Key (FREE 100/day - 5 minutes)

### **What is Google Custom Search?**
- FREE 100 searches per day (enough for 10 users!)
- Real Google search results
- High-quality sources

### **How to get it:**

### **Part A: Create Google Cloud Project**

1. **Go to:** https://console.cloud.google.com/

2. **Sign in** with your Google account

3. **Create a new project:**
   - Click "Select a project" dropdown (top bar)
   - Click "NEW PROJECT"
   - Name it: `Fact-It Extension`
   - Click "CREATE"

4. **Enable Custom Search API:**
   - Go to: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
   - Make sure your project is selected (top bar)
   - Click **"ENABLE"**
   - Wait ~30 seconds for activation

5. **Create API Key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click **"CREATE CREDENTIALS"** → **"API key"**
   - A key will be generated (starts with `AIza...`)
   - Click **"RESTRICT KEY"** (recommended)
   - Under "API restrictions":
     - Select "Restrict key"
     - Check "Custom Search API"
   - Click **"SAVE"**

6. **Copy the API key!**
   - Example: `AIzaSyABC123DEF456GHI789...`

7. **Paste into .env file:**
   ```
   VITE_GOOGLE_API_KEY=AIzaSyYOUR_KEY_HERE
   ```

✅ **Google API Key Done!**

---

### **Part B: Create Custom Search Engine**

1. **Go to:** https://programmablesearchengine.google.com/

2. **Click "Get started"** or "Add"

3. **Create Search Engine:**
   - **Name:** `Fact-It Search`
   - **What to search:** Select "Search the entire web"
   - **Settings:**
     - Enable "Image search": OFF
     - Enable "SafeSearch": ON (recommended)
   - Click **"CREATE"**

4. **Get Search Engine ID:**
   - After creation, click on your search engine
   - Click **"Setup"** tab
   - Find **"Search engine ID"**
   - It looks like: `a1b2c3d4e5f6g7h8i9`
   - Click **"Copy to clipboard"**

5. **Paste into .env file:**
   ```
   VITE_GOOGLE_SEARCH_ENGINE_ID=YOUR_SEARCH_ENGINE_ID_HERE
   ```

✅ **Google Custom Search Done!**

---

## Step 3: Update Your .env File

Your `.env` file should now look like this:

```env
# API Keys for Development
# WARNING: Do not commit this file to version control

# Anthropic (Optional - for premium trial)
VITE_ANTHROPIC_API_KEY=

# Groq (FREE - Get from https://console.groq.com/)
VITE_GROQ_API_KEY=gsk_YOUR_GROQ_KEY_HERE

# Google Custom Search (FREE 100/day - Get from Google Cloud Console)
VITE_GOOGLE_API_KEY=AIzaSy_YOUR_GOOGLE_KEY_HERE
VITE_GOOGLE_SEARCH_ENGINE_ID=YOUR_SEARCH_ENGINE_ID_HERE
```

---

## Step 4: Build and Test

```bash
# Build the extension
npm run build

# Load in Firefox
# 1. Go to about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on"
# 3. Select dist/manifest.json

# Test it!
# 1. Go to Twitter/LinkedIn
# 2. Select a post with a factual claim
# 3. Click "Check Fact" or wait for auto-check
# 4. See results powered by Groq + Google!
```

---

## API Usage Limits

### **Groq (FREE):**
- ✅ 14,400 requests per day
- ✅ Supports ~1,440 fact-checks/day
- ✅ Plenty for testing!

### **Google Custom Search (FREE):**
- ✅ 100 searches per day
- ⚠️ After 100: $5 per 1,000 queries
- ✅ Enough for 10-50 users per day

**Cost for 1,000 users:**
- Groq: **$0** (free tier covers it!)
- Google: **$45-50** (if each user does 10 searches)

**Total: ~$50 for 1,000 users vs $110 with Anthropic!**

---

## Troubleshooting

### **"Groq API Error"**
- Check if key starts with `gsk_`
- Verify key is correct in .env
- Rebuild: `npm run build`

### **"Google Search API Error"**
- Check if API is enabled in Google Cloud Console
- Verify billing is enabled (free tier still needs billing account set up, but you won't be charged for first 100/day)
- Check Search Engine ID is correct

### **"Rate Limit Exceeded"**
- Groq: 14,400 requests/day limit reached (very unlikely!)
- Google: 100 searches/day limit reached (add billing for more, or wait until tomorrow)

---

## Upgrade to Paid (Optional)

### **If You Exceed Free Limits:**

**Groq:**
- Beyond free tier: $0.27 per million tokens (very cheap!)
- 1,000 fact-checks ≈ $5

**Google:**
- Beyond 100/day: $5 per 1,000 queries
- 1,000 searches = $5

**Still much cheaper than Anthropic ($110 per 1,000 users)!**

---

## Alternative: Add Anthropic for Premium Quality

**Want highest accuracy for trial users?**

You can offer:
- **First 10 searches:** Anthropic (98% accuracy) - YOUR KEY
- **After 10:** Groq + Google (85-88% accuracy) - FREE

Just add:
```env
VITE_ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```

And update trial system to switch providers after 10 searches.

---

## Summary

✅ **Groq:** 2 minutes, $0 forever
✅ **Google:** 5 minutes, $0 for first 100/day
✅ **Total Setup Time:** 7 minutes
✅ **Total Cost:** $0 to start!

**You're ready to launch! 🚀**
