"""
Straightener Utility Calculation Module
"""

from models import str_utility_input
from math import pi, sqrt

from utils.shared import (
    MOTOR_RPM, EFFICIENCY, PINCH_ROLL_QTY, MAT_LENGTH, CONT_ANGLE, FEED_RATE_BUFFER,
    LEWIS_FACTORS, roll_str_backbend_state, get_percent_material_yielded_check
)

from utils.lookup_tables import (
    get_material_density, get_material_modulus, get_str_model_value, get_motor_inertia
)

def get_horsepower_string(horsepower):
    return "7.5" if horsepower == 7.5 else str(int(horsepower))

def get_str_model_lookups(str_model):
    return {
        "str_roll_dia": float(get_str_model_value(str_model, "roll_diameter", "str_roll_dia")),
        "center_dist": float(get_str_model_value(str_model, "center_distance", "center_dist")),
        "pinch_roll_dia": float(get_str_model_value(str_model, "pinch_roll_dia", "pinch_roll_dia")),
        "jack_force_available": float(get_str_model_value(str_model, "jack_force_avail", "jack_force_available")),
        "max_roll_depth": float(get_str_model_value(str_model, "min_roll_depth", "max_roll_depth")),
        "str_gear_torque": float(get_str_model_value(str_model, "str_gear_torq", "str_gear_torque")),
        "pinch_roll_teeth": int(get_str_model_value(str_model, "pr_teeth", "pinch_roll_teeth")),
        "pinch_roll_dp": int(get_str_model_value(str_model, "proll_dp", "pinch_roll_dp")),
        "str_roll_teeth": int(get_str_model_value(str_model, "sroll_teeth", "str_roll_teeth")),
        "str_roll_dp": int(get_str_model_value(str_model, "sroll_dp", "str_roll_dp")),
        "face_width": float(get_str_model_value(str_model, "face_width", "face_width"))
    }

def get_material_lookups(material_type, horsepower_string):
    return {
        "density": get_material_density(material_type),
        "modulus": get_material_modulus(material_type),
        "motor_inertia": get_motor_inertia(horsepower_string)
    }

def calc_k_cons(str_qty):
    if str_qty < 7:
        return (str_qty / 3.5) + 0.1
    elif str_qty < 9:
        return str_qty / 3.5
    elif str_qty < 11:
        return (str_qty / 3.5) - 0.1
    else:
        return 3

def calc_ult_tensile_strength(str_model):
    return 165100 if str_model in ["SPGPS-810", "CPPS-306", "CPPS-406", "CPPS-507"] else 128000

def calc_required_force(yield_strength, coil_width, thickness, center_dist):
    base = 16 * yield_strength * coil_width * (thickness ** 2) / (15 * center_dist)
    return base + base * 0.19

def calc_coil_od(coil_id, max_coil_weight, density, coil_width, coil_od):
    measured = sqrt((coil_id ** 2) + ((max_coil_weight * 4) / (pi * density * coil_width)))
    return min(measured, coil_od)

def calc_roll_inertia(dia, length, qty):
    lbs = ((dia ** 2) / 4) * pi * length * qty * 0.283
    inertia = (lbs / 32.3) * 0.5 * (((dia * 0.5) ** 2) / 144) * 12
    return lbs, inertia

def calc_ratio(motor_rpm, feed_rate, dia):
    # Prevent division by zero
    if feed_rate <= 0:
        feed_rate = 50.0  # Default to 50 FPM if feed_rate is 0 or negative
    if dia <= 0:
        dia = 1.0  # Default diameter if invalid
    denominator = (feed_rate * 12) / (dia * pi)
    if denominator == 0:
        return 1.0  # Default ratio to prevent division by zero
    return motor_rpm / denominator

def calc_refl_inertia(inertia, ratio):
    return inertia / (ratio ** 2)

def calc_mat_length_inertia(thickness, coil_width, density, mat_length, pinch_roll_dia):
    lbs = thickness * coil_width * density * mat_length
    inertia = (lbs / 32.3) * (((pinch_roll_dia * 0.5) ** 2) / 144) * 12
    return lbs, inertia

def calc_od_inertia(od, coil_width, density):
    lbs = ((od ** 2) / 4) * pi * coil_width * density
    inertia = (lbs / 32.3) * 0.5 * (((od * 0.5) ** 2) / 144) * 12
    return lbs, inertia

