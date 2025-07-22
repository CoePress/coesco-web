"""
Shared utility functions and constants for RFQ calculations.

"""

from dataclasses import dataclass

### File Path for json files
JSON_FILE_PATH = "./outputs/"

### Shared States
@dataclass
class RFQState:
    """
    State for RFQ calculations.
    """
    reference: str = "0000"
    version: str = "1.0"
    customer: str = "Default Company"
    date: str = "2023-01-01"

rfq_state = RFQState()

### LOOKUPS
FPM_BUFFER = 1.2
BACKBEND_MIN = 0.4
BACKBEND_MAX = 0.7
BACKBEND_CONFIRM = 0.55

### Functions
def get_percent_material_yielded_check(percent_material_yielded: float, confirm_check: bool) -> float:
    """
    Check if the percent material yielded is within the valid range.
    """

    if percent_material_yielded >= BACKBEND_MIN and percent_material_yielded <= BACKBEND_MAX:
        if percent_material_yielded <= BACKBEND_CONFIRM and confirm_check == False:
            yield_met_check = "BACKBEND YIELD NOT CONFIRMED"
        else:
            yield_met_check = "OK"
    else:
        yield_met_check = "BACKBEND YIELD NOT OK"

    return yield_met_check

### Constant values
# STR_UTILITY
MOTOR_RPM = 1750
EFFICIENCY = 0.85
PINCH_ROLL_QTY = 4
MAT_LENGTH = 96
CONT_ANGLE = 20
FEED_RATE_BUFFER = 1.2

LEWIS_FACTORS = {
        12 : 0.245, 13 : 0.261, 14 : 0.277, 15 : 0.29, 16 : 0.296,
        17 : 0.302, 18 : 0.314, 19 : 0.314, 20 : 0.321, 21 : 0.327, 22 : 0.33, 24 : 0.337,
        25 : 0.341, 26 : 0.346, 27 : 0.348, 28 : 0.352, 30 : 0.359, 31 : 0.362, 32 : 0.365, 34 : 0.37
    }

# TDDBHD
NUM_BRAKEPADS = 2
BRAKE_DISTANCE = 12
CYLINDER_ROD = 1
STATIC_FRICTION = 0.5

# ROLL_STR_BACKBEND
CREEP_FACTOR = 0.33
RADIUS_OFF_COIL = -60

# REEL_DRIVE
CHAIN_RATIO = 4
CHAIN_SPRKT_OD = 31
CHAIN_SPRKT_THICKNESS = 1.3
REDUCER_DRIVING = 0.85
REDUCER_BACKDRIVING = 0.5
REDUCER_INERTIA = 0.1
ACCEL_RATE = 1

### Shared values
# roll_str_backbend
roll_str_backbend_state = {
    "calc_const": 10007.4705248145,
    "percent_material_yielded": 0,
    "confirm_check": False
}