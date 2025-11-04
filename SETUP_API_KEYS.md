# Quick Setup: Get Free API Keys (5 minutes)

## Problem: Extension shows "Medium State" / Not checking claims

**Cause**: Missing API keys in `.env` file

**Solution**: Get 2 free API keys (takes ~5 minutes total)

---

## Step 1: Get Groq API Key (FREE - 2 minutes)

### What is Groq?
- FREE AI inference (14,400 requests/day)
- No credit card required
- Instant signup

### How to get it:

1. Go to: **https://console.groq.com/**

2. Click **"Sign Up"** or **"Get Started"**

3. Sign up with:
   - Google account (fastest), OR
   - Email + password

4. After login, go to **"API Keys"** section

5. Click **"Create API Key"**

6. Copy the key (starts with `gsk_...`)

7. Open `.env` file in your project

8. Paste the key:
   ```env
   VITE_GROQ_API_KEY=gsk_your_key_here_xxxxxxxxxx
   ```

---

## Step 2: Get Google Custom Search API Key (FREE - 3 minutes)

### What is Google Custom Search?
- FREE 100 searches/day
- No credit card required
- Needs 2 things: API Key + Search Engine ID

### How to get it:

#### Part A: Get API Key

1. Go to: **https://console.cloud.google.com/**

2. Sign in with Google account

3. **Create a project** (if you don't have one):
   - Click "Select a project" dropdown
   - Click "New Project"
   - Name it "Fact-It" (or anything)
   - Click "Create"

4. **Enable Custom Search API**:
   - Go to: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
   - Click "Enable"

5. **Create API Key**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the key (starts with `AIza...`)

6. Open `.env` file in your project

7. Paste the key:
   ```env
   VITE_GOOGLE_API_KEY=AIzaSy_your_key_here_xxxxxxxxxx
   ```

#### Part B: Get Search Engine ID

1. Go to: **https://programmablesearchengine.google.com/controlpanel/create**

2. Configure search engine:
   - **What to search**: Select "Search the entire web"
   - **Name of search engine**: "Fact-It Search" (or anything)

3. Click **"Create"**

4. You'll see a screen with **"Search engine ID"**

5. Copy the ID (looks like: `a12b34c56d78e90f1...`)

6. Open `.env` file in your project

7. Paste the ID:
   ```env
   VITE_GOOGLE_SEARCH_ENGINE_ID=a12b34c56d78e90f1_your_id_here
   ```

---

## Step 3: Verify Your .env File

Your `.env` file should now look like:

```env
# API Keys for Development
# WARNING: Do not commit this file to version control

# Anthropic (Optional - for premium trial)
VITE_ANTHROPIC_API_KEY=

# Groq (FREE - Get from https://console.groq.com/)
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Custom Search (FREE 100/day - Get from https://developers.google.com/custom-search)
VITE_GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_GOOGLE_SEARCH_ENGINE_ID=a12b34c56d78e90f1xxxxxxxxx
```

---

## Step 4: Rebuild Extension

After adding the API keys:

```bash
cd C:\Users\Erik\Desktop\Fact-it\fact-it
npm run build
```

---

## Step 5: Reload Extension

### In Chrome:
1. Go to `chrome://extensions`
2. Find "Fact-It"
3. Click the **reload icon** (circular arrow)

### In Firefox:
1. Go to `about:debugging#/runtime/this-firefox`
2. Find "Fact-It"
3. Click **"Reload"**

---

## Step 6: Test It!

1. Go to Twitter/X or LinkedIn
2. Find a post with a factual claim
3. Look for the Fact-It badge to appear
4. Click "Check Claim" button
5. Should now show: ✓ True, ✗ False, or ? Unknown (with explanation)

---

## Troubleshooting

### "Error: API key invalid"
- **Groq**: Make sure key starts with `gsk_`
- **Google**: Make sure key starts with `AIza`
- Check for extra spaces or quotes in `.env`

### "Error: Network error"
- Check your internet connection
- Verify API keys are correctly pasted

### "Daily limit reached"
- Google Search: Wait until midnight (100/day limit)
- Groq: Very unlikely (14,400/day limit)

### Still showing "Medium State"
1. Check browser console (F12 → Console tab)
2. Look for error messages
3. Verify `.env` file is in project root
4. Rebuild: `npm run build`
5. Reload extension

---

## API Key Limits (Free Tier)

| Service | Daily Limit | Cost |
|---------|-------------|------|
| Groq AI | 14,400 requests/day | FREE |
| Google Search | 100 searches/day | FREE |

**Extension limit**: 100 fact-checks/day (limited by Google Search)

---

## Security Notes

- ✅ `.env` is in `.gitignore` (won't be committed)
- ✅ Keys are only used in background worker (not exposed to websites)
- ✅ Keys are compiled into extension build (users can't access them)
- ⚠️ Don't share your `.env` file with anyone
- ⚠️ Don't commit `.env` to GitHub

---

## Summary

**Total time**: ~5 minutes
**Total cost**: $0.00 (both APIs are free)
**What you get**: 100 free fact-checks per day

Once you add the API keys and rebuild, the extension will start working immediately!
