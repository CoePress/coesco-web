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

def get_valid_cylinder_options(model: str, hold_down_assy: str) -> list:
    """Get valid cylinder options for a given model and holddown assembly."""
    try:
        hold_down_family = lookup_model_families[model]["holddown_family"]
        holddown_sort = lookup_holddown_sort[hold_down_assy]["sort"]
    except KeyError:
        return []
    
    # Find all valid combinations for this model/assembly
    prefix = f"{hold_down_family}+{holddown_sort}+{hold_down_assy}+"
    valid_cylinders = []
    
    for entry in lookup_holddown_matrix:
        if entry["key"].startswith(prefix):
            cylinder = entry["key"].split('+')[-1]
            if cylinder not in valid_cylinders:
                valid_cylinders.append(cylinder)
    
    return valid_cylinders

def get_fallback_cylinder(model: str, hold_down_assy: str, preferred_cylinder: str = None) -> str:
    """Get a fallback cylinder option when the preferred one is not available."""
    valid_options = get_valid_cylinder_options(model, hold_down_assy)
    
    if not valid_options:
        return None
        
    # If preferred cylinder is valid, return it
    if preferred_cylinder and preferred_cylinder in valid_options:
        return preferred_cylinder
    
    # Fallback priority: Hydraulic > Air > others
    fallback_priority = ["Hydraulic", "Air", "8in Air", "5in Air", "4in Air"]
    
    for fallback in fallback_priority:
        if fallback in valid_options:
            return fallback
    
    # Return first available option if no priority match
    return valid_options[0] if valid_options else None

## Reel Models
def get_reel_models():
    """Return a list of available reel models."""
    return list(lookup_reel_dimensions.keys())

## Hold Down Assemblies
def get_hold_down_assys():
    """Return a list of available hold down assemblies."""
    return list(lookup_holddown_sort.keys())

## Cylinders
def get_cylinders():
    """Return a list of available cylinders."""
    # If you have a lookup for cylinders, use it; otherwise, extract from holddown_matrix or another source
    cylinders = set()
    for entry in lookup_holddown_matrix:
        # Assuming cylinder is the last part of the key
        key_parts = entry["key"].split("+")
        if len(key_parts) >= 4:
            cylinders.add(key_parts[-1])
    return sorted(cylinders)

## Brake Models
def get_brake_models():
    """Return a list of available brake models."""
    return list(lookup_brake_type.keys())

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
    # Input validation
    if not model or not model.strip():
        raise ValueError(f"Model cannot be empty")
    if not hold_down_assy or not hold_down_assy.strip():
        raise ValueError(f"Hold down assembly cannot be empty")
    if not cylinder or not cylinder.strip():
        raise ValueError(f"Cylinder type cannot be empty")
    
    # Clean inputs
    model = model.strip()
    hold_down_assy = hold_down_assy.strip()
    cylinder = cylinder.strip()
    
    try:
        hold_down_family = lookup_model_families[model]["holddown_family"]
    except KeyError:
        available_models = list(lookup_model_families.keys())[:10]  # First 10 for brevity
        raise ValueError(f"Unknown model '{model}'. Available models include: {available_models}")

    try:
        holddown_sort = lookup_holddown_sort[hold_down_assy]["sort"]
    except KeyError:
        available_assemblies = list(lookup_holddown_sort.keys())
        raise ValueError(f"Unknown holddown assembly '{hold_down_assy}'. Available assemblies: {available_assemblies}")

    matrix_key = f"{hold_down_family}+{holddown_sort}+{hold_down_assy}+{cylinder}"
    
    # Validate that the constructed key exists in the matrix
    if not any(entry["key"] == matrix_key for entry in lookup_holddown_matrix):
        # Find valid cylinder options for this model/assembly combo
        valid_keys = [entry["key"] for entry in lookup_holddown_matrix 
                     if entry["key"].startswith(f"{hold_down_family}+{holddown_sort}+{hold_down_assy}+")]
        if valid_keys:
            valid_cylinders = [key.split('+')[-1] for key in valid_keys]
            raise ValueError(f"Invalid combination: Model '{model}', Assembly '{hold_down_assy}', Cylinder '{cylinder}'. Valid cylinder options for this combination: {valid_cylinders}")
        else:
            raise ValueError(f"No valid combinations found for Model '{model}' with Assembly '{hold_down_assy}'")
    
    return matrix_key

