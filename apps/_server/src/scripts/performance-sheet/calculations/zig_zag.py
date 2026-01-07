"""
Zig Zag Calculation Module

"""
from models import zig_zag_input
from math import pi, sqrt, floor, atan
import json
import os

from utils.physics.time import calculate_feed_time

# Build path to the JSON file in utils
json_file_path = os.path.join(os.path.dirname(__file__), '..', 'utils', 'zig_zag_lookups.json')
json_file_path = os.path.abspath(json_file_path)

# Load the JSON data from the file
with open(json_file_path, 'r') as file:
    zig_zag_data = json.load(file)

# Separate zig zag data
zz_42_tooth = zig_zag_data.get("42_tooth", {})
zz_24_tooth = zig_zag_data.get("24_tooth", {})
gear_box = zig_zag_data.get("g_box", {})

def calculate_lbs_inertia(o_dia: float, i_dia: float, length: float, density: float) -> float:
    """
    Calculate the weight in pounds and inertia for a cylindrical object.

    Args:
        o_dia (float): Outer diameter of the cylinder in inches.
        i_dia (float): Inner diameter of the cylinder in inches (0 if solid).
        length (float): Length of the cylinder in inches.
        density (float): Density of the material in lb/in^3.

    Returns:
        tuple: A tuple containing:
            - lbs (float): Weight in pounds.
            - inertia (float): Inertia in lb-in^2.
            - refl_inertia (float): Reflected inertia in lb-in^2.
    """
    if i_dia == 0:
        lbs = ((o_dia ** 2) / 4) * pi * length * density
        inertia = ((lbs / 32.3) * 0.5 * (((o_dia * 0.5) ** 2) / 144)) * 12
    else:
        lbs = (((o_dia ** 2) - (i_dia ** 2)) / 4) * pi * length * density
        inertia = ((lbs / 32.3) * 0.5 * ((((o_dia * 0.5) ** 2) + ((i_dia * 0.5) ** 2)) / 144)) * 12
    
    refl_inertia = inertia / (gear_box["ratio"] ** 2)
    
    return lbs, inertia, refl_inertia

def calculate_common_values(accel_time: float, run_time: float, settle_time: float, feed_angle: float,
                           peak_torque: float, accel_torque: float, torque_to_accel_drag: float,
                           friction_at_motor: float, loop_torque: float, setttle_torque: float,
                           pivot_to_screw: float, length: float,):
    """
    Calculate common values used in the zig-zag calculations.

    Args:
        accel_time (float): Time taken to accelerate in seconds.
        run_time (float): Time taken to run in seconds.
        settle_time (float): Time taken to settle in seconds.
        feed_angle (float): Feed angle in degrees.
        peak_torque (float): Peak torque in lb-in.
        accel_torque (float): Acceleration torque in lb-in.
        torque_to_accel_drag (float): Torque to acceleration drag in lb-in.
        friction_at_motor (float): Friction at motor in lb-in.
        loop_torque (float): Loop torque in lb-in.
        setttle_torque (float): Settle torque in lb-in.
        pivot_to_screw (float): Distance from pivot to screw in inches.
        length (float): Length of the material in inches.

    Returns:
        tuple: A tuple containing:
            - move_time (float): Total move time in seconds.
            - cycle_time (float): Total cycle time in seconds.
            - strokes_per_minute (float): Strokes per minute.
            - dwell_time (float): Dwell time in seconds.
            - rms_torque (float): Root mean square torque in lb-in.
            - deg_of_rotation (float): Degrees of rotation.
    """
    move_time = (accel_time * 2) + run_time + settle_time

    if feed_angle > 20:
        cycle_time = move_time * (360 / feed_angle)
    else:
        cycle_time = move_time + feed_angle
    strokes_per_minute = 60 / cycle_time
    dwell_time = cycle_time - move_time

    rms_torque = sqrt(
        (((peak_torque ** 2) * accel_time) +
         ((accel_torque ** 2) * accel_time) +
         (((torque_to_accel_drag + friction_at_motor + loop_torque) ** 2) * run_time) +
         ((setttle_torque ** 2) * settle_time) +
         ((loop_torque ** 2) * dwell_time)) / cycle_time
    )

    if pivot_to_screw > 0:
        deg_of_rotation = atan((length / 2) / pivot_to_screw) * 360 / 2 / pi * 2
    else:
        deg_of_rotation = 0

    return move_time, cycle_time, strokes_per_minute, dwell_time, rms_torque, deg_of_rotation

