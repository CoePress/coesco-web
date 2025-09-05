"""
Hidden Constant Calculation for Roll Str Backbend

"""
from models import hidden_const_input
from math import sqrt

def calculate_hidden_const(input: hidden_const_input) -> float:
    hidden_const = 10000  # Default value for hidden constant

    # Calculate needed values
    radius = input.radius_at_yield / 2.49
    c4 = input.center_distance / 3
    radius_compared = sqrt((radius ** 2) - (c4 ** 2))
    engage = (radius - radius_compared) * 1.3
    diff = input.thickness - engage

    hidden_const = 10000 + (diff * 1000)

    return hidden_const

