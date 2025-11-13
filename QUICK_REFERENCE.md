# BudgetZen Backend Integration - Quick Reference

## 🚀 Quick Start

### View Data (Display Screens)
```typescript
// 1. Import dependencies
import { useAuth } from '@/context/Auth';
import { readAccounts } from '@/lib/finance';

// 2. Get user from context
const { user, session } = useAuth();

// 3. Load data on mount
useEffect(() => {
  if (user && session) {
    loadAccounts();
  }
}, [user, session]);

// 4. Define load function
const loadAccounts = async () => {
  try {
    const data = await readAccounts();
    setAccounts(data || []);
  } catch (error) {
    Alert.alert('Error', 'Failed to load accounts');
  }
};
```

### Create Data (Add Modals)
```typescript
// 1. Validate inputs
if (!accountName || !initialBalance) {
  Alert.alert('Error', 'Please fill in all required fields');
  return;
}

// 2. Check authentication
if (!user) {
  Alert.alert('Error', 'User not authenticated');
  return;
}

// 3. Create data object with user_id
const accountData = {
  user_id: user.id,
  name: accountName,
  type: selectedType.name,
  initial_balance: parseFloat(initialBalance),
};

// 4. Save to database
try {
  await createAccount(accountData);
  Alert.alert('Success', 'Account created successfully!');
  router.back();
} catch (error) {
  Alert.alert('Error', 'Failed to save account');
}
```

### Delete Data
```typescript
const handleDeleteAccount = async (accountId) => {
  Alert.alert(
    'Confirm Delete',
    'Are you sure?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteAccount(accountId);
            setAccounts(accounts.filter(a => a.id !== accountId));
            Alert.alert('Success', 'Account deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
        style: 'destructive',
      },
    ]
  );
};
```

---

## 📊 Database Operations (lib/finance.js)

### Read Operations
```typescript
// Get all accounts for current user
const accounts = await readAccounts();
// Returns: [{ id, name, type, initial_balance, user_id, created_at }, ...]

// Get all categories for current user
const categories = await readCategories();
// Returns: [{ id, name, type, icon, color, user_id, created_at }, ...]

// Get all records (transactions) for current user
const records = await readRecords();
// Returns: [{ id, amount, type, transaction_date, account_id, category_id, 
//            accounts { name, type }, categories { name, icon, color }, user_id }, ...]

// Get all budgets for current user
const budgets = await readBudgets();
// Returns: [{ id, amount, start_date, end_date, category_id, 
//            categories { name, icon, type }, user_id }, ...]
```

### Create Operations
```typescript
// Create new account
await createAccount({
  user_id: user.id,
  name: 'My Bank',
  type: 'Bank Account',
  initial_balance: 5000,
});

// Create new category
await createCategory({
  user_id: user.id,
  name: 'Groceries',
  type: 'expense',
  icon: 'food',
  color: '#4ECDC4',
});

// Create new record (transaction)
await createRecord({
  user_id: user.id,
  account_id: 'uuid-123',
  category_id: 'uuid-456',
  amount: 50.00,
  type: 'expense',
  notes: 'Weekly groceries',
  transaction_date: '2024-01-15T10:30:00Z',
});

// Create new budget
await createBudget({
  user_id: user.id,
  category_id: 'uuid-456',
  amount: 500,
  start_date: '2024-01-01',
  end_date: '2024-01-31',
});
```

### Delete Operations
```typescript
await deleteAccount(accountId);
await deleteCategory(categoryId);
await deleteRecord(recordId);
await deleteBudget(budgetId);
```

---

## 🔐 Authentication

### useAuth Hook
```typescript
import { useAuth } from '@/context/Auth';

const MyComponent = () => {
  const { user, session, isLoading } = useAuth();
  
  // user: { id, email, ... }
  // session: JWT token info
  // isLoading: true while checking auth
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoginScreen />;
  
  return <AppContent />;
};
```

### Always Check Auth Before Using user.id
```typescript
if (!user) {
  Alert.alert('Error', 'User not authenticated');
  return;
}

const data = {
  user_id: user.id,  // ✅ Safe - user exists
  // ... other fields
};
```

---

## 🎯 Common Patterns

