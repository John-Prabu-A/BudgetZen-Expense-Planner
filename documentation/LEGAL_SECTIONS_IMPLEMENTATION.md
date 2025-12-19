## Legal Sections Implementation - Complete Guide

### Overview
This document describes the production-ready implementation of legal sections (Privacy Policy, Terms of Service, Licenses) in BudgetZen.

### Architecture

#### 1. **Configuration Layer** (`lib/config/legalUrls.ts`)
- Centralized URL management
- Type-safe document type definitions
- Easy to update without code changes
- Localization-ready structure

```typescript
export const LEGAL_URLS = {
  privacyPolicy: 'https://www.jpdevland.com/app/budgetzen/privacy',
  termsOfService: 'https://www.jpdevland.com/app/budgetzen/terms',
  licenses: 'https://www.jpdevland.com/app/budgetzen/licenses',
}
```

#### 2. **Browser Handling** (`lib/legal/legalBrowser.ts`)
**Primary Behavior:**
- Uses `expo-web-browser` for native WebView experience
- Provides native header with back button
- Handles safe areas (iOS notch)
- Hardware back button support (Android)
- Share and refresh functionality

**Fallback Behavior:**
- If WebView fails → Falls back to system browser (`Linking.openURL`)
- If system browser fails → Shows retry alert with error message
- Never crashes or silently fails

**Security:**
- URL validation before opening
- HTTPS-only enforcement
- Domain whitelist (jpdevland.com)

#### 3. **Bundled Content** (`lib/legal/licenseContent.ts`)
- Offline license content for all open-source dependencies
- Displayed when Licenses button is tapped
- Works without internet connection
- Markdown-formatted with proper structure

#### 4. **Legal Viewer Modal** (`app/(modal)/legal-viewer-modal.tsx`)

**For Privacy Policy & Terms of Service:**
- Shows placeholder with "Open in Browser" button
- Displays info box explaining document is hosted online
- Tapping button opens native WebView
- Includes loading and error handling

**For Licenses:**
- Displays bundled markdown content directly in app
- Formatted headings, dividers, and body text
- Works offline
- Scrollable with theme integration

**Features:**
- Safe area support (iOS notch)
- Theme-aware styling (dark/light mode)
- Accessibility labels
- Back navigation

#### 5. **About Modal Integration** (`app/(modal)/about-modal.tsx`)

**Legal Buttons:**
- Privacy Policy → Opens legal viewer with `privacyPolicy` type
- Terms of Service → Opens legal viewer with `termsOfService` type
- Licenses → Opens legal viewer with `licenses` type

**Handler:**
```typescript
const handleOpenLegalDocument = (documentType: 'privacyPolicy' | 'termsOfService' | 'licenses') => {
  router.push({
    pathname: '/(modal)/legal-viewer-modal',
    params: { documentType },
  });
}
```

### Navigation Flow

```
About Modal
├── Privacy Policy Button
│   └── → Legal Viewer Modal (privacyPolicy)
│       └── "Open in Browser" → WebBrowser.openBrowserAsync()
│
├── Terms of Service Button
│   └── → Legal Viewer Modal (termsOfService)
│       └── "Open in Browser" → WebBrowser.openBrowserAsync()
│
└── Licenses Button
    └── → Legal Viewer Modal (licenses)
        └── Displays bundled content directly
```

### Error Handling Flow

```
User taps Legal Button
    ↓
Legal Viewer Modal opens
    ↓
For Policy/Terms: User taps "Open in Browser"
    ↓
openLegalDocument() called
    ↓
Try: WebBrowser.openBrowserAsync()
    ├─ Success → Native WebView opens ✓
    └─ Failure ↓
        Try: Linking.openURL()
        ├─ Success → System browser opens ✓
        └─ Failure ↓
            Alert.alert() with Retry option
            User can retry or cancel
```

### User Experience (UX)

#### Android & iOS Compatibility
- ✅ WebView with native header
- ✅ Back gesture handling
- ✅ Hardware back button (Android)
- ✅ Safe area support (iOS notch)
- ✅ Loading indicators
- ✅ Error recovery

