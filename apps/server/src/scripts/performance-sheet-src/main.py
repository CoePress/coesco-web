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
    for k in keys:
        if isinstance(d, dict) and k in d:
            d = d[k]
        else:
            return default
    return d

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

# --- Main mapping and calculation logic ---
def main():
    print("DEBUG - Starting COE Performance Sheet JSON Calculator", file=sys.stderr)
    # Try to read from stdin first, then fall back to command line arguments
    if not sys.stdin.isatty():
        # Data is being piped in via stdin
        try:
            stdin_data = sys.stdin.read()
            data = json.loads(stdin_data)
            if 'data' in data and isinstance(data['data'], dict):
                data = data['data']
            print(f"DEBUG - Using data structure: {json.dumps(data, indent=2)}", file=sys.stderr)
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

    print("DEBUG - Starting RFQ", file=sys.stderr)
    # --- RFQ (calculate for average, min, and max) ---
    rfq_average_data = {
        "feed_length": parse_float_with_default(data, ["feed", "average", "length"], 'feed', 'average_length'),
        "spm": parse_float_with_default(data, ["feed", "average", "spm"], 'feed', 'average_spm'),
    }
    rfq_min_data = {
        "feed_length": parse_float_with_default(data, ["feed", "min", "length"], 'feed', 'min_length'),
        "spm": parse_float_with_default(data, ["feed", "min", "spm"], 'feed', 'min_spm'),
    }
    rfq_max_data = {
        "feed_length": parse_float_with_default(data, ["feed", "max", "length"], 'feed', 'max_length'),
        "spm": parse_float_with_default(data, ["feed", "max", "spm"], 'feed', 'max_spm'),
    }

    rfq_average_obj = rfq_input(**rfq_average_data)
    rfq_min_obj = rfq_input(**rfq_min_data)
    rfq_max_obj = rfq_input(**rfq_max_data)
    
    rfq_result = {
        "average": calculate_fpm(rfq_average_obj),
        "min": calculate_fpm(rfq_min_obj),
        "max": calculate_fpm(rfq_max_obj)
    }
    print(f"DEBUG - RFQ Results: {rfq_result}", file=sys.stderr)

    print("DEBUG - Starting Material Specs", file=sys.stderr)
    # --- Material Specs ---
    mat_data = {
        'material_type': parse_str_with_default(data, ['material', 'materialType'], 'material', 'material_type'),
        'material_thickness': parse_float_with_default(data, ['material', 'materialThickness'], 'material', 'material_thickness'),
        'yield_strength': parse_float_with_default(data, ['material', 'maxYieldStrength'], 'material', 'yield_strength'),
        'coil_width': parse_float_with_default(data, ['material', 'coilWidth'], 'material', 'coil_width'),
        'coil_weight': parse_float_with_default(data, ['coil', 'weight'], 'material', 'coil_weight'),
        'coil_id': parse_float_with_default(data, ['coil', 'coilID'], 'material', 'coil_id'),
        'feed_direction': parse_str_with_default(data, ['feed', 'direction'], 'feed', 'direction'),
        'controls_level': parse_str_with_default(data, ['feed', 'controlsLevel'], 'feed', 'controls_level'),
        'type_of_line': parse_str_with_default(data, ['feed', 'typeOfLine'], 'feed', 'type_of_line'),
        'feed_controls': parse_str_with_default(data, ['feed', 'controls'], 'feed', 'controls'),
        'passline': parse_float_with_default(data, ['feed', 'passline'], 'feed', 'passline'),
        'selected_roll': None,  # Not present
        'reel_backplate': parse_float_with_default(data, ['reel', 'backplate', 'diameter'], 'reel', 'backplate_diameter'),
        'reel_style': parse_str_with_default(data, ['reel', 'style'], 'reel', 'style'),
        'light_gauge_non_marking': str2bool(get_nested(data, ['feed', 'lightGuageNonMarking'])) or DEFAULTS['feed']['light_gauge_non_marking'],
        'non_marking': str2bool(get_nested(data, ['feed', 'nonMarking'])) or DEFAULTS['feed']['non_marking'],
    }
    mat_obj = material_specs_input(**mat_data)
    mat_result = calculate_variant(mat_obj)

    # Get calculated coil OD from material specs, fallback to JSON value if not available
    calculated_coil_od = mat_result.get('coil_od_calculated')
    if not calculated_coil_od or calculated_coil_od == 0:
        calculated_coil_od = parse_float_with_default(data, ['coil', 'maxCoilOD'], 'material', 'max_coil_od')

    print(f"DEBUG - Material Specs Results: {mat_result}", file=sys.stderr)

    print("DEBUG - Starting TDDBHD", file=sys.stderr)
    # --- TDDBHD ---
    tddbhd_data = {
        'type_of_line': parse_str_with_default(data, ['feed', 'typeOfLine'], 'feed', 'type_of_line'),
        'reel_drive_tqempty': None,  # Not present
        'motor_hp': parse_float_with_default(data, ['reel', 'horsepower'], 'reel', 'horsepower'),
        'yield_strength': parse_float_with_default(data, ['material', 'maxYieldStrength'], 'material', 'yield_strength'),
        'thickness': parse_float_with_default(data, ['material', 'materialThickness'], 'material', 'material_thickness'),
        'width': parse_float_with_default(data, ['material', 'coilWidth'], 'material', 'coil_width'),
        'coil_id': parse_float_with_default(data, ['coil', 'coilID'], 'material', 'coil_id'),
        'coil_od': calculated_coil_od,
        'coil_weight': parse_float_with_default(data, ['coil', 'weight'], 'material', 'coil_weight'),
        'decel': parse_float_with_default(data, ['reel', 'requiredDecelRate'], 'reel', 'required_decel_rate'),
        'friction': parse_float_with_default(data, ['reel', 'coefficientOfFriction'], 'reel', 'coefficient_of_friction'),
        'air_pressure': parse_float_with_default(data, ['reel', 'airPressureAvailable'], 'reel', 'air_pressure_available'),
        'brake_qty': parse_int_with_default(data, ['reel', 'dragBrake', 'quantity'], 'reel', 'drag_brake_quantity'),
        'brake_model': parse_str_with_default(data, ['reel', 'dragBrake', 'model'], 'reel', 'drag_brake_model'),
        'cylinder': parse_str_with_default(data, ['reel', 'holddown', 'cylinder'], 'reel', 'holddown_cylinder'),
        'hold_down_assy': parse_str_with_default(data, ['reel', 'holddown', 'assy'], 'reel', 'holddown_assy'),
        'hyd_threading_drive': parse_str_with_default(data, ['reel', 'threadingDrive', 'hydThreadingDrive'], 'reel', 'threading_drive_hyd'),
        'air_clutch': str2bool(get_nested(data, ['reel', 'threadingDrive', 'airClutch'])) or DEFAULTS['reel']['threading_drive_air_clutch'],
        'material_type': (get_nested(data, ['material', 'materialType']) or DEFAULTS['material']['material_type']).upper(),
        'reel_model': parse_str_with_default(data, ['reel', 'model'], 'reel', 'model'),
        'reel_width': parse_float_with_default(data, ['reel', 'width'], 'reel', 'width'),
        'backplate_diameter': parse_float_with_default(data, ['reel', 'backplate', 'diameter'], 'reel', 'backplate_diameter'),
    }
    tddbhd_obj = tddbhd_input(**tddbhd_data)
    tddbhd_result = calculate_tbdbhd(tddbhd_obj)

    # Get the final coil OD from TDDBHD calculation (if it updates it) or use the calculated one
    if isinstance(tddbhd_result, dict):
        final_coil_od = tddbhd_result.get('coil_od', calculated_coil_od)
    else:
        final_coil_od = calculated_coil_od
    
    if not final_coil_od:
        final_coil_od = calculated_coil_od

    print(f"DEBUG - TDDBHD Results: {tddbhd_result}", file=sys.stderr)

    print("DEBUG - Starting Reel Drive", file=sys.stderr)
    # --- Reel Drive ---
    reel_drive_data = {
        'model': parse_str_with_default(data, ['reel', 'model'], 'reel', 'model'),
        'material_type': (get_nested(data, ['material', 'materialType']) or DEFAULTS['material']['material_type']).upper(),
        'coil_id': parse_float_with_default(data, ['coil', 'coilID'], 'material', 'coil_id'),
        'coil_od': final_coil_od,
        'reel_width': parse_float_with_default(data, ['reel', 'width'], 'reel', 'width'),
        'backplate_diameter': parse_float_with_default(data, ['reel', 'backplate', 'diameter'], 'reel', 'backplate_diameter'),
        'motor_hp': parse_float_with_default(data, ['reel', 'horsepower'], 'reel', 'horsepower'),
        'type_of_line': parse_str_with_default(data, ['feed', 'typeOfLine'], 'feed', 'type_of_line'),
        'required_max_fpm': parse_float_with_default(data, ['feed', 'maximumVelocity'], 'feed', 'maximum_velocity'),
    }
    reel_drive_obj = reel_drive_input(**reel_drive_data)
    reel_drive_result = calculate_reeldrive(reel_drive_obj)

    print(f"DEBUG - Reel Drive Results: {reel_drive_result}", file=sys.stderr)

    print("DEBUG - Starting Straightener Utility", file=sys.stderr)

    # --- Str Utility ---
    str_util_data = {
        'max_coil_weight': parse_float_with_default(data, ['coil', 'maxCoilWeight'], 'material', 'max_coil_weight'),
        'coil_id': parse_float_with_default(data, ['coil', 'coilID'], 'material', 'coil_id'),
        'coil_od': final_coil_od,
        'coil_width': parse_float_with_default(data, ['coil', 'maxCoilWidth'], 'material', 'max_coil_width'),
        'material_thickness': parse_float_with_default(data, ['material', 'materialThickness'], 'material', 'material_thickness'),
        'yield_strength': parse_float_with_default(data, ['material', 'maxYieldStrength'], 'material', 'yield_strength'),
        'material_type': (get_nested(data, ['material', 'materialType']) or DEFAULTS['material']['material_type']).upper(),
        'str_model': parse_str_with_default(data, ['straightener', 'model'], 'straightener', 'model'),
        'str_width': parse_float_with_default(data, ['straightener', 'width'], 'straightener', 'width'),
        'horsepower': parse_float_with_default(data, ['straightener', 'horsepower'], 'straightener', 'horsepower'),
        'feed_rate': parse_float_with_default(data, ['straightener', 'feedRate'], 'straightener', 'feed_rate'),
        'max_feed_rate': parse_float_with_default(data, ['straightener', 'feedRate'], 'straightener', 'feed_rate'),
        'auto_brake_compensation': str2bool(get_nested(data, ['straightener', 'autoBrakeCompensation'])) or DEFAULTS['straightener']['auto_brake_compensation'],
        'acceleration': parse_float_with_default(data, ['straightener', 'acceleration'], 'straightener', 'acceleration'),
        'num_str_rolls': parse_int_with_default(data, ['straightener', 'rolls', 'numberOfRolls'], 'straightener', 'number_of_rolls'),
    }
    str_util_obj = str_utility_input(**str_util_data)
    str_util_result = calculate_str_utility(str_util_obj)

    print(f"DEBUG - Straightener Utility Results: {str_util_result}", file=sys.stderr)

    print("DEBUG - Starting Roll Str Backbend", file=sys.stderr)
    # --- Roll Str Backbend ---
    roll_str_backbend_data = {
        'yield_strength': parse_float_with_default(data, ['material', 'maxYieldStrength'], 'material', 'yield_strength'),
        'thickness': parse_float_with_default(data, ['material', 'materialThickness'], 'material', 'material_thickness'),
        'width': parse_float_with_default(data, ['material', 'coilWidth'], 'material', 'coil_width'),
        'material_type': (get_nested(data, ['material', 'materialType']) or DEFAULTS['material']['material_type']).upper(),
        'str_model': parse_str_with_default(data, ['straightener', 'model'], 'straightener', 'model'),
        'num_str_rolls': parse_int_with_default(data, ['straightener', 'rolls', 'numberOfRolls'], 'straightener', 'number_of_rolls'),
        'calc_const': None,  # Not present
    }
    roll_str_backbend_obj = roll_str_backbend_input(**roll_str_backbend_data)
    roll_str_backbend_result = calculate_roll_str_backbend(roll_str_backbend_obj)

    print(f"DEBUG - Roll Str Backbend Results: {roll_str_backbend_result}", file=sys.stderr)

    print("DEBUG - Starting Feed Calculations", file=sys.stderr)
    # --- Feed (choose which) ---
    feed_model = get_nested(data, ['feed', 'model'], DEFAULTS['feed']['model']).lower()
    is_pull_thru = str2bool(get_nested(data, ['feed', 'pullThru', 'isPullThru'])) or DEFAULTS['feed']['pull_thru']
    feed_type = None
    feed_result = None
    
    if 'sigma' in feed_model and is_pull_thru:
        feed_type = 'sigma_five_feed_with_pt'
        feed_model_lookup = get_nested(data, ['feed', 'model'])
        if feed_model_lookup and feed_model_lookup.lower() == 'sigma 5 feed':
            feed_model_lookup = DEFAULTS['feed']['model']  # Default to S3 model
            
        feed_data = {
            'feed_model': feed_model_lookup or DEFAULTS['feed']['model'],
            'width': parse_int_with_default(data, ['feed', 'machineWidth'], 'feed', 'machine_width'),
            'loop_pit': parse_str_with_default(data, ['feed', 'loopPit'], 'feed', 'loop_pit'),
            'material_type': (get_nested(data, ['material', 'materialType']) or DEFAULTS['material']['material_type']).upper(),
            'application': parse_str_with_default(data, ['feed', 'application'], 'feed', 'application'),
            'type_of_line': parse_str_with_default(data, ['feed', 'typeOfLine'], 'feed', 'type_of_line'),
            'roll_width': parse_int_with_default(data, ['feed', 'machineWidth'], 'feed', 'machine_width'),
            'feed_rate': parse_float_with_default(data, ['feed', 'average', 'fpm'], 'feed', 'average_fpm'),
            'material_width': parse_int_with_default(data, ['material', 'coilWidth'], 'material', 'coil_width'),
            'material_thickness': parse_float_with_default(data, ['material', 'materialThickness'], 'material', 'material_thickness'),
            'press_bed_length': parse_int_with_default(data, ['press', 'bedLength'], 'press', 'bed_length'),
            'friction_in_die': 0,  # Not present
            'acceleration_rate': parse_float_with_default(data, ['feed', 'accelerationRate'], 'feed', 'acceleration_rate'),
            'chart_min_length': parse_float_with_default(data, ['feed', 'chartMinLength'], 'feed', 'chart_min_length'),
            'length_increment': parse_float_with_default(data, ['feed', 'lengthIncrement'], 'feed', 'length_increment'),
            'feed_angle_1': parse_float_with_default(data, ['feed', 'feedAngle1'], 'feed', 'feed_angle_1'),
            'feed_angle_2': parse_float_with_default(data, ['feed', 'feedAngle2'], 'feed', 'feed_angle_2'),
            'straightening_rolls': parse_int_with_default(data, ['feed', 'pullThru', 'straightenerRolls'], 'feed', 'straightener_rolls'),
            'yield_strength': parse_float_with_default(data, ['material', 'maxYieldStrength'], 'material', 'yield_strength'),
            'str_pinch_rolls': parse_str_with_default(data, ['feed', 'pullThru', 'pinchRolls'], 'feed', 'pinch_rolls'),
            'req_max_fpm': parse_float_with_default(data, ['feed', 'maximunVelocity'], 'feed', 'maximum_velocity'),
        }
        feed_obj = feed_w_pull_thru_input(**feed_data)
        feed_result = calculate_sigma_five_pt(feed_obj)
    elif 'sigma' in feed_model:
        feed_type = 'sigma_five_feed'
        feed_model_lookup = get_nested(data, ['feed', 'model'])
        if feed_model_lookup and feed_model_lookup.lower() == 'sigma 5 feed':
            feed_model_lookup = DEFAULTS['feed']['model']  # Default to S3 model
        
        feed_data = {
            'feed_model': feed_model_lookup or DEFAULTS['feed']['model'],
            'width': parse_int_with_default(data, ['feed', 'machineWidth'], 'feed', 'machine_width'),
            'loop_pit': parse_str_with_default(data, ['feed', 'loopPit'], 'feed', 'loop_pit'),
            'material_type': (get_nested(data, ['material', 'materialType']) or DEFAULTS['material']['material_type']).upper(),
            'application': parse_str_with_default(data, ['feed', 'application'], 'feed', 'application'),
            'type_of_line': parse_str_with_default(data, ['feed', 'typeOfLine'], 'feed', 'type_of_line'),
            'roll_width': parse_int_with_default(data, ['feed', 'machineWidth'], 'feed', 'machine_width'),
            'feed_rate': parse_float_with_default(data, ['feed', 'average', 'fpm'], 'feed', 'average_fpm'),
            'material_width': parse_int_with_default(data, ['material', 'coilWidth'], 'material', 'coil_width'),
            'material_thickness': parse_float_with_default(data, ['material', 'materialThickness'], 'material', 'material_thickness'),
            'press_bed_length': parse_int_with_default(data, ['press', 'bedLength'], 'press', 'bed_length'),
            'friction_in_die': 0,  # Not present
            'acceleration_rate': parse_float_with_default(data, ['feed', 'accelerationRate'], 'feed', 'acceleration_rate'),
            'chart_min_length': parse_float_with_default(data, ['feed', 'chartMinLength'], 'feed', 'chart_min_length'),
            'length_increment': parse_float_with_default(data, ['feed', 'lengthIncrement'], 'feed', 'length_increment'),
            'feed_angle_1': parse_float_with_default(data, ['feed', 'feedAngle1'], 'feed', 'feed_angle_1'),
            'feed_angle_2': parse_float_with_default(data, ['feed', 'feedAngle2'], 'feed', 'feed_angle_2'),
        }
        feed_obj = base_feed_params(**feed_data)
        feed_result = calculate_sigma_five(feed_obj)
    elif 'allen' in feed_model or 'mpl' in feed_model:
        feed_type = 'allen_bradley_mpl_feed'
        feed_data = {
            'feed_model': get_nested(data, ['feed', 'model']) or DEFAULTS['feed']['model'],
            'width': parse_int_with_default(data, ['feed', 'machineWidth'], 'feed', 'machine_width'),
            'loop_pit': parse_str_with_default(data, ['feed', 'loopPit'], 'feed', 'loop_pit'),
            'material_type': (get_nested(data, ['material', 'materialType']) or DEFAULTS['material']['material_type']).upper(),
            'application': parse_str_with_default(data, ['feed', 'application'], 'feed', 'application'),
            'type_of_line': parse_str_with_default(data, ['feed', 'typeOfLine'], 'feed', 'type_of_line'),
            'roll_width': parse_int_with_default(data, ['feed', 'machineWidth'], 'feed', 'machine_width'),
            'feed_rate': parse_float_with_default(data, ['feed', 'average', 'fpm'], 'feed', 'average_fpm'),
            'material_width': parse_int_with_default(data, ['material', 'coilWidth'], 'material', 'coil_width'),
            'material_thickness': parse_float_with_default(data, ['material', 'materialThickness'], 'material', 'material_thickness'),
            'press_bed_length': parse_int_with_default(data, ['press', 'bedLength'], 'press', 'bed_length'),
            'friction_in_die': 0,  # Not present
            'acceleration_rate': parse_float_with_default(data, ['feed', 'accelerationRate'], 'feed', 'acceleration_rate'),
            'chart_min_length': parse_float_with_default(data, ['feed', 'chartMinLength'], 'feed', 'chart_min_length'),
            'length_increment': parse_float_with_default(data, ['feed', 'lengthIncrement'], 'feed', 'length_increment'),
            'feed_angle_1': parse_float_with_default(data, ['feed', 'feedAngle1'], 'feed', 'feed_angle_1'),
            'feed_angle_2': parse_float_with_default(data, ['feed', 'feedAngle2'], 'feed', 'feed_angle_2'),
        }
        feed_obj = base_feed_params(**feed_data)
        feed_result = calculate_allen_bradley(feed_obj)
    else:
        feed_result = None

    print(f"DEBUG - Feed Results ({feed_type}): {feed_result}", file=sys.stderr)

    print("DEBUG - Starting Shear Calculations", file=sys.stderr)
    # --- Shear (choose which) ---
    shear_model = get_nested(data, ['shear', 'model'], '').lower()
    shear_result = None
    if shear_model == 'single_rake':
        shear_data = {
            'max_material_thickness': parse_float_with_default(data, ['material', 'materialThickness'], 'material', 'material_thickness'),
            'coil_width': parse_float_with_default(data, ['material', 'coilWidth'], 'material', 'coil_width'),
            'material_tensile': parse_float_with_default(data, ['shear', 'strength'], 'shear', 'strength'),
            'rake_of_blade': parse_float_with_default(data, ['shear', 'blade', 'rakeOfBladePerFoot'], 'shear', 'rake_of_blade_per_foot'),
            'overlap': parse_float_with_default(data, ['shear', 'blade', 'overlap'], 'shear', 'overlap'),
            'blade_opening': parse_float_with_default(data, ['shear', 'blade', 'bladeOpening'], 'shear', 'blade_opening'),
            'percent_of_penetration': parse_float_with_default(data, ['shear', 'blade', 'percentOfPenetration'], 'shear', 'percent_of_penetration'),
            'bore_size': parse_float_with_default(data, ['shear', 'cylinder', 'boreSize'], 'shear', 'bore_size'),
            'rod_dia': parse_float_with_default(data, ['shear', 'cylinder', 'rodDiameter'], 'shear', 'rod_diameter'),
            'stroke': parse_float_with_default(data, ['shear', 'cylinder', 'stroke'], 'shear', 'stroke'),
            'pressure': parse_float_with_default(data, ['shear', 'hydraulic', 'pressure'], 'shear', 'hydraulic_pressure'),
            'time_for_down_stroke': parse_float_with_default(data, ['shear', 'time', 'forDownwardStroke'], 'shear', 'time_for_downward_stroke'),
            'dwell_time': parse_float_with_default(data, ['shear', 'time', 'dwellTime'], 'shear', 'dwell_time'),
        }
        shear_obj = hyd_shear_input(**shear_data)
        shear_result = calculate_single_rake_hyd_shear(shear_obj)
    elif shear_model == 'bow_tie':
        shear_data = {
            'max_material_thickness': parse_float_with_default(data, ['material', 'materialThickness'], 'material', 'material_thickness'),
            'coil_width': parse_float_with_default(data, ['material', 'coilWidth'], 'material', 'coil_width'),
            'material_tensile': parse_float_with_default(data, ['shear', 'strength'], 'shear', 'strength'),
            'rake_of_blade': parse_float_with_default(data, ['shear', 'blade', 'rakeOfBladePerFoot'], 'shear', 'rake_of_blade_per_foot'),
            'overlap': parse_float_with_default(data, ['shear', 'blade', 'overlap'], 'shear', 'overlap'),
            'blade_opening': parse_float_with_default(data, ['shear', 'blade', 'bladeOpening'], 'shear', 'blade_opening'),
            'percent_of_penetration': parse_float_with_default(data, ['shear', 'blade', 'percentOfPenetration'], 'shear', 'percent_of_penetration'),
            'bore_size': parse_float_with_default(data, ['shear', 'cylinder', 'boreSize'], 'shear', 'bore_size'),
            'rod_dia': parse_float_with_default(data, ['shear', 'cylinder', 'rodDiameter'], 'shear', 'rod_diameter'),
            'stroke': parse_float_with_default(data, ['shear', 'cylinder', 'stroke'], 'shear', 'stroke'),
            'pressure': parse_float_with_default(data, ['shear', 'hydraulic', 'pressure'], 'shear', 'hydraulic_pressure'),
            'time_for_down_stroke': parse_float_with_default(data, ['shear', 'time', 'forDownwardStroke'], 'shear', 'time_for_downward_stroke'),
            'dwell_time': parse_float_with_default(data, ['shear', 'time', 'dwellTime'], 'shear', 'dwell_time'),
        }
        shear_obj = hyd_shear_input(**shear_data)
        shear_result = calculate_bow_tie_hyd_shear(shear_obj)
    # If model is empty or not recognized, skip shear

    print(f"DEBUG - Shear Results ({shear_model}): {shear_result}", file=sys.stderr)

    print("DEBUG - All calculations completed", file=sys.stderr)
    # --- Output ---
    output = {
        'rfq': rfq_result,
        'material_specs': mat_result,
        'tddbhd': tddbhd_result,
        'reel_drive': reel_drive_result,
        'str_utility': str_util_result,
        'roll_str_backbend': roll_str_backbend_result,
        'feed': feed_result,
    }
    if shear_result is not None:
        output['shear'] = shear_result

    print(json.dumps(output, indent=2, default=str))

if __name__ == "__main__":
    main()