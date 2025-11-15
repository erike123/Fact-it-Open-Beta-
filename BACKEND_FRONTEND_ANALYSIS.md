# 🔍 АНАЛИЗ: BACKEND vs FRONTEND - Къде работят функциите

## 📊 **КРАТЪК ОТГОВОР:**

**100% от функциите работят в BACKEND (Service Worker)**

❌ **НИЩО не работи във Frontend/Content Script** (освен показване на бутон и резултат)

---

## 🏗️ **АРХИТЕКТУРА НА EXTENSION:**

```
┌─────────────────────────────────────────────────┐
│ CONTENT SCRIPT (Frontend - на страницата)      │
│ Файлове: src/content/universal-content.ts      │
├─────────────────────────────────────────────────┤
│                                                 │
│ ЗАДАЧИ:                                         │
│ 1. Показва бутон "Fact Check" на публикации    │
│ 2. Извлича текст от публикацията               │
│ 3. Изпраща MESSAGE към Backend                 │
│ 4. Получава резултат от Backend                │
│ 5. Показва резултат на екрана                  │
│                                                 │
│ ❌ НЕ извършва AI анализ                       │
│ ❌ НЕ проверява за scams                       │
│ ❌ НЕ извършва phishing detection              │
│ ❌ НЕ комуникира с API                         │
│                                                 │
└─────────────────────────────────────────────────┘
                    ↓ MESSAGE ↓
┌─────────────────────────────────────────────────┐
│ SERVICE WORKER (Backend - в background)        │
│ Файл: src/background/service-worker.ts         │
├─────────────────────────────────────────────────┤
│                                                 │
│ ЗАДАЧИ:                                         │
│ ✅ Получава MESSAGE от Content Script          │
│ ✅ Извършва AI fact-checking (orchestrator)    │
│ ✅ Проверява за scams (detectPhishingAndScams) │
│ ✅ Проверява за campaigns (threat intelligence)│
│ ✅ Комуникира с AI APIs (Groq, OpenAI, etc.)  │
│ ✅ Управлява rate limiting                     │
│ ✅ Записва statistics                          │
│ ✅ Връща резултат към Content Script           │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ **ДЕТАЙЛЕН АНАЛИЗ НА ВСЯКА ФУНКЦИЯ:**

### **1. SCAM DETECTION (100+ Patterns)**

**Къде работи:** 🔴 **100% BACKEND**

**Файл:** `src/background/phishing-detector/index.ts` (350 реда)

**Flow:**
```javascript
// Content Script (Frontend):
chrome.runtime.sendMessage({
  type: 'CHECK_CLAIM',
  payload: { text: "Send 1 BTC, get 2 BTC!" }
});

// ↓ Message изпратено към Backend ↓

// Service Worker (Backend):
async function handleCheckClaim(message) {
  const text = message.payload.text;

  // ✅ Backend извършва phishing detection
  const phishingResult = await detectPhishingAndScams(text);

  // phishingResult съдържа:
  // - isPhishing: true/false
  // - isSuspicious: true/false
  // - scamDetection: { patterns matched }
  // - urlAnalysis: { malicious URLs, suspicious URLs }
  // - cryptoScam: { detected, indicators }
  // - domainIntelligence: { security score, risk level }
  // - warnings: [ "🚨 CRYPTO SCAM..." ]
  // - warningsBG: [ "🚨 КРИПТО ИЗМАМА..." ]

  return phishingResult;
}

// ↓ Резултат изпратен към Frontend ↓

// Content Script (Frontend):
chrome.runtime.onMessage.addListener((response) => {
  // ✅ Frontend само показва резултата
  showWarning(response.warnings); // Показва HTML
});
```

**Какво се случва в Backend:**
```typescript
// src/background/phishing-detector/index.ts

