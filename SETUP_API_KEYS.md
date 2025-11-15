# 🔑 API Key Setup Guide

## Problem: "No AI providers configured"

This means the extension doesn't have API keys configured. You need to add at least one API key to make fact-checking work.

---

## ✅ Solution: Add FREE Groq API Key

### Step 1: Get FREE Groq API Key (Takes 2 minutes)

1. Go to **https://console.groq.com/keys**
2. Sign up (free, no credit card required)
3. Click **"Create API Key"**
4. Copy the key (starts with `gsk_...`)

### Step 2: Add to .env File

1. Open `.env` file in the project root
2. Find this line:
   ```
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```
3. Replace `your_groq_api_key_here` with your actual key:
   ```
   VITE_GROQ_API_KEY=gsk_YOUR_ACTUAL_KEY_HERE
   ```
4. Save the file

### Step 3: Rebuild Extension

```bash
npm run build
```

### Step 4: Reload Extension in Chrome

1. Go to `chrome://extensions`
2. Click the **reload icon** under Fact-It extension
3. Test on any Twitter/X post

**That's it!** Extension now works with 100% free fact-checking (0 cost, 14,400 checks/day).

---

## 🎯 What You Get with FREE Groq

- ✅ **100% FREE** - No credit card, no trials, truly free
- ✅ **14,400 requests/day** - Enough for 144 users doing 100 checks each
- ✅ **Llama 3.3 70B model** - High-quality AI
- ✅ **Fast responses** - Groq's inference is blazing fast
- ✅ **No expiration** - Free tier doesn't expire
