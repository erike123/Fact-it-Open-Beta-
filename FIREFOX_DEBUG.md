# 🦊 Firefox Debugging Guide

## Step-by-Step Firefox Testing

### Step 1: Load Extension in Firefox

1. Open Firefox
2. Type in address bar: `about:debugging#/runtime/this-firefox`
3. Click **"Load Temporary Add-on..."**
4. Navigate to: `C:\Users\Erik\Desktop\Fact-it\fact-it\dist`
5. Select `manifest.json` file
6. Click "Open"

**Extension should now appear in the list**

---

### Step 2: Check for Load Errors

**Look at the extension entry:**
- ✅ Shows "Fact-It" with icon
- ✅ Shows version number
- ❌ Shows "Manifest errors" → There's a problem

**If you see errors:**
- Click "Manifest errors" to see details
- Copy the error message
- Share it with me

---

### Step 3: Inspect Background Script

1. Find "Fact-It" in the list
2. Click **"Inspect"** button next to the extension
3. **Console tab opens**

**What should you see:**
```
Fact-It: Service worker loaded
Fact-It: Selector storage initialized
```

**If you see errors (red text):**
- Copy the error message
- Share screenshot

---

### Step 4: Test Extension Popup

1. Look for Fact-It icon in Firefox toolbar (top-right)
2. **If icon is missing:**
   - Click puzzle piece icon (Extensions)
   - Pin "Fact-It" to toolbar

3. **Click Fact-It icon**
4. **Popup should open**

**What should you see:**
- Green banner: "100% FREE Forever!"
- Usage: "0/100" or actual number
- Pro upgrade section (purple)
- Status: "Extension is running"

**If popup is blank/white:**
- Right-click in empty popup
- Select "Inspect Element"
- Check Console for errors

---

### Step 5: Test on Twitter/X

1. Go to: https://twitter.com
2. Log in
3. **Open browser console: Press F12**
4. Go to **Console tab**
5. **Look for Fact-It messages:**
   ```
   Fact-It: Twitter content script loaded
   Fact-It: Found X posts on page
   ```

**If you see these messages:**
✅ Content script is working

**If you see nothing:**
❌ Content script not injecting

---

## 🔍 Common Firefox Issues

### Issue 1: "Reading manifest: Error processing content_scripts"

**Cause:** Manifest V3 compatibility issue with Firefox

**Solution:** Check Firefox version
```
about:support
Look for "Version"
Need Firefox 109+ for full Manifest V3 support
```

**If Firefox < 109:**
- Update Firefox
- Or I can create Manifest V2 version for older Firefox

---

### Issue 2: Extension icon grayed out

**Cause:** Extension failed to load

**Solution:**
1. Check `about:debugging` for errors
2. Look at manifest.json errors
3. Share the error message

---

### Issue 3: Popup opens but shows nothing

**Cause:** JavaScript error in popup

**Solution:**
1. Right-click in popup → Inspect Element
2. Console tab shows error
3. Common errors:
   - "Can't find module" → Build issue
   - "Undefined variable" → Code error

---

## 🧪 Manual Tests for Firefox

### Test 1: Background Script Communication

**In background script console** (`about:debugging` → Inspect):

```javascript
// Test if service worker responds
browser.runtime.sendMessage({ type: 'PING' })
  .then(response => console.log('Response:', response))
  .catch(error => console.error('Error:', error));
```

**Expected:**
```
Response: {status: "ok", timestamp: 1234567890}
```

**If error:**
- "Could not establish connection" → Service worker crashed
- "Receiving end does not exist" → Message listener not set up

---

### Test 2: Storage Access

**In background script console:**

```javascript
// Check daily limit storage
browser.storage.local.get('daily_limit')
  .then(result => console.log('Daily limit:', result))
  .catch(error => console.error('Storage error:', error));
```

**Expected:**
```
Daily limit: {
  daily_limit: {
    date: "2025-10-23",
    checksUsed: 0,
    lastResetTime: 1234567890
  }
}
```

**If empty:**
```javascript
// Initialize it manually
browser.storage.local.set({
  daily_limit: {
    date: new Date().toISOString().split('T')[0],
    checksUsed: 0,
    lastResetTime: Date.now()
  }
}).then(() => console.log('Initialized'));
```

---

### Test 3: Content Script Injection

**On Twitter page, open console (F12):**

```javascript
// Check if content script loaded
console.log('Content script test');
```

