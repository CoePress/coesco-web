#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from autofill import generate_minimum_roll_str_backbend_values
import json

def test_mapping():
    """Test the field mapping between calculation and autofill"""
    
    # Create minimal test data
    test_data = {
        "common": {
            "material": {
                "materialThickness": 0.125,
                "coilWidth": 12.0,
                "maxYieldStrength": 30000,
                "materialType": "Cold Rolled Steel"
            },
            "equipment": {
                "straightener": {
                    "model": "CPPS-250",
                    "numberOfRolls": 7
                }
            }
        }
    }
    
    print("Testing Roll Str Backbend autofill mapping...")
    
    # Generate autofill data
    result = generate_minimum_roll_str_backbend_values(test_data)
    
    if result:
        # Let's debug what's in the calculation result first
        print("\n=== Raw Calculation Debug ===")
        # This is a hack to get access to the calculation result, but let's manually run it
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
        from models import roll_str_backbend_input
        from calculations.rolls.roll_str_backbend import calculate_roll_str_backbend
        
        # Create the same input as autofill
        calc_input = roll_str_backbend_input(
            str_model="CPPS-250",
            num_str_rolls=7,
            width=12.0,
            thickness=0.125,
            material_thickness=0.125,
            yield_strength=30000,
            material_type="Cold Rolled Steel"
        )
        
        calc_result = calculate_roll_str_backbend(calc_input)
        print(f"Raw calculation keys: {list(calc_result.keys())}")
        
        # Check for mid keys
        mid_keys = [k for k in calc_result.keys() if 'mid' in k]
        print(f"Mid-related keys: {mid_keys}")
        
        for mid_key in mid_keys:
            print(f"{mid_key}: {calc_result[mid_key]}")
        
        # Extract the backbend rollers data
        rollers = result.get("rollStrBackbend", {}).get("straightener", {}).get("rolls", {}).get("backbend", {}).get("rollers", {})
        
        print("\n=== Rollers Data Structure ===")
        print(json.dumps(rollers, indent=2))
        
        # Check specific fields
        first = rollers.get("first", {})
        middle = rollers.get("middle", {})
        last = rollers.get("last", {})
        
        print(f"\n=== Key Field Checks ===")
        print(f"First roller height: {first.get('height')} (type: {type(first.get('height'))})")
        print(f"First roller force: {first.get('forceRequired')}")
        print(f"First roller force check: {first.get('forceRequiredCheck')}")
        print(f"First up resulting radius: {first.get('up', {}).get('resultingRadius')}")
        print(f"Middle roller data: {middle}")
        print(f"Last roller height: {last.get('height')}")
        print(f"Last roller force: {last.get('forceRequired')}")
        print(f"Total force required: {rollers.get('forceRequired')}")
        
        # Check the full result for any middle roll data
        print(f"\n=== Full Result Debug ===")
        if result.get("rollStrBackbend"):
            print("rollStrBackbend exists")
            if result["rollStrBackbend"].get("straightener"):
                print("straightener exists")
                if result["rollStrBackbend"]["straightener"].get("rolls"):
                    print("rolls exists")
                    if result["rollStrBackbend"]["straightener"]["rolls"].get("backbend"):
                        print("backbend exists")
                        if result["rollStrBackbend"]["straightener"]["rolls"]["backbend"].get("rollers"):
                            print("rollers exists")
                            rollers_keys = result["rollStrBackbend"]["straightener"]["rolls"]["backbend"]["rollers"].keys()
                            print(f"Rollers keys: {list(rollers_keys)}")
        
        # Check if we have non-zero values
        has_data = (
            first.get('height') not in [None, 0, "0"] and
            first.get('forceRequired') not in [None, 0] and
            first.get('up', {}).get('resultingRadius') not in [None, 0]
        )
        
        print(f"\n=== Result ===")
        print(f"Mapping successful: {has_data}")
        print(f"Data contains meaningful values: {bool(result)}")
        print(f"Has middle roller: {bool(middle)}")
        
    else:
        print("ERROR: No result generated from autofill")

if __name__ == "__main__":
    test_mapping()