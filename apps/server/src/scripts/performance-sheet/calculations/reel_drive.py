"""
Reel Drive Calculation Module
"""

from models import reel_drive_input
from math import pi
from typing import Tuple, Dict, Any

from utils.shared import (
    CHAIN_RATIO, CHAIN_SPRKT_OD, CHAIN_SPRKT_THICKNESS, MOTOR_RPM,
    REDUCER_DRIVING, REDUCER_BACKDRIVING, REDUCER_INERTIA, ACCEL_RATE
)

from utils.lookup_tables import (
    get_reel_dimensions,
    get_material,
    get_motor_inertia,
    get_type_of_line,
    get_fpm_buffer
)

def get_lookup_data(data: reel_drive_input):
    """Fetch all lookup table data needed for calculations."""
    reel = get_reel_dimensions(data.model)
    material = get_material(data.material_type)
    motor_inertia = get_motor_inertia(str(int(data.motor_hp)) if data.motor_hp != 7.5 else str(data.motor_hp))
    reel_type = get_type_of_line(data.type_of_line)
    fpm_buffer = get_fpm_buffer("DEFAULT")
    return reel, material, motor_inertia, reel_type, fpm_buffer

def calc_mandrel_specs(reel, reel_width, brg_dist, total_ratio):
    """Calculate mandrel (central shaft) specifications."""
    mandrel_dia = reel["mandrel_dia"]
    mandrel_length = reel_width + 17 + brg_dist
    mandrel_weight = ((mandrel_dia/2)**2) * pi * mandrel_length * 0.283
    mandrel_inertia = mandrel_weight / 32.3 / 2 * ((mandrel_dia/2)**2 / 144) * 12
    mandrel_refl = mandrel_inertia / total_ratio**2 if total_ratio else 0
    return mandrel_dia, mandrel_length, mandrel_weight, mandrel_inertia, mandrel_refl

def calc_backplate_specs(backplate_diameter, total_ratio, mandrel_dia):
    """Calculate backplate specifications."""
    backplate_weight = ((backplate_diameter/2)**2) * pi * 0.283
    backplate_inertia = backplate_weight / 32.3 / 2 * ((mandrel_dia/2)**2 / 144) * 12
    backplate_refl = backplate_inertia / total_ratio**2 if total_ratio else 0
    return backplate_weight, backplate_inertia, backplate_refl

def calc_coil_specs(reel_size, coil_od, coil_id, coil_density, total_ratio, density):
    """Calculate coil specifications."""
    try:
        coil_density = density
        coil_width = reel_size / coil_density / ((coil_od**2 - coil_id**2) / 4) / pi
        coil_inertia = reel_size / 32.3 / 2 * ((coil_od/2)**2 + (coil_id/2)**2) / 144 * 12
        coil_refl = coil_inertia / total_ratio**2 if total_ratio else 0
        return coil_density, coil_width, coil_inertia, coil_refl
    except ZeroDivisionError:
        return 0, 0, 0, 0

def calc_speed_params(required_max_fpm, fpm_buffer, accel_rate):
    speed = required_max_fpm * fpm_buffer
    accel_time = speed / 60 / accel_rate
    return speed, accel_time

def calc_mandrel_rpm(speed, coil_id, coil_od):
    mandrel_max_rpm = speed * 12 / coil_id / pi if coil_id else 0
    mandrel_full_rpm = speed * 12 / coil_od / pi if coil_od else 0
    return mandrel_max_rpm, mandrel_full_rpm

def calc_total_ratio(motor_base_rpm, mandrel_max_rpm):
    return motor_base_rpm / mandrel_max_rpm if mandrel_max_rpm else 0

def calc_reducer_ratio(total_ratio, chain_ratio):
    return total_ratio / chain_ratio if chain_ratio else 0

def calc_chain_specs(chain_sprkt_od, chain_sprkt_thickness, total_ratio):
    chain_weight = ((chain_sprkt_od/2)**2) * pi * chain_sprkt_thickness * 0.283
    chain_inertia = chain_weight / 32.3 / 2 * ((chain_sprkt_od/2)**2 / 144) * 12
    chain_refl = chain_inertia / total_ratio**2 if total_ratio else 0
    return chain_weight, chain_inertia, chain_refl

