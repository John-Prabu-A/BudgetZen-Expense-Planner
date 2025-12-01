# Empty State & Error Handling - Action Checklist

**Quick Reference for Implementation**

---

## 🚀 START HERE

### Step 1: Understand the Pattern (5 min)

```typescript
// PATTERN: Import → Check → Return or Render

import { EmptyStateView } from '@/components/EmptyStateView';

export default function MyScreen() {
  const [data, setData] = useState([]);
  
  // Loading
  if (loading) {
    return <ActivityIndicator />;
  }
  
  // Empty
  if (!data || data.length === 0) {
    return (
      <EmptyStateView
        icon="icon-name"
        title="No Data"
        subtitle="Explanation and guidance"
        actionText="Create"
        onAction={() => router.push('/path')}
      />
    );
  }
  
  // Content
  return <YourContent data={data} />;
}
```

---

## 🎯 Priority Implementation Order

### PHASE 1: Main Screens (2-3 hours)

| Screen | File | Status | Action |
|--------|------|--------|--------|
| Analysis | `app/(tabs)/analysis.tsx` | ❌ | Add 4 empty checks |
| Budgets | `app/(tabs)/budgets.tsx` | ? | Inspect + implement |
| Accounts | `app/(tabs)/accounts.tsx` | ? | Inspect + implement |
| Categories | `app/(tabs)/categories.tsx` | ? | Inspect + implement |

### PHASE 2: Error Handling (2 hours)

| Feature | Files | Action |
|---------|-------|--------|
| Delete Ops | All `delete` methods | Add confirm dialogs |
| Calculations | Math logic | Add zero/NaN checks |
| Filters | Filter functions | Add empty result check |
| Exports | `export-records-modal.tsx` | Verify ✅ |

### PHASE 3: Edge Cases (2 hours)

| Case | Files | Action |
|------|-------|--------|
| Network Errors | All data loading | Add retry button |
| Permission Errors | Server responses | Show helpful message |
| Extreme Values | Calculations | Handle gracefully |
| Corrupted Data | Display logic | Show warning |

---

## ✅ Screen Implementation Checklist

### Analysis Screen (`analysis.tsx`)

**Tasks**:
- [ ] Line 1: Add `import { EmptyStateView } from '@/components/EmptyStateView';`
- [ ] Find render return statement
- [ ] Add: `if (!records || records.length === 0) { return <EmptyStateView ... /> }`
- [ ] Add: `if (currentMonthData.records.length === 0) { return <EmptyStateView ... /> }`
- [ ] Check chart rendering (prevent errors with no data)
- [ ] Test: Delete all records → empty state shows
- [ ] Test: Change month with no data → empty state shows
- [ ] Test: Add record → content shows

**Time**: 30 min

---

### Budgets Screen (`budgets.tsx`)

**Tasks**:
- [ ] Add EmptyStateView import
- [ ] Add: `if (!budgets || budgets.length === 0) { return <EmptyStateView ... /> }`
- [ ] Add: `if (!categories || categories.length === 0) { return <EmptyStateView message="Need categories first" /> }`
- [ ] Check calculations (budget progress %)
- [ ] Test: No budgets → empty state
- [ ] Test: No categories → message about categories
- [ ] Test: Add budget → list updates

**Time**: 25 min

---

### Accounts Screen (`accounts.tsx`)

**Tasks**:
- [ ] Add EmptyStateView import
- [ ] Add: `if (!accounts || accounts.length === 0) { return <EmptyStateView ... /> }`
- [ ] Add delete confirm dialog
- [ ] Check total calculation (sum with no accounts)
- [ ] Test: No accounts → empty state
- [ ] Test: Delete account → confirmation shows
- [ ] Test: After delete → content updates or empty shows

**Time**: 25 min

---

### Categories Screen (`categories.tsx`)

**Tasks**:
- [ ] Add EmptyStateView import
- [ ] Add: `if (!categories || categories.length === 0) { return <EmptyStateView ... /> }`
- [ ] Add delete confirm dialog
- [ ] Warn if deleting category with records
- [ ] Test: No categories → empty state
- [ ] Test: Delete → confirmation + warning
- [ ] Test: After delete → updates

**Time**: 25 min

---

## 🧪 Testing Workflow

For each screen/feature:

```
1. Delete ALL DATA
   └─ Does empty state show? YES/NO

2. Check MESSAGES
   └─ Are they clear? YES/NO

3. Click BUTTONS
   └─ Do they work? YES/NO

4. Add DATA BACK
   └─ Does content show? YES/NO

5. Test FILTERS
   └─ No results = empty message? YES/NO

6. Test OPERATIONS
   └─ Delete shows confirm? YES/NO

7. Test ERRORS
   └─ Network error handled? YES/NO

8. Test CALCULATIONS
   └─ No crashes with zero? YES/NO
```

