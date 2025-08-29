#!/usr/bin/env python3
"""
Venue Capitalization Fixer
Scans Google Sheets CSV for venue name capitalization issues and suggests fixes.
"""

import csv
import sys
import requests
from collections import defaultdict
import re

# Canonical venue mappings (matches the JavaScript version)
CANONICAL_VENUES = {
    'west side comedy club': 'West Side Comedy Club',
    # 'the tiny cupboard': 'The Tiny Cupboard', # COMMENTED OUT
    'greenwich village comedy club': 'Greenwich Village Comedy Club',
    'comedy shop': 'Comedy Shop',
    'broadway comedy club': 'Broadway Comedy Club',
    'qed astoria': 'QED Astoria',
    'the stand nyc': 'The Stand NYC',
    'bushwick comedy club': 'Bushwick Comedy Club',
    'stand up ny': 'Stand Up NY',
    'gotham comedy club': 'Gotham Comedy Club',
    'caroline\'s on broadway': 'Caroline\'s on Broadway',
    'comedy cellar': 'Comedy Cellar',
    'fat black pussycat': 'Fat Black Pussycat',
    'the bell house': 'The Bell House',
    'union hall': 'Union Hall',
    'littlefield': 'Littlefield',
    'brooklyn comedy collective': 'Brooklyn Comedy Collective',
    'creek and the cave': 'Creek and the Cave',
    'the creek and the cave': 'Creek and the Cave',
    'eastville comedy club': 'Eastville Comedy Club',
    'laughing buddha': 'Laughing Buddha',
    'the laughing buddha': 'Laughing Buddha',
    'new york comedy club': 'New York Comedy Club',
    'comedy cellar village underground': 'Comedy Cellar Village Underground',
    'comedy cellar macdougal': 'Comedy Cellar MacDougal',
    'the stand comedy club': 'The Stand Comedy Club',
    'stand comedy club': 'The Stand Comedy Club',
    'ucb east': 'UCB East',
    'ucb west': 'UCB West',
    'ucb chelsea': 'UCB Chelsea',
    'upright citizens brigade': 'Upright Citizens Brigade',
    'the pit': 'The PIT',
    'pit': 'The PIT',
    'magnet theater': 'Magnet Theater',
    'annoyance theatre': 'Annoyance Theatre',
    'annoyance theater': 'Annoyance Theatre',
    'the annoyance': 'Annoyance Theatre',
    'asylum nyc': 'Asylum NYC',
    'the asylum': 'Asylum NYC',
    'people\'s improv theater': 'People\'s Improv Theater',
    'the peoples improv theater': 'People\'s Improv Theater',
    'pit peoples improv theater': 'People\'s Improv Theater',
    'st marks comedy club': 'St. Marks Comedy Club',
    'st. marks comedy club': 'St. Marks Comedy Club',
    'saint marks comedy club': 'St. Marks Comedy Club',
    'the comedy store': 'The Comedy Store',
    'comedy store': 'The Comedy Store',
    'laugh factory': 'Laugh Factory',
    'the laugh factory': 'Laugh Factory',
    'improv': 'The Improv',
    'the improv': 'The Improv',
    'comedy works': 'Comedy Works',
    'the comedy works': 'Comedy Works',
}

def normalize_venue_name(name):
    """Normalize venue name for comparison (matches JavaScript logic)"""
    if not name:
        return ''
    normalized = name.strip()
    key = normalized.lower().replace('the ', '', 1)
    return CANONICAL_VENUES.get(key, normalized)

def analyze_venue_capitalization(csv_data):
    """Analyze venue names for capitalization issues"""
    venue_issues = []
    venue_counts = defaultdict(int)
    
    for row_num, row in enumerate(csv_data, 1):
        venue_name = row.get('Venue Name', '').strip()
        if not venue_name:
            continue
            
        venue_counts[venue_name] += 1
        
        # Check if this venue has capitalization issues
        normalized = normalize_venue_name(venue_name)
        if normalized != venue_name:
            venue_issues.append({
                'row': row_num,
                'original': venue_name,
                'suggested': normalized,
                'day': row.get('Day', ''),
                'time': row.get('Start Time', '')
            })
    
    return venue_issues, venue_counts

def print_analysis(venue_issues, venue_counts):
    """Print the analysis results"""
    print("=" * 80)
    print("VENUE CAPITALIZATION ANALYSIS")
    print("=" * 80)
    
    if not venue_issues:
        print("✅ No capitalization issues found!")
        print("All venue names are properly capitalized.")
        return
    
    print(f"❌ Found {len(venue_issues)} rows with capitalization issues:")
    print()
    
    # Group by venue name
    issues_by_venue = defaultdict(list)
    for issue in venue_issues:
        issues_by_venue[issue['original']].append(issue)
    
    for original_name, issues in issues_by_venue.items():
        suggested_name = issues[0]['suggested']
        print(f"📝 Venue: '{original_name}'")
        print(f"   → Should be: '{suggested_name}'")
        print(f"   → Found in {len(issues)} rows:")
        
        for issue in issues:
            print(f"      Row {issue['row']}: {issue['day']} at {issue['time']}")
        print()
    
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total unique venues: {len(venue_counts)}")
    print(f"Venues with issues: {len(issues_by_venue)}")
    print(f"Total rows with issues: {len(venue_issues)}")
    print()
    
    print("To fix these issues:")
    print("1. Update your Google Sheet with the suggested names")
    print("2. Or add the variations to the CANONICAL_VENUES mapping in js/utils.js")
    print("3. The app will automatically correct them using the normalization function")

def generate_fix_suggestions(venue_issues):
    """Generate suggestions for fixing the issues"""
    if not venue_issues:
        return
    
    print("=" * 80)
    print("FIX SUGGESTIONS")
    print("=" * 80)
    
    # Group by suggested name
    fixes_needed = defaultdict(list)
    for issue in venue_issues:
        fixes_needed[issue['suggested']].append(issue['original'])
    
    print("Add these mappings to js/utils.js CANONICAL_VENUE_MAP:")
    print()
    
    for canonical, variations in fixes_needed.items():
        for variation in set(variations):  # Remove duplicates
            if variation.lower() != canonical.lower():
                print(f"    '{variation.lower()}': '{canonical}',")
    
    print()
    print("Or update your Google Sheet to use these exact names:")
    for canonical in sorted(fixes_needed.keys()):
        print(f"    '{canonical}'")

def main():
    if len(sys.argv) != 2:
        print("Usage: python fix_capitalization.py <google_sheets_csv_url>")
        print("Example: python fix_capitalization.py 'https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv'")
        sys.exit(1)
    
    url = sys.argv[1]
    
    try:
        print(f"Fetching data from: {url}")
        response = requests.get(url)
        response.raise_for_status()
        
        # Parse CSV
        csv_text = response.text
        csv_data = list(csv.DictReader(csv_text.splitlines()))
        
        print(f"✅ Loaded {len(csv_data)} rows from Google Sheets")
        print()
        
        # Analyze capitalization
        venue_issues, venue_counts = analyze_venue_capitalization(csv_data)
        
        # Print results
        print_analysis(venue_issues, venue_counts)
        generate_fix_suggestions(venue_issues)
        
    except requests.RequestException as e:
        print(f"❌ Error fetching data: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error processing data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 