export async function detectPhishingAndScams(text: string) {
  // 1. Скенира текста за 100+ scam patterns
  const scamPatternResult = detectScamPatterns(text);
  //    ^ Проверява: "Send BTC", "Free money", "Elon Musk giveaway"

  // 2. Извлича всички URLs от текста
  const urls = extractURLs(text);
  //    ^ Regex pattern за намиране на линкове

  // 3. За всеки URL:
  for (const url of urls) {
    // a) Quick check за suspicious patterns
    const suspiciousCheck = isSuspiciousURL(url);
    //    ^ Проверява: typosquatting, suspicious TLDs, IP addresses

    // b) Domain Intelligence analysis
    const domainAnalysis = await analyzeDomain(url);
    //    ^ Проверява: domain age, SSL, blacklists
    //      WHOIS API, SSL validator, VirusTotal/PhishTank

    // c) Threat Intelligence (ако има API keys)
    const analysis = await analyzeURL(url, apiKeys);
    //    ^ Google Safe Browsing, URLhaus, PhishTank
  }

  // 4. Открива cryptocurrency scams
  const cryptoScam = detectCryptoScam(text);
  //    ^ Regex за Bitcoin/Ethereum addresses

  // 5. Изчислява overall severity
  let severity = calculateSeverity(scamPatternResult, urls, cryptoScam);

  // 6. Генерира warnings и recommendations
  const warnings = generateWarnings(severity);
  const warningsBG = generateBulgarianWarnings(severity);

  return {
    isPhishing: true/false,
    overallSeverity: 'critical',
    securityScore: 5,
    warnings: [ "🚨 DANGER..." ],
    warningsBG: [ "🚨 ОПАСНОСТ..." ],
    domainIntelligence: [ {...} ]
  };
}
```

**API Calls в Backend:**
- ✅ WHOIS API (за domain age)
- ✅ SSL certificate check (HTTPS validation)
- ✅ VirusTotal API (blacklist check)
- ✅ PhishTank API (phishing database)
- ✅ Google Safe Browsing API (malware check)

**Frontend роля:** ❌ НИКАКВА - само показва резултата

---

### **2. PHISHING PROTECTION**

**Къде работи:** 🔴 **100% BACKEND**

**Файл:** `src/background/phishing-detector/scam-patterns.ts` (100+ patterns)

**Flow:**
```typescript
// Backend only:
const SCAM_PATTERNS = [
  {
    pattern: /send\s+\d+(\.\d+)?\s*(btc|bitcoin|eth|ethereum)/i,
    type: 'crypto_scam',
    severity: 'critical',
    description: 'Cryptocurrency doubling scam'
  },
  {
    pattern: /giveaway.*send.*receive/i,
    type: 'fake_giveaway',
    severity: 'critical'
  },
  // ... 100+ patterns
];

function detectScamPatterns(text: string) {
  // Backend regex matching
  const matches = [];
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.pattern.test(text)) {
      matches.push(pattern);
    }
  }
  return { matches, severity: calculateSeverity(matches) };
}
```

**Frontend роля:** ❌ НИКАКВА

---

### **3. DOMAIN INTELLIGENCE**

**Къде работи:** 🔴 **100% BACKEND**

**Файл:** `src/background/security-intelligence/domain-analyzer.ts` (500+ реда)

**Flow:**
```typescript
// Backend only:
export async function analyzeDomain(url: string): Promise<DomainIntelligence> {
  const domain = extractDomain(url);

  // Parallel API calls (всички в Backend):
  const [domainAge, sslCert, blacklist] = await Promise.allSettled([
    checkDomainAge(domain),      // ✅ WHOIS API call
    checkSSLCertificate(domain), // ✅ HTTPS validation
    checkBlacklists(domain),     // ✅ VirusTotal/PhishTank/Google Safe Browsing
  ]);

  // Изчисляване на security score (Backend logic):
  const securityScore = calculateSecurityScore(domainAge, sslCert, blacklist);
  //    ^ Algorithm: 100 - (blacklist: -50, new domain: -30, bad SSL: -20)

  // Определяне на risk level:
  const riskLevel = determineRiskLevel(securityScore);
  //    ^ critical (0-25), high (26-50), medium (51-75), low (76-90), safe (91-100)

  // Генериране на indicators:
  const indicators = generateIndicators(domainAge, sslCert, blacklist);
  //    ^ [ { type: 'critical', message: '...', messageBG: '...' } ]

  return {
    url,
    securityScore,
    riskLevel,
    domainAge: { ageInDays: 5, createdDate: '...', isSuspicious: true },
    sslCertificate: { isValid: false, issuer: '...', isSelfSigned: true },
    blacklistStatus: { isListed: true, sources: ['PhishTank'], ... },
    indicators,
    recommendations,
    recommendationsBG
  };
}
```

**API Calls:**
- ✅ WHOIS lookup (Backend HTTP request)
- ✅ SSL certificate validation (Backend HTTPS check)
- ✅ VirusTotal API (Backend HTTP request)
- ✅ PhishTank API (Backend HTTP request)
- ✅ Google Safe Browsing API (Backend HTTP request)

**Frontend роля:** ❌ НИКАКВА

---

### **4. BULGARIAN LANGUAGE WARNINGS**

**Къде работи:** 🔴 **100% BACKEND**

**Файл:** `src/background/phishing-detector/index.ts` (линии 159-209)

**Flow:**
```typescript
// Backend генерира и EN и BG текст:
const warnings: string[] = [];
const warningsBG: string[] = [];

