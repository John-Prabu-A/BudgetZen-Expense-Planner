# 🎯 Toast Migration Checklist

Complete migration of all `Alert.alert()` calls to professional toast notifications.

---

## 📊 Migration Status

**Total Files to Update**: 15+  
**Total Alert.alert() Calls to Migrate**: 30+  
**Priority Levels**: Critical, High, Medium

---

## 🔴 CRITICAL PRIORITY (Modals - Frequent User Interactions)

### 1. ✅ add-account-modal.tsx
**Location**: `app/(modal)/add-account-modal.tsx`  
**Calls to Replace**: 2
```tsx
// Line ~91: Error on account save
Alert.alert('Error', 'Failed to create/update account')
→ toast.error('Failed to create/update account')

// Line ~85: Success on account save  
Alert.alert('Success', 'Account added')
→ toast.success('Account added successfully!')
```
**Status**: ⏳ Pending

---

### 2. ✅ add-budget-modal.tsx
**Location**: `app/(modal)/add-budget-modal.tsx`  
**Calls to Replace**: 2
```tsx
// Line ~102: Success on budget creation
Alert.alert('Success', 'Budget created')
→ toast.success('Budget created successfully!')

// Line ~95: Error on budget creation  
Alert.alert('Error', 'Failed to create budget')
→ toast.error('Failed to create budget')
```
**Status**: ⏳ Pending

---

### 3. ✅ add-record-modal.tsx
**Location**: `app/(modal)/add-record-modal.tsx`  
**Calls to Replace**: 2
```tsx
// Success on record save
Alert.alert('Success', 'Record saved')
→ toast.success('Record saved successfully!')

// Error on record save
Alert.alert('Error', 'Failed to save record')
→ toast.error('Failed to save record')
```
**Status**: ⏳ Pending

---

### 4. ✅ security-modal.tsx
**Location**: `app/(modal)/security-modal.tsx`  
**Status**: ⏳ Partially Migrated (useToast already imported but still has Alert.alert() calls)
**Calls to Replace**: 3+
```tsx
// Already has: const toast = useToast(); (line 22)

// Password confirmation dialogs - KEEP Alert.alert() for critical confirmations
Alert.alert('Confirm', 'Are you sure?')
→ KEEP Alert.alert() for critical password changes

// Success messages - MIGRATE
Alert.alert('Success', 'Password updated')
→ toast.success('Password updated successfully!')

// Error messages - MIGRATE
Alert.alert('Error', 'Failed to update password')
→ toast.error('Failed to update password')
```
**Status**: ⏳ Partially Migrated - Needs Completion

---

### 5. ✅ help-modal.tsx
**Location**: `app/(modal)/help-modal.tsx`  
**Calls to Replace**: 2
```tsx
// Line ~42: Success on message send
Alert.alert('Success', 'Message sent')
→ toast.success('Help request sent successfully!')

// Line ~68: Error on message send
Alert.alert('Error', 'Failed to send message')
→ toast.error('Failed to send help request')
```
**Status**: ⏳ Pending

---

### 6. ✅ feedback-modal.tsx
**Location**: `app/(modal)/feedback-modal.tsx`  
**Calls to Replace**: 2
```tsx
// Line ~18: Success feedback submit
Alert.alert('Success', 'Feedback sent')
→ toast.success('Thank you for your feedback!')

// Error feedback submit
Alert.alert('Error', 'Failed to submit feedback')
→ toast.error('Failed to submit feedback')
```
**Status**: ⏳ Pending

---

### 7. ✅ notifications-modal.tsx
**Location**: `app/(modal)/notifications-modal.tsx`  
**Calls to Replace**: 1+
```tsx
// Generic alerts in this modal
Alert.alert('Info', 'No notifications')
→ toast.info('No new notifications')
```
**Status**: ⏳ Pending

---

