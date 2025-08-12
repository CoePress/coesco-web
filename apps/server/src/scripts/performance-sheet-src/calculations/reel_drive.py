"""
Reel Drive Calculation Module

"""
from models import reel_drive_input
from math import pi
from typing import Tuple, Dict, Any

from utils.shared import (
    CHAIN_RATIO, CHAIN_SPRKT_OD, CHAIN_SPRKT_THICKNESS, MOTOR_RPM,
    REDUCER_DRIVING, REDUCER_BACKDRIVING, REDUCER_INERTIA, ACCEL_RATE,
    rfq_state
)

from utils.lookup_tables import (
    get_reel_dimensions,
    get_material,
    get_motor_inertia,
    get_type_of_line,
    get_fpm_buffer
)

def calc_mandrel_specs(
        reel: Dict[str, Any], 
        reel_width: float, 
        brg_dist: float, 
        total_ratio: float
    ) -> Tuple[float, float, float, float, float]:
    """
    Calculate mandrel (central shaft) specifications including dimensions,
    weight, inertia, and reflected inertia.
    
    Args:
        reel (Dict[str, Any]): Reel dimensions dictionary from lookup table
        reel_width (float): Width of the reel in inches
        brg_dist (float): Distance between bearings in inches
        total_ratio (float): Total gear ratio from motor to mandrel
        
    Returns:
        Tuple[float, float, float, float, float]: 
            - mandrel_dia: Mandrel diameter in inches
            - mandrel_length: Mandrel length in inches  
            - mandrel_weight: Mandrel weight in pounds
            - mandrel_inertia: Mandrel moment of inertia in lb-in²
            - mandrel_refl: Reflected inertia to motor in lb-in²

    """
    mandrel_dia = reel["mandrel_dia"]
    
    # Calculate mandrel length: reel width + clearances + bearing distance
    mandrel_length = reel_width + 17 + brg_dist
    
    # Calculate mandrel weight using steel density (0.283 lb/in³)
    mandrel_weight = ((mandrel_dia/2)**2) * pi * mandrel_length * 0.283
    
    # Calculate moment of inertia for solid cylinder: I = m*r²/2
    mandrel_inertia = mandrel_weight / 32.3 / 2 * ((mandrel_dia/2)**2 / 144) * 12
    
    # Calculate reflected inertia to motor shaft through gear ratio
    if total_ratio != 0: 
        mandrel_refl = mandrel_inertia / total_ratio**2 
    else: 
        mandrel_refl = 0

    return mandrel_dia, mandrel_length, mandrel_weight, mandrel_inertia, mandrel_refl 

def calc_backplate_specs(
        backplate_diameter: float, 
        total_ratio: float, 
        mandrel_dia: float
    ) -> Tuple[float, float, float]:
    """
    Calculate backplate specifications including weight, inertia, and reflected inertia.
    
    Args:
        backplate_diameter (float): Backplate diameter in inches
        total_ratio (float): Total gear ratio from motor to mandrel
        mandrel_dia (float): Mandrel diameter in inches (used for inertia calculation)
        
    Returns:
        Tuple[float, float, float]:
            - backplate_weight: Backplate weight in pounds
            - backplate_inertia: Backplate moment of inertia in lb-in²
            - backplate_refl: Reflected inertia to motor in lb-in²
            
    """
    # Calculate backplate weight as circular disk
    backplate_weight = ((backplate_diameter/2)**2) * pi * 0.283
    
    # Calculate moment of inertia using mandrel diameter as effective radius
    backplate_inertia = backplate_weight / 32.3 / 2 * ((mandrel_dia/2)**2 / 144) * 12
    
    # Calculate reflected inertia to motor shaft
    if total_ratio != 0: 
        backplate_refl = backplate_inertia / total_ratio**2
    else: 
        backplate_refl = 0

    return backplate_weight, backplate_inertia, backplate_refl