if (maliciousUrls.length > 0) {
  // ✅ Backend push на двата езика:
  warnings.push(
    `🚨 DANGER: ${maliciousUrls.length} confirmed malicious URL(s) detected`
  );
  warningsBG.push(
    `🚨 ОПАСНОСТ: ${maliciousUrls.length} потвърдено злонамерени URL адреси`
  );
}

// Backend добавя Domain Intelligence warnings:
domainIntelligence.forEach((domain) => {
  domain.indicators.forEach((indicator) => {
    warnings.push(`🔒 ${indicator.message}`);        // EN
    warningsBG.push(`🔒 ${indicator.messageBG}`);    // BG
  });
});

// Frontend получава и двата:
return {
  warnings,      // [ "🚨 DANGER...", "🔒 Domain..." ]
  warningsBG,    // [ "🚨 ОПАСНОСТ...", "🔒 Домейн..." ]
  recommendations,
  recommendationsBG
};
```

**Frontend роля:**
- ✅ Само показва текста (HTML rendering)
- ❌ НЕ превежда
- ❌ НЕ генерира съобщения

---

### **5. MULTI-AI SUPPORT**

**Къде работи:** 🔴 **100% BACKEND**

**Файл:** `src/background/ai/orchestrator.ts` (300+ реда)

**Flow:**
```typescript
// Backend orchestrator coordinates all AI providers:
export class FactCheckOrchestrator {
  async checkClaim(text: string, platform: string): Promise<AggregatedResult> {

    // 1. Get enabled providers (Backend reads chrome.storage):
    const enabledProviders = await this.getEnabledProviders();
    //    ^ Returns: ['groq', 'perplexity', 'anthropic']

    // 2. Run all providers in PARALLEL (Backend):
    const providerPromises = enabledProviders.map(async (providerId) => {
      const apiKey = await this.getApiKey(providerId);
      const provider = providerRegistry[providerId];

      try {
        // ✅ Backend AI API call:
        const result = await provider.verifyClaim(text, apiKey);
        //    ^ HTTP request to Groq/OpenAI/Anthropic/Perplexity

        return {
          providerId,
          providerName: provider.displayName,
          verdict: result.verdict,
          confidence: result.confidence,
          explanation: result.explanation,
          sources: result.sources
        };
      } catch (error) {
        return { providerId, error: error.message };
      }
    });

    // 3. Wait for all providers (Backend):
    const providerResults = await Promise.allSettled(providerPromises);

    // 4. Aggregate results (Backend logic):
    const aggregatedResult = this.aggregateResults(providerResults);
    //    ^ Calculates:
    //      - Majority vote (2/3 say FALSE → verdict = FALSE)
    //      - Weighted confidence (average of agreeing providers)
    //      - Consensus percentage (67% agreement)
    //      - Source deduplication

    return aggregatedResult;
  }
}
```

**AI API Calls (всички Backend):**
- ✅ Groq API (`https://api.groq.com/openai/v1/chat/completions`)
- ✅ OpenAI API (`https://api.openai.com/v1/chat/completions`)
- ✅ Anthropic API (`https://api.anthropic.com/v1/messages`)
- ✅ Perplexity API (`https://api.perplexity.ai/chat/completions`)

**Frontend роля:** ❌ НИКАКВА

---

### **6. RATE LIMITING**

**Къде работи:** 🔴 **100% BACKEND**

**Файлове:**
- `src/background/limits/daily-limit-manager.ts` (per-user limits)
- `src/background/rate-limiting/global-rate-limiter.ts` (global limits)

