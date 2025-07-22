"""
Inertia utilities for physics-based calculations.

"""
from models import inertia_input
from math import pi

import json
import os

# Build absolute paths to each JSON file
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SIGMA_FIVE_FILE = os.path.join(_BASE_DIR, "sigma_five_feed_model_config.json")
SIGMA_FIVE_PT_FILE = os.path.join(_BASE_DIR, "sigma_five_feed_w_pullthru_model_config.json")
AB_FEED_FILE = os.path.join(_BASE_DIR, "allen_bradley_model_config.json")

# Load each JSON separately
with open(SIGMA_FIVE_FILE, "r") as f:
    feed_model_lookup = json.load(f)

with open(SIGMA_FIVE_PT_FILE, "r") as f:
    feed_model_pt_lookup = json.load(f)

with open(AB_FEED_FILE, "r") as f:
    allen_bradley_lookup = json.load(f)

def calculate_length(width: float, feed_model: str, roll_width: str, element: str, e_data: dict) -> float:
    """
    Calculate the length of a component based on model, roll width, and element type.
    
    Args:
        width (float): Width of the component.
        feed_model (str): The model of the feed system.
        roll_width (str): Indicates if the roll width is used ('y' or 'n').
        element (str): The specific element type to calculate length for.
        e_data (dict): Additional data for the element, including default length.

    Returns:
        float: Calculated length based on the provided parameters.

    Raises:
        ValueError: If width is less than or equal to zero.
        HTTPException: If an error occurs during calculations.
    
    """
    if width < 0:
        raise ValueError("Width must be greater than zero")

    model = feed_model.upper()
    roll_flag = roll_width.lower() in ("y", "yes")
    default_length = e_data.get("length", 0)

    def in_model(*keys):
        return any(k in model for k in keys)

    def from_lookup(table):
        return table.get(element, default_length)

    # Models S1, S2
    if in_model("S1", "S2"):
        return from_lookup({
            "u_roll": width + 0.75,
            "l_roll": width + 2.5,
            "s_roll": width + 1.75,
            "sp_roll": width + 1.75
        })

    # Models S3, S4, S5
    if in_model("S3", "S4", "S5"):
        if roll_flag:
            if element in ("u_roll", "u_roll_contact", "u_roll_1"):
                if in_model("S5"):
                    return width + 1.725
                else:
                    return width + 1.99
            elif "l_roll" in element or "l_roll_contact" in element or "l_roll_1" in element or "l_roll_2" in element:
                if "_1" in element or element == "l_roll" or element == "l_roll_contact":
                    return width + (1 if "S5" in model else 0.5)
                else:
                    return {
                        "S3": 6.14,
                        "S4": 4.24
                    }.get(next((m for m in ["S3", "S4"] if m in model), ""), 4.92)
            elif element == "u_tappered_port":
                return default_length
            elif element == "l_tappered_port":
                return {
                    "S3": 6.14,
                    "S4": 4.24,
                    "S5": 3.906
                }.get(next((m for m in ["S3", "S4", "S5"] if m in model), ""), default_length)
            elif element in ("s_roll", "sp_roll"):
                return width + (1.75 if "S3" in model else 1.625)
        else:
            if element in ("u_roll", "l_roll", "u_roll_contact", "l_roll_contact"):
                return width * 0.5
            elif element == "u_roll_2":
                if "S3" in model:
                    return width * 0.5
                elif "S4" in model:
                    return 4.74 + width * 0.5
                elif "S5" in model:
                    return (width + 5.92) - (width * 0.5)
                else:
                    return default_length
            elif element == "u_tappered_port":
                return width * 0.5 + 1.99
            elif element == "l_tappered_port":
                return width * 0.5 + {
                    "S3": 0,
                    "S4": 4.74,
                    "S5": 5.657
                }.get(next((m for m in ["S3", "S4", "S5"] if m in model), ""), 0)
            elif element in ("s_roll", "sp_roll"):
                return width + (1.75 if "S3" in model else 1.625)

    # Models S6, S7, S8
    if in_model("S6", "S7", "S8"):
        if roll_flag:
            return from_lookup({
                "u_roll_1": width + 1.725,
                "l_roll_1": width + 1,
                "u_roll_2": default_length,
                "l_roll_2": 4.92,
                "s_roll": width + 1.625,
                "sp_roll": width + 1.625
            })
        else:
            return from_lookup({
                "u_roll": width * 0.5,
                "l_roll": width * 0.5,
                "u_roll_2": (width + 1.1725) - (width * 0.5),
                "l_roll_2": (width + 5.92) - (width * 0.5),
                "s_roll": width + 1.625,
                "sp_roll": width + 1.625
            })

    # Fallback
    return default_length


