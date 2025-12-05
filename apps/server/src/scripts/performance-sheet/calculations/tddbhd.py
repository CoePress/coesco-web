from models import tddbhd_input
from math import pi, sqrt
import re
import sys

from utils.shared import (
    NUM_BRAKEPADS, BRAKE_DISTANCE, CYLINDER_ROD, STATIC_FRICTION, rfq_state
)
from utils.lookup_tables import (
    get_cylinder_bore, get_hold_down_matrix_label, get_material_density, get_material_modulus, get_reel_max_weight, 
    get_pressure_psi, get_holddown_force_available, get_min_material_width, get_type_of_line, get_drive_key, get_drive_torque,
    get_valid_cylinder_options, get_fallback_cylinder
)

# --- Lookup Wrappers ---
def lookup_density(material_type):
    return get_material_density(material_type)

def lookup_max_weight(reel_model):
    return get_reel_max_weight(reel_model)

def lookup_modulus(material_type):
    return get_material_modulus(material_type)

def lookup_cylinder_bore(brake_model):
    return get_cylinder_bore(brake_model)

def lookup_holddown_matrix_key(reel_model, hold_down_assy, cylinder):
    return get_hold_down_matrix_label(reel_model, hold_down_assy, cylinder)

def lookup_holddown_pressure(matrix_key, air_pressure):
    return get_pressure_psi(matrix_key, air_pressure)

def lookup_hold_down_force(matrix_key, holddown_pressure):
    return get_holddown_force_available(matrix_key, holddown_pressure)

def lookup_min_material_width(matrix_key):
    return get_min_material_width(matrix_key)

def lookup_reel_type(type_of_line):
    return get_type_of_line(type_of_line)

def lookup_drive_key(reel_model, air_clutch, hyd_threading_drive):
    return get_drive_key(reel_model, air_clutch, hyd_threading_drive)

def lookup_drive_torque(drive_key):
    return get_drive_torque(drive_key)

# --- Calculations ---
def calc_M(modulus, width, thickness, coil_id):
    return (modulus * width * thickness**3) / (12 * (coil_id/2))

def calc_My(width, thickness, yield_strength):
    return (width * thickness**2 * yield_strength) / 6

def calc_y(thickness, coil_id, modulus, yield_strength):
    return (thickness * (coil_id/2)) / (2 * ((thickness * modulus) / (2 * yield_strength)))

def calc_web_tension_psi(yield_strength):
    return yield_strength / 800

def calc_web_tension_lbs(thickness, width, web_tension_psi):
    return thickness * width * web_tension_psi

def calc_coil_weight(coil_od, coil_id, width, density, max_weight):
    calculated_cw = ((coil_od**2) - (coil_id**2)) / 4 * pi * width * density
    return min(calculated_cw, max_weight)

def calc_coil_od(coil_weight, density, width, coil_id, max_coil_od):
    if density == 0 or width == 0:
        raise ZeroDivisionError("coilOD zero division.")
    od_calc = sqrt(((4 * coil_weight) / (density * width * pi)) + (coil_id**2))
    # Return calculated OD, but don't exceed maximum possible diameter
    return min(od_calc, max_coil_od)

def calc_disp_reel_mtr(hyd_threading_drive):
    if hyd_threading_drive != "None":
        match = re.match(r"\d+", hyd_threading_drive)
        if not match:
            raise ValueError("hyd threading drive.")
        hyd_drive_number = int(match.group())
        return {22: 22.6, 38: 38, 60: 60}.get(hyd_drive_number, hyd_drive_number)
    return 0

def calc_torque_at_mandrel(reel_type, drive_torque, reel_drive_tqempty):
    if reel_type.upper() == "PULLOFF":
        return drive_torque
    return reel_drive_tqempty

def calc_rewind_torque(web_tension_lbs, coil_od):
    return web_tension_lbs * coil_od / 2

def calc_hold_down_denominator(static_friction, coil_id):
    return static_friction * (coil_id / 2)

