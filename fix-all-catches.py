#!/usr/bin/env python3
"""Fix all catch blocks by inserting missing closing braces"""

import re

filepath = '/Users/prueba/Desktop/Projects/NMS/src/components/modules/clients-view.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Pattern: find "} catch" but ensure it's preceded by a closing brace for an if block
# The issue is when we have "if (...) { ... } catch" instead of "if (...) { ... } } catch"

# Fix fetchGroups - add closing brace before catch
content = re.sub(
    r"(setStoreGroups\(groups\)\n)(    } catch \(error\))",
    r"\1    }\n\2",
    content
)

# Fix handleDelete - add closing brace before catch
content = re.sub(
    r"(setDeletingId\(null\)\n)(      } catch \(error\))",
    r"\1      }\n\2",
    content
)

with open(filepath, 'w') as f:
    f.write(content)

print("✓ Fixed catch blocks")
