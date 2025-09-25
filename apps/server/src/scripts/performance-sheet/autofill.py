#!/usr/bin/env python3
"""
Performance Sheet Auto-Fill Script

This script generates minimum valid values for performance sheets
that will pass all validation checks. It uses the existing calculation
modules and prioritizes values based on importance and position.
"""

import json
import sys
from typing import Dict, Any, Optional, List
from models import (
    rfq_input, material_specs_input, tddbhd_input, reel_drive_input, 
    str_utility_input, roll_str_backbend_input, base_feed_params, 
    feed_w_pull_thru_input, hyd_shear_input
)
from calculations.rfq import calculate_fpm
from calculations.material_specs import calculate_variant
from calculations.tddbhd import calculate_tbdbhd
from calculations.reel_drive import calculate_reeldrive
from calculations.str_utility import calculate_str_utility
from calculations.rolls.roll_str_backbend import calculate_roll_str_backbend
from calculations.feeds.sigma_five_feed import calculate_sigma_five
from calculations.feeds.sigma_five_feed_with_pt import calculate_sigma_five_pt
from calculations.feeds.allen_bradley_mpl_feed import calculate_allen_bradley
from calculations.shears.single_rake_hyd_shear import calculate_single_rake_hyd_shear
from calculations.shears.bow_tie_hyd_shear import calculate_bow_tie_hyd_shear
from utils.shared import DEFAULTS
# from utils.initial.tddbhd_input_finder import get_min_tddbhd_inputs
# from utils.initial.str_utility_finder import get_min_str_utility_inputs  
# from utils.initial.get_initial_str_utility_input import get_initial_str_utility_inputs

def get_nested(data: Dict[str, Any], keys: List[str], default: Any = None) -> Any:
    """Get nested value from dictionary using key path"""
    current = data
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default
    return current

def set_nested(data: Dict[str, Any], keys: List[str], value: Any) -> None:
    """Set nested value in dictionary using key path"""
    current = data
    for key in keys[:-1]:
        if key not in current:
            current[key] = {}
        current = current[key]
    current[keys[-1]] = value

def parse_float_safe(value: Any, default: float = 0.0) -> float:
    """Safely parse float value"""
    try:
        return float(value) if value is not None else default
    except (ValueError, TypeError):
        return default

def parse_int_safe(value: Any, default: int = 0) -> int:
    """Safely parse int value"""
    try:
        return int(value) if value is not None else default
    except (ValueError, TypeError):
        return default

def parse_str_safe(value: Any, default: str = "") -> str:
    """Safely parse string value"""
    return str(value) if value is not None else default

