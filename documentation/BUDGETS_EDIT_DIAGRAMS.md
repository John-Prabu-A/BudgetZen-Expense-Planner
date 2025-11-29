# Budget Edit Feature - Architecture & Flow Diagrams

## 🏗️ Architecture Overview

### Component Hierarchy

```
BudgetScreen (Main Tab)
├── Budget List
│   └── BudgetCard (Expandable)
│       ├── Header Section (Budget Name, Amount)
│       ├── Progress Bar
│       ├── Expanded Content (when tapped)
│       │   ├── Stats Grid
│       │   ├── Warning Box (if over budget)
│       │   └── Action Buttons
│       │       ├── Edit Button ← NEW
│       │       │   └── Calls handleEditBudget()
│       │       └── Delete Button
│       └── handleEditBudget(budget)
│           └── router.push with budget params
│               └── add-budget-modal opens in EDIT mode
│
└── Other Sections (Summary, Charts)
```

---

## 🔄 Data Flow Diagram

### Edit Mode Flow (NEW)

```
Budgets Tab (Screen)
    │
    ├─ State: budgets[], records[], expandedBudgetId
    │
    └─ User Action: Tap Budget → Expand → Click Edit
        │
        ├─ handleEditBudget(budget) triggered
        │
        ├─ budget object contains:
        │   ├─ id: "uuid-123"
        │   ├─ category_id: "cat-456"
        │   ├─ amount: 2000
        │   ├─ notes: "Monthly limit"
        │   └─ categories: { name, icon, color }
        │
        ├─ JSON.stringify(budget)
        │
        └─ router.push({
            pathname: '/(modal)/add-budget-modal',
            params: { budget: stringified }
           })
            │
            └─ add-budget-modal receives params
                │
                └─ useLocalSearchParams() gets params
                    │
                    ├─ incomingBudget = JSON.parse(params.budget)
                    │
                    └─ loadCategories() runs
                        │
                        └─ Detects incomingBudget exists
                            │
                            ├─ setEditingBudgetId(incomingBudget.id)
                            ├─ setBudgetAmount(incomingBudget.amount)
                            ├─ setNotes(incomingBudget.notes)
                            └─ setSelectedCategory(matching category)
                                │
                                └─ Form fully pre-filled!
                                    │
                                    ├─ User modifies data
                                    │
                                    └─ Clicks "Update Budget"
                                        │
                                        └─ handleSave() triggered
                                            │
                                            └─ Checks: editingBudgetId exists?
                                                │
                                                ├─ YES: updateBudget(id, data)
                                                │      └─ Supabase updates record
                                                │      └─ Returns updated data
                                                │      └─ Success alert
                                                │
                                                └─ NO: createBudget(data)
                                                      └─ Creates new record
                                                      └─ Success alert
                                                      │
                                                      └─ router.back()
                                                          │
                                                          └─ Returns to Budgets Tab
                                                              │
                                                              └─ useFocusEffect triggers
                                                                  │
                                                                  └─ loadData() reloads
                                                                      │
                                                                      └─ Budgets refreshed
                                                                          │
                                                                          └─ UI shows changes
```

---

## 🎨 Modal State Machine

### Modal States

```
                    [MOUNT]
                      ↓
        ┌─────────────────────────────────┐
        │   Load Categories             │
        │   Check useLocalSearchParams  │
        └─────────────────────────────────┘
                      ↓
            ┌─────────┴─────────┐
            ↓                   ↓
      [Incoming Params]   [No Params]
            ↓                   ↓
      [EDIT MODE]         [CREATE MODE]
            │                   │
      ┌─────┴─────┐       ┌─────┴─────┐
      │ Pre-fill  │       │ Empty      │
      │ all fields│       │ form       │
      └─────┬─────┘       └─────┬─────┘
            │                   │
            │ User edits data   │ User fills form
            │                   │
            ├───────────┬───────┤
                        ↓
              ┌──────────────────┐
              │ Click Cancel     │ Click Save/Update
              │                  │
              └──────────┬───────┴──────────┐
                         ↓                  ↓
                   [router.back()]   [Validate Input]
                         │                  │
                         │            ┌─────┴─────┐
                         │            ↓           ↓
                         │       [Valid]      [Invalid]
                         │         │            │
                         │         ↓            ↓
                         │    [Show Error]   [Show Alert]
                         │      & Stay          │
                         │                      └─ User fixes
                         │
                    [Return to]
                    [Budgets Tab]
                         │
                    [loadData()]
                    [Refresh UI]
```