def calculate_init_values(init_length: float, motor_peak_torque: float, max_accel_rate: float,
                           max_velocity: float):
    """
    Calculate initial acceleration and run times based on the initial length,
    motor peak torque, maximum acceleration rate, and maximum velocity.

    Args:
        init_length (float): Initial length of the material in inches.
        motor_peak_torque (float): Peak torque of the motor in lb-in.
        max_accel_rate (float): Maximum acceleration rate in inches/sec^2.
        max_velocity (float): Maximum velocity in inches/sec.

    Returns:
        tuple: A tuple containing:
            - accel_time (float): Time taken to accelerate in seconds.
            - run_time (float): Time taken to run in seconds.
    """
    accel_time = max_velocity / max_accel_rate

    if ((init_length - ((motor_peak_torque * accel_time) / 12)) / 12) / motor_peak_torque > 0:
        run_time = ((init_length - ((motor_peak_torque * accel_time) * 12)) / 12) / motor_peak_torque
    else:
        run_time = 0

    return accel_time, run_time

def calculate_values(length: float, init_length: float, max_velocity: float,
                      max_accel_rate: float, init_accel_time: float):
    """
    Calculate acceleration and run times based on the length of the material,
    initial length, maximum velocity, maximum acceleration rate, and initial acceleration time.

    Args:
        length (float): Length of the material in inches.
        init_length (float): Initial length of the material in inches.
        max_velocity (float): Maximum velocity in inches/sec.
        max_accel_rate (float): Maximum acceleration rate in inches/sec^2.
        init_accel_time (float): Initial acceleration time in seconds.

    Returns:
        tuple: A tuple containing:
            - accel_time (float): Time taken to accelerate in seconds.
            - run_time (float): Time taken to run in seconds.
    """
    if length > init_length:
        accel_time = init_accel_time
        run_time = ((length - init_length) / 12) / max_velocity
    else:
        accel_time = sqrt((length / 12) / max_accel_rate)
        run_time = 0

    return accel_time, run_time

