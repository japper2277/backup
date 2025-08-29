#!/usr/bin/env python3
"""
Fix capitalization issues in local CSV file
"""

import csv
import re

def fix_venue_capitalization(name):
    """Fix common capitalization issues"""
    if not name:
        return name
    
    # Fix apostrophe issues like "Producer'S Club" -> "Producer's Club"
    # Only fix if the letter after apostrophe is uppercase and not part of a contraction
    name = re.sub(r"'([A-Z])(?!\w)", lambda m: f"'{m.group(1).lower()}", name)
    
    # Title case but preserve common abbreviations
    words = name.split()
    fixed_words = []
    
    for i, word in enumerate(words):
        if word.upper() in ['BK', 'LES', 'NYC', 'USA', 'UCB', 'PIT']:
            fixed_words.append(word.upper())
        elif word.lower() in ['of', 'the', 'and', 'or', 'in', 'at', 'on'] and i > 0:
            fixed_words.append(word.lower())
        else:
            fixed_words.append(word.title())
    
    return ' '.join(fixed_words)

def fix_csv():
    """Fix the local CSV file"""
    input_file = 'coordinates_new_8_11.csv'
    
    # Read the file
    with open(input_file, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        rows = list(reader)
        fieldnames = reader.fieldnames
    
    print(f"Processing {len(rows)} rows...")
    
    # Fix venue names
    fixed_count = 0
    for row in rows:
        original_venue = row.get('Venue Name', '')
        if original_venue:
            fixed_venue = fix_venue_capitalization(original_venue)
            if fixed_venue != original_venue:
                print(f"Fixed: '{original_venue}' -> '{fixed_venue}'")
                row['Venue Name'] = fixed_venue
                fixed_count += 1
    
    # Write back to the same file
    with open(input_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n✅ Fixed {fixed_count} venue names in {input_file}")

if __name__ == "__main__":
    fix_csv()
