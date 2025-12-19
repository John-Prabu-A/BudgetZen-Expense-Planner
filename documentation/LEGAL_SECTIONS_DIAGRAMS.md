## Legal Sections - Visual Architecture & Flow Diagrams

### 1. File Structure & Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                    BudgetZen Legal Sections                      │
└─────────────────────────────────────────────────────────────────┘

app/(modal)/
├── about-modal.tsx ◄─────────────────── USER INTERACTION STARTS
│   ├── Legal Section
│   │   ├── Privacy Policy Button ──┐
│   │   ├── Terms of Service Button ├─► handleOpenLegalDocument()
│   │   └── Licenses Button ────────┘
│   └── (calls router.push to legal-viewer-modal)
│
├── legal-viewer-modal.tsx ◄─────── NEW MODAL
│   ├── useLocalSearchParams() ──► Gets documentType
│   │
│   ├─ If licenses:
│   │  └─► Render LICENSES_BUNDLE (lib/legal/licenseContent.ts)
│   │
│   └─ If policy/terms:
│      └─► Show "Open in Browser" button
│          └─► Calls openLegalDocument() from lib/legal/legalBrowser.ts
│
└── _layout.tsx
    └── Register legal-viewer-modal

lib/
├── config/
│   └── legalUrls.ts ◄─────────── CONFIGURATION
│       └── LEGAL_URLS constant
│           ├── privacyPolicy: "https://..."
│           ├── termsOfService: "https://..."
│           └── licenses: "https://..."
│
└── legal/
    ├── legalBrowser.ts ◄────── BROWSER HANDLING
    │   ├── openLegalDocument()
    │   │   ├── WebBrowser.openBrowserAsync() ◄── PRIMARY
    │   │   │   └── Success: Show document
    │   │   │   └── Error: Fallback
    │   │   │
    │   │   └── Fallback: Linking.openURL()
    │   │       └── Success: Show in system browser
    │   │       └── Error: Show retry alert
    │   │
    │   └── isValidLegalUrl()
    │       ├── Check HTTPS
    │       └── Check domain (jpdevland.com)
    │
    └── licenseContent.ts ◄───── BUNDLED CONTENT
        └── LICENSES_BUNDLE (markdown)
```

---

### 2. User Journey - Privacy Policy / Terms of Service

```
┌──────────────────┐
│  About Modal     │
│  Legal Section   │
│  ┌────────────┐  │
│  │ Privacy... │  │
│  └────────────┘  │
└────────┬─────────┘
         │ USER TAPS
         ▼
    handleOpenLegalDocument('privacyPolicy')
         │
         │ router.push({
         │   pathname: 'legal-viewer-modal',
         │   params: { documentType: 'privacyPolicy' }
         │ })
         │
         ▼
┌─────────────────────────────────┐
│  Legal Viewer Modal Slides In   │
├─────────────────────────────────┤
│  [📄] Privacy Policy            │
│  This document will open in     │
│  your browser                   │
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🌐 Open in Browser         ││
│  └─────────────────────────────┘│
│                                 │
│  ℹ️ This document is hosted     │
│  online. Make sure you have     │
│  an internet connection.        │
└─────────────────────────────────┘
         │ USER TAPS BUTTON
         ▼
    openLegalDocument(url, title)
         │
         ▼
    TRY: WebBrowser.openBrowserAsync()
         │
    ┌────┴─────┐
    │           │
    YES        NO (Error)
    │           │
    ▼           ▼
 SHOW      TRY: Linking.openURL()
NATIVE        │
WEBVIEW   ┌───┴────┐
    │     │        │
    │     YES      NO (Error)
    │     │        │
    │     ▼        ▼
    │  SHOW    SHOW RETRY ALERT
    │  SYSTEM  - Can Retry
    │  BROWSER - Can Cancel
    │     │        │
    │     │        ▼
    │     │   [Back to Modal]
    │     │
    └─────┴──────────────────────┐
         │ USER DISMISSES        │
         ▼                       │
┌──────────────────┐            │
│  Back to Legal   │◄───────────┘
│  Viewer Modal    │
└────────┬─────────┘
         │ USER TAPS BACK
         ▼
┌──────────────────┐
│  Back to About   │
│  Modal           │
└──────────────────┘
```

---

### 3. User Journey - Licenses (Bundled Content)

```
┌──────────────────┐
│  About Modal     │
│  Legal Section   │
│  ┌────────────┐  │
│  │ Licenses   │  │
│  └────────────┘  │
└────────┬─────────┘
         │ USER TAPS
         ▼
    handleOpenLegalDocument('licenses')
         │
         │ router.push({
         │   pathname: 'legal-viewer-modal',
         │   params: { documentType: 'licenses' }
         │ })
         │
         ▼
┌─────────────────────────────────┐
│  Legal Viewer Modal             │
│  Displays Bundled Content       │
├─────────────────────────────────┤
│                                 │
│  # BudgetZen - Open Source      │
│  Licenses                       │
│                                 │
│  ## React Native & Expo         │
│  - React Native: MIT            │
│  - Expo: MIT                    │
│                                 │
│  ## Navigation                  │
│  - React Navigation: MIT        │
│                                 │
│  ## Animations & Gestures       │
│  - React Native Reanimated      │
│  ...                            │
│                                 │
│  [Fully Scrollable]             │
│  [No Internet Required]         │
│  [Offline Access]               │
└─────────────────────────────────┘
         │ USER SCROLLS
         │ (can read all content)
         │
         │ USER TAPS BACK
         ▼
┌──────────────────┐
│  Back to About   │
│  Modal           │
└──────────────────┘
```

---

### 4. Error Handling Flow

```
USER TAPS LEGAL BUTTON
         │
         ▼
