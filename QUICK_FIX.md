# 🚨 QUICK FIX: Extension Not Working

## Problem: Popup shows "medium state" / nothing loads

---

## ⚡ 3-Minute Fix

### Step 1: Reload Extension (30 seconds)

**Chrome:**
1. Type in address bar: `chrome://extensions`
2. Find "Fact-It"
3. Click the **🔄 Reload button**

**Firefox:**
1. Type in address bar: `about:debugging#/runtime/this-firefox`
2. Find "Fact-It"
3. Click **Reload**

---

### Step 2: Open Extension Popup (10 seconds)

1. Click the Fact-It icon in your browser toolbar
2. **What do you see?**

**If you see:**
```
✅ "100% FREE Forever!"
✅ "Daily Usage: 0/100"
✅ "Extension is running"
```
→ **Extension is working!** Go to Step 3 to test fact-checking.

**If you see:**
```
❌ Blank/white popup
❌ "-/100" instead of "0/100"
❌ "Service worker not responding"
```
→ **Problem with service worker.** Continue to Step 2B.

---

### Step 2B: Check Service Worker (1 minute)

**Chrome:**
1. Go to: `chrome://extensions`
2. Find "Fact-It"
3. Click **"service worker"** (blue link)
4. **New window opens** with console

**Look for errors (red text):**
- ❌ "Failed to load..." → Build issue
- ❌ "Uncaught Error..." → JavaScript error
- ✅ "Fact-It: Service worker loaded" → Working!

**Test connection:**
Type this in the console:
```javascript
chrome.runtime.sendMessage({ type: 'PING' }, console.log)
```

**Expected result:**
```
{status: "ok", timestamp: 1234567890}
```

**If you get an error or nothing:**
→ Service worker is broken. Go to Step 4 (Rebuild).

---

### Step 3: Test Fact-Checking (1 minute)

1. **Go to:** https://twitter.com (or x.com)
2. **Log in** if needed
3. **Scroll through timeline**
4. **Look for Fact-It badges** on tweets (small overlay)
5. **If you see badges:**
   - Hover over badge
   - Click "Check Claim"
   - Wait 5 seconds
   - Badge updates with verdict

**If NO badges appear:**
- Refresh page (Ctrl+R)
- Wait 10 seconds
- Still no badges? → Go to Step 5 (Debug Content Script)

**If badge shows "?" (medium/unknown state):**
- This is NORMAL for Groq-only mode with current events
- Try a well-known fact:
  - Find tweet saying "Earth is round" or similar
  - Click "Check Claim"
  - Should show ✅ TRUE

**If still shows ? on everything:**
→ Groq API issue. Go to Step 6 (Test Groq API).

---

### Step 4: Rebuild Extension (30 seconds)

If service worker isn't loading:

```bash
# In terminal
cd C:\Users\Erik\Desktop\Fact-it\fact-it
npm run build
```

**Expected output:**
```
✓ 167 modules transformed.
✓ built in 2.19s
```

**Then:**
1. Go back to `chrome://extensions`
2. Click 🔄 Reload on Fact-It extension
3. Reopen popup
4. Try again

---

### Step 5: Debug Content Script (1 minute)

If badges don't appear on Twitter:

1. **Go to Twitter:** https://twitter.com
2. **Press F12** (open DevTools)
3. **Go to Console tab**
4. **Look for messages:**
   - ✅ "Fact-It: Twitter content script loaded" → Working
   - ✅ "Fact-It: Found X posts" → Working
   - ❌ Nothing → Content script not injected

**If content script not loaded:**
- Hard refresh: Ctrl+Shift+R
- Still nothing? → Check manifest.json has Twitter in content_scripts

---

### Step 6: Test Groq API (1 minute)

If fact-checks return "unknown" for everything:

**In service worker console** (`chrome://extensions` → service worker):

```javascript
// Test Groq API directly
fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <REDACTED_GROQ_KEY>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.1-70b-versatile',
    messages: [{ role: 'user', content: 'Say hello' }],
    max_tokens: 10
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Expected result:**
```javascript
{
  choices: [{
    message: { content: "Hello!" }
  }]
}
```

**If you get error:**
- `401 Unauthorized` → API key invalid
- `429 Rate Limit` → Too many requests (unlikely)
- `Network error` → Internet connection issue

---

## 🎯 Quick Diagnostic

**Run this in service worker console:**

```javascript
// Complete diagnostic
console.log('=== FACT-IT DIAGNOSTIC ===');
console.log('1. Groq key exists:', !!import.meta.env.VITE_GROQ_API_KEY);
console.log('2. Extension version:', chrome.runtime.getManifest().version);

// Test daily limit
chrome.runtime.sendMessage({ type: 'GET_DAILY_LIMIT' }, (response) => {
  console.log('3. Daily limit response:', response);
});

// Test ping
chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
  console.log('4. Ping response:', response);
});

console.log('=== END DIAGNOSTIC ===');
```

**Copy and paste the output here if you need help debugging.**

---

## 🔧 Common Fixes

### Fix 1: Popup shows "-/100"

**Problem:** Service worker not responding

**Solution:**
```javascript
// In service worker console
chrome.storage.local.set({
  daily_limit: {
    date: new Date().toISOString().split('T')[0],
    checksUsed: 0,
    lastResetTime: Date.now()
  }
}, () => {
  console.log('Daily limit initialized');
  // Reload popup
});
```

### Fix 2: All claims show "unknown"

**Problem:** Groq-only mode limitation

**Solution:** This is NORMAL for:
- Current events (stock prices, today's weather)
- Recent news (happened this week)
- Time-sensitive info

**Try well-known facts:**
- "The Earth orbits the Sun" → Should show TRUE
- "Water boils at 100°C" → Should show TRUE
- "Humans can fly without help" → Should show FALSE

### Fix 3: No badges on Twitter

**Problem:** Content script not injecting

**Solutions:**
1. Hard refresh Twitter: Ctrl+Shift+R
2. Check if logged in (extension only works on timeline)
3. Try different page: Home, Profile, Search results
4. Reload extension and refresh Twitter

### Fix 4: Groq API errors

**Problem:** API key invalid or rate limited

**Solutions:**
1. Verify key in `.env` file is correct
2. Check no extra spaces or quotes
3. Rebuild: `npm run build`
4. Reload extension

---

## ✅ Success Checklist

Extension is working when:

- [x] Popup shows "0/100" usage
- [x] Service worker console shows "Service worker loaded"
- [x] Badges appear on Twitter posts
- [x] Clicking "Check Claim" shows loading
- [x] Verdict appears after 3-5 seconds
- [x] Usage increments in popup

**If all checked: IT WORKS!** 🎉

---

## 🆘 Still Not Working?

**Share this info:**

1. **Browser:** Chrome/Firefox + version
2. **Service worker console output** (copy/paste)
3. **Popup console errors** (Right-click icon → Inspect popup)
4. **Diagnostic output** (from above script)

**Most common issue:** Service worker not loading = Need to rebuild extension

**Quick fix 99% of time:**
```bash
npm run build
# Then reload extension in browser
```
