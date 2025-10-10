#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

import json
import requests

def test_api_autofill():
    """Test the autofill API endpoint"""
    
    # Test data with thick material for Roll Str Backbend
    test_data = {
        "common": {
            "material": {
                "materialType": "Cold Rolled Steel",
                "materialThickness": 0.125,  # Thick material to avoid TOO DEEP
                "coilWidth": 24.0,
                "maxYieldStrength": 80000
            },
            "equipment": {
                "straightener": {
                    "model": "CPPS-250",
                    "numberOfRolls": 7
                }
            }
        }
    }
    
    print("=== TESTING AUTOFILL API ENDPOINT ===")
    print("Sending test data to server...")
    
    try:
        # Test the autofill endpoint
        response = requests.post(
            "http://localhost:8080/api/performance/sheets/test-sheet/autofill",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✓ API call successful!")
            
            if "autoFillValues" in result:
                autofill_values = result["autoFillValues"]
                print(f"Returned autofill data keys: {list(autofill_values.keys())}")
                
                # Check Str Utility results
                if "strUtility" in autofill_values:
                    str_util = autofill_values["strUtility"]
                    hp = str_util.get("straightener", {}).get("horsepower", "N/A")
                    print(f"✓ Str Utility HP: {hp}")
                else:
                    print("✗ No Str Utility data in result")
                
                # Check Roll Str Backbend results  
                if "rollStrBackbend" in autofill_values:
                    roll_str = autofill_values["rollStrBackbend"]
                    roll_dia = roll_str.get("straightener", {}).get("rollDiameter", "N/A")
                    center_dist = roll_str.get("straightener", {}).get("centerDistance", "N/A")
                    print(f"✓ Roll Str Backbend Roll Diameter: {roll_dia}")
                    print(f"✓ Roll Str Backbend Center Distance: {center_dist}")
                else:
                    print("✗ No Roll Str Backbend data in result")
                    
            else:
                print("✗ No autoFillValues in response")
                print(f"Response keys: {list(result.keys())}")
                
        else:
            print(f"✗ API call failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to server. Is the server running on localhost:8080?")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    test_api_autofill()