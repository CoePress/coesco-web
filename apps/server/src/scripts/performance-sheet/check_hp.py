#!/usr/bin/env python3
"""
Check what HP values are available in the motor lookup table
"""

import sys
sys.path.append('.')

from utils.lookup_tables import get_motor_inertia

# Test different HP values to see what's available
print("=== CHECKING AVAILABLE HP VALUES ===")
hp_values_to_test = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300]

available_hp = []
for hp in hp_values_to_test:
    try:
        result = get_motor_inertia(str(hp))
        available_hp.append(hp)
        print(f"HP {hp:6}: Available")
    except:
        print(f"HP {hp:6}: NOT AVAILABLE")

print(f"\nAvailable HP values: {available_hp}")