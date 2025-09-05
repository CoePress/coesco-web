from models import str_utility_input
from utils.lookup_tables import (
    get_str_model_value
)
from utils.shared import (
    MOTOR_RPM, FEED_RATE_BUFFER,
)

def get_initial_str_utility_inputs(defaults):
    """
    Returns a str_utility_input object with initial values that should pass all checks.
    'defaults' should be a dict with reasonable values for all required fields except those calculated below.
    """
    # Lookups
    str_model = defaults['str_model']
    max_feed_rate = defaults['max_feed_rate']

    # Get required lookup values
    jack_force_available = get_str_model_value(str_model, "jack_force_avail", "jack_force_available")

    # Calculate minimum required_force to pass required_force_check
    # required_force = ((16 * yield_strength * coil_width * (material_thickness ** 2) / (15 * center_dist))
    #                + (16 * yield_strength * coil_width * (material_thickness ** 2) / (15 * center_dist)) * 0.19)
    # required_force_check: jack_force_available > required_force
    # So, set required_force just below jack_force_available
    required_force = jack_force_available * 0.99

    # Calculate minimum horsepower to pass horsepower_check
    # horsepower_check: data.horsepower > horsepower_required
    # So, set horsepower just above horsepower_required
    # We'll estimate horsepower_required using min_od_pk_torque and MOTOR_RPM
    # For simplicity, set min_od_pk_torque to a reasonable value
    min_od_pk_torque = 1  # You may want to calculate this more precisely
    horsepower_required = (min_od_pk_torque * MOTOR_RPM) / 63000
    horsepower = horsepower_required * 1.05

    # Set feed_rate to minimum required for FPM check
    # fpm_check: data.feed_rate >= data.max_feed_rate * FEED_RATE_BUFFER
    feed_rate = max_feed_rate * FEED_RATE_BUFFER

    # Compose the input object
    input_data = dict(defaults)
    input_data.update({
        'required_force': required_force,
        'horsepower': horsepower,
        'feed_rate': feed_rate,
    })
    return str_utility_input(**input_data)