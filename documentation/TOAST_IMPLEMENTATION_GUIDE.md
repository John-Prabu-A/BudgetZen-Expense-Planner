# 🎯 Professional Toast Notification System

## Overview

BudgetZen uses a **premium, theme-responsive toast notification system** that replaces native `Alert.alert()` with elegant, auto-dismissing bottom notifications. The system is fully integrated and ready for production use.

---

## ✨ Features

- **Auto-dismiss**: Toasts automatically disappear after configurable duration (default 3 seconds)
- **Theme-responsive**: Automatically adapts colors to light/dark mode
- **Smooth animations**: Slide-in and fade-out animations for premium feel
- **4 Toast Types**: Success, Error, Warning, Info
- **No blocking**: Non-intrusive notifications that don't block user interaction
- **Position**: Fixed at bottom of screen, above all other content
- **Global styling**: Consistent appearance across the entire app

---

## 🎨 Toast Types & Styling

### Success Toast
```typescript
toast.success('Record saved successfully!');
```
- **Icon**: ✓ Check Circle
- **Light Theme**: Green background (#ecfdf5) with dark green text
- **Dark Theme**: Semi-transparent green with light green text
- **Border**: Light green in light mode, transparent green in dark mode

### Error Toast
```typescript
toast.error('Failed to save record');
```
- **Icon**: ! Alert Circle
- **Light Theme**: Red background (#fef2f2) with dark red text
- **Dark Theme**: Semi-transparent red with light red text
- **Border**: Light red in light mode, transparent red in dark mode

### Warning Toast
```typescript
toast.warning('Budget limit approaching');
```
- **Icon**: ⚠ Alert Triangle
- **Light Theme**: Amber background (#fffbeb) with dark amber text
- **Dark Theme**: Semi-transparent amber with light amber text
- **Border**: Light amber in light mode, transparent amber in dark mode

### Info Toast
```typescript
toast.info('Processing your request...');
```
- **Icon**: ℹ Information
- **Light Theme**: Blue background (#eff6ff) with dark blue text
- **Dark Theme**: Semi-transparent blue with light blue text
- **Border**: Light blue in light mode, transparent blue in dark mode

---

## 📚 Usage Guide

### Basic Setup (Already Done)

The app root (_layout.tsx) should wrap the app with ToastProvider:

```tsx
import { ToastProvider } from '@/context/Toast';

export default function RootLayout() {
  return (
    <ToastProvider>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

### Using Toast in Components

#### 1. Import and Use Hook
```tsx
import { useToast } from '@/context/Toast';

export default function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Data saved successfully!');
    } catch (error) {
      toast.error('Failed to save data');
    }
  };

  return <button onPress={handleSave}>Save</button>;
}
```

#### 2. All Methods Available
```tsx
const toast = useToast();

// Show specific toast type
toast.success('Success message');
toast.error('Error message');
toast.warning('Warning message');
toast.info('Info message');

// Show generic toast with custom duration (ms)
toast.showToast('Custom message', 'success', 2000);

// Manually dismiss (optional)
const toastId = toast.success('Message');
toast.dismissToast(toastId);
```

---

## 🔄 Migration from Alert.alert()

### Before (Old Way)
```tsx
import { Alert } from 'react-native';

try {
  await saveRecord();
  Alert.alert('Success', 'Record saved successfully!');
} catch (error) {
  Alert.alert('Error', 'Failed to save record');
}
```

### After (New Way)
```tsx
import { useToast } from '@/context/Toast';

const toast = useToast();

try {
  await saveRecord();
  toast.success('Record saved successfully!');
} catch (error) {
  toast.error('Failed to save record');
}
```

---

## 🎯 Common Scenarios

### Form Validation
```tsx
const handleSubmit = async () => {
  if (!email.trim()) {
    toast.warning('Email is required');
    return;
  }
  
  if (password.length < 6) {
    toast.warning('Password must be at least 6 characters');
    return;
  }

  try {
    await submitForm();
    toast.success('Form submitted successfully!');
  } catch (error) {
    toast.error('Failed to submit form');
  }
};
```

### CRUD Operations
```tsx
// Create
const handleCreate = async () => {
  try {
    await createRecord(data);
    toast.success('Record created successfully!');
  } catch (error) {
    toast.error('Failed to create record');
  }
};

// Read (with info)
const handleLoad = async () => {
  toast.info('Loading data...');
  try {
    const data = await fetchData();
    toast.success('Data loaded');
  } catch (error) {
    toast.error('Failed to load data');
  }
};

// Update
const handleUpdate = async () => {
  try {
    await updateRecord(id, data);
    toast.success('Record updated successfully!');
  } catch (error) {
    toast.error('Failed to update record');
  }
};

// Delete
const handleDelete = async () => {
  try {
    await deleteRecord(id);
    toast.success('Record deleted successfully!');
  } catch (error) {
    toast.error('Failed to delete record');
  }
};
```

### Security Operations
```tsx
// Password setup
const handlePasswordSetup = async () => {
  try {
    await setPassword(password);
    toast.success('Password protection enabled!');
  } catch (error) {
    toast.error('Failed to enable password protection');
  }
};

// Passcode verification
const handlePasscodeVerify = async () => {
  try {
    const isValid = await verifyPasscode(passcode);
    if (isValid) {
      toast.success('Passcode verified!');
    } else {
      toast.error('Incorrect passcode');
    }
  } catch (error) {
    toast.error('Verification failed');
  }
};
```

### Network Operations
```tsx
// Upload
const handleUpload = async () => {
  try {
    await uploadFile(file);
    toast.success('File uploaded successfully!');
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      toast.error('Network error. Check your connection.');
    } else {
      toast.error('Upload failed');
    }
  }
};

