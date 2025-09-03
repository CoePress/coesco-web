from models import tddbhd_input
from utils.lookup_tables import (
    get_min_material_width, get_hold_down_matrix_label, get_drive_torque, get_drive_key,
    get_material_modulus, get_holddown_force_available, get_pressure_psi, get_cylinder_bore
)
from utils.shared import NUM_BRAKEPADS, BRAKE_DISTANCE, CYLINDER_ROD, STATIC_FRICTION
from calculations.tddbhd import (
    lookup_density, lookup_max_weight,

    calc_brake_press_required, calc_failsafe_holding_force, calc_torque_required, calc_rewind_torque,
    calc_web_tension_lbs, calc_web_tension_psi, calc_coil_od, calc_coil_weight
)

def get_initial_tddbhd_inputs(defaults):
    """
    Returns a tddbhd_input object with initial values that should pass all checks.
    'defaults' should be a dict with reasonable values for all required fields except those calculated below.
    """
    # 1. min_material_width
    min_material_width = get_min_material_width(
        get_hold_down_matrix_label(defaults['reel_model'], defaults['hold_down_assy'], defaults['cylinder'])
    )
    width = min_material_width

    # 2. air_pressure
    air_pressure = 120  # Max allowed

    # 3. rewind_torque
    # rewind_torque = web_tension_lbs * coil_od / 2 <= torque_at_mandrel
    # Solve for coil_od:
    web_tension_psi = defaults['yield_strength'] / 800
    web_tension_lbs = defaults['thickness'] * width * web_tension_psi
    torque_at_mandrel = get_drive_torque(
        get_drive_key(defaults['reel_model'], "Yes" if defaults['air_clutch'] else "No", defaults['hyd_threading_drive'])
    )
    coil_od = (2 * torque_at_mandrel) / web_tension_lbs

    # 4. hold_down_force_req
    # hold_down_force_req = M / hold_down_denominator <= hold_down_force_available
    static_friction = STATIC_FRICTION
    hold_down_denominator = static_friction * (defaults['coil_id'] / 2)
    modulus = get_material_modulus(defaults['material_type'])
    M = (modulus * width * defaults['thickness']**3) / (12 * (defaults['coil_id']/2))
    hold_down_force_available = get_holddown_force_available(
        get_hold_down_matrix_label(defaults['reel_model'], defaults['hold_down_assy'], defaults['cylinder']),
        get_pressure_psi(
            get_hold_down_matrix_label(defaults['reel_model'], defaults['hold_down_assy'], defaults['cylinder']),
            air_pressure
        )
    )
    hold_down_force_req = min(M / hold_down_denominator, hold_down_force_available)

    # 5. brake_press_required
    # brake_press_required = press_required / brake_qty <= air_pressure
    # press_required = air_pressure * brake_qty
    brake_qty = defaults['brake_qty']
    

    # 6. torque_required
    # torque_required <= failsafe_holding_force
    # Set torque_required to failsafe_holding_force
    brake_model = defaults['brake_model']
    num_brakepads = NUM_BRAKEPADS
    brake_dist = BRAKE_DISTANCE
    cyl_rod = CYLINDER_ROD
    friction = defaults['friction']
    cylinder_bore = get_cylinder_bore(brake_model)
    if brake_model == "Failsafe - Single Stage":
        hold_force = 1000
    elif brake_model == "Failsafe - Double Stage":
        hold_force = 2385
    else:
        hold_force = 0
    failsafe_holding_force = hold_force * friction * num_brakepads * brake_dist * brake_qty

    # Compose the input object
    input_data = dict(defaults)
    input_data.update({
        "reel_model": "",
        "reel_width": 0,
        "backplate_diameter": 0,
        "air_pressure": air_pressure,
        "decel": 0,
        "air_clutch": "Yes" if defaults['air_clutch'] else "No",
        "hyd_threading_drive": defaults['hyd_threading_drive'],
        "hold_down_assy": defaults['hold_down_assy'],
        "cylinder": defaults['cylinder'],
        "brake_model": defaults['brake_model'],
        "brake_qty": brake_qty
    })
    return tddbhd_input(**input_data)