def calc_coil_specs(
        reel_size: float, 
        coil_od: float, 
        coil_id: float, 
        coil_density: float,
        total_ratio: float, 
        density: float
    ) -> Tuple[float, float, float, float]:
    """
    Calculate coil specifications including dimensions, weight, inertia, and reflected inertia.
    
    Args:
        reel_size (float): Maximum coil weight capacity in pounds
        coil_od (float): Coil outer diameter in inches
        coil_id (float): Coil inner diameter in inches  
        coil_density (float): Coil packing density factor
        total_ratio (float): Total gear ratio from motor to mandrel
        density (float): Material density in lb/in³
        
    Returns:
        Tuple[float, float, float, float]:
            - coil_density: Updated coil density
            - coil_width: Calculated coil width in inches
            - coil_inertia: Coil moment of inertia in lb-in²
            - coil_refl: Reflected inertia to motor in lb-in²
            
    """
    print(f"DEBUG - calc_coil_specs called with reel_size={reel_size}, coil_od={coil_od}, coil_id={coil_id}, density={density}")

    try:
        # Use material density for coil calculations
        coil_density = density
        
        # Calculate coil width from weight and cross-sectional area
        coil_width = reel_size / coil_density / ((coil_od**2 - coil_id**2) / 4) / pi
        
        # Calculate moment of inertia for hollow cylinder
        coil_inertia = reel_size / 32.3 / 2 * ((coil_od/2)**2 + (coil_id/2)**2) /144 * 12
        
        # Calculate reflected inertia to motor shaft
        if total_ratio != 0: 
            coil_refl = coil_inertia / total_ratio**2
        else: 
            coil_refl = 0
            
        return coil_density, coil_width, coil_inertia, coil_refl
        
    except ZeroDivisionError as e:
        print(f"ERROR: ZeroDivisionError in calc_coil_specs - {str(e)}", file=sys.stderr)
        # Return default/zero values to maintain the expected tuple structure
        return 0.0, 0.0, 0.0, 0.0