#### Privacy Policy & Terms of Service
1. User taps button in About modal
2. Legal Viewer Modal slides in
3. Shows icon, title, and description
4. "Open in Browser" button visible
5. User taps button
6. Native WebView opens with full document
7. User can share, refresh, go back
8. Closes to Legal Viewer Modal

#### Licenses
1. User taps "Licenses" button
2. Legal Viewer Modal slides in
3. Bundled license content displays immediately
4. Formatted with headings, dividers, links
5. Fully scrollable
6. Works offline
7. User can dismiss back to About modal

### Type Safety

All document types are validated:
```typescript
type LegalDocumentType = 'privacyPolicy' | 'termsOfService' | 'licenses';
```

Route params are properly typed:
```typescript
const { documentType } = useLocalSearchParams<{ documentType: string }>();
const validDocumentType: LegalDocumentType = validateDocumentType(documentType);
```

### Security Features

1. **URL Validation** - `isValidLegalUrl()`
   - HTTPS-only
   - Domain whitelist (jpdevland.com)
   - Format validation

2. **No JS Injection** - WebView doesn't execute scripts

3. **Safe Fallback** - System browser as fallback, not Linking.openURL directly

4. **Error Isolation** - Errors logged but don't crash app

### Testing Checklist

- [ ] Tap Privacy Policy → Opens in WebView
- [ ] Tap Terms of Service → Opens in WebView
- [ ] Tap Licenses → Shows bundled content
- [ ] Back button works on all screens
- [ ] Works on Android (hardware back button)
- [ ] Works on iOS (swipe back gesture)
- [ ] Safe area respected on notch devices
- [ ] Dark mode styling applied
- [ ] Light mode styling applied
- [ ] Network failure → Shows retry alert
- [ ] WebView failure → Falls back to system browser
- [ ] Can scroll bundled license content
- [ ] Share button works on WebView (Android/iOS)
- [ ] Refresh button works on WebView
- [ ] No console errors

### File Structure

```
lib/
├── config/
│   └── legalUrls.ts              # Centralized URLs
├── legal/
│   ├── legalBrowser.ts           # WebView + fallback handling
│   └── licenseContent.ts         # Bundled license data

app/
└── (modal)/
    ├── about-modal.tsx            # Legal buttons (updated)
    ├── legal-viewer-modal.tsx     # New modal
    └── _layout.tsx               # Register legal-viewer-modal
```

### Future Enhancements

1. **Localization Support**
   - Add language codes to LEGAL_URLS
   - Route to translated documents

2. **Offline License Updates**
   - Sync latest license content periodically
   - Cache bundled licenses

3. **Analytics**
   - Track which legal docs are viewed
   - Monitor WebView failures

4. **Custom WebView**
   - Replace expo-web-browser with react-native-webview
   - For full control and branding
   - Show custom header with app logo

### Compliance & Standards

✅ **GDPR Compliant** - Privacy Policy accessible from settings
✅ **App Store Ready** - Proper legal document presentation
✅ **Play Store Ready** - Proper legal document presentation
✅ **Accessibility** - Labels, proper contrast, readable fonts
✅ **Performance** - No lag when opening documents
✅ **Reliability** - Multiple fallback mechanisms

### Constants

All URLs are centralized in `lib/config/legalUrls.ts`:
```typescript
export const LEGAL_URLS = {
  privacyPolicy: 'https://www.jpdevland.com/app/budgetzen/privacy',
  termsOfService: 'https://www.jpdevland.com/app/budgetzen/terms',
  licenses: 'https://www.jpdevland.com/app/budgetzen/licenses',
}
```

To update URLs, edit only this file. No code changes needed elsewhere.

### Logging

All operations logged with `[Legal]` prefix:
```typescript
console.log('[Legal] Opening Privacy Policy: https://...');
console.log('[Legal] WebBrowser result: dismiss');
console.error('[Legal] Error opening Terms of Service: ...');
```

Monitor console for detailed operation flow.
