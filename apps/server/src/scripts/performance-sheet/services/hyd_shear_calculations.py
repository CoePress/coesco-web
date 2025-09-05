"""
Hydraulic Shear Calculations Service

"""

from models import hyd_shear_input
from math import pi, atan, tan, radians

def calculate_hyd_shear(data: hyd_shear_input, spec_type: str = "single_rake"):
    """
    Calculate hydraulic shear parameters based on input data.

    Args:
        data (HydShearInput): Input data containing shear parameters.
        spec_type (str): Type of shear specification, either "single_rake" or "bow_tie".

    Returns:
        dict: A dictionary containing calculated shear parameters.

    Raises:
        ValueError: If the spec_type is not recognized.

    """

    # Calculated variables
    shear_strength = data.material_tensile * 0.75

    angle_of_blade = atan(data.rake_of_blade / 12) / pi * 180
    length_of_init_cut = data.material_thickness / tan(radians(angle_of_blade))
    area_of_cut = (data.material_thickness * length_of_init_cut) / 2

    min_stroke_for_blade = data.coil_width * (radians(angle_of_blade)) + data.material_thickness + data.overlap
    min_stroke_req_for_opening = min_stroke_for_blade + data.blade_opening

    cylinder_area = ((data.bore_size / 2) ** 2) * pi - ((data.rod_dia / 2) ** 2) * pi
    cylinder_volume = cylinder_area * data.stroke
    
    # Conclusions
    force_per_cylinder = cylinder_area * data.pressure / 2
    total_force_applied_lbs = force_per_cylinder * 2
    force_req_to_shear = area_of_cut * shear_strength * (1 - data.percent_of_penetration)
    total_forve_applied_tons = total_force_applied_lbs * 0.0005
    safety_factor = total_force_applied_lbs / force_req_to_shear
    instant_gallons_per_minute_req = ((cylinder_volume / 231) * 60) / data.time_for_down_stroke
    shear_strokes_per_minute = (1 / (data.time_for_down_stroke * 2)) * 60
    parts_per_minute = 1 / (data.time_for_down_stroke * 2 + data.dwell_time) * 60
    parts_per_hour = parts_per_minute * 60
    averaged_gallons_per_minute_req = instant_gallons_per_minute_req * parts_per_minute / shear_strokes_per_minute

    fluid_velocity = instant_gallons_per_minute_req / (3.117 * cylinder_area)

    if spec_type == "bow_tie":
        area_of_cut = (data.material_thickness * length_of_init_cut)
        actual_opening_above_max_material = data.coil_width / 2 * (radians(angle_of_blade)) + data.overlap
    else:
        area_of_cut = (data.material_thickness * length_of_init_cut) / 2
        actual_opening_above_max_material = data.stroke - min_stroke_for_blade

    if total_force_applied_lbs > (force_req_to_shear * 1.15):
        force_req_to_shear_check = "OK"
    else:
        force_req_to_shear_check = "NOT OK"

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
        "total_force_applied_tons": total_forve_applied_tons,
        "safety_factor": safety_factor,
        "instant_gallons_per_minute_req": instant_gallons_per_minute_req,
        "averaged_gallons_per_minute_req": averaged_gallons_per_minute_req,
        "shear_strokes_per_minute": shear_strokes_per_minute,
        "parts_per_minute": parts_per_minute,
        "parts_per_hour": parts_per_hour
    }