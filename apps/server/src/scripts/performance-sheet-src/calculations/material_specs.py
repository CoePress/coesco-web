"""
Material Specifications Calculation Module

"""
import math
from models import material_specs_input
from utils.to_float import to_float
from utils.lookup_tables import get_material

def calculate_variant(data: material_specs_input):
    """
    Calculate material specifications for a single variant.
    
    Performs calculations for minimum bend radius, minimum loop length,
    and calculated coil outer diameter based on material properties
    and dimensional parameters.
    
    Args: \n
        materialType (Optional[str]): Material type identifier for lookup
        thickness (Optional[float]): Material thickness in inches
        yield_strength (Optional[float]): Material yield strength in PSI
        coil_width (Optional[float]): Coil width in inches
        coil_weight (Optional[float]): Coil weight in pounds
        coil_id (Optional[float]): Coil inner diameter in inches
        
    Returns: \n
        Dict[str, Union[float, int, str]]: Dictionary containing:
            - min_bend_radius: Minimum bend radius in inches (float)
            - min_loop_length: Minimum loop length in feet (float)  
            - coil_od_calculated: Calculated coil outer diameter (int or empty string)
            
    """
    
    # Look up material properties using shared lookup table
    try:
        mat = get_material(data.material_type)
    except ValueError:
        # Default to empty dict if material type not found
        mat = {}
        
    # Extract material properties from lookup result
    modulus = mat.get("modulus")      # Material modulus of elasticity
    density = mat.get("density")      # Material density
    
    # Formula: min_bend_radius = (modulus * (thickness/2)) / yield_strength
    if data.material_thickness and data.yield_strength and modulus:
        min_bend_radius = round((modulus * (data.material_thickness / 2)) / data.yield_strength, 4)
    else:
        min_bend_radius = 0

    # Formula: min_loop_length = (min_bend_radius * 4) / 12
    # Factor of 4 accounts for loop geometry, division by 12 converts inches to feet
    if min_bend_radius > 0:
        min_loop_length = round((min_bend_radius * 4) / 12, 4)
    else:
        min_loop_length = 0

    coil_weight = to_float(data.coil_weight)
    density = to_float(density)
    coil_width = to_float(data.coil_width)
    coil_id = to_float(data.coil_id)

    # Calculate coil OD based on weight, density, width, and inner diameter
    # Formula: OD = 2 * sqrt((weight/(density * π * width)) + (ID/2)²)
    valid_types = (int, float)
    if all(isinstance(x, valid_types) and x is not None for x in [coil_weight, density, coil_width, coil_id]):
        try:
            # Calculate cross-sectional area term from weight and material properties
            area_term = coil_weight / (density * math.pi * coil_width)
            # Calculate inner radius squared term
            radius_term = (coil_id / 2) ** 2
            # Calculate outer diameter and round up to nearest integer
            if area_term + radius_term >= 0:
                coil_od = math.sqrt(area_term + radius_term) * 2
                coil_od_calculated = math.ceil(coil_od)
            else:
                coil_od_calculated = 0
        except Exception as e:
            coil_od_calculated = 0
    else:
        coil_od_calculated = 0
    
    return {
        "min_bend_radius": min_bend_radius,
        "min_loop_length": min_loop_length,
        "coil_od_calculated": coil_od_calculated
    }
