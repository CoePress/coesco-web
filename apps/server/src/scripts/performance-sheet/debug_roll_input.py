#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from models import roll_str_backbend_input
from calculations.rolls.roll_str_backbend import calculate_roll_str_backbend

def debug_roll_input():
    """Debug what data we're sending to Roll Str Backbend calculation"""
    
    # Test data that matches our autofill function - use thicker material to avoid TOO DEEP
    test_data = {
        "yield_strength": 80000.0,  # Higher yield strength
        "thickness": 0.125,         # Thicker material to avoid TOO DEEP  
        "width": 24.0,              # float
        "material_type": "Cold Rolled Steel",  # string
        "material_thickness": 0.125, # Thicker material
        "str_model": "CPPS-250",    # string
        "num_str_rolls": 7,         # int
    }
    
    print("=== DEBUGGING ROLL STR BACKBEND INPUT ===")
    print("Input data types:")
    for key, value in test_data.items():
        print(f"  {key}: {value} (type: {type(value).__name__})")
    
    print("\nCreating roll_str_backbend_input object...")
    try:
        roll_str_obj = roll_str_backbend_input(**test_data)
        print("✓ roll_str_backbend_input object created successfully")
        
        # Print the object attributes to see what we're passing
        print("\nObject attributes:")
        for attr in dir(roll_str_obj):
            if not attr.startswith('_'):
                value = getattr(roll_str_obj, attr)
                print(f"  {attr}: {value} (type: {type(value).__name__})")
                
        print("\nCalling calculate_roll_str_backbend...")
        result = calculate_roll_str_backbend(roll_str_obj)
        print("✓ Calculation completed")
        print(f"Result type: {type(result)}")
        
        if isinstance(result, dict):
            print("Result keys:", list(result.keys()))
        else:
            print("Result:", result)
            
    except Exception as e:
        print(f"✗ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_roll_input()