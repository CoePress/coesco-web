import pandas as pd
import re
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).parent.absolute()

FILE_PATH = WORKSPACE_ROOT / "tools.csv"
STEPS_DIR = WORKSPACE_ROOT / "steps"
OUTPUT_PATH = WORKSPACE_ROOT / "tools_1.csv"

COLUMN_NAME = "tool_description"
NEW_COLUMN_NAME = "tool_description_1"

def log_changes(step_number, step_name, before_values, df, column_name, previous_unique_count):
    current_unique_count = df[column_name].nunique()
    reduction = previous_unique_count - current_unique_count
    reduction_pct = (reduction / previous_unique_count * 100) if previous_unique_count > 0 else 0
    
    print(f"After {step_name}: {current_unique_count} unique values (-{reduction}, {reduction_pct:.2f}%)")
    
    changes = set()
    for i, row in df.iterrows():
        original = before_values.iloc[i]
        cleaned = row[column_name]
        if cleaned != original:
            changes.add(f"OG: '{original}'\nCL: '{cleaned}'\n")
    
    safe_name = step_name.lower().replace(' ', '_').replace('/', '_').replace('\\', '_')
    filename = f"{step_number}_{safe_name}.txt"
    
    with open(STEPS_DIR / filename, "w", encoding="utf-8") as f:
        f.write(f"{step_name.upper()} (Total: {len(changes)})\n")
        f.write("=" * 50 + "\n")
        for item in sorted(changes):
            f.write(item + "\n")
            
    return current_unique_count

def apply_regex_clean(df, column_name, pattern, replacement=""):
    """
    Applies a regex substitution to a DataFrame column, ensuring string input.
    """
    def safe_sub(x):
        # Ensure input is a string for regex operations
        if not isinstance(x, str):
            x = str(x) if pd.notnull(x) else ""
        return re.sub(r'\s+', ' ', re.sub(pattern, replacement, x)).strip()
    df[column_name] = df[column_name].apply(safe_sub)
    return df

def remove_op_codes(df, column_name):
    before_values = df[column_name].copy()
    op_pattern = r'\bOP\s*\.?\s*\d+\b'
    df = apply_regex_clean(df, column_name, op_pattern)
    return df, before_values

def remove_bg_codes(df, column_name):
    before_values = df[column_name].copy()
    code_pattern = r'\b[BDHGM]\d+\b'
    df = apply_regex_clean(df, column_name, code_pattern)
    return df, before_values

def remove_quoted_letters(df, column_name):
    before_values = df[column_name].copy()
    def remove_quoted_letters_selectively(text):
        if not isinstance(text, str):
            text = str(text) if pd.notnull(text) else ""
        text = re.sub(r'"[A-Za-z]"\s+HOLES\b', '', text)
        text = re.sub(r'"[A-Za-z]"$', '', text)
        return re.sub(r'\s+', ' ', text).strip()
    df[column_name] = df[column_name].apply(remove_quoted_letters_selectively)
    return df, before_values

def remove_asterisks(df, column_name):
    before_values = df[column_name].copy()
    def remove_asterisk_content(text):
        if not isinstance(text, str):
            text = str(text) if pd.notnull(text) else ""
        text_cleaned = re.sub(r'\*\*.*?\*\*', '', text)
        text_cleaned = re.sub(r'\*.*?\*', '', text_cleaned)
        text_cleaned = re.sub(r'\*+', '', text_cleaned)
        return re.sub(r'\s+', ' ', text_cleaned).strip()
    df[column_name] = df[column_name].apply(remove_asterisk_content)
    return df, before_values