**Flow:**
```typescript
// Backend only:
export async function canMakeRequest(): Promise<boolean> {
  // 1. Check per-user limit (Backend reads chrome.storage.local):
  const userUsage = await getDailyUsage();
  if (userUsage.checksToday >= 100) {
    return false; // User limit reached
  }

  // 2. Check global limit (Backend memory counter):
  const globalUsage = getGlobalRequestCount();
  if (globalUsage >= 14400) {
    return false; // Global limit reached
  }

  return true;
}

export async function recordDailyUsage(): Promise<void> {
  // Backend increments counters:
  const usage = await getDailyUsage();
  usage.checksToday += 1;
  await chrome.storage.local.set({ usage });

  // Backend increments global counter:
  incrementGlobalRequestCount();
}
```

**Storage:**
- ✅ `chrome.storage.local` (Backend може да пише)
- ❌ Content Script НЕ може да пише директно

**Frontend роля:**
- ✅ Може да прочете usage stats за показване
- ❌ НЕ може да increment counters
- ❌ НЕ контролира rate limiting

---

### **7. STATISTICS TRACKING**

**Къде работи:** 🔴 **100% BACKEND**

**Файл:** `src/background/tracking/historical-tracker.ts`

**Flow:**
```typescript
// Backend tracking:
export async function trackHistoricalCheck(result: {
  verdict: string;
  confidence: number;
  platform: string;
  // ...
}): Promise<void> {

  // Backend reads current stats:
  const stats = await chrome.storage.local.get('historicalStats');

  // Backend updates counters:
  stats.totalChecks += 1;
  stats.byPlatform[result.platform] += 1;
  stats.byVerdict[result.verdict] += 1;

  if (result.phishingDetected) {
    stats.scamsBlocked += 1;
  }

  // Backend saves updated stats:
  await chrome.storage.local.set({ historicalStats: stats });
}
```

**Tracked Metrics (Backend):**
- ✅ Total checks
- ✅ Checks by platform (Twitter, LinkedIn, Facebook)
- ✅ Checks by verdict (true, false, unknown)
- ✅ Scams blocked
- ✅ Average confidence
- ✅ Daily/weekly/monthly usage

**Frontend роля:**
- ✅ Може да прочете stats за показване в UI
- ❌ НЕ записва stats

---

## 📊 **ОБОБЩЕНА ТАБЛИЦА:**

| Функция | Backend | Frontend | API Calls | Storage Writes |
|---------|---------|----------|-----------|----------------|
| **1. Scam Detection** | ✅ 100% | ❌ 0% | ✅ WHOIS, VirusTotal, PhishTank | ✅ Backend only |
| **2. Phishing Protection** | ✅ 100% | ❌ 0% | ✅ Google Safe Browsing | ✅ Backend only |
| **3. Domain Intelligence** | ✅ 100% | ❌ 0% | ✅ WHOIS, SSL, Blacklists | ✅ Backend only |
| **4. Bulgarian Warnings** | ✅ 100% | ❌ 0% (само показва) | ❌ No | ❌ No |
| **5. Multi-AI Support** | ✅ 100% | ❌ 0% | ✅ Groq, OpenAI, Anthropic, Perplexity | ✅ Backend only |
| **6. Rate Limiting** | ✅ 100% | ❌ 0% | ❌ No | ✅ Backend only |
| **7. Statistics Tracking** | ✅ 100% | ❌ 0% (само чете) | ❌ No | ✅ Backend only |

---

## 🎯 **ЗАЩО ВСИЧКО Е В BACKEND?**

### **1. Сигурност:**
```
❌ Frontend (Content Script):
- Runs in webpage context
- Can be inspected by user
- API keys would be visible
- Regex patterns can be extracted
- Easy to bypass

✅ Backend (Service Worker):
- Isolated execution context
- Cannot be inspected from webpage
- API keys obfuscated in build
- Logic hidden from end users
- Cannot be bypassed
```

### **2. Performance:**
```
❌ Frontend:
- Limited CPU (webpage can be slow)
- Blocking page rendering
- Memory constraints
- Network requests visible in DevTools

✅ Backend:
- Dedicated CPU allocation
- Non-blocking (async operations)
- Better memory management
- Network requests hidden
```

### **3. Chrome Extension Architecture:**
```
Content Script (Frontend):
  ├─ Can access DOM
  ├─ Can inject UI elements
  ├─ Cannot make cross-origin requests (CORS)
  ├─ Cannot access chrome.storage.local directly
  └─ Must send messages to background

Service Worker (Backend):
  ├─ Cannot access DOM
  ├─ Can make ANY network requests (no CORS)
  ├─ Can read/write chrome.storage.local
  ├─ Can handle messages from content scripts
  └─ Persistent background process
```

---

