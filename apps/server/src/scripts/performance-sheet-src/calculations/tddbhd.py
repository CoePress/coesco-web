"""
TDDBHD Calculation Module

"""
from models import tddbhd_input
from math import pi, sqrt
import re

from utils.shared import (
    NUM_BRAKEPADS, BRAKE_DISTANCE, CYLINDER_ROD, STATIC_FRICTION, rfq_state
)
# Import your lookup functions
from utils.lookup_tables import (
    get_cylinder_bore, get_hold_down_matrix_label, get_material_density, get_material_modulus, get_reel_max_weight, 
    get_pressure_psi, get_holddown_force_available, get_min_material_width, get_type_of_line, get_drive_key, get_drive_torque 
    )

def calculate_tbdbhd(data: tddbhd_input):
    """
    Calculate TDDBHD values based on the provided input data.

    Args: \n
        data (TDDBHDInput): Input data for TDDBHD calculations.

    Returns: \n
        TDDBHDOutput: Calculated results including web tension, coil weight, 
                      coil OD, torque required, and brake press required.

    Raises: \n
        HTTPException: If any input data is invalid or if calculations fail.

    """
    num_brakepads = NUM_BRAKEPADS
    brake_dist = BRAKE_DISTANCE
    cyl_rod = CYLINDER_ROD
    static_friction = STATIC_FRICTION

    # Lookups
    # density, max weight, friction, modulus, cylinder bore, holddown pressure, holddown force available
    try:
        density_lookup = get_material_density(data.material_type)
    except Exception as e:
        return f"ERROR: get_material_density failed for '{data.material_type}': {str(e)}"
    
    try:
        reel_max_weight = get_reel_max_weight(data.reel_model)
    except Exception as e:
        return f"ERROR: get_reel_max_weight failed for '{data.reel_model}': {str(e)}"
    
    try:
        modulus_lookup = get_material_modulus(data.material_type)
    except Exception as e:
        return f"ERROR: get_material_modulus failed for '{data.material_type}': {str(e)}"
    
    try:
        cylinder_bore_lookup = get_cylinder_bore(data.brake_model)
    except Exception as e:
        return f"ERROR: get_cylinder_bore failed for '{data.brake_model}': {str(e)}"
    
    try:
        holddown_matrix_key = get_hold_down_matrix_label(data.reel_model, data.hold_down_assy, data.cylinder)
    except Exception as e:
        return f"ERROR: get_hold_down_matrix_label failed for reel='{data.reel_model}', assy='{data.hold_down_assy}', cylinder='{data.cylinder}': {str(e)}"
    
    try:
        holddown_pressure_calc = get_pressure_psi(holddown_matrix_key, data.air_pressure)
    except Exception as e:
        return f"ERROR: get_pressure_psi failed for key='{holddown_matrix_key}', pressure='{data.air_pressure}': {str(e)}"
    
    try:
        hold_down_force_available = get_holddown_force_available(holddown_matrix_key, holddown_pressure_calc)
    except Exception as e:
        return f"ERROR: get_holddown_force_available failed for key='{holddown_matrix_key}', pressure='{holddown_pressure_calc}': {str(e)}"
    
    try:
        min_material_width_lookup = get_min_material_width(holddown_matrix_key)
    except Exception as e:
        return f"ERROR: get_min_material_width failed for key='{holddown_matrix_key}': {str(e)}"
    
    try:
        reel_type_lookup = get_type_of_line(data.type_of_line)
    except Exception as e:
        return f"ERROR: get_type_of_line failed for '{data.type_of_line}': {str(e)}"
    
    try:
        air_clutch = "Yes" if data.air_clutch else "No"
        drive_key_lookup = get_drive_key(data.reel_model, air_clutch, data.hyd_threading_drive)
    except Exception as e:
        return f"ERROR: get_drive_key failed for reel='{data.reel_model}', clutch='{data.air_clutch}', drive='{data.hyd_threading_drive}': {str(e)}"
    
    try:
        drive_torque_lookup = get_drive_torque(drive_key_lookup)
    except Exception as e:
        return f"ERROR: get_drive_torque failed for key='{drive_key_lookup}': {str(e)}"

    density = density_lookup
    max_weight = reel_max_weight
    friction = data.friction
    modulus = modulus_lookup
    cylinder_bore = cylinder_bore_lookup
    holddown_pressure = holddown_pressure_calc
    min_material_width = min_material_width_lookup
    reel_type = reel_type_lookup
    drive_torque = drive_torque_lookup

    # Precalculation for needed values
    M = (modulus * data.width * data.thickness**3) / (12 * (data.coil_id/2))
    My = (data.width * data.thickness**2 * data.yield_strength) / 6
    y = (data.thickness * (data.coil_id/2)) / (2 * ((data.thickness * modulus) / (2 * data.yield_strength)))

    # Web Tension
    web_tension_psi = data.yield_strength / 800
    web_tension_lbs = data.thickness * data.width * web_tension_psi

    # Coil Weight Calculation
    # Check that density and width are not zero.
    if density == 0 or data.width == 0:
        return "ERROR: TDDBHD density or width are 0."
    calculated_cw = (((data.coil_od**2) - data.coil_id**2) / 4) * pi * data.width * density
    coil_weight = min(calculated_cw, max_weight)

    # Coil OD Calculation
    try:
        od_denominator = density * data.width * pi
        if od_denominator == 0:
            raise ZeroDivisionError
        od_calc = sqrt(((4 * coil_weight) / od_denominator) + (data.coil_id**2))
    except ZeroDivisionError:
        return "ERROR: TDDBHD coilOD zero division."
    coil_od = min(od_calc, data.coil_od) 

    # Display Reel Motor (simulate mapping)
    if data.hyd_threading_drive != "None":
        match = re.match(r"\d+", data.hyd_threading_drive)
        if not match:
            return "ERROR: TDDBHD hyd threading drive."

        hyd_drive_number = int(match.group())
        disp_reel_mtr = {22: 22.6, 38: 38, 60: 60}.get(hyd_drive_number, hyd_drive_number)
    else:
        disp_reel_mtr = 0

    # Torque At Mandrel
    if reel_type.upper() == "PULLOFF":
        torque_at_mandrel = drive_torque
    else: 
        torque_at_mandrel = data.reel_drive_tqempty

    # Rewind Torque Calculation
    rewind_torque = web_tension_lbs * coil_od / 2

    # Holddown Force Required Calculation
    # Denom for hold down force: friction * (coil_id/2)
    hold_down_denominator = static_friction * (data.coil_id / 2)
    if hold_down_denominator == 0:
        return "ERROR: TDDBHD holddown denominator 0."

    # Additional check for thickness in the else clause:
    if M >= My and data.thickness == 0:
        return "ERROR: TDDBHD thickness check."

    if M < My:
        hold_down_force_req = M / hold_down_denominator
    else:
        hold_down_force_req = (((data.width * data.thickness**2) / 4) * data.yield_strength * (1 - (1/3) * (y / (data.thickness / 2))**2)) / hold_down_denominator

    # Torque Required Calculation
    # Check that coil_od isn't zero.
    if coil_od == 0:
        return "ERROR: TDDBHD coilOD 0."
    torque_required = ((3 * data.decel * coil_weight * (coil_od**2 + data.coil_id**2)) / (386 * coil_od)) + rewind_torque

    # Brake Press Required Calculation
    numerator = 4 * torque_required
    partial_denominator = pi * friction * brake_dist * num_brakepads 
    if data.brake_model == "Single Stage" or data.brake_model == "Failsafe - Single Stage":
        last = (cylinder_bore ** 2)
    elif data.brake_model == "Double Stage" or data.brake_model == "Failsafe - Double Stage":
        last = (2 * (cylinder_bore ** 2) - (cyl_rod ** 2))
    elif data.brake_model == "Triple Stage":
        last = (3 * (cylinder_bore ** 2) - 2 * (cyl_rod ** 2))
    else:
        return "ERROR: TDDBHD brake press invalid."

    denominator = partial_denominator * last
    press_required = numerator / denominator
    brake_press_required = press_required / data.brake_qty

    # Brake Press Holding Force Calculation
    if data.brake_model == "Failsafe - Single Stage":
        hold_force = 1000
    elif data.brake_model == "Failsafe - Double Stage":
        hold_force = 2385
    else:
        hold_force = 0

    if data.brake_qty < 1 or data.brake_qty > 4:
        return "ERROR: TDDBHD brake quantity invalid."

    failsafe_holding_force = hold_force * friction * num_brakepads * brake_dist * data.brake_qty 
    return {
        "friction": round(friction, 3),
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
    }
