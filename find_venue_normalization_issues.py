import csv
import sys
import requests
from collections import defaultdict
import re

# List of canonical venue names (add more as needed)
CANONICAL_VENUES = [
    'West Side Comedy Club',
    # 'The Tiny Cupboard', # COMMENTED OUT
    'Greenwich Village Comedy Club',
    'Comedy Shop',
    'Broadway Comedy Club',
    'QED Astoria',
    'The Stand NYC',
    'Bushwick Comedy Club',
    # Add more canonical names here
]

# Normalize for comparison (lowercase, strip, remove 'the', remove punctuation)
def normalize(name):
    name = name.strip().lower()
    name = re.sub(r'^the ', '', name)
    name = re.sub(r'[^a-z0-9 ]', '', name)
    return name

def main():
    if len(sys.argv) < 2:
        print("Usage: python find_venue_normalization_issues.py <csv_url>")
        sys.exit(1)
    csv_url = sys.argv[1]
    print(f"Fetching CSV from: {csv_url}")
    r = requests.get(csv_url)
    r.raise_for_status()
    lines = r.text.splitlines()
    reader = csv.DictReader(lines)
    venues = defaultdict(list)
    for row in reader:
        venue = row.get('Venue') or row.get('Venue Name') or row.get('venue') or row.get('venueName')
        if venue:
            venues[normalize(venue)].append(venue)
    print("\nUnique venue name variants found:")
    for norm, variants in venues.items():
        unique_variants = set(variants)
        if len(unique_variants) > 1:
            print(f"\n[!] Inconsistent variants for '{norm}':")
            for v in unique_variants:
                print(f"   - {v}")
        else:
            print(f"   {list(unique_variants)[0]}")
    # Suggest canonical names for known venues
    print("\nSuggestions for canonicalization:")
    for canon in CANONICAL_VENUES:
        norm = normalize(canon)
        if norm in venues:
            found = set(venues[norm])
            if canon not in found:
                print(f"[!] For '{canon}', found variants: {found}. Suggest replacing all with '{canon}'")

if __name__ == "__main__":
    main() 