### 8. ✅ delete-reset-modal.tsx
**Location**: `app/(modal)/delete-reset-modal.tsx`  
**Calls to Replace**: 3
```tsx
// KEEP ALERTS for confirmations (critical danger operations):
Alert.alert('Confirm', 'Delete all records?')  // KEEP
Alert.alert('Confirm', 'Reset app?')  // KEEP

// MIGRATE success/error messages:
Alert.alert('Success', 'Records deleted')
→ toast.success('All records deleted successfully!')

Alert.alert('Error', 'Failed to delete')
→ toast.error('Failed to delete records')
```
**Status**: ⏳ Pending - Selective Migration

---

## 🟡 HIGH PRIORITY (Frequently Used Tabs)

### 9. ✅ app/(tabs)/index.tsx (Records)
**Location**: `app/(tabs)/index.tsx`  
**Calls to Replace**: 2-3
```tsx
// Line ~203: Delete confirmation - KEEP Alert.alert()
Alert.alert('Confirm', 'Delete this record?')  // KEEP

// Success messages - MIGRATE
Alert.alert('Success', 'Record deleted')
→ toast.success('Record deleted successfully!')

// Error messages - MIGRATE  
Alert.alert('Error', 'Failed to delete')
→ toast.error('Failed to delete record')
```
**Status**: ⏳ Pending

---

### 10. ✅ app/(tabs)/budgets.tsx
**Location**: `app/(tabs)/budgets.tsx`  
**Calls to Replace**: 2+
```tsx
// Success messages
Alert.alert('Success', 'Budget updated')
→ toast.success('Budget updated!')

// Error messages
Alert.alert('Error', 'Failed to update budget')
→ toast.error('Failed to update budget')

// Warning messages
Alert.alert('Warning', 'You exceeded budget')
→ toast.warning('You have exceeded your budget limit')
```
**Status**: ⏳ Pending

---

### 11. ✅ app/(tabs)/categories.tsx
**Location**: `app/(tabs)/categories.tsx`  
**Calls to Replace**: 2
```tsx
// Line ~62: Delete confirmation - KEEP Alert.alert()
Alert.alert('Confirm', 'Delete this category?')  // KEEP

// Success - MIGRATE
Alert.alert('Success', 'Category deleted')
→ toast.success('Category deleted successfully!')

// Error - MIGRATE
Alert.alert('Error', 'Failed to delete')
→ toast.error('Failed to delete category')
```
**Status**: ⏳ Pending

---

## 🟠 MEDIUM PRIORITY (Setup & Auth Screens)

### 12. ✅ app/passcode-setup.tsx
**Location**: `app/passcode-setup.tsx`  
**Calls to Replace**: 3
```tsx
// Line ~46: Success on passcode set
Alert.alert('Success', 'Passcode set')
→ toast.success('Passcode protection enabled!')

// Line ~73+: Error messages
Alert.alert('Error', 'Failed to set passcode')
→ toast.error('Failed to enable passcode protection')

// Confirmation - KEEP
Alert.alert('Confirm', 'Confirm passcode?')  // KEEP or toast.warning()
```
**Status**: ⏳ Pending

---

### 13. ✅ app/(auth)/login.tsx
**Location**: `app/(auth)/login.tsx`  
**Calls to Replace**: 1+
```tsx
// Error handling
Alert.alert('Error', 'Login failed')
→ toast.error('Login failed. Please try again.')

// Info messages
Alert.alert('Info', 'Checking credentials...')
→ toast.info('Verifying credentials...')
```
**Status**: ⏳ Pending

---

### 14. ✅ components/PasswordLockScreen.tsx
**Location**: `components/PasswordLockScreen.tsx`  
**Calls to Replace**: 2
```tsx
// Line ~57: Error on unlock
Alert.alert('Error', 'Invalid password')
→ toast.error('Invalid password. Try again.')

// Line ~103: Error too many attempts
Alert.alert('Error', 'Too many attempts')
→ toast.error('Too many failed attempts. App locked.')
```
**Status**: ⏳ Pending

