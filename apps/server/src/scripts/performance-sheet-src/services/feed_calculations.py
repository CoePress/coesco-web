"""
Feed calculations service module

"""

from models import feed_w_pull_thru_input, base_feed_params, time_input, inertia_input, regen_input
from math import pi, sqrt
from utils.lookup_tables import get_material_density, get_sigma_five_specs, get_sigma_five_pt_specs, get_ab_feed_specs, get_selected_str_used
from utils.physics.inertia import calculate_total_refl_inertia
from utils.physics.time import calculate_time
from utils.physics.regen import calculate_regen

# Map for dynamic getter selection
SPEC_GETTERS = {
    "sigma_five": get_sigma_five_specs,
    "sigma_five_pt": get_sigma_five_pt_specs,
    "allen_bradley": get_ab_feed_specs
}

# Common spec keys
SPEC_KEYS_SIGMA_FIVE = {
    "max_motor_rpm": ("max_mtr_torque", "max_motor_rpm"),
    "motor_inertia": ("mot_inertia", "motor_inertia"),
    "motor_peak_torque": ("mot_peak_torque", "motor_peak_torque"),
    "motor_rms_torque": ("mot_rms_tq", "motor_rms_torque"),
    "l_roll": ("l_roll", "lower_roll"),
    "u_roll": ("u_roll", "upper_roll"),
    "ratio": ("ratio", "ratio"),
    "efficiency": ("efficiency", "efficiency"),
    "settle_torque": ("settle_tor", "settle_torque"),
    "friction_torque": ("fric_torque", "friction_torque"),
    "watts_lost": ("watts_lost", "watts_lost"),
    "ec": ("ec", "ec"),
}

# Flexible spec loader
def get_all_specs_for(spec_type, feed_model, spec_keys):
    """
    Dynamically retrieves specifications based on the spec type and model.
    
    Args:
        spec_type (str): Type of specification to retrieve (e.g., "sigma_five", "sigma_five_pt", "allen_bradley").
        feed_model (str): The model of the feed system.
        spec_keys (dict): Dictionary mapping variable names to their lookup keys.
        
    Returns:
        dict: A dictionary containing the retrieved specifications.

    Raises:
        ValueError: If the spec_type is not recognized or if a lookup fails.    
    """
    getter_func = SPEC_GETTERS[spec_type]
    results = {}
    for var_name, (lookup1, lookup2) in spec_keys.items():
        try:
            results[var_name] = getter_func(feed_model, lookup1, lookup2)
        except ValueError:
            if lookup1 == "fric_torque" or lookup2 == "friction_torque":
                results[var_name] = 0
            else:
                raise ValueError(f"Failed to get spec for {var_name} using {lookup1} or {lookup2} in {spec_type}")
    return results

