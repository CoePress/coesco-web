"""
Lookup tables for various calculations.

"""

import json
import os

# Build a path to the JSON file relative to this file's location.
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_JSON_FILE = os.path.join(_BASE_DIR, "lookup_tables.json")

# Load the JSON file only once at module load time.
with open(_JSON_FILE, "r") as f:
    LOOKUP_DATA = json.load(f)

# Now extract the individual lookup dictionaries
#####
# TDDBHD
#####
lookup_material = LOOKUP_DATA.get("lookup_material", {})
lookup_reel_dimensions = LOOKUP_DATA.get("lookup_reel_dimensions", {})
lookup_friction = LOOKUP_DATA.get("lookup_friction", {})
lookup_fpm_buffer = LOOKUP_DATA.get("lookup_fpm_buffer", {})
lookup_model_families = LOOKUP_DATA.get("lookup_model_families", {})
lookup_holddown_sort = LOOKUP_DATA.get("lookup_holddown_sort", {})
lookup_brake_type = LOOKUP_DATA.get("lookup_brake_type", {})
lookup_holddown_matrix = LOOKUP_DATA.get("lookup_holddown_matrix", {})
lookup_drive_torque = LOOKUP_DATA.get("lookup_drive_key", {})
lookup_press_required = LOOKUP_DATA.get("lookup_press_required", {})
lookup_motor_inertia = LOOKUP_DATA.get("lookup_motor_inertia", {})
lookup_type_of_line = LOOKUP_DATA.get("lookup_type_of_line", {})

#####
# STR Utility
#####
lookup_str_model = LOOKUP_DATA.get("lookup_str_model", {})

#####
# Sigma Five Reel
#####
lookup_sigma5_feed = LOOKUP_DATA.get("lookup_sigma5_feed", {})
lookup_sigma5_feed_pt = LOOKUP_DATA.get("lookup_sigma5_feed_pt", {})
lookup_ab_feed = LOOKUP_DATA.get("lookup_ab_feed", {})

######
# TDDBHD methods
######
## Material Density
def get_material_density(material: str) -> float:
    """Return the density for a given material from the JSON lookup."""
    material_key = material.upper()
    try:
        return lookup_material[material_key]["density"]
    except KeyError:
        raise ValueError(f"Unknown material: {material}")

## Material Modulus
def get_material_modulus(material: str) -> float:
    """Return the modulus for a given material from the JSON lookup."""
    material_key = material.upper()
    try:
        return lookup_material[material_key]["modulus"]
    except KeyError:
        raise ValueError(f"Unknown material: {material}")

## Reel Max Weight
def get_reel_max_weight(reel_model: str) -> int:
    """Return the maximum weight for a given reel model from the JSON lookup."""
    reel_model_key = reel_model.upper()
    try:
        return lookup_reel_dimensions[reel_model_key]["coil_weight"]
    except KeyError:
        raise ValueError(f"Unknown reel model: {reel_model}")

## FPM Buffer
def get_fpm_buffer(key: str = "DEFAULT") -> float:
    """Return a FPM buffer value from the JSON lookup."""
    key = key.upper()
    try:
        return lookup_fpm_buffer[key]
    except KeyError:
        raise ValueError(f"Unknown FPM buffer key: {key}")

## Holddown Matrix
def get_hold_down_matrix_label(model: str, hold_down_assy: str, cylinder: str) -> str:
    """Form and return hold down matrix label."""
    try:
        hold_down_family = lookup_model_families[model]["holddown_family"]
    except KeyError:
        raise ValueError(f"Unknown family: {model}")

    try:
        holddown_sort = lookup_holddown_sort[hold_down_assy]["sort"]
    except KeyError:
        raise ValueError(f"Unknown holddown assembly: {hold_down_assy}")

    return f"{hold_down_family}+{holddown_sort}+{hold_down_assy}+{cylinder}"

## Pressure PSI
def get_pressure_psi(holddown_matrix_key: str, air_pressure: float) -> float:
    """Return pressure psi based off Holddown Matrix Key"""
    holddown_matrix = next(
    (entry for entry in lookup_holddown_matrix if entry["key"] == holddown_matrix_key),
    None  # default if not found
    )
    if holddown_matrix is None:
        raise ValueError(f"Holddown matrix key {holddown_matrix_key} not found")

    pressure_label = holddown_matrix["PressureLabel"]
    max_psi = holddown_matrix["MaxPSI"]
    psi = holddown_matrix["PSI"]

    if "psi Air" in pressure_label:
        return min(air_pressure, max_psi)
    else:
        return psi

## Holddown Force Available
def get_holddown_force_available(holddown_matrix_key: str, holddown_pressure: str) -> float:
    """Return Force Factor based off Holddown Matrix Key"""
    holddown_matrix = next(
        (entry for entry in lookup_holddown_matrix if entry["key"] == holddown_matrix_key),
        None  # default if not found
    )
    if holddown_matrix is None:
        raise ValueError(f"Holddown matrix key {holddown_matrix_key} not found")

    force_factor = holddown_matrix["ForceFactor"]
    return force_factor * holddown_pressure

## Min Material Width
def get_min_material_width(holddown_matrix_key: str) -> float:
    """Return Min Material Width based off Holddown Matrix Key"""
    holddown_matrix = next(
        (entry for entry in lookup_holddown_matrix if entry["key"] == holddown_matrix_key),
        None  # default if not found
    )
    if holddown_matrix is None:
        raise ValueError(f"Holddown matrix key {holddown_matrix_key} not found")

    min_material_width = holddown_matrix["MinWidth"]
    return min_material_width

