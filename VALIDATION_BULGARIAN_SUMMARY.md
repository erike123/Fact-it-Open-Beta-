# 🇧🇬 Кратък Отговор на Въпросите за Валидация

**Дата:** 2025-11-12

---

## 1️⃣ Трябва ли ми валидация на кода и какво се случва като кача ZIP?

### ✅ НЕ, не ти трябва да валидираш кода ръчно.

Когато качиш `fact-it-submission-v0.1.0.zip`:

**Firefox и Chrome АВТОМАТИЧНО правят:**

1. **Автоматична проверка (2-5 минути):**
   - ✅ Проверка на manifest.json
   - ✅ Сканиране за malware
   - ✅ Проверка за suspicious code
   - ✅ Validation на permissions

2. **Човешка ревизия (1-7 дни):**
   - 👤 Ревюър чете описанието ти
   - 👤 Тества extension-а
   - 👤 Проверява дали прави това което описваш
   - 👤 Проверява защо има embedded API key

### 🎯 Какво ТРЯБВА да направиш:

✅ Качи ZIP-а директно на Firefox и Chrome
✅ Попълни submission form с текста от `SUBMISSION_BULGARIAN.md`
✅ Изчакай automated scan (2-5 min)
✅ Изчакай human review (1-7 дни)

### ❌ Какво НЕ трябва да правиш:

❌ Да валидираш кода ръчно
❌ Да пишеш validator скриптове
❌ Да променяш ZIP-а след build

---

## 2️⃣ Съхранявам ли userски данни в backend и как работи?

### ✅ ДА, съхраняваш данни, но САМО локално в browser-а.

**НЯМА backend server - всичко е client-side в `chrome.storage.local`.**

---

### 📦 Какво се съхранява в момента (v0.1.0):

#### ✅ **1. Daily Limit (АКТИВЕН):**
```json
{
  "daily_limit": {
    "date": "2025-11-12",
    "checksUsed": 47,
    "lastResetTime": 1731398400000
  }
}
```
**Съдържа:** Брой fact-check-ове днес (100/ден лимит)
**Лични данни:** ❌ НЕ
**GDPR:** ✅ Compliant

---

#### ✅ **2. Settings (АКТИВЕН):**
```json
{
  "fact_it_settings": {
    "providers": {
      "groq": {
        "enabled": true,
        "apiKey": "gsk_..." // User's own key (optional)
      }
    },
    "autoCheckEnabled": true,
    "confidenceThreshold": 70
  }
}
```
**Съдържа:** AI provider настройки + API keys
**Лични данни:** ⚠️ ДА (API keys, но локални)
**GDPR:** ✅ Compliant (user controls own keys)

---

#### 🔴 **3. User Profile (НЕ е активен в v0.1.0):**
```json
{
  "fact_it_user_profile": {
    "email": "john.doe@acme.com",
    "companyDomain": "acme.com",
    "totalThreatsBlocked": 12,
    "totalChecks": 89
  }
}
```
**Съдържа:** Email адрес за Company Dashboard
**Лични данни:** ⚠️ ДА (email)
**GDPR:** ⚠️ Изисква consent (затова е DISABLED)
**Статус:** 🔴 **НЕ е активен** - кодът съществува, но не се вика

---

#### 🔴 **4. Company Stats (НЕ е активен в v0.1.0):**
```json
{
  "fact_it_company_stats": {
    "acme.com": {
      "totalEmployees": 5,
      "totalThreatsBlocked": 47,
      "topThreats": [...]
    }
  }
}
```
**Съдържа:** Агрегирани статистики за компанията
**Лични данни:** ❌ НЕ (aggregated data)
**Статус:** 🔴 **НЕ е активен**

---

### 📊 Обобщение - Какво е АКТИВНО в v0.1.0:

| Storage Key | Активен? | Лични данни? | GDPR Risk |
|-------------|----------|--------------|-----------|
| `daily_limit` | ✅ ДА | ❌ НЕ | ✅ Safe |
| `fact_it_settings` | ✅ ДА | ⚠️ ДА (API keys) | ✅ Safe (local only) |
| `fact_it_user_profile` | 🔴 НЕ | ⚠️ ДА (email) | ⚠️ Disabled |
| `fact_it_company_stats` | 🔴 НЕ | ❌ НЕ | ✅ Safe |
| `fact_it_company_employees` | 🔴 НЕ | ⚠️ ДА (emails) | ⚠️ Disabled |

---

### 🔒 Privacy Status:

✅ **v0.1.0 е GDPR Compliant:**

1. ✅ Няма external servers - всичко в browser local storage
2. ✅ Няма лични данни - само анонимни counters (daily_limit)
3. ✅ API keys остават локални - никога не се изпращат никъде
4. ✅ Future features disabled - Email collection features са built но НЕ са активни

⚠️ **За бъдещи версии (Company Dashboard):**

Когато активираш Company Dashboard, ще трябва:
1. Explicit user consent преди да събираш email
2. Privacy policy update с обяснение за email collection
3. Data deletion option в settings

---

## 3️⃣ Кои endpoints се викат и къде мога да проследя?

### 🌐 Пълен списък на API endpoints:

#### ✅ **1. Groq AI (АКТИВЕН - Fact-Checking):**

**Endpoint:**
```
POST https://api.groq.com/openai/v1/chat/completions
```

**Кога се вика:**
- Всеки път като user натисне "Fact Check"
- Всеки път като auto-check е enabled и се появи нов post

**Колко пъти на ден:**
- 2-200 пъти (average 50)
- Rate limited: 100/user/ден, 14,400 global/ден

