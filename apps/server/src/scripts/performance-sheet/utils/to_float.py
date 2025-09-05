def to_float(val):
    try:
        if isinstance(val, str) and val.strip() != "":
            return float(val)
        elif isinstance(val, (int, float)):
            return float(val)
    except Exception as e:
        print(f"Could not convert value to float: {val} ({e})")
    return None