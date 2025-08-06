""" 
Request for Quote (RFQ) Management Module

"""
from models import rfq_input

def calculate_fpm(data: rfq_input):
    """
    Calculate feed speed in feet per minute (FPM).

    Args: \n
        data (FPMInput): Contains:
            - feed_length: Length of feed in inches
            - spm: Strokes per minute

    Returns: \n
        Dict[str, Union[str, float]]:
            - {"fpm": float} on success
            - {"fpm": ""} if inputs are invalid or zero
    """

    if data.feed_length > 0 and data.spm > 0:
        fpm = round((data.feed_length * data.spm) / 12, 2)
        return fpm

    return 0