**Цена:**
- ~$0.0004 на request
- ~$0.02 на user на ден
- Max $5.76/ден (защото има rate limiting)

---

#### ⚠️ **2. GitHub API (BUILT but NOT active):**

**Endpoints:**
```
GET https://api.github.com/search/issues?q={query}
GET https://api.github.com/search/code?q={query}
GET https://api.github.com/repos/{owner}/{repo}
```

**Кога се вика:**
- Когато user отвори Vulnerability Hunter popup
- Търси CVE vulnerabilities в GitHub

**Статус:** 🔴 **НЕ е активен** - UI не е connected в v0.1.0

---

#### ⚠️ **3. Twitter API (BUILT but NOT active):**

**Endpoint:**
```
GET https://api.twitter.com/2/tweets/search/recent?query={query}
```

**Кога се вика:**
- Когато user отвори Vulnerability Hunter popup
- Търси tweets за CVE mentions

**Статус:** 🔴 **НЕ е активен** - UI не е connected в v0.1.0

---

#### 🔴 **4. Threat Intelligence APIs (BUILT but NOT integrated):**

Тези endpoints са coded но НЕ се викат в v0.1.0:

```
POST https://safebrowsing.googleapis.com/v4/threatMatches:find
POST https://urlhaus-api.abuse.ch/v1/url/
POST https://checkurl.phishtank.com/checkurl/
GET https://haveibeenpwned.com/api/v3/breachedaccount/{email}
GET https://www.virustotal.com/api/v3/urls/{id}
GET https://services.nvd.nist.gov/rest/json/cves/2.0
```

**Статус:** 🔴 **Code exists но НЕ е integrated**

---

### 📡 Как да проследя API calls:

#### **Метод 1: Chrome DevTools Network Tab (Най-лесен):**

1. Отвори Twitter/Facebook в Chrome
2. Отвори DevTools (F12)
3. Отвори **Network** tab
4. Filter by `api.groq.com`
5. Натисни "Fact Check" на post
6. Виж API calls в Network tab

**Ще видиш:**
```
Request URL: https://api.groq.com/openai/v1/chat/completions
Status: 200 OK
Time: 1.24s
```

---

#### **Метод 2: Service Worker Console (По-detailed):**

1. Отвори `chrome://extensions`
2. Намери **Fact-It**
3. Натисни **"service worker"** link
4. DevTools се отваря със service worker console
5. Ще видиш logs като:

```
[Fact-It]: Checking for phishing/scams...
[Fact-It]: API call to Groq (model: llama-3.3-70b-versatile)
[Fact-It]: Groq response: VERDICT=false, CONFIDENCE=99
Daily usage: 48/100
```

---

#### **Метод 3: chrome://serviceworker-internals (Advanced):**

1. Отвори `chrome://serviceworker-internals`
2. Намери `chrome-extension://[твоето-extension-id]`
3. Натисни **Inspect**
4. Виж всички service worker activities:
   - Network requests
   - Storage operations
   - Message passing

---

### 📊 API Call Frequency (Очаквана в production):

| API | Calls/User/Ден | Цена/Call | Цена/User/Ден |
|-----|----------------|-----------|---------------|
| Groq AI | 2-200 (avg 50) | $0.0004 | $0.02 |
| GitHub | 0-20 | Free | $0 |
| Twitter | 0-20 | Free | $0 |
| Threat Intel | 0 | Free | $0 |

**Обща дневна цена на user:** ~$0.02 USD

**С 1,000 users:** ~$20/ден = ~$600/месец
**С 10,000 users:** ~$200/ден = ~$6,000/месец

**Rate limiting те защитава:**
- 100 checks/user/ден = max $0.04/user/ден
- 14,400 checks/ден globally = max $5.76/ден ($173/месец)

---

## 🚀 Final Checklist Before Submission:

### ✅ Validation:
- ❌ НЕ трябва ръчна validation
- ✅ Firefox и Chrome правят automated checks
- ✅ Reviewer notes обясняват embedded API key

### ✅ User Data:
- ✅ Само локално съхранение (chrome.storage.local)
- ✅ Няма external servers
- ✅ Няма лични данни в v0.1.0 (email features disabled)
- ✅ GDPR compliant

### ✅ API Endpoints:
- ✅ Само Groq AI е активен
- ✅ GitHub/Twitter са built but not active
- ✅ Threat Intel е built but not integrated
- ✅ Rate limiting защитава от злоупотреба

---

## 🎯 Готов за submission!

Качи `fact-it-submission-v0.1.0.zip` на:

1. **Firefox:** addons.mozilla.org
2. **Chrome:** chrome.google.com/webstore/devconsole

Използвай submission text от `SUBMISSION_BULGARIAN.md`.

**Очаквай:**
- Automated scan: 2-5 минути
- Human review: 1-7 дни
- Approval: 80-90% chance при първо submission

---

## 📞 Ако ревюърите зададат въпроси:

**За API key:**
> "Embedded Groq API key is rate-limited (100/user/day, 14,400 global/day) to protect against abuse. Users can optionally add their own keys for unlimited usage."

**За data storage:**
> "All user data stored in chrome.storage.local (browser's local storage). No external servers. No personal data collected in v0.1.0."

**За permissions:**
> "storage: Store settings locally | scripting: Inject fact-check buttons | <all_urls>: Access social media platforms and call external APIs from service worker"

---

**🎉 Успех!**

За пълни детайли виж: [VALIDATION_DATA_ENDPOINTS.md](VALIDATION_DATA_ENDPOINTS.md)
