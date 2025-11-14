# Filter & Display Options Feature Guide

## Overview
The BudgetZen app now includes advanced filtering and display customization options on both the **Records** page and **Analysis** page, allowing users to view their financial data in different time periods and with customizable visibility settings.

---

## Features Implemented

### 1. **Records Page** (`app/(tabs)/index.tsx`)

#### View Mode Selection
Users can filter transactions by different time periods:
- **DAILY**: Shows transactions for the selected day
- **WEEKLY**: Shows transactions for the current week
- **MONTHLY**: Shows transactions for the selected month (default)
- **3MONTHS**: Shows transactions for the past 3 months
- **6MONTHS**: Shows transactions for the past 6 months
- **YEARLY**: Shows transactions for the entire year

#### Display Toggles
- **Show Total**: When enabled, displays transactions and totals for the selected view mode instead of just the month
- **Carry Over**: (Available for future implementation) Option to carry forward balance from previous periods

#### How It Works
1. User taps the **filter button** (≡) in the Records page header
2. A modal appears with view mode options and toggle switches
3. Select desired view mode - the page immediately updates to show:
   - Transactions for that time period
   - Updated income/expense totals
   - Relevant chart visualizations
4. Tap **Apply** to close the modal and keep the selection

#### Key Calculations
```typescript
// Date range calculation for each view mode
const getDateRange = (mode: ViewMode, referenceDate: Date) => {
  // Returns { start, end } date objects for filtering
  // Handles edge cases like week boundaries and month transitions
}

// Filtered records based on selected view mode
const filteredRecords = useMemo(() => {
  const { start, end } = getDateRange(viewMode, selectedDate);
  return records.filter((r) => r.date >= start && r.date < end);
}, [records, selectedDate, viewMode]);
```

---

### 2. **Analysis Page** (`app/(tabs)/analysis.tsx`)

#### View Mode Selection
Same as Records page - DAILY, WEEKLY, MONTHLY, 3MONTHS, 6MONTHS, YEARLY

#### Display Toggles
- **Show Charts**: Toggle the visibility of income/expense overview charts and category breakdown
- **Show Insights**: Toggle the visibility of quick insights section (average transaction, top category)

#### Dynamic Content
When filters are applied:
- **Chart Title** updates based on view mode (e.g., "Daily Overview", "Weekly Overview", "Monthly Overview")
- **Category Breakdown** recalculates for the selected time period
- **Quick Insights** updates with metrics specific to the selected period
- **Empty States** provide appropriate messages for different time periods

#### Key Calculations
```typescript
// View data based on selected mode
const currentViewData = useMemo(() => {
  const { start, end } = getDateRange(viewMode, selectedDate);
  const filteredRecords = records.filter((r) => r.date >= start && r.date < end);
  // Calculate income/expense/records for this period
}, [records, selectedDate, viewMode]);

// Category breakdown always uses currentViewData
const categoryBreakdown = useMemo(() => {
  // Processes currentViewData to calculate spending by category
}, [currentViewData]);
```

---

## UI Components

