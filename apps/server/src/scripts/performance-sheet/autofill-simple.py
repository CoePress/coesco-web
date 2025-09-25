#!/usr/bin/env python3
"""
Simple Auto-Fill Test Script
"""

import json
import sys

def main():
    try:
        # Read input data from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Generate simple auto-fill values
        output = {
            "success": True,
            "autoFillValues": {
                "common": {
                    "material": {
                        "materialType": input_data.get("common", {}).get("material", {}).get("materialType", "STEEL"),
                        "materialThickness": input_data.get("common", {}).get("material", {}).get("materialThickness", 0.060),
                        "maxYieldStrength": input_data.get("common", {}).get("material", {}).get("maxYieldStrength", 50000),
                        "coilWidth": input_data.get("common", {}).get("material", {}).get("coilWidth", 12.0)
                    },
                    "feedRates": {
                        "average": {
                            "fpm": 16.0  # Simple calculation: 1.0 * 10.0 * (12/60) * 8
                        },
                        "min": {
                            "fpm": 8.0
                        },
                        "max": {
                            "fpm": 32.0
                        }
                    }
                },
                "strUtility": {
                    "straightener": {
                        "horsepower": 5.0,
                        "feedRate": 50.0
                    }
                }
            },
            "generatedSections": ["rfq", "material-specs", "str-utility"],
            "metadata": {
                "timestamp": "2025-09-25T00:00:00Z",
                "version": "1.0"
            }
        }
        
        print(json.dumps(output, indent=2))
        
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e),
            "autoFillValues": None,
            "generatedSections": [],
            "metadata": {
                "timestamp": "2025-09-25T00:00:00Z",
                "version": "1.0"
            }
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