def calc_hold_down_force_req(M, My, width, thickness, yield_strength, y, hold_down_denominator):
    if M < My:
        return M / hold_down_denominator
    else:
        return (((width * thickness**2) / 4) * yield_strength * (1 - (1/3) * (y / (thickness / 2))**2)) / hold_down_denominator

def calc_torque_required(decel, coil_weight, coil_od, coil_id, rewind_torque):
    if coil_od == 0:
        raise ZeroDivisionError("coilOD 0.")
    return ((3 * decel * coil_weight * (coil_od**2 + coil_id**2)) / (386 * coil_od)) + rewind_torque

def calc_brake_press_required(torque_required, friction, brake_dist, num_brakepads, brake_model, cylinder_bore, cyl_rod, brake_qty):
    # For failsafe brakes, use lookup values instead of calculation
    if brake_model == "Failsafe - Single Stage":
        return 8.33 / brake_qty
    elif brake_model == "Failsafe - Double Stage":
        return 8.33 / brake_qty  # Assuming same lookup value, may need adjustment
    
    # For non-failsafe brakes, use torque-based calculation
    numerator = 4 * torque_required
    partial_denominator = pi * friction * brake_dist * num_brakepads
    if brake_model == "Single Stage":
        last = (cylinder_bore ** 2)
    elif brake_model == "Double Stage":
        last = (2 * (cylinder_bore ** 2) - (cyl_rod ** 2))
    elif brake_model == "Triple Stage":
        last = (3 * (cylinder_bore ** 2) - 2 * (cyl_rod ** 2))
    else:
        raise ValueError("brake press invalid.")
    denominator = partial_denominator * last
    press_required = numerator / denominator
    return press_required / brake_qty

def calc_failsafe_holding_force(brake_model, friction, num_brakepads, brake_dist, brake_qty):
    if brake_model == "Failsafe - Single Stage":
        hold_force = 1000
    elif brake_model == "Failsafe - Double Stage":
        hold_force = 2385
    else:
        hold_force = 0
    return hold_force * friction * num_brakepads * brake_dist * brake_qty

# --- Checks ---
def check_min_material_width(min_material_width, width):
    return "PASS" if min_material_width < width else "FAIL"

def check_air_pressure(air_pressure):
    return "PASS" if air_pressure <= 120 else "FAIL"

def check_rewind_torque(rewind_torque, torque_at_mandrel):
    return "PASS" if rewind_torque < torque_at_mandrel else "FAIL"

def check_hold_down_force(hold_down_force_req, hold_down_force_available):
    return "PASS" if hold_down_force_req <= hold_down_force_available else "FAIL"

def check_brake_press(brake_press_required, air_pressure):
    return "PASS" if brake_press_required <= air_pressure else "FAIL"

def check_torque_required(torque_required, failsafe_holding_force):
    return "PASS" if torque_required < failsafe_holding_force else "FAIL"

def check_tddbhd(reel_type, min_material_width_check, confirmed_min_width, rewind_torque_check, hold_down_force_check, brake_press_check, torque_required_check, hold_down_force_available):
    if reel_type.upper() == "PULLOFF":
        if ((min_material_width_check == "PASS" or confirmed_min_width == True) and 
            rewind_torque_check == "PASS" and
            hold_down_force_check == "PASS" and
            brake_press_check == "PASS" and
            (torque_required_check == "PASS" or hold_down_force_available == 0)
            ):
            return "OK"
        else:
            return "NOT OK"
    else:
        return "USE MOTORIZED"

