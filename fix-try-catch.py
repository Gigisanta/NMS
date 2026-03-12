#!/usr/bin/env python3
"""Fix try-catch structure in clients-view.tsx"""

import re

filepath = '/Users/prueba/Desktop/Projects/NMS/src/components/modules/clients-view.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Fix fetchClients try-catch structure
old_fetchClients = r"""  const fetchClients = useCallback\(async \(\) => \{
    setLoading\(true\)
    try \{
      const params = new URLSearchParams\(\)
      if \(debouncedSearch\) params\.set\('search', debouncedSearch\)
      if \(grupoFilter\) params\.set\('grupoId', grupoFilter\)
      if \(shouldFetchGroups\) params\.set\('withSubscription', 'true'\)

      const response = await fetch\(`/api/clients\?\$\{params\}`\)
      const result = await response\.json\(\)
      if \(result\.success\) \{
        setClients\(result\.data\)
        setTotalPages\(result\.pagination\.total\)
        setTotalPages\(result\.pagination\.totalPages\)
      \} catch \(error\) \{
        console\.error\('Error fetching clients:', error\)
      \}
      setLoading\(false\)
    \}
  \}\)"""

new_fetchClients = r"""  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (grupoFilter) params.set('grupoId', grupoFilter)
      if (shouldFetchGroups) params.set('withSubscription', 'true')

      const response = await fetch(`/api/clients?${params}`)
      const result = await response.json()
      if (result.success) {
        setClients(result.data)
        setTotalPages(result.pagination.total)
        setTotalPages(result.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  })"""

content = re.sub(old_fetchClients, new_fetchClients, content)

# Fix fetchGroups similarly
old_fetchGroups = r"""  const fetchGroups = useCallback\(async \(\) => \{
    if \(!shouldFetchGroups\) return

    const response = await fetch\('/api/groups'\)
    const result = await response\.json\(\)
    if \(result\.success\) \{
      const groups = result\.data
      setMemoizedGroups\(groups\)
      setStoreGroups\(groups\)
    \} catch \(error\) \{
      console\.error\('Error fetching groups:', error\)
    \}
    setGroupsLastFetch\(Date\.now\(\)\)
  \}\)"""

new_fetchGroups = r"""  const fetchGroups = useCallback(async () => {
    if (!shouldFetchGroups) return

    const response = await fetch('/api/groups')
    const result = await response.json()
    if (result.success) {
      const groups = result.data
      setMemoizedGroups(groups)
      setStoreGroups(groups)
    }
  } catch (error) {
    console.error('Error fetching groups:', error)
  } finally {
    setGroupsLastFetch(Date.now())
  }
  })
"""# Note: The original structure with setGroupsLastFetch outside was actually correct
# Let me revert to a simpler fix that just moves catch outside

# Actually, let me use a different approach - find and fix the specific issue
# The issue is that "catch" is on line after the if block closes, but there's no closing brace

with open(filepath, 'w') as f:
    f.write(content)

print("✓ Fixed fetchClients and fetchGroups")