def run_sigma_five_calculation(data: base_feed_params, spec_type="sigma_five"):
    """
    Sigma Five feed calculation service function.
    
    Args:
        data (FeedInput): Input data containing feed parameters.
        spec_type (str): Type of specification, defaults to "sigma_five".
    
    Returns:
        dict: A dictionary containing calculated feed parameters.
    
    Raises:
        ValueError: If the spec_type is not recognized or if a lookup fails.
    """
    density = get_material_density(data.material_type)
    str_used = get_selected_str_used(data.type_of_line)

    # Dynamically pull specs
    spec_values = get_all_specs_for(spec_type, data.feed_model, SPEC_KEYS_SIGMA_FIVE)

    max_motor_rpm = spec_values["max_motor_rpm"]
    motor_inertia = spec_values["motor_inertia"]
    motor_peak_torque = spec_values["motor_peak_torque"]
    motor_rms_torque = spec_values["motor_rms_torque"]
    l_roll = spec_values["l_roll"]
    u_roll = spec_values["u_roll"]
    ratio = spec_values["ratio"]
    efficiency = spec_values["efficiency"]
    settle_torque = spec_values["settle_torque"]
    friction_torque = spec_values["friction_torque"]
    watts_lost = spec_values["watts_lost"]
    ec = spec_values["ec"]

    # Max Velocity ft/min
    max_vel = max_motor_rpm / ratio * (l_roll * pi / 720) * 60

    # Frictional Torque
    if "sigma_five" in spec_type:
        frictional_torque = (u_roll * 0.5 * data.friction_in_die) / ratio + friction_torque
    else:
        frictional_torque = (u_roll * 0.5 * data.friction_in_die) / ratio

    # Loop Torque
    if data.loop_pit.lower() == "y" or data.loop_pit.lower() == "yes":
        material_loop = data.material_thickness * 360 * pi * 2
    else:
        material_loop = data.material_thickness * 360 * pi
    loop_torque = ((data.material_width * data.material_thickness * density * material_loop * 0.5) * u_roll * 0.5) / ratio / efficiency

    # Calculate refl inertia
    inertia = inertia_input(
        feed_model = data.feed_model,
        width = data.width,
        thickness = data.material_thickness,
        density = density,
        press_bed_length = data.press_bed_length,
        material_loop = data.material_width,
        ratio = ratio,
        efficiency = efficiency,
        roll_width = data.roll_width,
        material_width = data.material_width
    )

    # Calculate refl inertia
    refl_inertia = calculate_total_refl_inertia(inertia)

    # Match calculation
    match = refl_inertia / motor_inertia
    if match < 10:
        settle_time = 0.035
    else:
        settle_time = 0.06

    # Velocity and RPM 
    velocity = max_motor_rpm / ratio * (l_roll * pi / 720)
    rpm = ((velocity * 720) / (u_roll * pi)) * ratio

    if spec_type == "sigma_five":
        # Str Max SP
        if str_used.lower() == "y" or str_used.lower() == "yes":
            str_max_sp = data.feed_rate
        else:
            str_max_sp = max_vel

        # Str Max SP Inch
        str_max_sp_inch = str_max_sp * 12
    else:
        str_max_sp = 0
        str_max_sp_inch = 0

    # Time calculations
    time = time_input(
        acceleration = data.acceleration_rate,
        application = data.application,
        feed_angle_1 = data.feed_angle_1,
        feed_angle_2 = data.feed_angle_2,
        frictional_torque = frictional_torque,
        increment = data.length_increment,
        loop_torque = loop_torque,
        match = match,

        min_length = data.chart_min_length,
        motor_inertia = motor_inertia,
        motor_rms_torque = motor_rms_torque,
        motor_peak_torque = motor_peak_torque,

        ratio = ratio,
        efficiency = efficiency,
        refl_inertia = refl_inertia,
        rpm = rpm,
        settle_time = settle_time,
        settle_torque = settle_torque,

        str_max_sp = str_max_sp, 
        str_max_sp_inch = str_max_sp_inch,
        velocity = velocity,
        width = data.width,
        material_width = data.material_width,
        material_thickness = data.material_thickness,
        press_bed_length = data.press_bed_length,
        density = density,
        material_loop = material_loop
    )

    # Calculate time values
    time_values = calculate_time(time)
    feed_angle_1_values = time_values["feed_angle_1"]
    feed_angle_2_values = time_values["feed_angle_2"]

    # Table values
    table_values = []
    if len(feed_angle_1_values) == len(feed_angle_2_values):
        for i in range(len(feed_angle_1_values)):
            table_values.append({
                "length": feed_angle_1_values[i]["length"],
                "rms_torque_fa1": feed_angle_1_values[i]["rms_torque"],
                "rms_torque_fa2": feed_angle_2_values[i]["rms_torque"],
                "spm_at_fa1": feed_angle_1_values[i]["strokes_per_minute"],
                "fpm_fa1":  ((feed_angle_1_values[i]["length"] * feed_angle_1_values[i]["strokes_per_minute"]) / 12),
                "index_time_fa1": feed_angle_1_values[i]["index_time"],
                "spm_at_fa2": feed_angle_2_values[i]["strokes_per_minute"],
                "fpm_fa2":  ((feed_angle_2_values[i]["length"] * feed_angle_2_values[i]["strokes_per_minute"]) / 12),
                "index_time_fa2": feed_angle_2_values[i]["index_time"],
            })

    # Acceleration Torque
    acceleration_torque = (((refl_inertia * rpm) / (9.55 * feed_angle_1_values[0]["acceleration_time"])) / efficiency) + ((motor_inertia * rpm) / (9.55 * feed_angle_1_values[0]["acceleration_time"]))

    # Peak Torque
    peak_torque = acceleration_torque + frictional_torque + loop_torque

    # RMS Torques
    if spec_type == "sigma_five_pt":
        rms_torque_fa1_list = [row["rms_torque"] for row in feed_angle_1_values]
        rms_torque_fa2_list = [row["rms_torque"] for row in feed_angle_2_values]

        rms_torque_fa1 = max(rms_torque_fa1_list) if rms_torque_fa1_list else 0
        rms_torque_fa2 = max(rms_torque_fa2_list) if rms_torque_fa2_list else 0
    else:    
        rms_torque_fa1 = sqrt(((peak_torque ** 2 * feed_angle_1_values[0]["acceleration_time"]) + 
                                (acceleration_torque ** 2 * feed_angle_1_values[0]["acceleration_time"]) + 
                                (settle_torque ** 2 * settle_time) + (loop_torque ** 2 * feed_angle_1_values[0]["dwell_time"])) / 
                                (feed_angle_1_values[0]["cycle_time"]))
        rms_torque_fa2 = sqrt(((peak_torque ** 2 * feed_angle_2_values[0]["acceleration_time"]) +
                                (acceleration_torque ** 2 * feed_angle_2_values[0]["acceleration_time"]) + 
                                (settle_torque ** 2 * settle_time) + (loop_torque ** 2 * feed_angle_2_values[0]["dwell_time"])) / 
                                (feed_angle_2_values[0]["cycle_time"]))

    # Calculate Regen
    regen = regen_input(
        match = match,
        motor_inertia = motor_inertia,
        rpm = rpm,
        acceleration_time = feed_angle_1_values[0]["acceleration_time"],
        cycle_time = feed_angle_1_values[0]["cycle_time"],
        watts_lost = watts_lost,
        ec = ec
    )
    regen = calculate_regen(regen)

    return {
        "max_motor_rpm": max_motor_rpm,
        "motor_inertia": motor_inertia,
        "max_vel": max_vel,
        "settle_time": settle_time,
        "ratio": ratio,

        "motor_peak_torque": motor_peak_torque,
        "motor_rms_torque": motor_rms_torque,
        "frictiaonal_torque": frictional_torque,
        "loop_torque": loop_torque,
        "settle_torque": settle_torque,

        "regen": regen,

        "refl_inertia": refl_inertia,
        "match": match,
        "peak_torque": peak_torque,
        "rms_torque_fa1": rms_torque_fa1,
        "rms_torque_fa2": rms_torque_fa2,
        "acceleration_torque": acceleration_torque,

        "table_values": table_values,
    }