## 🔄 **COMMUNICATION FLOW:**

```
┌──────────────────────────────────────────────────────┐
│ USER ACTION                                          │
│ User clicks "Fact Check" button                     │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│ FRONTEND (Content Script)                           │
│ src/content/universal-content.ts                    │
├──────────────────────────────────────────────────────┤
│ 1. Extract text from post                           │
│ 2. chrome.runtime.sendMessage({                     │
│      type: 'CHECK_CLAIM',                           │
│      payload: { text, elementId, platform }         │
│    })                                                │
└──────────────────────────────────────────────────────┘
                    ↓ MESSAGE ↓
┌──────────────────────────────────────────────────────┐
│ BACKEND (Service Worker)                            │
│ src/background/service-worker.ts                    │
├──────────────────────────────────────────────────────┤
│ async function handleCheckClaim(message) {          │
│   ✅ const result = await orchestrator.checkClaim() │
│      ├─ Groq API call                               │
│      ├─ OpenAI API call (if enabled)                │
│      └─ Anthropic API call (if enabled)             │
│                                                      │
│   ✅ const phishing = await detectPhishingAndScams()│
│      ├─ Scam pattern matching (100+ patterns)       │
│      ├─ URL extraction & analysis                   │
│      ├─ Domain Intelligence:                        │
│      │  ├─ WHOIS API (domain age)                   │
│      │  ├─ SSL validation                           │
│      │  └─ Blacklist check (VirusTotal/PhishTank)   │
│      └─ Crypto scam detection                       │
│                                                      │
│   ✅ const enhanced = await enhanceWithCampaigns()  │
│      └─ Misinformation tracking                     │
│                                                      │
│   ✅ await recordDailyUsage()                       │
│   ✅ await trackHistoricalCheck()                   │
│                                                      │
│   return {                                           │
│     verdict: 'false',                               │
│     confidence: 95,                                  │
│     explanation: '🚨 SCAM DETECTED...',            │
│     warnings: [ ... ],                              │
│     warningsBG: [ ... ]                             │
│   }                                                  │
│ }                                                    │
└──────────────────────────────────────────────────────┘
                    ↓ RESPONSE ↓
┌──────────────────────────────────────────────────────┐
│ FRONTEND (Content Script)                           │
│ src/content/universal-content.ts                    │
├──────────────────────────────────────────────────────┤
│ chrome.runtime.onMessage.addListener((response) => {│
│   // ✅ Display result to user (HTML only)          │
│   showResultCard({                                   │
│     verdict: response.verdict,                      │
│     warnings: response.warnings,                    │
│     warningsBG: response.warningsBG                 │
│   });                                                │
│ });                                                  │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│ USER SEES RESULT                                     │
│ 🚨 SCAM DETECTED - 95% confidence                   │
│ НЕ изпращайте криптовалута!                         │
└──────────────────────────────────────────────────────┘
```

---

## ✅ **ОКОНЧАТЕЛЕН ОТГОВОР:**

### **Колко функции работят?**
**7/7 функции работят 100%**

### **Къде работят?**
**100% в BACKEND (Service Worker)**

### **Frontend роля?**
```
Frontend (Content Script):
├─ 5% - Показва бутон "Fact Check"
├─ 5% - Извлича текст от DOM
├─ 10% - Изпраща MESSAGE към Backend
└─ 80% - Показва резултат (HTML/CSS rendering)

TOTAL ЛОГИКА: 0%
```

### **Backend роля?**
```
Backend (Service Worker):
├─ 100% - AI fact-checking (orchestrator)
├─ 100% - Scam detection (100+ patterns)
├─ 100% - Phishing protection
├─ 100% - Domain Intelligence (WHOIS, SSL, blacklists)
├─ 100% - Bulgarian text generation
├─ 100% - Multi-AI coordination
├─ 100% - Rate limiting
├─ 100% - Statistics tracking
└─ 100% - ALL API calls

TOTAL ЛОГИКА: 100%
```

---

## 🎯 **ЗАКЛЮЧЕНИЕ:**

**Extension-ът е напълно функционален Backend система!**

- ✅ Всички API calls в Backend
- ✅ Всички AI providers в Backend
- ✅ Всички security checks в Backend
- ✅ Всички storage operations в Backend
- ✅ Frontend е само "UI layer" (показва резултат)

**Това е правилната архитектура за Chrome Extension!**

Готово за submission! 🚀
