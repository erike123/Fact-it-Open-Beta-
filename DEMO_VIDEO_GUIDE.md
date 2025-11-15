# 🎬 COMPLETE DEMO VIDEO GUIDE

**Goal:** Create a 2-3 minute demo video showing Fact-It detecting scams

---

## 📋 **QUICK START (30 Minutes Total)**

### **Step 1: Install Recording Software (5 minutes)**

**Option A: OBS Studio (Recommended - Free)**
1. Download: https://obsproject.com/download
2. Install (click Next → Next → Finish)
3. Open OBS Studio
4. Skip auto-configuration wizard
5. You're ready!

**Option B: Windows Game Bar (Built-in, Easy)**
1. Press `Windows + G` on your keyboard
2. Click "Capture" button
3. That's it!

**Option C: Mac QuickTime (Built-in)**
1. Open QuickTime Player
2. File → New Screen Recording
3. Click record button

---

### **Step 2: Load Extension (2 minutes)**

1. Open Chrome or Firefox
2. Go to: `chrome://extensions` (Chrome) or `about:debugging` (Firefox)
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked" (Chrome) or "Load Temporary Add-on" (Firefox)
5. Select folder: `C:\Fact-it-private-copy\dist`
6. ✅ Extension loaded!

---

### **Step 3: Open Test Posts (1 minute)**

