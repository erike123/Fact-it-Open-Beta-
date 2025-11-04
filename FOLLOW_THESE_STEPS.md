# 🦊 FOLLOW THESE EXACT STEPS (Firefox)

## Do these steps IN ORDER and tell me what happens at each step

---

## Step 1: Check Firefox Version

1. Open Firefox
2. In address bar, type: `about:support`
3. Press Enter
4. Look for **"Version"** near the top
5. **What version do you see?** (Example: Firefox 132.0)

**REQUIRED:** Firefox 121+ (preferably 130+)

**If your version is below 121:**
- You need to update Firefox first
- Help → About Firefox → Update

---

## Step 2: Load Extension

1. In Firefox address bar, type: `about:debugging#/runtime/this-firefox`
2. Press Enter
3. Click the blue button: **"Load Temporary Add-on..."**
4. Navigate to: `C:\Users\Erik\Desktop\Fact-it\fact-it\dist`
5. Click on file: `manifest.json`
6. Click **"Open"**

**What should happen:**
- Fact-It appears in the list of extensions
- Shows version "0.1.0"
- Shows internal UUID
- Shows "Inspect" button

**STOP HERE and tell me:**
- ✅ Did Fact-It appear in the list?
- ❌ Did you see any error messages?
- 📸 Screenshot of the page would help!

---

## Step 3: Check for Errors

**Look at the Fact-It extension entry in the list.**

**Do you see any of these?**
- ❌ Yellow/red warning icon
- ❌ "Manifest errors" link
- ❌ "Warnings" text

**If YES - Click on the error/warning and copy the message here.**

**If NO - Continue to Step 4.**

---

## Step 4: Inspect Background Console

1. Find "Fact-It" in the extensions list
2. Click the **"Inspect"** button (on the right side)
3. A new window/tab opens with Developer Tools

**What should you see in the Console tab:**
```
Fact-It: Service worker loaded
Fact-It: Selector storage initialized
```

**STOP HERE and tell me:**
- ✅ Do you see these messages?
- ❌ Do you see RED error messages?
- 📸 Screenshot of console would be perfect!

**If you see RED errors, copy them exactly.**

---

## Step 5: Test Message Passing

**In the background console** (the one that just opened):

**Type or paste this:**
```javascript
browser.runtime.sendMessage({ type: 'PING' }).then(console.log).catch(console.error);
```

**Press Enter**

**What should happen:**
```
{status: "ok", timestamp: 1234567890}
```

**STOP HERE and tell me:**
- ✅ Did you get the "ok" response?
- ❌ Did you get an error?
- 📋 Copy/paste what you saw

---

## Step 6: Check Popup

1. Look for Fact-It icon in Firefox toolbar (top-right corner)
2. **If you don't see it:**
   - Click the puzzle piece icon (Extensions menu)
   - Look for "Fact-It"
   - If there, click "Pin to Toolbar"

3. **Click the Fact-It icon**

**What should happen:**
- Popup window opens
- Shows green "100% FREE Forever!" banner
- Shows "Daily Usage: 0/100"
- Shows purple "Upgrade to Pro" section

**STOP HERE and tell me:**
- ✅ Did popup open?
- ✅ What does it show?
- ❌ Is it blank/white?
- ❌ Any errors?
- 📸 Screenshot would be great!

---

## Step 7: Inspect Popup (If It's Blank)

**If popup opened but is blank/white:**

1. **Keep popup open**
2. **Right-click INSIDE the blank popup**
3. Select **"Inspect Element"** or **"Inspect"**
4. Developer tools open
5. Go to **"Console" tab**

**Look for RED error messages**

**STOP HERE and tell me:**
- 📋 Copy/paste any error messages
- 📸 Screenshot of console

---

## Step 8: Check Storage

**In background console** (about:debugging → Inspect):

**Type or paste this:**
```javascript
browser.storage.local.get('daily_limit').then(console.log).catch(console.error);
```

**Press Enter**

**What should happen:**
```
{
  daily_limit: {
    date: "2025-10-23",
    checksUsed: 0,
    lastResetTime: 1234567890
  }
}
```

**STOP HERE and tell me:**
- 📋 What did you see?
- ❌ Was it empty `{}`?

---

## Step 9: Test on Twitter

1. Open new tab
2. Go to: https://twitter.com (or https://x.com)
3. Log in if needed
4. **Press F12** to open Developer Tools
5. Go to **"Console" tab**
6. Scroll through your Twitter timeline

**What should you see in Console:**
```
Fact-It: Twitter content script loaded
Fact-It: Universal content script loaded
Fact-It: Found 10 posts on page
```

**STOP HERE and tell me:**
- ✅ Do you see "Fact-It:" messages?
- ❌ Do you see nothing?
- ✅ Do badges appear on tweets? (small overlay)

---

## 🆘 Most Likely Issues

Based on "not working" + "medium state":

### Issue A: Service Worker Not Loading
**Symptoms:** Background console shows errors
**Fix:** Need to see the error message

### Issue B: Popup Not Initializing
**Symptoms:** Popup blank or shows "-/100"
**Fix:** JavaScript error in popup - need console output

### Issue C: Content Script Not Injecting
**Symptoms:** No "Fact-It:" messages on Twitter console
**Fix:** Permissions or manifest issue

### Issue D: API Key Not Embedded
**Symptoms:** All checks return "unknown"
**Fix:** Environment variable not compiled in

---

## 📸 What I Need From You

Please go through Steps 1-9 and tell me:

1. **Firefox version:** (from Step 1)
2. **Extension loaded?** Yes/No (Step 2)
3. **Any errors in extension list?** (Step 3)
4. **Background console output:** Copy/paste or screenshot (Step 4)
5. **PING test result:** Copy/paste (Step 5)
6. **Popup appearance:** Screenshot or description (Step 6)
7. **Popup console errors:** If blank (Step 7)
8. **Storage check result:** Copy/paste (Step 8)
9. **Twitter console output:** Copy/paste (Step 9)

**With this info, I can tell you EXACTLY what's wrong!**

---

## ⚡ Quick Emergency Fix

**If you want to try this first:**

### Fix 1: Reinitialize Storage

**In background console:**
```javascript
browser.storage.local.set({
  daily_limit: {
    date: new Date().toISOString().split('T')[0],
    checksUsed: 0,
    lastResetTime: Date.now()
  }
}).then(() => {
  console.log('Storage initialized');
  // Now reload popup
});
```

### Fix 2: Force Reload Extension

1. Go to: `about:debugging#/runtime/this-firefox`
2. Click "Remove" on Fact-It
3. Click "Load Temporary Add-on" again
4. Select `manifest.json` from `dist` folder
5. Try popup again

---

## 🎯 Expected Final State

**When working properly:**

1. Extension loads with no errors
2. Background console shows "Service worker loaded"
3. Popup opens and shows "0/100"
4. Twitter console shows "Fact-It: Twitter content script loaded"
5. Badges appear on tweets after 5-10 seconds
6. Clicking "Check Claim" returns verdict (even if "unknown")

**We need to find which step is failing for you!**

---

**Please go through the steps and share your results!** 🙏
