from models import str_utility_input
from utils.lookup_tables import (
    get_str_models, get_material_density, get_material_modulus
)
from utils.shared import FEED_RATE_BUFFER
from calculations.str_utility import calculate_str_utility

def get_str_utility_inputs(user_entries):
    str_models = get_str_models()
    auto_brake_options = ["No", "Yes"]
    yield_met_options = ["OK", "NOT OK"]

    # Start with minimums
    best = {
        "str_model": str_models[0],
        "auto_brake_compensation": auto_brake_options[0],
        "yield_met": yield_met_options[0]
    }

    # Helper to check candidate
    def passes_checks(candidate):
        result = calculate_str_utility(str_utility_input(**candidate))
        if isinstance(result, dict):
            checks = [
                result.get("required_force_check"),
                result.get("pinch_roll_check"),
                result.get("str_roll_check"),
                result.get("horsepower_check"),
                result.get("fpm_check"),
                result.get("feed_rate_check"),
            ]
            return all(c == "OK" or c == "FPM SUFFICIENT" for c in checks)
        return False

    # Stepwise search for each variable independently
    candidate = dict(user_entries)
    candidate.update(best)
    candidate["num_str_rolls"] = 7
    candidate["horsepower"] = 1.0
    candidate["feed_rate"] = 1.0
    candidate["max_feed_rate"] = 1.0

    # Stepwise for horsepower
    for hp in range(1, 101):
        candidate["horsepower"] = float(hp)
        if passes_checks(candidate):
            break

    # Stepwise for feed_rate
    for fr in range(1, 101):
        candidate["feed_rate"] = float(fr)
        if passes_checks(candidate):
            break

    # Stepwise for max_feed_rate
    for mfr in range(1, int(candidate["feed_rate"]) + 1):
        candidate["max_feed_rate"] = float(mfr)
        if passes_checks(candidate):
            break

    # Stepwise for num_str_rolls
    for rolls in range(7, 12):
        candidate["num_str_rolls"] = rolls
        if passes_checks(candidate):
            break

    # Try alternatives for categorical variables one at a time
    for var, options in [
        ("str_model", str_models),
        ("auto_brake_compensation", auto_brake_options),
        ("yield_met", yield_met_options)
    ]:
        for option in options:
            candidate[var] = option
            if passes_checks(candidate):
                best[var] = option
                break

    if passes_checks(candidate):
        return str_utility_input(**candidate)
    return None