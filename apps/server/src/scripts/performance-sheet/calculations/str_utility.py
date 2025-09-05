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

def calculate_str_utility(data: str_utility_input):
    """
    Calculate Straightener Utility values based on input data.

    Args: \n
        data (StrUtilityInput): Input data for calculations.
    
    Returns: \n
        StrUtilityOutput: Calculated values including required force, torque, horsepower, etc.
    
    Raises: \n
        HTTPException: If any input data is invalid or missing.
        ValueError: If any lookup fails or if calculations cannot be performed.
    
    """
    # Individual lookups with error handling
    if data.horsepower == 7.5:
        horsepower_string = "7.5"
    else:    
        horsepower_string = str(int(data.horsepower))

    try:
        str_roll_dia = get_str_model_value(data.str_model, "roll_diameter", "str_roll_dia")
    except:
        return "ERROR: Str roll diameter lookup failed."

    try:
        center_dist = get_str_model_value(data.str_model, "center_distance", "center_dist")
    except:
        return "ERROR: Center distance lookup failed."

    try:
        pinch_roll_dia = get_str_model_value(data.str_model, "pinch_roll_dia", "pinch_roll_dia")
    except:
        return "ERROR: Pinch roll diameter lookup failed."

    try:
        jack_force_available = get_str_model_value(data.str_model, "jack_force_avail", "jack_force_available")
    except:
        return "ERROR: Jack force available lookup failed."

    try:
        max_roll_depth = get_str_model_value(data.str_model, "min_roll_depth", "max_roll_depth")
    except:
        return "ERROR: Max roll depth lookup failed."

    try:
        str_gear_torque = get_str_model_value(data.str_model, "str_gear_torq", "str_gear_torque")
    except:
        return "ERROR: Str gear torque lookup failed."

    try:
        density = get_material_density(data.material_type)
    except:
        return "ERROR: Material density lookup failed."

    try:
        modulus = get_material_modulus(data.material_type)
    except:
        return "ERROR: Material modulus lookup failed."

    try:
        pinch_roll_teeth = get_str_model_value(data.str_model, "pr_teeth", "pinch_roll_teeth")
    except:
        return "ERROR: Pinch roll teeth lookup failed."

    try:
        pinch_roll_dp = get_str_model_value(data.str_model, "proll_dp", "pinch_roll_dp")
    except:
        return "ERROR: Pinch roll DP lookup failed."

    try:
        str_roll_teeth = get_str_model_value(data.str_model, "sroll_teeth", "str_roll_teeth")
    except:
        return "ERROR: Str roll teeth lookup failed."

    try:
        str_roll_dp = get_str_model_value(data.str_model, "sroll_dp", "str_roll_dp")
    except:
        return "ERROR: Str roll DP lookup failed."

    try:
        face_width = get_str_model_value(data.str_model, "face_width", "face_width")
    except:
        return "ERROR: Face width lookup failed."

    try:
        motor_inertia = get_motor_inertia(horsepower_string)
    except:
        return "ERROR: Motor inertia lookup failed."

    # Needed values for calculations
    str_qty = data.num_str_rolls

    # Calculate the coefficient for the constant based on the number of straightener rolls
    if str_qty < 7:
        k_cons = (str_qty / 3.5) + 0.1
    elif str_qty < 9:
        k_cons = str_qty / 3.5
    elif str_qty < 11:
        k_cons = (str_qty / 3.5) - 0.1
    else:
        k_cons = 3

    # Calculate the modulus of elasticity
    if data.str_model == "SPGPS-810" or data.str_model == "CPPS-306" or data.str_model == "CPPS-406" or data.str_model == "CPPS-507":
        ult_tensile_strength = 165100
    else:
        ult_tensile_strength = 128000

    # Calculate Lewis factors for the pinch and straightener rolls
    lewis_factor_pinch = LEWIS_FACTORS[pinch_roll_teeth]
    lewis_factor_str = LEWIS_FACTORS[str_roll_teeth]

    # Calculate the safe working stress
    safe_working_stress = ult_tensile_strength / 3
    accel_time = (data.feed_rate / 60) / data.acceleration

    # Constants
    motor_rpm = MOTOR_RPM
    eff = EFFICIENCY
    pinch_roll_qty = PINCH_ROLL_QTY
    mat_length = MAT_LENGTH
    cont_angle = CONT_ANGLE
    feed_rate_buffer = FEED_RATE_BUFFER

    # Required Force
    required_force = ((16 * data.yield_strength * data.coil_width * (data.material_thickness ** 2) / (15 * center_dist))
                    + (16 * data.yield_strength * data.coil_width * (data.material_thickness ** 2) / (15 * center_dist)) * 0.19)
    
    # Coil Outer Diameter Calculations
    coil_od_measured = sqrt((data.coil_id ** 2) + ((data.max_coil_weight * 4) / (pi * density * data.coil_width)))
    coil_od = min(coil_od_measured, data.coil_od)

    # Pinch / Str Roll / Material length and inertia calculations
    # Pinch Roll
    pinch_roll_length = data.str_width + 2
    pinch_roll_lbs = ((pinch_roll_dia ** 2) / 4) * pi * pinch_roll_length * pinch_roll_qty * 0.283
    pinch_roll_inertia = (pinch_roll_lbs / 32.3) * 0.5 * (((pinch_roll_dia * 0.5) ** 2) / 144) * 12
    pinch_ratio = motor_rpm / ((data.feed_rate * 12) / (pinch_roll_dia * pi))
    pinch_roll_refl_inertia = pinch_roll_inertia / (pinch_ratio ** 2)

    # Straightener Roll
    str_roll_length = data.str_width + 2
    str_roll_lbs = ((str_roll_dia ** 2) / 4) * pi * str_roll_length * data.num_str_rolls * 0.283
    str_roll_inertia = (str_roll_lbs / 32.3) * 0.5 * (((str_roll_dia * 0.5) ** 2) / 144) * 12
    str_ratio = motor_rpm / ((data.feed_rate * 12) / (str_roll_dia * pi))
    str_roll_refl_inertia = str_roll_inertia / (str_ratio ** 2)
    
    # Material Length
    mat_length_lbs = data.material_thickness * data.coil_width * density * mat_length
    mat_length_inertia = (mat_length_lbs / 32.3) * (((pinch_roll_dia * 0.5) ** 2) / 144) * 12
    mat_length_refl_inertia = mat_length_inertia / (pinch_ratio ** 2)

    # Max/Min OD Inertia
    max_od_inertia = (
        (
            (
                (
                    (coil_od ** 2)
                   / 4)
               * pi * data.coil_width * density)
           / 32.3)
       * 0.5 * (
           (
               (coil_od * 0.5)
              ** 2)
          / 144)
       ) * 12
    min_od_inertia = (
        (
            (
                (
                    (data.coil_id ** 2)
                   / 4)
               * pi * data.coil_width * density)
           / 32.3)
       * 0.5 * (
           (
               (data.coil_id * 0.5)
              ** 2)
          / 144)
       ) * 12

    # Max/Min OD Ratios
    max_od_ratio = (coil_od / pinch_roll_dia) * pinch_ratio
    min_od_ratio = (data.coil_id / pinch_roll_dia) * pinch_ratio

    # Max/Min OD Reflective Inertia
    max_od_refl_inertia = max_od_inertia / (max_od_ratio ** 2)
    min_od_refl_inertia = min_od_inertia / (min_od_ratio ** 2)

    # Max/Min OD Total Inertia
    max_od_total_inertia = pinch_roll_refl_inertia + str_roll_refl_inertia + mat_length_refl_inertia + max_od_refl_inertia
    min_od_total_inertia = pinch_roll_refl_inertia + str_roll_refl_inertia + mat_length_refl_inertia + min_od_refl_inertia

    # Torque
    str_torque = (
        (
            (
                (
                    (
                        (
                            (0.667 * data.yield_strength * data.coil_width * (data.material_thickness ** 2)) / center_dist)
                       * 0.35 * data.feed_rate * k_cons)
                   / 33000)
               * 5250)
           / motor_rpm)
       * 12) / eff
    
    # Coil Brake Torque
    coil_brake_torque = (
        (
            (
                (
                    (
                        (coil_od ** 2) / 4)
                   * pi * data.coil_width * density)
               / 32.3 * 0.5 * (
                   (
                       (coil_od * 0.5) ** 2) / 144)
               ) * 12) * (
                   (data.feed_rate * 12) / (coil_od * pi)
                   )
               ) / (9.55 * accel_time)

    # Max/Min OD Brake Torque
    max_od_brake_torque = (coil_brake_torque / ((coil_od / pinch_roll_dia) * pinch_ratio)) / eff
    min_od_brake_torque = (coil_brake_torque / ((data.coil_id / pinch_roll_dia) * pinch_ratio)) / eff

    # Max/Min OD Acceleration Torque
    max_od_accel_torque = (
        (
            (max_od_total_inertia * motor_rpm)
           / (9.55 * accel_time)
           ) * (1 / eff)
           ) + (
               (motor_inertia * motor_rpm)
              / (9.55 * accel_time)
              )
    min_od_accel_torque = (
        (
            (min_od_total_inertia * motor_rpm)
           / (9.55 * accel_time)
           ) * (1 / eff)
           ) + (
               (motor_inertia * motor_rpm)
              / (9.55 * accel_time)
              )

    # Max/Min OD Peak Torque
    max_od_pk_torque = str_torque + max_od_accel_torque + max_od_brake_torque
    min_od_pk_torque = str_torque + min_od_accel_torque + min_od_brake_torque

    # Gear Calculations
    rpm_at_roller_pinch = (data.feed_rate * 12) / (pi * pinch_roll_dia)
    pitch_dia_pinch = pinch_roll_teeth / pinch_roll_dp
    pitch_line_vel_pinch = (pi * rpm_at_roller_pinch * pitch_dia_pinch) / 12
    force_pitchline_pinch = (safe_working_stress * face_width * lewis_factor_pinch * 600) / (pinch_roll_dp * (600 + pitch_line_vel_pinch))
    horsepower_rated_pinch = (force_pitchline_pinch * pitch_line_vel_pinch) / 33000

    rpm_at_roller_str = (data.feed_rate * 12) / (pi * str_roll_dia)
    pitch_dia_str = str_roll_teeth / str_roll_dp
    pitch_line_vel_str = (pi * rpm_at_roller_str * pitch_dia_str) / 12
    force_pitchline_str = (safe_working_stress * face_width * lewis_factor_str * 600) / (str_roll_dp * (600 + pitch_line_vel_str))
    horsepower_rated_str = (force_pitchline_str * pitch_line_vel_str) / 33000

    # Horsepower required
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

    # Pinch Roll
    pinch_roll_req_torque = (str_torque * pinch_ratio / str_gear_torque) + min_od_brake_torque / 2 * pinch_ratio + (((max_od_total_inertia * motor_rpm) / (9.55 * accel_time)) * (1/eff)) * pinch_ratio / 2
    pinch_roll_rated_torque = (63025 * horsepower_rated_pinch) / rpm_at_roller_pinch

    # Str Roll
    str_roll_req_torque = (str_torque * str_ratio / str_gear_torque) + (((max_od_total_inertia * motor_rpm) / (9.55 * accel_time)) * (1 / eff)) * str_ratio / 2 * 7 / 11
    str_roll_rated_torque = (63025 * horsepower_rated_str) / rpm_at_roller_str

    # Actual Coil Weight
    actual_coil_weight = (((coil_od**2) - data.coil_id**2) / 4) * pi * data.coil_width * density

    # Checks
    # Required Force Check
    if jack_force_available > required_force:
        required_force_check = "OK"
    else:
        required_force_check = "NOT OK"

    # Backup Rolls Check
    if required_force >= (jack_force_available * 0.6):
        backup_rolls_reccomended = "Back Up Rolls Recommended"
    else:
        backup_rolls_reccomended = "Not Recommended"

    # Pinch Gear Check
    if pinch_roll_rated_torque > pinch_roll_req_torque:
        pinch_roll_check = "OK"
    else:
        pinch_roll_check = "NOT OK"

    # Str Gear Check
    if str_roll_rated_torque > str_roll_req_torque:
        str_roll_check = "OK"
    else:
        str_roll_check = "NOT OK"

    # Horsepower Check
    if data.horsepower > horsepower_required:
        horsepower_check = "OK"
    else:
        horsepower_check = "NOT OK"

    # FPM Check
    if data.feed_rate >= data.max_feed_rate * feed_rate_buffer:
        fpm_check = "FPM SUFFICIENT"
    else:
        fpm_check = "FPM INSUFFICIENT"

    # Feed Rate check
    if (fpm_check == "FPM SUFFICIENT" and 
        required_force_check == "OK" and
        pinch_roll_check == "OK" and
        str_roll_check == "OK" and
        horsepower_check == "OK"):
        if data.yield_met == "OK":
            feed_rate_check = "OK"
    else:
        feed_rate_check = "NOT OK"
    
    return {
        "required_force": round(required_force, 3), 
        "pinch_roll_dia" : round(pinch_roll_dia, 3),
        "pinch_roll_req_torque" : round(pinch_roll_req_torque, 3),
        "pinch_roll_rated_torque" : round(pinch_roll_rated_torque, 3),
        "str_roll_dia": round(str_roll_dia, 3),
        "str_roll_req_torque" : round(str_roll_req_torque, 3),
        "str_roll_rated_torque" : round(str_roll_rated_torque, 3),
        "horsepower_required": round(horsepower_required, 3),

        "center_dist" : round(center_dist, 3),
        "jack_force_available" : round(jack_force_available, 3),
        "max_roll_depth" : round(max_roll_depth, 3),
        "modulus" : round(modulus, 3),
        "pinch_roll_teeth" : round(pinch_roll_teeth, 3),
        "pinch_roll_dp" : round(pinch_roll_dp, 3),
        "str_roll_teeth" : round(str_roll_teeth, 3),
        "str_roll_dp" : round(str_roll_dp, 3),

        "cont_angle" : round(cont_angle, 3),
        "face_width" : round(face_width, 3),
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
