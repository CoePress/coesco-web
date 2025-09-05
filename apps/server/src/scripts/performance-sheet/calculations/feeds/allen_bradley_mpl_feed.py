"""
Allen Bradley MPL Feed Module

"""
from services.feed_calculations import run_allen_bradley_calculation
from models import base_feed_params

def calculate_allen_bradley(data: base_feed_params):
    """
    Calculate Allen Bradley MPL feed parameters.

    Args: \n
        data (AllenBradleyInput): Input data containing feed parameters.

    Returns: \n
        dict: A dictionary containing calculated feed parameters.

    Raises: \n
        Exception: If an error occurs during the calculation or saving process.

    """
    result = run_allen_bradley_calculation(data, data.feed_type)

    return result
