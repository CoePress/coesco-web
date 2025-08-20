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

### CENTRALIZED DEFAULT VALUES ###
DEFAULTS = {   

    # Material specs defaults
    'material': {
        'material_type': 'COLD ROLLED STEEL',
        'material_thickness': 0.0,
        'yield_strength': 0.0,
        'coil_width': 0.0,
        'coil_weight': 0.0,
        'coil_id': 0.0,
        'max_coil_od': 0.0,
        'max_coil_weight': 0.0,
        'max_coil_width': 0.0,
    },
    
    # Feed defaults
    'feed': {
        'direction': 'left_to_right',
        'controls_level': 'SyncMaster',
        'type_of_line': 'Conventional',
        'controls': 'Sigma 5 Feed',
        'type': 'sigma_five',
        'passline': 0.0,
        'light_gauge_non_marking': False,
        'non_marking': False,
        'model': 'CPRF-S3',
        'machine_width': 0,
        'roll_width': 'No',
        'loop_pit': 'No',
        'application': 'Press Feed',
        'average_fpm': 0.0,
        'maximum_velocity': 0.0,
        'acceleration_rate': 0.0,
        'chart_min_length': 0.0,
        'length_increment': 0.0,
        'feed_angle_1': 0.0,
        'feed_angle_2': 0.0,
        'pull_thru': 'No',
        'straightener_rolls': 0,
        'pinch_rolls': 0,
        'average_length': 0.0,
        'average_spm': 0.0,
        'min_length': 0.0,
        'min_spm': 0.0,
        'max_length': 0.0,
        'max_spm': 0.0,
        'rate': 0.0,
        'friction_in_die': 0,
    },
    
    # Reel defaults
    'reel': {
        'model': 'CPR-040',
        'horsepower': 0.0,
        'width': 0.0,
        'backplate_diameter': 0.0,
        'style': 'Single Ended',
        'required_decel_rate': 0.0,
        'coefficient_of_friction': 0.0,
        'air_pressure_available': 0.0,
        'drag_brake_quantity': 0,
        'drag_brake_model': 'Single Stage',
        'holddown_cylinder': 'Hydraulic',
        'holddown_assy': 'SD',
        'threading_drive_hyd': '22 cu in (D-12689)',
        'threading_drive_air_clutch': 'Yes',
    },
    
    # Straightener defaults
    'straightener': {
        'model': 'CPPS-250',
        'width': 0.0,
        'horsepower': 0.0,
        'feed_rate': 0.0,
        'auto_brake_compensation': 'Yes',
        'acceleration': 0.0,
        'number_of_rolls': 0,
        'calc_const': 0,
    },
    
    # Press defaults
    'press': {
        'bed_length': 0,
    },
    
    # Shear defaults
    'shear': {
        'model': 'single_rake',
        'strength': 0.0,
        'rake_of_blade_per_foot': 0.0,
        'overlap': 0.0,
        'blade_opening': 0.0,
        'percent_of_penetration': 0.0,
        'bore_size': 0.0,
        'rod_diameter': 0.0,
        'stroke': 0.0,
        'hydraulic_pressure': 0.0,
        'time_for_downward_stroke': 0.0,
        'dwell_time': 0.0,
    },
}

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
    "calc_const": 10205.2064976266,
    "percent_material_yielded": 0,
    "confirm_check": False
}