1. Open file in browser: `C:\Fact-it-private-copy\demo-posts.html`
2. Keep this tab open (you'll copy code from here)
3. Open Twitter in another tab: https://twitter.com
4. Log in to your Twitter account (or create fake account for demo)

---

### **Step 4: Record Demo (15 minutes)**

#### **Demo 1: Crypto Scam (5 minutes)**

1. **Start Recording:**
   - OBS Studio: Click "Start Recording"
   - Windows Game Bar: Press `Windows + Alt + R`
   - Mac: Click red record button

2. **Inject Fake Post:**
   - Go to `demo-posts.html` tab
   - Copy the JavaScript code under "Demo 1: Crypto Scam"
   - Switch to Twitter tab
   - Press `F12` or `Ctrl+Shift+J` (opens Console)
   - Paste the code
   - Press `Enter`
   - ✅ Fake scam post appears with RED border

3. **Record Fact-Check:**
   - Scroll to the fake post (red border)
   - Hover over "Fact Check" button (show it clearly)
   - Click "Fact Check"
   - Wait 3-5 seconds
   - ✅ Result appears showing "🚨 SCAM DETECTED"
   - Scroll through the warnings slowly
   - Highlight the Bulgarian text: "НЕ изпращайте криптовалута!"

4. **Narration (record separately or add later):**
   > "Here's a typical crypto scam: Send 1 Bitcoin, get 2 Bitcoin back. Sounds too good to be true? Let's check. In just 3 seconds, Fact-It detected the scam with 95% confidence and warned us in both English AND Bulgarian. You're protected."

#### **Demo 2: Phishing URL (5 minutes)**

1. **Inject Phishing Post:**
   - Copy JavaScript code under "Demo 2: Phishing URL"
   - Paste in Console
   - Press Enter
   - ✅ Phishing post appears with YELLOW/ORANGE border

2. **Record Fact-Check:**
   - Scroll to phishing post
   - Click "Fact Check"
   - Wait for result
   - Show "⚠️ PHISHING DETECTED" warning
   - Point out: "faceb00k.com is NOT facebook.com"
   - Show domain age: "5 days old"

3. **Narration:**
   > "A post with a link to faceb00k.com - looks like Facebook, right? Wrong. Fact-It immediately spots the typosquatting. The domain is only 5 days old. This is a phishing attack trying to steal your password."

#### **Demo 3: Typosquatting (5 minutes)**

1. **Inject Typosquatting Post:**
   - Copy JavaScript code under "Demo 3: Typosquatting"
   - Paste in Console
   - Press Enter
   - ✅ PayPal scam post appears with RED border

2. **Record Fact-Check:**
   - Click "Fact Check"
   - Show result: "paypa1.com" (notice the "1" instead of "l")
   - Display security score

3. **Narration:**
   > "PayPal sent you $500? Click to claim! Not so fast. Fact-It catches the typo: paypa-ONE-dot-com, not paypal.com. This is a phishing site designed to steal your credentials."

4. **Stop Recording:**
   - OBS: Click "Stop Recording"
   - Windows Game Bar: Press `Windows + Alt + R` again
   - Mac: Click stop button

---

### **Step 5: Edit Video (7 minutes)**

**Free Video Editors:**

**Option A: DaVinci Resolve (Professional, Free)**
1. Download: https://www.blackmagicdesign.com/products/davinciresolve
2. Import your recording
3. Add text overlays for emphasis
4. Add background music (royalty-free from YouTube Audio Library)
5. Export as MP4 (1080p, 30fps)

**Option B: Clipchamp (Online, Easy)**
1. Go to: https://clipchamp.com
2. Upload your recording
3. Add text and music
4. Export (free watermark)

**Option C: CapCut (Mobile, Super Easy)**
1. Download app on phone
2. Import video
3. Add text and music
4. Export

**Editing Checklist:**
- [ ] Add intro screen: "Fact-It - Bulgaria's #1 Scam Detector"
- [ ] Add text overlays highlighting key points:
  - "🚨 SCAM DETECTED - 95% Confidence"
  - "Domain Age: 5 days (SUSPICIOUS)"
  - "НЕ изпращайте криптовалута!" (Bulgarian text)
- [ ] Add background music (quiet, non-distracting)
- [ ] Add end screen with download links
- [ ] Add Bulgarian subtitles (optional but recommended)

---

## 🎙️ **NARRATION SCRIPT (Record Audio Separately)**

### **English Narration:**

```
[INTRO - 0:00-0:20]
Every day, thousands of Bulgarians lose money to online scams.
Fake crypto giveaways, phishing websites, and misinformation
spread like wildfire on social media.

Introducing Fact-It - Bulgaria's first AI-powered scam detector.
It works automatically on Twitter, LinkedIn, Facebook, and any
website. 100% FREE.

[DEMO 1 - 0:20-1:00]
Watch this. Here's a typical crypto scam: "Send 1 Bitcoin,
receive 2 Bitcoin back!" Sounds too good to be true? Let's check.

In just 3 seconds, Fact-It detected the scam with 95% confidence.
It warns you in both English AND Bulgarian. You're protected.

[DEMO 2 - 1:00-1:30]
Here's another one. A post with a link to "faceb00k.com" -
looks like Facebook, right? Wrong.

Fact-It immediately spots the typosquatting. The domain is
only 5 days old and has a fake SSL certificate. This is a
phishing attack.

[DEMO 3 - 1:30-2:00]
PayPal sent you $500? Not so fast. Fact-It catches the typo:
paypa-ONE-dot-com, not paypal.com. Classic phishing.

[HOW IT WORKS - 2:00-2:20]
How does it work? Fact-It uses advanced AI to scan every post
for 100+ scam patterns, checks domain age and security, and
cross-references blacklists. All in real-time, all for free.

[CALL TO ACTION - 2:20-2:30]
Protect yourself today. Download Fact-It for FREE from the
Chrome Web Store or Firefox Add-ons. Join thousands of
Bulgarians staying safe online.
```

### **Bulgarian Narration:**

```
[INTRO - 0:00-0:20]
Всеки ден хиляди българи губят пари от онлайн измами.
Фалшиви крипто подаръци, фишинг уебсайтове и дезинформация
се разпространяват като пожар в социалните мрежи.

Представяме Fact-It - първият български AI детектор за измами.
Работи автоматично в Twitter, LinkedIn, Facebook и всеки уебсайт.
100% БЕЗПЛАТНО.

[DEMO 1 - 0:20-1:00]
Вижте това. Ето типична крипто измама: "Изпратете 1 Bitcoin,
получете 2 Bitcoin обратно!" Звучи прекалено добре? Нека проверим.

За само 3 секунди Fact-It откри измамата с 95% увереност.
Предупреждава ви на английски И български. Вие сте защитени.

[DEMO 2 - 1:00-1:30]
Ето още един. Публикация с линк към "faceb00k.com" -
изглежда като Facebook, нали? Грешка.

Fact-It веднага забелязва подмяната. Домейнът е само на 5 дни
и има фалшив SSL сертификат. Това е фишинг атака.

[DEMO 3 - 1:30-2:00]
PayPal ви изпрати $500? Не бързайте. Fact-It забелязва грешката:
paypa-ЕДНО-точка-com, не paypal.com. Класически фишинг.

[HOW IT WORKS - 2:00-2:20]
Как работи? Fact-It използва напреднал AI за сканиране на
всяка публикация за 100+ модели на измами, проверява възрастта
и сигурността на домейна и кръстосано проверява черни списъци.
Всичко в реално време, всичко безплатно.

[CALL TO ACTION - 2:20-2:30]
Защитете се днес. Изтеглете Fact-It БЕЗПЛАТНО от Chrome Web Store
или Firefox Add-ons. Присъединете се към хиляди българи, които
остават в безопасност онлайн.
```

---

## 🎨 **TEXT OVERLAYS TO ADD**

Add these as text on screen at appropriate times:

```
[At 0:05]
🛡️ FACT-IT
Bulgaria's #1 Scam Detector

[At 0:45 - Crypto Scam Result]
🚨 SCAM DETECTED
95% Confidence
Security Score: 5/100

[At 1:15 - Phishing Result]
⚠️ PHISHING DETECTED
Domain Age: 5 days
Typosquatting: faceb00k.com ≠ facebook.com

[At 1:45 - Typosquatting Result]
⚠️ FAKE URL
paypa1.com ← (notice the "1")
NOT paypal.com

[At 2:05 - How It Works]
✓ 100+ Scam Patterns
✓ Domain Age Check
✓ SSL Validation
✓ Blacklist Cross-Reference

[At 2:25 - End Screen]
┌─────────────────────────────────────┐
│         🛡️ FACT-IT                 │
│   Bulgaria's #1 Scam Detector      │
│                                     │
│   ✓ 100% FREE                       │
│   ✓ Works Automatically             │
│   ✓ Protects Against Scams          │
│                                     │
│   Download Now - FREE               │
│   Chrome | Firefox                  │
│   www.fact-it.bg                    │
└─────────────────────────────────────┘
```

---

## 🎵 **BACKGROUND MUSIC (Royalty-Free)**

**Where to Find:**
- YouTube Audio Library: https://studio.youtube.com → Audio Library
- Epidemic Sound: https://www.epidemicsound.com/ (30-day free trial)
- Free Music Archive: https://freemusicarchive.org/

**Recommended Tracks:**
- Search for: "tech", "corporate", "upbeat", "security"
- Volume: 20-30% (don't overpower narration)
- Style: Modern, professional, not too fast

**Good Options:**
- "Inspiring Technology" (YouTube Audio Library)
- "Corporate Success" (YouTube Audio Library)
- "Digital Future" (Epidemic Sound)

---

## 📤 **UPLOAD & SHARE**

### **YouTube:**

**Title:**
```
🛡️ Fact-It: Bulgaria's #1 Free Scam Detector | Stop Crypto Scams & Phishing
```

**Description:**
```
Защитете се от онлайн измами с Fact-It - първият български AI детектор за измами!

✓ 100% БЕЗПЛАТНО
✓ Работи автоматично в Twitter, Facebook, LinkedIn
✓ Открива крипто измами
✓ Засича фишинг атаки
✓ Проверява сигурността на уебсайтове
✓ Предупреждава на български език

Свалете сега:
Chrome: [Your Chrome Store Link]
Firefox: [Your Firefox Link]
Website: www.fact-it.bg

Timestamps:
0:00 - The Problem
0:20 - The Solution
0:40 - Demo: Crypto Scam Detection
1:00 - Demo: Phishing Detection
1:30 - Demo: Typosquatting
2:00 - How It Works
2:20 - Download Now

#FactIt #Bulgaria #CyberSecurity #ScamDetection #Phishing #CryptoScam
```

**Tags:**
```
Fact-It, Bulgaria, cybersecurity, scam detection, phishing, crypto scam, AI protection, онлайн сигурност, измами, фишинг, България, browser extension, Chrome extension, Firefox addon
```

**Thumbnail:**
Create a thumbnail with:
- Fact-It logo
- Text: "🛡️ STOP SCAMS"
- Red warning symbols
- "БЕЗПЛАТНО" badge

---

### **Social Media Posts:**

**Twitter/X:**
```
🛡️ Нов инструмент за българите!

Fact-It ви защитава от:
✓ Крипто измами
✓ Фишинг атаки
✓ Фалшиви уебсайтове

100% БЕЗПЛАТНО 🆓

Свалете сега: [Link]

#CyberSecurity #България
```

**LinkedIn:**
```
Представяме Fact-It - първият български AI детектор за измами 🛡️

Всеки ден хиляди българи губят пари от онлайн измами. Fact-It работи автоматично в Twitter, Facebook, LinkedIn и всеки уебсайт, за да ви защити от:

• Криптовалутни измами
• Фишинг атаки
• Typosquatting (фалшиви URL адреси)
• Измамни уебсайтове

Напълно безплатно. Без регистрация. Работи веднага след инсталация.

Вижте демо видео: [YouTube Link]
Свалете: [Chrome/Firefox Links]

#CyberSecurity #Bulgaria #Tech #Innovation
```

**Facebook:**
```
🚨 ВНИМАНИЕ: Онлайн измамите се увеличават!

Но вече имаме решение 🛡️

Fact-It е първият български AI детектор за измами. Работи автоматично и ви предупреждава на български език когато срещнете:

✓ Крипто измами ("Изпрати 1 BTC, получи 2 BTC")
✓ Фишинг уебсайтове (faceb00k.com вместо facebook.com)
✓ Фалшиви подаръци
✓ Измамни линкове

100% БЕЗПЛАТНО. Без регистрация. Без кредитна карта.

Гледайте видео как работи: [YouTube Link]
Свалете сега: [Link]

Споделете с приятели и семейство да се защитят! 💪

#ФактИт #България #КиберСигурност #Измами
```

**Instagram/TikTok (Short Version):**
```
🛡️ СПРИ ИЗМАМИТЕ

Fact-It = Твоят AI детектор за измами

✓ Открива crypto измами
✓ Засича phishing
✓ Проверява уебсайтове
✓ 100% БЕЗПЛАТНО

Свали сега 👉 Link in bio

#FactIt #България #CyberSecurity #Scam #Phishing
```

---

## ✅ **FINAL CHECKLIST**

Before publishing:

- [ ] Video is 2-3 minutes long
- [ ] Shows all 3 demos (crypto, phishing, typosquatting)
- [ ] Audio is clear (no background noise)
- [ ] Text overlays are readable
- [ ] Bulgarian text is prominent
- [ ] End screen with download links
- [ ] Background music at appropriate volume
- [ ] Exported as 1080p MP4
- [ ] Uploaded to YouTube
- [ ] Added to Chrome/Firefox store listings
- [ ] Shared on social media
- [ ] Posted in Bulgarian Facebook groups
- [ ] Sent to Bulgarian tech journalists

---

## 🎁 **BONUS: Create GIFs for Social Media**

**Short 5-10 second clips showing:**

1. **GIF 1: Scam Detection**
   - Shows crypto scam post
   - Click "Fact Check"
   - "🚨 SCAM DETECTED" appears
   - Caption: "Fact-It saved you from a $500 loss"

2. **GIF 2: Phishing Detection**
   - Shows fake URL
   - Extension highlights typo
   - Caption: "Can you spot the fake? Fact-It can."

3. **GIF 3: Bulgarian Warning**
   - Shows warning in Bulgarian
   - Caption: "Защита на български език 🇧🇬"

**Tool to create GIFs:**
- ScreenToGif (Windows): https://www.screentogif.com/
- GIPHY Capture (Mac): https://giphy.com/apps/giphycapture
- ezgif.com (Online): https://ezgif.com/video-to-gif

---

## 📊 **SUCCESS METRICS**

Track these after publishing:

- Views on YouTube
- Clicks on download links
- Chrome/Firefox extension installs
- Shares on social media
- Comments/feedback
- Conversion rate (views → installs)

**Goal for Month 1:**
- 1,000 video views
- 100 extension installs
- 10 positive reviews

---

**YOU'RE READY TO RECORD! 🎬**

Start with the `demo-posts.html` file I just created. Good luck! 🚀
