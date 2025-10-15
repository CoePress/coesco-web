# Performance Sheet Actions Simplification

## Changes Made

### 1. **Simplified Actions Section**
- **Removed**: `ManualAutofillButton` (which showed percentage indicators and manual trigger)
- **Kept**: Single Edit/Save button that toggles between modes
- **Added**: "✓ Autofilled" indicator when one-time autofill has been triggered

### 2. **Smart Save Logic**
The save button now behaves differently based on the active tab:

**RFQ Tab Save:**
- Triggers one-time autofill (if conditions are met and hasn't run before)
- Uses existing `saveRfqWithAutofill()` hook
- Autofill only runs once per performance sheet (protected by `hasTriggeredOnSave` flag)

**Other Tabs Save:**
- Regular save without autofill
- Uses standard `updatePerformanceData()` method
- No risk of overwriting user data

### 3. **Visual Indicators**
- **Edit Mode**: Shows "Edit" button with lock icon
- **Save Mode**: Shows "Save" button with save icon  
- **Autofill Status**: Shows green "✓ Autofilled" indicator when autofill has been triggered

## How It Works

### **First-Time RFQ Save (>80% complete)**
1. User fills out RFQ form
2. User clicks "Save" 
3. System saves RFQ data
4. System checks if ≥80% of required fields are complete
5. **One-time autofill triggers** - populates other tabs
6. "✓ Autofilled" indicator appears
7. Edit mode exits

### **Subsequent Saves**
1. User can edit any tab and save
2. **No autofill occurs** - preserves user data
3. "✓ Autofilled" indicator remains visible
4. Normal save/edit cycle continues

### **Other Tab Saves**
1. User edits Material Specs, TDDBHD, etc.
2. User clicks "Save"
3. **Regular save only** - no autofill risk
4. User data is preserved

## Benefits

✅ **Data Safety**: Autofill only runs once, preventing overwriting user edits
✅ **Simple UX**: Single Edit/Save button instead of multiple confusing buttons
✅ **Clear Status**: Visual indicator shows when autofill has occurred
✅ **Smart Behavior**: Only triggers autofill on RFQ tab where it makes sense
✅ **Efficient**: Reuses existing autofill infrastructure

## Technical Implementation

### Key Files Modified
- `performance-sheet.tsx`: Simplified Actions component and save logic
- Uses existing `useRfqSaveWithAutofill` hook
- Uses existing `hasTriggeredOnSave` state from autofill context

### Dependencies (Unchanged)
- Autofill logic: `autofill.context.tsx`
- One-time protection: `hasTriggeredOnSave` flag
- RFQ save hook: `use-rfq-save-with-autofill.hook.ts`

## Testing Checklist

- [ ] RFQ tab save triggers autofill (first time only)
- [ ] RFQ tab save doesn't trigger autofill (subsequent times)
- [ ] Other tab saves work without autofill
- [ ] "✓ Autofilled" indicator appears after first autofill
- [ ] Edit/Save button toggles correctly
- [ ] User data is preserved across saves

## Future Enhancements (Optional)

1. **Reset Autofill**: Add admin option to reset `hasTriggeredOnSave` if needed
2. **Progress Indicator**: Show completion percentage on RFQ tab only
3. **Confirmation Dialog**: Ask user before triggering autofill