def run_sigma_five_pt_calculation(data: feed_w_pull_thru_input, spec_type="sigma_five_pt"):
    """
    Sigma Five feed calculation service function with pull-thru specs.
    
    Args:
        data (FeedWPullThruInput): Input data containing feed parameters.
        straightening_rolls (int): Number of straightening rolls.
        material_width (float): Width of the material in inches.
        material_thickness (float): Thickness of the material in inches.
        feed_model (str): Model of the feed system.
        yield_strength (float): Yield strength of the material in PSI.
        str_pinch_rolls (str): Whether pinch rolls are used ("y" or "n").
        req_max_fpm (float): Required maximum speed in feet per minute.
        spec_type (str): Type of specification, defaults to "sigma_five_pt".

    Returns:
        dict: A dictionary containing calculated feed parameters.

    Raises:
        ValueError: If the spec_type is not recognized or if a lookup fails.


    """
    
    # Lookups
    u_roll = get_sigma_five_pt_specs(data.feed_model, "u_roll", "upper_roll")
    ratio = get_sigma_five_pt_specs(data.feed_model, "ratio", "ratio")
    efficiency = get_sigma_five_pt_specs(data.feed_model, "efficiency", "efficiency")
    cent_dist = get_sigma_five_pt_specs(data.feed_model, "cent_dist", "center_distance")

    # Constants
    fpm_buffer = 1.2

    if data.str_pinch_rolls.lower() == "y" or data.str_pinch_rolls.lower() == "yes":
        pinch_rolls = 2
    else:
        pinch_rolls = 0

    if data.straightening_rolls == 5:
        k_const = data.straightening_rolls / 3.5 + 0.1
    elif data.straightening_rolls == 7:
        k_const = data.straightening_rolls / 3.5
    elif data.straightening_rolls == 9:
        k_const = data.straightening_rolls / 3.5 - 0.1
    else:
        k_const = 3
    
    straightner_torque = (0.667 * data.yield_strength * data.material_width * (data.material_thickness ** 2) / cent_dist) * k_const * u_roll * 0.125 / ratio / efficiency

    payoff_max_speed = data.req_max_fpm * fpm_buffer

    results = run_sigma_five_calculation(data, spec_type)

    calc_results = {
        "pinch_rolls": pinch_rolls,
        "straightner_torque": straightner_torque,
        "payoff_max_speed": payoff_max_speed,
    }

    final_results = results + calc_results

    return final_results

def run_allen_bradley_calculation(data: base_feed_params, spec_type="allen_bradley"):
    """
    Allen Bradley feed calculation service function.
    
    Args:
        data (AllenBradleyInput): Input data containing feed parameters.
        spec_type (str): Type of specification, defaults to "allen_bradley".
    
    Returns:
        dict: A dictionary containing calculated feed parameters.

    """
    return run_sigma_five_calculation(data, spec_type)