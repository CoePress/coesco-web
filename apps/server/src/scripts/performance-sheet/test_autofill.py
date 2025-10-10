#!/usr/bin/env python3
"""
Test script for autofill functions
"""

import sys
sys.path.append('.')

from autofill import generate_minimum_str_utility_values, generate_minimum_roll_str_backbend_values

# Test input data similar to what the frontend would send - use thicker material for Roll Str Backbend
test_data = {
    'common': {
        'material': {
            'materialType': 'Cold Rolled Steel',
            'materialThickness': 0.125,  # Thicker material to avoid TOO DEEP errors
            'coilWidth': 24.0,  # Narrower width
            'maxYieldStrength': 80000  # Higher yield strength
        },
        'equipment': {
            'straightener': {
                'model': 'CPPS-250',
                'numberOfRolls': 7
            }
        }
    }
}

print('Testing Str Utility...')
try:
    str_result = generate_minimum_str_utility_values(test_data)
    if str_result:
        print('✓ Str Utility autofill succeeded')
        hp = str_result.get("strUtility", {}).get("straightener", {}).get("horsepower", "N/A")
        hp_check = str_result.get("strUtility", {}).get("straightener", {}).get("required", {}).get("horsepowerCheck", "N/A")
        pinch_check = str_result.get("strUtility", {}).get("straightener", {}).get("required", {}).get("pinchRollCheck", "N/A")
        print(f'  - HP: {hp}')
        print(f'  - HP Check: {hp_check}')
        print(f'  - Pinch Roll Check: {pinch_check}')
    else:
        print('✗ Str Utility autofill failed')
except Exception as e:
    print(f'✗ Str Utility error: {e}')

print('\nTesting Roll Str Backbend...')
try:
    roll_result = generate_minimum_roll_str_backbend_values(test_data)
    if roll_result:
        print('✓ Roll Str Backbend autofill succeeded')
        roll_dia = roll_result.get("rollStrBackbend", {}).get("straightener", {}).get("rollDiameter", "N/A")
        center_dist = roll_result.get("rollStrBackbend", {}).get("straightener", {}).get("centerDistance", "N/A")
        jack_force = roll_result.get("rollStrBackbend", {}).get("straightener", {}).get("jackForceAvailable", "N/A")
        print(f'  - Roll Diameter: {roll_dia}')
        print(f'  - Center Distance: {center_dist}')
        print(f'  - Jack Force: {jack_force}')
    else:
        print('✗ Roll Str Backbend autofill failed (empty result)')
except Exception as e:
    print(f'✗ Roll Str Backbend error: {e}')
    import traceback
    traceback.print_exc()