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
        'feed_angle_1': 180.0,
        'feed_angle_2': 180.0,
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
        'confirmed_min_width': False,
        'yield_met': 'NOT OK'
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

###
# Options
###
DAYS_PER_WEEK_OPTIONS = [
    "1 Day",
    "2 Days",
    "3 Days",
    "4 Days",
    "5 Days",
    "6 Days",
    "7 Days",
]

SHIFTS_PER_DAY_OPTIONS = [
    "1 Shift",
    "2 Shifts",
    "3 Shifts",
]

LINE_APPLICATION_OPTIONS = [
    "Press Feed",
    "Cut to Length",
    "Standalone",
]

EDGE_TYPE_OPTIONS = [
    "Yes",
    "No",
    "Both",
]

LOADING_OPTIONS = [
    "Operator Side",
    "Non-Operator Side",
]

PRESS_TYPE_OPTIONS = [
    "Mechanical",
    "Hydraulic",
    "Servo",
]

DIE_TYPE_OPTIONS = [
    "Progressive",
    "Transfer",
    "Blanking",
]

PRESS_APPLICATION_OPTIONS = [
    "Press Feed",
    "Cut To Length",
    "Standalone",
]

VOLTAGE_OPTIONS = [
    "120V",
    "240V",
    "480V",
    "600V",
]

FEED_DIRECTION_OPTIONS = [
    "Right to Left",
    "Left to Right",
]

COIL_LOADING_OPTIONS = [
    "Operator Side",
    "Non-Operator Side",
]

CONTROLS_LEVEL_OPTIONS = [
    "Mini-Drive System",
    "Relay Machine",
    "SyncMaster",
    "IP Indexer Basic",
    "Allen Bradley Basic",
    "SyncMaster Plus",
    "IP Indexer Plus",
    "Allen Bradley Plus",
    "Fully Automatic",
]

RFQ_TYPE_OF_LINE_OPTIONS = [
    "Compact",
    "Conventional",
]

TYPE_OF_LINE_OPTIONS = [
    "Compact",
    "Compact CTL",
    "Conventional",
    "Conventional CTL",
    "Pull Through",
    "Pull Through Compact",
    "Pull Through CTL",
    "Feed",
    "Feed-Pull Through",
    "Feed-Pull Through-Shear",
    "Feed-Shear",
    "Straightener",
    "Straightener-Reel Combination",
    "Reel-Motorized",
    "Reel-Pull Off",
    "Threading Table",
    "Other",
]

PASSLINE_OPTIONS = [
    'None', '37"', '39"', '40"', '40.5"', '41"', '41.5"', '42"', '43"', '43.625"', '44"', '45"', '45.5"', '46"', '46.5"', '47"', '47.4"', '47.5"', '48"', '48.5"', '49"', '49.5"', '50"', '50.5"', '50.75"', '51"', '51.5"', '51.75"', '52"', '52.25"', '52.5"', '53"', '54"', '54.5"', '54.75"', '55"', '55.25"', '55.5"', '55.75"', '56"', '56.5"', '57"', '58"', '58.25"', '59"', '59.5"', '60"', '60.5"', '61"', '62"', '62.5"', '63"', '64"', '64.5"', '65"', '66"', '66.5"', '67"', '70"', '72"', '75"', '76"',
]

ROLL_TYPE_OPTIONS = [
    "7 Roll Str. Backbend",
    "9 Roll Str. Backbend",
    "11 Roll Str. Backbend",
]

REEL_BACKPLATE_OPTIONS = [
    "Standard Backplate",
    "Full OD Backplate",
]

REEL_STYLE_OPTIONS = [
    "Single Ended",
    "Double Ended",
]

REEL_HORSEPOWER_OPTIONS = [
    "3 HP",
    "5 HP",
]

MATERIAL_TYPE_OPTIONS = [
    "Aluminum",
    "Galvanized",
    "HS Steel",
    "Hot Rolled Steel",
    "Dual Phase",
    "Cold Rolled Steel",
    "Stainless Steel",
    "Titanium",
    "Brass",
    "Beryl Copper",
]

YES_NO_OPTIONS = [
    "No",
    "Yes",
]

