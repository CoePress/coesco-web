"""
Sigma Five Feed Module

"""
from services.feed_calculations import run_sigma_five_calculation
from models import base_feed_params

def calculate_sigma_five(data: base_feed_params):
    """
    Calculate Sigma Five feed parameters.

    Args: \n
        data (FeedInput): Input data containing feed parameters.

    Returns: \n
        dict: A dictionary containing calculated feed parameters.

    Raises: \n
        Exception: If an error occurs during the calculation or saving process.
    
    """

    result = run_sigma_five_calculation(data, data.feed_type)

    return result
