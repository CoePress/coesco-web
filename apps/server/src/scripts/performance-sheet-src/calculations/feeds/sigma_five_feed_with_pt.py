"""
Sigma Five Feed with Pull Thru Calculation Module

"""
from services.feed_calculations import run_sigma_five_calculation, run_sigma_five_pt_calculation
from models import feed_w_pull_thru_input

def calculate_sigma_five_pt(data: feed_w_pull_thru_input):
    """
    Calculate Sigma Five feed parameters with pull-thru configuration.

    Args: \n
        data (FeedWPullThruInput): Input data containing feed parameters with pull-thru.

    Returns: \n
        dict: A dictionary containing calculated feed parameters with pull-thru.

    Raises: \n
        Exception: If an error occurs during the calculation or saving process.
    
    """

    base_result = run_sigma_five_calculation(data, "sigma_five_pt")
    pt_result = run_sigma_five_pt_calculation(base_result, 
                data.straightening_rolls, data.material_width, data.material_thickness, 
                data.feed_model, data.yield_strength, data.str_pinch_rolls, data.req_max_fpm, "sigma_five_pt")
    
    base_result["peak_torque"] += pt_result["straightner_torque"]

    result = base_result | pt_result

    return result