---

## 📊 Create vs Edit Comparison

### Create Mode (Original)

```
Entry Point: Add Budget Button or "+"
    ↓
Modal Opens: "Add Budget"
    ↓
Form State:
  - budgetAmount: ""
  - selectedCategory: null
  - notes: ""
  - editingBudgetId: null
    ↓
User fills all fields
    ↓
Clicks "Save Budget"
    ↓
handleSave():
  editingBudgetId is null
  └─ Calls createBudget(data)
    ↓
Success Alert
    ↓
Back to Budgets Tab
```

### Edit Mode (NEW)

```
Entry Point: Edit Button in expanded card
    ↓
modal Opens: "Edit Budget"
    ↓
Form State (Pre-filled):
  - budgetAmount: "2000"
  - selectedCategory: Groceries object
  - notes: "Monthly limit"
  - editingBudgetId: "uuid-123"
    ↓
User modifies fields (optional)
    ↓
Clicks "Update Budget"
    ↓
handleSave():
  editingBudgetId exists
  └─ Calls updateBudget(id, data)
    ↓
Success Alert
    ↓
Back to Budgets Tab
```

---

## 🔄 Data Transformation

### Budget Object Transformation

```
Raw Budget from Database:
{
  id: "budget-123",
  user_id: "user-456",
  category_id: "cat-789",
  amount: 2000,
  notes: "Monthly grocery budget",
  start_date: "2025-11-01",
  end_date: "2025-11-30",
  created_at: "2025-11-01T10:00:00",
  categories: {
    id: "cat-789",
    name: "Groceries",
    icon: "shopping-cart",
    color: "#4ECDC4"
  }
}
      ↓
Transform for BudgetCard:
{
  ...budget,
  icon: "shopping-cart",
  name: "Groceries",
  color: "#4ECDC4",
  limit: 2000,
  spent: 440  ← Calculated from records
}
      ↓
Pass to Edit Modal:
JSON.stringify(transformedBudget)
      ↓
In Modal:
JSON.parse(params.budget)
      ↓
Extract for Pre-fill:
{
  editingBudgetId: budget.id,
  budgetAmount: budget.amount,
  selectedCategory: matching category,
  notes: budget.notes
}
      ↓
On Save:
{
  category_id: selectedCategory.id,
  amount: parseFloat(budgetAmount),
  notes: notes || null
}
      ↓
Database Update:
UPDATE budgets SET ... WHERE id = ?
```

---

## 🎯 Function Call Hierarchy

### Create Flow (Unchanged)

```
Button Press (Add Budget)
    ↓
handleSave()
    ├─ Validate input
    ├─ editingBudgetId is null → CREATE path
    ├─ createBudget(budgetData)
    │   └─ Supabase: INSERT INTO budgets
    ├─ Alert success
    └─ router.back()
```

### Edit Flow (NEW)

```
Button Press (Edit in Card)
    ↓
handleEditBudget(budget)
    ├─ JSON.stringify(budget)
    └─ router.push with budget param
        ↓
    Modal Opens
        ↓
    useLocalSearchParams() gets params
        ↓
    loadCategories()
    ├─ Parse incomingBudget
    └─ Pre-fill form
        ↓
    User modifies & clicks "Update"
        ↓
    handleSave()
    ├─ Validate input
    ├─ editingBudgetId exists → EDIT path
    ├─ updateBudget(id, budgetData)
    │   └─ Supabase: UPDATE budgets SET ...
    ├─ Alert success
    └─ router.back()
        ↓
    Budgets Tab
        ↓
    useFocusEffect triggers
        ↓
    loadData()
    ├─ readBudgets()
    ├─ readRecordsWithSpending()
    ├─ Calculate spending
    └─ Update UI
```

