import json
import argparse
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

def parse_float(val):
    try:
        return float(val)
    except (TypeError, ValueError):
        return None

def parse_int(val):
    try:
        return int(val)
    except (TypeError, ValueError):
        return None

def parse_str(val):
    if val is None:
        return None
    return str(val)

# --- Main mapping and calculation logic ---
def main():
    parser = argparse.ArgumentParser(description="COE Performance Sheet JSON Calculator")
    parser.add_argument("--input", type=str, required=True, help="Path to input JSON file")
    args = parser.parse_args()

    with open(args.input, "r") as f:
        data = json.load(f)

    # --- RFQ (calculate for average, min, and max) ---
    rfq_average_data = {
        "feed_length": parse_float(get_nested(data, ["feed", "average", "length"])),
        "spm": parse_float(get_nested(data, ["feed", "average", "spm"])),
    }
    rfq_min_data = {
        "feed_length": parse_float(get_nested(data, ["feed", "min", "length"])),
        "spm": parse_float(get_nested(data, ["feed", "min", "spm"])),
    }
    rfq_max_data = {
        "feed_length": parse_float(get_nested(data, ["feed", "max", "length"])),
        "spm": parse_float(get_nested(data, ["feed", "max", "spm"])),
    }
    
    rfq_average_obj = rfq_input(**rfq_average_data)
    rfq_min_obj = rfq_input(**rfq_min_data)
    rfq_max_obj = rfq_input(**rfq_max_data)
    
    rfq_result = {
        "average": calculate_fpm(rfq_average_obj),
        "min": calculate_fpm(rfq_min_obj),
        "max": calculate_fpm(rfq_max_obj)
    }

    # --- Material Specs ---
    mat_data = {
        'material_type': get_nested(data, ['material', 'materialType']) if get_nested(data, ['material', 'materialType']) else None,
        'material_thickness': parse_float(get_nested(data, ['material', 'materialThickness'])),
        'yield_strength': parse_float(get_nested(data, ['material', 'maxYieldStrength'])),
        'coil_width': parse_float(get_nested(data, ['material', 'coilWidth'])),
        'coil_weight': parse_float(get_nested(data, ['coil', 'weight'])),
        'coil_id': parse_float(get_nested(data, ['coil', 'coilID'])),
        'feed_direction': get_nested(data, ['feed', 'direction']),
        'controls_level': get_nested(data, ['feed', 'controlsLevel']),
        'type_of_line': get_nested(data, ['feed', 'typeOfLine']),
        'feed_controls': get_nested(data, ['feed', 'controls']),
        'passline': get_nested(data, ['feed', 'passline']),
        'selected_roll': None,  # Not present
        'reel_backplate': get_nested(data, ['reel', 'backplate', 'diameter']),
        'reel_style': get_nested(data, ['reel', 'style']),
        'light_gauge_non_marking': str2bool(get_nested(data, ['feed', 'lightGuageNonMarking'])),
        'non_marking': str2bool(get_nested(data, ['feed', 'nonMarking'])),
    }
    mat_obj = material_specs_input(**mat_data)
    mat_result = calculate_variant(mat_obj)

    # Get calculated coil OD from material specs, fallback to JSON value if not available
    calculated_coil_od = mat_result.get('coil_od_calculated')
    if not calculated_coil_od or calculated_coil_od == 0:
        calculated_coil_od = parse_float(get_nested(data, ['coil', 'maxCoilOD'])) or 72.0  # Default fallback

    # --- TDDBHD ---
    tddbhd_data = {
        'type_of_line': get_nested(data, ['feed', 'typeOfLine']),
        'reel_drive_tqempty': None,  # Not present
        'motor_hp': parse_float(get_nested(data, ['reel', 'horsepower'])),
        'yield_strength': parse_float(get_nested(data, ['material', 'maxYieldStrength'])),
        'thickness': parse_float(get_nested(data, ['material', 'materialThickness'])),
        'width': parse_float(get_nested(data, ['material', 'coilWidth'])),
        'coil_id': parse_float(get_nested(data, ['coil', 'coilID'])),
        'coil_od': calculated_coil_od,
        'coil_weight': parse_float(get_nested(data, ['coil', 'weight'])),
        'decel': parse_float(get_nested(data, ['reel', 'requiredDecelRate'])),
        'friction': parse_float(get_nested(data, ['reel', 'coefficientOfFriction'])),
        'air_pressure': parse_float(get_nested(data, ['reel', 'airPressureAvailable'])),
        'brake_qty': parse_int(get_nested(data, ['reel', 'dragBrake', 'quantity'])),
        'brake_model': get_nested(data, ['reel', 'dragBrake', 'model']),
        'cylinder': get_nested(data, ['reel', 'holddown', 'cylinder']),
        'hold_down_assy': get_nested(data, ['reel', 'holddown', 'assy']),
        'hyd_threading_drive': get_nested(data, ['reel', 'threadingDrive', 'hydThreadingDrive']),
        'air_clutch': get_nested(data, ['reel', 'threadingDrive', 'airClutch']),
        'material_type': get_nested(data, ['material', 'materialType']).upper() if get_nested(data, ['material', 'materialType']) else None,
        'reel_model': get_nested(data, ['reel', 'model']),
        'reel_width': parse_float(get_nested(data, ['reel', 'width'])),
        'backplate_diameter': parse_float(get_nested(data, ['reel', 'backplate', 'diameter'])),
    }
    tddbhd_obj = tddbhd_input(**tddbhd_data)
    tddbhd_result = calculate_tbdbhd(tddbhd_obj)

    # Get the final coil OD from TDDBHD calculation (if it updates it) or use the calculated one
    # Handle case where tddbhd_result might be a string (error) instead of dict
    if isinstance(tddbhd_result, dict):
        final_coil_od = tddbhd_result.get('coil_od', calculated_coil_od)
    else:
        final_coil_od = calculated_coil_od
    
    if not final_coil_od:
        final_coil_od = calculated_coil_od

    # --- Reel Drive ---
    reel_drive_data = {
        'model': get_nested(data, ['reel', 'model']),
        'material_type': get_nested(data, ['material', 'materialType']).upper() if get_nested(data, ['material', 'materialType']) else None,
        'coil_id': parse_float(get_nested(data, ['coil', 'coilID'])),
        'coil_od': final_coil_od,
        'reel_width': parse_float(get_nested(data, ['reel', 'width'])),
        'backplate_diameter': parse_float(get_nested(data, ['reel', 'backplate', 'diameter'])),
        'motor_hp': parse_float(get_nested(data, ['reel', 'horsepower'])),
        'type_of_line': get_nested(data, ['feed', 'typeOfLine']),
        'required_max_fpm': parse_float(get_nested(data, ['feed', 'maximunVelocity'])) or 100.0,  # Default fallback
    }
    reel_drive_obj = reel_drive_input(**reel_drive_data)
    reel_drive_result = calculate_reeldrive(reel_drive_obj)

    # --- Str Utility ---
    str_util_data = {
        'max_coil_weight': parse_float(get_nested(data, ['coil', 'maxCoilWeight'])),
        'coil_id': parse_float(get_nested(data, ['coil', 'coilID'])),
        'coil_od': final_coil_od,
        'coil_width': parse_float(get_nested(data, ['coil', 'maxCoilWidth'])),
        'material_thickness': parse_float(get_nested(data, ['material', 'materialThickness'])),
        'yield_strength': parse_float(get_nested(data, ['material', 'maxYieldStrength'])),
        'material_type': get_nested(data, ['material', 'materialType']).upper() if get_nested(data, ['material', 'materialType']) else None,
        'str_model': get_nested(data, ['straightener', 'model']),
        'str_width': parse_float(get_nested(data, ['straightener', 'width'])),
        'horsepower': parse_float(get_nested(data, ['straightener', 'horsepower'])),
        'feed_rate': parse_float(get_nested(data, ['straightener', 'feedRate'])),
        'max_feed_rate': parse_float(get_nested(data, ['straightener', 'feedRate'])),
        'auto_brake_compensation': get_nested(data, ['straightener', 'autoBrakeCompensation']),
        'acceleration': parse_float(get_nested(data, ['straightener', 'acceleration'])),
        'num_str_rolls': parse_int(get_nested(data, ['straightener', 'rolls', 'numberOfRolls'])),
    }
    str_util_obj = str_utility_input(**str_util_data)
    str_util_result = calculate_str_utility(str_util_obj)

    # --- Roll Str Backbend ---
    roll_str_backbend_data = {
        'yield_strength': parse_float(get_nested(data, ['material', 'maxYieldStrength'])),
        'thickness': parse_float(get_nested(data, ['material', 'materialThickness'])),
        'width': parse_float(get_nested(data, ['material', 'coilWidth'])),
        'material_type': get_nested(data, ['material', 'materialType']).upper() if get_nested(data, ['material', 'materialType']) else None,
        'str_model': get_nested(data, ['straightener', 'model']),
        'num_str_rolls': parse_int(get_nested(data, ['straightener', 'rolls', 'numberOfRolls'])),
        'calc_const': None,  # Not present
    }
    roll_str_backbend_obj = roll_str_backbend_input(**roll_str_backbend_data)
    roll_str_backbend_result = calculate_roll_str_backbend(roll_str_backbend_obj)

    # --- Feed (choose which) ---
    # NOTE: Feed calculation functions now return additional keys such as:
    #   'pinch_rolls', 'straightner_torque', 'payoff_max_speed',
    #   'table_values', 'peak_torque', 'rms_torque_fa1', 'rms_torque_fa2', etc.
    # These will appear in the 'feed' section of the output JSON.
    feed_model = get_nested(data, ['feed', 'model'], '').lower()
    is_pull_thru = str2bool(get_nested(data, ['feed', 'pullThru', 'isPullThru']))
    feed_type = None
    feed_result = None
    if 'sigma' in feed_model and is_pull_thru:
        feed_type = 'sigma_five_feed_with_pt'
        # Map generic "Sigma 5 Feed" to a specific model that exists in lookup table
        feed_model_lookup = get_nested(data, ['feed', 'model'])
        if feed_model_lookup and feed_model_lookup.lower() == 'sigma 5 feed':
            feed_model_lookup = 'CPRF-S3'  # Default to S3 model
            
        feed_data = {
            'feed_model': feed_model_lookup,
            'width': parse_int(get_nested(data, ['feed', 'machineWidth'])),
            'loop_pit': get_nested(data, ['feed', 'loopPit']),
            'material_type': get_nested(data, ['material', 'materialType']).upper() if get_nested(data, ['material', 'materialType']) else None,
            'application': get_nested(data, ['feed', 'application']),
            'type_of_line': get_nested(data, ['feed', 'typeOfLine']),
            'roll_width': get_nested(data, ['feed', 'machineWidth']),
            'feed_rate': parse_float(get_nested(data, ['feed', 'average', 'fpm'])) or 80.0,  # Default fallback
            'material_width': parse_int(get_nested(data, ['material', 'coilWidth'])),
            'material_thickness': parse_float(get_nested(data, ['material', 'materialThickness'])),
            'press_bed_length': parse_int(get_nested(data, ['press', 'bedLength'])) or 2000,  # Default fallback
            'friction_in_die': 0,  # Not present
            'acceleration_rate': parse_float(get_nested(data, ['feed', 'accelerationRate'])),
            'chart_min_length': parse_float(get_nested(data, ['feed', 'chartMinLength'])),
            'length_increment': parse_float(get_nested(data, ['feed', 'lengthIncrement'])),
            'feed_angle_1': parse_float(get_nested(data, ['feed', 'feedAngle1'])),
            'feed_angle_2': parse_float(get_nested(data, ['feed', 'feedAngle2'])),
            'straightening_rolls': parse_int(get_nested(data, ['feed', 'pullThru', 'straightenerRolls'])),
            'yield_strength': parse_float(get_nested(data, ['material', 'maxYieldStrength'])),
            'str_pinch_rolls': get_nested(data, ['feed', 'pullThru', 'pinchRolls']),
            'req_max_fpm': parse_float(get_nested(data, ['feed', 'maximunVelocity'])) or 100.0,  # Default fallback
        }
        feed_obj = feed_w_pull_thru_input(**feed_data)
        feed_result = calculate_sigma_five_pt(feed_obj)
    elif 'sigma' in feed_model:
        feed_type = 'sigma_five_feed'
        # Map generic "Sigma 5 Feed" to a specific model that exists in lookup table
        feed_model_lookup = get_nested(data, ['feed', 'model'])
        if feed_model_lookup and feed_model_lookup.lower() == 'sigma 5 feed':
            feed_model_lookup = 'CPRF-S3'  # Default to S3 model
        
        feed_data = {
            'feed_model': feed_model_lookup,
            'width': parse_int(get_nested(data, ['feed', 'machineWidth'])),
            'loop_pit': get_nested(data, ['feed', 'loopPit']),
            'material_type': get_nested(data, ['material', 'materialType']).upper() if get_nested(data, ['material', 'materialType']) else None,
            'application': get_nested(data, ['feed', 'application']),
            'type_of_line': get_nested(data, ['feed', 'typeOfLine']),
            'roll_width': get_nested(data, ['feed', 'machineWidth']),
            'feed_rate': parse_float(get_nested(data, ['feed', 'average', 'fpm'])) or 80.0,  # Default fallback
            'material_width': parse_int(get_nested(data, ['material', 'coilWidth'])),
            'material_thickness': parse_float(get_nested(data, ['material', 'materialThickness'])),
            'press_bed_length': parse_int(get_nested(data, ['press', 'bedLength'])) or 2000,  # Default fallback
            'friction_in_die': 0,  # Not present
            'acceleration_rate': parse_float(get_nested(data, ['feed', 'accelerationRate'])),
            'chart_min_length': parse_float(get_nested(data, ['feed', 'chartMinLength'])),
            'length_increment': parse_float(get_nested(data, ['feed', 'lengthIncrement'])),
            'feed_angle_1': parse_float(get_nested(data, ['feed', 'feedAngle1'])),
            'feed_angle_2': parse_float(get_nested(data, ['feed', 'feedAngle2'])),
        }
        feed_obj = base_feed_params(**feed_data)
        feed_result = calculate_sigma_five(feed_obj)
    elif 'allen' in feed_model or 'mpl' in feed_model:
        feed_type = 'allen_bradley_mpl_feed'
        feed_data = {
            'feed_model': get_nested(data, ['feed', 'model']),
            'width': parse_int(get_nested(data, ['feed', 'machineWidth'])),
            'loop_pit': get_nested(data, ['feed', 'loopPit']),
            'material_type': get_nested(data, ['material', 'materialType']).upper() if get_nested(data, ['material', 'materialType']) else None,
            'application': get_nested(data, ['feed', 'application']),
            'type_of_line': get_nested(data, ['feed', 'typeOfLine']),
            'roll_width': get_nested(data, ['feed', 'machineWidth']),
            'feed_rate': parse_float(get_nested(data, ['feed', 'average', 'fpm'])) or 80.0,  # Default fallback
            'material_width': parse_int(get_nested(data, ['material', 'coilWidth'])),
            'material_thickness': parse_float(get_nested(data, ['material', 'materialThickness'])),
            'press_bed_length': parse_int(get_nested(data, ['press', 'bedLength'])) or 2000,  # Default fallback
            'friction_in_die': 0,  # Not present
            'acceleration_rate': parse_float(get_nested(data, ['feed', 'accelerationRate'])),
            'chart_min_length': parse_float(get_nested(data, ['feed', 'chartMinLength'])),
            'length_increment': parse_float(get_nested(data, ['feed', 'lengthIncrement'])),
            'feed_angle_1': parse_float(get_nested(data, ['feed', 'feedAngle1'])),
            'feed_angle_2': parse_float(get_nested(data, ['feed', 'feedAngle2'])),
        }
        feed_obj = base_feed_params(**feed_data)
        feed_result = calculate_allen_bradley(feed_obj)
    else:
        feed_result = None

    # --- Shear (choose which) ---
    shear_model = get_nested(data, ['shear', 'model'], '').lower()
    shear_result = None
    if shear_model == 'single_rake':
        shear_data = {
            'max_material_thickness': parse_float(get_nested(data, ['material', 'materialThickness'])),
            'coil_width': parse_float(get_nested(data, ['material', 'coilWidth'])),
            'material_tensile': parse_float(get_nested(data, ['shear', 'strength'])),
            'rake_of_blade': parse_float(get_nested(data, ['shear', 'blade', 'rakeOfBladePerFoot'])),
            'overlap': parse_float(get_nested(data, ['shear', 'blade', 'overlap'])),
            'blade_opening': parse_float(get_nested(data, ['shear', 'blade', 'bladeOpening'])),
            'percent_of_penetration': parse_float(get_nested(data, ['shear', 'blade', 'percentOfPenetration'])),
            'bore_size': parse_float(get_nested(data, ['shear', 'cylinder', 'boreSize'])),
            'rod_dia': parse_float(get_nested(data, ['shear', 'cylinder', 'rodDiameter'])),
            'stroke': parse_float(get_nested(data, ['shear', 'cylinder', 'stroke'])),
            'pressure': parse_float(get_nested(data, ['shear', 'hydraulic', 'pressure'])),
            'time_for_down_stroke': parse_float(get_nested(data, ['shear', 'time', 'forDownwardStroke'])),
            'dwell_time': parse_float(get_nested(data, ['shear', 'time', 'dwellTime'])),
        }
        shear_obj = hyd_shear_input(**shear_data)
        shear_result = calculate_single_rake_hyd_shear(shear_obj)
    elif shear_model == 'bow_tie':
        shear_data = {
            'max_material_thickness': parse_float(get_nested(data, ['material', 'materialThickness'])),
            'coil_width': parse_float(get_nested(data, ['material', 'coilWidth'])),
            'material_tensile': parse_float(get_nested(data, ['shear', 'strength'])),
            'rake_of_blade': parse_float(get_nested(data, ['shear', 'blade', 'rakeOfBladePerFoot'])),
            'overlap': parse_float(get_nested(data, ['shear', 'blade', 'overlap'])),
            'blade_opening': parse_float(get_nested(data, ['shear', 'blade', 'bladeOpening'])),
            'percent_of_penetration': parse_float(get_nested(data, ['shear', 'blade', 'percentOfPenetration'])),
            'bore_size': parse_float(get_nested(data, ['shear', 'cylinder', 'boreSize'])),
            'rod_dia': parse_float(get_nested(data, ['shear', 'cylinder', 'rodDiameter'])),
            'stroke': parse_float(get_nested(data, ['shear', 'cylinder', 'stroke'])),
            'pressure': parse_float(get_nested(data, ['shear', 'hydraulic', 'pressure'])),
            'time_for_down_stroke': parse_float(get_nested(data, ['shear', 'time', 'forDownwardStroke'])),
            'dwell_time': parse_float(get_nested(data, ['shear', 'time', 'dwellTime'])),
        }
        shear_obj = hyd_shear_input(**shear_data)
        shear_result = calculate_bow_tie_hyd_shear(shear_obj)
    # If model is empty or not recognized, skip shear

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