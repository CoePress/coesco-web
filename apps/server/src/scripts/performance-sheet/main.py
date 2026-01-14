import json
import argparse
import sys
from models import (
    rfq_input, material_specs_input, tddbhd_input, reel_drive_input, str_utility_input, roll_str_backbend_input,
    base_feed_params, feed_w_pull_thru_input, hyd_shear_input
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
from utils.feed_controls_mapping import map_controls_level_to_feed_controls, get_default_feed_model_for_controls

# --- Helper functions ---
def str2bool(val):
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return bool(val)
    if val is None:
        return None
    return str(val).strip().lower() in ("yes", "true", "1", "y")

def get_nested(d, keys, default=None):
    """Get nested value from dict."""
    for k in keys:
        if isinstance(d, dict) and k in d:
            d = d[k]
        elif isinstance(d, list) and isinstance(k, int) and 0 <= k < len(d):
            d = d[k]
        else:
            return default
    return d

def get_scenario_value(data, section, scenario_idx, field_name, default=None, fallback_to_shared=True):
    """
    Get a value from a scenario, handling both nested arrays and flattened bracket notation.
    Example: get_scenario_value(data, "materialSpecs", 0, "yieldStrength")
    Checks both data[section]["scenarios"][idx][field] and data[section]["scenarios[idx]"][field]
    Supports dot-notation in field_name like "reel.holddown.cylinder"
    If fallback_to_shared=True, will check data[section][field_parts] if scenario value is None
    """
    # Parse field_name for dot notation
    field_parts = field_name.split('.')
    
    # Try nested array first - navigate through all field parts
    path = [section, "scenarios", scenario_idx] + field_parts
    val = get_nested(data, path)
    if val is not None:
        return val
    
    # Try flattened bracket notation
    section_data = get_nested(data, [section], {})
    if isinstance(section_data, dict):
        bracket_key = f"scenarios[{scenario_idx}]"
        if bracket_key in section_data:
            scenario_data = section_data[bracket_key]
            # Navigate through field parts
            val = get_nested(scenario_data, field_parts)
            if val is not None:
                return val
    
    # Fall back to shared location if requested
    if fallback_to_shared:
        shared_val = get_nested(data, [section] + field_parts)
        if shared_val is not None:
            return shared_val
    
    return default

def parse_float(val, default=None):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default

def parse_int(val, default=None):
    try:
        return int(val)
    except (TypeError, ValueError):
        return default

def parse_str(val, default=None):
    if val is None:
        return default
    return str(val)

def get_with_default(data, keys, default_category, default_key):
    """Get nested value with fallback to centralized default"""
    value = get_nested(data, keys)
    if value is None:
        return DEFAULTS[default_category][default_key]
    return value

def parse_float_with_default(data, keys, default_category, default_key):
    """Parse float with fallback to centralized default"""
    value = get_nested(data, keys)
    parsed = parse_float(value)
    if parsed is None:
        return DEFAULTS[default_category][default_key]
    return parsed

def parse_int_with_default(data, keys, default_category, default_key):
    """Parse int with fallback to centralized default"""
    value = get_nested(data, keys)
    parsed = parse_int(value)
    if parsed is None:
        return DEFAULTS[default_category][default_key]
    return parsed

def parse_str_with_default(data, keys, default_category, default_key):
    """Parse string with fallback to centralized default"""
    value = get_nested(data, keys)
    if value is None:
        return DEFAULTS[default_category][default_key]
    return str(value)

def parse_boolean_with_default(data, keys, default_category, default_key):
    """Parse boolean with fallback to centralized default"""
    value = get_nested(data, keys)
    if value is None:
        return DEFAULTS[default_category][default_key]
    return bool(value)

def get_material_scenarios(data):
    """
    Extract material scenarios from data.
    Returns a list of scenario dicts with all material properties.
    Handles both nested arrays and flattened bracket notation keys.
    If materialScenarios doesn't exist, creates one from legacy material data.
    
    Note: coilWeight, coilOD, coilID, reqMaxFPM are shared across all scenarios from common.coil.*
    Only materialThickness, materialWidth, materialType, maxYieldStrength, maxTensileStrength are scenario-specific.
    """
    material_scenarios = []
    common_data = get_nested(data, ["common"], {})
    
    # Get common fields that are shared across all scenarios
    common_coil_weight = parse_float_with_default(data, ["common", "coil", "maxCoilWeight"], "material", "max_coil_weight")
    common_coil_od = parse_float_with_default(data, ["common", "coil", "maxCoilOD"], "material", "max_coil_od")
    common_coil_id = parse_float_with_default(data, ["common", "coil", "coilID"], "material", "coil_id")
    common_req_max_fpm = parse_float_with_default(data, ["common", "feedRates", "max", "fpm"], "feed", "rate")
    
    # Check for nested array structure first
    scenarios_array = get_nested(data, ["common", "materialScenarios"], None)
    if scenarios_array and isinstance(scenarios_array, list) and len(scenarios_array) > 0:
        for scenario in scenarios_array:
            # Add common fields to each scenario
            scenario["coilWeight"] = scenario.get("coilWeight", common_coil_weight)
            scenario["coilOD"] = scenario.get("coilOD", common_coil_od)
            scenario["coilID"] = scenario.get("coilID", common_coil_id)
            scenario["reqMaxFPM"] = scenario.get("reqMaxFPM", common_req_max_fpm)
            material_scenarios.append(scenario)
    else:
        # Check for flattened bracket notation keys like "materialScenarios[0]"
        for i in range(10):  # Support up to 10 scenarios
            scenario_key = f"materialScenarios[{i}]"
            if scenario_key in common_data:
                scenario_data = common_data[scenario_key]
                if scenario_data:
                    # Ensure scenarioId exists
                    if "scenarioId" not in scenario_data:
                        scenario_data["scenarioId"] = i + 1
                    # Add common fields
                    scenario_data["coilWeight"] = scenario_data.get("coilWeight", common_coil_weight)
                    scenario_data["coilOD"] = scenario_data.get("coilOD", common_coil_od)
                    scenario_data["coilID"] = scenario_data.get("coilID", common_coil_id)
                    scenario_data["reqMaxFPM"] = scenario_data.get("reqMaxFPM", common_req_max_fpm)
                    material_scenarios.append(scenario_data)
    
    # If no scenarios exist, create one from legacy data for backward compatibility
    if not material_scenarios or len(material_scenarios) == 0:
        legacy_scenario = {
            "scenarioId": 1,
            "label": "Primary Material",
            "materialThickness": parse_float_with_default(data, ["common", "material", "materialThickness"], "material", "material_thickness"),
            "materialWidth": parse_float_with_default(data, ["common", "material", "coilWidth"], "material", "coil_width"),
            "materialType": parse_str_with_default(data, ["common", "material", "materialType"], "material", "material_type"),
            "maxYieldStrength": parse_float_with_default(data, ["common", "material", "maxYieldStrength"], "material", "max_yield_strength"),
            "maxTensileStrength": parse_float(get_nested(data, ["common", "material", "maxTensileStrength"])),
            "coilWeight": common_coil_weight,
            "coilOD": common_coil_od,
            "coilID": common_coil_id,
            "reqMaxFPM": common_req_max_fpm,
        }
        material_scenarios = [legacy_scenario]
    
    return material_scenarios

# --- Main mapping and calculation logic ---
def main():
    try:
        # Try to read from stdin first, then fall back to command line arguments
        if not sys.stdin.isatty():
            # Data is being piped in via stdin
            try:
                stdin_data = sys.stdin.read()
                data = json.loads(stdin_data)
                if "data" in data and isinstance(data["data"], dict):
                    data = data["data"]
            except json.JSONDecodeError as e:
                print(f"Error: Invalid JSON data from stdin: {e}", file=sys.stderr)
                sys.exit(1)
        else:
            # Fall back to command line arguments
            parser = argparse.ArgumentParser(description="COE Performance Sheet JSON Calculator")
            parser.add_argument("--json", type=str, required=True, help="JSON data as string")
            args = parser.parse_args()
            
            try:
                data = json.loads(args.json)
            except json.JSONDecodeError as e:
                parser.error(f"Invalid JSON data: {e}")

        # --- COMPREHENSIVE DATA LOGGING ---
        print("=" * 80, file=sys.stderr)
        print("=== COMPLETE INCOMING DATA STRUCTURE ===", file=sys.stderr)
        print(json.dumps(data, indent=2, default=str), file=sys.stderr)
        print("=" * 80, file=sys.stderr)

        # --- RFQ (calculate for average, min, and max) ---
        try:
            rfq_average_data = {
                "feed_length": parse_float_with_default(data, ["common", "feedRates", "average", "length"], "feed", "rate"),
                "spm": parse_float_with_default(data, ["common", "feedRates", "average", "spm"], "feed", "rate"),
            }
            rfq_min_data = {
                "feed_length": parse_float_with_default(data, ["common", "feedRates", "min", "length"], "feed", "rate"),
                "spm": parse_float_with_default(data, ["common", "feedRates", "min", "spm"], "feed", "rate"),
            }
            rfq_max_data = {
                "feed_length": parse_float_with_default(data, ["common", "feedRates", "max", "length"], "feed", "rate"),
                "spm": parse_float_with_default(data, ["common", "feedRates", "max", "spm"], "feed", "rate"),
            }

            rfq_average_obj = rfq_input(**rfq_average_data)
            rfq_min_obj = rfq_input(**rfq_min_data)
            rfq_max_obj = rfq_input(**rfq_max_data)
            
            rfq_result = {
                "average": calculate_fpm(rfq_average_obj),
                "min": calculate_fpm(rfq_min_obj),
                "max": calculate_fpm(rfq_max_obj)
            }
        except Exception as e:
            print(f"Error in RFQ calculation: {e}", file=sys.stderr)
            rfq_result = {"error": str(e)}
        
        # --- Material Specs (Loop through all scenarios) ---
        mat_specs_scenarios = []
        material_scenarios = get_material_scenarios(data)
        
        for idx, scenario in enumerate(material_scenarios):
            try:
                # Get user-inputted yield strength from materialSpecs.scenarios if it exists
                user_yield_strength = parse_float(
                    get_scenario_value(data, "materialSpecs", idx, "yieldStrength")
                )
                # Fall back to maxYieldStrength from scenario if not provided
                if user_yield_strength is None:
                    user_yield_strength = parse_float(scenario.get("maxYieldStrength", 0))
                
                mat_data = {
                    "material_type": parse_str(scenario.get("materialType"), DEFAULTS["material"]["material_type"]),
                    "material_thickness": parse_float(scenario.get("materialThickness"), DEFAULTS["material"]["material_thickness"]),
                    "yield_strength": user_yield_strength,
                    "coil_width": parse_float(scenario.get("materialWidth"), DEFAULTS["material"]["coil_width"]),
                    "coil_weight": parse_float(scenario.get("coilWeight"), DEFAULTS["material"]["max_coil_weight"]),
                    "coil_id": parse_float(scenario.get("coilID"), DEFAULTS["material"]["coil_id"]),
                    "feed_direction": parse_str_with_default(data, ["common", "equipment", "feed", "direction"], "feed", "direction"),
                    "controls_level": parse_str_with_default(data, ["common", "equipment", "feed", "controlsLevel"], "feed", "controls_level"),
                    "type_of_line": parse_str_with_default(data, ["common", "equipment", "feed", "typeOfLine"], "feed", "type_of_line"),
                    "feed_controls": parse_str_with_default(data, ["common", "equipment", "feed", "controls"], "feed", "controls"),
                    "passline": parse_float_with_default(data, ["common", "equipment", "feed", "passline"], "feed", "passline"),
                    "selected_roll": None,
                    "reel_backplate": parse_float_with_default(data, ["common", "equipment", "reel", "backplate", "diameter"], "reel", "backplate_diameter"),
                    "reel_style": parse_str_with_default(data, ["materialSpecs", "reel", "style"], "reel", "style"),
                    "light_gauge_non_marking": str2bool(get_nested(data, ["common", "equipment", "feed", "lightGuageNonMarking"])) or DEFAULTS["feed"]["light_gauge_non_marking"],
                    "non_marking": str2bool(get_nested(data, ["common", "equipment", "feed", "nonMarking"])) or DEFAULTS["feed"]["non_marking"],
                }
                mat_obj = material_specs_input(**mat_data)
                mat_result = calculate_variant(mat_obj)
                
                # Add scenario ID to result
                mat_result["scenarioId"] = idx + 1
                mat_specs_scenarios.append(mat_result)
            except Exception as e:
                print(f"Error in Material Specs calculation for scenario {idx + 1}: {e}", file=sys.stderr)
                mat_specs_scenarios.append({"scenarioId": idx + 1, "error": str(e)})
        
        mat_result = {"scenarios": mat_specs_scenarios}


        # Map controls level to feed controls if controls level is provided
        controls_level = get_nested(data, ["common", "equipment", "feed", "controlsLevel"])
        if controls_level:
            calculated_feed_controls = map_controls_level_to_feed_controls(controls_level)
            default_feed_model = get_default_feed_model_for_controls(controls_level)
            
            # Update the data structure with calculated values
            if "common" not in data:
                data["common"] = {}
            if "equipment" not in data["common"]:
                data["common"]["equipment"] = {}
            if "feed" not in data["common"]["equipment"]:
                data["common"]["equipment"]["feed"] = {}
            
            # Set the calculated feed controls
            data["common"]["equipment"]["feed"]["controls"] = calculated_feed_controls
            
            # Set default model if not already set
            if not get_nested(data, ["common", "equipment", "feed", "model"]):
                data["common"]["equipment"]["feed"]["model"] = default_feed_model

        # --- Reel Drive ---
        try:
            # Get material scenarios for reel drive (use first scenario)
            material_scenarios_for_reel = get_material_scenarios(data)
            first_scenario = material_scenarios_for_reel[0] if material_scenarios_for_reel else {}
            
            reel_drive_data = {
                "model": parse_str_with_default(data, ["common", "equipment", "reel", "model"], "reel", "model"),
                "material_type": (parse_str(first_scenario.get("materialType")) or DEFAULTS["material"]["material_type"]).upper(),
                "coil_id": parse_float_with_default(data, ["common", "coil", "coilID"], "material", "coil_id"),
                "coil_od": parse_float_with_default(data, ["common", "coil", "maxCoilOD"], "material", "max_coil_od"),
                "reel_width": parse_float_with_default(data, ["common", "equipment", "reel", "width"], "reel", "width"),
                "backplate_diameter": parse_float_with_default(data, ["common", "equipment", "reel", "backplate", "diameter"], "reel", "backplate_diameter"),
                "motor_hp": parse_float_with_default(data, ["common", "equipment", "reel", "horsepower"], "reel", "horsepower"),
                "type_of_line": parse_str_with_default(data, ["common", "equipment", "feed", "typeOfLine"], "feed", "type_of_line"),
                "required_max_fpm": parse_float(first_scenario.get("reqMaxFPM")) or parse_float_with_default(data, ["common", "feedRates", "max", "fpm"], "feed", "rate"),
            }
            reel_drive_obj = reel_drive_input(**reel_drive_data)
            reel_drive_result = calculate_reeldrive(reel_drive_obj)
        except Exception as e:
            print(f"Error in Reel Drive calculation: {e}", file=sys.stderr)
            reel_drive_result = {"error": str(e)}

        # --- TDDBHD (Loop through all 4 scenarios) ---
        tddbhd_scenarios = []
        
        for idx, scenario in enumerate(material_scenarios):
            try:
                print(f"=== STARTING TDDBHD SCENARIO {idx + 1} ===", file=sys.stderr)
                
                # Get reel model first to determine family-specific constraints
                reel_model = parse_str_with_default(data, ["common", "equipment", "reel", "model"], "reel", "model")
                print(f"Reel model: {reel_model}", file=sys.stderr)
                
                # Get scenario-specific TDDBHD values with fallbacks to shared values
                cylinder_value = (
                    get_scenario_value(data, "tddbhd", idx, "reel.holddown.cylinder") or
                    parse_str_with_default(data, ["tddbhd", "reel", "holddown", "cylinder"], "reel", "holddown_cylinder")
                )
                print(f"DEBUG: Cylinder value for scenario {idx}: scenario={get_scenario_value(data, 'tddbhd', idx, 'reel.holddown.cylinder')}, shared={parse_str_with_default(data, ['tddbhd', 'reel', 'holddown', 'cylinder'], 'reel', 'holddown_cylinder')}, final={cylinder_value}", file=sys.stderr)
                
                holddown_assy_value = (
                    get_scenario_value(data, "tddbhd", idx, "reel.holddown.assy") or
                    parse_str_with_default(data, ["tddbhd", "reel", "holddown", "assy"], "reel", "holddown_assy")
                )
                print(f"DEBUG: Holddown assy value for scenario {idx}: scenario={get_scenario_value(data, 'tddbhd', idx, 'reel.holddown.assy')}, shared={parse_str_with_default(data, ['tddbhd', 'reel', 'holddown', 'assy'], 'reel', 'holddown_assy')}, final={holddown_assy_value}", file=sys.stderr)
                air_pressure = (
                    parse_float(get_scenario_value(data, "tddbhd", idx, "reel.airPressureAvailable")) or
                    parse_float_with_default(data, ["tddbhd", "reel", "airPressureAvailable"], "reel", "air_pressure_available")
                )
                brake_model_value = (
                    get_scenario_value(data, "tddbhd", idx, "reel.dragBrake.model") or
                    parse_str_with_default(data, ["tddbhd", "reel", "dragBrake", "model"], "reel", "drag_brake_model")
                )
                brake_qty_value = (
                    parse_int(get_scenario_value(data, "tddbhd", idx, "reel.dragBrake.quantity")) or
                    parse_int_with_default(data, ["tddbhd", "reel", "dragBrake", "quantity"], "reel", "drag_brake_quantity")
                )
                friction_value = (
                    parse_float(get_scenario_value(data, "tddbhd", idx, "reel.coefficientOfFriction")) or
                    parse_float_with_default(data, ["tddbhd", "reel", "coefficientOfFriction"], "reel", "coefficient_of_friction")
                )
                decel_value = (
                    parse_float(get_scenario_value(data, "tddbhd", idx, "reel.requiredDecelRate")) or
                    parse_float_with_default(data, ["tddbhd", "reel", "requiredDecelRate"], "reel", "required_decel_rate")
                )
                confirmed_min_width_value = (
                    parse_boolean(get_scenario_value(data, "tddbhd", idx, "reel.confirmedMinWidth")) 
                    if get_scenario_value(data, "tddbhd", idx, "reel.confirmedMinWidth") is not None 
                    else parse_boolean_with_default(data, ["tddbhd", "reel", "confirmedMinWidth"], "reel", "confirmed_min_width")
                )
                
                # Force correct parameters for CPR-040 (D1 family) - only supports air_clutch="No"
                if reel_model == "CPR-040":
                    air_clutch_value = "No"
                    hyd_threading_drive_value = "None"
                else:
                    # Try scenario-specific values first, then fall back to shared values
                    air_clutch_scenario = get_scenario_value(data, "tddbhd", idx, "reel.threadingDrive.airClutch")
                    if air_clutch_scenario:
                        air_clutch_bool = str2bool(air_clutch_scenario)
                    else:
                        air_clutch_bool = str2bool(get_nested(data, ["tddbhd", "reel", "threadingDrive", "airClutch"])) or DEFAULTS["reel"]["threading_drive_air_clutch"]
                    air_clutch_value = "Yes" if air_clutch_bool else "No"
                    
                    hyd_threading_drive_value = (
                        get_scenario_value(data, "tddbhd", idx, "reel.threadingDrive.hydThreadingDrive") or
                        parse_str_with_default(data, ["tddbhd", "reel", "threadingDrive", "hydThreadingDrive"], "reel", "threading_drive_hyd")
                    )
                
                # Parse critical values from scenario data
                material_thickness = parse_float(scenario.get("materialThickness"), DEFAULTS["material"]["material_thickness"])
                coil_width = parse_float(scenario.get("materialWidth"), DEFAULTS["material"]["coil_width"])
                coil_id = parse_float(scenario.get("coilID"), DEFAULTS["material"]["coil_id"])
                
                # Get yield strength from materialSpecs scenario if available, otherwise from scenario
                user_yield_strength = parse_float(
                    get_scenario_value(data, "materialSpecs", idx, "yieldStrength")
                )
                if user_yield_strength is None:
                    user_yield_strength = parse_float(scenario.get("maxYieldStrength"), DEFAULTS["material"]["yield_strength"])
                
                print(f"Scenario {idx + 1} - Material thickness: {material_thickness}, Width: {coil_width}, Yield: {user_yield_strength}", file=sys.stderr)
                print(f"Scenario {idx + 1} - Cylinder: {cylinder_value}, Holddown: {holddown_assy_value}, Brake: {brake_model_value}", file=sys.stderr)
                
                tddbhd_data = {
                    "type_of_line": parse_str_with_default(data, ["common", "equipment", "feed", "typeOfLine"], "feed", "type_of_line"),
                    "reel_drive_tqempty": None,
                    "motor_hp": parse_float_with_default(data, ["common", "equipment", "reel", "horsepower"], "reel", "horsepower"),
                    "yield_strength": user_yield_strength,
                    "thickness": material_thickness,
                    "width": coil_width,
                    "coil_id": coil_id,
                    "coil_od": parse_float(scenario.get("coilOD"), DEFAULTS["material"]["max_coil_od"]),
                    "coil_weight": parse_float(scenario.get("coilWeight"), DEFAULTS["material"]["coil_weight"]),
                    "confirmed_min_width": confirmed_min_width_value,
                    "decel": decel_value,
                    "friction": friction_value,
                    "air_pressure": air_pressure,
                    "brake_qty": brake_qty_value,
                    "brake_model": brake_model_value,
                    "cylinder": cylinder_value,
                    "hold_down_assy": holddown_assy_value,
                    "hyd_threading_drive": hyd_threading_drive_value,
                    "air_clutch": air_clutch_value,
                    "material_type": (parse_str(scenario.get("materialType"), DEFAULTS["material"]["material_type"])).upper(),
                    "reel_model": reel_model,
                    "reel_width": parse_float_with_default(data, ["common", "equipment", "reel", "width"], "reel", "width"),
                    "backplate_diameter": parse_float_with_default(data, ["common", "equipment", "reel", "backplate", "diameter"], "reel", "backplate_diameter"),
                }
                
                tddbhd_obj = tddbhd_input(**tddbhd_data)
                tddbhd_scenario_result = calculate_tbdbhd(tddbhd_obj)
                
                # Check if calculation returned an error string
                if isinstance(tddbhd_scenario_result, str):
                    print(f"TDDBHD Scenario {idx + 1} calculation returned error: {tddbhd_scenario_result}", file=sys.stderr)
                    tddbhd_scenarios.append({"scenarioId": idx + 1, "error": tddbhd_scenario_result})
                elif isinstance(tddbhd_scenario_result, dict):
                    tddbhd_scenario_result["scenarioId"] = idx + 1
                    tddbhd_scenarios.append(tddbhd_scenario_result)
                    print(f"TDDBHD Scenario {idx + 1} completed successfully", file=sys.stderr)
                else:
                    print(f"TDDBHD Scenario {idx + 1} returned unexpected type: {type(tddbhd_scenario_result)}", file=sys.stderr)
                    tddbhd_scenarios.append({"scenarioId": idx + 1, "error": "Unexpected result type"})
                
            except Exception as e:
                print(f"Error in TDDBHD calculation for scenario {idx + 1}: {e}", file=sys.stderr)
                import traceback
                print(f"Full error traceback: {traceback.format_exc()}", file=sys.stderr)
                tddbhd_scenarios.append({"scenarioId": idx + 1, "error": str(e)})
        
        tddbhd_result = {"scenarios": tddbhd_scenarios}

        # --- Roll Str Backbend (Loop through all 4 scenarios) ---
        roll_str_backbend_scenarios = []
        
        for idx, scenario in enumerate(material_scenarios):
            try:
                # Get user-inputted yield strength from materialSpecs scenario if available
                user_yield_strength = parse_float(
                    get_scenario_value(data, "materialSpecs", idx, "yieldStrength")
                )
                if user_yield_strength is None:
                    user_yield_strength = parse_float(scenario.get("maxYieldStrength"), DEFAULTS["material"]["yield_strength"])
                
                roll_str_backbend_data = {
                    "yield_strength": user_yield_strength,
                    "thickness": parse_float(scenario.get("materialThickness"), DEFAULTS["material"]["material_thickness"]),
                    "width": parse_float(scenario.get("materialWidth"), DEFAULTS["material"]["coil_width"]),
                    "material_type": (parse_str(scenario.get("materialType"), DEFAULTS["material"]["material_type"])).upper(),
                    "material_thickness": parse_float(scenario.get("materialThickness"), DEFAULTS["material"]["material_thickness"]),
                    "str_model": parse_str_with_default(data, ["common", "equipment", "straightener", "model"], "straightener", "model"),
                    "num_str_rolls": parse_int_with_default(data, ["common", "equipment", "straightener", "numberOfRolls"], "straightener", "number_of_rolls"),
                    "hidden_value": parse_float(get_nested(data, ["rollStrBackbend", "straightener", "rolls", "backbend", "hiddenValue"]), 9957.34211927781),
                }
                roll_str_backbend_obj = roll_str_backbend_input(**roll_str_backbend_data)
                roll_str_backbend_scenario_result = calculate_roll_str_backbend(roll_str_backbend_obj)
                roll_str_backbend_scenario_result["scenarioId"] = idx + 1
                roll_str_backbend_scenarios.append(roll_str_backbend_scenario_result)
                
            except Exception as e:
                print(f"Error in Roll Str Backbend calculation for scenario {idx + 1}: {e}", file=sys.stderr)
                roll_str_backbend_scenarios.append({"scenarioId": idx + 1, "error": str(e)})
        
        roll_str_backbend_result = {"scenarios": roll_str_backbend_scenarios}
        print(f"RAW ROLL STR BACKBEND CALCULATION RESULTS: {json.dumps(roll_str_backbend_scenarios, indent=2, default=str)}", file=sys.stderr)

        # Calculate yield_met based on roll str backbend result (using first scenario for now)
        try:
            from utils.shared import roll_str_backbend_state, get_percent_material_yielded_check
            percent_material_yielded = roll_str_backbend_state.get("percent_material_yielded", 0)
            confirm_check = False
            yield_met_status = get_percent_material_yielded_check(percent_material_yielded, confirm_check)
            print(f"YIELD_MET DEBUG: percent_material_yielded={percent_material_yielded}, yield_met_status={yield_met_status}", file=sys.stderr)
        except Exception as e:
            print(f"Error calculating yield_met: {e}", file=sys.stderr)
            yield_met_status = DEFAULTS.get("reel", {}).get("yield_met", "NOT OK")

        # --- Str Utility (Loop through all 4 scenarios) ---
        str_utility_scenarios = []
        
        for idx, scenario in enumerate(material_scenarios):
            try:
                # Get calculated coil OD from material specs for this scenario
                scenario_coil_od = parse_float(scenario.get("coilOD"), DEFAULTS["material"]["max_coil_od"])
                if mat_result and "scenarios" in mat_result and idx < len(mat_result["scenarios"]):
                    calc_od = mat_result["scenarios"][idx].get("coil_od_calculated")
                    if calc_od:
                        scenario_coil_od = calc_od
                
                # Get user-inputted yield strength from materialSpecs scenario if available
                user_yield_strength = parse_float(
                    get_scenario_value(data, "materialSpecs", idx, "yieldStrength")
                )
                if user_yield_strength is None:
                    user_yield_strength = parse_float(scenario.get("maxYieldStrength"), DEFAULTS["material"]["yield_strength"])
                
                # Get scenario-specific STR Utility values (horsepower, feed_rate, acceleration)
                # First try scenario-specific values, then fall back to shared values
                scenario_horsepower = parse_float(
                    get_scenario_value(data, "strUtility", idx, "straightener.horsepower")
                )
                if scenario_horsepower is None:
                    scenario_horsepower = parse_float_with_default(data, ["strUtility", "straightener", "horsepower"], "straightener", "horsepower")
                
                scenario_feed_rate = parse_float(
                    get_scenario_value(data, "strUtility", idx, "straightener.feedRate")
                )
                if scenario_feed_rate is None:
                    scenario_feed_rate = parse_float_with_default(data, ["strUtility", "straightener", "feedRate"], "feed", "rate")
                
                scenario_acceleration = parse_float(
                    get_scenario_value(data, "strUtility", idx, "straightener.acceleration")
                )
                if scenario_acceleration is None:
                    scenario_acceleration = parse_float_with_default(data, ["strUtility", "straightener", "acceleration"], "straightener", "acceleration")
                
                str_util_data = {
                    "max_coil_weight": parse_float(scenario.get("coilWeight"), DEFAULTS["material"]["max_coil_weight"]),
                    "coil_id": parse_float(scenario.get("coilID"), DEFAULTS["material"]["coil_id"]),
                    "coil_od": scenario_coil_od,
                    "coil_width": parse_float(scenario.get("materialWidth"), DEFAULTS["material"]["coil_width"]),
                    "material_thickness": parse_float(scenario.get("materialThickness"), DEFAULTS["material"]["material_thickness"]),
                    "yield_strength": user_yield_strength,
                    "material_type": (parse_str(scenario.get("materialType"), DEFAULTS["material"]["material_type"])).upper(),
                    "yield_met": yield_met_status,
                    "str_model": parse_str_with_default(data, ["common", "equipment", "straightener", "model"], "straightener", "model"),
                    "str_width": parse_float_with_default(data, ["common", "equipment", "straightener", "width"], "straightener", "width"),
                    "horsepower": scenario_horsepower,
                    "feed_rate": scenario_feed_rate,
                    "max_feed_rate": parse_float_with_default(data, ["common", "feedRates", "max", "fpm"], "max", "fpm"),
                    "auto_brake_compensation": parse_str_with_default(data, ["strUtility", "straightener", "autoBrakeCompensation"], "straightener", "auto_brake_compensation"),
                    "acceleration": scenario_acceleration,
                    "num_str_rolls": parse_int_with_default(data, ["common", "equipment", "straightener", "numberOfRolls"], "straightener", "number_of_rolls"),
                }
                str_util_obj = str_utility_input(**str_util_data)
                str_util_scenario_result = calculate_str_utility(str_util_obj)
                str_util_scenario_result["scenarioId"] = idx + 1
                str_utility_scenarios.append(str_util_scenario_result)
                
            except Exception as e:
                print(f"Error in Str Utility calculation for scenario {idx + 1}: {e}", file=sys.stderr)
                str_utility_scenarios.append({"scenarioId": idx + 1, "error": str(e)})
        
        str_util_result = {"scenarios": str_utility_scenarios}

        # --- Feed (Loop through first 2 scenarios only) ---
        feed_scenarios = []
        
        for idx in range(min(2, len(material_scenarios))):
            scenario = material_scenarios[idx]
            try:
                is_pull_thru = parse_str_with_default(data, ["feed", "feed", "pullThru", "isPullThru"], "feed", "pull_thru")
                feed_type = parse_str_with_default(data, ["common", "equipment", "feed", "type"], "feed", "type")
                material_type_upper = (parse_str(scenario.get("materialType"), DEFAULTS["material"]["material_type"])).upper()
                material_width_int = int(parse_float(scenario.get("materialWidth"), DEFAULTS["material"]["coil_width"]))
                material_thickness_val = parse_float(scenario.get("materialThickness"), DEFAULTS["material"]["material_thickness"])
                
                # Get user-inputted yield strength from materialSpecs scenario if available
                user_yield_strength = parse_float(
                    get_scenario_value(data, "materialSpecs", idx, "yieldStrength")
                )
                if user_yield_strength is None:
                    user_yield_strength = parse_float(scenario.get("maxYieldStrength"), DEFAULTS["material"]["yield_strength"])
                
                feed_scenario_result = None
                
                if "sigma" in feed_type and is_pull_thru.lower() == "yes":            
                    feed_data = {
                        "feed_type": feed_type,
                        "feed_model": parse_str_with_default(data, ["common", "equipment", "feed", "model"], "feed", "model"),
                        "width": parse_int_with_default(data, ["feed", "feed", "machineWidth"], "feed", "machine_width"),
                        "loop_pit": parse_str_with_default(data, ["common", "equipment","feed", "loopPit"], "feed", "loop_pit"),
                        "material_type": material_type_upper,
                        "application": parse_str_with_default(data, ["feed", "feed", "application"], "feed", "application"),
                        "type_of_line": parse_str_with_default(data, ["common", "equipment", "feed", "typeOfLine"], "feed", "type_of_line"),
                        "roll_width": parse_str_with_default(data, ["feed", "feed", "fullWidthRolls"], "feed", "roll_width"),
                        "feed_rate": parse_float_with_default(data, ["common", "feedRates", "average", "fpm"], "feed", "rate"),
                        "material_width": material_width_int,
                        "material_thickness": material_thickness_val,
                        "press_bed_length": parse_int_with_default(data, ["common", "press", "bedLength"], "press", "bed_length"),
                        # Scenario-aware input fields (check scenario location first, fall back to shared)
                        "friction_in_die": parse_float(get_scenario_value(data, "feed", idx, "feed.frictionInDie"), DEFAULTS["feed"]["friction_in_die"]),
                        "acceleration_rate": parse_float(get_scenario_value(data, "feed", idx, "feed.accelerationRate"), DEFAULTS["feed"]["acceleration_rate"]),
                        "chart_min_length": parse_float(get_scenario_value(data, "feed", idx, "feed.chartMinLength"), DEFAULTS["feed"]["chart_min_length"]),
                        "length_increment": parse_float(get_scenario_value(data, "feed", idx, "feed.lengthIncrement"), DEFAULTS["feed"]["length_increment"]),
                        "feed_angle_1": parse_float(get_scenario_value(data, "feed", idx, "feed.feedAngle1"), DEFAULTS["feed"]["feed_angle_1"]),
                        "feed_angle_2": parse_float(get_scenario_value(data, "feed", idx, "feed.feedAngle2"), DEFAULTS["feed"]["feed_angle_2"]),
                        "straightening_rolls": parse_int(get_scenario_value(data, "feed", idx, "feed.pullThru.straightenerRolls"), DEFAULTS["feed"]["straightening_rolls"]),
                        "yield_strength": user_yield_strength,
                        "str_pinch_rolls": parse_str(get_scenario_value(data, "feed", idx, "feed.pullThru.pinchRolls"), DEFAULTS["feed"]["pinch_rolls"]),
                        "req_max_fpm": parse_float(get_scenario_value(data, "feed", idx, "feed.strMaxSpeed"), DEFAULTS["feed"]["rate"]),
                    }
                    feed_obj = feed_w_pull_thru_input(**feed_data)
                    feed_scenario_result = calculate_sigma_five_pt(feed_obj)
                elif "sigma" in feed_type:
                    feed_data = {
                        "feed_type": feed_type,
                        "feed_model": parse_str_with_default(data, ["common", "equipment", "feed", "model"], "feed", "model"),
                        "width": parse_int_with_default(data, ["feed", "feed", "machineWidth"], "feed", "machine_width"),
                        "loop_pit": parse_str_with_default(data, ["common", "equipment", "feed", "loopPit"], "feed", "loop_pit"),
                        "material_type": material_type_upper,
                        "application": parse_str_with_default(data, ["feed", "feed", "application"], "feed", "application"),
                        "type_of_line": parse_str_with_default(data, ["common", "equipment", "feed", "typeOfLine"], "feed", "type_of_line"),
                        "roll_width": parse_str_with_default(data, ["feed", "feed", "fullWidthRolls"], "feed", "roll_width"),
                        "feed_rate": parse_float_with_default(data, ["feed", "feed", "strMaxSpeed"], "feed", "rate"),
                        "material_width": material_width_int,
                        "material_thickness": material_thickness_val,
                        "press_bed_length": parse_int_with_default(data, ["common", "press", "bedLength"], "press", "bed_length"),
                        # Scenario-aware input fields (check scenario location first, fall back to shared)
                        "friction_in_die": parse_float(get_scenario_value(data, "feed", idx, "feed.frictionInDie"), DEFAULTS["feed"]["friction_in_die"]),
                        "acceleration_rate": parse_float(get_scenario_value(data, "feed", idx, "feed.accelerationRate"), DEFAULTS["feed"]["acceleration_rate"]),
                        "chart_min_length": parse_float(get_scenario_value(data, "feed", idx, "feed.chartMinLength"), DEFAULTS["feed"]["chart_min_length"]),
                        "length_increment": parse_float(get_scenario_value(data, "feed", idx, "feed.lengthIncrement"), DEFAULTS["feed"]["length_increment"]),
                        "feed_angle_1": parse_float(get_scenario_value(data, "feed", idx, "feed.feedAngle1"), DEFAULTS["feed"]["feed_angle_1"]),
                        "feed_angle_2": parse_float(get_scenario_value(data, "feed", idx, "feed.feedAngle2"), DEFAULTS["feed"]["feed_angle_2"]),
                    }
                    feed_obj = base_feed_params(**feed_data)
                    feed_scenario_result = calculate_sigma_five(feed_obj)
                elif "allen" in feed_type or "mpl" in feed_type:
                    feed_data = {
                        "feed_type": feed_type,
                        "feed_model": parse_str_with_default(data, ["common", "equipment","feed", "model"], "feed", "model"),
                        "width": parse_int_with_default(data, ["feed", "feed", "machineWidth"], "feed", "machine_width"),
                        "loop_pit": parse_str_with_default(data, ["common", "equipment", "feed", "loopPit"], "feed", "loop_pit"),
                        "material_type": material_type_upper,
                        "application": parse_str_with_default(data, ["feed", "feed", "application"], "feed", "application"),
                        "type_of_line": parse_str_with_default(data, ["common", "equipment", "feed", "typeOfLine"], "feed", "type_of_line"),
                        "roll_width": parse_str_with_default(data, ["feed", "feed", "fullWidthRolls"], "feed", "roll_width"),
                        "feed_rate": parse_float_with_default(data, ["common", "feedRates", "average", "fpm"], "feed", "rate"),
                        "material_width": material_width_int,
                        "material_thickness": material_thickness_val,
                        "press_bed_length": parse_int_with_default(data, ["common", "press", "bedLength"], "press", "bed_length"),
                        # Scenario-aware input fields (check scenario location first, fall back to shared)
                        "friction_in_die": parse_float(get_scenario_value(data, "feed", idx, "feed.frictionInDie"), DEFAULTS["feed"]["friction_in_die"]),
                        "acceleration_rate": parse_float(get_scenario_value(data, "feed", idx, "feed.accelerationRate"), DEFAULTS["feed"]["acceleration_rate"]),
                        "chart_min_length": parse_float(get_scenario_value(data, "feed", idx, "feed.chartMinLength"), DEFAULTS["feed"]["chart_min_length"]),
                        "length_increment": parse_float(get_scenario_value(data, "feed", idx, "feed.lengthIncrement"), DEFAULTS["feed"]["length_increment"]),
                        "feed_angle_1": parse_float(get_scenario_value(data, "feed", idx, "feed.feedAngle1"), DEFAULTS["feed"]["feed_angle_1"]),
                        "feed_angle_2": parse_float(get_scenario_value(data, "feed", idx, "feed.feedAngle2"), DEFAULTS["feed"]["feed_angle_2"]),
                    }
                    feed_obj = base_feed_params(**feed_data)
                    feed_scenario_result = calculate_allen_bradley(feed_obj)
                
                if feed_scenario_result:
                    feed_scenario_result["scenarioId"] = idx + 1
                    print(f"Feed scenario {idx + 1} input data: {json.dumps(feed_data, indent=2, default=str)}", file=sys.stderr)
                    feed_scenarios.append(feed_scenario_result)
                else:
                    feed_scenarios.append({"scenarioId": idx + 1, "error": "Unknown feed type"})
                    
            except Exception as e:
                print(f"Error in Feed calculation for scenario {idx + 1}: {e}", file=sys.stderr)
                feed_scenarios.append({"scenarioId": idx + 1, "error": str(e)})
        
        feed_result = {"scenarios": feed_scenarios} if feed_scenarios else None
        if feed_result:
            print(f"RAW FEED CALCULATION RESULTS: {json.dumps(feed_scenarios, indent=2, default=str)}", file=sys.stderr)

        # --- Shear (Loop through first 2 scenarios only) ---
        shear_scenarios = []
        
        for idx in range(min(2, len(material_scenarios))):
            scenario = material_scenarios[idx]
            try:
                shear_model = get_nested(data, ["shear", "shear", "model"], "").lower()
                material_thickness_val = parse_float(scenario.get("materialThickness"), DEFAULTS["material"]["material_thickness"])
                coil_width_val = parse_float(scenario.get("materialWidth"), DEFAULTS["material"]["coil_width"])
                
                # Get material tensile from materialSpecs scenario if available
                material_tensile_val = parse_float(
                    get_scenario_value(data, "materialSpecs", idx, "materialTensile")
                )
                if material_tensile_val is None:
                    material_tensile_val = parse_float(scenario.get("maxTensileStrength"), DEFAULTS["material"]["max_tensile_strength"])
                if material_tensile_val is None:
                    material_tensile_val = parse_float_with_default(data, ["shear", "shear", "strength"], "shear", "strength")
                
                shear_scenario_result = None
                
                if shear_model == "single_rake":
                    shear_data = {
                        "max_material_thickness": material_thickness_val,
                        "material_thickness": material_thickness_val,
                        "coil_width": coil_width_val,
                        "material_tensile": material_tensile_val,
                        "rake_of_blade": parse_float_with_default(data, ["shear", "shear", "blade", "rakeOfBladePerFoot"], "shear", "rake_of_blade_per_foot"),
                        "overlap": parse_float_with_default(data, ["shear", "shear", "blade", "overlap"], "shear", "overlap"),
                        "blade_opening": parse_float_with_default(data, ["shear", "shear", "blade", "bladeOpening"], "shear", "blade_opening"),
                        "percent_of_penetration": parse_float_with_default(data, ["shear", "shear", "blade", "percentOfPenetration"], "shear", "percent_of_penetration"),
                        "bore_size": parse_float_with_default(data, ["shear", "shear", "cylinder", "boreSize"], "shear", "bore_size"),
                        "rod_dia": parse_float_with_default(data, ["shear", "shear", "cylinder", "rodDiameter"], "shear", "rod_diameter"),
                        "stroke": parse_float_with_default(data, ["shear", "shear", "cylinder", "stroke"], "shear", "stroke"),
                        "pressure": parse_float_with_default(data, ["shear", "shear", "hydraulic", "pressure"], "shear", "hydraulic_pressure"),
                        "time_for_down_stroke": parse_float_with_default(data, ["shear", "shear", "time", "forDownwardStroke"], "shear", "time_for_down_stroke"),
                        "dwell_time": parse_float_with_default(data, ["shear", "shear", "time", "dwellTime"], "shear", "dwell_time"),
                    }
                    shear_obj = hyd_shear_input(**shear_data)
                    shear_scenario_result = calculate_single_rake_hyd_shear(shear_obj)
                elif shear_model == "bow_tie":
                    shear_data = {
                        "max_material_thickness": material_thickness_val,
                        "material_thickness": material_thickness_val,
                        "coil_width": coil_width_val,
                        "material_tensile": material_tensile_val,
                        "rake_of_blade": parse_float_with_default(data, ["shear", "shear", "blade", "rakeOfBladePerFoot"], "shear", "rake_of_blade_per_foot"),
                        "overlap": parse_float_with_default(data, ["shear", "shear", "blade", "overlap"], "shear", "overlap"),
                        "blade_opening": parse_float_with_default(data, ["shear", "shear", "blade", "bladeOpening"], "shear", "blade_opening"),
                        "percent_of_penetration": parse_float_with_default(data, ["shear", "shear", "blade", "percentOfPenetration"], "shear", "percent_of_penetration"),
                        "bore_size": parse_float_with_default(data, ["shear", "shear", "cylinder", "boreSize"], "shear", "bore_size"),
                        "rod_dia": parse_float_with_default(data, ["shear", "shear", "cylinder", "rodDiameter"], "shear", "rod_diameter"),
                        "stroke": parse_float_with_default(data, ["shear", "shear", "cylinder", "stroke"], "shear", "stroke"),
                        "pressure": parse_float_with_default(data, ["shear", "shear", "hydraulic", "pressure"], "shear", "hydraulic_pressure"),
                        "time_for_down_stroke": parse_float_with_default(data, ["shear", "shear", "time", "forDownwardStroke"], "shear", "time_for_down_stroke"),
                        "dwell_time": parse_float_with_default(data, ["shear", "shear", "time", "dwellTime"], "shear", "dwell_time"),
                    }
                    shear_obj = hyd_shear_input(**shear_data)
                    shear_scenario_result = calculate_bow_tie_hyd_shear(shear_obj)
                
                if shear_scenario_result:
                    shear_scenario_result["scenarioId"] = idx + 1
                    shear_scenarios.append(shear_scenario_result)
                else:
                    shear_scenarios.append({"scenarioId": idx + 1, "error": "Unknown shear model"})
                    
            except Exception as e:
                print(f"Error in Shear calculation for scenario {idx + 1}: {e}", file=sys.stderr)
                shear_scenarios.append({"scenarioId": idx + 1, "error": str(e)})
        
        shear_result = {"scenarios": shear_scenarios} if shear_scenarios and len(shear_scenarios) > 0 else None

        # --- Output ---
        output = {
            "rfq": rfq_result,
            "material_specs": mat_result,
            "tddbhd": tddbhd_result,
            "reel_drive": reel_drive_result,
            "str_utility": str_util_result,
            "roll_str_backbend": roll_str_backbend_result,
            "feed": feed_result,
        }
        if shear_result is not None:
            output["shear"] = shear_result
            
        print(json.dumps(output, indent=2, default=str))
        
    except Exception as e:
        print(f"Fatal error in main execution: {e}", file=sys.stderr)
        error_output = {"error": str(e), "status": "failed"}
        print(json.dumps(error_output, indent=2, default=str))
        sys.exit(1)

if __name__ == "__main__":
    main()