REEL_MODEL_OPTIONS = [
    "CPR-040",
    "CPR-060",
    "CPR-080",
    "CPR-100",
    "CPR-150",
    "CPR-200",
    "CPR-300",
    "CPR-400",
    "CPR-500",
    "CPR-600",
]

REEL_WIDTH_OPTIONS = [
    "24",
    "30",
    "36",
    "42",
    "48",
    "54",
    "60",
]

BACKPLATE_DIAMETER_OPTIONS = [
    "27",
    "72",
]

HYDRAULIC_THREADING_DRIVE_OPTIONS = [
    "22 cu in (D-12689)",
    "38 cu in (D-13374)",
    "60 cu in (D-13374)",
    "60 cu in (D-13382)",
]

HOLD_DOWN_ASSY_OPTIONS = [
    "SD",
    "SD_MOTORIZED",
    "MD",
    "HD_SINGLE",
    "HD_DUAL",
    "XD",
    "XXD",
]

HOLD_DOWN_CYLINDER_OPTIONS = [
    "Hydraulic",
]

BRAKE_MODEL_OPTIONS = [
    "Single Stage",
    "Double Stage",
    "Triple Stage",
    "Failsafe - Single Stage",
    "Failsafe - Double Stage",
]

BRAKE_QUANTITY_OPTIONS = [
    "1",
    "2",
    "3",
]

PAYOFF_OPTIONS = [
    "TOP",
    "BOTTOM",
]

STR_MODEL_OPTIONS = [
    "CPPS-250",
    "CPPS-306",
    "CPPS-350",
    "CPPS-406",
    "CPPS-507",
    "SPGPS-810",
]

STR_WIDTH_OPTIONS = [
    '24"',
    '30"',
    '36"',
    '42"',
    '48"',
    '54"',
    '60"',
    '66"',
    '72"',
]

STR_HORSEPOWER_OPTIONS = [
    "20 HP",
    "25 HP",
    "30 HP",
    "40 HP",
    "50 HP",
]

STR_FEED_RATE_OPTIONS = [
    "80 FPM",
    "100 FPM",
    "120 FPM",
    "140 FPM",
    "160 FPM",
    "200 FPM",
]

FEED_MODEL_OPTIONS = [
    "Sigma 5 Feed",
    "Sigma 5 Feed Pull Thru",
    "Allen Bradley",
]

SIGMA_5_FEED_MODEL_OPTIONS = [
    "CPRF-S1",
    "CPRF-S1 PLUS",
    "CPRF-S2",
    "CPRF-S2 PLUS",
    "CPRF-S3",
    "CPRF-S3 PLUS",
    "CPRF-S4",
    "CPRF-S4 PLUS",
    "CPRF-S5",
    "CPRF-6",
    "CPRF-7",
    "CPRF-8",
]

SIGMA_5_PULLTHRU_FEED_MODEL_OPTIONS = [
    "CPRF-S1 ES",
    "CPRF-S1 ES PLUS",
    "CPRF-S2 ES",
    "CPRF-S2 ES PLUS",
    "CPRF-S3 ES",
    "CPRF-S3 RS",
    "CPRF-S3 RS PLUS",
    "CPRF-S4 HS",
    "CPRF-S4 HS PLUS",
    "CPRF-S4 RS",
    "CPRF-S4 RS PLUS",
    "CPRF-S5-350",
    "CPRF-S6-350",
    "CPRF-S6-500",
    "CPRF-S7-350",
    "CPRF-S7-500",
    "CPRF-S8-500",
]

ALLEN_BRADLEY_FEED_MODEL_OPTIONS = [
    "CPRF-S1 MPL",
    "CPRF-S2 MPL",
    "CPRF-S3 MPL",
    "CPRF-S3 MPM",
    "CPRF-S4 MPL",
    "CPRF-S5 MPL",
    "CPRF-S6 MPL",
    "CPRF-S7 MPL",
    "CPRF-S8 MPL",
]

MACHINE_WIDTH_OPTIONS = [
    "18",
    "24",
    "30",
    "36",
    "42",
    "48",
    "54",
    "60",
]

STRAIGHTENER_ROLLS_OPTIONS = [
    "5 Rolls",
    "7 Rolls",
]