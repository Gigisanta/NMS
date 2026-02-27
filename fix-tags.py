#!/usr/bin/env python3
"""Fix corrupted TSX files by removing line tags"""

import re
from pathlib import Path

# Pattern to match line tags like #BR|, #KM|, #ZN|, etc.
TAG_PATTERN = re.compile(r'^#[A-Z]+\|')

def fix_file(filepath: Path):
    """Remove line tags from a file"""
    print(f"Processing {filepath}...")

    # Read file
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Process each line
    cleaned_lines = []
    for line in lines:
        # Remove the tag prefix
        cleaned = TAG_PATTERN.sub('', line)
        cleaned_lines.append(cleaned)

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(cleaned_lines)

    print(f"  ✓ Fixed {len(lines)} lines")

def main():
    """Fix all TSX files in components/modules"""
    base_dir = Path('/Users/prueba/Desktop/Projects/NMS/src/components/modules')

    # Find all TSX files
    tsx_files = list(base_dir.glob('*.tsx'))

    if not tsx_files:
        print("No TSX files found")
        return

    print(f"Found {len(tsx_files)} TSX files to fix\n")

    for file_path in tsx_files:
        try:
            fix_file(file_path)
        except Exception as e:
            print(f"  ✗ Error: {e}\n")

    print("\n✓ All files processed!")

if __name__ == '__main__':
    main()