---

### 15. ✅ components/UnifiedLockScreen.tsx
**Location**: `components/UnifiedLockScreen.tsx`  
**Calls to Replace**: 2
```tsx
// Error on authentication
Alert.alert('Error', 'Authentication failed')
→ toast.error('Authentication failed. Try again.')

// Too many attempts
Alert.alert('Error', 'Too many attempts')
→ toast.error('Too many failed attempts.')
```
**Status**: ⏳ Pending

---

## 🔵 MIGRATION RULES

### ✅ MIGRATE to Toast (These are notifications, not critical)
```
✅ Success messages
✅ Error messages  
✅ Warning messages
✅ Info/status messages
✅ Processing notifications
✅ Validation feedback
✅ Confirmation prompts (low-risk actions)
```

### ❌ KEEP as Alert.alert() (These require user decision)
```
❌ Critical confirmations:
   - Delete all data
   - Reset entire app
   - Clear all records
   - Remove account
   
❌ Critical error dialogs requiring acknowledgment:
   - Failed login attempts (security)
   - Suspicious activity
   - Password incorrect (after tries)
   
❌ Multi-step confirmations:
   - "Are you sure?" with "Cancel" / "Delete" buttons
   - Confirmations with explicit cancel option
```

---

## 📝 Migration Template

For each file, follow this pattern:

### Before Update
```tsx
import { Alert } from 'react-native';

export default function SomeModal() {
  const handleSave = async () => {
    try {
      await save();
      Alert.alert('Success', 'Data saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save');
    }
  };
}
```

### After Update
```tsx
import { useToast } from '@/context/Toast';

export default function SomeModal() {
  const toast = useToast();
  
  const handleSave = async () => {
    try {
      await save();
      toast.success('Data saved successfully!');
    } catch (error) {
      toast.error('Failed to save');
    }
  };
}
```

---

## 🧪 Testing Checklist (Per File)

For each migrated file:
- [ ] Import `useToast` hook
- [ ] Call `const toast = useToast()`
- [ ] Replace all simple message alerts with toast
- [ ] Keep confirmation alerts that require buttons
- [ ] Test success toast appears and auto-dismisses
- [ ] Test error toast appears and auto-dismisses
- [ ] Test warning toast appears and auto-dismisses
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Test on physical device
- [ ] Verify no console errors

---

## 📊 Progress Tracking

```
Files Completed: 0/15
Alerts Migrated: 0/30+
Estimated Time: 30-45 minutes

Phase 1 (Critical): 0/8 files
Phase 2 (High): 0/3 files
Phase 3 (Medium): 0/4 files
```

---

## 🚀 Next Steps

1. **Start with Critical Priority** (highest user impact)
   - Begin with `add-account-modal.tsx`
   - Progress through security-related modals
   
2. **Move to High Priority** (frequently used features)
   - Update main tab screens
   - Test thoroughly with real data
   
3. **Complete Medium Priority** (setup flows)
   - Update auth and setup screens
   - Final polish and testing

4. **Quality Assurance**
   - Test all toast types in both themes
   - Verify auto-dismiss timing
   - Check animation smoothness
   - Validate on various device sizes

---

## 💡 Tips for Migration

1. **Preserve functionality**: Keep confirmations that require user choice
2. **Improve UX**: Use appropriate toast types (success ≠ warning)
3. **Keep it short**: Toast messages should be 1-2 lines max
4. **Test incrementally**: Update one file, verify, then continue
5. **Watch the animation**: Toasts auto-dismiss after 3 seconds (configurable)
6. **Use proper durations**: Errors get more time than success messages

---

## 📞 Questions?

Refer to `TOAST_IMPLEMENTATION_GUIDE.md` for detailed usage examples and best practices.

---

**Created**: December 2024  
**Last Updated**: December 2024  
**Maintained By**: BudgetZen Development Team
