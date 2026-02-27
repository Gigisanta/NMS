#!/usr/bin/env python3
"""Fix clients-view.tsx specific issues"""

from pathlib import Path

def fix_clients_view():
    filepath = Path('/Users/prueba/Desktop/Projects/NMS/src/components/modules/clients-view.tsx')

    # Read file
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    fixed_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Add groupsLastFetch state after line with useAppStore
        if 'const [storeGroups, setStoreGroups] = useAppStore((state) => state.groups)' in line:
            fixed_lines.append(line)
            # Add groupsLastFetch state
            fixed_lines.append('  const [groupsLastFetch, setGroupsLastFetch] = useState(0)\n')
            # Remove the bad shouldFetchGroups line that comes next
            if i + 1 < len(lines) and 'const [shouldFetchGroups, setShouldFetchGroups] = useMemo' in lines[i + 1]:
                i += 1  # Skip the bad line
        # Fix the incomplete shouldFetchGroups declaration
        elif 'const shouldFetchGroups = useMemo(() => Date.now() - groupsLastFetch > 5 * 60 * 1000 || 0' in line and not '[groupsLastFetch]' in line:
            # This is the incomplete/duplicate line - fix it
            fixed_lines.append('  const shouldFetchGroups = useMemo(() => Date.now() - groupsLastFetch > 5 * 60 * 1000, [groupsLastFetch])\n')
        # Fix setShouldFetchGroups to setGroupsLastFetch
        elif 'setShouldFetchGroups(Date.now())' in line:
            fixed_lines.append(line.replace('setShouldFetchGroups(Date.now())', 'setGroupsLastFetch(Date.now())'))
        # Skip duplicate declarations that are now fixed
        elif 'const [shouldFetchGroups, setShouldFetchGroups] = useMemo' in line:
            # Skip this line, it's the bad one
            pass
        else:
            fixed_lines.append(line)

        i += 1

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)

    print(f"✓ Fixed {filepath.name}")

if __name__ == '__main__':
    fix_clients_view()
