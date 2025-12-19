# 📲 Unified Transaction Detection Service (Android + iOS)
## My Money – Pro (Expo React Native)

---

## 🎯 Objective

Build a **cross-platform transaction ingestion system** that:
- Automatically detects **financial transactions**
- Extracts **amount, type, date, account, description**
- Creates **Income / Expense / Transfer** records
- Works reliably on **both Android and iOS**
- Uses **platform-appropriate mechanisms**
- Shares a **single common parsing & classification pipeline**

---

## 🧠 Core Design Principle

> **Do NOT design SMS parsing as the core feature.**  
> Design a **Transaction Message Ingestion Engine** with **multiple input sources**.

SMS is **only one of the sources**.

---

## 🧱 High-Level Architecture

Input Sources (Platform Specific)
        ↓
Unified Message Ingestion Layer
        ↓
Normalization & Noise Filter
        ↓
Transaction Detection Engine
        ↓
Entity Extraction Engine
        ↓
Transaction Classification
        ↓
Deduplication & Validation
        ↓
Persistence Layer
        ↓
UI Sync & User Feedback

---

## 1️⃣ Supported Input Sources

### Android
- Background SMS listener (with permission)
- Optional notification listener (bank app notifications)

### iOS
- Bank notification parsing (user-enabled)
- Manual inbox scan (user-initiated)
- Email parsing (bank statements / alerts)
- SMS auto-read ❌ (not supported by iOS)

⚠️ All sources must emit **the same standardized message object**.

---

## 2️⃣ Unified Message Interface (Critical)

Every ingestion source MUST output:

- `rawText`
- `sourceType` (SMS / Notification / Email / Manual)
- `timestamp`
- `senderIdentifier`
- `platform`
- `confidenceHint`

⚠️ Downstream logic must **not care about platform or source**.

---

## 3️⃣ Permission & Consent Strategy

### Mandatory
- Explicit opt-in per source
- Separate toggles for:
  - Android SMS
  - Notifications
  - Email parsing
  - Manual scan

### UX Rules
- Explain clearly:
  - What is read
  - What is extracted
  - What is stored
  - What stays on device
- Allow disabling any source anytime
- Show platform limitations transparently

---

## 4️⃣ Background Execution Model

### Android
- Background listener or foreground service
- Must survive:
  - App kill
  - Device reboot
- Battery-safe and OS-compliant

### iOS
- No true background SMS
- Use:
  - Notification service extensions
  - Background fetch where allowed
  - User-initiated sync actions
- Never promise “always listening”

---

## 5️⃣ Message Normalization Layer

### Responsibilities
- Lowercase conversion
- Currency normalization
- Remove URLs & OTP patterns
- Strip marketing text
- Standardize date & number formats

### Output
- Clean transaction-candidate text
- Metadata preserved separately

---

## 6️⃣ Transaction Detection Engine

### Detection Logic
- Keyword-based intent detection
- Pattern-based detection
- Confidence scoring

### Supported Intents
- Credit
- Debit
- Transfer
- Ignore (non-transaction)

### Rules
- Reject low-confidence messages
- Log rejected messages locally (debug mode)

---

## 7️⃣ Entity Extraction Engine

### Mandatory Fields
- Transaction type
- Amount
- Currency
- Date/time
- Bank or provider
- Reference / description (if available)

### Strategy
- Multiple pattern variants
- Region-aware (India-first, extensible)
- Graceful degradation if fields missing

---

## 8️⃣ Transaction Classification Logic

### Mapping
- Credit → Income
- Debit → Expense
- Transfer → Transfer

### Enhancements
- Detect self-transfers
- Initial category assignment
- Mark entries as `AUTO_GENERATED`

---

## 9️⃣ Duplicate Detection & Safety

### Deduplication Criteria
- Amount similarity
- Time window
- Source identifier
- Reference number

### Requirements
- Idempotent writes
- Hash-based uniqueness
- No duplicate creation on retries

---

## 🔟 Persistence Layer Integration

### Storage Rules
- Use existing transaction schema
- Support offline creation
- Sync later with backend

### Metadata
- Source type
- Confidence score
- Auto/manual flag

---

## 1️⃣1️⃣ UI & State Sync

### UI Updates
- Invalidate queries
- Refresh dashboard & analytics
- Show subtle auto-added indicators

### User Feedback
- Optional notification:
  - “₹1,200 expense added automatically”
- Allow undo / edit immediately

---

## 1️⃣2️⃣ Settings & Controls

### User Options
- Enable/disable auto-detection
- Choose input sources
- Confidence threshold slider
- Auto-category on/off
- Debug view toggle

---

## 1️⃣3️⃣ Privacy & Security

### Data Handling
- Never store full raw messages permanently
- Extract only required fields
- Encrypt local storage if available

### Compliance
- On-device processing by default
- No message content analytics
- Clear privacy disclosure

---

## 1️⃣4️⃣ Testing Strategy

### Platform Tests
- Android background reliability
- iOS notification ingestion
- Permission revocation handling
- App killed / restarted
- Network offline scenarios

### Message Tests
- Different banks
- Multiple languages
- Partial alerts
- Duplicate alerts

---

## 1️⃣5️⃣ Rollout Plan

### Phase 1
- Manual + notification ingestion
- Core parser stable

### Phase 2
- Android SMS automation
- iOS background notification support

### Phase 3
- Smart learning from user corrections
- Advanced categorization

---

## ✅ Final Deliverables

- Cross-platform ingestion architecture
- Unified parsing & classification engine
- Platform-specific listeners (Android / iOS)
- Privacy-safe implementation
- Expo-compatible structure
- Graceful platform fallbacks

---

## 📝 Important Notes

- Feature parity ≠ identical implementation
- Android = automation-first
- iOS = privacy-first
- User trust > full automation