## Cylinder bore
def get_cylinder_bore(brake_model: str) -> float:
    """Return Cylinder Bore Type based off Brake Model"""
    try:
        return lookup_brake_type[brake_model]["cylinder_bore"]
    except KeyError:
        raise ValueError(f"Unknown brake model: {brake_model}")

## Drive Key
def get_drive_key(model: str, air_clutch: str, hydThreadingDrive: str) -> str:
    """Return Torque at mandrel based off drive key"""
    try:
        drive_family = lookup_model_families[model]["drive_family"]
        return drive_family + "+" + air_clutch + "+" + hydThreadingDrive
    except KeyError:
        raise ValueError(f"Unknown family: {model}")

## Drive Torque
def get_drive_torque(drive_key: str) -> float:
    """Return Torque at mandrel based off drive key"""
    try:
        return lookup_drive_torque[drive_key]["torque"]
    except KeyError:
        raise ValueError(f"Unknown drive key: {drive_key}")

## Motor Inertia
def get_motor_inertia(motor_hp: str) -> float:
    """Return Motor Inertia based off Motor HP"""
    try:
        return lookup_motor_inertia[motor_hp]["motor_inertia"]
    except KeyError:
        raise ValueError(f"Unknown motor HP: {motor_hp}")

## Type of Line
def get_type_of_line(type_of_line: str) -> str:
    """Return Type of Line based off Type of Line"""
    try:
        return lookup_type_of_line[type_of_line]["reel_type"]
    except KeyError:
        raise ValueError(f"Unknown type of line: {type_of_line}")

## Reel Dimensions
def get_reel_dimensions(model: str) -> dict:
    """
    Return all data for a given reel model from the JSON lookup.

    Example:
        {
          "size": 20,
          "bearing_dist": 12,
          "fbearing_dist": 10,
          "rbearing_dist": 8
          "coil_weight": 1000,
          "mandrel_dia": 5,
          "backplate": 15,
          "full_od_backplate": 20,
          "backplate_thickness": 2
    }
    """
    reel_key = model.upper()
    try:
        return lookup_reel_dimensions[reel_key]
    except KeyError:
        raise ValueError(f"Unknown reel model: {model}")

## Material
def get_material(material: str) -> dict:
    """
    Return all data for a given material from the JSON lookup.

    Example:
        {
          "yield": 20000,
          "modulus": 10600000,
          "density": 0.0980
        }
    """
    material_key = material.upper()
    try:
        return lookup_material[material_key]
    except KeyError:
        raise ValueError(f"Unknown material: {material}")

#####
# STR Utility methods
#####
def get_str_model_value(model: str, field: str, label: str = None):
    """
    Generic accessor for model-specific fields from the lookup_str_model JSON.
    
    Args:
        model (str): Model identifier (case-insensitive).
        field (str): Field name in the JSON to retrieve.
        label (str, optional): Friendly label for error messages. Defaults to `field`.

    Returns:
        Value from the lookup for the given model and field.

    Raises:
        ValueError: If the model or field is not found.
    """
    model_key = model.upper()
    label = label or field
    try:
        return lookup_str_model[model_key][field]
    except KeyError:
        raise ValueError(f"Unknown model or missing field: {label} for model '{model}'")

#####
# Sigma Five Reel
#####
def get_sigma_five_specs(feed_model: str, field: str, label: str = None):
    """
    Args:
        feed_model (str): Model identifier (case-insensitive).
        label (str, optional): Friendly label for error messages. Defaults to `feed_model`.

    Returns:
        Dictionary of specifications for the given feed model.
    """
    feed_model_key = feed_model.upper()
    label = label or feed_model
    try:
        return lookup_sigma5_feed[feed_model_key][field]
    except KeyError:
        raise ValueError(f"Unknown model or missing field: {label} for model '{feed_model}'")

def get_sigma_five_pt_specs(feed_model: str, field: str, label: str = None):
    """
    Args:
        feed_model (str): Model identifier (case-insensitive).
        label (str, optional): Friendly label for error messages. Defaults to `feed_model`.

    Returns:
        Dictionary of specifications for the given feed model.
    """
    feed_model_key = feed_model.upper()
    label = label or feed_model
    try:
        return lookup_sigma5_feed_pt[feed_model_key][field]
    except KeyError:
        raise ValueError(f"Unknown model or missing field: {label} for model '{feed_model}'")
    
def get_ab_feed_specs(feed_model: str, field: str, label: str = None):
    """
    Args:
        feed_model (str): Model identifier (case-insensitive).
        label (str, optional): Friendly label for error messages. Defaults to `feed_model`.

    Returns:
        Dictionary of specifications for the given feed model.
    """
    feed_model_key = feed_model.upper()
    label = label or feed_model
    try:
        return lookup_ab_feed[feed_model_key][field]
    except KeyError:
        raise ValueError(f"Unknown model or missing field: {label} for model '{feed_model}'")
    
# Selected Str used
def get_selected_str_used(type_of_line: str) -> str:
    """
    Return the selected STR used based on the type of line.
    
    Args:
        type_of_line (str): Type of line.

    Returns:
        str: Selected STR used.
    """
    try:
        return lookup_type_of_line[type_of_line]["str_used"]
    except KeyError:
        raise ValueError(f"Unknown type of line: {type_of_line}")