---

## 📝 Copy-Paste Ready Code

### Empty State for Main Screen

```typescript
import { EmptyStateView } from '@/components/EmptyStateView';

// In your render:
if (!data || data.length === 0) {
  return (
    <EmptyStateView
      icon="book-open-blank-variant"
      title="No Data Yet"
      subtitle="Create your first item to get started."
      actionText="Create Item"
      onAction={() => router.push('/(modal)/add-item-modal')}
    />
  );
}
```

### Delete Confirmation

```typescript
const handleDelete = (item) => {
  Alert.alert(
    'Delete ' + item.name + '?',
    'This action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          // Refresh data
          loadItems();
          toast.success('Deleted successfully');
        }
      }
    ]
  );
};
```

### Safe Calculation

```typescript
// WRONG:
const percentage = (spent / budget) * 100;  // Can be NaN if budget=0

// RIGHT:
const percentage = budget > 0 ? (spent / budget) * 100 : 0;

// Or for display:
<Text>{budget > 0 ? `${percentage}%` : 'No budget'}</Text>
```

### Filter with Empty State

```typescript
const filtered = data.filter(item => matches(item));

if (filtered.length === 0) {
  return (
    <EmptyStateView
      icon="magnify"
      title="No Matching Items"
      subtitle="Try adjusting your filters."
    />
  );
}
```

---

## 🎯 ICON REFERENCE

| Scenario | Icon | Alternative |
|----------|------|-------------|
| No Records | book-open-blank-variant | document-outline |
| No Analysis | chart-box-outline | graph-outline |
| No Budgets | wallet-outline | credit-card |
| No Accounts | bank-outline | account-balance |
| No Categories | tag-multiple-outline | folder-outline |
| No Results | magnify | search |
| Error | alert-circle | exclamation |
| Network | wifi-off | cloud-off-outline |
| Permission | lock-outline | security |

---

## 📋 Daily Checklist

### Morning
- [ ] Review implementation plan
- [ ] Choose first screen to implement

### During Day
- [ ] Implement 1-2 screens
- [ ] Test thoroughly
- [ ] Commit changes

### Evening
- [ ] Review code
- [ ] Update checklist
- [ ] Plan next screen

### End of Week
- [ ] All screens implemented
- [ ] All tests passed
- [ ] Ready for QA

---

## 🚨 Common Issues & Fixes

### Issue: "EmptyStateView not found"
**Fix**: Make sure path is `@/components/EmptyStateView` (check case sensitivity)

### Issue: "Empty state shows but shouldn't"
**Fix**: Check `if (!data || data.length === 0)` - maybe data exists

### Issue: "Button doesn't navigate"
**Fix**: Check path is correct: `router.push('/(modal)/correct-path')`

### Issue: "Text cuts off"
**Fix**: Add `numberOfLines={2}` to Text components, or reduce fontSize

### Issue: "Colors don't match"
**Fix**: Use `colors` from `useTheme()` hook

### Issue: "Delete doesn't refresh"
**Fix**: Call `loadData()` after delete, before closing dialog

---

## ✨ Final Quality Checklist

Before considering complete:

- [ ] All data-dependent screens checked
- [ ] All screens handle zero data
- [ ] All modals handle missing prerequisites
- [ ] All operations have confirmations
- [ ] All errors show user-friendly messages
- [ ] No crashes with empty/invalid data
- [ ] All calculations safe (no division by zero)
- [ ] All messages professional & helpful
- [ ] Theme colors correct (dark/light)
- [ ] Text doesn't overflow
- [ ] Buttons properly styled
- [ ] Icons appropriate
- [ ] Tested on multiple devices
- [ ] Ready for production

---

## 📞 Quick Help

**Need icon name?** → Check ICON REFERENCE above

**Need code example?** → Check COPY-PASTE READY CODE above

**Need colors?** → Use `const { colors } = useTheme();`

**Need routing?** → Use `const router = useRouter();` then `router.push(path)`

**Need toast?** → Use `const { success, error } = useToast();`

**Need to add space?** → Use `gap: 16` in StyleSheet

**Need loading spinner?** → Use `<ActivityIndicator size="large" />`

---

## 🎯 Success = App Never Crashes on Empty Data ✅

When this is done, the app will be:
- ✅ Professional
- ✅ Robust
- ✅ User-friendly  
- ✅ Production-ready