### Display Screen with Delete
```typescript
// 1. State
const [items, setItems] = useState([]);
const [expandedId, setExpandedId] = useState(null);
const [loading, setLoading] = useState(false);

// 2. Load on mount
useEffect(() => {
  if (user && session) loadItems();
}, [user, session]);

// 3. Load function
const loadItems = async () => {
  try {
    setLoading(true);
    const data = await readItems();
    setItems(data || []);
  } catch (error) {
    Alert.alert('Error', 'Failed to load');
  } finally {
    setLoading(false);
  }
};

// 4. Delete function
const handleDelete = async (id) => {
  Alert.alert('Delete?', '', [
    { text: 'Cancel' },
    {
      text: 'Delete',
      onPress: async () => {
        try {
          await deleteItem(id);
          setItems(items.filter(i => i.id !== id));
          Alert.alert('Success', 'Deleted');
        } catch (error) {
          Alert.alert('Error', 'Failed to delete');
        }
      },
      style: 'destructive',
    },
  ]);
};

// 5. Render
{loading ? (
  <ActivityIndicator />
) : (
  items.map(item => (
    <View key={item.id}>
      <Text>{item.name}</Text>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Text>Delete</Text>
      </TouchableOpacity>
    </View>
  ))
)}
```

### Add Modal with Create
```typescript
// 1. State
const [selectedCategory, setSelectedCategory] = useState(null);
const [categories, setCategories] = useState([]);
const [amount, setAmount] = useState('');
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);

// 2. Load categories on mount
useEffect(() => {
  loadCategories();
}, []);

const loadCategories = async () => {
  try {
    setLoading(true);
    const data = await readCategories();
    setCategories(data || []);
    if (data?.length) setSelectedCategory(data[0]);
  } catch (error) {
    Alert.alert('Error', 'Failed to load categories');
  } finally {
    setLoading(false);
  }
};

// 3. Handle save
const handleSave = async () => {
  if (!amount || !selectedCategory) {
    Alert.alert('Error', 'Fill all fields');
    return;
  }
  
  if (!user) {
    Alert.alert('Error', 'Not authenticated');
    return;
  }

  try {
    setSaving(true);
    const data = {
      user_id: user.id,
      category_id: selectedCategory.id,
      amount: parseFloat(amount),
      // ... other fields
    };
    await createBudget(data);
    Alert.alert('Success', 'Created!');
    router.back();
  } catch (error) {
    Alert.alert('Error', 'Failed to save');
  } finally {
    setSaving(false);
  }
};

// 4. Render
{loading ? (
  <ActivityIndicator />
) : (
  <>
    <Picker
      selectedValue={selectedCategory?.id}
      onValueChange={(id) => 
        setSelectedCategory(categories.find(c => c.id === id))
      }
    >
      {categories.map(c => (
        <Picker.Item key={c.id} label={c.name} value={c.id} />
      ))}
    </Picker>
    
    <TextInput
      value={amount}
      onChangeText={setAmount}
      placeholder="Amount"
      keyboardType="decimal-pad"
    />
    
    <Button
      title={saving ? 'Saving...' : 'Save'}
      onPress={handleSave}
      disabled={saving}
    />
  </>
)}
```

---

## 🛠️ Debugging Tips

### Check if Data Loaded
```typescript
// In React DevTools
// Look for state: accounts, categories, records, budgets
// Should be array, not empty initially, then populated after load
```

### Check User Authentication
```typescript
// In any component
const { user, session } = useAuth();
console.log('User:', user);
console.log('Session:', session);
// User should have id property
// Session should be valid JWT
```

### Check Database Operations
```typescript
// Open Supabase Dashboard
// Go to SQL Editor
// Run: SELECT * FROM accounts WHERE user_id = 'your-user-id'
// Should see your accounts

// Check RLS policies
// Go to Authentication → Policies
// Verify policies are enabled
```

### Check Network Errors
```typescript
// In try-catch
catch (error) {
  console.error('Full error:', error);
  console.error('Status:', error?.status);
  console.error('Message:', error?.message);
  // Network: status >= 500 or no network
  // Auth: status 401 or 403
  // Data: status 400 or validation errors
}
```

---

## 📋 Files at a Glance