openLegalDocument(url, title) Called
         │
         ▼
STEP 1: Validate URL
         │
    ┌────┴─────┐
    │           │
  VALID      INVALID
    │           │
    │           ▼
    │      Log Error
    │      Return Early
    │           │
    ▼           ▼
STEP 2: Try WebBrowser.openBrowserAsync()
         │
    ┌────┴────────────┐
    │                 │
   YES              ERROR
    │                 │
    ▼                 ▼
   SHOW           CATCH ERROR
   NATIVE         Log [Legal] Error
   WEBVIEW        │
    │             ▼
    │         STEP 3: Try Linking.openURL()
    │             │
    │         ┌───┴────┐
    │         │        │
    │        YES       NO
    │         │        │
    │         ▼        ▼
    │        SHOW   CATCH ERROR
    │        SYSTEM  Log [Legal] Error
    │        BROWSER │
    │         │      ▼
    │         │  SHOW ALERT
    │         │  ┌─────────────────┐
    │         │  │ Unable to Open  │
    │         │  │ Document        │
    │         │  │                 │
    │         │  │ [Cancel] [Retry]│
    │         │  └─────────────────┘
    │         │      │         │
    │         │      │         └─► Retry (back to STEP 2)
    │         │      │
    │         │      └─► Cancel
    │         │
    └─────────┴──────────────────► User Close/Dismiss
                     │
                     ▼
            Return to Legal Modal
                     │
                     ▼
            User Back to Previous Screen
```

---

### 5. Type Safety & Validation

```
┌────────────────────────────────────┐
│  Route Parameters (from router)    │
│  { documentType: string }          │
└────────────┬──────────────────────┘
             │
             ▼
     useLocalSearchParams()
     documentType = "privacyPolicy" (example)
             │
             ▼
  ┌──────────────────────────────┐
  │ Validate Document Type       │
  │ const validDocumentType:     │
  │   LegalDocumentType = ...    │
  └──────────┬───────────────────┘
             │
             ▼
  Check: is documentType in valid list?
  - 'privacyPolicy'
  - 'termsOfService'
  - 'licenses'
             │
    ┌────────┴───────┐
    │                │
   YES              NO
    │                │
    │                ▼
    │          Default to 'privacyPolicy'
    │                │
    └────────┬───────┘
             │
             ▼
     ✅ Type-safe LegalDocumentType
        Used throughout component
```

---

### 6. WebView Fallback Chain

```
┌─────────────────────────────────────────────────────┐
│  Priority Chain for Opening Legal Document          │
└──────────────────┬────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    PRIORITY 1           PRIORITY 2
    (Preferred)          (Fallback)
        │                     │
        ▼                     ▼
WebBrowser.openBrowserAsync()  Linking.openURL()
  ├─ Native header            ├─ System browser
  ├─ Share button             └─ Minimal controls
  ├─ Refresh button
  ├─ Safe areas (iOS)
  └─ Hardware back (Android)
        │                     │
    ┌───┴─────────────────────┴───┐
    │                             │
   SUCCESS (Show in browser)     │
    │                             │
    └─────────────────────────────┘
                     │
              ┌──────┴──────┐
              │             │
           Success       FAILURE
              │             │
              │             ▼
              │     Show Alert with Retry
              │             │
              │          User can:
              │          - Retry (loop back)
              │          - Cancel
              │
        ▼ (User dismisses browser)
    Return to Legal Modal
```

---

### 7. Component State & Props Flow

```
┌──────────────────────────────────────────────────────────┐
│            Legal Viewer Modal - State Flow               │
└──────────────────────┬─────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
      useLocalSearchParams()  useTheme()
      { documentType }        { isDark, colors }
            │                     │
            └──────────┬──────────┘
                       │
                       ▼
              useMemo() Calculations:
              ├─ validDocumentType
              └─ document { title, url }
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    If Licenses   If Policy      If Terms
        │              │              │
        ▼              ▼              ▼
  renderLicense   Placeholder    Placeholder
   Content()      Box with       Box with
     │            "Open in       "Open in
     │            Browser"       Browser"
     │              │              │
     ▼              ▼              ▼
  Scrollable    [Button]        [Button]
  Markdown       │               │
  Content        │               │
     │           └───┬───────────┘
     │               │
     │           onPress:
     │           openLegalDocument()
     │               │
     └───────────────┴──────┐
                            │
                    ┌───────▼────────┐
                    │ WebBrowser or  │
                    │ System Browser │
                    └────────────────┘
```

---

### 8. Security Validation Pipeline

```
User Taps "Open in Browser"
         │
         ▼
    openLegalDocument(url)
         │
         ▼
   isValidLegalUrl(url)
         │
         ▼
    Validation Checks:
    ┌──────────────────────┐
    │ 1. Parse URL object  │
    │    ├─ Valid format?  │
    │    └─ Success: Continue
    │       Failure: Return false
    │                  │
    │                  ▼
    │ 2. Check Protocol  │
    │    ├─ Is HTTPS?    │
    │    └─ Yes: Continue
    │       No: Return false
    │                  │
    │                  ▼
    │ 3. Check Domain    │
    │    ├─ Is jpdevland │
    │    │   .com?       │
    │    └─ Yes: Continue
    │       No: Return false
    │                  │
    │                  ▼
    │ 4. All checks pass?│
    │    └─ Return true  │
    └──────────────────────┘
         │
    ┌────┴──────┐
    │            │
  VALID       INVALID
    │            │
    ▼            ▼
 PROCEED      LOG WARNING
 OPEN         REJECT URL
 BROWSER      RETURN EARLY
```

---

**All diagrams show the complete flow from user interaction through error recovery.**

**This architecture ensures production-ready, reliable handling of legal documents.**
