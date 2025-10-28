"""
Roll Str Backbend Calculation Module
"""

from models import roll_str_backbend_input, hidden_const_input
from calculations.rolls.hidden_const import calculate_hidden_const
from math import sqrt

from utils.shared import (
    CREEP_FACTOR, RADIUS_OFF_COIL, roll_str_backbend_state
)

from utils.lookup_tables import (
    get_str_model_value,
    get_material_modulus,
)

def get_str_model_lookups(str_model):
    return {
        "str_roll_dia": float(get_str_model_value(str_model, "roll_diameter", "str_roll_dia")),
        "center_dist": float(get_str_model_value(str_model, "center_distance", "center_dist")),
        "jack_force_available": float(get_str_model_value(str_model, "jack_force_avail", "jack_force_available")),
        "max_roll_depth_without_material": float(get_str_model_value(str_model, "min_roll_depth", "max_roll_depth_without_material")),
        "top": float(get_str_model_value(str_model, "top", "top")),
        "bottom": float(get_str_model_value(str_model, "bottom", "bottom")),
    }

def get_material_modulus_lookup(material_type):
    return get_material_modulus(material_type)

def get_num_mid_rolls(num_str_rolls):
    if num_str_rolls == 7:
        return 1
    elif num_str_rolls == 9:
        return 2
    elif num_str_rolls == 11:
        return 3
    else:
        return None

def calc_curve_at_yield(yield_strength, thickness, modules):
    return 2 * yield_strength / (thickness * modules)

def calc_radius_at_yield(curve_at_yield):
    return 1 / curve_at_yield

def calc_bending_moment_to_yield(width, yield_strength, thickness):
    return width * yield_strength * (thickness ** 2) / 6

def calc_radius_off_coil_after_springback(radius_off_coil, curve_at_yield, creep_factor):
    if abs(1 / radius_off_coil) > curve_at_yield:
        return 1 / ((1 / radius_off_coil) - ((abs(radius_off_coil) / radius_off_coil) * (1.5 * (1 - creep_factor)) * curve_at_yield * (1 - ((1/3) * (curve_at_yield / (1 / radius_off_coil)) ** 2))))
    else:
        if creep_factor == 0:
            return abs(radius_off_coil) / radius_off_coil * 99999
        else:
            return radius_off_coil / creep_factor

def calc_one_radius_off_coil(radius_off_coil_after_springback):
    return 1 / radius_off_coil_after_springback

def calc_main_value(center_dist, radius_at_yield, thickness):
    hidden_input = hidden_const_input(
        center_distance=center_dist,
        radius_at_yield=radius_at_yield,
        thickness=thickness
    )
    return calculate_hidden_const(hidden_input)

def calc_max_roll_depth_with_material(str_roll_dia, thickness, center_dist, max_roll_depth_without_material):
    check = ((str_roll_dia + thickness) ** 2) - ((center_dist / 2) ** 2)
    max_roll_depth_with_material = max_roll_depth_without_material
    if (str_roll_dia - sqrt(check)) < -max_roll_depth_without_material and check >= 0:
        max_roll_depth_with_material = -str_roll_dia + sqrt(check)
    return max_roll_depth_with_material

def calc_roller_depth_required(radius_at_yield, thickness, center_dist):
    return -(1.5 * radius_at_yield - thickness - sqrt(abs(((1.5 * radius_at_yield) ** 2) - (center_dist / 2) ** 2)))

def check_roller_depth_required(roller_depth_required, max_roll_depth_without_material):
    if roller_depth_required > max_roll_depth_without_material:
        return "OK"
    else:
        return "WILL NOT STRAIGHTEN"

def calc_roller_force_required(yield_strength, width, thickness, center_dist):
    return (16 * yield_strength * width * (thickness ** 2)) / (15 * center_dist)

def check_roller_force_required(roller_force_required, jack_force_available):
    if roller_force_required < jack_force_available:
        return "OK"
    else:
        return "NOT ENOUGH FORCE"

def calc_roll_height_first_up(main_value):
    if (main_value - 10000) / 1000 < 0:
        return "TOO DEEP!"
    else:
        return round(((main_value - 10000) / 1000), 3)

def calc_roll_height_last(thickness):
    return thickness * 0.8

def calc_mid_heights(num_mid_rolls, roll_height_first_up, roll_height_last):
    mid_heights = []
    prev_height = roll_height_first_up
    for _ in range(num_mid_rolls):
        mid_height = prev_height + (roll_height_last - prev_height) / 2
        mid_heights.append(mid_height)
        prev_height = mid_height
    return mid_heights