| File | Purpose | Key Functions |
|------|---------|---|
| `app/(tabs)/accounts.tsx` | Show all accounts | readAccounts, deleteAccount |
| `app/(tabs)/categories.tsx` | Show all categories | readCategories, deleteCategory |
| `app/(tabs)/budgets.tsx` | Show all budgets | readBudgets, deleteBudget |
| `app/(tabs)/index.tsx` | Show all records | readRecords, deleteRecord |
| `app/add-account-modal.tsx` | Create account | createAccount |
| `app/add-category-modal.tsx` | Create category | createCategory |
| `app/add-budget-modal.tsx` | Create budget | readCategories, createBudget |
| `app/add-record-modal.tsx` | Create record | readAccounts, readCategories, createRecord |
| `lib/finance.js` | Database operations | All CRUD functions |
| `lib/supabase.ts` | Supabase client | Client initialization |
| `context/Auth.tsx` | Authentication | useAuth hook |

---

## ⚠️ Common Mistakes

### ❌ Don't forget user_id
```typescript
// WRONG
await createAccount({
  name: 'Bank',
  type: 'Bank Account',
  initial_balance: 1000,
});

// RIGHT
await createAccount({
  user_id: user.id,  // ← Required!
  name: 'Bank',
  type: 'Bank Account',
  initial_balance: 1000,
});
```

### ❌ Don't forget to check user auth
```typescript
// WRONG
const data = {
  user_id: user.id,  // Crashes if user is null!
};

// RIGHT
if (!user) {
  Alert.alert('Error', 'Not authenticated');
  return;
}
const data = {
  user_id: user.id,
};
```

### ❌ Don't forget validation
```typescript
// WRONG
await createAccount({
  user_id: user.id,
  name: accountName,  // Could be empty!
  type: selectedType.name,
  initial_balance: parseFloat(initialBalance),  // Could be NaN!
});

// RIGHT
if (!accountName || !initialBalance) {
  Alert.alert('Error', 'Fill all fields');
  return;
}
const data = {
  user_id: user.id,
  name: accountName,
  type: selectedType.name,
  initial_balance: parseFloat(initialBalance),
};
```

### ❌ Don't forget error handling
```typescript
// WRONG
const data = await readAccounts();
setAccounts(data);

// RIGHT
try {
  const data = await readAccounts();
  setAccounts(data || []);
} catch (error) {
  Alert.alert('Error', 'Failed to load');
}
```

---

## ✅ Verification Checklist

- [ ] Can create accounts ✓
- [ ] Can create categories ✓
- [ ] Can create budgets ✓
- [ ] Can create records ✓
- [ ] Can delete items ✓
- [ ] Can see own data only ✓
- [ ] Cannot see other users' data ✓
- [ ] Error messages show on failures ✓
- [ ] Loading states visible ✓
- [ ] Success messages show ✓

---

## 🎓 Learning Path

1. **Understand Data Model** - Read SUPABASE_INTEGRATION.md
2. **Review Display Screens** - Check accounts.tsx, categories.tsx
3. **Review Add Modals** - Check add-account-modal.tsx, add-category-modal.tsx
4. **Understand Finance Module** - Review lib/finance.js functions
5. **Study Error Handling** - See try-catch patterns in all files
6. **Review Auth Flow** - Check useAuth usage in context/Auth.tsx
7. **Test End-to-End** - Create account → Create category → Create record → Delete

---

## 📞 Help & Support

**Issue**: "user is undefined"
→ Make sure useAuth hook is called and checked before use

**Issue**: "RLS policy violation"
→ Make sure user_id is included in all CREATE operations

**Issue**: "Data loads but wrong user sees it"
→ RLS isn't working, verify policies in Supabase dashboard

**Issue**: "Delete works on UI but not in database"
→ Check error isn't being silently caught, add console.log

**Issue**: "Modal doesn't close after save"
→ Check router.back() is being called in handleSave

---

## 🚀 Ready to Go!

All screens and modals are fully connected to Supabase. Start building features!

For detailed docs, see:
- `BACKEND_INTEGRATION_COMPLETE.md` - Full guide
- `SUPABASE_INTEGRATION.md` - Integration details
- `BACKEND_MIGRATION_SUMMARY.md` - What was changed