def calc_friction_forces(mandrel_weight, reel_size, reel_width, brg_dist, f_brg_dia, r_brg_dia):
    friction_arm = (reel_width / 2) + 13
    r_brg_mand = mandrel_weight * friction_arm / brg_dist * 0.002 * r_brg_dia / 2
    f_brg_mand = (mandrel_weight + (mandrel_weight * ((reel_width/2)+13) / brg_dist)) * 0.002 * f_brg_dia / 2
    r_brg_coil = reel_size * friction_arm / brg_dist * 0.002 * r_brg_dia / 2
    f_brg_coil = (reel_size + (reel_size * ((reel_width/2)+13) / brg_dist)) * 0.002 * f_brg_dia / 2
    friction_total_empty = r_brg_mand + f_brg_mand
    friction_total_full = friction_total_empty + r_brg_coil + f_brg_coil
    return r_brg_mand, f_brg_mand, r_brg_coil, f_brg_coil, friction_total_empty, friction_total_full

def calc_friction_reflected(friction_total, total_ratio, reducer_driving):
    return friction_total / total_ratio / reducer_driving if total_ratio and reducer_driving else 0

def calc_torque(total_refl, motor_rpm, accel_time, reducer_driving, motor_inertia, friction_refl):
    if total_refl and motor_rpm and accel_time and reducer_driving:
        inertia_torque = ((total_refl * motor_rpm) / (9.55 * accel_time)) / reducer_driving
        motor_inertia_torque = (motor_inertia * motor_rpm) / (9.55 * accel_time)
        return inertia_torque + motor_inertia_torque + friction_refl
    return 0

def calc_hp_req(torque, motor_base_rpm):
    return torque * motor_base_rpm / 63000 if torque and motor_base_rpm else 0

def calc_regen_power(total_refl, motor_rpm, accel_time, friction_total, total_ratio, reducer_backdriving, motor_inertia):
    if total_refl and motor_rpm and accel_time and total_ratio and reducer_backdriving:
        inertia_power = (total_refl * motor_rpm) / (9.55 * accel_time)
        motor_inertia_power = (motor_inertia * motor_rpm) / (9.55 * accel_time)
        friction_power = friction_total / total_ratio / reducer_backdriving
        return (inertia_power + motor_inertia_power - friction_power) * motor_rpm / 63000 * 746
    return 0

def validate_motor(motor_hp, hp_req):
    return "valid" if motor_hp > hp_req else "too small"

def pulloff_recommendation(reel_type, motor_hp, hp_req_empty, hp_req_full):
    if reel_type == "Motorized":
        return "OK" if motor_hp > hp_req_empty and motor_hp > hp_req_full else "NOT OK"
    return "USE PULLOFF"