def standardize_terms(df, column_name):
    before_values = df[column_name].copy()
    def apply_standardization(text):
        if not isinstance(text, str):
            text = str(text) if pd.notnull(text) else ""
        # Diameter ranges   
        text = re.sub(r'(\d+\.\d+)\s*[-/]\s*(\d+\.\d+)', r'\1 - \2', text)
        
        # For clauses
        text = re.sub(r'\bFOR\b.*$', '', text).strip()

        # To clauses
        text = re.sub(r'\bTO\b.*$', '', text).strip()
        
        # Commas
        text = text.replace(',', ' ')
        
        # Quotes
        text = re.sub(r'"([A-Za-z])"', r'\1', text)
        
        # Abbreviations
        replacements = [
            (r'H\.S\.S\.?|H\.S\.S\b', 'HSS'),
            (r'S\.F\.?|S\.F\b', 'SLIP FIT'),
            (r'(\d+/\d+)"|(\.\d+)"\.?|(\.\d+)"', r'\1\2\3'),
            (r'\bDIA\.\s*|\bDIA\b\s*|\bDIAMETER\b\s*', ''),
            (r'\bDEG\.?\b|\bDEGREE\.', 'DEGREE'),
            (r'\bLETTER\b\s*', ''),
            (r'\bCARB\.\s+|\bCARB\.(?!\s)|\bCARB\b(?!IDE)', 'CARBIDE '),
            (r'\bCARBIDE(?! $|\s)', 'CARBIDE '),
        ]
        
        for pattern, replacement in replacements:
            text = re.sub(pattern, replacement, text)
        
        # End mill variations
        end_mill_patterns = [
            (r'\bE/MILL\b', 'END MILL'),
            (r'\bE/M\b', 'END MILL'),
            (r'\bE-MILL\b', 'END MILL'),
            (r'\bEM\b', 'END MILL'),
            (r'\bENDMILL\b', 'END MILL'),
            (r'\bE\.M\.\b', 'END MILL'),
            (r'\bE\.M\b', 'END MILL'),
            (r'\bE/MILLS\b', 'END MILL'),
            (r'\bEND\s*MILLS?\b', 'END MILL')
        ]
        
        for pattern, replacement in end_mill_patterns:
            text = re.sub(pattern, replacement, text)
            
        
        # Other tool terms
        tool_replacements = [
            (r'\bFACEMILL\b', 'FACE MILL'),
            (r'\bBORE BAR\b|\bBOR BAR\b|\bBOR\b|\bBORE\b|\bB\.BAR\b', 'BORING BAR'),
            (r"\bC\'DRILL\b", 'CENTER DRILL'),
            (r"\bC\"DRILL\b", 'CENTER DRILL'),
            (r"\bC\.DRILL\b", 'CENTER DRILL'),
            (r"\bC\-DRILL\b", 'CENTER DRILL'),
            (r"\bCENTERDRILL\b", 'CENTER DRILL'),
            (r"\bDRL\b", 'DRILL'),
            (r"\bDRIL\b", 'DRILL'),
            (r"\bDRLL\b", 'DRILL'),
            (r"\bDRILLL\b", 'DRILL'),
        ]
        
        for pattern, replacement in tool_replacements:
            text = re.sub(pattern, replacement, text)
        
        # Fix spacing for numbers
        text = re.sub(r'#\s+(\d+)', r'#\1', text)
        
        # Remove unbalanced parentheses
        while True:
            old_text = text
            text = re.sub(r'\([^\(\)]*$', '', text)
            text = re.sub(r'^[^\(\)]*\)', '', text)
            if old_text == text:
                break
        
        # Clean up extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove trailing periods and hyphens
        text = re.sub(r'[.-]+$', '', text).strip()
        
        return text
    
    df[column_name] = df[column_name].apply(apply_standardization)
    return df, before_values

def final_cleanup(df, column_name):
    before_values = df[column_name].copy()
    def clean_text(text):
        if not isinstance(text, str):
            text = str(text) if pd.notnull(text) else ""
        # Remove leading/trailing punctuation and symbols
        text = re.sub(r'^[\.\-\/"\'@ ]+', '', text)
        text = re.sub(r'[\.\-\/"\'@ ]+$', '', text)
        # Remove double/trailing quotes anywhere
        text = re.sub(r'"+', '', text)
        text = re.sub(r"'+", '', text)
        # Remove trailing slashes
        text = re.sub(r'/+$', '', text)
        # Remove leading dot/dash before numbers (not negative numbers)
        text = re.sub(r'(?<!\d)[\.\-](\d)', r'\1', text)
        # Remove redundant @ symbols
        text = re.sub(r'@+', '', text)
        # Remove trailing periods
        text = re.sub(r'\.+$', '', text)
        # Remove trailing hyphens
        text = re.sub(r'\-+$', '', text)
        # Remove empty quotes
        text = re.sub(r'""', '', text)
        # Remove extra spaces
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    df[column_name] = df[column_name].apply(clean_text)
    return df, before_values

