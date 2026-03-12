#!/usr/bin/env python3
"""Remove all consecutive duplicate lines from clients-view.tsx"""

filepath = '/Users/prueba/Desktop/Projects/NMS/src/components/modules/clients-view.tsx'

with open(filepath, 'r') as f:
    lines = f.readlines()

# Remove consecutive duplicates (keeping first occurrence)
new_lines = []
prev_line = None

for line in lines:
    if line != prev_line:
        new_lines.append(line)
        prev_line = line

with open(filepath, 'w') as f:
    f.writelines(new_lines)

original_count = len(lines)
new_count = len(new_lines)
removed = original_count - new_count

print(f"✓ Removed {removed} consecutive duplicate lines")
print(f"  Original: {original_count} lines")
print(f"  After: {new_count} lines")
