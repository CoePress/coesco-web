from models import str_utility_input
from calculations.str_utility import calculate_str_utility
from shared import (
    STATIC_FRICTION, PAYOFF_OPTIONS, STR_MODEL_OPTIONS, STR_WIDTH_OPTIONS,
    STR_HORSEPOWER_OPTIONS, STR_FEED_RATE_OPTIONS, YES_NO_OPTIONS
)

def passes_checks(candidate):
    result = calculate_str_utility(str_utility_input(**candidate))
    if isinstance(result, dict):
        checks = [
            result.get("required_force_check"),
            result.get("horsepower_check"),
            result.get("fpm_check"),
            result.get("pinch_roll_check"),
            result.get("str_roll_check"),
            result.get("feed_rate_check"),
            result.get("str_utility_check"),
        ]
        return all(c == "PASS" or c == "OK" for c in checks)
    return False

def get_min_str_utility_inputs(user_entries):
    pass