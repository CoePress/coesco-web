"""
Bow Tie Hyd Shear Calculations Module

"""
from services.hyd_shear_calculations import calculate_hyd_shear
from models import hyd_shear_input

def calculate_bow_tie_hyd_shear(data: hyd_shear_input, spec_type: str = "bow_tie"):
    """
    Calculate hydraulic shear parameters for a bow tie shear.

    Args: \n
        data (HydShearInput): Input data containing shear parameters.
        spec_type (str): Type of shear specification, either "single_rake" or "bow_tie".

    Returns: \n
        dict: A dictionary containing calculated shear parameters. 

    Raises: \n
        ValueError: If the spec_type is not recognized.

    """
    
    results = calculate_hyd_shear(data, spec_type)
    
    return results