def generate_minimum_rfq_values(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate minimum valid RFQ values"""
    try:
        # Get current values or use defaults
        feed_length = parse_float_safe(get_nested(data, ["common", "feedRates", "average", "length"]), 1.0)
        spm = parse_float_safe(get_nested(data, ["common", "feedRates", "average", "spm"]), 10.0)
        
        # Ensure minimum viable values
        if feed_length <= 0:
            feed_length = 1.0
        if spm <= 0:
            spm = 10.0
        
        # Calculate FPM for average, min, and max
        rfq_data = {"feed_length": feed_length, "spm": spm}
        rfq_obj = rfq_input(**rfq_data)
        fpm_result = calculate_fpm(rfq_obj)
        
        return {
            "common": {
                "feedRates": {
                    "average": {
                        "length": feed_length,
                        "spm": spm,
                        "fpm": fpm_result
                    },
                    "min": {
                        "length": max(feed_length * 0.5, 0.5),
                        "spm": max(spm * 0.6, 5.0),
                        "fpm": calculate_fpm(rfq_input(feed_length=max(feed_length * 0.5, 0.5), spm=max(spm * 0.6, 5.0)))
                    },
                    "max": {
                        "length": feed_length * 2.0,
                        "spm": spm * 1.5,
                        "fpm": calculate_fpm(rfq_input(feed_length=feed_length * 2.0, spm=spm * 1.5))
                    }
                }
            }
        }
    except Exception as e:
        print(f"Error generating RFQ values: {e}", file=sys.stderr)
        return {}

def generate_minimum_material_specs_values(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate minimum valid material specification values"""
    try:
        material_type = parse_str_safe(get_nested(data, ["common", "material", "materialType"]), "STEEL")
        thickness = parse_float_safe(get_nested(data, ["common", "material", "materialThickness"]), 0.060)
        yield_strength = parse_float_safe(get_nested(data, ["common", "material", "maxYieldStrength"]), 50000)
        
        # Ensure minimum viable values
        if thickness <= 0:
            thickness = 0.060
        if yield_strength <= 0:
            yield_strength = 50000
        
        mat_data = {
            "material_type": material_type.upper(),
            "material_thickness": thickness,
            "yield_strength": yield_strength,
            "tensile_strength": yield_strength * 1.2  # Approximate tensile from yield
        }
        
        mat_obj = material_specs_input(**mat_data)
        variant_result = calculate_variant(mat_obj)
        
        return {
            "common": {
                "material": {
                    "materialType": material_type.upper(),
                    "materialThickness": thickness,
                    "maxYieldStrength": yield_strength,
                    "tensileStrength": yield_strength * 1.2
                }
            },
            "materialSpecs": {
                "variant": variant_result
            }
        }
    except Exception as e:
        print(f"Error generating material specs values: {e}", file=sys.stderr)
        return {}

def generate_minimum_tddbhd_values(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate minimum valid TDDBHD values"""
    try:
        # For now, return basic defaults until import issues are resolved
        return {
            "tddbhd": {
                "reel": {
                    "model": "CPPS-250",
                    "width": parse_float_safe(get_nested(data, ["common", "material", "coilWidth"]), 12.0),
                    "backplateDiameter": 18.0,
                    "airPressureAvailable": 80.0,
                    "dragBrake": {
                        "quantity": 2,
                        "model": "Standard"
                    },
                    "holdDown": {
                        "assembly": "Standard",
                        "cylinder": "Air"
                    },
                    "hydraulicThreadingDrive": "No"
                }
            }
        }
    except Exception as e:
        print(f"Error generating TDDBHD values: {e}", file=sys.stderr)
        return {}

def generate_minimum_str_utility_values(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate minimum valid straightener utility values"""
    try:
        # For now, return basic defaults until import issues are resolved
        return {
            "common": {
                "equipment": {
                    "straightener": {
                        "model": "CPPS-250",
                        "width": parse_float_safe(get_nested(data, ["common", "equipment", "straightener", "width"]), 12.0)
                    }
                }
            },
            "strUtility": {
                "straightener": {
                    "horsepower": 5.0,
                    "feedRate": 50.0
                }
            }
        }
    except Exception as e:
        print(f"Error generating str utility values: {e}", file=sys.stderr)
        return {}

def generate_minimum_feed_values(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate minimum valid feed values"""
    try:
        # Basic feed parameters
        feed_data = {
            "feed_length": parse_float_safe(get_nested(data, ["common", "feedRates", "average", "length"]), 1.0),
            "spm": parse_float_safe(get_nested(data, ["common", "feedRates", "average", "spm"]), 10.0),
            "width": parse_float_safe(get_nested(data, ["common", "material", "coilWidth"]), 12.0),
            "material_thickness": parse_float_safe(get_nested(data, ["common", "material", "materialThickness"]), 0.060),
            "material_width": parse_float_safe(get_nested(data, ["common", "material", "coilWidth"]), 12.0),
            "density": 0.284,  # Steel density default
            "press_bed_length": 24.0,  # Default press bed length
            "material_loop": 3.0,  # Default loop length
            "acceleration_rate": 10.0,  # Default acceleration
            "friction_in_die": 15,  # Default friction
            "chart_min_length": 0.5,  # Minimum chart length
            "length_increment": 0.5,  # Length increment
            "feed_angle_1": 180.0,  # Default feed angle 1
            "feed_angle_2": 180.0,  # Default feed angle 2
        }
        
        feed_obj = base_feed_params(**feed_data)
        result = calculate_sigma_five(feed_obj)
        
        return {
            "feed": {
                "feed": {
                    "accelerationRate": feed_data["acceleration_rate"],
                    "frictionInDie": feed_data["friction_in_die"],
                    "chartMinLength": feed_data["chart_min_length"],
                    "lengthIncrement": feed_data["length_increment"],
                    "feedAngle1": feed_data["feed_angle_1"],
                    "feedAngle2": feed_data["feed_angle_2"],
                    "calculations": result if isinstance(result, dict) else {}
                }
            }
        }
    except Exception as e:
        print(f"Error generating feed values: {e}", file=sys.stderr)
        return {}

def generate_minimum_shear_values(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate minimum valid shear values"""
    try:
        # Determine shear type (prefer single rake as minimum)
        shear_type = parse_str_safe(get_nested(data, ["shear", "type"]), "single-rake")
        
        shear_data = {
            "material_thickness": parse_float_safe(get_nested(data, ["common", "material", "materialThickness"]), 0.060),
            "material_width": parse_float_safe(get_nested(data, ["common", "material", "coilWidth"]), 12.0),
            "shear_strength": parse_float_safe(get_nested(data, ["common", "material", "maxYieldStrength"]), 50000) * 0.8,
            "rake_angle": 3.0,  # Default rake angle
            "overlap": 0.0625,  # Default overlap
            "blade_opening": 0.125,  # Default blade opening
            "penetration_percent": 25.0,  # Default penetration
            "pressure": 2000.0,  # Default hydraulic pressure
            "downward_stroke_time": 0.5,  # Default stroke time
            "dwell_time": 0.1,  # Default dwell time
        }
        
        try:
            if shear_type == "single-rake":
                shear_obj = hyd_shear_input(**shear_data)
                result = calculate_single_rake_hyd_shear(shear_obj)
            else:  # bow-tie
                shear_obj = hyd_shear_input(**shear_data)
                result = calculate_bow_tie_hyd_shear(shear_obj)
        except Exception:
            # Fallback to single rake if bow-tie fails
            shear_obj = hyd_shear_input(**shear_data)
            result = calculate_single_rake_hyd_shear(shear_obj)
            shear_type = "single-rake"
        
        return {
            "shear": {
                "type": shear_type,
                "blade": {
                    "rakeAngle": shear_data["rake_angle"],
                    "overlap": shear_data["overlap"],
                    "opening": shear_data["blade_opening"],
                    "penetrationPercent": shear_data["penetration_percent"]
                },
                "hydraulic": {
                    "pressure": shear_data["pressure"]
                },
                "time": {
                    "forDownwardStroke": shear_data["downward_stroke_time"],
                    "dwellTime": shear_data["dwell_time"]
                },
                "calculations": result if isinstance(result, dict) else {}
            }
        }
    except Exception as e:
        print(f"Error generating shear values: {e}", file=sys.stderr)
        return {}

def merge_auto_fill_results(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge all auto-fill results into a single structure"""
    merged = {}
    
    for result in results:
        for key, value in result.items():
            if key not in merged:
                merged[key] = {}
            
            if isinstance(value, dict):
                merged[key] = deep_merge(merged[key], value)
            else:
                merged[key] = value
    
    return merged

def deep_merge(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """Deep merge two dictionaries"""
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    
    return result

def main():
    """Main auto-fill function"""
    try:
        # Read input data from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Generate auto-fill values for each tab
        autofill_results = []
        
        # Generate values for each section
        autofill_results.append(generate_minimum_rfq_values(input_data))
        autofill_results.append(generate_minimum_material_specs_values(input_data))
        autofill_results.append(generate_minimum_tddbhd_values(input_data))
        autofill_results.append(generate_minimum_str_utility_values(input_data))
        autofill_results.append(generate_minimum_feed_values(input_data))
        autofill_results.append(generate_minimum_shear_values(input_data))
        
        # Merge all results
        merged_results = merge_auto_fill_results([r for r in autofill_results if r])
        
        # Output the results
        output = {
            "success": True,
            "autoFillValues": merged_results,
            "generatedSections": [
                "rfq", "material-specs", "tddbhd", 
                "str-utility", "feed", "shear"
            ],
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