// Sync
const handleSync = async () => {
  toast.info('Syncing data...');
  try {
    await syncData();
    toast.success('Data synced successfully!');
  } catch (error) {
    toast.error('Sync failed');
  }
};
```

---

## ⏱️ Duration Settings

### Default Duration: 3000ms (3 seconds)
```tsx
toast.success('Message'); // Auto-dismisses after 3 seconds
```

### Custom Duration
```tsx
// 2 seconds
toast.success('Quick message', 2000);

// 5 seconds (longer for important messages)
toast.error('Important error', 5000);

// Instant (mostly for technical messaging)
toast.info('Processing...', 1000);
```

### Duration Guidelines
- **Success**: 2000-3000ms (brief confirmation)
- **Error**: 4000-5000ms (more time to read)
- **Warning**: 3000-4000ms (important but not critical)
- **Info**: 2000-3000ms (informational only)

---

## 🎨 Customization

### Add New Toast Type (Optional Enhancement)
If you need a custom toast type, extend the types in `components/Toast.tsx`:

```tsx
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'custom';

// Add to getToastConfig function:
custom: {
  icon: 'star',
  lightBg: '#fef3c7',
  darkBg: 'rgba(251, 191, 36, 0.15)',
  lightText: '#78350f',
  darkText: '#fde047',
  lightBorder: '#fef08a',
  darkBorder: 'rgba(251, 191, 36, 0.3)',
  iconColor: '#eab308',
},
```

Then add to Toast context:
```tsx
const custom = useCallback(
  (message: string, duration?: number) =>
    showToast(message, 'custom', duration),
  [showToast]
);
```

---

## 📋 Integration Checklist

### Files to Update
- [ ] `app/(modal)/add-account-modal.tsx`
- [ ] `app/(modal)/add-budget-modal.tsx`
- [ ] `app/(modal)/add-record-modal.tsx`
- [ ] `app/(modal)/security-modal.tsx`
- [ ] `app/(modal)/help-modal.tsx`
- [ ] `app/(modal)/feedback-modal.tsx`
- [ ] `app/(modal)/notifications-modal.tsx`
- [ ] `app/(modal)/delete-reset-modal.tsx`
- [ ] `app/(tabs)/index.tsx` (Records)
- [ ] `app/(tabs)/budgets.tsx`
- [ ] `app/(tabs)/categories.tsx`
- [ ] `app/passcode-setup.tsx`
- [ ] `app/(onboarding)/tutorial.tsx`
- [ ] Other feature screens

### Per File
1. Add import: `import { useToast } from '@/context/Toast';`
2. Get hook: `const toast = useToast();`
3. Replace all `Alert.alert()` calls with appropriate `toast.*()` calls

---

## 🚀 Best Practices

### ✅ DO
- Use specific toast types (success, error, warning, info)
- Keep messages short and concise (1-2 lines max)
- Use appropriate duration based on message importance
- Show toast after async operations complete
- Show warning for validation errors
- Use info for process status updates

### ❌ DON'T
- Use Alert.alert() for regular notifications
- Show multiple toasts at once (they stack)
- Use overly long messages
- Show toast in rapid succession (space them out)
- Mix toast styles inconsistently
- Use toast for critical confirmations (use modals instead)

---

## 🔍 Examples by Feature

### Records Management
```tsx
// Success
toast.success('Record added successfully!');
toast.success('Record updated!');
toast.success('Record deleted successfully!');