def calculate_lbs(o_dia: float, i_dia: float, length: float, density: float, qty: int):
    """
    Calculate weight in lbs for given parameters.
    """
    return ((pi * length * density / 4) * (o_dia ** 2 - i_dia ** 2)) * qty

def calculate_inertia(lbs: float, o_dia: float, i_dia: float):
    """
    Calculate inertia for given parameters.
    """
    return ((lbs / 386.4) * (o_dia ** 2 + i_dia ** 2)) / 8

def compute_refl_inertia(data: inertia_input, qty: int = 1, length: float = 0, o_dia: float = 0, i_dia: float = 0, density: float = 0, ratio: float = 0):
    """
    Calculate reflected inertia for a given feed model.
    """
    try:
        if ratio == 0: ratio = data.ratio

        lbs = calculate_lbs(o_dia, i_dia, length, density, qty)
        inertia = calculate_inertia(lbs, o_dia, i_dia)

        return inertia / (ratio ** 2)
    except ValueError:
        raise ValueError("Invalid feed model")

def calculate_total_refl_inertia(data: inertia_input):
    try:
        if data.feed_model in feed_model_lookup:
            feed_data = feed_model_lookup[data.feed_model]
        elif data.feed_model in feed_model_pt_lookup:
            feed_data = feed_model_pt_lookup[data.feed_model]
        elif data.feed_model in allen_bradley_lookup:
            feed_data = allen_bradley_lookup[data.feed_model]
        else:
            raise ValueError(f"Unknown feed model: {data.feed_model}")
        results = 0.0

        if not isinstance(feed_data, dict):
            raise ValueError(f"Expected feed_data to be a dict, got {type(feed_data).__name__}")
        
        # Feed model refl inertia
        for element_name, element_data in feed_data.items():
            len = calculate_length(data.width, data.feed_model, data.roll_width, element_name, element_data)
            
            if "S6" in data.feed_model or "S7" in data.feed_model or "S8" in data.feed_model:
                if "u_roll_1" in element_name:
                    material_dia = element_data["o_dia"]
            else:
                if "u_roll" in element_name:
                    material_dia = element_data["o_dia"]

            qty = element_data.get("qty", 1)

            # Gearbox refl inertia
            if "g_box" in element_name:
                if element_data["qty"] > 0:
                    refl = (element_data["qty"] * element_data["inertia"])
                    results += refl
            else:
                if element_data["ratio"] == 0:
                    if element_name == "s_roll" or element_name == "sp_roll":
                        ratio = (feed_data[element_name]["o_dia"] / feed_data["u_roll_1"]["o_dia"]) * data.ratio
                    else:
                        ratio = data.ratio
                else:
                    ratio = element_data["ratio"]

                refl = compute_refl_inertia(data, qty, len, element_data["o_dia"], element_data["i_dia"], element_data["density"],ratio)
                results += refl

        # Material refl inertia
        material_inertia = ((data.material_width * data.thickness * data.press_bed_length * data.density) / 32.3) * (((material_dia * 0.5) ** 2) / 144) * 12
        refl = (material_inertia / (data.ratio ** 2))
        results += refl

        return results
    except:
        return "ERROR: Inertia calculations failed to save."
    