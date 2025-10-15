# Autofill Analysis and Fixes - RFQ User Input Preservation

## **PROBLEM ANALYSIS**

### **Original Issues Found:**
1. **Autofill was overriding RFQ user inputs** - violating the core requirement
2. **Customer information was being replaced** with hardcoded defaults
3. **Material specifications from RFQ** were being overwritten by material specs autofill
4. **Date fields** were being set to current date regardless of user input
5. **Equipment configuration** was being filled even when user provided values

## **WHAT SHOULD HAPPEN vs WHAT WAS HAPPENING**

### **Correct Process:**
1. User fills RFQ form with their specific data
2. Autofill runs when RFQ is saved (first time only)
3. Autofill **PRESERVES** all RFQ user inputs
4. Autofill **ONLY FILLS** missing values needed for other tab calculations
5. User data is never overwritten

### **What Was Wrong:**
1. ❌ Customer info being overridden with "Saint-Gobain" defaults
2. ❌ Date being set to current date regardless of user input
3. ❌ Material specs autofill overwriting RFQ material values
4. ❌ Equipment config being filled even when user provided values
5. ❌ Feed rates being partially overridden

## **FIXES IMPLEMENTED**

### **1. RFQ Values Preservation**
**Before:**
```python
result = {
    "rfq": {
        "dates": {"date": current_date},  # Always overrode
        # ... other overrides
    },
    "common": {
        "customer": get_nested(data, ["common", "customer"], "Saint-Gobain"),  # Default override
        # ... more overrides
    }
}
```

**After:**
```python
# Only provide values if user hasn't filled them in
result = {}

# Only set date if user hasn't provided one
if not get_nested(data, ["rfq", "dates", "date"]):
    result["rfq"] = {"dates": {"date": current_date}}

# Only provide customer info if user hasn't filled ANY customer info
has_customer_info = (user provided any customer data check)
if not has_customer_info:
    result["common"]["customer"] = "Sample Company"  # Much simpler defaults
```

### **2. Material Specifications Protection**
**Before:**
```python
# Always returned material data, overriding RFQ inputs
return {
    "common": {
        "material": {
            "materialThickness": thickness,  # Could override RFQ
            "maxYieldStrength": yield_strength,  # Could override RFQ
            # ... etc
        }
    }
}
```

**After:**
```python
# Check if user has material data from RFQ first
has_material_from_rfq = (check for any RFQ material inputs)
        
if not has_material_from_rfq:
    # Only autofill material data if user hasn't provided it in RFQ
    result["common"]["material"] = { ... }
```

### **3. Feed Rates Smart Updates**
**Before:**
```python
# Partially overrode user values
result["common"]["feedRates"] = {
    "average": {"fpm": calculated_value},  # Overwrote structure
    # ... forced structure
}
```

**After:**
```python
# Only add FPM calculations where missing, preserve user structure
fpm_updates = {}
if user_has_length_and_spm_but_missing_fpm:
    fmp_updates["average"] = {"fpm": calculated_value}
    
if fpm_updates:
    result["common"]["feedRates"] = fpm_updates  # Merge, don't override
```

## **WHAT GETS AUTOFILLED NOW**

### **RFQ Tab - ONLY Missing Values:**
- ✅ Date (only if user didn't provide)
- ✅ Basic customer info (only if user provided NONE)
- ✅ FPM calculations (only where user provided length/spm but missing FPM)

### **Other Tabs - Calculation Requirements:**
- ✅ Missing material properties needed for calculations (only if not in RFQ)
- ✅ Equipment models and specs needed for calculations
- ✅ Tab-specific configuration values (not shared with RFQ)
- ✅ Calculated results and validation values

## **USER INPUT PROTECTION STRATEGY**

### **Defensive Checks:**
1. **Check for existing values** before autofilling anything
2. **Only fill truly missing** calculation requirements
3. **Preserve user structure** - merge don't override
4. **Use minimal defaults** when absolutely needed

### **Data Flow:**
```
RFQ User Input → Preserved Exactly
    ↓
Missing Calculation Inputs → Autofilled with minimal viable values
    ↓
Other Tab Calculations → Use user values + autofilled minimums
    ↓
Results → Displayed without overriding user inputs
```

## **TESTING CHECKLIST**

### **Scenarios to Test:**
- [ ] User fills complete RFQ → No RFQ values overridden
- [ ] User fills partial RFQ → Only missing values filled
- [ ] User leaves RFQ empty → Minimal defaults provided  
- [ ] User edits after autofill → Changes preserved on next save
- [ ] Multiple save cycles → No cumulative overrides

### **Key Fields to Verify:**
- [ ] Customer information preservation
- [ ] Material properties (thickness, yield strength, etc.)
- [ ] Feed rates (length, spm, fpm structure)
- [ ] Equipment configuration
- [ ] Dates and reference numbers

## **CALCULATION DEPENDENCIES**

### **What Calculations Actually Need from RFQ:**
1. **Material Properties**: thickness, yield strength, material type, coil dimensions
2. **Feed Parameters**: length, spm (for FPM calculation)
3. **Equipment Models**: For lookup table access
4. **Application Settings**: Type of line, cosmetic material flags

### **What Calculations DON'T Need from RFQ:**
1. Customer contact information
2. Dealer information  
3. Dates and reference numbers
4. Press details (for most calculations)
5. Basic project metadata

The autofill now respects this distinction and only fills what's truly needed for calculations.