**Then check if Fact-It is there:**
- Look for Fact-It: prefixed messages
- Should see: "Fact-It: Twitter content script loaded"

**If nothing:**
Content scripts not injecting. Check manifest.json content_scripts section.

---

## 🛠️ Firefox-Specific Fixes

### Fix 1: Use browser.* instead of chrome.*

Firefox prefers `browser.` API. Check if errors mention "chrome is undefined"

**Our code should use:**
```javascript
chrome.runtime.sendMessage() // Works in Firefox via polyfill
browser.runtime.sendMessage() // Firefox native
```

**We're already using chrome.* which Firefox should support**

---

### Fix 2: Check manifest.json for Firefox

**Open:** `dist/manifest.json`

**Should have:**
```json
{
  "manifest_version": 3,
  "browser_specific_settings": {
    "gecko": {
      "id": "fact-it@example.com"
    }
  }
}
```

---

### Fix 3: Permissions

**Check if Firefox is blocking permissions:**

1. Right-click Fact-It icon
2. "Manage Extension"
3. **Permissions tab**
4. Make sure all permissions are allowed:
   - ✅ Access your data for all websites
   - ✅ Access browser tabs
   - ✅ Store data

---

## 🎯 Quick Firefox Test Script

**Run this in background script console:**

```javascript
console.log('=== FIREFOX DIAGNOSTIC ===');

// 1. Test browser API
console.log('1. Browser API:', typeof browser !== 'undefined' ? 'browser.*' : 'chrome.*');

// 2. Test extension manifest
const manifest = browser.runtime.getManifest();
console.log('2. Extension version:', manifest.version);
console.log('3. Manifest version:', manifest.manifest_version);

// 4. Test storage
browser.storage.local.get('daily_limit').then(result => {
  console.log('4. Daily limit data:', result);
});

// 5. Test messaging
browser.runtime.sendMessage({ type: 'PING' })
  .then(response => console.log('5. Ping response:', response))
  .catch(error => console.error('5. Ping error:', error));

// 6. Test Groq API access
  fetch('https://api.groq.com/openai/v1/models', {
  headers: {
    'Authorization': 'Bearer <REDACTED_GROQ_KEY>'
  }
})
  .then(r => r.json())
  .then(data => console.log('6. Groq API accessible:', data.data ? 'YES' : 'NO'))
  .catch(error => console.error('6. Groq API error:', error));

console.log('=== END DIAGNOSTIC ===');
```

**Copy and paste the complete output.**

---

## 📸 What I Need to Help Debug

Please share screenshots or copy/paste of:

1. **Firefox version**
   - `about:support` → Look for Version

2. **Extension load screen**
   - `about:debugging#/runtime/this-firefox`
   - Screenshot showing Fact-It entry

3. **Background script console**
   - `about:debugging` → Inspect button
   - All console output (especially errors in red)

4. **Popup inspection**
   - Right-click in popup → Inspect
   - Console tab errors

5. **Diagnostic output**
   - Results from running the test script above

---

## 🆘 Fastest Path to Fix

**If you can share:**

1. Screenshot of `about:debugging` page showing Fact-It
2. Screenshot of background console (after clicking Inspect)
3. Any red error messages

**I can tell you exactly what's wrong and how to fix it!**

---

## Common Firefox Error Messages & Fixes

### "Content Security Policy: Directive 'script-src' invalid"

**Fix:** CSP issue in manifest. Need to adjust build config.

### "browser is not defined"

**Fix:** Extension trying to use browser.* but loaded as Chrome extension.

### "Extension is not compatible with this version of Firefox"

**Fix:** Need Firefox 109+. Update Firefox or use Manifest V2.

### "Could not load manifest"

**Fix:** manifest.json has syntax error. Need to check build output.

---

## ✅ Expected Working State

**When working, you should see:**

1. **about:debugging page:**
   - ✅ Fact-It listed
   - ✅ Internal UUID shown
   - ✅ Manifest v3
   - ✅ No errors

2. **Background console:**
   - ✅ "Service worker loaded"
   - ✅ "Selector storage initialized"
   - ✅ No red errors

3. **Popup:**
   - ✅ Opens when clicking icon
   - ✅ Shows usage: "0/100"
   - ✅ Shows status: "Extension is running"

4. **Twitter page:**
   - ✅ Console shows: "Twitter content script loaded"
   - ✅ Badges appear on posts (after 5-10 sec)

**If ANY of these fail, there's an issue at that level.**
