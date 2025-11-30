# 🎯 Toast System Quick Reference

**One-page guide for implementing toasts in BudgetZen**

---

## 🚀 TL;DR - Just Give Me the Code!

```tsx
import { useToast } from '@/context/Toast';

export default function MyComponent() {
  const toast = useToast();
  
  // Success (green, auto-dismiss 3s)
  toast.success('Operation completed!');
  
  // Error (red, auto-dismiss 3s)
  toast.error('Something went wrong');
  
  // Warning (amber, auto-dismiss 3s)
  toast.warning('Are you sure?');
  
  // Info (blue, auto-dismiss 3s)
  toast.info('Here is some information');
  
  return <Text>Component</Text>;
}
```

---

## 🎨 The 4 Toast Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `success` | ✓ Check | Green | Operation completed successfully |
| `error` | ! Alert | Red | Operation failed |
| `warning` | ⚠ Alert | Amber | Important notice, validation error |
| `info` | ℹ Info | Blue | Informational message, status |

---

## ⏱️ Auto-Dismiss Times

```tsx
// Default: 3000ms (3 seconds)
toast.success('Message');

// Custom: 2, 4, 5 seconds, etc.
toast.success('Quick message', 2000);
toast.error('Important error', 5000);
toast.warning('Pay attention', 3500);
```

---

## 📋 Common Patterns

### Form Submission
```tsx
const handleSubmit = async () => {
  try {
    await submitForm();
    toast.success('Form submitted!');
  } catch (error) {
    toast.error('Failed to submit form');
  }
};
```

### Validation
```tsx
if (!email) {
  toast.warning('Email is required');
  return;
}
```

### CRUD Operations
```tsx
// Create
toast.success('Record created!');

// Read (with info)
toast.info('Loading data...');

// Update
toast.success('Record updated!');

// Delete (keep Alert for confirmation)
Alert.alert('Confirm', 'Delete record?', [
  { text: 'Cancel' },
  { text: 'Delete', onPress: async () => {
      try {
        await deleteRecord();
        toast.success('Record deleted!');
      } catch (e) {
        toast.error('Failed to delete');
      }
    }
  }
]);
```

### Async Operations
```tsx
const handleSync = async () => {
  toast.info('Syncing data...');
  try {
    await syncData();
    toast.success('Data synced!');
  } catch (error) {
    toast.error('Sync failed');
  }
};
```

---

## ❌ What NOT To Do

```tsx
// ❌ DON'T: Use multiple toasts rapidly
toast.success('Message 1');
toast.success('Message 2');  // Will overlap
toast.success('Message 3');

// ❌ DON'T: Use for critical confirmations
toast.warning('Delete everything?');  // Should be Alert.alert()

// ❌ DON'T: Use long messages (exceeds toast space)
toast.success('This is a really long message that will wrap');

// ❌ DON'T: Use without proper error handling
fetch('/api/data').then(r => toast.success('Done'));

// ❌ DON'T: Use Alert.alert() for simple notifications
Alert.alert('Success', 'Data saved');  // Should be toast.success()
```

---

## ✅ What TO Do

```tsx
// ✅ DO: Keep messages concise
toast.success('Record saved!');

// ✅ DO: Use proper types
toast.error('Failed to save');    // Not success
toast.warning('Approaching limit'); // Not info

// ✅ DO: Handle async properly
try {
  await save();
  toast.success('Saved!');
} catch (e) {
  toast.error('Failed to save');
}

// ✅ DO: Space out multiple toasts
toast.info('Processing...');
setTimeout(() => {
  toast.success('Complete!');
}, 1000);

// ✅ DO: Keep Alert.alert() for confirmations
Alert.alert('Confirm', 'Delete all data?', [
  { text: 'Cancel' },
  { text: 'Delete', onPress: () => {
      deleteAllData();
      toast.success('Deleted!');
    }
  }
]);
```

---

## 🎯 Migration Checklist (Per File)