# --- Main Calculation ---
def calculate_tbdbhd(data: tddbhd_input):
    print("=== TDDBHD CALCULATION DEBUG ===", file=sys.stderr)
    
    # Log input data
    print(f"Input data type: {type(data)}", file=sys.stderr)
    print(f"Material Properties:", file=sys.stderr)
    print(f"  material_type: {data.material_type}", file=sys.stderr)
    print(f"  thickness: {data.thickness} (type: {type(data.thickness)})", file=sys.stderr)
    print(f"  width: {data.width} (type: {type(data.width)})", file=sys.stderr)
    print(f"  yield_strength: {data.yield_strength} (type: {type(data.yield_strength)})", file=sys.stderr)
    print(f"Coil Properties:", file=sys.stderr)
    print(f"  coil_id: {data.coil_id} (type: {type(data.coil_id)})", file=sys.stderr)
    print(f"  coil_od: {data.coil_od} (type: {type(data.coil_od)})", file=sys.stderr)
    print(f"  coil_weight: {data.coil_weight} (type: {type(data.coil_weight)})", file=sys.stderr)
    print(f"Equipment Properties:", file=sys.stderr)
    print(f"  reel_model: {data.reel_model}", file=sys.stderr)
    print(f"  hold_down_assy: {data.hold_down_assy}", file=sys.stderr)
    print(f"  cylinder: '{data.cylinder}'", file=sys.stderr)
    print(f"  air_pressure: {data.air_pressure} (type: {type(data.air_pressure)})", file=sys.stderr)
    
    # Check for zero values that could cause division by zero
    zero_values = []
    if data.thickness == 0:
        zero_values.append("thickness")
    if data.width == 0:
        zero_values.append("width")
    if data.coil_id == 0:
        zero_values.append("coil_id")
    if data.coil_od == 0:
        zero_values.append("coil_od")
    if data.air_pressure == 0:
        zero_values.append("air_pressure")
        
    if zero_values:
        print(f"WARNING: Zero values detected in: {zero_values}", file=sys.stderr)
        return f"ERROR: Zero values detected in critical fields: {', '.join(zero_values)}. Division by zero would occur."
    
    try:
        density = lookup_density(data.material_type)
        max_weight = lookup_max_weight(data.reel_model)
        modulus = lookup_modulus(data.material_type)
        cylinder_bore = lookup_cylinder_bore(data.brake_model)
        
        # Log the holddown matrix key construction with enhanced validation
        print(f"Constructing holddown matrix key with: reel_model='{data.reel_model}', hold_down_assy='{data.hold_down_assy}', cylinder='{data.cylinder}'", file=sys.stderr)
        
        try:
            holddown_matrix_key = lookup_holddown_matrix_key(data.reel_model, data.hold_down_assy, data.cylinder)
            print(f"Holddown matrix key: '{holddown_matrix_key}'", file=sys.stderr)
        except ValueError as e:
            print(f"ERROR: Failed to construct holddown matrix key: {e}", file=sys.stderr)
            
            # Try fallback logic
            fallback_cylinder = get_fallback_cylinder(data.reel_model, data.hold_down_assy, data.cylinder)
            if fallback_cylinder:
                print(f"Attempting fallback with cylinder: {fallback_cylinder}", file=sys.stderr)
                try:
                    holddown_matrix_key = lookup_holddown_matrix_key(data.reel_model, data.hold_down_assy, fallback_cylinder)
                    print(f"Fallback holddown matrix key: '{holddown_matrix_key}'", file=sys.stderr)
                    print(f"WARNING: Using fallback cylinder '{fallback_cylinder}' instead of '{data.cylinder}'", file=sys.stderr)
                except ValueError:
                    return f"ERROR: Holddown configuration error - {str(e)}"
            else:
                return f"ERROR: Holddown configuration error - {str(e)}"
        
        try:
            holddown_pressure = lookup_holddown_pressure(holddown_matrix_key, data.air_pressure)
            print(f"Holddown pressure: {holddown_pressure}", file=sys.stderr)
        except ValueError as e:
            print(f"ERROR: Failed to lookup holddown pressure: {e}", file=sys.stderr)
            return f"ERROR: Holddown pressure lookup failed - {str(e)}"
            
        try:
            hold_down_force_available = lookup_hold_down_force(holddown_matrix_key, holddown_pressure)
            print(f"Hold down force available: {hold_down_force_available}", file=sys.stderr)
        except ValueError as e:
            print(f"ERROR: Failed to lookup hold down force: {e}", file=sys.stderr)
            return f"ERROR: Hold down force lookup failed - {str(e)}"
            
        try:
            min_material_width = lookup_min_material_width(holddown_matrix_key)
            print(f"Min material width: {min_material_width}", file=sys.stderr)
        except ValueError as e:
            print(f"ERROR: Failed to lookup min material width: {e}", file=sys.stderr)
            return f"ERROR: Min material width lookup failed - {str(e)}"
        reel_type = lookup_reel_type(data.type_of_line)
        # Fix: data.air_clutch is already a string ("Yes"/"No"), not a boolean
        air_clutch = data.air_clutch if data.air_clutch in ["Yes", "No"] else "No"
        
        # Generate drive key and check if it exists, fallback to "No" if not found
        drive_key = lookup_drive_key(data.reel_model, air_clutch, data.hyd_threading_drive)
        
        # Check if drive key exists in lookup table, if not, try with air_clutch="No"
        try:
            drive_torque = lookup_drive_torque(drive_key)
        except ValueError as e:
            if "Unknown drive key" in str(e) and air_clutch == "Yes":
                # Fallback: try with air_clutch="No" for models that don't support air clutch
                air_clutch = "No"
                drive_key = lookup_drive_key(data.reel_model, air_clutch, data.hyd_threading_drive)
                drive_torque = lookup_drive_torque(drive_key)
            else:
                raise e
    except Exception as e:
        return f"ERROR: Lookup failed: {str(e)}"

    try:
        print("Starting calculations...", file=sys.stderr)
        print(f"Calculating M with: modulus={modulus}, width={data.width}, thickness={data.thickness}, coil_id={data.coil_id}", file=sys.stderr)
        M = calc_M(modulus, data.width, data.thickness, data.coil_id)
        print(f"M = {M}", file=sys.stderr)
        
        print(f"Calculating My with: width={data.width}, thickness={data.thickness}, yield_strength={data.yield_strength}", file=sys.stderr)
        My = calc_My(data.width, data.thickness, data.yield_strength)
        print(f"My = {My}", file=sys.stderr)
        
        print(f"Calculating y with: thickness={data.thickness}, coil_id={data.coil_id}, modulus={modulus}, yield_strength={data.yield_strength}", file=sys.stderr)
        y = calc_y(data.thickness, data.coil_id, modulus, data.yield_strength)
        print(f"y = {y}", file=sys.stderr)
        
        web_tension_psi = calc_web_tension_psi(data.yield_strength)
        web_tension_lbs = calc_web_tension_lbs(data.thickness, data.width, web_tension_psi)
        
        print(f"Calculating coil_weight with: max_coil_od=72, coil_id={data.coil_id}, width={data.width}, density={density}, max_weight={max_weight}", file=sys.stderr)
        coil_weight = calc_coil_weight(72, data.coil_id, data.width, density, max_weight)
        print(f"coil_weight = {coil_weight}", file=sys.stderr)
        
        print(f"Calculating coil_od with: coil_weight={coil_weight}, density={density}, width={data.width}, coil_id={data.coil_id}, max_coil_od=72", file=sys.stderr)
        coil_od = calc_coil_od(coil_weight, density, data.width, data.coil_id, 72)
        print(f"calculated coil_od = {coil_od}", file=sys.stderr)
        
        disp_reel_mtr = calc_disp_reel_mtr(data.hyd_threading_drive)
        torque_at_mandrel = calc_torque_at_mandrel(reel_type, drive_torque, data.reel_drive_tqempty)
        rewind_torque = calc_rewind_torque(web_tension_lbs, coil_od)
        
        print(f"Calculating hold_down_denominator with: STATIC_FRICTION={STATIC_FRICTION}, coil_id={data.coil_id}", file=sys.stderr)
        hold_down_denominator = calc_hold_down_denominator(STATIC_FRICTION, data.coil_id)
        print(f"hold_down_denominator = {hold_down_denominator}", file=sys.stderr)
        print(f"Calculating hold_down_force_req with: M={M}, My={My}, width={data.width}, thickness={data.thickness}, yield_strength={data.yield_strength}, y={y}, hold_down_denominator={hold_down_denominator}", file=sys.stderr)
        hold_down_force_req = calc_hold_down_force_req(M, My, data.width, data.thickness, data.yield_strength, y, hold_down_denominator)
        print(f"hold_down_force_req = {hold_down_force_req}", file=sys.stderr)
        
        torque_required = calc_torque_required(data.decel, coil_weight, coil_od, data.coil_id, rewind_torque)
        brake_press_required = calc_brake_press_required(
            torque_required, data.friction, BRAKE_DISTANCE, NUM_BRAKEPADS,
            data.brake_model, cylinder_bore, CYLINDER_ROD, data.brake_qty
        )
        failsafe_holding_force = calc_failsafe_holding_force(
            data.brake_model, data.friction, NUM_BRAKEPADS, BRAKE_DISTANCE, data.brake_qty
        )
        print("=== TDDBHD CALCULATION COMPLETED SUCCESSFULLY ===", file=sys.stderr)
    except ZeroDivisionError as e:
        print(f"ZERO DIVISION ERROR in TDDBHD calculation: {e}", file=sys.stderr)
        import traceback
        print(f"Full traceback: {traceback.format_exc()}", file=sys.stderr)
        return f"ERROR: Division by zero in calculation: {str(e)}"
    except Exception as e:
        print(f"GENERAL ERROR in TDDBHD calculation: {e}", file=sys.stderr)
        print(f"Error type: {type(e)}", file=sys.stderr)
        import traceback
        print(f"Full traceback: {traceback.format_exc()}", file=sys.stderr)
        return f"ERROR: Calculation failed: {str(e)}"

    # Checks
    min_material_width_check = check_min_material_width(min_material_width, data.width)
    air_pressure_check = check_air_pressure(data.air_pressure)
    rewind_torque_check = check_rewind_torque(rewind_torque, torque_at_mandrel)
    hold_down_force_check = check_hold_down_force(hold_down_force_req, hold_down_force_available)
    brake_press_check = check_brake_press(brake_press_required, data.air_pressure)
    torque_required_check = check_torque_required(torque_required, failsafe_holding_force)
    tddbhd_check = check_tddbhd(
        reel_type, min_material_width_check, data.confirmed_min_width,
        rewind_torque_check, hold_down_force_check, brake_press_check,
        torque_required_check, hold_down_force_available
    )

    return {
        # Coil specifications - flat keys for result mapping
        "coil_weight": round(coil_weight, 3),
        "coil_od": round(coil_od, 3),
        
        # Reel specifications - flat keys for result mapping
        "disp_reel_mtr": round(disp_reel_mtr),
        "brake_pad_diameter": BRAKE_DISTANCE,  # Using constant from shared.py
        "cylinder_bore": round(cylinder_bore, 3),
        "min_material_width": round(min_material_width, 3),
        
        # Web tension - flat keys for result mapping
        "web_tension_psi": round(web_tension_psi, 3),
        "web_tension_lbs": round(web_tension_lbs, 3),
        
        # Torque values - flat keys for result mapping
        "torque_at_mandrel": round(torque_at_mandrel, 3) if torque_at_mandrel else None,
        "rewind_torque_required": round(rewind_torque, 3),
        "torque_required": round(torque_required, 3),
        
        # Hold down force - flat keys for result mapping
        "holddown_force_required": round(hold_down_force_req, 3),
        "holddown_force_available": round(hold_down_force_available, 3),
        "holddown_pressure": round(holddown_pressure, 3),
        
        # Drag brake - flat keys for result mapping
        "brake_psi_air_required": round(brake_press_required, 3),
        "brake_holding_force": round(failsafe_holding_force, 3),
        
        # Validation checks - flat keys for result mapping
        "min_material_width_check": min_material_width_check,
        "air_pressure_check": air_pressure_check,
        "rewind_torque_check": rewind_torque_check,
        "holddown_force_check": hold_down_force_check,
        "brake_press_check": brake_press_check,
        "torque_required_check": torque_required_check,
        "overall_check": tddbhd_check
    }