def calc_od_ratio(od, pinch_roll_dia, pinch_ratio):
    return (od / pinch_roll_dia) * pinch_ratio

def calc_total_inertia(*args):
    return sum(args)

def calc_str_torque(yield_strength, coil_width, thickness, center_dist, feed_rate, k_cons, motor_rpm, eff):
    torque = (((0.667 * yield_strength * coil_width * (thickness ** 2)) / center_dist) * 0.35 * feed_rate * k_cons / 33000 * 5250 / motor_rpm * 12) / eff
    return torque

def calc_coil_brake_torque(coil_od, coil_width, density, feed_rate, accel_time):
    inertia = (
        (
            (
                (
                    (coil_od ** 2)
                   / 4)
               * pi * coil_width * density)
           / 32.3)
       * 0.5 * (
           (
               (coil_od * 0.5)
              ** 2)
          / 144)
       ) * 12
    rpm = (feed_rate * 12) / (coil_od * pi)
    brake_torque = (inertia * rpm) / (9.55 * accel_time)
    return brake_torque

def calc_brake_torque(coil_brake_torque, od, pinch_roll_dia, pinch_ratio, eff):
    return (coil_brake_torque / ((od / pinch_roll_dia) * pinch_ratio)) / eff

def calc_accel_torque(total_inertia, motor_rpm, accel_time, eff, motor_inertia):
    return ((total_inertia * motor_rpm) / (9.55 * accel_time) * (1 / eff)) + ((motor_inertia * motor_rpm) / (9.55 * accel_time))

def calc_pk_torque(str_torque, accel_torque, brake_torque):
    return str_torque + accel_torque + brake_torque

def calc_gear_values(teeth, dp, face_width, safe_working_stress, lewis_factor, rpm, roll_dia):
    pitch_dia = teeth / dp
    pitch_line_vel = (pi * rpm * pitch_dia) / 12
    force_pitchline = (safe_working_stress * face_width * lewis_factor * 600) / (dp * (600 + pitch_line_vel))
    horsepower_rated = (force_pitchline * pitch_line_vel) / 33000
    return pitch_dia, pitch_line_vel, force_pitchline, horsepower_rated

def calc_rated_torque(horsepower_rated, rpm):
    return (63025 * horsepower_rated) / rpm

def calc_req_torque(str_torque, ratio, gear_torque, brake_torque, total_inertia, motor_rpm, accel_time, eff):
    return (str_torque * ratio / gear_torque) + brake_torque / 2 * ratio + (((total_inertia * motor_rpm) / (9.55 * accel_time)) * (1/eff)) * ratio / 2

def calc_actual_coil_weight(coil_od, coil_id, coil_width, density):
    return (((coil_od**2) - coil_id**2) / 4) * pi * coil_width * density

def check_value(val, ref):
    return "OK" if val >= ref else "NOT OK"

def check_backup_rolls(required_force, jack_force_available):
    return "Back Up Rolls Recommended" if required_force >= (jack_force_available * 0.6) else "Not Recommended"

def check_fpm(feed_rate, max_feed_rate, buffer):
    return "FPM SUFFICIENT" if feed_rate >= max_feed_rate * buffer else "FPM INSUFFICIENT"

def check_feed_rate(fpm_check, required_force_check, pinch_roll_check, str_roll_check, horsepower_check, yield_met):
    if (fpm_check == "FPM SUFFICIENT" and 
        required_force_check == "OK" and
        pinch_roll_check == "OK" and
        str_roll_check == "OK" and
        horsepower_check == "OK"):
        if yield_met == "OK":
            return "OK"
    return "NOT OK"