def clean_tool_descriptions(df, column_name, cleaning_steps):
    """
    Apply a sequence of cleaning steps to the specified column in the DataFrame.
    Each step is a tuple: (function, step_name)
    """
    STEPS_DIR.mkdir(exist_ok=True)
    df_cleaned = df.copy()
    working_column = NEW_COLUMN_NAME
    # Ensure column exists and is string
    if column_name not in df_cleaned.columns:
        raise ValueError(f"Column '{column_name}' not found in DataFrame.")
    df_cleaned[working_column] = df_cleaned[column_name].fillna('').astype(str).apply(lambda x: re.sub(r'\s+', ' ', x).strip())
    initial_unique = df_cleaned[working_column].nunique()
    print(f"Initial unique: {initial_unique}")

    previous_unique_count = initial_unique
    for i, (step_func, step_name) in enumerate(cleaning_steps, 1):
        df_cleaned, before_values = step_func(df_cleaned, working_column)
        previous_unique_count = log_changes(i, step_name, before_values, df_cleaned, working_column, previous_unique_count)

    total_reduction = initial_unique - previous_unique_count
    total_reduction_pct = (total_reduction / initial_unique * 100) if initial_unique > 0 else 0
    print(f"Total reduction: {total_reduction} ({total_reduction_pct:.2f}%)")
    
    unique_values = sorted(df_cleaned[working_column].unique())
    final_unique_count = len(unique_values)
    print(f"\nFinal number of unique descriptions: {final_unique_count}")
    print("=" * 50)
    
    try:
        with open(STEPS_DIR / "6_unique_remaining_values.txt", "w", encoding="utf-8") as f:
            f.write(f"UNIQUE REMAINING VALUES (Total: {len(unique_values)})\n")
            f.write("=" * 50 + "\n")
            for item in unique_values:
                f.write(f"{item}\n")
    except Exception as e:
        print(f"Warning: Could not write unique values file: {e}")
    
    return df_cleaned

# Example: Add new cleaning steps here
CLEANING_STEPS = [
    (remove_op_codes, "Remove OP Codes"),
    (remove_bg_codes, "Remove B/G Codes"),
    (remove_quoted_letters, "Remove Quoted Letters"),
    (remove_asterisks, "Remove Asterisks"),
    (standardize_terms, "Standardize Terms"),
    (final_cleanup, "Final Cleanup"),
]

if __name__ == "__main__":
    try:
        WORKSPACE_ROOT.mkdir(exist_ok=True)
        STEPS_DIR.mkdir(exist_ok=True)
        if not FILE_PATH.exists():
            pd.DataFrame({COLUMN_NAME: []}).to_csv(FILE_PATH, index=False)
            print(f"Created empty file: {FILE_PATH}")
        
        df = pd.read_csv(FILE_PATH)
        # Remove 'count' column if it exists
        if 'count' in df.columns:
            df = df.drop(columns=['count'])
            df.to_csv(FILE_PATH, index=False)  # Overwrite the original file without 'count'
        
        if COLUMN_NAME not in df.columns:
            raise ValueError(f"Input file must contain a '{COLUMN_NAME}' column.")
        
        df_cleaned = clean_tool_descriptions(df, COLUMN_NAME, CLEANING_STEPS)
        
        df_cleaned.to_csv(OUTPUT_PATH, index=False)
        
        print(f"Processing complete. Cleaned data saved to '{OUTPUT_PATH}'")
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())