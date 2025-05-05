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
df = pd.read_csv(INPUT_CSV)
if COLUMN_NAME not in df.columns:
    raise ValueError("Missing 'tool_description_1' column in input.")

# --- NORMALIZE DESCRIPTIONS ---
def normalize(desc):
    if not isinstance(desc, str):
        return ""
    desc = desc.lower()
    desc = desc.translate(str.maketrans('', '', string.punctuation))
    desc = re.sub(r'\s+', ' ', desc).strip()
    return desc

df[NEW_COLUMN_NAME] = df[COLUMN_NAME].apply(normalize)
descriptions = df[NEW_COLUMN_NAME].unique().tolist()
descriptions = [d for d in descriptions if d.strip()]

# --- GET EMBEDDINGS ---
client = OpenAI(api_key=OPENAI_API_KEY)

def get_embeddings(texts, batch_size=500):
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        try:
            response = client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=batch
            )
            batch_embeddings = [e.embedding for e in response.data]
            embeddings.extend(batch_embeddings)
            # time.sleep(1)  # Only sleep if you hit rate limits
        except Exception as e:
            print(f"Embedding error: {e}")
            embeddings.extend([[0]*EMBEDDING_DIM]*len(batch))
            time.sleep(5)
    return np.array(embeddings)

print("Getting embeddings...")
embeddings = get_embeddings(descriptions)
embeddings = np.nan_to_num(embeddings)

# --- GROUP BY EMBEDDING SIMILARITY ---
def group_by_embeddings(embeddings, descriptions, threshold):
    groups = []
    used = set()
    for i, emb in enumerate(embeddings):
        if i in used:
            continue
        group = [i]
        for j in range(i+1, len(embeddings)):
            if j in used:
                continue
            sim = cosine_similarity([emb], [embeddings[j]])[0][0]
            if sim >= threshold:
                group.append(j)
                used.add(j)
        used.add(i)
        groups.append(group)
    return groups

print("Grouping by embeddings...")
groups = group_by_embeddings(embeddings, descriptions, EMBEDDING_THRESHOLD)

# --- FALLBACK: FUZZY GROUPING FOR LEFTOVERS ---
grouped_indices = set(idx for group in groups for idx in group)
leftover_indices = [i for i in range(len(descriptions)) if i not in grouped_indices]

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

# --- CREATE MAPPING ---
mapping = {}
for group in groups:
    group_descs = [descriptions[i] for i in group]
    # Pick the most frequent in the original data
    freq = {desc: (df[NEW_COLUMN_NAME] == desc).sum() for desc in group_descs}
    main_desc = max(freq.items(), key=lambda x: x[1])[0]
    for desc in group_descs:
        if desc != main_desc:
            mapping[desc] = main_desc

# --- APPLY MAPPING ---
df[NEW_COLUMN_NAME] = df[NEW_COLUMN_NAME].map(lambda x: mapping.get(x, x))

# --- OUTPUT ---
df.to_csv(OUTPUT_CSV, index=False)
with open(MAPPING_CSV, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['original', 'consolidated'])
    for old, new in mapping.items():
        writer.writerow([old, new])

print(f"Done! Final consolidated CSV: {OUTPUT_CSV}")
print(f"Mapping file: {MAPPING_CSV}")
print(f"Unique descriptions reduced from {len(descriptions)} to {df[NEW_COLUMN_NAME].nunique()}")