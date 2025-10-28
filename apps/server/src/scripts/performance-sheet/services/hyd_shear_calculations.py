"""
Hydraulic Shear Calculations Service
"""

from models import hyd_shear_input
from math import pi, atan, tan, radians

def calc_shear_strength(material_tensile):
    return material_tensile * 0.75

def calc_angle_of_blade(rake_of_blade):
    return atan(rake_of_blade / 12) / pi * 180

def calc_length_of_init_cut(material_thickness, angle_of_blade):
    return material_thickness / tan(radians(angle_of_blade))

def calc_area_of_cut(material_thickness, length_of_init_cut, spec_type):
    if spec_type == "bow_tie":
        return material_thickness * length_of_init_cut
    else:
        return (material_thickness * length_of_init_cut) / 2

def calc_min_stroke_for_blade(coil_width, angle_of_blade, material_thickness, overlap):
    return coil_width * (radians(angle_of_blade)) + material_thickness + overlap

def calc_min_stroke_req_for_opening(min_stroke_for_blade, blade_opening):
    return min_stroke_for_blade + blade_opening

def calc_actual_opening_above_max_material(coil_width, angle_of_blade, overlap, stroke, min_stroke_for_blade, spec_type):
    if spec_type == "bow_tie":
        return coil_width / 2 * (radians(angle_of_blade)) + overlap
    else:
        return stroke - min_stroke_for_blade

def calc_cylinder_area(bore_size, rod_dia):
    return ((bore_size / 2) ** 2) * pi - ((rod_dia / 2) ** 2) * pi

def calc_cylinder_volume(cylinder_area, stroke):
    return cylinder_area * stroke

def calc_force_per_cylinder(cylinder_area, pressure):
    return cylinder_area * pressure / 2

def calc_total_force_applied_lbs(force_per_cylinder):
    return force_per_cylinder * 2

def calc_force_req_to_shear(area_of_cut, shear_strength, percent_of_penetration):
    return area_of_cut * shear_strength * (1 - percent_of_penetration)

def calc_total_force_applied_tons(total_force_applied_lbs):
    return total_force_applied_lbs * 0.0005

def calc_safety_factor(total_force_applied_lbs, force_req_to_shear):
    return total_force_applied_lbs / force_req_to_shear

def calc_instant_gallons_per_minute_req(cylinder_volume, time_for_down_stroke):
    return ((cylinder_volume / 231) * 60) / time_for_down_stroke

def calc_shear_strokes_per_minute(time_for_down_stroke):
    return (1 / (time_for_down_stroke * 2)) * 60

def calc_parts_per_minute(time_for_down_stroke, dwell_time):
    return 1 / (time_for_down_stroke * 2 + dwell_time) * 60

def calc_parts_per_hour(parts_per_minute):
    return parts_per_minute * 60

def calc_averaged_gallons_per_minute_req(instant_gallons_per_minute_req, parts_per_minute, shear_strokes_per_minute):
    return instant_gallons_per_minute_req * parts_per_minute / shear_strokes_per_minute

def calc_fluid_velocity(instant_gallons_per_minute_req, cylinder_area):
    return instant_gallons_per_minute_req / (3.117 * cylinder_area)

def calc_force_req_to_shear_check(total_force_applied_lbs, force_req_to_shear):
    if total_force_applied_lbs > (force_req_to_shear * 1.15):
        return "OK"
    else:
        return "NOT OK"

def calculate_hyd_shear(data: hyd_shear_input, spec_type: str = "single_rake"):
    shear_strength = calc_shear_strength(data.material_tensile)
    angle_of_blade = calc_angle_of_blade(data.rake_of_blade)
    length_of_init_cut = calc_length_of_init_cut(data.material_thickness, angle_of_blade)
    area_of_cut = calc_area_of_cut(data.material_thickness, length_of_init_cut, spec_type)
    min_stroke_for_blade = calc_min_stroke_for_blade(data.coil_width, angle_of_blade, data.material_thickness, data.overlap)
    min_stroke_req_for_opening = calc_min_stroke_req_for_opening(min_stroke_for_blade, data.blade_opening)
    actual_opening_above_max_material = calc_actual_opening_above_max_material(
        data.coil_width, angle_of_blade, data.overlap, data.stroke, min_stroke_for_blade, spec_type
    )
    cylinder_area = calc_cylinder_area(data.bore_size, data.rod_dia)
    cylinder_volume = calc_cylinder_volume(cylinder_area, data.stroke)
    force_per_cylinder = calc_force_per_cylinder(cylinder_area, data.pressure)
    total_force_applied_lbs = calc_total_force_applied_lbs(force_per_cylinder)
    force_req_to_shear = calc_force_req_to_shear(area_of_cut, shear_strength, data.percent_of_penetration)
    total_force_applied_tons = calc_total_force_applied_tons(total_force_applied_lbs)
    safety_factor = calc_safety_factor(total_force_applied_lbs, force_req_to_shear)
    instant_gallons_per_minute_req = calc_instant_gallons_per_minute_req(cylinder_volume, data.time_for_down_stroke)
    shear_strokes_per_minute = calc_shear_strokes_per_minute(data.time_for_down_stroke)
    parts_per_minute = calc_parts_per_minute(data.time_for_down_stroke, data.dwell_time)
    parts_per_hour = calc_parts_per_hour(parts_per_minute)
    averaged_gallons_per_minute_req = calc_averaged_gallons_per_minute_req(
        instant_gallons_per_minute_req, parts_per_minute, shear_strokes_per_minute
    )
    fluid_velocity = calc_fluid_velocity(instant_gallons_per_minute_req, cylinder_area)
    force_req_to_shear_check = calc_force_req_to_shear_check(total_force_applied_lbs, force_req_to_shear)

    return {
        "shear_strength": shear_strength,
        "angle_of_blade": angle_of_blade,
        "length_of_init_cut": length_of_init_cut,
        "area_of_cut": area_of_cut,
        "min_stroke_for_blade": min_stroke_for_blade,
        "min_stroke_req_for_opening": min_stroke_req_for_opening,
        "actual_opening_above_max_material": actual_opening_above_max_material,
        "cylinder_area": cylinder_area,
        "cylinder_volume": cylinder_volume,
        "fluid_velocity": fluid_velocity,
        "force_per_cylinder": force_per_cylinder,
        "total_force_applied_lbs": total_force_applied_lbs,
        "force_req_to_shear": force_req_to_shear,
        "force_req_to_shear_check": force_req_to_shear_check,
        "total_force_applied_tons": total_force_applied_tons,
        "safety_factor": safety_factor,
        "instant_gallons_per_minute_req": instant_gallons_per_minute_req,
        "averaged_gallons_per_minute_req": averaged_gallons_per_minute_req,
        "shear_strokes_per_minute": shear_strokes_per_minute,
        "parts_per_minute": parts_per_minute,
        "parts_per_hour": parts_per_hour
    }