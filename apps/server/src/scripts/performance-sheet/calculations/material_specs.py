"""
Material Specifications Calculation Module
"""

import math
from models import material_specs_input
from utils.to_float import to_float
from utils.lookup_tables import get_material

def get_material_properties(material_type):
    """Fetch material properties from lookup table."""
    try:
        return get_material(material_type)
    except ValueError:
        return {}

def calculate_min_bend_radius(thickness, yield_strength, modulus):
    """Calculate minimum bend radius."""
    if thickness and yield_strength and modulus:
        return round((modulus * (thickness / 2)) / yield_strength, 4)
    return 0

def calculate_min_loop_length(min_bend_radius):
    """Calculate minimum loop length in feet."""
    if min_bend_radius > 0:
        return round((min_bend_radius * 4) / 12, 4)
    return 0

def calculate_coil_od(coil_weight, density, coil_width, coil_id):
    """Calculate coil outer diameter."""
    valid_types = (int, float)
    if all(isinstance(x, valid_types) and x is not None for x in [coil_weight, density, coil_width, coil_id]):
        try:
            area_term = coil_weight / (density * math.pi * coil_width)
            radius_term = (coil_id / 2) ** 2
            if area_term + radius_term >= 0:
                coil_od = math.sqrt(area_term + radius_term) * 2
                return math.ceil(coil_od)
        except Exception:
            pass
    return 0

def calculate_variant(data: material_specs_input):
    """
    Calculate material specifications for a single variant.
    """
    mat = get_material_properties(data.material_type)
    modulus = mat.get("modulus")
    density = to_float(mat.get("density"))
    min_bend_radius = calculate_min_bend_radius(
        data.material_thickness, data.yield_strength, modulus
    )
    min_loop_length = calculate_min_loop_length(min_bend_radius)
    coil_weight = to_float(data.coil_weight)
    coil_width = to_float(data.coil_width)
    coil_id = to_float(data.coil_id)
    coil_od_calculated = calculate_coil_od(coil_weight, density, coil_width, coil_id)
    return {
        "min_bend_radius": min_bend_radius,
        "min_loop_length": min_loop_length,
        "coil_od_calculated": coil_od_calculated,
        "material_density": density
    }