def compute_stage_values(res_rad, prev_radius_after_springback, modules, width, thickness, curve_at_yield, bending_moment_to_yield):
    r_ri_val = 1 / res_rad - (1 / prev_radius_after_springback)
    if abs(r_ri_val) < curve_at_yield:
        mb_val = (modules * width * thickness ** 3) / 12 * r_ri_val
    else:
        mb_val = (abs(r_ri_val) / r_ri_val) * 1.5 * bending_moment_to_yield * (1 - (1/3) * ((curve_at_yield / r_ri_val) ** 2))
    mb_my_val = mb_val / bending_moment_to_yield
    springback_val = -curve_at_yield * mb_my_val
    radius_after_springback_val = 1 / ((1 / res_rad) + springback_val)
    return r_ri_val, mb_val, mb_my_val, springback_val, radius_after_springback_val

def calc_percent_yield(r_ri, curve_at_yield):
    if abs(r_ri) > curve_at_yield:
        percent_yield = 1 - abs(curve_at_yield / r_ri)
        number_of_yield_strains = 1 / (1 - percent_yield)
    else:
        percent_yield = "NONE"
        number_of_yield_strains = ""
    return percent_yield, number_of_yield_strains

def calc_force_required(mb, center_dist):
    return mb * 5.333 / center_dist

def check_force_required(force_required, jack_force_available):
    if force_required > jack_force_available:
        return "NOT ENOUGH FORCE!"
    else:
        return "OK"

def calc_percent_yield_check(percent_yield_first_up):
    if percent_yield_first_up == "NONE":
        return "NONE"
    elif percent_yield_first_up < 0.47:
        return "LOW"
    elif percent_yield_first_up > 0.7:
        return "HIGH"
    else:
        return "OK"

def calc_radius_after_springback_last(res_rad_last, springback_last):
    if abs((1 / res_rad_last) + springback_last) < 1e-5:
        return "FLAT"
    else:
        return 1 / ((1 / res_rad_last) + springback_last)