def calculate_reeldrive(data: reel_drive_input) -> Dict[str, Any]:
    try:
        reel, material, motor_inertia, reel_type, fpm_buffer = get_lookup_data(data)
    except Exception:
        return "ERROR: Reel Drive lookup failed."

    speed, accel_time = calc_speed_params(data.required_max_fpm, fpm_buffer, ACCEL_RATE)
    mandrel_max_rpm, mandrel_full_rpm = calc_mandrel_rpm(speed, data.coil_id, data.coil_od)
    total_ratio = calc_total_ratio(MOTOR_RPM, mandrel_max_rpm)
    reducer_ratio = calc_reducer_ratio(total_ratio, CHAIN_RATIO)

    reel_size = reel["coil_weight"]
    brg_dist = reel["bearing_dist"]
    f_brg_dia = reel["fbearing_dia"]
    r_brg_dia = reel["rbearing_dia"]

    mandrel_dia, mandrel_length, mandrel_weight, mandrel_inertia, mandrel_refl = calc_mandrel_specs(
        reel, data.reel_width, brg_dist, total_ratio
    )
    backplate_weight, backplate_inertia, backplate_refl = calc_backplate_specs(
        data.backplate_diameter, total_ratio, mandrel_dia
    )
    coil_density, coil_width, coil_inertia, coil_refl = calc_coil_specs(
        reel_size, data.coil_od, data.coil_id, material["density"], total_ratio, material["density"]
    )
    chain_weight, chain_inertia, chain_refl = calc_chain_specs(CHAIN_SPRKT_OD, CHAIN_SPRKT_THICKNESS, total_ratio)

    total_refl_empty = mandrel_refl + backplate_refl + REDUCER_INERTIA + chain_refl
    total_refl_full = total_refl_empty + coil_refl

    motor_rpm_full = speed * 12 / data.coil_od / pi * total_ratio if total_ratio else 0

    r_brg_mand, f_brg_mand, r_brg_coil, f_brg_coil, friction_total_empty, friction_total_full = calc_friction_forces(
        mandrel_weight, reel_size, data.reel_width, brg_dist, f_brg_dia, r_brg_dia
    )
    friction_refl_empty = calc_friction_reflected(friction_total_empty, total_ratio, REDUCER_DRIVING)
    friction_refl_full = calc_friction_reflected(friction_total_full, total_ratio, REDUCER_DRIVING)

    torque_empty = calc_torque(total_refl_empty, MOTOR_RPM, accel_time, REDUCER_DRIVING, motor_inertia, friction_refl_empty)
    torque_full = calc_torque(total_refl_full, motor_rpm_full, accel_time, REDUCER_DRIVING, motor_inertia, friction_refl_full)

    hp_req_empty = calc_hp_req(torque_empty, MOTOR_RPM)
    hp_req_full = calc_hp_req(torque_full, MOTOR_RPM)

    status_empty = validate_motor(data.motor_hp, hp_req_empty)
    status_full = validate_motor(data.motor_hp, hp_req_full)

    regen_empty = calc_regen_power(total_refl_empty, MOTOR_RPM, accel_time, friction_total_empty, total_ratio, REDUCER_BACKDRIVING, motor_inertia)
    regen_full = calc_regen_power(total_refl_full, motor_rpm_full, accel_time, friction_total_full, total_ratio, REDUCER_BACKDRIVING, motor_inertia)

    pulloff = pulloff_recommendation(reel_type, data.motor_hp, hp_req_empty, hp_req_full)

    results = {
        "reel": {
            "size": reel_size,
            "max_width": data.reel_width,
            "brg_dist": brg_dist,
            "f_brg_dia": f_brg_dia,
            "r_brg_dia": r_brg_dia
        },
        "mandrel": {
            "diameter": mandrel_dia,
            "length": mandrel_length,
            "max_rpm": mandrel_max_rpm,
            "rpm_full": mandrel_full_rpm,
            "weight": mandrel_weight,
            "inertia": mandrel_inertia,
            "refl_inert": mandrel_refl
        },
        "backplate": {
            "diameter": data.backplate_diameter,
            "thickness": reel["backplate_thickness"],
            "weight": backplate_weight,
            "inertia": backplate_inertia,
            "refl_inert": backplate_refl
        },
        "coil": {
            "density": coil_density,
            "od": data.coil_od,
            "id": data.coil_id,
            "width": coil_width,
            "weight": reel_size,
            "inertia": coil_inertia,
            "refl_inert": coil_refl
        },
        "reducer": {
            "ratio": reducer_ratio,
            "driving": REDUCER_DRIVING,
            "backdriving": REDUCER_BACKDRIVING,
            "inertia": REDUCER_INERTIA,
            "refl_inert": REDUCER_INERTIA
        },
        "chain": {
            "ratio": CHAIN_RATIO,
            "sprkt_od": CHAIN_SPRKT_OD,
            "sprkt_thk": CHAIN_SPRKT_THICKNESS,
            "weight": chain_weight,
            "inertia": chain_inertia,
            "refl_inert": chain_refl
        },
        "total": {
            "ratio": total_ratio,
            "total_refl_inert_empty": total_refl_empty,
            "total_refl_inert_full": total_refl_full
        },
        "motor": {
            "hp": data.motor_hp,
            "inertia": motor_inertia,
            "base_rpm": MOTOR_RPM,
            "rpm_full": motor_rpm_full
        },
        "friction": {
            "r_brg_mand": r_brg_mand,
            "f_brg_mand": f_brg_mand,
            "r_brg_coil": r_brg_coil,
            "f_brg_coil": f_brg_coil,
            "total_empty": friction_total_empty,
            "total_full": friction_total_full,
            "refl_empty": friction_refl_empty,
            "refl_full": friction_refl_full
        },
        "speed": {
            "speed": speed,
            "accel_rate": ACCEL_RATE,
            "accel_time": accel_time
        },
        "torque": {
            "empty": torque_empty,
            "full": torque_full
        },
        "hp_req": {
            "empty": hp_req_empty,
            "full": hp_req_full,
            "status_empty": status_empty,
            "status_full": status_full
        },
        "regen": {
            "empty": regen_empty,
            "full": regen_full
        },
        "use_pulloff": pulloff
    }

    return results