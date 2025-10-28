"""
Time utilities for physics-based calculations.

"""
import sys
from models import time_input
from math import sqrt, floor

def calculate_init_values(data: time_input, feed_angle: int = 0):
    """
    Calculate initial values based on the input data.

    Args:
        data (TimeInput): Input data containing parameters for calculations.
        feed_angle (int): The angle of the feed, default is 0.

    Returns:
        dict: A dictionary containing initial calculated values such as length, 
              acceleration time, peak torque, cycle time, etc.
    
    """
    # initial calculations
    length = ((data.velocity / data.acceleration) * data.velocity) * 12
    acceleration_time = data.velocity / data.acceleration
    acceleration_torque = (((data.refl_inertia * data.rpm) / (9.55 * acceleration_time)) / data.efficiency) + ((data.motor_inertia * data.rpm) / (9.55 * acceleration_time))
    peak_torque = acceleration_torque + data.frictional_torque + data.loop_torque

    if ((length - ((data.motor_peak_torque * acceleration_time) * 12) / 12) / data.motor_peak_torque) > 0:
        runtime = ((length - ((data.motor_peak_torque * acceleration_time) * 12)) / 12) / data.motor_peak_torque
    else:
        runtime = 0
    
    index_time = ((acceleration_time * 2) + runtime + data.settle_time)
    
    # Safe access to application field
    application = getattr(data, 'application', 'Press Feed')
    if isinstance(application, str):
        application_str = application.lower()
    else:
        application_str = "press feed"  # Default fallback
    
    if application_str == "press feed":
        # Ensure feed_angle is not zero to prevent division by zero
        safe_feed_angle = feed_angle if feed_angle > 0 else 180.0
        cycle_time = index_time * (360 / safe_feed_angle)
    else:
        cycle_time = index_time + feed_angle

    strokes_per_minute = 60 / cycle_time
    dwell_time = cycle_time - index_time
    rms_torque = sqrt((((peak_torque ** 2) * acceleration_time) + 
                       ((acceleration_torque ** 2) * acceleration_time) + 
                       (((data.frictional_torque + data.loop_torque) ** 2) * runtime) + 
                       ((data.settle_torque ** 2) * data.settle_time) + 
                       ((data.loop_torque ** 2) * dwell_time)) / cycle_time)
    
    return {
        "init_length": length,
        "init_acceleration_time": acceleration_time,
        "init_acceleration_torque": acceleration_torque,
        "init_peak_torque": peak_torque,
        "init_runtime": runtime,
        "init_index_time": index_time,
        "init_cycle_time": cycle_time,
        "init_strokes_per_minute": strokes_per_minute,
        "init_dwell_time": dwell_time,
        "init_rms_torque": rms_torque
    }

