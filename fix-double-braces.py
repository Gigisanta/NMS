#!/usr/bin/env python3
"""Fix specific line with double closing braces"""

filepath = '/Users/prueba/Desktop/Projects/NMS/src/components/modules/clients-view.tsx'

with open(filepath, 'r') as f:
    lines = f.readlines()

# Fix line 81 (index 80)
if len(lines) > 80:
    lines[80] = lines[80].replace('    }    } catch', '    } catch')
    print(f"Fixed line 81: {lines[80].strip()}")

# Fix handleDelete around line 119-121
if len(lines) > 118:
    for i in range(118, min(122, len(lines))):
        if '    } catch' in lines[i] and 'setDeletingId' in lines[i-1]:
            # Check if there's a double closing brace
            if lines[i].startswith('      }    } catch'):
                lines[i] = lines[i].replace('      }    } catch', '      } catch')
                print(f"Fixed line {i+1}: {lines[i].strip()}")

with open(filepath, 'w') as f:
    f.writelines(lines)

print("✓ Fixed double closing braces")