def calculate_table_values(min_length: float, init_length: float, incriment: float, max_accel_rate: float, max_velocity: float,
                           motor_peak_torque: float, settle_time: float, feed_angle: float,
                           friction_at_motor: float, loop_torque: float, setttle_torque: float, max_motor_speed: float,
                           ball_screw: float, screw_lead: float, weight_drag: float, ratio: float, efficiency: float,
                           refl_inertia: float, pivot_to_screw: float, weight_to_accel: float, motor_inertia: float):
    """
    Calculate the table values for the zig-zag motion based on various parameters.

    Args:
        min_length (float): Minimum length of the material in inches.
        init_length (float): Initial length of the material in inches.
        incriment (float): Increment value for length in inches.
        max_accel_rate (float): Maximum acceleration rate in inches/sec^2.
        max_velocity (float): Maximum velocity in inches/sec.
        motor_peak_torque (float): Peak torque of the motor in lb-in.
        settle_time (float): Settle time in seconds.
        feed_angle (float): Feed angle in degrees.
        friction_at_motor (float): Friction at the motor in lb-in.
        loop_torque (float): Loop torque in lb-in.
        setttle_torque (float): Settle torque in lb-in.
        max_motor_speed (float): Maximum motor speed in RPM.
        ball_screw (int): Ball screw flag (0 or 1).
        screw_lead (float): Screw lead in inches.
        weight_drag (float): Weight drag in lb.
        ratio (float): Gearbox ratio.
        efficiency (float): Efficiency of the system.
        refl_inertia (float): Reflected inertia of the system in lb-in^2.
        pivot_to_screw (float): Distance from pivot to screw in inches.
        weight_to_accel (float): Weight to accelerate in lb.
        motor_inertia (float): Motor inertia in lb-in^2.

    Returns:
        dict: A dictionary containing the calculated table values and other parameters.
    """    
    table_values = []
    
    if ball_screw == 0:
        ln_lb_torque_force_out = screw_lead * 0.177
    else:
        ln_lb_torque_force_out = 0.3 * screw_lead
    ###############################
    # Torque Calculations
    ###############################
    temp = (max_motor_speed / 60 * 2 * pi / init_accel_time)

    # Torque to acceleration drag (accel F)
    torque_to_accel_drag = weight_drag * ln_lb_torque_force_out / ratio / efficiency

    # Torque to accel refl inertia (j-r)
    torque_to_accel_refl_inertia = temp * refl_inertia / efficiency

    # Torque to accel weight (accel #)
    if pivot_to_screw == 0:
        torque_to_accel_weight = ((weight_to_accel / 32.3 * max_accel_rate) * weight_to_accel) / ratio
    else:
        torque_to_accel_weight = weight_to_accel / ratio * ln_lb_torque_force_out
    torque_to_accel_weight /= efficiency

    # Torque to accel motor
    torque_to_accel_motor = temp * motor_inertia

    # Acceleration torque
    accel_torque = torque_to_accel_drag + torque_to_accel_refl_inertia + torque_to_accel_weight + torque_to_accel_motor

    # Peak torque
    peak_torque = accel_torque + friction_at_motor + loop_torque

    # Torque not used in accel
    torque_not_used = accel_torque - torque_to_accel_motor

    #######################
    # initial value calculations
    #######################
    init_accel_time, init_run_time = calculate_init_values(
        min_length, motor_peak_torque, max_accel_rate, max_velocity
    )
    
    init_move_time, init_cycle_time, init_strokes_per_minute, init_dwell_time, init_rms_torque, \
        init_deg_of_rotation = calculate_common_values(
            init_accel_time, init_run_time, settle_time, feed_angle,
            peak_torque, accel_torque, torque_to_accel_drag, friction_at_motor,
            loop_torque, setttle_torque, pivot_to_screw, init_length
    )

    table_values = [{
        "index": 0,
        "length": init_length,
        "accel_time": init_accel_time,
        "run_time": init_run_time,
        "move_time": init_move_time,
        "cycle_time": init_cycle_time,
        "strokes_per_minute": init_strokes_per_minute,
        "dwell_time": init_dwell_time,
        "rms_torque": init_rms_torque,
        "deg_of_rotation": init_deg_of_rotation,
    }]

    for i in range(1, 23):
        accel_time, run_time = calculate_values(
            min_length + (incriment * i),
            init_length,
            max_velocity,
            max_accel_rate,
            init_accel_time
        )

        move_time, cycle_time, strokes_per_minute, dwell_time, rms_torque, deg_of_rotation = calculate_common_values(
            accel_time, run_time, settle_time, feed_angle,
            peak_torque, accel_torque, torque_to_accel_drag, friction_at_motor,
            loop_torque, setttle_torque, pivot_to_screw,
            min_length + (incriment * i)
        )

        table_values.append({
            "index": i,
            "length": min_length + (incriment * i),
            "accel_time": accel_time,
            "run_time": run_time,
            "move_time": move_time,
            "cycle_time": cycle_time,
            "strokes_per_minute": strokes_per_minute,
            "dwell_time": dwell_time,
            "rms_torque": rms_torque,
            "deg_of_rotation": deg_of_rotation
        })

    # rms torque calculations
    rms_torque = sqrt(((motor_peak_torque ** 2 * init_accel_time) + (accel_torque ** 2 * init_accel_time) + 
                       (setttle_torque ** 2 * settle_time) + (loop_torque ** 2 * init_dwell_time)) / init_cycle_time)

    return {
        "table_values": table_values,
        "torque_to_accel_drag": torque_to_accel_drag,
        "torque_to_accel_refl_inertia": torque_to_accel_refl_inertia,
        "torque_to_accel_weight": torque_to_accel_weight,
        "torque_to_accel_motor": torque_to_accel_motor,
        "accel_torque": accel_torque,
        "peak_torque": peak_torque,
        "rms_torque": rms_torque,
        "torque_not_used": torque_not_used,
        "ln_lb_torque_force_out": ln_lb_torque_force_out
    }

