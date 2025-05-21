import os
import csv
import psycopg2
import glob
from pathlib import Path

db_host = input("Database host: ") or "localhost"
db_name = input("Database name: ") or "quote_copy"
db_user = input("Database user: ") or "postgres"
db_pass = input("Database password: ") or "password"
db_port = input("Database port (5432): ") or "5432"
csv_dir = input("Directory with CSV files: ") or "C:\\Users\\jar\\Desktop\\temp"

conn = psycopg2.connect(
    host=db_host,
    database=db_name,
    user=db_user,
    password=db_pass,
    port=db_port
)
cursor = conn.cursor()




csv_files = glob.glob(os.path.join(csv_dir, "*.csv"))
print(f"Found {len(csv_files)} CSV files")

for csv_file in csv_files:
    table_name = Path(csv_file).stem.lower()
    print(f"Importing: {csv_file} -> {table_name}")
    
    cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = %s ORDER BY ordinal_position", (table_name,))
    columns = [col[0] for col in cursor.fetchall()]
    
    if not columns:
        print(f"Table {table_name} not found or has no columns. Skipping.")
        continue
    
    with open(csv_file, 'r', newline='') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        
        if header:
            header = [h.lower().replace('-', '_') for h in header]
            cols_to_use = [h for h in header if h in columns]
            
            if not cols_to_use:
                print(f"No matching columns in {csv_file}. Skipping.")
                continue
        else:
            cols_to_use = columns[:len(next(reader))]
            f.seek(0)
        
        col_str = ", ".join(cols_to_use)
        placeholders = ", ".join(["%s"] * len(cols_to_use))
        insert_query = f"INSERT INTO {table_name} ({col_str}) VALUES ({placeholders})"
        
        rows = []
        for row in reader:
            if not row:
                continue
            
            if header:
                row_data = []
                for col in cols_to_use:
                    idx = header.index(col)
                    val = row[idx] if idx < len(row) else None
                    
                    if val and col in ['ismaxthick', 'isstd']:
                        if val.lower() in ['std', 'max', 'yes', 'true']:
                            val = True
                        elif val.lower() in ['opt', 'min', 'no', 'false']:
                            val = False
                    
                    row_data.append(val if val else None)
            else:
                row_data = []
                for i, val in enumerate(row[:len(cols_to_use)]):
                    col = cols_to_use[i]
                    
                    if val and col in ['ismaxthick', 'isstd']:
                        if val.lower() in ['std', 'max', 'yes', 'true']:
                            val = True
                        elif val.lower() in ['opt', 'min', 'no', 'false']:
                            val = False
                    
                    row_data.append(val if val else None)
            
            rows.append(row_data)
            
            if len(rows) >= 1000:
                cursor.executemany(insert_query, rows)
                conn.commit()
                print(f"  Inserted {len(rows)} rows")
                rows = []
        
        if rows:
            cursor.executemany(insert_query, rows)
            conn.commit()
            print(f"  Inserted {len(rows)} rows")

cursor.close()
conn.close()
print("Import complete!")