def calculate_reeldrive(data: reel_drive_input) -> Dict[str, Any]:
    """
    Main calculation endpoint for reel drive system analysis.
    
    Args: \n
        data (ReelDriveInput): Input parameters including:
            - model: Reel model identifier
            - material_type: Material type for density lookup
            - motor_hp: Motor horsepower rating
            - type_of_line: Production line type
            - required_max_fpm: Required maximum speed in feet per minute
            - reel_width: Reel width in inches
            - coil_od: Coil outer diameter in inches
            - coil_id: Coil inner diameter in inches
            - backplate_diameter: Backplate diameter in inches
            
    Returns: \n
        Dict[str, Any]: Comprehensive results dictionary containing all calculated
        specifications and analysis results
        
    Raises: \n
        HTTPException: 
            - 400: Invalid input data or lookup failures
            - 500: JSON file save failures

    """
    try:
        # Get reel dimensions from model lookup table
        reel = get_reel_dimensions(data.model)
        
        # Get material properties (primarily density)
        material = get_material(data.material_type)
        print(f"DEBUG - Material properties: {material}")
        
        # Get motor inertia - handle special case for 7.5 HP
        if (data.motor_hp == 7.5):
            motor_inertia = get_motor_inertia(str(data.motor_hp))
        else:
            motor_inertia = get_motor_inertia(str(int(data.motor_hp)))
            
        # Get production line type characteristics
        reel_type = get_type_of_line(data.type_of_line)
        
        # Get speed safety buffer factor
        fpm_buffer = get_fpm_buffer("DEFAULT")
        
    except:
        return "ERROR: Reel Drive lookup failed."

    # Chain drive specifications
    chain_ratio = CHAIN_RATIO
    chain_sprkt_od = CHAIN_SPRKT_OD
    chain_sprkt_thickness = CHAIN_SPRKT_THICKNESS
    
    # Reducer specifications
    reducer_driving = REDUCER_DRIVING          # Driving efficiency (typically 0.95)
    reducer_backdriving = REDUCER_BACKDRIVING  # Backdriving efficiency (typically 0.85)
    reducer_inertia = REDUCER_INERTIA          # Reducer internal inertia
    
    # Motor and acceleration parameters
    motor_base_rpm = MOTOR_RPM    # Base motor RPM (typically 1800)
    accel_rate = ACCEL_RATE       # Acceleration rate in RPM/sec

    # Calculate actual operating speed with safety buffer
    speed = data.required_max_fpm * fpm_buffer
    
    # Calculate acceleration time to reach operating speed
    accel_time = speed / 60 / accel_rate

    # Calculate mandrel RPM requirements
    mandrel_max_rpm = speed * 12 / data.coil_id / pi
    
    # At full coil (large OD): lower RPM required
    mandrel_full_rpm = speed * 12 / data.coil_od / pi
    
    # Calculate total gear ratio needed
    if mandrel_max_rpm != 0:
        total_ratio = motor_base_rpm / mandrel_max_rpm
    else:
        total_ratio = 0

    # Get reel capacity and bearing specifications
    reel_size = reel["coil_weight"]      # Maximum coil weight capacity
    brg_dist = reel["bearing_dist"]      # Distance between bearings
    f_brg_dia = reel["fbearing_dia"]     # Front bearing diameter
    r_brg_dia = reel["rbearing_dia"]     # Rear bearing diameter

    # Calculate mandrel specifications
    mandrel_dia, mandrel_length, mandrel_weight, mandrel_inertia, mandrel_refl = calc_mandrel_specs(
        reel, data.reel_width, brg_dist, total_ratio
    )

    # Calculate backplate specifications
    backplate_weight, backplate_inertia, backplate_refl = calc_backplate_specs(
        data.backplate_diameter, total_ratio, mandrel_dia
    )
    
    # Calculate coil specifications
    coil_density, coil_width, coil_inertia, coil_refl = calc_coil_specs(
        reel_size, data.coil_od, data.coil_id, material["density"], total_ratio, material["density"]
    )

    # Calculate reducer ratio (total ratio divided by chain ratio)
    reducer_ratio = total_ratio / chain_ratio

    # Calculate chain sprocket specifications
    # Chain sprocket weight and inertia
    chain_weight = ((chain_sprkt_od/2)**2) * pi * chain_sprkt_thickness * 0.283
    chain_inertia = chain_weight / 32.3 / 2 * ((chain_sprkt_od/2)**2 / 144) * 12
    
    # Calculate chain reflected inertia
    if total_ratio != 0: 
        chain_refl = chain_inertia / total_ratio**2
    else: 
        chain_refl = 0

    # Total reflected inertia for empty reel (no coil)
    total_refl_empty = mandrel_refl + backplate_refl + reducer_inertia + chain_refl
    
    # Total reflected inertia for full reel (with coil)
    total_refl_full = total_refl_empty + coil_refl

    # Calculate motor RPM when reel is full (lower speed due to larger diameter)
    if total_ratio != 0: 
        motor_rpm_full = speed * 12 / data.coil_od / pi * total_ratio
    else: 
        motor_rpm_full = 0

    # Friction moment arm (distance from bearing to load center)
    friction_arm = (data.reel_width / 2) + 13

    # Mandrel friction forces at bearings
    # Rear bearing mandrel friction
    r_brg_mand = mandrel_weight * friction_arm / brg_dist * 0.002 * r_brg_dia / 2
    
    # Front bearing mandrel friction (includes moment effect)
    f_brg_mand = (mandrel_weight + (mandrel_weight * ((data.reel_width/2)+13) / brg_dist)) * 0.002 * f_brg_dia / 2

    # Coil friction forces at bearings
    # Rear bearing coil friction
    r_brg_coil = reel_size * friction_arm / brg_dist * 0.002 * r_brg_dia / 2
    
    # Front bearing coil friction (includes moment effect)
    f_brg_coil = (reel_size + (reel_size * ((data.reel_width/2)+13) / brg_dist)) * 0.002 * f_brg_dia / 2

    # Total friction forces
    friction_total_empty = r_brg_mand + f_brg_mand                    # Empty reel
    friction_total_full = friction_total_empty + r_brg_coil + f_brg_coil  # Full reel

    # Calculate reflected friction torque to motor
    if total_ratio != 0 and reducer_driving != 0: 
        friction_refl_empty = friction_total_empty / total_ratio / reducer_driving
    else: 
        friction_refl_empty = 0
        
    if total_ratio != 0 and reducer_driving != 0: 
        friction_refl_full = friction_total_full / total_ratio / reducer_driving
    else: 
        friction_refl_full = 0

    # Torque calculation for empty reel condition
    # Torque = (Inertia_Torque / Efficiency) + Motor_Inertia_Torque + Friction_Torque
    # Inertia_Torque = (J * ω) / (9.55 * t) where 9.55 converts to proper units
    if total_ratio != 0:
        torque_empty = ((((total_refl_empty * motor_base_rpm) / (9.55 * accel_time)) / reducer_driving) +
                        (motor_inertia * motor_base_rpm) / (9.55 * accel_time)) + friction_refl_empty
    else:
        torque_empty = 0

    # Torque calculation for full reel condition
    if total_ratio != 0:
        torque_full = ((((total_refl_full * motor_rpm_full) / (9.55 * accel_time)) / reducer_driving) +
                    (motor_inertia * motor_rpm_full) / (9.55 * accel_time)) + friction_refl_full
    else:
        torque_full = 0

    # Calculate required horsepower: HP = Torque * RPM / 63000
    hp_req_empty = torque_empty * motor_base_rpm / 63000
    hp_req_full = torque_full * motor_base_rpm / 63000
    
    # Validate motor sizing adequacy
    status_empty = "valid" if data.motor_hp > hp_req_empty else "too small"
    status_full = "valid" if data.motor_hp > hp_req_full else "too small"

    # Regenerative power during deceleration (braking)
    # Power = (Inertia_Power + Motor_Inertia_Power - Friction_Power) * conversion_factor
    
    # Regenerative power for empty reel
    if total_ratio != 0:
        regen_empty = ((((total_refl_empty * motor_base_rpm) / (9.55 * accel_time)) +
                    (motor_inertia * motor_base_rpm) / (9.55 * accel_time)) -
                    (friction_total_empty / total_ratio / reducer_backdriving)) * motor_base_rpm / 63000 * 746
    else:
        regen_empty = 0

    # Regenerative power for full reel
    if total_ratio != 0:
        regen_full = ((((total_refl_full * motor_rpm_full) / (9.55 * accel_time)) +
                    (motor_inertia * motor_rpm_full) / (9.55 * accel_time)) -
                    (friction_total_full / total_ratio / reducer_backdriving)) * motor_rpm_full / 63000 * 746
    else:
        regen_full = 0

    # Pulloff recommendation based on line type and motor adequacy
    if reel_type == "Motorized":
        # For motorized lines, check if motor can handle both conditions
        if data.motor_hp > hp_req_empty and data.motor_hp > hp_req_full:
            pulloff = "OK"
        else:
            pulloff = "NOT OK"
    else:
        # For non-motorized lines, always recommend pulloff
        pulloff = "USE PULLOFF"

    results = {
        "reel": {
            "size": reel_size,         
            "max_width": data.reel_width,  
            "brg_dist": brg_dist,             
            "f_brg_dia": f_brg_dia,            
            "r_brg_dia": r_brg_dia             
        },
        "mandrel": {
            "diameter": mandrel_dia,          
            "length": mandrel_length,            
            "max_rpm": mandrel_max_rpm,       
            "rpm_full": mandrel_full_rpm,        
            "weight": mandrel_weight,         
            "inertia": mandrel_inertia,           
            "refl_inert": mandrel_refl          
        },
        "backplate": {
            "diameter": data.backplate_diameter, 
            "thickness": reel["backplate_thickness"], 
            "weight": backplate_weight,         
            "inertia": backplate_inertia,      
            "refl_inert": backplate_refl     
        },
        "coil": {
            "density": coil_density,             
            "od": data.coil_od,                 
            "id": data.coil_id,                
            "width": coil_width,          
            "weight": reel_size,             
            "inertia": coil_inertia,         
            "refl_inert": coil_refl          
        },
        "reducer": {
            "ratio": reducer_ratio,             
            "driving": reducer_driving,        
            "backdriving": reducer_backdriving,
            "inertia": reducer_inertia,         
            "refl_inert": reducer_inertia        
        },
        "chain": {
            "ratio": chain_ratio,                
            "sprkt_od": chain_sprkt_od,        
            "sprkt_thk": chain_sprkt_thickness, 
            "weight": chain_weight,             
            "inertia": chain_inertia,            
            "refl_inert": chain_refl             
        },
        "total": {
            "ratio": total_ratio,                
            "total_refl_inert_empty": total_refl_empty, 
            "total_refl_inert_full": total_refl_full  
        },
        "motor": {
            "hp": data.motor_hp,               
            "inertia": motor_inertia,           
            "base_rpm": motor_base_rpm,       
            "rpm_full": motor_rpm_full           
        },
        "friction": {
            "r_brg_mand": r_brg_mand,         
            "f_brg_mand": f_brg_mand,         
            "r_brg_coil": r_brg_coil,        
            "f_brg_coil": f_brg_coil,           
            "total_empty": friction_total_empty, 
            "total_full": friction_total_full,   
            "refl_empty": friction_refl_empty,  
            "refl_full": friction_refl_full     
        },
        "speed": {
            "speed": speed,                      
            "accel_rate": accel_rate,             
            "accel_time": accel_time              
        },
        "torque": {
            "empty": torque_empty,                
            "full": torque_full                  
        },
        "hp_req": {
            "empty": hp_req_empty,             
            "full": hp_req_full,             
            "status_empty": status_empty,  
            "status_full": status_full        
        },
        "regen": {
            "empty": regen_empty,              
            "full": regen_full                
        },
        "use_pulloff": pulloff                 
    }
    
    return results