```bash
# Step 1: Add import at top
import { useToast } from '@/context/Toast';

# Step 2: Get hook in component
const toast = useToast();

# Step 3: Replace Alert.alert() calls
# Search for: Alert.alert('Success',
# Replace with: toast.success('

# Step 4: Test on device
# - Light mode: Check colors match theme
# - Dark mode: Check colors match theme
# - Auto-dismiss: Verify 3s timeout
# - Animation: Check smooth slide-up

# Step 5: Verify no console errors
# - No useToast hook errors
# - No undefined methods
# - No memory leaks
```

---

## 🔧 Setup Verification

✅ Check if `ToastProvider` is in `app/_layout.tsx`:

```tsx
// app/_layout.tsx - Should have this structure:
export default function RootLayout() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <OnboardingProvider>
          <ThemeProvider>
            <ToastProvider>  {/* ← Toast Provider here */}
              <InitialLayout />
            </ToastProvider>
          </ThemeProvider>
        </OnboardingProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
```

---

## 📱 Theme Support

Toasts automatically adapt to light/dark theme:

**Light Mode**
- Success: Light green background, dark green text
- Error: Light red background, dark red text
- Warning: Light amber background, dark amber text
- Info: Light blue background, dark blue text

**Dark Mode**
- Success: Semi-transparent green, light green text
- Error: Semi-transparent red, light red text
- Warning: Semi-transparent amber, light amber text
- Info: Semi-transparent blue, light blue text

---

## 🎬 Animation Behavior

```
[Bottom of screen - off-screen]
        ↓ (300ms slide-up + fade-in)
[Toast visible at bottom]
        ↓ (3000ms or custom duration)
[Auto-dismiss with slide-down + fade-out]
```

---

## 🆘 Troubleshooting

**Q: Toast not showing?**
- Verify `ToastProvider` is in `_layout.tsx`
- Check `useToast()` hook is imported correctly
- Ensure component is wrapped by provider

**Q: Toast showing but hidden behind other UI?**
- Toast has `zIndex: 9999`, highest in app
- Check if other modals have higher zIndex
- Consider modal dismissal order

**Q: Message text is cut off?**
- Keep messages 1-2 lines maximum
- Toast width is 90% of screen
- Limit message to ~60 characters

**Q: Toast not auto-dismissing?**
- Default duration is 3000ms
- Set custom duration: `toast.success('Msg', 2000)`
- Verify duration is in milliseconds

**Q: Wrong colors in dark/light mode?**
- Toast reads from theme context automatically
- Verify theme is being set correctly
- Check if theme context has both light/dark colors

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `context/Toast.tsx` | Toast state & provider |
| `components/Toast.tsx` | Toast UI component |
| `app/_layout.tsx` | App root with providers |

---

## 🔗 Related Docs

- **Full Guide**: `TOAST_IMPLEMENTATION_GUIDE.md`
- **Migration Checklist**: `TOAST_MIGRATION_CHECKLIST.md`
- **This Document**: `TOAST_QUICK_REFERENCE.md`

---

## 💡 Pro Tips

1. **Chain operations with delays**
   ```tsx
   toast.info('Processing...');
   setTimeout(() => toast.success('Done!'), 1500);
   ```

2. **Use longer duration for errors**
   ```tsx
   toast.error('Critical error occurred', 5000);
   ```

3. **Keep success messages brief**
   ```tsx
   toast.success('Saved!');  // ✓ Good
   toast.success('Your data has been successfully saved to the database!');  // ✗ Too long
   ```

4. **Combine with conditional logic**
   ```tsx
   if (success) {
     toast.success('Operation completed!');
   } else {
     toast.error('Operation failed');
   }
   ```

5. **Hide keyboard before showing toast**
   ```tsx
   Keyboard.dismiss();
   toast.success('Saved!');
   ```

---

## 🎓 Learning Path

1. **Beginner**: Use basic `toast.success()` and `toast.error()`
2. **Intermediate**: Use all 4 types appropriately
3. **Advanced**: Custom durations, chaining, async flows

---

**Last Updated**: December 2024  
**Status**: ✅ Ready to Use  
**Questions?** See TOAST_IMPLEMENTATION_GUIDE.md
