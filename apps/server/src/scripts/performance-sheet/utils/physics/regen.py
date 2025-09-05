"""
Regenerative utilities for physics-based calculations.

"""
from models import regen_input

def calculate_regen(data: regen_input):
    """
    Calculate regenerative energy based on input parameters.

    Args:
        data (RegenInput): Input data containing parameters for calculations.

    Returns:
        float: The calculated regenerative energy in watts.

    Raises:
        HTTPException: If an error occurs during calculations.

    """

    try:
        # Compute rational energy of the system, es (Joules)
        motor_rotor_inertia = data.motor_inertia * 0.112943
        total_inertia = motor_rotor_inertia + (motor_rotor_inertia * data.match)
        es = (total_inertia * (data.rpm ** 2)) / 182

        # calculate the energy lost in the servo motor windings, em (Joules)
        deceleration_time = data.acceleration_time
        em = deceleration_time * data.watts_lost

        # ek (resistor)
        ek = es - (em + data.ec)
        
        # Raw watts and De-rated watts (wk) calculations
        regen = ek / data.cycle_time
        wk = ek / (0.2 * data.cycle_time)

        return regen
    except:
        return "ERROR: Regen calculations failed to save."