#!/usr/bin/env python3
"""Fix specific line with double closing braces"""

filepath = 'src/components/modules/clients-view.tsx'

with open(filepath, 'r') as f:
    lines = f.readlines()

# Fix double closing braces around line 81
if len(lines) > 75:
    for i in range(75, min(85, len(lines))):
        if '    }    } catch' in lines[i]:
            lines[i] = lines[i].replace('    }    } catch', '    } catch')
            print(f"Fixed line {i+1}: {lines[i].strip()}")

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