// Error
toast.error('Failed to save record');
toast.error('Failed to delete record');

// Validation
toast.warning('Please enter an amount');
toast.warning('Invalid date selected');
```

### Budget Management
```tsx
// Success
toast.success('Budget created!');
toast.success('Budget updated!');

// Warning
toast.warning('You have exceeded your budget');
toast.warning('Budget limit approaching');

// Info
toast.info('Analyzing spending...');
```

### Security
```tsx
// Success
toast.success('Password protection enabled!');
toast.success('Passcode verified!');

// Error
toast.error('Incorrect password');
toast.error('Incorrect passcode');

// Warning
toast.warning('Too many failed attempts');
```

### Settings
```tsx
// Success
toast.success('Settings saved!');
toast.success('Theme changed!');

// Info
toast.info('Cache clearing...');
```

---

## 🎬 Animation Details

### Slide-In Animation
- **Duration**: 300ms
- **Direction**: From bottom (translate Y: 300 → 0)
- **Easing**: Smooth timing function

### Fade-In Animation
- **Duration**: 300ms
- **Opacity**: 0 → 1

### Auto-Dismiss Animation
- **Duration**: 300ms
- **Delay**: Configurable (default 3000ms)
- **Direction**: Back to bottom + fade out

---

## 📱 Responsive Behavior

- **Toast Width**: 90% of screen width (max: screen width - 32px padding)
- **Position**: Fixed bottom with 24px padding
- **Z-Index**: 9999 (always on top)
- **Safe Area**: Respects safe area insets on notched devices

---

## 🧪 Testing Toast Notifications

### Test All Types
```tsx
// Button that triggers all toasts
<TouchableOpacity onPress={() => {
  toast.success('Success message');
  setTimeout(() => toast.error('Error message'), 1000);
  setTimeout(() => toast.warning('Warning message'), 2000);
  setTimeout(() => toast.info('Info message'), 3000);
}}>
  <Text>Test Toasts</Text>
</TouchableOpacity>
```

### Test Durations
```tsx
toast.success('2 second toast', 2000);
toast.success('5 second toast', 5000);
```

### Test in Both Themes
- Light mode
- Dark mode
- System mode with device theme changes

---

## 🔗 Related Files

- `components/Toast.tsx` - Toast component implementation
- `context/Toast.tsx` - Toast context and provider
- `app/_layout.tsx` - Root layout with ToastProvider

---

## 📞 Support

For issues or enhancements to the toast system:
1. Check existing implementation in Toast.tsx
2. Update getToastConfig() for style changes
3. Modify animation values in Toast component for animation changes
4. Add new toast types by extending ToastType union type

---

**Last Updated**: December 2024  
**Status**: ✅ Production Ready  
**Maintained By**: BudgetZen Development Team
