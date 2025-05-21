import os
import psycopg2
import glob
import json
from pathlib import Path
import pandas as pd
import logging
from datetime import datetime

# Setup logging
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)
log_file = log_dir / f"sync_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

def try_read_csv(file_path):
    encodings = ['utf-8', 'latin1', 'cp1252', 'iso-8859-1']
    last_error = None
    
    for encoding in encodings:
        try:
            logging.info(f"Attempting to read {file_path} with {encoding} encoding")
            df = pd.read_csv(file_path, encoding=encoding, on_bad_lines='warn')
            logging.info(f"Successfully read file with {encoding} encoding")
            return df
        except UnicodeDecodeError as e:
            last_error = e
            logging.warning(f"Failed to read with {encoding} encoding: {str(e)}")
            continue
        except Exception as e:
            last_error = e
            logging.error(f"Unexpected error reading file: {str(e)}")
            raise
    
    raise last_error or Exception("Failed to read CSV file with any encoding")

# Database connection
try:
    db_host = input("Database host: ") or "localhost"
    db_name = input("Database name: ") or "quote_copy"
    db_user = input("Database user: ") or "postgres"
    db_pass = input("Database password: ") or "password"
    db_port = input("Database port (5432): ") or "5432"
    csv_dir = input("Directory with CSV files: ") or "C:\\Users\\jar\\Desktop\\quote"

    logging.info(f"Connecting to database {db_name} on {db_host}")
    conn = psycopg2.connect(
        host=db_host,
        database=db_name,
        user=db_user,
        password=db_pass,
        port=db_port
    )
    cursor = conn.cursor()
    logging.info("Database connection successful")

    csv_files = glob.glob(os.path.join(csv_dir, "*.csv"))
    logging.info(f"Found {len(csv_files)} CSV files")

    for csv_file in csv_files:
        table_name = Path(csv_file).stem.lower()
        logging.info(f"Processing: {csv_file} -> {table_name}")
        
        try:
            cursor.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_name = %s ORDER BY ordinal_position", 
                (table_name,)
            )
            columns = [col[0] for col in cursor.fetchall()]
            
            if not columns:
                logging.warning(f"Table {table_name} not found or has no columns. Skipping.")
                continue
            
            # Read CSV with pandas
            df = try_read_csv(csv_file)
            
            # Convert column names to lowercase and replace hyphens with underscores
            df.columns = [col.lower().replace('-', '_') for col in df.columns]
            
            # Filter columns to only those that exist in the database
            cols_to_use = [col for col in df.columns if col in columns]
            
            if not cols_to_use:
                logging.warning(f"No matching columns in {csv_file}. Skipping.")
                continue
            
            # Select only the columns we need
            df = df[cols_to_use]
            
            # Handle array values (columns containing @%)
            for col in df.columns:
                if df[col].dtype == 'object':  # Only process string columns
                    df[col] = df[col].apply(
                        lambda x: json.dumps([v.strip() for v in str(x).split("@%") if v.strip() != "?"])
                        if pd.notna(x) and '@%' in str(x) else x
                    )
            
            # Replace '?' with None
            df = df.replace('?', None)
            
            # Convert DataFrame to list of tuples for insertion
            rows = df.values.tolist()
            
            # Prepare insert query
            col_str = ", ".join(cols_to_use)
            placeholders = ", ".join(["%s"] * len(cols_to_use))
            insert_query = f"INSERT INTO {table_name} ({col_str}) VALUES ({placeholders})"
            
            # Insert in batches of 1000
            batch_size = 1000
            total_rows = 0
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i + batch_size]
                cursor.executemany(insert_query, batch)
                conn.commit()
                total_rows += len(batch)
                logging.info(f"  Inserted {len(batch)} rows (Total: {total_rows})")
            
            logging.info(f"Successfully imported {total_rows} rows into {table_name}")
            
        except Exception as e:
            logging.error(f"Error processing {csv_file}: {str(e)}")
            conn.rollback()
            continue

except Exception as e:
    logging.error(f"Fatal error: {str(e)}")
    raise
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
    logging.info("Import process completed")