def calculate_roll_str_backbend(data: roll_str_backbend_input):
    try:
        str_model = get_str_model_lookups(data.str_model)
        modules = get_material_modulus_lookup(data.material_type)
    except:
        return "ERROR: Roll Str Backbend lookup failed."

    num_mid_rolls = get_num_mid_rolls(data.num_str_rolls)
    if num_mid_rolls is None:
        return "ERROR: Invalid number of rolls for backbend."

    creep_factor = CREEP_FACTOR
    radius_off_coil = RADIUS_OFF_COIL
    curve_at_yield = calc_curve_at_yield(data.yield_strength, data.thickness, modules)
    radius_at_yield = calc_radius_at_yield(curve_at_yield)
    bending_moment_to_yield = calc_bending_moment_to_yield(data.width, data.yield_strength, data.thickness)
    radius_off_coil_after_springback = calc_radius_off_coil_after_springback(radius_off_coil, curve_at_yield, creep_factor)
    one_radius_off_coil = calc_one_radius_off_coil(radius_off_coil_after_springback)
    main_value = calc_main_value(str_model["center_dist"], radius_at_yield, data.thickness)
    max_roll_depth_with_material = calc_max_roll_depth_with_material(
        str_model["str_roll_dia"], data.thickness, str_model["center_dist"], str_model["max_roll_depth_without_material"]
    )
    roller_depth_required = calc_roller_depth_required(radius_at_yield, data.thickness, str_model["center_dist"])
    roller_depth_required_check = check_roller_depth_required(roller_depth_required, str_model["max_roll_depth_without_material"])
    roller_force_required = calc_roller_force_required(data.yield_strength, data.width, data.thickness, str_model["center_dist"])
    roller_force_required_check = check_roller_force_required(roller_force_required, str_model["jack_force_available"])
    roll_height_first_up = calc_roll_height_first_up(main_value)
    roll_height_last = calc_roll_height_last(data.thickness)
    
    # Check if we got error responses that prevent further calculation
    if isinstance(roll_height_first_up, str) or isinstance(roll_height_last, str):
        return f"ERROR: Invalid roll height calculation - {roll_height_first_up} / {roll_height_last}"
    
    mid_heights = calc_mid_heights(num_mid_rolls, roll_height_first_up, roll_height_last)

    # First roller (up and down)
    numerator_first = (-0.25 * str_model["center_dist"] ** 2) - (roll_height_first_up ** 2) + (2 * roll_height_first_up * data.thickness) - data.thickness ** 2
    denominator_first = 4 * (roll_height_first_up + 1e-8) - 4 * data.thickness
    res_rad_first_up = (1.314 - str_model["top"] * data.thickness + str_model["bottom"] * roll_height_first_up) * numerator_first / denominator_first
    res_rad_first_down = -res_rad_first_up

    r_ri_first_up, mb_first_up, mb_my_first_up, springback_first_up, radius_after_springback_first_up = compute_stage_values(
        res_rad_first_up, radius_off_coil_after_springback, modules, data.width, data.thickness, curve_at_yield, bending_moment_to_yield
    )
    r_ri_first_down, mb_first_down, mb_my_first_down, springback_first_down, radius_after_springback_first_down = compute_stage_values(
        res_rad_first_down, radius_after_springback_first_up, modules, data.width, data.thickness, curve_at_yield, bending_moment_to_yield
    )
    r_ri_first_up = 1 / res_rad_first_up - (1 / radius_off_coil_after_springback)

    # Mid rollers
    mid_results = {}
    prev_radius_after_springback_down = radius_after_springback_first_down
    for idx, roll_height_mid in enumerate(mid_heights, start=1):
        numerator_mid = (-0.25 * str_model["center_dist"] ** 2) - (roll_height_mid ** 2) + (2 * roll_height_mid * data.thickness) - data.thickness ** 2
        denominator_mid = 4 * (roll_height_mid + 1e-8) - 4 * data.thickness
        res_rad_mid_up = numerator_mid / denominator_mid
        res_rad_mid_down = -res_rad_mid_up

        r_ri_mid_up, mb_mid_up, mb_my_mid_up, springback_mid_up, radius_after_springback_mid_up = compute_stage_values(
            res_rad_mid_up, prev_radius_after_springback_down, modules, data.width, data.thickness, curve_at_yield, bending_moment_to_yield
        )
        r_ri_mid_down, mb_mid_down, mb_my_mid_down, springback_mid_down, radius_after_springback_mid_down = compute_stage_values(
            res_rad_mid_down, radius_after_springback_mid_up, modules, data.width, data.thickness, curve_at_yield, bending_moment_to_yield
        )

        force_required_mid = calc_force_required(mb_mid_up, str_model["center_dist"])
        percent_yield_mid_up, number_of_yield_strains_mid = calc_percent_yield(r_ri_mid_up, curve_at_yield)
        percent_yield_mid_down, _ = calc_percent_yield(r_ri_mid_down, curve_at_yield)
        force_required_check_mid = check_force_required(force_required_mid, str_model["jack_force_available"])

        mid_results[f"mid_up_{idx}"] = {
            "roll_height_mid_up": round(roll_height_mid, 3),
            "res_rad_mid_up": round(res_rad_mid_up, 3),
            "r_ri_mid_up": round(r_ri_mid_up, 4),
            "mb_mid_up": round(mb_mid_up, 3),
            "mb_my_mid_up": round(mb_my_mid_up, 4),
            "springback_mid_up": round(springback_mid_up, 4),
            "radius_after_springback_mid_up": round(radius_after_springback_mid_up, 3),
            "force_required_mid_up": round(force_required_mid, 3),
            "force_required_check_mid_up": force_required_check_mid,
            "percent_yield_mid_up": percent_yield_mid_up,
            "number_of_yield_strains_mid_up": number_of_yield_strains_mid,
        }
        mid_results[f"mid_down_{idx}"] = {
            "res_rad_mid_down": round(res_rad_mid_down, 3),
            "r_ri_mid_down": round(r_ri_mid_down, 4),
            "mb_mid_down": round(mb_mid_down, 3),
            "mb_my_mid_down": round(mb_my_mid_down, 4),
            "springback_mid_down": round(springback_mid_down, 4),
            "radius_after_springback_mid_down": round(radius_after_springback_mid_down, 3),
            "percent_yield_mid_down": percent_yield_mid_down,
        }

        prev_radius_after_springback_down = radius_after_springback_mid_down

    # Last roller
    numerator_last = (-0.25 * str_model["center_dist"] ** 2) - (roll_height_last ** 2) + (2 * roll_height_last * data.thickness) - data.thickness ** 2
    denominator_last = 4 * (roll_height_last + 1e-8) - 4 * data.thickness
    res_rad_last = (1.314 - str_model["top"] * data.thickness + str_model["bottom"] * roll_height_last) * numerator_last / denominator_last

    r_ri_last, mb_last, mb_my_last, springback_last, radius_after_springback_last_val = compute_stage_values(
        res_rad_last, prev_radius_after_springback_down, modules, data.width, data.thickness, curve_at_yield, bending_moment_to_yield
    )
    radius_after_springback_last = calc_radius_after_springback_last(res_rad_last, springback_last)
    force_required_last = calc_force_required(mb_last, str_model["center_dist"])

    percent_yield_first_up, number_of_yield_strains_first = calc_percent_yield(r_ri_first_up, curve_at_yield)
    percent_yield_first_down, _ = calc_percent_yield(r_ri_first_down, curve_at_yield)

    if percent_yield_first_up == "NONE":
        roll_str_backbend_state["percent_material_yielded"] = 0
    else:
        roll_str_backbend_state["percent_material_yielded"] = percent_yield_first_up

    percent_yield_last, number_of_yield_strains_last = calc_percent_yield(r_ri_last, curve_at_yield)
    force_required_first = calc_force_required(mb_first_up, str_model["center_dist"])

    percent_yield_check = calc_percent_yield_check(percent_yield_first_up)
    force_required_check_first = check_force_required(force_required_first, str_model["jack_force_available"])
    force_required_check_last = check_force_required(force_required_last, str_model["jack_force_available"])

    result = {
        "num_str_rolls": data.num_str_rolls,
        "roll_diameter": round(str_model["str_roll_dia"], 4),
        "center_distance": round(str_model["center_dist"], 4),
        "modules": modules,
        "jack_force_available": str_model["jack_force_available"],
        "max_roll_depth_without_material": round(str_model["max_roll_depth_without_material"], 3),
        "max_roll_depth_with_material": round(max_roll_depth_with_material, 3),
        "radius_off_coil": round(radius_off_coil, 3),
        "radius_off_coil_after_springback": round(radius_off_coil_after_springback, 3),
        "one_radius_off_coil": round(one_radius_off_coil, 3),
        "curve_at_yield": round(curve_at_yield, 4),
        "radius_at_yield": round(radius_at_yield, 4),
        "bending_moment_to_yield": round(bending_moment_to_yield, 4),
        "hidden_const": main_value,
        "roller_depth_required": round(roller_depth_required, 3),
        "roller_depth_required_check": roller_depth_required_check,
        "roller_force_required": round(roller_force_required, 3),
        "roller_force_required_check": roller_force_required_check,
        "percent_yield_check": percent_yield_check,
    }
    result["first_up"] = {
        "roll_height_first_up": roll_height_first_up,
        "res_rad_first_up": round(res_rad_first_up, 3),
        "r_ri_first_up": round(r_ri_first_up, 4),
        "mb_first_up": round(mb_first_up, 3),
        "mb_my_first_up": round(mb_my_first_up, 4),
        "springback_first_up": round(springback_first_up, 4),
        "radius_after_springback_first_up": round(radius_after_springback_first_up, 3),
        "force_required_first_up": round(force_required_first, 3),
        "force_required_check_first_up": force_required_check_first,
        "percent_yield_first_up": percent_yield_first_up,
        "number_of_yield_strains_first_up": number_of_yield_strains_first,
    }
    result["first_down"] = {
        "res_rad_first_down": round(res_rad_first_down, 3),
        "r_ri_first_down": round(r_ri_first_down, 4),
        "mb_first_down": round(mb_first_down, 3),
        "mb_my_first_down": round(mb_my_first_down, 4),
        "springback_first_down": round(springback_first_down, 4),
        "radius_after_springback_first_down": round(radius_after_springback_first_down, 3),
        "percent_yield_first_down": percent_yield_first_down,
    }
    for mid_key, mid_data in mid_results.items():
        result[mid_key] = mid_data
    result["last"] = {
        "roll_height_last": round(roll_height_last, 3),
        "res_rad_last": round(res_rad_last, 4),
        "r_ri_last": round(r_ri_last, 3),
        "mb_last": round(mb_last, 3),
        "mb_my_last": round(mb_my_last, 3),
        "springback_last": round(springback_last, 4),
        "radius_after_springback_last": round(radius_after_springback_last, 3) if not isinstance(radius_after_springback_last, str) else radius_after_springback_last,
        "force_required_last": round(force_required_last, 3),
        "force_required_check_last": force_required_check_last,
        "percent_yield_last": percent_yield_last,
        "number_of_yield_strains_last": number_of_yield_strains_last,
    }

    return result