def calculate_values(data: time_input, init_values: dict, feed_angle: int = 0, index: int = 1):
    """
    Calculate shorter values based on the initial values and input data.
    """
    if index == 1:
        length = data.min_length
    else:
        length = data.min_length + (data.increment * (index - 1))

    if length > init_values["init_length"]:
        acceleration_time = init_values["init_acceleration_time"]
        runtime = ((length - init_values["init_length"]) / 12 ) / data.velocity
    else:
        acceleration_time = sqrt((length / 12) / data.acceleration)
        runtime = 0

    acceleration_torque = (((data.refl_inertia * data.rpm) / (9.55 * acceleration_time)) / data.efficiency) + ((data.motor_inertia * data.rpm) / (9.55 * acceleration_time))
    peak_torque = acceleration_torque + data.frictional_torque + data.loop_torque

    index_time = (acceleration_time * 2) + runtime + data.settle_time
    
    # Safe access to application field
    application = getattr(data, 'application', 'Press Feed')
    if isinstance(application, str):
        application_str = application.lower()
    else:
        application_str = "press feed"  # Default fallback
    
    if application_str == "press feed":
        # Ensure feed_angle is not zero to prevent division by zero
        safe_feed_angle = feed_angle if feed_angle > 0 else 180.0
        cycle_time = index_time * (360 / safe_feed_angle)
    else:
        cycle_time = index_time + feed_angle

    dwell_time = cycle_time - index_time
    rms_torque = sqrt((((peak_torque ** 2) * acceleration_time) + 
                       ((acceleration_torque ** 2) * acceleration_time) + 
                       (((data.frictional_torque + data.loop_torque) ** 2) * runtime) + 
                       ((data.settle_torque ** 2) * data.settle_time) + 
                       ((data.loop_torque ** 2) * dwell_time)) / cycle_time)
    
    # Calculate SPM based on cycle time and straightener speed limits
    natural_spm = 60 / cycle_time
    
    # Handle case when str_max_sp_inch is 0 or not set - use natural SPM
    if data.str_max_sp_inch <= 0:
        strokes_per_minute = natural_spm
    else:
        spm_at_max_speed = data.str_max_sp_inch / length
        
        if (natural_spm * length) < data.str_max_sp_inch:
            # Use natural SPM
            strokes_per_minute = natural_spm
        else: 
            strokes_per_minute = max(1, floor(spm_at_max_speed))

    return {
        "length": length,
        "acceleration_time": acceleration_time,
        "acceleration_torque": acceleration_torque,
        "peak_torque": peak_torque,
        "runtime": runtime,
        "index_time": index_time,
        "cycle_time": cycle_time,
        "strokes_per_minute": strokes_per_minute,
        "dwell_time": dwell_time,
        "rms_torque": rms_torque
    }

def calculate_feed_time(data: time_input, feed_angle: int = 0):
    """
    Calculate the feed time based on the input data.
    """
    init_values = calculate_init_values(data, feed_angle)
    min_values = calculate_values(data, init_values, feed_angle, 1)

    lengths = [{
        "index": 0,
        "length": init_values["init_length"],
        "acceleration_time": init_values["init_acceleration_time"],
        "acceleration_torque": init_values["init_acceleration_torque"],
        "peak_torque": init_values["init_peak_torque"],
        "runtime": init_values["init_runtime"],
        "index_time": init_values["init_index_time"],
        "cycle_time": init_values["init_cycle_time"],
        "strokes_per_minute": init_values["init_strokes_per_minute"],
        "dwell_time": init_values["init_dwell_time"],
        "rms_torque": init_values["init_rms_torque"]
    },
    {
        "index": 1,
        "length": min_values["length"],
        "acceleration_time": min_values["acceleration_time"],
        "acceleration_torque": min_values["acceleration_torque"],
        "peak_torque": min_values["peak_torque"],
        "runtime": min_values["runtime"],
        "index_time": min_values["index_time"],
        "cycle_time": min_values["cycle_time"],
        "strokes_per_minute": min_values["strokes_per_minute"],
        "dwell_time": min_values["dwell_time"],
        "rms_torque": min_values["rms_torque"]
    }]

    for i in range(2, 24):
        values = calculate_values(data, init_values, feed_angle, i)
        lengths.append({
            "index": i,
            "length": values["length"],
            "acceleration_time": values["acceleration_time"],
            "acceleration_torque": values["acceleration_torque"],
            "peak_torque": values["peak_torque"],
            "runtime": values["runtime"],
            "index_time": values["index_time"],
            "cycle_time": values["cycle_time"],
            "strokes_per_minute": values["strokes_per_minute"],
            "dwell_time": values["dwell_time"],
            "rms_torque": values["rms_torque"]
        })

    return lengths

def calculate_time(data: time_input):
    try:
        feed_angle_1_values = calculate_feed_time(data, data.feed_angle_1)
        feed_angle_2_values = calculate_feed_time(data, data.feed_angle_2)

        return {
            "feed_angle_1": feed_angle_1_values,
            "feed_angle_2": feed_angle_2_values
        }
    except Exception as e:
        # Return a proper dictionary structure with error information
        return {
            "feed_angle_1": [],
            "feed_angle_2": [],
            "error": f"Time calculations failed: {str(e)}"
        }