"""
Sigma Five Feed with Pull Thru Calculation Module

"""
from services.feed_calculations import run_sigma_five_calculation, run_sigma_five_pt_calculation
from models import base_feed_params, feed_w_pull_thru_input

def calculate_sigma_five_pt(data: base_feed_params):
    """
    Calculate Sigma Five feed parameters with pull-thru configuration.

    Args: \n
        data (FeedWPullThruInput): Input data containing feed parameters with pull-thru.

    Returns: \n
        dict: A dictionary containing calculated feed parameters with pull-thru.

    Raises: \n
        Exception: If an error occurs during the calculation or saving process.
    
    """

    feed_w_pull_thru = feed_w_pull_thru_input(**data)

    base_result = run_sigma_five_calculation(data, data.feed_type)
    pt_result = run_sigma_five_pt_calculation(feed_w_pull_thru, data.feed_type)
    
    base_result["peak_torque"] += pt_result["straightner_torque"]

    result = base_result | pt_result

    return result
