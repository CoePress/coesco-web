import pandas as pd
import numpy as np
from openai import OpenAI
from sklearn.metrics.pairwise import cosine_similarity
from rapidfuzz import process, fuzz
import re
import string
from collections import defaultdict
import time
import csv
import os

# --- CONFIG ---
INPUT_CSV = "tools_1.csv"  # Output from clean.py
OUTPUT_CSV = "tools_2.csv"
MAPPING_CSV = "description_mapping.csv"
OPENAI_API_KEY = "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"
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536
EMBEDDING_THRESHOLD = 0.99  # Adjust as needed
FUZZY_THRESHOLD = 90

COLUMN_NAME = "tool_description_1"
NEW_COLUMN_NAME = "tool_description_2"

# --- LOAD DATA ---
print(f"Loading input CSV: {INPUT_CSV}")
df = pd.read_csv(INPUT_CSV)
print(f"Loaded {len(df)} rows.")
if COLUMN_NAME not in df.columns:
    raise ValueError("Missing 'tool_description_1' column in input.")

def normalize(text):
    if pd.isnull(text):
        return ""
    # Lowercase, remove punctuation, and strip whitespace
    text = str(text).lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = text.strip()
    return text


# --- NORMALIZE DESCRIPTIONS ---
print("Normalizing descriptions...")
df[NEW_COLUMN_NAME] = df[COLUMN_NAME].apply(normalize)
unique_descriptions = df[NEW_COLUMN_NAME].unique().tolist()
descriptions = df[NEW_COLUMN_NAME].tolist()
print(f"Processing {len(unique_descriptions)} unique descriptions.")

# --- GET EMBEDDINGS ---
client = OpenAI(api_key=OPENAI_API_KEY)
EMBEDDINGS_FILE = "embeddings.npy"

def get_embeddings(texts, batch_size=100):
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = [t if isinstance(t, str) and t.strip() else " " for t in texts[i:i+batch_size]]
        print(f"Requesting embeddings for batch {i} to {i+len(batch)-1}...")
        try:
            response = client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=batch
            )
            batch_embeddings = [e.embedding for e in response.data]
            embeddings.extend(batch_embeddings)
            print(f"Received {len(batch_embeddings)} embeddings.")
        except Exception as e:
            print(f"Embedding error: {e}")
            embeddings.extend([[0]*EMBEDDING_DIM]*len(batch))
            print(f"Inserted {len(batch)} zero embeddings due to error.")
            time.sleep(5)
    return np.array(embeddings)

if os.path.exists(EMBEDDINGS_FILE):
    print(f"Loading embeddings from file: {EMBEDDINGS_FILE}")
    embeddings = np.load(EMBEDDINGS_FILE)
    print(f"Loaded embeddings shape: {embeddings.shape}")
else:
    print("Getting embeddings from OpenAI API...")
    t0 = time.time()
    embeddings = get_embeddings(unique_descriptions)
    np.save(EMBEDDINGS_FILE, embeddings)
    print(f"Saved embeddings to {EMBEDDINGS_FILE}")
    print(f"Embedding generation took {time.time() - t0:.2f} seconds.")

embeddings = np.nan_to_num(embeddings)
print(f"Embeddings shape after nan_to_num: {embeddings.shape}")

# --- GROUP BY EMBEDDING SIMILARITY ---
print("Grouping by embedding similarity...")
t0 = time.time()

def group_by_embeddings(embeddings, descriptions, threshold):
    n = len(embeddings)
    visited = set()
    groups = []
    for i in range(n):
        if i in visited:
            continue
        group = [i]
        visited.add(i)
        sims = cosine_similarity([embeddings[i]], embeddings)[0]
        for j in range(n):
            if j != i and j not in visited and sims[j] >= threshold:
                group.append(j)
                visited.add(j)
        groups.append(group)
    return groups

groups = group_by_embeddings(embeddings, unique_descriptions, EMBEDDING_THRESHOLD)
print(f"Formed {len(groups)} groups in {time.time() - t0:.2f} seconds.")

# --- FALLBACK: FUZZY GROUPING FOR LEFTOVERS ---
grouped_indices = set(idx for group in groups for idx in group)
leftover_indices = [i for i in range(len(descriptions)) if i not in grouped_indices]
print(f"{len(leftover_indices)} descriptions left after embedding grouping.")

if leftover_indices:
    print(f"Fuzzy grouping {len(leftover_indices)} leftovers...")
    leftovers = [descriptions[i] for i in leftover_indices]
    fuzzy_groups = []
    used = set()
    for i, desc in enumerate(leftovers):
        if i in used:
            continue
        matches = process.extract(desc, leftovers, scorer=fuzz.ratio, limit=None)
        group = [j for j, (match, score, j) in enumerate(matches) if score >= FUZZY_THRESHOLD and j not in used]
        for j in group:
            used.add(j)
        fuzzy_groups.append([leftover_indices[j] for j in group])
    groups.extend(fuzzy_groups)
    print(f"Fuzzy grouping formed {len(fuzzy_groups)} additional groups.")

# --- CREATE MAPPING ---
print("Creating mapping from groups...")
mapping = {}
for group in groups:
    group_descs = [descriptions[i] for i in group]
    # Pick the most frequent in the original data
    freq = {desc: (df[NEW_COLUMN_NAME] == desc).sum() for desc in group_descs}
    main_desc = max(freq.items(), key=lambda x: x[1])[0]
    for desc in group_descs:
        if desc != main_desc:
            mapping[desc] = main_desc
print(f"Mapping created for {len(mapping)} descriptions.")

# --- APPLY MAPPING ---
print("Applying mapping to DataFrame...")
df[NEW_COLUMN_NAME] = df[NEW_COLUMN_NAME].map(lambda x: mapping.get(x, x))
print(f"Unique descriptions after mapping: {df[NEW_COLUMN_NAME].nunique()}")

# --- OUTPUT ---
print(f"Saving output CSV: {OUTPUT_CSV}")
df.to_csv(OUTPUT_CSV, index=False)
print(f"Saving mapping CSV: {MAPPING_CSV}")
with open(MAPPING_CSV, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['original', 'consolidated'])
    for old, new in mapping.items():
        writer.writerow([old, new])

print(f"Done! Final consolidated CSV: {OUTPUT_CSV}")
print(f"Mapping file: {MAPPING_CSV}")
print(f"Unique descriptions reduced from {len(descriptions)} to {df[NEW_COLUMN_NAME].nunique()}")