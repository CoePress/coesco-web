"""
Utility functions for handling JSON files with labeled data.

"""

import json
import os


def append_to_json_list(data: dict, reference_number: str, directory: str = "./outputs") -> str:
    """
    Appends or updates data under a reference-number-named JSON file.

    Args:
        data (dict): The result data to store, with the reference number as the key.
        reference_number (str): Used as the filename.
        directory (str): Target output directory.

    Returns:
        str: Full path to the updated JSON file.
    """
    os.makedirs(directory, exist_ok=True)
    full_path = os.path.join(directory, f"{reference_number}.json")

    if os.path.exists(full_path):
        try:
            with open(full_path, "r") as f:
                content = json.load(f)
        except json.JSONDecodeError:
            content = {}
    else:
        content = {}

    # Expect data to be {reference_number: {...}}
    content.update(data)

    with open(full_path, "w") as f:
        json.dump(content, f, indent=4)

    return full_path


def load_json_list(reference_number: str, directory: str = "./outputs") -> dict:
    """
    Loads the data block from a JSON file named after the reference number.

    Args:
        reference_number (str): Name of the file (without extension).
        directory (str): Directory where the JSON file resides.

    Returns:
        dict: The data section of the JSON, keyed by reference number.

    Raises:
        FileNotFoundError: If the reference JSON does not exist.
        KeyError: If the reference number is not found in the file.
    """
    file_path = os.path.join(directory, f"{reference_number}.json")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File for reference '{reference_number}' not found.")

    with open(file_path, "r") as f:
        content = json.load(f)

    if reference_number not in content:
        raise KeyError(f"Reference '{reference_number}' not found in file '{reference_number}.json'.")

    return {reference_number: content[reference_number]}