---

## 📋 State Management

### Before Edit

```
BudgetScreen State:
{
  budgets: [
    { id: "b1", category_id: "c1", amount: 2000, ... },
    { id: "b2", category_id: "c2", amount: 1500, ... }
  ],
  records: [...],
  expandedBudgetId: null,
  loading: false,
  timeRange: "month"
}
```

### During Edit

```
Modal State:
{
  categories: [...],
  selectedCategory: { id: "c1", name: "Groceries", ... },
  budgetAmount: "2000",
  notes: "Monthly limit",
  editingBudgetId: "b1",  ← NEW
  loading: false,
  saving: false
}
```

### After Edit

```
BudgetScreen State (Updated):
{
  budgets: [
    { id: "b1", category_id: "c1", amount: 2500, ... }, ← Changed
    { id: "b2", category_id: "c2", amount: 1500, ... }
  ],
  records: [...],
  expandedBudgetId: null,
  loading: false,
  timeRange: "month"
}
```

---

## 🚀 Sequence Diagram

### Edit Budget Sequence

```
User          │   Screen    │   Modal    │   Firebase   │
─────────────────────────────────────────────────────────
              │             │            │
Tap Edit ─────→ handleEdit() │            │
              │             │            │
              │──push────────→ Open Modal │
              │             │            │
              │             │ Parse Params
              │             │            │
              │             │ Load Cats  │
              │             │            │
              │         Pre-fill Form    │
              │             │◄───────────┤
              │             │            │
Modify Data ──│ ─ (user types) ─         │
              │             │            │
              │             │            │
Tap Update ───│─ ────────────→ Save      │
              │             │            │
              │             │ Validate   │
              │             │            │
              │             │ Update─────→ DB
              │             │            │
              │             │◄───Success─┤
              │             │            │
              │             │ Alert      │
              │             │            │
              │◄────back─────┤            │
              │             │            │
              │ loadData()   │            │
              │             │            │
              │ readBudgets()├────────────→
              │ readRecords()├────────────→
              │             │◄───────────┤
              │             │            │
              │ Refresh UI   │            │
              │             │            │
              Show Changes   │            │
```

---

## 🔐 Security & Validation

### Validation Pipeline

```
Input → Check Required Fields
         ↓
      Check Data Types
         ↓
      Check Value Ranges
         ↓
      Valid?
      ├─ YES → Prepare data → Update DB
      └─ NO → Show error message → Stay in form
```

### Protected Fields

```
Budget Object:
{
  id: "protected" ← Cannot be edited
  user_id: "protected" ← Cannot be edited
  category_id: "editable" ← Can change
  amount: "editable" ← Can change
  notes: "editable" ← Can change
  start_date: "protected" ← Cannot be edited
  end_date: "protected" ← Cannot be edited
}
```

---

## 📈 User Experience Journey

### Happy Path (Edit Succeeds)

```
1. Open App
   └─ Budgets tab loads
       └─ Shows budget cards

2. Expand Budget
   └─ Shows details and buttons

3. Tap Edit
   └─ Modal opens with pre-filled data

4. Change Amount (₹2000 → ₹2500)
   └─ Form updates in real-time

5. Tap Update Budget
   └─ Modal shows "Saving..."

6. Success!
   └─ Alert: "Budget updated successfully!"

7. Back to Budgets Tab
   └─ New amount visible (₹2500)
   └─ Spending recalculated
```

### Error Path (Validation Fails)

```
1. Open modal
   └─ Pre-filled data

2. Clear Amount field
   └─ Leave empty

3. Tap Update Budget
   └─ Validation fails

4. Error Alert
   └─ "Please fill in all required fields"

5. Stay in Modal
   └─ User can fix and retry

6. Add amount again
   └─ ₹2500

7. Tap Update Budget
   └─ Success!
```

---

**All diagrams showing edit feature architecture and data flow!** 📊✨