## Pressure PSI
def get_pressure_psi(holddown_matrix_key: str, air_pressure: float) -> float:
    """Return pressure psi based off Holddown Matrix Key"""
    holddown_matrix = next(
    (entry for entry in lookup_holddown_matrix if entry["key"] == holddown_matrix_key),
    None  # default if not found
    )
    if holddown_matrix is None:
        # Get available keys for debugging
        available_keys = [entry["key"] for entry in lookup_holddown_matrix]
        similar_keys = [key for key in available_keys if holddown_matrix_key.split('+')[0] in key][:5]
        
        error_msg = f"Holddown matrix key '{holddown_matrix_key}' not found. "
        if similar_keys:
            error_msg += f"Similar available keys: {similar_keys}"
        else:
            error_msg += f"Total available keys: {len(available_keys)}"
        raise ValueError(error_msg)

    pressure_label = holddown_matrix["PressureLabel"]
    max_psi = holddown_matrix["MaxPSI"]
    psi = holddown_matrix["PSI"]

    if "psi Air" in pressure_label:
        return min(air_pressure, max_psi)
    else:
        return psi

## Holddown Force Available
def get_holddown_force_available(holddown_matrix_key: str, holddown_pressure: float) -> float:
    """Return Force Factor based off Holddown Matrix Key"""
    holddown_matrix = next(
        (entry for entry in lookup_holddown_matrix if entry["key"] == holddown_matrix_key),
        None  # default if not found
    )
    if holddown_matrix is None:
        # Get available keys for debugging
        available_keys = [entry["key"] for entry in lookup_holddown_matrix]
        similar_keys = [key for key in available_keys if holddown_matrix_key.split('+')[0] in key][:5]
        
        error_msg = f"Holddown matrix key '{holddown_matrix_key}' not found. "
        if similar_keys:
            error_msg += f"Similar available keys: {similar_keys}"
        else:
            error_msg += f"Total available keys: {len(available_keys)}"
        raise ValueError(error_msg)

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
        # Get available keys for debugging
        available_keys = [entry["key"] for entry in lookup_holddown_matrix]
        similar_keys = [key for key in available_keys if holddown_matrix_key.split('+')[0] in key][:5]
        
        error_msg = f"Holddown matrix key '{holddown_matrix_key}' not found. "
        if similar_keys:
            error_msg += f"Similar available keys: {similar_keys}"
        else:
            error_msg += f"Total available keys: {len(available_keys)}"
        raise ValueError(error_msg)

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
        # Try to find a fallback for None hydraulic drives
        if drive_key.endswith("+None"):
            # Look for any key with the same prefix
            prefix = drive_key.rsplit("+", 1)[0] + "+"
            fallback_keys = [key for key in lookup_drive_torque.keys() if key.startswith(prefix)]
            if fallback_keys:
                # Use the first available fallback
                fallback_key = fallback_keys[0]
                return lookup_drive_torque[fallback_key]["torque"]
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
    import sys
    import sys
    model_key = model.upper()
    label = label or field
    
    print(f"STR MODEL LOOKUP - model: {model}, model_key: {model_key}, field: {field}", file=sys.stderr)
    print(f"STR MODEL LOOKUP - available models: {list(lookup_str_model.keys())}", file=sys.stderr)
    
    try:
        result = lookup_str_model[model_key][field]
        print(f"STR MODEL LOOKUP - found {field}: {result}", file=sys.stderr)
        return result
    except KeyError as e:
        print(f"STR MODEL LOOKUP - KeyError: {e}", file=sys.stderr)
        if model_key not in lookup_str_model:
            print(f"STR MODEL LOOKUP - Model {model_key} not found in lookup table", file=sys.stderr)
            raise ValueError(f"Unknown model: {label} for model '{model}'")
        elif field not in lookup_str_model[model_key]:
            print(f"STR MODEL LOOKUP - Field {field} not found for model {model_key}", file=sys.stderr)
            print(f"STR MODEL LOOKUP - Available fields for {model_key}: {list(lookup_str_model[model_key].keys())}", file=sys.stderr)
            raise ValueError(f"Unknown field: {label} for model '{model}'")
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