def calculate_zig_zag(data: zig_zag_input):
    """
    Calculate the zig-zag motion parameters based on the input data.

    Args:
        data (ZigZagInput): Input data containing parameters for the zig-zag motion.

    Returns:
        dict: A dictionary containing the calculated parameters for the zig-zag motion.
    """
    #########################
    # Variables
    #########################
    max_motor_speed = 2000
    motor_inertia = 0.0062
    motor_peak_torque = 240
    motor_rms_torque = 87
    max_accel_rate = 7
    screw_lead = 1
    ball_screw = 0

    settle_torque = 50
    settle_time = 0.045

    weight_to_accel = 1000
    coef_of_friction = 0.1

    unknown_o_dia = 0
    unknown_i_dia = 0
    unknown_length = 0
    unknown_density = 0
    unknown_qty = 0
    unknown_lbs = 0

    # Ratio calculations
    ratio = gear_box["ratio"] * zz_42_tooth["drive_sheave"]["o_dia"] / zz_24_tooth["drive_sheave"]["o_dia"]

    # Max velocity calculations
    max_velocity = max_motor_speed / ratio * screw_lead / 12 / 60

    ##########################
    # Material calculations
    ##########################
    mystery_value = 0
    # material loop
    if mystery_value == 12:
        material_loop = 80
    elif mystery_value == 18:
        material_loop = 60
    elif mystery_value == 24:
        material_loop = 40
    else:
        material_loop = 0
    
    # material lbs
    material_lbs = data.material_width * data.material_thickness * data.material_density * material_loop

    # material inertia
    material_inertia = (
        (data.material_width * data.material_thickness * data.material_length_flat * data.material_density) / 32.3
        ) * (((zz_42_tooth["drive_sheave"]["o_dia"] * 0.5) ** 2) / 144) * 12

    # material relf inertia
    material_refl_inertia = material_inertia / (ratio ** 2)

    # Loop torque calculations
    loop_torque = ((material_lbs * (data.lead_screw_o_dia * 0.5)) / ratio) / gear_box["efficiency"]

    # Weight drag calculations
    if data.pivot_to_screw == 0:
        weight_drag = weight_to_accel * coef_of_friction
    else:
        weight_drag = coef_of_friction * data.total_load

    # Screw axial load
    if data.pivot_to_screw == 0:
        screw_axial_load = weight_to_accel / 32.3 * max_accel_rate + weight_drag
    else:
        screw_axial_load = weight_to_accel + weight_drag

    # Screw RPM
    screw_rpm = max_motor_speed / ratio

    # Lead screw calculations
    lead_screw_lbs, lead_screw_inertia, lead_screw_refl_inertia = calculate_lbs_inertia(
        data.lead_screw_o_dia, 
        data.lead_screw_i_dia, 
        data.lead_screw_length, 
        data.lead_screw_density
    )

    ##########################
    # 42 tooth calculations
    ##########################
    # Drive sheave calculations
    drive_42_lbs, drive_42_inertia, drive_42_refl_inertia = calculate_lbs_inertia(
        zz_42_tooth["drive_sheave"]["o_dia"], 
        zz_42_tooth["drive_sheave"]["i_dia"], 
        zz_42_tooth["drive_sheave"]["length"], 
        zz_42_tooth["drive_sheave"]["density"]
    )

    # Bush 1 calculations
    bush_1_42_lbs, bush_1_42_inertia, bush_1_42_refl_inertia = calculate_lbs_inertia(
        zz_42_tooth["bush_1"]["o_dia"], 
        zz_42_tooth["bush_1"]["i_dia"], 
        zz_42_tooth["bush_1"]["length"], 
        zz_42_tooth["bush_1"]["density"]
    )

    # Bush 2 calculations
    bush_2_42_lbs, bush_2_42_inertia, bush_2_42_refl_inertia = calculate_lbs_inertia(
        zz_42_tooth["bush_2"]["o_dia"], 
        zz_42_tooth["bush_2"]["i_dia"], 
        zz_42_tooth["bush_2"]["length"], 
        zz_42_tooth["bush_2"]["density"]
    )

    ##########################
    # 24 tooth calculations
    ##########################
    # Drive sheave calculations
    drive_24_lbs, drive_24_inertia, drive_24_refl_inertia = calculate_lbs_inertia(
        zz_24_tooth["drive_sheave"]["o_dia"], 
        zz_24_tooth["drive_sheave"]["i_dia"], 
        zz_24_tooth["drive_sheave"]["length"], 
        zz_24_tooth["drive_sheave"]["density"]
    )

    # Bush 1 calculations
    bush_1_24_lbs, bush_1_24_inertia, bush_1_24_refl_inertia = calculate_lbs_inertia(
        zz_24_tooth["bush_1"]["o_dia"], 
        zz_24_tooth["bush_1"]["i_dia"], 
        zz_24_tooth["bush_1"]["length"], 
        zz_24_tooth["bush_1"]["density"]
    )

    # Bush 2 calculations
    bush_2_24_lbs, bush_2_24_inertia, bush_2_24_refl_inertia = calculate_lbs_inertia(
        zz_24_tooth["bush_2"]["o_dia"], 
        zz_24_tooth["bush_2"]["i_dia"], 
        zz_24_tooth["bush_2"]["length"], 
        zz_24_tooth["bush_2"]["density"]
    )

    # Gearbox refl inertia
    g_box_refl_inertia = gear_box["inertia"] * gear_box["qty"]

    # Total inertia calculations
    total_refl_inertia = (
        lead_screw_refl_inertia + 
        drive_42_refl_inertia + 
        bush_1_42_refl_inertia + 
        bush_2_42_refl_inertia + 
        drive_24_refl_inertia + 
        bush_1_24_refl_inertia + 
        bush_2_24_refl_inertia + 
        g_box_refl_inertia
    )

    # Match calculations
    match = total_refl_inertia / motor_inertia

    ###############################
    # Table values calculations 
    ###############################
    # Initial length calculations
    init_length = ((max_velocity / max_accel_rate) * max_velocity) * 12

    # Calculate table values
    table_values, torque_to_accel_drag, torque_to_accel_refl_inertia, torque_to_accel_weight, torque_to_accel_motor, \
        accel_torque, peak_torque, rms_torque, torque_not_used, ln_lb_torque_force_out = calculate_table_values(
            data.min_length, init_length, data.incriment, max_accel_rate, max_velocity,
            motor_peak_torque, settle_time, data.feed_angle,
            data.misc_friction_at_motor, loop_torque, settle_torque, max_motor_speed,
            ball_screw, screw_lead, weight_drag, ratio, data.efficiency,
            total_refl_inertia, data.pivot_to_screw, weight_to_accel, motor_inertia
    )

    return {
        "ratio": ratio,
        "max_motor_speed": max_motor_speed,
        "motor_inertia": motor_inertia,
        "motor_peak_torque": motor_peak_torque,
        "motor_rms_torque": motor_rms_torque,
        "max_accel_rate": max_accel_rate,
        "max_velocity": max_velocity,
        "loop_torque": loop_torque,
        "settle_torque": settle_torque,
        "settle_time": settle_time,
        "screw_lead": screw_lead,
        "ball_screw": ball_screw,
        "weight_to_accel": weight_to_accel,
        "coef_of_friction": coef_of_friction,
        "weight_drag": weight_drag,
        "screw_axial_load": screw_axial_load,

        "screw_rpm": screw_rpm,
        "refl_inertia": total_refl_inertia,
        "match": match,
        "peak_torque": peak_torque,
        "rms_torque": rms_torque,
        "accel_torque": accel_torque,
        
        "table_values": table_values,

        "lead_screw": {
            "lbs": lead_screw_lbs,
            "inertia": lead_screw_inertia,
            "refl_inertia": lead_screw_refl_inertia,
            "o_dia": data.lead_screw_o_dia,
            "i_dia": data.lead_screw_i_dia,
            "length": data.lead_screw_length,
            "density": data.lead_screw_density,
            "qty": data.lead_screw_qty
        },

        "drive_42_sheave": {
            "lbs": drive_42_lbs,
            "inertia": drive_42_inertia,
            "refl_inertia": drive_42_refl_inertia,
            "o_dia": zz_42_tooth["drive_sheave"]["o_dia"],
            "i_dia": zz_42_tooth["drive_sheave"]["i_dia"],
            "length": zz_42_tooth["drive_sheave"]["length"],
            "density": zz_42_tooth["drive_sheave"]["density"]
        },

        "bush_1_42": {
            "lbs": bush_1_42_lbs,
            "inertia": bush_1_42_inertia,
            "refl_inertia": bush_1_42_refl_inertia,
            "o_dia": zz_42_tooth["bush_1"]["o_dia"],
            "i_dia": zz_42_tooth["bush_1"]["i_dia"],
            "length": zz_42_tooth["bush_1"]["length"],
            "density": zz_42_tooth["bush_1"]["density"]
        },

        "bush_2_42": {
            "lbs": bush_2_42_lbs,
            "inertia": bush_2_42_inertia,
            "refl_inertia": bush_2_42_refl_inertia,
            "o_dia": zz_42_tooth["bush_2"]["o_dia"],
            "i_dia": zz_42_tooth["bush_2"]["i_dia"],
            "length": zz_42_tooth["bush_2"]["length"],
            "density": zz_42_tooth["bush_2"]["density"]
        },

        "drive_24_sheave": {
            "lbs": drive_24_lbs,
            "inertia": drive_24_inertia,
            "refl_inertia": drive_24_refl_inertia,
            "o_dia": zz_24_tooth["drive_sheave"]["o_dia"],
            "i_dia": zz_24_tooth["drive_sheave"]["i_dia"],
            "length": zz_24_tooth["drive_sheave"]["length"],
            "density": zz_24_tooth["drive_sheave"]["density"]
        },

        "bush_1_24": {
            "lbs": bush_1_24_lbs,
            "inertia": bush_1_24_inertia,
            "refl_inertia": bush_1_24_refl_inertia,
            "o_dia": zz_24_tooth["bush_1"]["o_dia"],
            "i_dia": zz_24_tooth["bush_1"]["i_dia"],
            "length": zz_24_tooth["bush_1"]["length"],
            "density": zz_24_tooth["bush_1"]["density"]
        },

        "bush_2_24": {
            "lbs": bush_2_24_lbs,
            "inertia": bush_2_24_inertia,
            "refl_inertia": bush_2_24_refl_inertia,
            "o_dia": zz_24_tooth["bush_2"]["o_dia"],
            "i_dia": zz_24_tooth["bush_2"]["i_dia"],
            "length": zz_24_tooth["bush_2"]["length"],
            "density": zz_24_tooth["bush_2"]["density"]
        },

        "gear_box": {
            "ratio": gear_box["ratio"],
            "inertia": gear_box["inertia"],
            "qty": gear_box["qty"],
            "refl_inertia": g_box_refl_inertia
        },

        "material": {
            "lbs": material_lbs,
            "inertia": material_inertia,
            "refl_inertia": material_refl_inertia,
            "width": data.material_width,
            "thickness": data.material_thickness,
            "length_flat": data.material_length_flat,
            "density": data.material_density
        },

        "torque_to_accel_drag": torque_to_accel_drag,
        "torque_to_accel_refl_inertia": torque_to_accel_refl_inertia,
        "torque_to_accel_weight": torque_to_accel_weight,
        "torque_to_accel_motor": torque_to_accel_motor,
        "torque_not_used": torque_not_used,
        "ln_lb_torque_force_out": ln_lb_torque_force_out
    }