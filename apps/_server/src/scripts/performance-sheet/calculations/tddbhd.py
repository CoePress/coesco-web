from models import tddbhd_input
from math import pi, sqrt
import re
import sys

from utils.shared import (
    NUM_BRAKEPADS, BRAKE_DISTANCE, CYLINDER_ROD, STATIC_FRICTION, rfq_state
)
from utils.lookup_tables import (
    get_cylinder_bore, get_hold_down_matrix_label, get_material_density, get_material_modulus, get_reel_max_weight, 
    get_pressure_psi, get_holddown_force_available, get_min_material_width, get_type_of_line, get_drive_key, get_drive_torque 
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
    calculated_cw = (((coil_od**2) - coil_id**2) / 4) * pi * width * density
    return min(calculated_cw, max_weight)

def calc_coil_od(coil_weight, density, width, coil_id, input_coil_od):
    od_denominator = density * width * pi
    if od_denominator == 0:
        raise ZeroDivisionError("coilOD zero division.")
    od_calc = sqrt(((4 * coil_weight) / od_denominator) + (coil_id**2))
    return min(od_calc, input_coil_od)

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
    numerator = 4 * torque_required
    partial_denominator = pi * friction * brake_dist * num_brakepads
    if brake_model == "Single Stage" or brake_model == "Failsafe - Single Stage":
        last = (cylinder_bore ** 2)
    elif brake_model == "Double Stage" or brake_model == "Failsafe - Double Stage":
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
    try:
        density = lookup_density(data.material_type)
        max_weight = lookup_max_weight(data.reel_model)
        modulus = lookup_modulus(data.material_type)
        cylinder_bore = lookup_cylinder_bore(data.brake_model)
        holddown_matrix_key = lookup_holddown_matrix_key(data.reel_model, data.hold_down_assy, data.cylinder)
        holddown_pressure = lookup_holddown_pressure(holddown_matrix_key, data.air_pressure)
        hold_down_force_available = lookup_hold_down_force(holddown_matrix_key, holddown_pressure)
        min_material_width = lookup_min_material_width(holddown_matrix_key)
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
        M = calc_M(modulus, data.width, data.thickness, data.coil_id)
        My = calc_My(data.width, data.thickness, data.yield_strength)
        y = calc_y(data.thickness, data.coil_id, modulus, data.yield_strength)
        web_tension_psi = calc_web_tension_psi(data.yield_strength)
        web_tension_lbs = calc_web_tension_lbs(data.thickness, data.width, web_tension_psi)
        coil_weight = calc_coil_weight(data.coil_od, data.coil_id, data.width, density, max_weight)
        coil_od = calc_coil_od(coil_weight, density, data.width, data.coil_id, data.coil_od)
        disp_reel_mtr = calc_disp_reel_mtr(data.hyd_threading_drive)
        torque_at_mandrel = calc_torque_at_mandrel(reel_type, drive_torque, data.reel_drive_tqempty)
        rewind_torque = calc_rewind_torque(web_tension_lbs, coil_od)
        hold_down_denominator = calc_hold_down_denominator(STATIC_FRICTION, data.coil_id)
        hold_down_force_req = calc_hold_down_force_req(M, My, data.width, data.thickness, data.yield_strength, y, hold_down_denominator)
        torque_required = calc_torque_required(data.decel, coil_weight, coil_od, data.coil_id, rewind_torque)
        brake_press_required = calc_brake_press_required(
            torque_required, data.friction, BRAKE_DISTANCE, NUM_BRAKEPADS,
            data.brake_model, cylinder_bore, CYLINDER_ROD, data.brake_qty
        )
        failsafe_holding_force = calc_failsafe_holding_force(
            data.brake_model, data.friction, NUM_BRAKEPADS, BRAKE_DISTANCE, data.brake_qty
        )
    except Exception as e:
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
        "friction": round(data.friction, 3),
        "web_tension_psi": round(web_tension_psi, 3),
        "web_tension_lbs": round(web_tension_lbs, 3),
        "calculated_coil_weight": round(coil_weight, 3),
        "coil_od": round(coil_od, 3),
        "disp_reel_mtr": round(disp_reel_mtr),
        "cylinder_bore": round(cylinder_bore, 3),
        "torque_at_mandrel": round(torque_at_mandrel, 3) if torque_at_mandrel else None,
        "rewind_torque": round(rewind_torque, 3),
        "holddown_pressure": round(holddown_pressure, 3),
        "hold_down_force_available": round(hold_down_force_available, 3),
        "hold_down_force_required": round(hold_down_force_req, 3),
        "min_material_width": round(min_material_width, 3),
        "torque_required": round(torque_required, 3),
        "failsafe_required": round(brake_press_required, 3),
        "failsafe_holding_force": round(failsafe_holding_force, 3),
        "min_material_width_check": min_material_width_check,
        "air_pressure_check": air_pressure_check,
        "rewind_torque_check": rewind_torque_check,
        "hold_down_force_check": hold_down_force_check,
        "brake_press_check": brake_press_check,
        "torque_required_check": torque_required_check,
        "tddbhd_check": tddbhd_check
    }