#!/usr/bin/env python3
"""
Debug script to understand what's happening in the calculations
"""

import sys
sys.path.append('.')

from models import str_utility_input, roll_str_backbend_input
from calculations.str_utility import calculate_str_utility
from calculations.rolls.roll_str_backbend import calculate_roll_str_backbend

# Test with realistic parameters
test_data = {
    'common': {
        'material': {
            'materialType': 'Cold Rolled Steel',
            'materialThickness': 0.075,
            'coilWidth': 36.0,
            'maxYieldStrength': 60000
        },
        'equipment': {
            'straightener': {
                'model': 'CPPS-250',
                'numberOfRolls': 7
            }
        }
    }
}

print("=== DEBUGGING STR UTILITY ===")
# Test with different HP values to see where it starts passing
hp_values = [25, 50, 75, 100, 150, 200, 300]

for hp in hp_values:
    str_util_data = {
        "max_coil_weight": 3000.0,
        "coil_id": 20.0,
        "coil_od": 48.0,
        "coil_width": 36.0,
        "material_thickness": 0.075,
        "yield_strength": 60000,
        "material_type": "Cold Rolled Steel",
        "yield_met": "Yes",
        "str_model": "CPPS-250",
        "str_width": 36.0,
        "horsepower": hp,
        "feed_rate": 30.0,
        "max_feed_rate": 36.0,
        "auto_brake_compensation": "No",
        "acceleration": 3.0,
        "num_str_rolls": 7,
    }
    
    try:
        str_util_obj = str_utility_input(**str_util_data)
        result = calculate_str_utility(str_util_obj)
        
        if result and isinstance(result, dict):
            hp_required = result.get("horsepower_required", "N/A")
            hp_check = result.get("horsepower_check", "N/A")
            pinch_req_torque = result.get("pinch_roll_req_torque", "N/A")
            pinch_rated_torque = result.get("pinch_roll_rated_torque", "N/A")
            pinch_check = result.get("pinch_roll_check", "N/A")
            
            print(f"HP {hp:3d}: Required={hp_required:6.1f}, Check={hp_check:6s}, PinchReq={pinch_req_torque:6.1f}, PinchRated={pinch_rated_torque:6.1f}, PinchCheck={pinch_check}")
        else:
            print(f"HP {hp:3d}: CALCULATION ERROR - {result}")
    except Exception as e:
        print(f"HP {hp:3d}: EXCEPTION - {e}")

print("\n=== DEBUGGING ROLL STR BACKBEND ===")
# Test roll str backbend with different models
models = ["CPPS-250", "CPPS-306", "CPPS-406"]
num_rolls_list = [7, 9, 11]

for model in models:
    for num_rolls in num_rolls_list:
        try:
            roll_str_data = {
                "yield_strength": 60000.0,
                "thickness": 0.075,
                "width": 36.0,
                "material_type": "Cold Rolled Steel",
                "material_thickness": 0.075,
                "str_model": model,
                "num_str_rolls": num_rolls,
            }
            
            roll_str_obj = roll_str_backbend_input(**roll_str_data)
            result = calculate_roll_str_backbend(roll_str_obj)
            
            if result and isinstance(result, dict) and not str(result).startswith("ERROR"):
                roll_dia = result.get("str_roll_dia", 0)
                center_dist = result.get("center_dist", 0)
                jack_force = result.get("jack_force_available", 0)
                
                print(f"{model} ({num_rolls} rolls): RollDia={roll_dia}, CenterDist={center_dist}, JackForce={jack_force}")
                
                # Check for zeros
                if roll_dia == 0 or center_dist == 0 or jack_force == 0:
                    print(f"  WARNING: Zero values detected!")
            else:
                print(f"{model} ({num_rolls} rolls): ERROR - {result}")
        except Exception as e:
            print(f"{model} ({num_rolls} rolls): EXCEPTION - {e}")