#!/usr/bin/env python3
"""Comprehensive fix for clients-view.tsx"""

import re
from pathlib import Path

def fix_clients_view():
    filepath = Path('/Users/prueba/Desktop/Projects/NMS/src/components/modules/clients-view.tsx')

    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Remove duplicate groupsLastFetch line
    content = re.sub(
        r"  const \[groupsLastFetch, setGroupsLastFetch\] = useState\(0\)\n(  const \[groupsLastFetch, setGroupsLastFetch\] = useState\(0\))",
        r"  const [groupsLastFetch, setGroupsLastFetch] = useState(0)",
        content
    )

    # 2. Add deletingId state after loading state
    content = re.sub(
        r"(  const \[loading, setLoading\] = useState\(true\))",
        r"\1\n  const [deletingId, setDeletingId] = useState<string | null>(null)",
        content
    )

    # 3. Fix the orphaned client references - they should be inside ClientTableRow
    # Find the problematic block (statusConfig, schedulePreview, classesUsed, etc.)
    # and remove it since it's orphaned outside the component
    orphaned_block = r"""  const statusConfig = getPaymentStatusConfig\(
    client\.currentSubscription\?\.status \|\| 'PENDIENTE'
  \)

  const schedulePreview = useMemo\(\(\) => \{
    if \(client\.preferredDays && client\.preferredTime\) \{
      const days = client\.preferredDays\.split\(','\)\.slice\(0, 2\)\.join\(', '\)
      return `\$\{days\} \$\{client\.preferredTime\}`
    \}
    return null
  \}, \[client\.preferredDays, client\.preferredTime\]\)

  const classesUsed = client\.currentSubscription\?\.classesUsed \|\| 0
  const classesTotal = client\.currentSubscription\?\.classesTotal \|\| 4
  const progressPercent = useMemo\(\(\) => \(classesUsed / classesTotal\) \* 100, 0\)

  const initials = `\$\{client\.nombre\[0\]\}\$\{client\.apellido\[0\]\}`

"""

    content = re.sub(orphaned_block, "", content)

    # 4. Fix the ClientTableRow component definition
    # Replace the malformed component with correct one
    old_component = r"""  const ClientTableRow = memo\(function ClientTableRow\(\{ 
    client: Client,
    groups: Group\[\],
    index: number,
    onClientClick: \(client: Client\) => void,
    onGroupChange: \(clientId: string, grupoId: string \|\| null\) => void,
    onDelete: \(id: string\) => void,
  \}: JSX\.Element => \{"""

    new_component = """  const ClientTableRow = memo(function ClientTableRow({
    client,
    groups,
    index,
    onClientClick,
    onGroupChange,
    onDelete,
    deletingId,
  }: {
    client: Client
    groups: Group[]
    index: number
    onClientClick: (client: Client) => void
    onGroupChange: (clientId: string, grupoId: string | null) => void
    onDelete: (id: string) => void
    deletingId: string | null
  }) {"""

    content = re.sub(old_component, new_component, content)

    # 5. Add motion import if not present
    if 'from "framer-motion"' not in content and 'framer-motion' not in content:
        content = re.sub(
            r"(from 'react'\n)",
            r"\1import { motion } from 'framer-motion'\n",
            content
        )

    # 6. Add the computed values inside ClientTableRow (after props)
    # Find the start of the component body and add these
    client_row_body_start = r"""  const ClientTableRow = memo\(function ClientTableRow\(\{
    client,
    groups,
    index,
    onClientClick,
    onGroupChange,
    onDelete,
    deletingId,
  \}: \{
    client: Client
    groups: Group\[\]
    index: number
    onClientClick: \(client: Client\) => void
    onGroupChange: \(clientId: string, grupoId: string \|\| null\) => void
    onDelete: \(id: string\) => void
    deletingId: string \|\| null
  \}\) \{"""

    replacement = client_row_body_start + """
    const statusConfig = getPaymentStatusConfig(
      client.currentSubscription?.status || 'PENDIENTE'
    )

    const schedulePreview = useMemo(() => {
      if (client.preferredDays && client.preferredTime) {
        const days = client.preferredDays.split(',').slice(0, 2).join(', ')
        return `${days} ${client.preferredTime}`
      }
      return null
    }, [client.preferredDays, client.preferredTime])

    const classesUsed = client.currentSubscription?.classesUsed || 0
    const classesTotal = client.currentSubscription?.classesTotal || 4
    const progressPercent = useMemo(() => (classesUsed / classesTotal) * 100, [classesUsed, classesTotal])

    const initials = `${client.nombre[0]}${client.apellido[0]}`"""

    content = re.sub(client_row_body_start, replacement, content)

    # 7. Fix the table body rendering with proper ClientTableRow usage
    # Find the problematic section where ClientTableRow is used incorrectly
    bad_map = r"""            <TableBody>
              \{loading \? \(
                <TableRow
                  key=\{client\.id\}
                  client=\{client\}
                  groups=\{groups\}
                  index=\{index\}
                  onClientClick=\{handleClientClick\}
                  onGroupChange=\{\(grupoId\) => onGroupChange\(client\.id, grupoId\)\}
                  onDelete=\{\(id\) => handleDelete\(id\)\}
                  deletingId=\{deletingId === client\.id\}
                />
              \)\)
              : clients\.length === 0 \? \("""

    content = re.sub(bad_map, """            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (""", content)

    # Write back
    with open(filepath, 'w') as f:
        f.write(content)

    print("✓ File fixed comprehensively")

if __name__ == '__main__':
    fix_clients_view()