def calculate_str_utility(data: str_utility_input):
    horsepower_string = get_horsepower_string(data.horsepower)
    try:
        str_model = get_str_model_lookups(data.str_model)
        material = get_material_lookups(data.material_type, horsepower_string)
    except Exception as e:
        return f"ERROR: {e}"

    str_qty = data.num_str_rolls
    k_cons = calc_k_cons(str_qty)
    ult_tensile_strength = calc_ult_tensile_strength(data.str_model)
    lewis_factor_pinch = LEWIS_FACTORS[str_model["pinch_roll_teeth"]]
    lewis_factor_str = LEWIS_FACTORS[str_model["str_roll_teeth"]]
    safe_working_stress = ult_tensile_strength / 3
    accel_time = (data.feed_rate / 60) / max(data.acceleration, 0.1)  # Prevent division by zero with minimum acceleration

    motor_rpm = MOTOR_RPM
    eff = EFFICIENCY
    pinch_roll_qty = PINCH_ROLL_QTY
    mat_length = MAT_LENGTH
    cont_angle = CONT_ANGLE
    feed_rate_buffer = FEED_RATE_BUFFER

    required_force = calc_required_force(data.yield_strength, data.coil_width, data.material_thickness, str_model["center_dist"])
    coil_od = calc_coil_od(data.coil_id, data.max_coil_weight, material["density"], data.coil_width, data.coil_od)

    pinch_roll_length = data.str_width + 2
    pinch_roll_lbs, pinch_roll_inertia = calc_roll_inertia(str_model["pinch_roll_dia"], pinch_roll_length, pinch_roll_qty)
    pinch_ratio = calc_ratio(motor_rpm, data.feed_rate, str_model["pinch_roll_dia"])
    pinch_roll_refl_inertia = calc_refl_inertia(pinch_roll_inertia, pinch_ratio)

    str_roll_length = data.str_width + 2
    str_roll_lbs, str_roll_inertia = calc_roll_inertia(str_model["str_roll_dia"], str_roll_length, str_qty)
    str_ratio = calc_ratio(motor_rpm, data.feed_rate, str_model["str_roll_dia"])
    str_roll_refl_inertia = calc_refl_inertia(str_roll_inertia, str_ratio)

    mat_length_lbs, mat_length_inertia = calc_mat_length_inertia(data.material_thickness, data.coil_width, material["density"], mat_length, str_model["pinch_roll_dia"])
    mat_length_refl_inertia = calc_refl_inertia(mat_length_inertia, pinch_ratio)

    max_od_lbs, max_od_inertia = calc_od_inertia(coil_od, data.coil_width, material["density"])
    min_od_lbs, min_od_inertia = calc_od_inertia(data.coil_id, data.coil_width, material["density"])

    max_od_ratio = calc_od_ratio(coil_od, str_model["pinch_roll_dia"], pinch_ratio)
    min_od_ratio = calc_od_ratio(data.coil_id, str_model["pinch_roll_dia"], pinch_ratio)

    max_od_refl_inertia = calc_refl_inertia(max_od_inertia, max_od_ratio)
    min_od_refl_inertia = calc_refl_inertia(min_od_inertia, min_od_ratio)

    max_od_total_inertia = calc_total_inertia(pinch_roll_refl_inertia, str_roll_refl_inertia, mat_length_refl_inertia, max_od_refl_inertia)
    min_od_total_inertia = calc_total_inertia(pinch_roll_refl_inertia, str_roll_refl_inertia, mat_length_refl_inertia, min_od_refl_inertia)

    str_torque = calc_str_torque(data.yield_strength, data.coil_width, data.material_thickness, str_model["center_dist"], data.feed_rate, k_cons, motor_rpm, eff)
    coil_brake_torque = calc_coil_brake_torque(coil_od, data.coil_width, material["density"], data.feed_rate, accel_time)
    max_od_brake_torque = calc_brake_torque(coil_brake_torque, coil_od, str_model["pinch_roll_dia"], pinch_ratio, eff)
    min_od_brake_torque = calc_brake_torque(coil_brake_torque, data.coil_id, str_model["pinch_roll_dia"], pinch_ratio, eff)

    max_od_accel_torque = calc_accel_torque(max_od_total_inertia, motor_rpm, accel_time, eff, material["motor_inertia"])
    min_od_accel_torque = calc_accel_torque(min_od_total_inertia, motor_rpm, accel_time, eff, material["motor_inertia"])

    max_od_pk_torque = calc_pk_torque(str_torque, max_od_accel_torque, max_od_brake_torque)
    min_od_pk_torque = calc_pk_torque(str_torque, min_od_accel_torque, min_od_brake_torque)

    rpm_at_roller_pinch = (data.feed_rate * 12) / (pi * str_model["pinch_roll_dia"])
    _, _, _, horsepower_rated_pinch = calc_gear_values(
        str_model["pinch_roll_teeth"], str_model["pinch_roll_dp"], str_model["face_width"],
        safe_working_stress, lewis_factor_pinch, rpm_at_roller_pinch, str_model["pinch_roll_dia"]
    )
    rpm_at_roller_str = (data.feed_rate * 12) / (pi * str_model["str_roll_dia"])
    _, _, _, horsepower_rated_str = calc_gear_values(
        str_model["str_roll_teeth"], str_model["str_roll_dp"], str_model["face_width"],
        safe_working_stress, lewis_factor_str, rpm_at_roller_str, str_model["str_roll_dia"]
    )

    brake_option = data.auto_brake_compensation.lower()
    if brake_option == "no":
        horsepower_required = (min_od_pk_torque * motor_rpm) / 63000
        accel_torque = min_od_accel_torque
        brake_torque = min_od_brake_torque
    elif brake_option == "yes":
        horsepower_required = (max_od_pk_torque * motor_rpm) / 63000
        accel_torque = max_od_accel_torque
        brake_torque = max_od_brake_torque
    else:
        return "ERROR: Str Utility brake quantity invalid."

    pinch_roll_req_torque = calc_req_torque(str_torque, pinch_ratio, str_model["str_gear_torque"], min_od_brake_torque, max_od_total_inertia, motor_rpm, accel_time, eff)
    pinch_roll_rated_torque = calc_rated_torque(horsepower_rated_pinch, rpm_at_roller_pinch)
    str_roll_req_torque = (str_torque * str_ratio / str_model["str_gear_torque"]) + (((max_od_total_inertia * motor_rpm) / (9.55 * accel_time)) * (1 / eff)) * str_ratio / 2 * 7 / 11
    str_roll_rated_torque = calc_rated_torque(horsepower_rated_str, rpm_at_roller_str)
    actual_coil_weight = calc_actual_coil_weight(coil_od, data.coil_id, data.coil_width, material["density"])

    required_force_check = check_value(str_model["jack_force_available"], required_force)
    backup_rolls_reccomended = check_backup_rolls(required_force, str_model["jack_force_available"])
    pinch_roll_check = check_value(pinch_roll_rated_torque, pinch_roll_req_torque)
    str_roll_check = check_value(str_roll_rated_torque, str_roll_req_torque)
    horsepower_check = check_value(data.horsepower, horsepower_required)
    fpm_check = check_fpm(data.feed_rate, data.max_feed_rate, feed_rate_buffer)
    feed_rate_check = check_feed_rate(fpm_check, required_force_check, pinch_roll_check, str_roll_check, horsepower_check, data.yield_met)

    return {
        "required_force": round(required_force, 3), 
        "pinch_roll_dia" : round(str_model["pinch_roll_dia"], 3),
        "pinch_roll_req_torque" : round(pinch_roll_req_torque, 3),
        "pinch_roll_rated_torque" : round(pinch_roll_rated_torque, 3),
        "str_roll_dia": round(str_model["str_roll_dia"], 3),
        "str_roll_req_torque" : round(str_roll_req_torque, 3),
        "str_roll_rated_torque" : round(str_roll_rated_torque, 3),
        "horsepower_required": round(horsepower_required, 3),
        "center_dist" : round(str_model["center_dist"], 3),
        "jack_force_available" : round(str_model["jack_force_available"], 3),
        "max_roll_depth" : round(str_model["max_roll_depth"], 3),
        "modulus" : round(material["modulus"], 3),
        "pinch_roll_teeth" : round(str_model["pinch_roll_teeth"], 3),
        "pinch_roll_dp" : round(str_model["pinch_roll_dp"], 3),
        "str_roll_teeth" : round(str_model["str_roll_teeth"], 3),
        "str_roll_dp" : round(str_model["str_roll_dp"], 3),
        "cont_angle" : round(cont_angle, 3),
        "face_width" : round(str_model["face_width"], 3),
        "actual_coil_weight" : round(actual_coil_weight, 3),
        "coil_od" : round(coil_od, 3),
        "str_torque" : round(str_torque, 3),
        "acceleration_torque" : round(accel_torque, 3),
        "brake_torque" : round(brake_torque, 3),
        "backup_rolls_recommended" : backup_rolls_reccomended,
        "required_force_check" : required_force_check,
        "pinch_roll_check" : pinch_roll_check,
        "str_roll_check" : str_roll_check,
        "horsepower_check" : horsepower_check,
        "fpm_check" : fpm_check,
        "feed_rate_check" : feed_rate_check
    }