from models import tddbhd_input

from models import tddbhd_input
from calculations.tddbhd import calculate_tbdbhd

# Define all options from comments
reel_models = ["CPR-040", "CPR-060", "CPR-080", "CPR-100", "CPR-150", "CPR-200", "CPR-300", "CPR-400", "CPR-500", "CPR-600"]
reel_widths = [24, 30, 36, 42, 48, 54, 60]
backplate_diameters = [27, 72]
air_pressures = range(1, 121)
brake_qtys = [1, 2, 3]
brake_models = ["Single Stage", "Double Stage", "Triple Stage", "Failsafe - Single Stage", "Failsafe - Double Stage"]
hyd_threading_drives = ["22 cu in(D-12689)", "38 cu in(D-13374)", "60 cu in(D-13374)", "60 cu in(D-13382)"]
cylinders = ["Hydraulic"]
hold_down_assys = ["SD", "SD_MOTORIZED", "MD", "HD_SINGLE", "HD_DOUBLE", "XD", "XXD"]

# Helper to check candidate
def passes_checks(candidate):
    result = calculate_tbdbhd(tddbhd_input(**candidate))
    if isinstance(result, dict):
        checks = [
            result.get("min_material_width_check"),
            result.get("air_pressure_check"),
            result.get("brake_press_check"),
            result.get("torque_required_check"),
            result.get("tddbhd_check"),
        ]
        return all(c == "PASS" or c == "OK" or c == "USE MOTORIZED" for c in checks)
    return False

def get_min_tddbhd_inputs(user_entries):
    # Efficient single-level search for minimum valid combination
    for reel_model, reel_width in zip(reel_models, reel_widths):
        for backplate_diameter in backplate_diameters:
            for hold_down_assy in hold_down_assys:
                for cylinder in cylinders:
                    for brake_model in brake_models:
                        for brake_qty in brake_qtys:
                            for hyd_threading_drive in hyd_threading_drives:
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
                                        "friction": 0.3,  # Use your default or lookup
                                        "type_of_line": "PULLOFF",
                                        "confirmed_min_width": True,
                                        "reel_drive_tqempty": 1000,  # Use your default or lookup
                                    })
                                    # Early exit: check candidate
                                    if passes_checks(candidate):
                                        return tddbhd_input(**candidate)
    return None