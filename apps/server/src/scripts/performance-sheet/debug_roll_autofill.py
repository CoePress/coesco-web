#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from autofill import generate_minimum_roll_str_backbend_values

def debug_roll_autofill():
    """Debug the Roll Str Backbend autofill process step by step"""
    
    test_data = {
        "common": {
            "material": {
                "materialThickness": 0.125,
                "coilWidth": 24.0,
                "maxYieldStrength": 80000,
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
    
    print("=== DEBUGGING ROLL STR BACKBEND AUTOFILL ===")
    print("Input data:")
    print(f"  Material Thickness: {test_data['common']['material']['materialThickness']}")
    print(f"  Coil Width: {test_data['common']['material']['coilWidth']}")
    print(f"  Max Yield Strength: {test_data['common']['material']['maxYieldStrength']}")
    print(f"  Material Type: {test_data['common']['material']['materialType']}")
    print(f"  Str Model: {test_data['common']['equipment']['straightener']['model']}")
    print(f"  Number of Rolls: {test_data['common']['equipment']['straightener']['numberOfRolls']}")
    
    print("\nCalling generate_minimum_roll_str_backbend_values...")
    try:
        result = generate_minimum_roll_str_backbend_values(test_data)
        
        if result:
            print("✓ Autofill succeeded!")
            print(f"Result keys: {list(result.keys())}")
            
            if "rollStrBackbend" in result:
                rsb = result["rollStrBackbend"]
                print("Roll Str Backbend data:")
                if "straightener" in rsb:
                    st = rsb["straightener"]
                    print(f"  Roll Diameter: {st.get('rollDiameter', 'N/A')}")
                    print(f"  Center Distance: {st.get('centerDistance', 'N/A')}")
                    print(f"  Jack Force Available: {st.get('jackForceAvailable', 'N/A')}")
        else:
            print("✗ Autofill failed - empty result")
            
    except Exception as e:
        print(f"✗ Autofill failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_roll_autofill()