### Filter Button
- **Location**: Header of Records/Analysis pages
- **Style**: 48x48 px rounded button with border
- **Icon**: Filter outline (≡)
- **Color**: Accent color (#0284c7)
- **Functionality**: Opens Display Options Modal

### Display Options Modal
- **Animation**: Slide from bottom
- **Sections**:
  1. **View Mode Grid**: 6 buttons for different time periods
  2. **Divider**: Visual separator between sections
  3. **Toggle Switches**: Show/Hide content options
  4. **Info Box**: Helper text about customization
  5. **Action Buttons**: Cancel / Apply

#### View Mode Button States
- **Selected**: Accent background (#0284c7) + white text
- **Unselected**: Surface background + text color
- **Interactive**: Smooth selection feedback

#### Toggle Switch States
- **ON**: Green background (#10B981) with thumb moved right
- **OFF**: Gray background (#A0A0A0) with thumb at left
- **Animation**: Smooth translateX transform when toggling

### Color Scheme
The feature respects both light and dark themes:

**Light Mode**:
- Background: #FFFFFF
- Surface: #F5F5F5
- Text: #000000
- Secondary Text: #666666
- Border: #E5E5E5

**Dark Mode**:
- Background: #1A1A1A
- Surface: #262626
- Text: #FFFFFF
- Secondary Text: #A0A0A0
- Border: #404040

---

## Data Transformation

### Backend Data Structure
Records come from Supabase with the following structure:
```typescript
{
  id: string,
  type: 'expense' | 'income',              // lowercase from backend
  amount: number,
  category_id: string,
  categories: { name, color, icon },        // nested object
  accounts: { name },                       // nested object
  transaction_date: string,                 // ISO format
  notes?: string
}
```

### Transformation Pipeline
Data is transformed in `loadData()` functions to match UI expectations:

```typescript
const transformedRecords = (data || []).map((record: any) => ({
  id: record.id,
  type: record.type.toUpperCase(),              // expense → EXPENSE
  amount: record.amount,
  category: record.categories?.name || 'Unknown',
  category_id: record.category_id,
  category_color: record.categories?.color || '#888888',
  icon: record.categories?.icon || 'cash',
  account: record.accounts?.name || 'Unknown Account',
  account_id: record.account_id,
  date: new Date(record.transaction_date),     // Parse ISO string
  notes: record.notes || '',
}));
```

---

## State Management

### Records Page States
```typescript
const [viewMode, setViewMode] = useState<ViewMode>('MONTHLY');
const [showTotal, setShowTotal] = useState(true);
const [carryOver, setCarryOver] = useState(false);
const [displayModalVisible, setDisplayModalVisible] = useState(false);
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
```

### Analysis Page States
```typescript
const [viewMode, setViewMode] = useState<ViewMode>('MONTHLY');
const [showCharts, setShowCharts] = useState(true);
const [showInsights, setShowInsights] = useState(true);
const [displayModalVisible, setDisplayModalVisible] = useState(false);
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
```

---

## User Experience Flow

### Records Page Filter Flow
1. **Default State**: View transactions for current month
   - Monthly chart showing income/expense
   - Transaction list for the month
   - Totals card visible (showTotal = true)

2. **User Changes View Mode to WEEKLY**:
   - Chart title changes to "Weekly Overview"
   - Chart and totals update for current week
   - Transaction list shows only this week's transactions
   - Empty state message changes if no data

3. **User Toggles Show Total OFF**:
   - Falls back to monthly view
   - Reset to monthly transactions
   - Button becomes grayed out

### Analysis Page Filter Flow
1. **Default State**: Monthly analysis displayed
   - Monthly overview chart
   - Category breakdown for the month
   - Quick insights section

2. **User Changes View Mode to 3MONTHS**:
   - Chart title changes to "3-Month Overview"
   - Statistics update for 3-month period
   - Category breakdown recalculates
   - Insights update with new metrics

3. **User Toggles Show Charts OFF**:
   - Overview chart section hidden
   - Category breakdown section hidden
   - Only Quick Insights remain visible

4. **User Toggles Show Insights OFF**:
   - Quick Insights section hidden
   - Charts and breakdown still visible

---

## Performance Optimizations

### useMemo Hooks
All calculations use `useMemo` to prevent unnecessary recalculations:

```typescript
// Only recalculates when dependencies change
const filteredRecords = useMemo(() => {
  // ... filtering logic
}, [records, selectedDate, viewMode]);

const categoryBreakdown = useMemo(() => {
  // ... calculation logic
}, [currentViewData]);

const totals = useMemo(() => {
  // ... calculation logic
}, [filteredRecords, monthRecords, showTotal]);
```

### Dependency Optimization
- Dependencies are kept minimal to avoid unnecessary recalculations
- Data transformations happen at load time (not during rendering)
- Callbacks are wrapped in useCallback where appropriate

---

## Testing Checklist

- [ ] Records page filter button opens modal
- [ ] View mode selection updates chart and transactions
- [ ] Show Total toggle switches between view modes
- [ ] Month navigation still works while filtering
- [ ] Today button works with different view modes
- [ ] Empty states show appropriate messages
- [ ] Dark/light theme switching works
- [ ] Analysis page filter button opens modal
- [ ] Show Charts toggle hides/shows chart sections
- [ ] Show Insights toggle hides/shows insights
- [ ] Category breakdown updates for different periods
- [ ] Insights metrics update correctly
- [ ] Modal closes on Cancel and Apply buttons
- [ ] Filter selections persist after modal closes
- [ ] No data cases handled gracefully

---

## Future Enhancements

1. **Persistent Filter State**: Save selected filters to localStorage/app storage
2. **Custom Date Range**: Allow users to select arbitrary date ranges
3. **Advanced Filters**: Filter by category, account, transaction type
4. **Export Options**: Export filtered data as CSV/PDF
5. **More View Modes**: Bi-weekly, Quarterly options
6. **Filter Presets**: Save frequently used filter combinations
7. **Carry Over Logic**: Implement balance carry-forward between periods
8. **Comparison Mode**: Compare two time periods side-by-side

---

## Code Files Modified

### 1. `app/(tabs)/index.tsx` (Records Page)
- Added `getDateRange()` helper function
- Added `filteredRecords` useMemo hook
- Updated `totals` calculation to use filtered data
- Updated transaction list rendering to use filtered data
- Added Display Options Modal component

### 2. `app/(tabs)/analysis.tsx` (Analysis Page)
- Added `getDateRange()` helper function
- Added `currentViewData` useMemo hook
- Maintained `currentMonthData` for backwards compatibility
- Updated `categoryBreakdown` to use currentViewData
- Updated section rendering with conditional visibility based on toggles
- Added Display Options Modal component

---

## Notes for Developers

### Extending the Filter Feature

**To add a new view mode:**
1. Update the `ViewMode` type union
2. Add case to `getDateRange()` function
3. Add button to view mode grid in Modal
4. Update chart title template

**To add a new toggle:**
1. Create state: `const [newToggle, setNewToggle] = useState(initialValue);`
2. Add toggle to modal
3. Wrap content sections with `{newToggle && (...)}`

### Common Issues & Solutions

**Issue**: Chart shows old data after filter change
- **Solution**: Ensure `filteredRecords` or `currentViewData` is in useMemo dependencies

**Issue**: Empty state shows even with data
- **Solution**: Check that records are being filtered correctly; verify date parsing

**Issue**: Toggle switch doesn't animate
- **Solution**: Ensure `toggleSwitch` and `toggleThumb` styles include transform property

---

## Related Documentation
- [CHARTS_IMPLEMENTATION.md](./CHARTS_IMPLEMENTATION.md) - Chart rendering details
- [BACKEND_INTEGRATION_COMPLETE.md](./BACKEND_INTEGRATION_COMPLETE.md) - Data fetching
- [DATA_FETCHING_FIX.md](./DATA_FETCHING_FIX.md) - Data transformation details
