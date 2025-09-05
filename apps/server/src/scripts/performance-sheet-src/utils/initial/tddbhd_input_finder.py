from models import tddbhd_input
from calculations.tddbhd import calculate_tbdbhd
from shared import (
    REEL_MODEL_OPTIONS, REEL_WIDTH_OPTIONS, BACKPLATE_DIAMETER_OPTIONS,
    BRAKE_QUANTITY_OPTIONS, BRAKE_MODEL_OPTIONS, HYDRAULIC_THREADING_DRIVE_OPTIONS,
    HOLD_DOWN_CYLINDER_OPTIONS, HOLD_DOWN_ASSY_OPTIONS
)

# Define all options
air_pressures = range(1, 121)

# Helper to check candidate
def passes_checks(candidate):
    result = calculate_tbdbhd(tddbhd_input(**candidate))
    if isinstance(result, dict):
        checks = [
            result.get("min_material_width_check"),
            result.get("air_pressure_check"),
            result.get("rewind_torque_check"),
            result.get("hold_down_force_check"),
            result.get("brake_press_check"),
            result.get("torque_required_check"),
            result.get("tddbhd_check"),
        ]
        return all(c == "PASS" or c == "OK" or c == "USE MOTORIZED" for c in checks)
    return False

def get_min_tddbhd_inputs(user_entries):
    # Efficient single-level search for minimum valid combination
    for reel_model, reel_width in zip(REEL_MODEL_OPTIONS, REEL_WIDTH_OPTIONS):
        for backplate_diameter in BACKPLATE_DIAMETER_OPTIONS:
            for hold_down_assy in HOLD_DOWN_ASSY_OPTIONS:
                for cylinder in HOLD_DOWN_CYLINDER_OPTIONS:
                    for brake_model in BRAKE_MODEL_OPTIONS:
                        for brake_qty in BRAKE_QUANTITY_OPTIONS:
                            for hyd_threading_drive in HYDRAULIC_THREADING_DRIVE_OPTIONS:
                                for air_pressure in air_pressures:
                                    candidate = dict(user_entries)
                                    candidate.update({
                                        "reel_model": reel_model,
                                        "reel_width": reel_width,
                                        "backplate_diameter": backplate_diameter,
                                        "air_pressure": air_pressure,
                                        "brake_qty": brake_qty,
                                        "brake_model": brake_model,
                                        "hyd_threading_drive": hyd_threading_drive,
                                        "cylinder": cylinder,
                                        "hold_down_assy": hold_down_assy,
                                    })
                                    # Early exit: check candidate
                                    if passes_checks(candidate):
                                        return tddbhd_input(**candidate)
    return None

def get_max_tddbhd_inputs(user_entries):
    # Efficient single-level search for maximum valid combination
    for reel_model, reel_width in zip(REEL_MODEL_OPTIONS[::-1], REEL_WIDTH_OPTIONS[::-1]):
        for backplate_diameter in BACKPLATE_DIAMETER_OPTIONS[::-1]:
            for hold_down_assy in HOLD_DOWN_ASSY_OPTIONS[::-1]:
                for cylinder in HOLD_DOWN_CYLINDER_OPTIONS[::-1]:
                    for brake_model in BRAKE_MODEL_OPTIONS[::-1]:
                        for brake_qty in BRAKE_QUANTITY_OPTIONS[::-1]:
                            for hyd_threading_drive in HYDRAULIC_THREADING_DRIVE_OPTIONS[::-1]:
                                for air_pressure in reversed(air_pressures):
                                    candidate = dict(user_entries)
                                    candidate.update({
                                        "reel_model": reel_model,
                                        "reel_width": reel_width,
                                        "backplate_diameter": backplate_diameter,
                                        "air_pressure": air_pressure,
                                        "brake_qty": brake_qty,
                                        "brake_model": brake_model,
                                        "hyd_threading_drive": hyd_threading_drive,
                                        "cylinder": cylinder,
                                        "hold_down_assy": hold_down_assy,
                                    })
                                    # Early exit: check candidate
                                    if passes_checks(candidate):
                                        return tddbhd_input(**candidate)
    return None