"""
Feed Controls Mapping Utility for Backend

Maps controls levels to appropriate feed control types and feed models.
"""

def map_controls_level_to_feed_controls(controls_level: str) -> str:
    """
    Maps controls level to appropriate feed controls value.
    
    Args:
        controls_level (str): The selected controls level
        
    Returns:
        str: The appropriate feed controls value
    """
    mapping = {
        "Allen Bradley Basic": "Allen Bradley MPL Feed",
        "Allen Bradley Plus": "Allen Bradley MPL Feed Plus",
        "SyncMaster": "Sigma 5 Feed",
        "SyncMaster Plus": "Sigma 5 Feed Plus",
        "IP Indexer Basic": "IP Indexer Feed",
        "IP Indexer Plus": "IP Indexer Feed Plus",
        "Fully Automatic": "Fully Automatic Feed System",
        "Mini-Drive System": "Mini-Drive Feed",
        "Relay Machine": "Relay Feed System",
    }
    
    return mapping.get(controls_level, "Sigma 5 Feed")  # Default to Sigma 5 Feed

def get_feed_type_from_controls_level(controls_level: str) -> str:
    """
    Determines feed type based on controls level.
    
    Args:
        controls_level (str): The selected controls level
        
    Returns:
        str: The feed type ("allen_bradley" or "sigma_five")
    """
    allen_bradley_controls = [
        "Allen Bradley Basic",
        "Allen Bradley Plus"
    ]
    
    if controls_level in allen_bradley_controls:
        return "allen_bradley"
    else:
        return "sigma_five"

def should_use_advanced_features(controls_level: str) -> bool:
    """
    Determines if advanced feed features should be enabled.
    
    Args:
        controls_level (str): The selected controls level
        
    Returns:
        bool: True if advanced features should be enabled
    """
    advanced_controls = [
        "Allen Bradley Plus",
        "SyncMaster Plus", 
        "IP Indexer Plus",
        "Fully Automatic"
    ]
    
    return controls_level in advanced_controls

def get_default_feed_model_for_controls(controls_level: str) -> str:
    """
    Gets the default feed model based on controls level.
    
    Args:
        controls_level (str): The selected controls level
        
    Returns:
        str: Default feed model
    """
    feed_type = get_feed_type_from_controls_level(controls_level)
    
    if feed_type == "allen_bradley":
        return "CPRF-S5 MPL"  # Default Allen Bradley model
    else:
        return "CPRF-S5"  # Default Sigma 5 model
