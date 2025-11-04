# 🧪 Testing Guide - How to Test Your Extension

## 🚨 Problem: Extension Shows "Medium State" / Popup Not Loading

This guide will help you test the extension step-by-step and fix any issues.

---

## ✅ Step 1: Reload Extension in Browser

### Chrome:
1. Open: `chrome://extensions`
2. Find "Fact-It"
3. Click the **🔄 Reload** button (circular arrow icon)
4. Check for any errors in the "Errors" section

### Firefox:
1. Open: `about:debugging#/runtime/this-firefox`
2. Find "Fact-It"
3. Click **"Reload"**
4. Check for errors in the console

---

## ✅ Step 2: Test Extension Popup

1. **Click the extension icon** in your browser toolbar
2. **Popup should show:**
   - "100% FREE Forever!" banner
   - Daily usage: "0/100"
   - Pro upgrade section (Coming Soon)
   - Extension status: "Extension is running"

### If Popup Shows Errors:

**Check browser console (F12):**
1. Right-click extension icon → "Inspect popup"
2. Look for red errors in Console tab
3. Common errors:
   - "Failed to load daily limit" → Service worker issue
   - "TypeError: Cannot read..." → JavaScript error

---

## ✅ Step 3: Test Background Service Worker

### Chrome:
1. Go to: `chrome://extensions`
2. Find "Fact-It"
3. Click **"service worker"** link
4. **Console should show:**
   ```
   Fact-It: Service worker loaded
   Fact-It: Selector storage initialized
   ```

5. **Test ping command:**
   - In console, type:
   ```javascript
   chrome.runtime.sendMessage({ type: 'PING' }, console.log)
   ```
   - Should return: `{status: 'ok', timestamp: 1234567890}`

### Firefox:
1. Go to: `about:debugging#/runtime/this-firefox`
2. Find "Fact-It"
3. Click **"Inspect"**
4. Check console for errors

---

## ✅ Step 4: Test on Twitter/X

1. **Go to:** https://twitter.com or https://x.com
2. **Login** to your account
3. **Scroll through timeline**
4. **Look for Fact-It badges** on posts:
   - Should appear as small badge overlay on each tweet
   - May take 2-5 seconds to appear

### If No Badges Appear:

**Check page console (F12):**
1. Press F12 on Twitter page
2. Go to Console tab
3. Look for messages starting with "Fact-It:"
4. Common issues:
   - "Content script not loaded" → Extension not injected
   - "Selector not found" → Twitter changed their HTML

---

## ✅ Step 5: Test Fact-Checking

1. **Find a post with a factual claim** (e.g., "The Earth is round")
2. **Hover over the Fact-It badge**
3. **Click "Check Claim" button**
4. **Wait 3-5 seconds**
5. **Badge should update** to show verdict:
   - ✅ Green = TRUE
   - ❌ Red = FALSE
   - ❓ Yellow = UNKNOWN

### Expected Behavior with Groq-Only Mode:

**For well-known facts:**
- Claim: "The Earth orbits the Sun"
- Result: ✅ TRUE (80% confidence)
- Explanation: "This is well-established..."

**For current events:**
- Claim: "Stock price today is $250"
- Result: ❓ UNKNOWN (40% confidence)
- Explanation: "Requires real-time web search..."

### If Shows "Medium State" (Yellow ?):

This means the fact-check is returning "unknown" verdict. Check:

1. **Open extension popup**
2. **Check daily limit:** Should show "0/100" or "X/100"
3. **Check service worker console** (chrome://extensions → service worker)
4. **Look for errors:**
   ```
   Groq API error: 401 Unauthorized → Invalid API key
   Groq API error: 429 Rate limit → Too many requests
   Network error → Internet connection issue
   ```

---

## ✅ Step 6: Debug Service Worker

### Chrome Service Worker Console:

1. Go to: `chrome://extensions`
2. Find "Fact-It"
3. Click **"service worker"** link
4. **Test Groq connection:**

```javascript
// Test if Groq API key is loaded
console.log('Groq key exists:', !!import.meta.env.VITE_GROQ_API_KEY);

// Manual test of Groq API
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

**Expected result:** Should show response from Groq
**If error:** API key issue or network problem

---

## ✅ Step 7: Check Network Activity

### When clicking "Check Claim":

1. Open Network tab (F12 → Network)
2. Click "Check Claim" on a post
3. **Should see requests to:**
   - `api.groq.com` (2 requests: detect + verify)
   - Status: 200 OK

### If you see:

**Status 401 Unauthorized:**
- Groq API key is invalid
- Solution: Verify key is correct in `.env`

**Status 429 Too Many Requests:**
- Hit Groq rate limit (unlikely - 14,400/day)
- Solution: Wait 1 minute and try again

**Status 500 Server Error:**
- Groq service issue
- Solution: Try again in a few minutes

**No requests at all:**
- Content script not sending messages
- Service worker not receiving messages
- Check console for errors

---

## ✅ Step 8: Test Daily Limit System

1. **Open extension popup**
2. **Check usage:** Should show "0/100" initially
3. **Perform 1 fact-check** on Twitter
4. **Reopen popup**
5. **Usage should update:** "1/100"
6. **Progress bar should move:** ~1% filled

### Test Limit Reached (Optional):

**Manually set limit to test:**

In service worker console:
```javascript
// Set usage to 100 (limit reached)
chrome.storage.local.set({
  daily_limit: {
    date: new Date().toISOString().split('T')[0],
    checksUsed: 100,
    lastResetTime: Date.now()
  }
}, () => console.log('Limit set to 100'));

// Reload extension popup to see limit reached state
```

**Expected:** Popup shows "100/100", "Limit reached!", Pro upgrade prompt

---

## 🐛 Common Issues & Solutions

### Issue 1: Popup Blank/White Screen

**Symptoms:** Extension icon shows, but popup is empty

**Solutions:**
1. Check for JavaScript errors (Right-click icon → Inspect popup)
2. Rebuild extension: `npm run build`
3. Reload extension in browser
4. Clear browser cache: Ctrl+Shift+Delete

### Issue 2: "Medium State" on All Claims

**Symptoms:** All fact-checks return yellow ? (unknown)

**Causes:**
1. Groq API key not loaded
2. Network error
3. Groq-only mode showing "unknown" for current events

**Solutions:**
1. Check `.env` file has Groq key
2. Rebuild: `npm run build`
3. Test Groq connection (Step 6)
4. Try a well-known fact (e.g., "Earth is round")

### Issue 3: No Badges on Twitter

**Symptoms:** No Fact-It badges appear on tweets

**Solutions:**
1. Hard refresh page: Ctrl+Shift+R
2. Check content script loaded (F12 → Console → Look for "Fact-It:")
3. Twitter may have changed HTML structure
4. Try different Twitter page (Home, Profile, Search)

### Issue 4: "Extension is not running"

**Symptoms:** Popup shows red status "Service worker not responding"

**Solutions:**
1. Go to `chrome://extensions`
2. Find "Fact-It"
3. Check for errors
4. Click "Reload"
5. Reopen popup

### Issue 5: Daily Limit Shows "-/100"

**Symptoms:** Usage shows dashes instead of numbers

**Solutions:**
1. Service worker not responding
2. Check service worker console for errors
3. Manually test daily limit message:
   ```javascript
   chrome.runtime.sendMessage(
     { type: 'GET_DAILY_LIMIT' },
     console.log
   );
   ```

---

## 🎯 Quick Diagnosis Checklist

Run through this checklist:

- [ ] Extension built with `npm run build`
- [ ] Extension reloaded in browser (🔄 button)
- [ ] Service worker shows "loaded" in console
- [ ] Popup opens without errors
- [ ] Daily limit shows "0/100" or actual number
- [ ] Service worker responds to PING message
- [ ] Content script loads on Twitter (check console)
- [ ] Badges appear on tweets (may take 5 seconds)
- [ ] Clicking "Check Claim" sends Groq API request
- [ ] Result appears (even if "unknown")

**If all checked:** Extension is working! ✅

**If any fail:** See solutions above for that specific issue.

---

## 🔬 Advanced Debugging

### Enable Verbose Logging:

**In service-worker.ts, temporarily add:**
```typescript
// At the top of handleCheckClaim function
console.log('=== CHECK CLAIM DEBUG ===');
console.log('Text:', text);
console.log('Groq key exists:', !!groqKey);
console.log('Calling Groq API...');
```

**Rebuild and check service worker console for detailed logs.**

### Test Individual Components:

**1. Test Groq directly:**
```javascript
// In service worker console
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
  'Authorization': 'Bearer <REDACTED_GROQ_KEY>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.1-70b-versatile',
    messages: [{ role: 'user', content: 'Test' }],
    max_tokens: 10
  })
});
const data = await response.json();
console.log(data);
```

**2. Test daily limit storage:**
```javascript
// Check current limit
chrome.storage.local.get('daily_limit', console.log);

// Reset limit to 0
chrome.storage.local.set({
  daily_limit: {
    date: new Date().toISOString().split('T')[0],
    checksUsed: 0,
    lastResetTime: Date.now()
  }
}, () => console.log('Limit reset'));
```

**3. Test message passing:**
```javascript
// From page console (F12 on Twitter)
chrome.runtime.sendMessage(
  {
    type: 'CHECK_CLAIM',
    payload: {
      text: 'The Earth is round',
      elementId: 'test-123',
      platform: 'twitter'
    }
  },
  (response) => {
    console.log('Response:', response);
  }
);
```

---

## 📝 What to Share If Still Broken

If the extension still doesn't work after all these steps, share:

1. **Browser & version:** (e.g., Chrome 120.0.6099.109)
2. **Service worker console logs:** (screenshot or copy/paste)
3. **Popup console errors:** (Right-click icon → Inspect → Console)
4. **Network tab:** (Any failed requests?)
5. **Daily limit response:**
   ```javascript
   chrome.runtime.sendMessage({ type: 'GET_DAILY_LIMIT' }, console.log);
   ```

---

## ✅ Success Indicators

**You'll know it's working when:**

1. ✅ Popup shows "0/100" (not "-/100")
2. ✅ Service worker console shows "Service worker loaded"
3. ✅ Twitter page shows Fact-It badges on posts
4. ✅ Clicking "Check Claim" shows loading spinner
5. ✅ After 3-5 seconds, badge updates with verdict
6. ✅ Popup usage increments: "1/100", "2/100", etc.

**First successful fact-check = Extension is working!** 🎉
