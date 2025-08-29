import csv
import re
from collections import defaultdict

def normalize_venue_name(name):
    """Standardize venue name formatting"""
    # Remove extra spaces and standardize case
    name = re.sub(r'\s+', ' ', name.strip())
    
    # First, fix any existing incorrect apostrophe capitalization
    # This fixes cases like "Producer'S Club" -> "Producer's Club"
    name = re.sub(r"'([A-Z])", lambda m: f"'{m.group(1).lower()}", name)
    
    # Title case for venue names, but preserve common abbreviations
    words = name.split()
    normalized_words = []
    
    for i, word in enumerate(words):
        # Preserve common abbreviations and special cases
        if word.upper() in ['BK', 'LES', 'NYC', 'USA']:
            normalized_words.append(word.upper())
        elif word.lower() in ['of', 'the', 'and', 'or', 'in', 'at', 'on'] and i > 0:
            normalized_words.append(word.lower())
        else:
            # Handle words with apostrophes carefully
            if "'" in word:
                # Split by apostrophe and handle each part
                parts = word.split("'")
                normalized_parts = []
                for j, part in enumerate(parts):
                    if j == 0:  # First part gets title case
                        normalized_parts.append(part.title())
                    else:  # Parts after apostrophe should be lowercase
                        normalized_parts.append(part.lower())
                normalized_words.append("'".join(normalized_parts))
            else:
                # Title case for other words
                normalized_words.append(word.title())
    
    return ' '.join(normalized_words)

def normalize_address(addr):
    """Standardize address formatting"""
    addr = addr.strip()
    
    # Remove trailing ", USA" if present
    if addr.endswith(', USA'):
        addr = addr[:-5].strip()
    
    # Standardize spacing
    addr = re.sub(r'\s+', ' ', addr)
    
    # Title case for address components
    addr = addr.title()
    
    # Fix ordinal numbers (1st, 2nd, 3rd, 4th, etc.)
    addr = re.sub(r'\b(\d+)(St|Nd|Rd|Th)\b', lambda m: m.group(1) + m.group(2).lower(), addr)
    
    # Preserve state abbreviations
    addr = re.sub(r'\b(Ny|Ny)\b', 'NY', addr)
    addr = re.sub(r'\b(Pa|Pa)\b', 'PA', addr)
    
    # Preserve street abbreviations
    addr = re.sub(r'\b(St|St)\b', 'St', addr)
    addr = re.sub(r'\b(Ave|Ave)\b', 'Ave', addr)
    addr = re.sub(r'\b(Rd|Rd)\b', 'Rd', addr)
    
    return addr

def fix_csv_normalization():
    """Fix normalization issues in the current coordinates_fixed.csv file"""
    input_file = 'coordinates_fixed.csv'
    output_file = 'coordinates_fixed_cleaned.csv'
    
    # Read all rows and group by normalized venue+address
    groups = defaultdict(list)
    
    with open(input_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        fieldnames = reader.fieldnames or []
        
        for row in reader:
            venue = row.get('Venue Name', '')
            address = row.get('Location', '')
            norm_venue = normalize_venue_name(venue)
            norm_addr = normalize_address(address)
            key = (norm_venue, norm_addr)
            groups[key].append(row)
    
    # Write fixed CSV with standardized names
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for (norm_venue, norm_addr), rows in groups.items():
            for row in rows:
                # Update the venue name and address to normalized versions
                row['Venue Name'] = norm_venue
                row['Location'] = norm_addr
                writer.writerow(row)
    
    print(f"Fixed CSV saved as {output_file}")
    print(f"Processed {len(groups)} unique venue/address combinations")

if __name__ == "__main__":
    fix_csv_normalization()
