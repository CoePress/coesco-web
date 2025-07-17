import json
import sys
from typing import Any, Dict

def process_json_data(data: Dict[str, Any]) -> None:
    print(f"Processing JSON data with {len(data)} keys:")
    for key, value in data.items():
        print(f"  {key}: {value}")

def main():
    try:
        if len(sys.argv) > 1:
            json_string = sys.argv[1]
            data = json.loads(json_string)
        else:
            if not sys.stdin.isatty():
                json_string = sys.stdin.read().strip()
                if not json_string:
                    raise ValueError("No JSON data provided")
                data = json.loads(json_string)
            else:
                raise ValueError("No JSON data provided. Please provide JSON data via stdin or command line argument")
        
        process_json_data(data)
        
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format - {e}")
        sys.exit(1)
    except ValueError as e:
        print(f"Error: {e}")
        print("Usage examples:")
        print("  echo '{\"name\": \"John\", \"age\": 30}' | python example-script.py")
        print("  python example-script.py '{\"name\": \"John\", \"age\": 30}'")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()