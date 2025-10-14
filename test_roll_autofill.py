#!/usr/bin/env python3
"""
Test script for roll str backbend autofill with thin material
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'server', 'src', 'scripts', 'performance-sheet'))

from autofill import generate_minimum_roll_str_backbend_values

def test_thin_material():
    """Test autofill with very thin material (0.056") that was causing TOO DEEP errors"""
    test_data = {
        "common": {
            "material": {
                "materialThickness": 0.056,  # Very thin material that was causing problems
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
    
    print("Testing roll str backbend autofill with thin material (0.056\")...")
    print(f"Input material thickness: {test_data['common']['material']['materialThickness']}")
    print(f"Input coil width: {test_data['common']['material']['coilWidth']}")
    print(f"Input yield strength: {test_data['common']['material']['maxYieldStrength']}")
    
    try:
        result = generate_minimum_roll_str_backbend_values(test_data)
        
        if result:
            print("✅ Autofill succeeded!")
            
            # Check what thickness was actually used
            if "rollStrBackbend" in result:
                rsb = result["rollStrBackbend"]
                if "straightener" in rsb:
                    print(f"Generated roll diameter: {rsb['straightener'].get('rollDiameter', 'N/A')}")
                    print(f"Generated center distance: {rsb['straightener'].get('centerDistance', 'N/A')}")
                    print(f"Generated jack force: {rsb['straightener'].get('jackForceAvailable', 'N/A')}")
                    
                    # Check roll heights to ensure they're not "TOO DEEP!"
                    if "rolls" in rsb["straightener"]:
                        rolls = rsb["straightener"]["rolls"]
                        if "backbend" in rolls and "rollers" in rolls["backbend"]:
                            rollers = rolls["backbend"]["rollers"]
                            first_height = rollers.get("first", {}).get("height", "N/A")
                            last_height = rollers.get("last", {}).get("height", "N/A")
                            print(f"First roll height: {first_height}")
                            print(f"Last roll height: {last_height}")
                            
                            if isinstance(first_height, str) or isinstance(last_height, str):
                                print("❌ Still getting string heights (possible TOO DEEP error)")
                            else:
                                print("✅ Roll heights are numeric - no TOO DEEP errors!")
            
            # Check if material thickness was adjusted
            used_thickness = result.get("common", {}).get("material", {}).get("materialThickness", "N/A")
            print(f"Used material thickness: {used_thickness}")
            if used_thickness != test_data['common']['material']['materialThickness']:
                print(f"✅ Material thickness was adjusted from {test_data['common']['material']['materialThickness']} to {used_thickness}")
        else:
            print("❌ Autofill returned empty result")
            
    except Exception as e:
        print(f"❌ Autofill failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_thin_material()