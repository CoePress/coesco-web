"""
Models for various calculations related to RFQ, FPM, Material Specifications, TDDBHD, Reel Drive, Strapping Utility, Roll Str Backbend, Inertia, Regen, Time, Feed, Shear, and ZigZag

"""

from pydantic import BaseModel
from typing import Optional

######################################################
# Base Calculation Models
######################################################
# RFQ FPM calculation input
class rfq_input(BaseModel):
    feed_length: float  # in inches
    spm: float          # Strokes per minute

# MaterialSpecsPayload is used to define the payload structure for material specifications
class material_specs_input(BaseModel):
    material_type: str
    material_thickness: float  # in inches
    yield_strength: float      # in psi
    coil_width: float         # in inches
    coil_weight: float         # in lbs
    coil_id: float            # in inches

# TDDBHDInput is used to define the input structure for TDDBHD calculations
class tddbhd_input(BaseModel):
    type_of_line: str
    reel_drive_tqempty: Optional[float]
    motor_hp: Optional[float]

    yield_strength: float
    thickness: float
    width: float
    coil_id: float
    coil_od: float
    coil_weight: float
    confirmed_min_width: bool

    decel: float
    friction: float
    air_pressure: float

    brake_qty: int
    brake_model: str

    cylinder: str
    hold_down_assy: str
    hyd_threading_drive: str
    air_clutch: str
    
    material_type: str
    reel_model: str
    reel_width: float
    backplate_diameter: float

# ReelDriveInput is used to define the input structure for reel drive calculations    
class reel_drive_input(BaseModel):
    model: str
    material_type: str
    coil_id: float
    coil_od: float
    reel_width: float
    backplate_diameter: float
    motor_hp: float
    type_of_line: str
    required_max_fpm: Optional[float] = 0

# StrUtilityInput is used to define the input structure for strapping utility calculations
class str_utility_input(BaseModel):
    max_coil_weight: float
    coil_id: float
    coil_od: float
    coil_width: float
    material_thickness: float
    yield_strength: float
    material_type: str
    yield_met: str

    str_model: str
    str_width: float
    horsepower: float

    feed_rate: float
    max_feed_rate: float
    auto_brake_compensation: str
    acceleration: float
    num_str_rolls: int

##################################################
# Rolls Calculation Models
##################################################
# RollStrBackbendInput is used to define the input structure for roll str backbend calculations
class roll_str_backbend_input(BaseModel):
    yield_strength: float
    thickness: float
    width: float
    material_type: str
    material_thickness: float
    str_model: str
    num_str_rolls: int

# Hidden Constant Calculation for Roll Str Backbend
class hidden_const_input(BaseModel):
    center_distance: float
    radius_at_yield: float
    thickness: float

##################################################
# Physics Calculation Models
##################################################
# InertiaInput is used to define the input structure for inertia calculations
class inertia_input(BaseModel):
    feed_model: str
    width: int
    thickness: float
    density: float
    press_bed_length: int
    material_loop: float
    ratio: float
    efficiency: float
    roll_width: str
    material_width: int

# RegenInput is used to define the input structure for regenerative braking calculations
class regen_input(BaseModel):
    match: float
    motor_inertia: float
    rpm: float
    acceleration_time: float
    cycle_time: float
    watts_lost: float
    ec: float

# TimeInput is used to define the input structure for time calculations
class time_input(BaseModel):
    acceleration: float
    application: str
    feed_angle_1: float
    feed_angle_2: float
    frictional_torque: float
    increment: float
    loop_torque: float
    match: float

    min_length: float
    motor_inertia: float
    motor_rms_torque: float
    motor_peak_torque: float

    ratio: float
    efficiency: float
    refl_inertia: float
    rpm: float
    settle_time: float
    settle_torque: float

    str_max_sp: float
    str_max_sp_inch: float
    velocity: float
    width: float
    material_width: float
    material_thickness: float
    press_bed_length: float
    density: float
    material_loop: float

##################################################
# Feed Calculation Models
##################################################
# BaseFeedParams is used to define the common parameters for feed calculations
class base_feed_params(BaseModel):
    feed_type: str
    feed_model: str
    width: int
    loop_pit: str

    material_type: str
    application: str
    type_of_line: str
    roll_width: str
    feed_rate: Optional[float]
    material_width: int 
    material_thickness: float
    press_bed_length: int

    friction_in_die: float
    acceleration_rate: float
    chart_min_length: float
    length_increment: float
    feed_angle_1: float
    feed_angle_2: float

# FeedWPullThruInput is used to define the input structure for feed with pull-thru calculations
class feed_w_pull_thru_input(base_feed_params):
    straightening_rolls: int
    yield_strength: float
    str_pinch_rolls: str
    req_max_fpm: float

######################################################
# Shear Calculation Models
######################################################
class hyd_shear_input(BaseModel):
    max_material_thickness: float
    material_thickness: float
    coil_width: float
    material_tensile: float

    rake_of_blade: float
    overlap: float
    blade_opening: float
    percent_of_penetration: float

    bore_size: float
    rod_dia: float
    stroke: float

    pressure: float

    time_for_down_stroke: float
    dwell_time: float


######################################################
# ZigZag Calculation Models
######################################################
# ZigZagInput is used to define the input structure for zigzag calculations
class zig_zag_input(BaseModel):
    material_width: float
    material_thickness: float
    material_length_flat: float
    material_density: float

    pivot_to_screw: float
    total_load: float
    efficiency: float
    feed_angle: float
    misc_friction_at_motor: float

    lead_screw_o_dia: float
    lead_screw_i_dia: float
    lead_screw_length: float
    lead_screw_density: float
    lead_screw_qty: int

    min_length: float
    incriment: float
